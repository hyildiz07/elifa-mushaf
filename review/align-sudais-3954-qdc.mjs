// Review only: align the exact Sudais chapter recording around the repeated 39:54.
import fs from 'node:fs';
import {prepareWindow} from '../src/split-audio.mjs';

const af=JSON.parse(fs.readFileSync('test-results/timings/3-39.json','utf8'));
const verse=af.verse_timings.find(row=>row.verse_key==='39:54');
const next=af.verse_timings.find(row=>row.verse_key==='39:55');
if(!verse||!next)throw Error('Missing chapter timing');
const context={createBuffer(channels,length,sampleRate){
  const data=Array.from({length:channels},()=>new Float32Array(length));
  return {numberOfChannels:channels,length,sampleRate,duration:length/sampleRate,
    copyToChannel(values,index){data[index].set(values);},getChannelData(index){return data[index];}};
}};
const pcm=await prepareWindow({sourceUrl:af.audio_url,reciterId:3,
  verseRanges:{54:[verse.timestamp_from,verse.timestamp_to],55:[next.timestamp_from,next.timestamp_to]},
  verseSegments:{54:verse.segments}},54,context,{positions:[]});
const rate=pcm.buffer.sampleRate,from=verse.timestamp_from-1000,to=verse.timestamp_to+1000;
if(pcm.off>from||pcm.off+pcm.buffer.duration*1000<to)throw Error('PCM window incomplete');
const start=Math.round((from-pcm.off)*rate/1000),frames=Math.round((to-from)*rate/1000);
const wav=Buffer.alloc(44+frames*2);
wav.write('RIFF',0);wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);
wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);
wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);
wav.write('data',36);wav.writeUInt32LE(frames*2,40);
for(let i=0;i<frames;i++){
  const value=pcm.buffer.getChannelData(0)[start+i];
  wav.writeInt16LE(Math.max(-32768,Math.min(32767,Math.round(value*32767))),44+i*2);
}
fs.mkdirSync('test-results/review-sudais-3954',{recursive:true});
fs.writeFileSync('test-results/review-sudais-3954/source.wav',wav);
for(const model of ['Large','Base']){
  const form=new FormData();form.set('audio',new Blob([wav],{type:'audio/wav'}),'sudais-39-54.wav');
  form.set('model_name',model);form.set('riwayah','hafs');
  const response=await fetch('https://hetchyy-quranic-universal-aligner.hf.space/api/v1/align/audio',
    {method:'POST',body:form,signal:AbortSignal.timeout(180000)});
  const result=await response.json();
  const report={status:'review-only',model,source_url:af.audio_url,excerpt_from_ms:from,
    excerpt_to_ms:to,response_status:response.status,result};
  fs.writeFileSync(`review/sudais-3954-qdc-${model.toLowerCase()}.json`,JSON.stringify(report,null,2)+'\n');
  console.log(model,JSON.stringify(result.segments?.map(s=>({from:s.ref_from,to:s.ref_to,
    audio:[s.time_from,s.time_to],confidence:s.confidence,repeated:s.has_repeated_words}))));
}
