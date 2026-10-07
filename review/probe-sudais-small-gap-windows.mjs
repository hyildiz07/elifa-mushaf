import fs from 'node:fs';
import crypto from 'node:crypto';
import {decodeWindow} from '../src/split-audio.mjs';

// Review only: align overlapping excerpts from the exact production MP3,
// decoded from byte zero. No provider timestamp is used to label a verse.
const cases=[
  {key:'2:25',sid:2,from:324000,to:372000},
  {key:'3:37',sid:3,from:611000,to:662000},
  {key:'4:95',sid:4,from:2056000,to:2106000},
  {key:'4:146',sid:4,from:3002000,to:3046000},
  {key:'5:91',sid:5,from:2030000,to:2085000},
  {key:'5:103',sid:5,from:2250000,to:2310000},
  {key:'41:44',sid:41,from:568000,to:606000},
];
const knownSha={
  2:'632367bdf34316591fec17b03940073ce3a712b54ee436c22a448c40a4799fe6',
  3:'7a52d1efb56e31d8c84436aec39cbeebde8498dfa43acaf2c082c7c145153614',
  4:'60adc3638bc3cdf6dbfcf110ab1102f810794ea21e74f3764cd159b3f13d122d',
  5:'16fad03b000d69492da95e9f970f220ae097a6693815917924b43f1730ae8cdb',
  41:'335d74a6d1d0c6614967879605129623c20c08334d9edaefd4956e42f4cad028',
};
function wav(p){
  const rate=22050,step=p.sampleRate/rate,ch=p.channelData[0];
  const frames=Math.floor(ch.length/step),out=Buffer.alloc(44+frames*2);
  out.write('RIFF',0);out.writeUInt32LE(out.length-8,4);out.write('WAVEfmt ',8);
  out.writeUInt32LE(16,16);out.writeUInt16LE(1,20);out.writeUInt16LE(1,22);
  out.writeUInt32LE(rate,24);out.writeUInt32LE(rate*2,28);out.writeUInt16LE(2,32);out.writeUInt16LE(16,34);
  out.write('data',36);out.writeUInt32LE(frames*2,40);
  for(let i=0;i<frames;i++){
    const j=Math.floor(i*step),k=Math.min(ch.length-1,Math.floor((i+1)*step));
    out.writeInt16LE(Math.max(-32768,Math.min(32767,Math.round((ch[j]+ch[k])/2*32767))),44+i*2);
  }
  return out;
}
const outputPath='test-results/sudais-small-gap-window-evidence.json';
const out=fs.existsSync(outputPath)?JSON.parse(fs.readFileSync(outputPath)):[];
const selected=process.argv.find(arg=>arg.startsWith('--key='))?.slice(6);
for(const x of cases.filter(x=>!selected||x.key===selected)){
  if(out.some(row=>row.key===x.key))continue;
  const source=`test-results/sudais-qdc-${x.sid}.mp3`,bytes=fs.readFileSync(source);
  const sha256=crypto.createHash('sha256').update(bytes).digest('hex');
  if(knownSha[x.sid]&&sha256!==knownSha[x.sid])throw Error(`${x.key}: source bytes changed`);
  const p=await decodeWindow(new Blob([bytes]).stream(),x.from,x.to);
  const pcm=wav(p),wavSha256=crypto.createHash('sha256').update(pcm).digest('hex');
  const matches={};
  for(const model of ['Large','Base']){
    const form=new FormData();
    form.set('audio',new Blob([pcm],{type:'audio/wav'}),`${x.sid}.wav`);
    form.set('model_name',model);form.set('riwayah','hafs');
    const response=await fetch('https://hetchyy-quranic-universal-aligner.hf.space/api/v1/align/audio',
      {method:'POST',body:form,signal:AbortSignal.timeout(180000)});
    if(!response.ok)throw Error(`${x.key} ${model}: HTTP ${response.status}`);
    const result=await response.json();
    matches[model]={audio_id:result.audio_id,
      segments:result.segments?.map(s=>({from:s.ref_from,to:s.ref_to,
        start_ms:Math.round(p.off+s.time_from*1000),end_ms:Math.round(p.off+s.time_to*1000),
        confidence:s.confidence,missing:s.has_missing_words,repeated:s.has_repeated_words}))};
    console.log(JSON.stringify({key:x.key,model,segments:matches[model].segments}));
  }
  out.push({key:x.key,source_url:`https://download.quranicaudio.com/qdc/abdurrahmaan_as_sudais/murattal/${x.sid}.mp3`,
    source_sha256:sha256,excerpt:[p.off,p.off+p.channelData[0].length/p.sampleRate*1000],
    wav_sha256:wavSha256,matches});
  fs.writeFileSync(outputPath,JSON.stringify(out,null,2)+'\n');
}
