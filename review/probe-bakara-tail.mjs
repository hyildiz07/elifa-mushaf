import {getCbrIndex,getVerifiedVbrIndex,rangeForWindow,alignedRangeOffset} from '../src/mp3-seek.mjs';
import {decodeWindow,calibrateRangeTrim} from '../src/split-audio.mjs';
import {readFile} from 'node:fs/promises';

const catalog=JSON.parse(await readFile(new URL('../assets/sudais-vbr-index.json',import.meta.url)));
const verified=new Set([1,2,4,6,7,9,10,97]);
const chapterArg=process.argv.find(x=>x.startsWith('--chapter='));
const chapter=chapterArg?Number(chapterArg.split('=')[1]):2;
const requested=process.argv.slice(2).filter(x=>!x.startsWith('--')).map(Number);
for(const reciter of requested.length?requested:[1,2,3,4,5,6,7,9,10,12,97]){
  try{
    const isVerified=verified.has(reciter)&&!(chapter===3&&reciter===10);
    const af=isVerified?
      JSON.parse(await readFile(new URL(`../assets/verified-audio/${reciter}-${chapter}.json`,import.meta.url))):
      (await (await fetch(`https://api.qurancdn.com/api/qdc/audio/reciters/${reciter}/audio_files?chapter=${chapter}&segments=true`)).json()).audio_files[0];
    const verse=af.verse_timings.at(-1),from=verse.timestamp_from-2500;
    let index=await getCbrIndex(af.audio_url,{allowTagless:!!af.source_recording});
    if(!index&&reciter===3)index=await getVerifiedVbrIndex(af.audio_url,catalog.rows?.[af.audio_url]);
    if(!index){console.log(JSON.stringify({reciter,result:'no-index'}));continue;}
    const trim=index.trimSamples===undefined?await calibrateRangeTrim(index):index.trimSamples;
    if(trim==null){console.log(JSON.stringify({reciter,result:'trim-unverified'}));continue;}
    const fileEnd=index.frames*index.samples/index.rate*1000-trim/index.rate*1000;
    const to=Math.min(verse.timestamp_to,fileEnd),range=rangeForWindow(index,from,to);
    const response=await fetch(af.audio_url,{headers:{Range:`bytes=${range.start}-${range.end}`}});
    const bytes=new Uint8Array(await response.arrayBuffer());
    const aligned=alignedRangeOffset(bytes,index,range.start);
    if(!aligned){console.log(JSON.stringify({reciter,result:'not-aligned'}));continue;}
    const correctedOff=aligned.off-trim/index.rate*1000;
    if(correctedOff>from){console.log(JSON.stringify({reciter,result:'late-offset',correctedOff,from}));continue;}
    const decoded=await decodeWindow(new Blob([bytes.subarray(aligned.skip)]).stream(),from-correctedOff,to-correctedOff,{maxMissingMs:120});
    const samples=decoded.channelData[0],rate=decoded.sampleRate;
    const tailRms=ms=>{const n=Math.min(samples.length,Math.round(rate*ms/1000));
      let sum=0;for(let i=samples.length-n;i<samples.length;i++)sum+=samples[i]*samples[i];
      return Math.sqrt(sum/n);};
    console.log(JSON.stringify({reciter,chapter,result:'decoded',durationMs:decoded.channelData[0].length/decoded.sampleRate*1000,
      to,fileEnd,metadataOverhang:verse.timestamp_to-fileEnd,trim,rangeBytes:bytes.length,
      tailRms50:tailRms(50),tailRms200:tailRms(200)}));
  }catch(error){console.log(JSON.stringify({reciter,result:'error',error:String(error)}));}
}
