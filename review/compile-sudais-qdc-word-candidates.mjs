import fs from 'node:fs';
const dir='test-results/review-sudais-qdc-verse-ends',rows={};
for(const [key,suffix] of [['3-160','real-search'],['4-143','real-search'],['5-5','sequential']]){
  const source=JSON.parse(fs.readFileSync(`${dir}/${key}-${suffix}.json`,'utf8'));
  const timed=JSON.parse(fs.readFileSync(`${dir}/${key}-words-candidate.json`,'utf8'));
  const off=source.actual_window_ms[0],verseKey=source.key,words=[];
  for(const item of timed.result.segments||[]){
    const segment=source.result.segments.find(x=>x.segment===item.segment);
    if(!segment||item.timing_status!=='ok')continue;
    for(const [ref,from,to] of item.words||[]){
      if(!ref.startsWith(`${verseKey}:`))continue;
      words.push([Number(ref.split(':')[2]),
        Math.round(off+(segment.time_from+from)*1000),
        Math.round(off+(segment.time_from+to)*1000)]);
    }
  }
  rows[verseKey]={source_url:`https://download.quranicaudio.com/qdc/abdurrahmaan_as_sudais/murattal/${key.split('-')[0]}.mp3`,
    model_range_ms:[Math.round(off+source.result.segments.find(x=>x.ref_from.startsWith(`${verseKey}:`)).time_from*1000),
      Math.round(off+[...source.result.segments].reverse().find(x=>x.ref_to.startsWith(`${verseKey}:`)).time_to*1000)],
    words,unique_positions:[...new Set(words.map(x=>x[0]))],
    repeated_positions:words.map(x=>x[0]).filter((x,i,a)=>a.indexOf(x)!==i)};
}
const output={status:'review-only-not-a-production-override',method:'QUD Large verse recognition + external MFA word timing on exact QDC PCM',
  caution:'Word starts/ends and final phoneme have not been independently auditioned; no silent gap at model verse endpoints.',rows};
fs.writeFileSync('review/sudais-qdc-word-candidates-2026-09-30.json',JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify(Object.fromEntries(Object.entries(rows).map(([k,x])=>[k,{range:x.model_range_ms,
  rowCount:x.words.length,unique:x.unique_positions.length,repeated:x.repeated_positions}]))));
