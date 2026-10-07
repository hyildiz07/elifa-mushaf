import fs from 'node:fs';
const dir='test-results/review-sudais-qdc-verse-ends';
for(const key of ['3-160','4-143','5-5']){
  const original=JSON.parse(fs.readFileSync(`${dir}/${key}-sequential.json`,'utf8'));
  const wav=fs.readFileSync(original.wav_file);
  const form=new FormData();form.set('audio',new Blob([wav],{type:'audio/wav'}),`${key}.wav`);
  form.set('model_name','Base');form.set('riwayah','hafs');
  const response=await fetch('https://hetchyy-quranic-universal-aligner.hf.space/api/v1/align/audio',
    {method:'POST',body:form,signal:AbortSignal.timeout(180000)});
  const result=await response.json();
  const report={key:original.key,method:'sequential MP3 decode from byte zero; QUD Base independent model',
    source_file:original.source_file,requested_window_ms:original.requested_window_ms,
    actual_window_ms:original.actual_window_ms,wav_file:original.wav_file,status:response.status,result};
  fs.writeFileSync(`${dir}/${key}-base.json`,JSON.stringify(report,null,2));
  const off=original.actual_window_ms[0];
  console.log(JSON.stringify({key,status:response.status,segments:result.segments?.map(x=>({from:x.ref_from,to:x.ref_to,
    ms:[Math.round(off+x.time_from*1000),Math.round(off+x.time_to*1000)],confidence:x.confidence}))}));
}
