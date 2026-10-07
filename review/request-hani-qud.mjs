// One public-source QUD³ alignment candidate per invocation; review only.
import fs from 'node:fs';
import crypto from 'node:crypto';

const verse=process.argv[2];
const device=process.argv[3]||'GPU';
const names={'34:46':'034046','34:47':'034047','6:139':'006139','6:140':'006140','6:141':'006141'};
if(!names[verse])throw Error('Use 34:46, 34:47, 6:139, 6:140 or 6:141');
if(!['GPU','CPU'].includes(device))throw Error('Use GPU or CPU');
const source=`https://everyayah.com/data/Hani_Rifai_192kbps/${names[verse]}.mp3`;
const endpoint='https://hetchyy-quranic-universal-aligner.hf.space/api/v1/align/url';
const audioResponse=await fetch(source,{signal:AbortSignal.timeout(30000)});
if(!audioResponse.ok)throw Error(`Source HTTP ${audioResponse.status}`);
const bytes=Buffer.from(await audioResponse.arrayBuffer());
const sha256=crypto.createHash('sha256').update(bytes).digest('hex');
const request={url:source,riwayah:'hafs',model_name:'Large',device};
const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},
  body:JSON.stringify(request),signal:AbortSignal.timeout(180000)});
const raw=await response.text();
if(!response.ok)throw Error(`Align HTTP ${response.status}: ${raw.slice(0,1200)}`);
const result=JSON.parse(raw);
const candidate={status:'unverified-review-only',verse_key:verse,source_url:source,
  source_bytes:bytes.length,source_sha256:sha256,api_endpoint:endpoint,
  request:{riwayah:'hafs',model_name:'Large',device},
  received_at_utc:new Date().toISOString(),response:result};
const output=new URL(`./hani-${names[verse]}-qud-candidate.json`,import.meta.url);
fs.writeFileSync(output,JSON.stringify(candidate,null,2)+'\n');
console.log(JSON.stringify({verse,output:output.pathname,audio_id:result.audio_id,
  device:result.device,warning:result.warning,segments:result.segments?.length??null,
  word_timestamp_count:result.word_timestamps?.length??null},null,2));
