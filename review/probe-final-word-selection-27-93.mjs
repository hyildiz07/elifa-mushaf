// Reproduce the selected final word from the exact Sudais chapter recording.
import fs from 'node:fs';
import {prepareSelectedRange} from '../src/split-audio.mjs';
import {getVerifiedVbrIndex} from '../src/mp3-seek.mjs';

const metadata=JSON.parse(fs.readFileSync(new URL('../test-results/timings/3-27.json',import.meta.url)));
const catalog=JSON.parse(fs.readFileSync(new URL('../assets/sudais-vbr-index.json',import.meta.url)));
const verse=metadata.verse_timings.find(row=>row.verse_key==='27:93');
const last=verse.segments.at(-1),sourceUrl=metadata.audio_url;
const context={createBuffer(channels,length,sampleRate){
  const data=Array.from({length:channels},()=>new Float32Array(length));
  return {numberOfChannels:channels,length,sampleRate,duration:length/sampleRate,
    copyToChannel(values,index){data[index].set(values);},getChannelData(index){return data[index];}};
}};
const audio={sourceUrl,recordingUrl:sourceUrl,reciterId:3,buffer:null,
  end:last[2],verseRanges:{93:[verse.timestamp_from,verse.timestamp_to]},
  verseSegments:{93:verse.segments},
  cbrIndex:await getVerifiedVbrIndex(sourceUrl,catalog.rows[sourceUrl])};
const start=Date.now();
try{
  const result=await prepareSelectedRange(audio,last[1],last[2],context);
  console.log(JSON.stringify({status:'ready',from:last[1],to:last[2],lo:result.lo,hi:result.hi,
    physicalEnd:(audio.cbrIndex.frames*audio.cbrIndex.samples-audio.cbrIndex.trimSamples)/audio.cbrIndex.rate*1000,
    elapsedMs:Date.now()-start}));
}catch(error){
  console.log(JSON.stringify({status:'failed',message:String(error),from:last[1],to:last[2],
    elapsedMs:Date.now()-start}));
  process.exitCode=1;
}
