// Research-only reachability audit of the exact chapter URLs in local timing metadata.
// HEAD reads response headers, not the MP3 body. It cannot certify a word boundary.
import fs from 'node:fs';

const files=fs.readdirSync('test-results/timings').filter(name=>/^\d+-\d+\.json$/.test(name));
const candidates=files.map(file=>{
  const verified=`assets/verified-audio/${file}`;
  const selected=fs.existsSync(verified)?verified:`test-results/timings/${file}`;
  const data=JSON.parse(fs.readFileSync(selected,'utf8'));
  return {file,selected,url:data.audio_url,metadataBytes:data.file_size??null};
});
const results=[];
let next=0;
async function inspect(item){
  for(let attempt=1;attempt<=3;attempt++){
    try{
      const response=await fetch(item.url,{method:'HEAD',signal:AbortSignal.timeout(12000)});
      const rawBytes=response.headers.get('content-length');
      const bytes=rawBytes===null?null:Number(rawBytes);
      if((response.status===429||response.status>=500)&&attempt<3){
        await new Promise(resolve=>setTimeout(resolve,250*attempt));continue;
      }
      return {...item,status:response.status,bytes:Number.isSafeInteger(bytes)?bytes:null,
        metadataByteMismatch:Number.isSafeInteger(bytes)&&Number.isSafeInteger(item.metadataBytes)&&bytes!==item.metadataBytes};
    }catch(error){
      if(attempt===3)return {...item,error:`${error?.name||'Error'}: ${error?.message||error}`};
      await new Promise(resolve=>setTimeout(resolve,250*attempt));
    }
  }
}
async function worker(){
  while(next<candidates.length){
    const index=next++;
    results[index]=await inspect(candidates[index]);
    if((index+1)%200===0)console.log(JSON.stringify({checked:results.filter(Boolean).length,total:candidates.length}));
  }
}
await Promise.all(Array.from({length:4},worker));
const failures=results.filter(row=>row.error||row.status!==200||!Number.isSafeInteger(row.bytes)||row.bytes<=0);
const report={checkedAt:new Date().toISOString(),total:results.length,ok:results.length-failures.length,
  failures,metadataByteMismatch:results.filter(row=>row.metadataByteMismatch).map(row=>({file:row.file,selected:row.selected,metadataBytes:row.metadataBytes,bytes:row.bytes})),
  byStatus:Object.fromEntries([...new Set(results.map(row=>row.status??row.error))].map(key=>
    [key,results.filter(row=>(row.status??row.error)===key).length]))};
fs.writeFileSync('review/live-chapter-url-audit-2026-09-30.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({total:report.total,ok:report.ok,failures:report.failures.length,metadataByteMismatch:report.metadataByteMismatch.length,byStatus:report.byStatus}));
