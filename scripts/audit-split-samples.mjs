import fs from 'node:fs';
import {MPEGDecoder} from 'mpg123-decoder';
import {decodeWindow,quietCut} from '../src/split-audio.mjs';

const reciters=[7,6,12,9,2,1,3,10,4,5,97],report=[];
for(const rid of reciters){
  const start=performance.now();
  try{
    const meta=JSON.parse(fs.readFileSync(`test-results/timings/${rid}-4.json`));
    const verses=meta.verse_timings.filter(v=>[12,13,14].includes(+v.verse_key.split(':')[1]));
    const from=verses[0].timestamp_from-1000,to=verses.at(-1).timestamp_to;
    const response=await fetch(meta.audio_url,{signal:AbortSignal.timeout(90000)});
    if(!response.ok)throw Error(`HTTP ${response.status}`);
    const decoded=await decodeWindow(response.body,from,to,{decoderFactory:()=>new MPEGDecoder()});
    const buffer={sampleRate:decoded.sampleRate,length:decoded.channelData[0].length,numberOfChannels:decoded.channelData.length,getChannelData:c=>decoded.channelData[c]};
    const checked=[];
    for(const v of verses){
      for(const pos of new Set(v.segments.map(s=>s[0]))){
        const left=v.segments.filter(s=>s[0]<=pos),right=v.segments.filter(s=>s[0]>pos);
        if(!right.length)continue;
        const end=Math.max(...left.map(s=>s[2])),next=Math.min(...right.map(s=>s[1]));
        if(next-end<160)continue;
        checked.push({verse:v.verse_key,pos,gap:next-end,cut:quietCut(buffer,decoded.off,end,next)});
      }
    }
    const row={rid,source:meta.audio_url,ms:Math.round(performance.now()-start),retainedPCMBytes:buffer.length*buffer.numberOfChannels*4,checked};report.push(row);
    console.log(JSON.stringify({rid,ms:row.ms,candidates:checked.length,quiet:checked.filter(c=>c.cut!=null).length}));
  }catch(e){report.push({rid,error:e.message});console.log(JSON.stringify(report.at(-1)));}
  fs.writeFileSync('test-results/split-acoustic-samples.json',JSON.stringify(report,null,2));
}
if(report.some(r=>r.error))process.exitCode=1;
