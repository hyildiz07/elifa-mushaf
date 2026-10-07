// Read-only audit of the largest final-verse MP3/metadata mismatches.
// Uses the production source/metadata pair and actual Web Audio window preparation.
import {readFile,writeFile} from 'node:fs/promises';
import {prepareWindow,prepareSelectedRange} from '../src/split-audio.mjs';
import {getVerifiedVbrIndex} from '../src/mp3-seek.mjs';

const root=new URL('../',import.meta.url);
const corpus=JSON.parse(await readFile(new URL('test-results/final-verse-corpus-index.json',root)));
const sudaisCatalog=JSON.parse(await readFile(new URL('assets/sudais-vbr-index.json',root)));
const rows=corpus.rows.filter(row=>Number.isFinite(row.gapMs));
const over=rows.filter(row=>row.gapMs>0).sort((a,b)=>b.gapMs-a.gapMs);
const context={createBuffer(channels,length,sampleRate){
  const data=Array.from({length:channels},()=>new Float32Array(length));
  return {numberOfChannels:channels,length,sampleRate,duration:length/sampleRate,
    copyToChannel(source,ch){data[ch].set(source);},getChannelData(ch){return data[ch];}};
}};
const probes=[];
for(const row of over.filter(row=>row.gapMs>200&&row.gapMs<650)){
  const probe={reciter:row.reciter,chapter:row.chapter,verse:row.verse,
    rawGapMs:row.gapMs,source:row.source};
  let audio;
  try{
    const metadata=JSON.parse(await readFile(new URL(row.metadataPath,root)));
    const final=metadata.verse_timings.at(-1);
    const ay=Number(final.verse_key.split(':')[1]);
    audio={reciterId:row.reciter,sourceUrl:row.url,recordingUrl:row.url,
      verifiedCbr:!!metadata.source_recording,buffer:null,
      verseRanges:{[ay]:[final.timestamp_from,final.timestamp_to]},
      verseSegments:{[ay]:final.segments||[]}};
    if(row.indexKind==='verified-vbr')
      audio.cbrIndex=await getVerifiedVbrIndex(row.url,sudaisCatalog.rows[row.url]);
    const signal=AbortSignal.timeout(90000);
    const split=await prepareWindow(audio,ay,context,{signal,positions:[]});
    probe.split={lo:split.lo,hi:split.hi,finalTailRequestedEnd:split.finalTailRequestedEnd,
      coversPhysicalEnd:split.hi>=Math.min(final.timestamp_to,
        (audio.cbrIndex.frames*audio.cbrIndex.samples-audio.cbrIndex.trimSamples)/audio.cbrIndex.rate*1000)-40};
    const selected=await prepareSelectedRange(audio,final.timestamp_from,final.timestamp_to,context,{signal});
    probe.selected={lo:selected.lo,hi:selected.hi,finalTailRequestedEnd:selected.finalTailRequestedEnd};
    const index=audio.cbrIndex;
    probe.calibratedPhysicalEndMs=(index.frames*index.samples-index.trimSamples)/index.rate*1000;
    probe.calibratedGapMs=final.timestamp_to-probe.calibratedPhysicalEndMs;
  }catch(error){
    probe.error=String(error);
    if(audio?.cbrIndex){
      const index=audio.cbrIndex;
      probe.index={vbr:!!index.vbr,trimSamples:index.trimSamples,
        physicalEndMs:index.frames*index.samples/index.rate*1000,
        calibratedEndMs:Number.isFinite(index.trimSamples)?
          (index.frames*index.samples-index.trimSamples)/index.rate*1000:null};
    }
  }
  probes.push(probe);
  process.stderr.write(`${row.verse} reciter ${row.reciter}: ${probe.error||'split + selected prepared'}\n`);
}
const result={checkedAt:new Date().toISOString(),corpusRows:rows.length,
  metadataBeyondRawEnd:over.length,
  gapBands:{atMost25:over.filter(r=>r.gapMs<=25).length,
    over25to100:over.filter(r=>r.gapMs>25&&r.gapMs<=100).length,
    over100to200:over.filter(r=>r.gapMs>100&&r.gapMs<=200).length,
    over200to650:over.filter(r=>r.gapMs>200&&r.gapMs<=650).length,
    over650:over.filter(r=>r.gapMs>650).length},
  guardRequired:over.filter(r=>r.gapMs>650).map(r=>({reciter:r.reciter,chapter:r.chapter,verse:r.verse,rawGapMs:r.gapMs})),
  probes};
const out=new URL('test-results/v290-final-eof-playback.json',root);
await writeFile(out,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
