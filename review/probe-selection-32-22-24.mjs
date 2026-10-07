// Reproduce the highlighted 32:22–24 passage against each current reciter's
// original chapter MP3. This is a transport/decode check, not phonetic review.
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {getVerifiedVbrIndex} from '../src/mp3-seek.mjs';
import {prepareSelectedRange} from '../src/split-audio.mjs';

const html=await fs.readFile(new URL('../index.html',import.meta.url),'utf8');
const start=html.indexOf('const QTEXT=');
const textContext=vm.createContext({});
vm.runInContext(html.slice(start,html.indexOf('\n',start)),textContext);
const lastWord=vm.runInContext('QTEXT[32][23][2].filter(w=>w[1]===0).length',textContext);
const verified=new Set([1,2,4,6,7,9,10,97]);
const reciters=[1,2,3,4,5,6,7,9,10,12,97];
const catalog=JSON.parse(await fs.readFile(new URL('../assets/sudais-vbr-index.json',import.meta.url),'utf8'));
const context={createBuffer(channels,length,sampleRate){
  const data=Array.from({length:channels},()=>new Float32Array(length));
  return {numberOfChannels:channels,length,sampleRate,duration:length/sampleRate,
    copyToChannel(source,ch){data[ch].set(source);},getChannelData(ch){return data[ch];}};
}};

async function metadata(reciter){
  if(verified.has(reciter))return JSON.parse(await fs.readFile(
    new URL(`../assets/verified-audio/${reciter}-32.json`,import.meta.url),'utf8'));
  const response=await fetch(`https://api.qurancdn.com/api/qdc/audio/reciters/${reciter}/audio_files?chapter=32&segments=true`,
    {signal:AbortSignal.timeout(12000)});
  if(!response.ok)throw Error(`metadata HTTP ${response.status}`);
  const af=(await response.json()).audio_files?.[0];
  if(!af)throw Error('metadata missing');
  return af;
}

for(const reciter of reciters){
  const started=performance.now(),requests=[];
  let row={reciter,chapter:32,verses:'22–24'};
  try{
    const af=await metadata(reciter);
    const verse22=af.verse_timings.find(v=>v.verse_key==='32:22');
    const verse24=af.verse_timings.find(v=>v.verse_key==='32:24');
    const first=verse22?.segments?.findLast(s=>s[0]===1);
    const last=verse24?.segments?.findLast(s=>s[0]===lastWord);
    if(!first||!last)throw Error('selected word timing missing');
    const from=first[1],to=last[2];
    const audio={sourceUrl:af.audio_url,recordingUrl:af.audio_url,
      reciterId:reciter,verifiedCbr:!!af.source_recording,buffer:null};
    if(reciter===3){
      const indexRow=catalog.rows?.[af.audio_url];
      if(indexRow)audio.cbrIndex=await getVerifiedVbrIndex(af.audio_url,indexRow,
        {signal:AbortSignal.timeout(12000)});
    }
    const nativeFetch=globalThis.fetch;
    globalThis.fetch=async(url,options={})=>{
      requests.push({method:options.method||'GET',range:options.headers?.Range||null});
      return nativeFetch(url,options);
    };
    try{
      const prepared=await prepareSelectedRange(audio,from,to,context,
        {signal:AbortSignal.timeout(30000)});
      row={...row,result:'decoded',from,to,lo:prepared.lo,hi:prepared.hi,
        fullStream:requests.some(r=>r.method==='GET'&&!r.range),requests};
    }finally{globalThis.fetch=nativeFetch;}
  }catch(error){row={...row,result:'error',error:String(error),requests};}
  console.log(JSON.stringify({...row,elapsedMs:Math.round(performance.now()-started)}));
}
