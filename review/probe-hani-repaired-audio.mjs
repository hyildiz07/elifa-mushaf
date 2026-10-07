// Decode every newly repaired Hani verse from its original MP3 source.
// Checks transport and PCM window availability, not phonetic correctness.
import fs from 'node:fs/promises';
import {prepareSelectedRange} from '../src/split-audio.mjs';

const keys=[
  '12:62','2:38','22:19','23:36','24:58','26:118','3:15','3:61',
  '3:162','3:197','39:39','41:30','48:29','5:2','5:57','57:20','59:5',
  '59:8','68:51','7:155','89:1','89:30','9:21','9:109'
];
const {rows}=JSON.parse(await fs.readFile(new URL('../assets/audio-timing-overrides-v3.json',import.meta.url)));
const context={createBuffer(channels,length,sampleRate){
  const data=Array.from({length:channels},()=>new Float32Array(length));
  return {numberOfChannels:channels,length,sampleRate,duration:length/sampleRate,
    copyToChannel(source,ch){data[ch].set(source);},getChannelData(ch){return data[ch];}};
}};
let decoded=0;
for(const key of keys){
  const row=rows[`5:${key}`],started=performance.now(),requests=[];
  const source={sourceUrl:row.url,recordingUrl:row.url,reciterId:5,buffer:null};
  const nativeFetch=globalThis.fetch;
  globalThis.fetch=async(url,options={})=>{
    requests.push({method:options.method||'GET',range:options.headers?.Range||null});
    return nativeFetch(url,options);
  };
  try{
    const prepared=await prepareSelectedRange(source,row.range[0],row.range[1],context,
      {signal:AbortSignal.timeout(30000)});
    if(prepared.hi<=prepared.lo)throw Error('empty decoded range');
    decoded++;
    console.log(JSON.stringify({key,result:'decoded',durationMs:Math.round(prepared.hi-prepared.lo),
      fullStream:requests.some(r=>r.method==='GET'&&!r.range),
      elapsedMs:Math.round(performance.now()-started)}));
  }catch(error){
    console.log(JSON.stringify({key,result:'error',error:String(error),requests,
      elapsedMs:Math.round(performance.now()-started)}));
  }finally{globalThis.fetch=nativeFetch;}
}
if(decoded!==keys.length)process.exitCode=1;
