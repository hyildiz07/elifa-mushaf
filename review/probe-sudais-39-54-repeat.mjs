import fs from 'node:fs';
import crypto from 'node:crypto';
import {decodeWindow} from '../src/split-audio.mjs';

const path='test-results/sudais-qdc-39.mp3';
const bytes=fs.readFileSync(path);
const sha=crypto.createHash('sha256').update(bytes).digest('hex');
if(sha!=='9667e8f7c2f31f437dfb9cc74c4d4c7f419bde1ace94d1df7561dc29bec5f145')
  throw Error('QDC 39 source changed');
const pcm=await decodeWindow(new Blob([bytes]).stream(),789000,813000);
const rate=22050,step=pcm.sampleRate/rate,ch=pcm.channelData[0];
const frames=Math.floor(ch.length/step),wav=Buffer.alloc(44+frames*2);
wav.write('RIFF',0);wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);
wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);
wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);
wav.write('data',36);wav.writeUInt32LE(frames*2,40);
for(let i=0;i<frames;i++){
  const j=Math.floor(i*step),k=Math.min(ch.length-1,Math.floor((i+1)*step));
  wav.writeInt16LE(Math.max(-32768,Math.min(32767,Math.round((ch[j]+ch[k])/2*32767))),44+i*2);
}
const evidence={source_url:'https://download.quranicaudio.com/qdc/abdurrahmaan_as_sudais/murattal/39.mp3',
  source_sha256:sha,excerpt:[pcm.off,pcm.off+ch.length/pcm.sampleRate*1000],
  wav_sha256:crypto.createHash('sha256').update(wav).digest('hex'),models:{}};
for(const model of ['Base','Large']){
  const form=new FormData();form.set('audio',new Blob([wav],{type:'audio/wav'}),'39.wav');
  form.set('model_name',model);form.set('riwayah','hafs');
  const res=await fetch('https://hetchyy-quranic-universal-aligner.hf.space/api/v1/align/audio',
    {method:'POST',body:form,signal:AbortSignal.timeout(180000)});
  if(!res.ok)throw Error(`${model} align HTTP ${res.status}`);
  const alignment=await res.json(),segments=[];
  const wr=await fetch(`https://hetchyy-quranic-universal-aligner.hf.space/api/v1/sessions/${alignment.audio_id}/timestamps`,
    {method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({granularity:'words'}),signal:AbortSignal.timeout(180000)});
  if(!wr.ok)throw Error(`${model} words HTTP ${wr.status}`);
  const words=await wr.json();
  for(const s of alignment.segments){
    const segment={from:s.ref_from,to:s.ref_to,
      start_ms:Math.round(pcm.off+s.time_from*1000),end_ms:Math.round(pcm.off+s.time_to*1000),
      confidence:s.confidence,missing:s.has_missing_words,repeated:s.has_repeated_words};
    for(const item of words.segments||[]){
      const target=alignment.segments[item.segment-1];
      if(target===s){segment.words=item.words;segment.timing_status=item.timing_status;break;}
    }
    segments.push(segment);
  }
  evidence.models[model]=segments;
  console.log(model,JSON.stringify(segments.map(s=>[s.from,s.to,s.start_ms,s.end_ms,s.confidence])));
}
fs.writeFileSync('test-results/sudais-39-54-repeat-evidence.json',JSON.stringify(evidence,null,2)+'\n');
