import fs from 'node:fs';
import crypto from 'node:crypto';
for(const surah of [3,4,5]){
  const file=fs.readFileSync(`test-results/sudais-qdc-${surah}.mp3`);
  const url=`https://download.quranicaudio.com/qdc/abdurrahmaan_as_sudais/murattal/${surah}.mp3`;
  const starts=[0,Math.floor(file.length/2),file.length-65536];
  const checks=[];
  for(const start of starts){
    const end=Math.min(file.length-1,start+65535);
    const response=await fetch(url,{headers:{Range:`bytes=${start}-${end}`},signal:AbortSignal.timeout(20000)});
    const bytes=Buffer.from(await response.arrayBuffer());
    checks.push({range:[start,end],status:response.status,contentRange:response.headers.get('content-range'),
      same:response.status===206&&bytes.equals(file.subarray(start,end+1)),
      remoteSha256:crypto.createHash('sha256').update(bytes).digest('hex')});
  }
  console.log(JSON.stringify({surah,url,localSize:file.length,allMatch:checks.every(x=>x.same),checks}));
}
