import fs from 'node:fs';
import { MPEGDecoder } from 'mpg123-decoder';
import { prepareWindow } from '../src/split-audio.mjs';

const targets = [[3, 160], [4, 143], [5, 5]];
const context = {createBuffer(channels, length, rate) {
  const data = Array.from({length: channels}, () => new Float32Array(length));
  return {sampleRate: rate, length, duration: length/rate, numberOfChannels: channels,
    copyToChannel(x, c) { data[c].set(x); }, getChannelData(c) { return data[c]; }};
}};
const monoMs = (samples, rate) => {
  const step = rate / 1000, out = new Float32Array(Math.floor(samples.length / step));
  for (let i=0; i<out.length; i++) {
    const lo=Math.floor(i*step), hi=Math.max(lo+1,Math.floor((i+1)*step));
    let sum=0; for(let j=lo;j<hi;j++) sum+=samples[j];
    out[i]=sum/(hi-lo);
  }
  return out;
};
function corr(x,y,offset,start,len=1000) {
  let xx=0, yy=0, xy=0;
  for(let i=0;i<len;i+=3) {
    const a=x[offset+start+i], b=y[start+i];
    if(a===undefined||b===undefined) return -Infinity;
    xx+=a*a; yy+=b*b; xy+=a*b;
  }
  return xy/Math.sqrt(xx*yy||1);
}
for (const [surah, ayah] of targets) {
  const key=`${surah}:${ayah}`;
  const timing=JSON.parse(fs.readFileSync(`test-results/timings/3-${surah}.json`,'utf8'));
  const verse=timing.verse_timings.find(x=>x.verse_key===key);
  const next=timing.verse_timings.find(x=>x.verse_key===`${surah}:${ayah+1}`);
  const lower=Math.max(0,verse.timestamp_from-3000);
  const upper=Math.max(verse.timestamp_to,...verse.segments.map(x=>x[2]),next.timestamp_from)+3000;
  const audio={sourceUrl:timing.audio_url,verifiedCbr:false,
    offlineBlob:new Blob([fs.readFileSync(`test-results/sudais-qdc-${surah}.mp3`)]),
    verseRanges:{[ayah]:[lower,upper]},verseSegments:{[ayah]:[]}};
  const p=await prepareWindow(audio,ayah,context,{positions:[]});
  const qdc=monoMs(p.buffer.getChannelData(0),p.buffer.sampleRate);
  const url=`https://everyayah.com/data/Abdurrahmaan_As-Sudais_192kbps/${String(surah).padStart(3,'0')}${String(ayah).padStart(3,'0')}.mp3`;
  const response=await fetch(url);if(!response.ok) throw new Error(`${response.status} ${url}`);
  const decoder=new MPEGDecoder();await decoder.ready;
  const decoded=decoder.decode(new Uint8Array(await response.arrayBuffer()));await decoder.free();
  const versePcm=monoMs(decoded.channelData[0],decoded.sampleRate);
  const windows=[0.15,0.45,0.75].map(frac=>Math.min(Math.floor(frac*versePcm.length),versePcm.length-1000));
  const candidates=[];
  for(let shift=0;shift+versePcm.length<=qdc.length;shift+=5) {
    const scores=windows.map(start=>corr(qdc,versePcm,shift,start));
    candidates.push({shift,score:scores.reduce((a,b)=>a+b,0)/scores.length,scores});
  }
  candidates.sort((a,b)=>b.score-a.score);
  const best=candidates[0];
  console.log(JSON.stringify({key,qdcWindowMs:[p.off,p.off+qdc.length],candidateDurationMs:versePcm.length,
    best:{...best,sourceStartMs:p.off+best.shift},runner:candidates.find(x=>Math.abs(x.shift-best.shift)>500)}));
}
