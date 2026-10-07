import fs from 'node:fs';

const evidence=JSON.parse(fs.readFileSync('test-results/sudais-small-gap-window-evidence.json'));
const output='test-results/sudais-small-gap-word-evidence.json';
const out=fs.existsSync(output)?JSON.parse(fs.readFileSync(output)):[];
const selected=process.argv.find(arg=>arg.startsWith('--key='))?.slice(6);
for(const row of evidence.filter(row=>!selected||row.key===selected)){
  if(out.some(x=>x.key===row.key))continue;
  const matches={};
  for(const model of ['Large','Base']){
    const audioId=row.matches[model]?.audio_id;
    if(!audioId)throw Error(`${row.key}: ${model} session missing`);
    const response=await fetch(`https://hetchyy-quranic-universal-aligner.hf.space/api/v1/sessions/${audioId}/timestamps`,
      {method:'POST',headers:{'content-type':'application/json'},
        body:JSON.stringify({granularity:'words'}),signal:AbortSignal.timeout(180000)});
    if(!response.ok)throw Error(`${row.key} ${model}: HTTP ${response.status}`);
    const result=await response.json();
    matches[model]={audio_id:audioId,segments:result.segments};
    console.log(JSON.stringify({key:row.key,model,segments:result.segments?.map(x=>({
      segment:x.segment,first:x.words?.[0],last:x.words?.at(-1),count:x.words?.length,
      status:x.timing_status}))}));
  }
  out.push({key:row.key,source_sha256:row.source_sha256,excerpt:row.excerpt,matches});
  fs.writeFileSync(output,JSON.stringify(out,null,2)+'\n');
}
