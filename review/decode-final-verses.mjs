import {readFile} from 'node:fs/promises';
import {getVerifiedVbrIndex} from '../src/mp3-seek.mjs';
import {prepareWindow} from '../src/split-audio.mjs';

const reciters=[1,2,3,4,5,6,7,9,10,12,97],chapters=[2,3,4,5,36,112];
const verified=new Set([1,2,4,6,7,9,10,97]);
const catalog=JSON.parse(await readFile(new URL('../assets/sudais-vbr-index.json',import.meta.url)));
const nativeFetch=globalThis.fetch;
const context={createBuffer(channels,length,sampleRate){
  const data=Array.from({length:channels},()=>new Float32Array(length));
  return {numberOfChannels:channels,length,sampleRate,duration:length/sampleRate,
    copyToChannel(source,ch){data[ch].set(source);},getChannelData(ch){return data[ch];}};
}};
async function metadata(reciter,chapter){
  if(verified.has(reciter)&&!(chapter===3&&reciter===10))
    return JSON.parse(await readFile(new URL(`../assets/verified-audio/${reciter}-${chapter}.json`,import.meta.url)));
  return (await (await nativeFetch(`https://api.qurancdn.com/api/qdc/audio/reciters/${reciter}/audio_files?chapter=${chapter}&segments=true`)).json()).audio_files?.[0];
}
for(const chapter of chapters)for(const reciter of reciters){
  if(chapter===4&&reciter===3){console.log(JSON.stringify({reciter,chapter,result:'quarantined'}));continue;}
  const requests=[];let row={reciter,chapter};
  try{
    const af=await metadata(reciter,chapter),vt=af.verse_timings.at(-1);
    const ay=Number(vt.verse_key.split(':')[1]);
    const audio={reciterId:reciter,sourceUrl:af.audio_url,recordingUrl:af.audio_url,
      verifiedCbr:!!af.source_recording,buffer:null,
      verseRanges:{[ay]:[vt.timestamp_from,vt.timestamp_to]},verseSegments:{[ay]:vt.segments}};
    if(reciter===3){
      const vbr=await getVerifiedVbrIndex(af.audio_url,catalog.rows?.[af.audio_url]);
      if(vbr)audio.cbrIndex=vbr;
    }
    globalThis.fetch=async(url,options={})=>{
      requests.push({method:options.method||'GET',range:options.headers?.Range||null});
      return nativeFetch(url,options);
    };
    const result=await prepareWindow(audio,ay,context,
      {signal:AbortSignal.timeout(90000),positions:[]});
    const full=requests.some(r=>r.method==='GET'&&!r.range);
    row={...row,verse:vt.verse_key,result:'decoded',path:full?'full-stream':'bounded-range',
      from:vt.timestamp_from,to:vt.timestamp_to,bufferLo:result.lo,bufferHi:result.hi,
      index:audio.cbrIndex?'yes':'no',requests};
  }catch(error){row={...row,result:'error',error:String(error),requests};}
  finally{globalThis.fetch=nativeFetch;}
  console.log(JSON.stringify(row));
}
