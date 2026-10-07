// One public-URL candidate alignment. Never import this response into production.
import fs from 'node:fs';
const endpoint='https://hetchyy-quranic-universal-aligner.hf.space/api/v1/align/url';
const url='https://everyayah.com/data/Husary_Muallim_128kbps/002145.mp3';
const request={url,riwayah:'hafs',model_name:'Large',device:'GPU'};
const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},
  body:JSON.stringify(request),signal:AbortSignal.timeout(180000)});
const raw=await response.text();
if(!response.ok){
  console.error(JSON.stringify({http_status:response.status,response:raw.slice(0,2000)}));
  process.exitCode=1;
}else{
  const result=JSON.parse(raw);
  const candidate={status:'unverified-review-only',verse_key:'2:145',
    source_url:url,source_sha256_observed_local:'cc4640fa78a211b598a6e5f47880a5ff39112d3f8279d5260f860f1e1a1cad28',
    api_endpoint:endpoint,request:{riwayah:request.riwayah,model_name:request.model_name,device:request.device},
    received_at_utc:new Date().toISOString(),response:result};
  const output=new URL('./husary-2145-qud-candidate.json',import.meta.url);
  fs.writeFileSync(output,JSON.stringify(candidate,null,2)+'\n');
  console.log(JSON.stringify({output:output.pathname,device:result.device,warning:result.warning,
    audio_id:result.audio_id,segments:Array.isArray(result.segments)?result.segments.length:null},null,2));
}
