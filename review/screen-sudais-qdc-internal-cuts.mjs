// Review-only acoustic screening of the 429 source-and-structure candidates.
// Neither a quiet interval nor a metadata timestamp proves phoneme ownership.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {MPEGDecoderWebWorker} from 'mpg123-decoder';

const chapters=[3,4,5,28,29];
const triage=JSON.parse(fs.readFileSync('review/sudais-batch-structural-triage-2026-09-30.json'));
const source34=JSON.parse(fs.readFileSync('review/sudais-qdc-qul-verse-screen-2026-09-30.json'));
const source529=JSON.parse(fs.readFileSync('review/sudais-qdc-qul-5-28-29-identity-screen.json'));
const rmsBinMs=10;

async function trace(path){
  const decoder=new MPEGDecoderWebWorker(),power=[],counts=[];
  let rate=0,total=0;
  try{
    await decoder.ready;
    for await(const chunk of fs.createReadStream(path,{highWaterMark:32768})){
      const block=await decoder.decode(new Uint8Array(chunk));
      if(block.errors?.length)throw Error(`${path}: decoder error`);
      if(!block.samplesDecoded)continue;
      if(!rate)rate=block.sampleRate;
      if(rate!==block.sampleRate)throw Error(`${path}: sample rate changed`);
      for(let i=0;i<block.samplesDecoded;i++){
        const bin=Math.floor((total+i)*100/rate);
        let p=0;
        for(const channel of block.channelData)p=Math.max(p,channel[i]*channel[i]);
        power[bin]=(power[bin]||0)+p;
        counts[bin]=(counts[bin]||0)+1;
      }
      total+=block.samplesDecoded;
    }
  }finally{await decoder.free();}
  return {durationMs:total/rate*1000,rms:power.map((p,i)=>Math.sqrt(p/counts[i]))};
}

function bestQuiet(levels,centerMs,threshold,spanMs=150){
  const center=Math.round(centerMs/rmsBinMs),radius=spanMs/rmsBinMs;
  const lo=Math.max(0,center-radius),hi=Math.min(levels.length,center+radius+1);
  let best=null,begin=-1;
  for(let i=lo;i<=hi;i++){
    if(i<hi&&levels[i]<=threshold){if(begin<0)begin=i;continue;}
    if(begin<0)continue;
    const durationMs=(i-begin)*rmsBinMs;
    const midpointMs=(begin+i)*rmsBinMs/2;
    const row={fromMs:begin*rmsBinMs,toMs:i*rmsBinMs,durationMs,
      distanceMs:Math.round(midpointMs-centerMs)};
    if(!best||durationMs>best.durationMs||
      durationMs===best.durationMs&&Math.abs(row.distanceMs)<Math.abs(best.distanceMs))best=row;
    begin=-1;
  }
  return best;
}

const report={status:'review-only-zero-approved-cuts',method:'exact QDC sequential MP3 decode; 10 ms max-channel RMS; QUL word-gap center transferred only where 3 source anchors match; ±150 ms search; strict <=min(.002,1.5% local peak); low-energy <=min(.03,10% local peak)',
  caveat:'Quiet/low-energy PCM alone cannot prove a consonant is intact or that the adjacent word has not started; QUL word gaps are uniformly 0–50 ms.',chapters:{},knownCases:{}};
for(const surah of chapters){
  const path=`test-results/sudais-qdc-${surah}.mp3`;
  const digest=crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
  const identity=(surah===3||surah===4?source34:source529).chapters[surah];
  if(digest!==identity.qdcSha256)throw Error(`${surah}: exact QDC source SHA mismatch`);
  const timing=JSON.parse(fs.readFileSync(`test-results/sudais-qul-timings-${surah}.json`));
  const pcm=await trace(path),rows=[];
  for(const verse of triage.chapters[surah].rows.filter(row=>row.sourceAndStructureCandidate)){
    const ayah=Number(verse.key.split(':')[1]);
    const sourceRow=identity.rows[ayah-1];
    if(sourceRow.key!==verse.key)throw Error(`${verse.key}: identity order mismatch`);
    const anchors=sourceRow.anchors;
    const offset=surah===3||surah===4?0:anchors[0].offsetMs;
    if(anchors.length!==3||anchors.some(a=>a.correlation<.95)||
        (surah===3||surah===4?anchors.some(a=>a.shiftMs!==0):
          anchors.some(a=>a.offsetMs!==offset)||sourceRow.sameRecording!==true))
      throw Error(`${verse.key}: three-anchor source match changed`);
    const words=timing.segments[verse.key].segments;
    const cuts=[];
    for(let i=1;i<words.length;i++){
      const centerMs=(words[i-1][2]+words[i][1])/2+offset;
      if(centerMs<150||centerMs>pcm.durationMs-150)throw Error(`${verse.key}: cut outside PCM`);
      const centerBin=Math.round(centerMs/rmsBinMs);
      const context=pcm.rms.slice(centerBin-50,centerBin+51);
      const peak=Math.max(...context);
      const strictThreshold=Math.min(.002,peak*.015);
      const lowThreshold=Math.min(.03,peak*.1);
      const strict=bestQuiet(pcm.rms,centerMs,strictThreshold);
      const lowEnergy=bestQuiet(pcm.rms,centerMs,lowThreshold);
      cuts.push({afterWord:words[i-1][0],beforeWord:words[i][0],metadataGapMs:words[i][1]-words[i-1][2],
        nominalQdcMs:Math.round(centerMs),strict,lowEnergy,
        strictReviewCue:!!strict&&strict.durationMs>=80&&Math.abs(strict.distanceMs)<=75,
        lowEnergyReviewCue:!!lowEnergy&&lowEnergy.durationMs>=80&&Math.abs(lowEnergy.distanceMs)<=75});
    }
    rows.push({key:verse.key,sourceOffsetMs:offset,wordCount:words.length,cuts,
      strictReviewCues:cuts.filter(c=>c.strictReviewCue).length,
      lowEnergyReviewCues:cuts.filter(c=>c.lowEnergyReviewCue).length,approvedCuts:0});
  }
  const allCuts=rows.flatMap(r=>r.cuts);
  report.chapters[surah]={qdcSha256:digest,pcmDurationMs:pcm.durationMs,
    sourceStructureVerses:rows.length,internalWordBoundaries:allCuts.length,
    strictReviewCues:allCuts.filter(c=>c.strictReviewCue).length,
    lowEnergyReviewCues:allCuts.filter(c=>c.lowEnergyReviewCue).length,
    versesWithStrictCue:rows.filter(r=>r.strictReviewCues).length,
    versesWithLowEnergyCue:rows.filter(r=>r.lowEnergyReviewCues).length,
    approvedCuts:0,rows};
  console.log(JSON.stringify({surah,verses:rows.length,boundaries:allCuts.length,
    strictReviewCues:report.chapters[surah].strictReviewCues,
    lowEnergyReviewCues:report.chapters[surah].lowEnergyReviewCues}));
}
for(const key of ['3:160','4:143','5:5','5:46','5:82','28:44','29:35']){
  const [surah]=key.split(':');
  const row=report.chapters[surah].rows.find(r=>r.key===key);
  report.knownCases[key]=row?{screened:true,strictReviewCues:row.strictReviewCues,
    lowEnergyReviewCues:row.lowEnergyReviewCues,internalWordBoundaries:row.cuts.length}:
    {screened:false,reason:'failed source-and-structure gate; no internal cut screen'};
}
fs.writeFileSync('review/sudais-qdc-internal-cut-screen-2026-09-30.json',JSON.stringify(report,null,2)+'\n');
