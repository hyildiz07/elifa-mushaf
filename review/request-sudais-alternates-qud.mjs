// Review-only alignment of public alternative verse files. Do not import into production.
import fs from 'node:fs';
const endpoint='https://hetchyy-quranic-universal-aligner.hf.space/api/v1/align/url';
const verses=['4:134','5:82'];
for(const verse of verses){
  const [surah,ayah]=verse.split(':').map(Number);
  const url=`https://everyayah.com/data/Abdurrahmaan_As-Sudais_192kbps/${String(surah).padStart(3,'0')}${String(ayah).padStart(3,'0')}.mp3`;
  const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({url,riwayah:'hafs',model_name:'Large',device:'GPU'}),
    signal:AbortSignal.timeout(180000)});
  const raw=await response.text();
  if(!response.ok)throw Error(`${verse}: HTTP ${response.status}: ${raw.slice(0,300)}`);
  const result=JSON.parse(raw);
  const candidate={status:'unverified-review-only',verse,url,endpoint,
    received_at_utc:new Date().toISOString(),result};
  const output=new URL(`./sudais-${surah}-${ayah}-qud-candidate.json`,import.meta.url);
  fs.writeFileSync(output,JSON.stringify(candidate,null,2)+'\n');
  console.log(JSON.stringify({verse,audio_id:result.audio_id,segments:result.segments?.map(s=>({
    from:s.time_from,to:s.time_to,ref_from:s.ref_from,ref_to:s.ref_to,
    confidence:s.confidence,has_missing_words:s.has_missing_words,
    has_repeated_words:s.has_repeated_words}))}));
}
