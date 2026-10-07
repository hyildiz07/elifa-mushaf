// Measure how much of each matched alternative's extra file time has energy.
import {readFile,writeFile} from 'node:fs/promises';
import {MPEGDecoder} from 'mpg123-decoder';
const root=new URL('../',import.meta.url);
const input=JSON.parse(await readFile(new URL('test-results/priority-alternative-tails.json',root)));
const rows=Object.values(input.items).flatMap(r=>(r.alternatives||[])
  .filter(a=>a.extraAudioCandidate).map(a=>({reciter:r.reciter,verse:r.verse,...a})));
const result=[];
for(const row of rows){
  const h=await fetch(row.url,{method:'HEAD',signal:AbortSignal.timeout(20000)});
  if(!h.ok)throw Error(`${row.url} HEAD ${h.status}`);
  const size=Number(h.headers.get('content-length')),start=Math.max(0,size-1_500_000);
  const r=await fetch(row.url,{headers:{Range:`bytes=${start}-${size-1}`},signal:AbortSignal.timeout(30000)});
  if(r.status!==206)throw Error(`${row.url} range ${r.status}`);
  const decoder=new MPEGDecoder();await decoder.ready;
  try{
    const pcm=decoder.decode(new Uint8Array(await r.arrayBuffer()));
    const samples=pcm.channelData[0],rate=pcm.sampleRate,
      extensionSamples=Math.round(row.extensionMs*rate/1000),limit=Math.min(extensionSamples,Math.round(3000*rate/1000));
    const blocks=[];
    for(let from=0;from<limit;from+=Math.round(.25*rate)){
      const to=Math.min(limit,from+Math.round(.25*rate));let sum=0;
      for(let i=samples.length-extensionSamples+from;i<samples.length-extensionSamples+to;i++)sum+=samples[i]*samples[i];
      blocks.push({fromMs:from/rate*1000,toMs:to/rate*1000,rms:Math.sqrt(sum/(to-from))});
    }
    result.push({reciter:row.reciter,verse:row.verse,url:row.url,bytes:size,
      extensionMs:row.extensionMs,identityCorrelation:row.eofWindow.correlation,blocks});
  }finally{await decoder.free();}
}
await writeFile(new URL('test-results/priority-alternative-tail-profiles.json',root),JSON.stringify(result,null,2)+'\n');
for(const row of result)console.log(`${row.reciter}:${row.verse} +${Math.round(row.extensionMs)}ms`,
  row.blocks.map(x=>x.rms.toFixed(4)).join(','));
