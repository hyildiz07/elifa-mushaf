import fs from 'node:fs';
const dir='test-results/review-sudais-qdc-verse-ends';
for(const [key,suffix] of [['3-160','real-search'],['4-143','real-search'],['5-5','sequential']]){
  const source=JSON.parse(fs.readFileSync(`${dir}/${key}-${suffix}.json`,'utf8'));
  const id=source.result.audio_id;
  if(!id){console.log(JSON.stringify({key,error:'No session id'}));continue;}
  const response=await fetch(`https://hetchyy-quranic-universal-aligner.hf.space/api/v1/sessions/${id}/timestamps`,
    {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({granularity:'words'}),
      signal:AbortSignal.timeout(180000)});
  const result=await response.json();
  const report={key:source.key,source:source.source_file,source_window_ms:source.actual_window_ms,
    session_id:id,status:response.status,review_only:true,result};
  fs.writeFileSync(`${dir}/${key}-words-candidate.json`,JSON.stringify(report,null,2));
  console.log(JSON.stringify({key,status:response.status,segmentCount:result.segments?.length,
    first:result.segments?.[0],error:result.error||result.code||null}).slice(0,1200));
}
