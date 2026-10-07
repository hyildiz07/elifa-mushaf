import {getCbrIndex,rangeForWindow,alignedRangeOffset,getVerifiedVbrIndex} from '../src/mp3-seek.mjs';
import {readFile} from 'node:fs/promises';

const reciters=[1,2,3,4,5,6,7,9,10,12,97];
const chapters=[2,3,4,5,36,112];
const catalog=JSON.parse(await readFile(new URL('../assets/sudais-vbr-index.json',import.meta.url)));
const verified=new Set([1,2,4,6,7,9,10,97]);
async function metadata(reciter,chapter){
  if(verified.has(reciter)&&!(chapter===3&&reciter===10)&&!(chapter===1&&[10,97].includes(reciter))){
    return JSON.parse(await readFile(new URL(`../assets/verified-audio/${reciter}-${chapter}.json`,import.meta.url)));
  }
  const endpoint=`https://api.qurancdn.com/api/qdc/audio/reciters/${reciter}/audio_files?chapter=${chapter}&segments=true`;
  return (await (await fetch(endpoint)).json()).audio_files?.[0];
}
for(const chapter of chapters){
  for(const reciter of reciters){
    try{
      const af=await metadata(reciter,chapter);
      if(!af?.audio_url||!af.verse_timings?.length)continue;
      const last=af.verse_timings.at(-1);
      let index=await getCbrIndex(af.audio_url,{allowTagless:!!af.source_recording});
      let indexKind='cbr';
      if(!index&&reciter===3){
        index=await getVerifiedVbrIndex(af.audio_url,catalog.rows?.[af.audio_url]);
        indexKind='vbr';
      }
      if(!index){console.log(JSON.stringify({reciter,chapter,last:last.verse_key,result:'no-index',verified:!!af.source_recording}));continue;}
      const rawEnd=index.frames*index.samples/index.rate*1000;
      const from=Math.max(0,last.timestamp_from-2500);
      const to=last.timestamp_to;
      if(from<=10000||from>=rawEnd-10000){
        console.log(JSON.stringify({reciter,chapter,last:last.verse_key,result:'range-bypassed',from,rawEnd}));continue;
      }
      const range=rangeForWindow(index,from,to);
      const r=await fetch(af.audio_url,{headers:{Range:`bytes=${range.start}-${range.end}`}});
      const bytes=new Uint8Array(await r.arrayBuffer());
      const aligned=bytes.length===range.end-range.start+1?alignedRangeOffset(bytes,index,range.start):null;
      const finalTag=bytes.length>=128?String.fromCharCode(...bytes.subarray(-128,-125)):null;
      console.log(JSON.stringify({reciter,chapter,last:last.verse_key,result:aligned?'aligned':'failed',
        indexKind,verified:!!af.source_recording,from,to,rawEnd,seek:range,bytes:bytes.length,status:r.status,
        alignment:aligned,finalTag}));
    }catch(error){console.log(JSON.stringify({reciter,chapter,error:String(error)}));}
  }
}
