// Review-only pilot: decode the original QDC MP3 from byte zero and ask an
// independent recognizer about exact verse windows. Never writes app timings.
import fs from 'node:fs';
import crypto from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { MPEGDecoder } from 'mpg123-decoder';
import { decodeWindow } from '../src/split-audio.mjs';

const tasks = [
  { surah: 28, ayah: 44, before: 1500, after: 1500 },
  { surah: 29, ayah: 45, before: 1500, after: 1500 },
  { surah: 29, ayah: 46, before: 1500, after: 1500 },
  { surah: 5, ayah: 111, before: 1500, after: 1500 },
];
const endpoint = 'https://hetchyy-quranic-universal-aligner.hf.space/api/v1/align/audio';
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const outDir = 'review/sudais-independent-pilot';
fs.mkdirSync(outDir, { recursive: true });

function wav(pcm) {
  const channels=pcm.channelData, sampleRate=pcm.sampleRate, frames=channels[0].length;
  const bytes=Buffer.alloc(44+frames*channels.length*2);
  bytes.write('RIFF',0);bytes.writeUInt32LE(bytes.length-8,4);
  bytes.write('WAVEfmt ',8);bytes.writeUInt32LE(16,16);bytes.writeUInt16LE(1,20);
  bytes.writeUInt16LE(channels.length,22);bytes.writeUInt32LE(sampleRate,24);
  bytes.writeUInt32LE(sampleRate*channels.length*2,28);
  bytes.writeUInt16LE(channels.length*2,32);bytes.writeUInt16LE(16,34);
  bytes.write('data',36);bytes.writeUInt32LE(bytes.length-44,40);
  let p=44;
  for(let i=0;i<frames;i++)for(const channel of channels){
    const sample=Math.max(-1,Math.min(1,channel[i]));
    bytes.writeInt16LE(Math.max(-32768,Math.min(32767,Math.round(sample*32767))),p);p+=2;
  }
  return bytes;
}

for(const task of tasks){
  const key=`${task.surah}:${task.ayah}`;
  const filename=`test-results/sudais-qdc-${task.surah}.mp3`;
  const metadata=JSON.parse(fs.readFileSync(`test-results/timings/3-${task.surah}.json`,'utf8'));
  const verse=metadata.verse_timings.find(row=>row.verse_key===key);
  if(!verse)throw Error(`Missing verse ${key}`);
  const source=fs.readFileSync(filename);
  const sourceSha256=sha256(source);
  const from=Math.max(0,verse.timestamp_from-task.before),to=verse.timestamp_to+task.after;
  const start=performance.now();
  const pcm=await decodeWindow(new Blob([source]).stream(),from,to,{decoderFactory:()=>new MPEGDecoder()});
  const decodeSeconds=(performance.now()-start)/1000;
  const excerpt=wav(pcm),excerptSha256=sha256(excerpt);
  const form=new FormData();
  form.append('audio',new Blob([excerpt],{type:'audio/wav'}),`${task.surah}-${task.ayah}.wav`);
  form.append('riwayah','hafs');form.append('model_name','Large');form.append('device','GPU');
  const requestStart=performance.now();
  let response,body;
  try{
    response=await fetch(endpoint,{method:'POST',body:form,signal:AbortSignal.timeout(240000)});
    body=await response.text();
  }catch(error){
    response={status:0};body=JSON.stringify({error:String(error)});
  }
  const requestSeconds=(performance.now()-requestStart)/1000;
  let alignment;
  try{alignment=JSON.parse(body);}catch{alignment={unparsed:body.slice(0,500)}}
  const segments=(alignment.segments||[]).map(segment=>({
    from:segment.ref_from,to:segment.ref_to,
    source_from_ms:Math.round(pcm.off+segment.time_from*1000),
    source_to_ms:Math.round(pcm.off+segment.time_to*1000),
    confidence:segment.confidence,
    missing:segment.has_missing_words,repeated:segment.has_repeated_words,
    error:segment.error,
  }));
  const result={status:'machine-review-only',key,
    source_url:metadata.audio_url,source_file:filename,source_size:source.length,source_sha256:sourceSha256,
    source_excerpt_ms:[from,to],decoded_excerpt_from_ms:pcm.off,
    excerpt_sha256:excerptSha256,excerpt_bytes:excerpt.length,
    requested_model:'Large',requested_device:'GPU',
    response_status:response.status,decode_seconds:+decodeSeconds.toFixed(3),
    request_seconds:+requestSeconds.toFixed(3),
    model_runtime:alignment._meta?.runtime||null,
    effective_model:alignment._meta?.effective_model||null,
    segments,provider_error:alignment.error||alignment.unparsed||null,
  };
  fs.writeFileSync(`${outDir}/${task.surah}-${task.ayah}.json`,JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify({key,status:response.status,decode_seconds:result.decode_seconds,
    request_seconds:result.request_seconds,segments:segments.length,
    refs:segments.map(s=>[s.from,s.to]),error:result.provider_error}));
}
