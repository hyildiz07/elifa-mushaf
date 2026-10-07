import fs from 'node:fs';
import {decodeWindow} from '../src/split-audio.mjs';
const targets=[{s:3,a:160,from:2630000,to:2683000},
  {s:4,a:143,from:2900000,to:3046000}];
const dir='test-results/review-sudais-qdc-verse-ends';
function wav(p){const rate=22050,step=p.sampleRate/rate,ch=p.channelData[0];
  const frames=Math.floor(ch.length/step),out=Buffer.alloc(44+frames*2);
  out.write('RIFF',0);out.writeUInt32LE(out.length-8,4);out.write('WAVEfmt ',8);
  out.writeUInt32LE(16,16);out.writeUInt16LE(1,20);out.writeUInt16LE(1,22);
  out.writeUInt32LE(rate,24);out.writeUInt32LE(rate*2,28);out.writeUInt16LE(2,32);out.writeUInt16LE(16,34);
  out.write('data',36);out.writeUInt32LE(frames*2,40);
  for(let i=0;i<frames;i++){const j=Math.floor(i*step),k=Math.min(ch.length-1,Math.floor((i+1)*step));
    out.writeInt16LE(Math.max(-32768,Math.min(32767,Math.round((ch[j]+ch[k])/2*32767))),44+i*2);}return out;}
for(const x of targets){const key=`${x.s}:${x.a}`;
  const p=await decodeWindow(new Blob([fs.readFileSync(`test-results/sudais-qdc-${x.s}.mp3`)]).stream(),x.from,x.to);
  const bytes=wav(p),name=`${dir}/${x.s}-${x.a}-real-search.wav`;fs.writeFileSync(name,bytes);
  const form=new FormData();form.set('audio',new Blob([bytes],{type:'audio/wav'}),`${x.s}-${x.a}.wav`);
  form.set('model_name','Large');form.set('riwayah','hafs');
  const response=await fetch('https://hetchyy-quranic-universal-aligner.hf.space/api/v1/align/audio',
    {method:'POST',body:form,signal:AbortSignal.timeout(180000)});
  const result=await response.json(),report={key,method:'sequential MP3 decode from byte zero',
    source_file:`test-results/sudais-qdc-${x.s}.mp3`,actual_window_ms:[p.off,p.off+p.channelData[0].length/p.sampleRate*1000],
    wav_file:name,status:response.status,result};
  fs.writeFileSync(`${dir}/${x.s}-${x.a}-real-search.json`,JSON.stringify(report,null,2));
  console.log(JSON.stringify({key,status:response.status,segments:result.segments?.map(z=>({from:z.ref_from,to:z.ref_to,
    ms:[Math.round(p.off+z.time_from*1000),Math.round(p.off+z.time_to*1000)],confidence:z.confidence}))}));
}
