// Review-only QUL-audio/QUL-timing source-pair content check.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {prepareWindow} from '../src/split-audio.mjs';

const endpoint='https://hetchyy-quranic-universal-aligner.hf.space/api/v1/align/audio';
const context={createBuffer(n,len,rate){const data=Array.from({length:n},()=>new Float32Array(len));
  return {sampleRate:rate,length:len,duration:len/rate,numberOfChannels:n,
    copyToChannel:(samples,ch)=>data[ch].set(samples),getChannelData:ch=>data[ch]};}};
function wav(p,from,to){const rate=p.buffer.sampleRate,nch=p.buffer.numberOfChannels,
  lo=Math.round((from-p.off)*rate/1000),hi=Math.round((to-p.off)*rate/1000);
  if(lo<0||hi>p.buffer.length||hi<=lo)throw Error('Incomplete PCM excerpt');
  const out=Buffer.alloc(44+(hi-lo)*nch*2);out.write('RIFF',0);out.writeUInt32LE(out.length-8,4);
  out.write('WAVEfmt ',8);out.writeUInt32LE(16,16);out.writeUInt16LE(1,20);
  out.writeUInt16LE(nch,22);out.writeUInt32LE(rate,24);out.writeUInt32LE(rate*nch*2,28);
  out.writeUInt16LE(nch*2,32);out.writeUInt16LE(16,34);out.write('data',36);
  out.writeUInt32LE(out.length-44,40);let at=44;
  for(let i=lo;i<hi;i++)for(let ch=0;ch<nch;ch++){
    out.writeInt16LE(Math.max(-32768,Math.min(32767,Math.round(p.buffer.getChannelData(ch)[i]*32767))),at);at+=2;}
  return out;}
fs.mkdirSync('test-results/sudais-qul-pair',{recursive:true});
fs.mkdirSync('review/sudais-qul-pair',{recursive:true});
const requested=new Set(process.argv.slice(2));
for(const [sid,ay] of [[5,5],[5,46],[5,82],[5,119],[28,2],[28,44],[28,87],[29,2],[29,35],[29,68]]
  .filter(([sid,ay])=>!requested.size||requested.has(`${sid}:${ay}`))){
  const key=`${sid}:${ay}`,response=await fetch(`https://qul.tarteel.ai/api/v1/audio/surah_segments/3?surah=${sid}&from=${ay}&to=${ay}`);
  if(!response.ok)throw Error(`QUL ${key} HTTP ${response.status}`);
  const data=await response.json(),v=data.segments[key];if(!v)throw Error(`No QUL ${key}`);
  const sourceUrl=data.audio.url;
  const p=await prepareWindow({sourceUrl,verseRanges:{1:[v.time_from,v.time_to]},
    verseSegments:{1:v.segments}},1,context,{positions:[]});
  const audio=wav(p,v.time_from,v.time_to),name=`${sid}-${ay}`;
  fs.writeFileSync(`test-results/sudais-qul-pair/${name}.wav`,audio);
  const form=new FormData();form.append('audio',new Blob([audio],{type:'audio/wav'}),`${name}.wav`);
  form.append('riwayah','hafs');form.append('model_name','Large');form.append('device','GPU');
  const align=await fetch(endpoint,{method:'POST',body:form,signal:AbortSignal.timeout(300000)});
  const body=await align.text();if(!align.ok)throw Error(`${key}: QUD ${align.status} ${body.slice(0,500)}`);
  const result=JSON.parse(body),out={status:'machine-review-only',key,source_url:sourceUrl,
    source_timing_range:[v.time_from,v.time_to],source_word_segments:v.segments,
    excerpt_sha256:crypto.createHash('sha256').update(audio).digest('hex'),
    excerpt_bytes:audio.length,aligner:result};
  fs.writeFileSync(`review/sudais-qul-pair/${name}.json`,JSON.stringify(out,null,2)+'\n');
  console.log(JSON.stringify({key,source_timing_range:out.source_timing_range,
    groups:result.segments?.map(x=>[x.ref_from,x.ref_to,x.time_from,x.time_to,x.confidence,x.has_missing_words])}));
}
