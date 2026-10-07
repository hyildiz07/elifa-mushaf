// Transport/decode check for the independently aligned Husary Muallim verse
// sources used to repair missing chapter word positions. Not a phonetic audit.
import fs from 'node:fs/promises';
import {prepareSelectedRange} from '../src/split-audio.mjs';
import {makeHusaryVerseTiming} from '../src/verified-verse-audio.mjs';

const keys=['11:26','11:116','114:6','23:80','23:91','33:23','35:3',
  '38:30','38:44','40:31','46:33','58:8','8:40'];
const {rows}=JSON.parse(await fs.readFile(new URL('../assets/verified-verse-audio-r12.json',import.meta.url)));
const context={createBuffer(channels,length,sampleRate){
  const data=Array.from({length:channels},()=>new Float32Array(length));
  return {numberOfChannels:channels,length,sampleRate,duration:length/sampleRate,
    copyToChannel(source,ch){data[ch].set(source);},getChannelData(ch){return data[ch];}};
}};
let decoded=0;
for(const key of keys){
  const row=rows[key],started=performance.now(),requests=[];
  const ay=Number(key.split(':')[1]);
  const source={sourceUrl:row.audio_url,recordingUrl:row.audio_url,
    reciterId:12,verifiedCbr:true,fileSize:row.file_size,buffer:null,
    ...makeHusaryVerseTiming(row,ay)};
  const nativeFetch=globalThis.fetch;
  globalThis.fetch=async(url,options={})=>{
    requests.push({method:options.method||'GET',range:options.headers?.Range||null});
    return nativeFetch(url,options);
  };
  try{
    const prepared=await prepareSelectedRange(source,0,row.playback_end_ms??row.timestamp_to,context,
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
