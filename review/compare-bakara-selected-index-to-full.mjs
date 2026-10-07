// Research-only sample comparison of indexed EOF selection against full decode.
import fs from 'node:fs';
import crypto from 'node:crypto';
import { MPEGDecoder } from 'mpg123-decoder';
import { decodeWindow, prepareSelectedRange } from '../src/split-audio.mjs';

const path='test-results/sudais-qdc-2.mp3';
const bytes=fs.readFileSync(path);
const sourceSha256=crypto.createHash('sha256').update(bytes).digest('hex');
const row=JSON.parse(fs.readFileSync('test-results/timings/3-2.json','utf8'));
const verse=row.verse_timings.find(v=>v.verse_key==='2:286');
const from=verse.timestamp_to-4000,to=verse.timestamp_to;
const context={createBuffer(channels,length,sampleRate){
  const data=Array.from({length:channels},()=>new Float32Array(length));
  return {numberOfChannels:channels,length,sampleRate,duration:length/sampleRate,
    copyToChannel(values,index){data[index].set(values);},getChannelData(index){return data[index];}};
}};
const audio={sourceUrl:row.audio_url,recordingUrl:row.audio_url,offlineBlob:new Blob([bytes]),
  reciterId:3,verifiedCbr:false,end:to,verseRanges:{286:[from,to]},verseSegments:{286:[]}};
const indexed=await prepareSelectedRange(audio,from,to,context);
const reference=await decodeWindow(new Blob([bytes]).stream(),from,indexed.hi,
  {decoderFactory:()=>new MPEGDecoder(),maxMissingMs:120});
const rate=indexed.buffer.sampleRate;
let samples=0,power=0,maxAbs=0;
for(let ch=0;ch<indexed.buffer.numberOfChannels;ch++){
  const a=indexed.buffer.getChannelData(ch),b=reference.channelData[ch];
  for(let ms=from+500;ms<indexed.hi-250;ms+=1000/rate){
    const ia=Math.round((ms-indexed.off)*rate/1000);
    const ib=Math.round((ms-reference.off)*rate/1000);
    if(ia<0||ia>=a.length||ib<0||ib>=b.length)continue;
    const difference=a[ia]-b[ib];power+=difference*difference;
    maxAbs=Math.max(maxAbs,Math.abs(difference));samples++;
  }
}
const result={sourceSha256,from,to,indexedHi:indexed.hi,referenceHi:reference.off+
  reference.channelData[0].length/reference.sampleRate*1000,
  indexSize:audio.cbrIndex?.size,samples,maxAbs,rmsDifference:Math.sqrt(power/samples)};
console.log(JSON.stringify(result));
