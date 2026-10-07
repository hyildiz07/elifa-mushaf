import fs from 'node:fs';
import {getCbrIndex,rangeForWindow,alignedRangeOffset} from '../src/mp3-seek.mjs';
import {decodeWindow,calibrateRangeTrim} from '../src/split-audio.mjs';

for(const [reciter,chapter,verse] of [[4,4,12],[4,4,176],[9,4,12],[9,4,13],[6,4,12],[6,4,176]]){
  const path=new URL(`../tests/fixtures/${reciter}-${chapter}.json`,import.meta.url);
  const af=fs.existsSync(path)?JSON.parse(fs.readFileSync(path,'utf8')):
    (await (await fetch(`https://api.qurancdn.com/api/qdc/audio/reciters/${reciter}/audio_files?chapter=${chapter}&segments=true`)).json()).audio_files[0];
  const timing=af.verse_timings.find(v=>v.verse_key===`${chapter}:${verse}`);
  const url=af.audio_url,from=Math.max(0,timing.timestamp_from-2500),to=Math.min(from+15000,timing.timestamp_to+2500);
  const index=await getCbrIndex(url);
  if(!index){console.log(reciter,chapter,verse,'not indexed');continue;}
  const trim=await calibrateRangeTrim(index);
  const range=rangeForWindow(index,from,to);
  const response=await fetch(url,{headers:{Range:`bytes=${range.start}-${range.end}`}});
  const bytes=new Uint8Array(await response.arrayBuffer());
  const aligned=alignedRangeOffset(bytes,index,range.start);
  const correctedOff=aligned.off-trim/index.rate*1000;
  const fast=await decodeWindow(new Blob([bytes.subarray(aligned.skip)]).stream(),from-correctedOff,to-correctedOff);
  const full=await decodeWindow((await fetch(url)).body,from,to);
  const f=fast.channelData[0],g=full.channelData[0],at=Math.floor(f.length/2);
  const score=shift=>{
    let sum=0;
    for(let j=0;j<20000;j+=17){const x=f[at+j],y=g[at+j+shift];sum+=(x-y)*(x-y);}
    return sum;
  };
  let best={shift:0,score:Infinity};
  for(let shift=-2400;shift<=2400;shift+=24){const s=score(shift);if(s<best.score)best={shift,score:s};}
  const coarse=best.shift;
  for(let shift=coarse-30;shift<=coarse+30;shift++){const s=score(shift);if(s<best.score)best={shift,score:s};}
  console.log(JSON.stringify({reciter,chapter,verse,trim,rangeStart:range.start,aligned,shift:best.shift,score:best.score,bytes:bytes.length}));
}
