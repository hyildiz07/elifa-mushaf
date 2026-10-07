// Research only. Search wider than QUL's fixed 200 ms verse gap on the exact
// QDC MP3. Quiet PCM is a review cue, never proof of a safe phoneme cut.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {MPEGDecoderWebWorker} from 'mpg123-decoder';

async function energyTrace(file){
  const decoder=new MPEGDecoderWebWorker();
  const power=[],counts=[];
  let rate=0,total=0;
  try{
    await decoder.ready;
    for await(const chunk of fs.createReadStream(file,{highWaterMark:32768})){
      const decoded=await decoder.decode(new Uint8Array(chunk));
      if(decoded.errors?.length)throw Error(`Decode failed: ${file}`);
      if(!decoded.samplesDecoded)continue;
      if(!rate)rate=decoded.sampleRate;
      if(rate!==decoded.sampleRate)throw Error('Sample rate changed');
      for(let i=0;i<decoded.samplesDecoded;i++){
        const bin=Math.floor((total+i)*100/rate);
        let p=0;
        for(const channel of decoded.channelData)p=Math.max(p,channel[i]*channel[i]);
        power[bin]=(power[bin]||0)+p;counts[bin]=(counts[bin]||0)+1;
      }
      total+=decoded.samplesDecoded;
    }
  }finally{await decoder.free();}
  return {durationMs:total/rate*1000,rms:power.map((sum,i)=>Math.sqrt(sum/counts[i]))};
}

function scan(levels,centerMs,radiusMs,thresholdMode='strict'){
  const center=Math.round(centerMs/10),radius=Math.round(radiusMs/10);
  const lo=Math.max(0,center-radius),hi=Math.min(levels.length,center+radius);
  const context=levels.slice(Math.max(0,lo-50),Math.min(levels.length,hi+50));
  const peak=Math.max(...context);
  const threshold=thresholdMode==='relative-low-energy'?Math.min(.03,peak*.1):Math.min(.002,peak*.015);
  let start=-1,best=null;
  for(let i=lo;i<=hi;i++){
    if(i<hi&&levels[i]<=threshold){if(start<0)start=i;continue;}
    if(start>=0){
      const durationMs=(i-start)*10,midpointMs=(start+i)*5;
      const candidate={fromMs:start*10,toMs:i*10,midpointMs,durationMs,
        distanceFromMetadataCenterMs:Math.round(midpointMs-centerMs)};
      if(!best||durationMs>best.durationMs||
          durationMs===best.durationMs&&Math.abs(candidate.distanceFromMetadataCenterMs)<Math.abs(best.distanceFromMetadataCenterMs))best=candidate;
      start=-1;
    }
  }
  return {threshold,peak,best};
}

const report={status:'review-only-no-production-cut',method:'exact-QDC sequential PCM decode; 10 ms max-channel RMS; QUL boundary center ±500/1000 ms; strict quiet <=min(.002,1.5% peak), relative low energy <=min(.03,10% peak)',chapters:{}};
for(const [surah,total] of [[3,200],[4,176]]){
  const file=`test-results/sudais-qdc-${surah}.mp3`;
  const timing=JSON.parse(fs.readFileSync(`test-results/sudais-qul-timings-${surah}.json`,'utf8'));
  const trace=await energyTrace(file),rows=[];
  for(let ay=1;ay<total;ay++){
    const left=timing.segments[`${surah}:${ay}`],right=timing.segments[`${surah}:${ay+1}`];
    if(!left||!right)throw Error(`Missing ${surah}:${ay} or next`);
    const centerMs=(left.time_to+right.time_from)/2;
    rows.push({after:`${surah}:${ay}`,metadataCenterMs:centerMs,
      narrow:scan(trace.rms,centerMs,500),wide:scan(trace.rms,centerMs,1000),
      lowEnergyNarrow:scan(trace.rms,centerMs,500,'relative-low-energy'),
      lowEnergyWide:scan(trace.rms,centerMs,1000,'relative-low-energy')});
  }
  report.chapters[surah]={sourceSha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),
    pcmDurationMs:trace.durationMs,transitions:rows.length,
    narrowQuiet120:rows.filter(r=>r.narrow.best?.durationMs>=120).length,
    wideQuiet120:rows.filter(r=>r.wide.best?.durationMs>=120).length,
    lowEnergyNarrow120:rows.filter(r=>r.lowEnergyNarrow.best?.durationMs>=120).length,
    lowEnergyWide120:rows.filter(r=>r.lowEnergyWide.best?.durationMs>=120).length,
    rows};
  console.log(JSON.stringify({surah,transitions:rows.length,narrowQuiet120:report.chapters[surah].narrowQuiet120,
    wideQuiet120:report.chapters[surah].wideQuiet120,
    lowEnergyNarrow120:report.chapters[surah].lowEnergyNarrow120,
    lowEnergyWide120:report.chapters[surah].lowEnergyWide120}));
}
fs.writeFileSync('review/sudais-wide-quiet-screen-2026-09-30.json',JSON.stringify(report,null,2)+'\n');
