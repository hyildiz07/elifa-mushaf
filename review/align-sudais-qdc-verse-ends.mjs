import fs from 'node:fs';
import path from 'node:path';
import { prepareWindow } from '../src/split-audio.mjs';

const targets = [
  {surah:3, ayah:160, from:2607000, to:2634000},
  {surah:4, ayah:143, from:3038500, to:3061000},
  {surah:5, ayah:5, from:152000, to:205000},
];
const outDir=path.resolve('test-results/review-sudais-qdc-verse-ends');
fs.mkdirSync(outDir,{recursive:true});
const context={createBuffer(channels,length,rate){
  const data=Array.from({length:channels},()=>new Float32Array(length));
  return {sampleRate:rate,length,duration:length/rate,numberOfChannels:channels,
    copyToChannel(x,c){data[c].set(x);},getChannelData(c){return data[c];}};
}};
function wave(buffer){
  const rate=22050, input=buffer.getChannelData(0),step=buffer.sampleRate/rate;
  const frames=Math.floor(input.length/step),out=Buffer.alloc(44+frames*2);
  out.write('RIFF',0);out.writeUInt32LE(out.length-8,4);out.write('WAVEfmt ',8);
  out.writeUInt32LE(16,16);out.writeUInt16LE(1,20);out.writeUInt16LE(1,22);
  out.writeUInt32LE(rate,24);out.writeUInt32LE(rate*2,28);out.writeUInt16LE(2,32);out.writeUInt16LE(16,34);
  out.write('data',36);out.writeUInt32LE(frames*2,40);
  for(let i=0;i<frames;i++){
    const j=Math.floor(i*step),k=Math.min(input.length-1,Math.floor((i+1)*step));
    const value=(input[j]+input[k])/2;
    out.writeInt16LE(Math.max(-32768,Math.min(32767,Math.round(value*32767))),44+i*2);
  }
  return out;
}
for(const item of targets){
  const key=`${item.surah}:${item.ayah}`;
  const af=JSON.parse(fs.readFileSync(`test-results/timings/3-${item.surah}.json`,'utf8'));
  const audio={sourceUrl:af.audio_url,verifiedCbr:false,
    offlineBlob:new Blob([fs.readFileSync(`test-results/sudais-qdc-${item.surah}.mp3`)]),
    verseRanges:{[item.ayah]:[item.from,item.to]},verseSegments:{[item.ayah]:[]}};
  const prepared=await prepareWindow(audio,item.ayah,context,{positions:[]});
  const wav=wave(prepared.buffer),stem=`${item.surah}-${item.ayah}`;
  fs.writeFileSync(path.join(outDir,`${stem}.wav`),wav);
  const form=new FormData();form.set('audio',new Blob([wav],{type:'audio/wav'}),`${stem}.wav`);
  form.set('model_name','Large');form.set('riwayah','hafs');
  const response=await fetch('https://hetchyy-quranic-universal-aligner.hf.space/api/v1/align/audio',
    {method:'POST',body:form,signal:AbortSignal.timeout(180000)});
  const body=await response.text();let parsed;
  try{parsed=JSON.parse(body);}catch{parsed={unparsed:body.slice(0,1000)};}
  const result={key,source_url:af.audio_url,source_mp3:`test-results/sudais-qdc-${item.surah}.mp3`,
    source_window_ms:[prepared.off,prepared.off+prepared.buffer.duration*1000],
    wav_file:`test-results/review-sudais-qdc-verse-ends/${stem}.wav`,
    response_status:response.status,result:parsed};
  fs.writeFileSync(path.join(outDir,`${stem}.json`),JSON.stringify(result,null,2));
  console.log(JSON.stringify({key,status:response.status,segments:parsed.segments?.map(x=>({from:x.ref_from,to:x.ref_to,
    ms:[Math.round(prepared.off+x.time_from*1000),Math.round(prepared.off+x.time_to*1000)],
    confidence:x.confidence,error:x.error})),error:parsed.error||parsed.code||null}));
}
