// Research-only benchmark. Decode several exact-QDC windows in one sequential
// pass, then compare every PCM sample to the current production decodeWindow.
// No MP3 byte seeking, time-offset estimates, or replacement audio is used.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {MPEGDecoderWebWorker} from 'mpg123-decoder';
import {decodeWindow} from '../src/split-audio.mjs';

const source='test-results/sudais-qdc-3.mp3';
const timings=JSON.parse(fs.readFileSync('test-results/sudais-qul-timings-3.json','utf8'));
// QUL marks where to sample; it does not provide decoded QDC audio or cuts.
const windows=[10,30,50,70,90,110,130,150,170,190].map(ayah=>{
  const from=timings.segments[`3:${ayah}`].time_from;
  return {key:`3:${ayah}`,from,to:from+1000};
});

async function batchDecode(bytes,requests){
  const decoder=new MPEGDecoderWebWorker();
  const reader=new Blob([bytes]).stream().getReader();
  let rate=0,channels=0,total=0,decodedBytes=0,decodeCalls=0;
  let rows=[];
  try{
    await decoder.ready;
    outer: while(true){
      const {done,value}=await reader.read();
      if(done)break;
      for(let offset=0;offset<value.length;offset+=32768){
        const piece=value.slice(offset,offset+32768);
        decodedBytes+=piece.length;decodeCalls++;
        const part=await decoder.decode(piece);
        if(part.errors?.length)throw Error('Audio decoding failed');
        if(!part.samplesDecoded)continue;
        if(!rate){
          rate=part.sampleRate;channels=part.channelData.length;
          rows=requests.map(w=>{
            const first=Math.floor(w.from*rate/1000),last=Math.ceil(w.to*rate/1000);
            return {...w,first,last,copied:0,channelData:Array.from({length:channels},()=>new Float32Array(last-first))};
          });
        }
        if(rate!==part.sampleRate||channels!==part.channelData.length)throw Error('Audio format changed');
        for(const row of rows){
          const lo=Math.max(row.first,total),hi=Math.min(row.last,total+part.samplesDecoded);
          if(hi<=lo)continue;
          for(let channel=0;channel<channels;channel++){
            row.channelData[channel].set(part.channelData[channel].subarray(lo-total,hi-total),lo-row.first);
          }
          row.copied+=hi-lo;
        }
        total+=part.samplesDecoded;
        if(rows.every(row=>row.copied===row.last-row.first))break outer;
      }
    }
  }finally{
    await reader.cancel().catch(()=>{});reader.releaseLock();await decoder.free();
  }
  if(rows.length!==requests.length||rows.some(row=>row.copied!==row.last-row.first))throw Error('Incomplete window');
  return {rate,channels,decodedBytes,decodeCalls,rows};
}

const bytes=fs.readFileSync(source);
const baseline=[];
const baselineStart=performance.now();
for(const w of windows){
  const t=performance.now();
  const p=await decodeWindow(new Blob([bytes]).stream(),w.from,w.to);
  baseline.push(p);
  console.log(`baseline ${w.key}: ${Math.round(performance.now()-t)} ms`);
}
const baselineMs=performance.now()-baselineStart;
const batchStart=performance.now();
const batch=await batchDecode(bytes,windows);
const batchMs=performance.now()-batchStart;
let comparedSamples=0,maxAbsoluteError=0;
for(let i=0;i<windows.length;i++){
  const old=baseline[i],now=batch.rows[i];
  if(old.sampleRate!==batch.rate||old.channelData.length!==now.channelData.length||
      old.off!==now.first/batch.rate*1000)throw Error(`Window metadata mismatch ${now.key}`);
  for(let channel=0;channel<now.channelData.length;channel++){
    const a=old.channelData[channel],b=now.channelData[channel];
    if(a.length!==b.length)throw Error(`Window length mismatch ${now.key}`);
    for(let sample=0;sample<a.length;sample++){
      const difference=Math.abs(a[sample]-b[sample]);
      maxAbsoluteError=Math.max(maxAbsoluteError,difference);
      if(difference!==0)throw Error(`PCM mismatch ${now.key} ch ${channel} sample ${sample}`);
    }
    comparedSamples+=a.length;
  }
}
const report={source,sourceBytes:bytes.length,
  sourceSha256:crypto.createHash('sha256').update(bytes).digest('hex'),
  windows:windows.map(w=>w.key),
  method:'sequential decode from MP3 byte zero; separate passes versus one batch pass',
  baselineMs:Math.round(baselineMs),batchMs:Math.round(batchMs),
  speedup:Number((baselineMs/batchMs).toFixed(2)),
  batchDecodedBytes:batch.decodedBytes,batchDecodeCalls:batch.decodeCalls,
  sampleRate:batch.rate,channels:batch.channels,comparedSamples,maxAbsoluteError};
fs.writeFileSync('review/batched-qdc-decode-benchmark.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
