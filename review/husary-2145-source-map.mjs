// Read-only source comparison for human review. Never emits production timings.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const html=fs.readFileSync(new URL('../docs/husary-muallim-2-145-review.html',import.meta.url),'utf8');
const marker='<script id="review-data" type="application/json">';
const begin=html.indexOf(marker);
if(begin<0)throw Error('Review audio metadata missing');
const from=begin+marker.length,end=html.indexOf('</script>',from);
if(end<0)throw Error('Review metadata unterminated');
const review=JSON.parse(html.slice(from,end));
const expectedHash='cc4640fa78a211b598a6e5f47880a5ff39112d3f8279d5260f860f1e1a1cad28';
if(review.audio_sha256!==expectedHash)throw Error('Review page refers to changed audio bytes');
const archive=new URL('../test-results/cpfair-align.zip',import.meta.url);
const raw=execFileSync('tar',['-xOf',fileURLToPath(archive),'Husary_Muallim_128kbps.json'],{maxBuffer:8_000_000});
const cpfair=JSON.parse(raw.toString()).find(row=>row.surah===2&&row.ayah===145);
if(!cpfair||review.words.length!==32)throw Error('Expected complete 2:145 source metadata');
const timeline=review.qf_segments.map(row=>({...row})).sort((a,b)=>a.from_ms-b.from_ms);
const runs=[];
for(const row of timeline){
  const previous=runs.at(-1);
  if(previous&&row.word===previous.to_word+1&&row.from_ms-previous.to_ms<=1000){
    previous.to_word=row.word;previous.to_ms=row.to_ms;previous.count++;
  }else runs.push({from_word:row.word,to_word:row.word,from_ms:row.from_ms,to_ms:row.to_ms,count:1});
}
const spans=[];
let cursor=0;
for(const row of timeline){
  if(row.from_ms-cursor>=250)spans.push({from_ms:cursor,to_ms:row.from_ms,duration_ms:row.from_ms-cursor});
  cursor=Math.max(cursor,row.to_ms);
}
if(review.duration_ms-cursor>=250)spans.push({from_ms:cursor,to_ms:review.duration_ms,duration_ms:review.duration_ms-cursor});
const positions=new Set(timeline.map(row=>row.word));
const missing=review.words.map((_,i)=>i+1).filter(word=>!positions.has(word));
const wordComparison=review.words.map((text,i)=>{
  const position=i+1,qf=timeline.filter(row=>row.word===position).map(row=>[row.from_ms,row.to_ms]);
  const cpfairRow=cpfair.segments.find(row=>row[1]===position);
  const cpfairSpan=cpfairRow?[cpfairRow[2],cpfairRow[3]]:null;
  const nearestStartDelta=cpfairSpan&&qf.length?
    Math.min(...qf.map(span=>Math.abs(span[0]-cpfairSpan[0]))):null;
  return {position,text,qf_occurrences:qf,cpfair_span:cpfairSpan,
    nearest_start_difference_ms:nearestStartDelta};
});
const quality={qf_missing_positions:missing,qf_last_ms:cursor,
  cpfair_stats:cpfair.stats,cpfair_last_ms:Math.max(...cpfair.segments.map(row=>row[3])),
  both_sources_near_start_250ms:wordComparison.filter(row=>row.nearest_start_difference_ms!=null&&
    row.nearest_start_difference_ms<=250).length,
  both_end_early:cursor<review.duration_ms-2000&&
    Math.max(...cpfair.segments.map(row=>row[3]))<review.duration_ms-2000};
const result={status:'unverified-review-only',verse_key:'2:145',audio_url:review.audio_url,
  audio_bytes:review.audio_bytes,
  audio_sha256:review.audio_sha256,
  duration_ms:review.duration_ms,words:review.words,quality,word_comparison:wordComparison,qf_runs:runs,
  qf_unlabeled_spans:spans,quiet_candidates:review.quiet_candidates,
  cpfair_segments:cpfair.segments};
const out=new URL('./husary-2145-source-map.json',import.meta.url);
fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({output:out.pathname,quality,runs,unlabeled:spans},null,2));
