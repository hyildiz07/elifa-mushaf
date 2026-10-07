import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync('index.html','utf8'),i=html.indexOf('const QTEXT=');
const QTEXT=vm.runInNewContext(`${html.slice(i,html.indexOf('\n',i))};QTEXT`);
const output={status:'review-only',chapters:{}};
for(const [surah,total] of [[3,200],[4,176]]){
  const doc=JSON.parse(fs.readFileSync(`test-results/sudais-qul-timings-${surah}.json`,'utf8'));
  const flagged=[],verseGaps=[];
  for(let ayah=1;ayah<=total;ayah++){
    const key=`${surah}:${ayah}`,v=doc.segments[key],segments=v.segments||[];
    const n=QTEXT[surah][ayah-1][2].filter(x=>x[1]===0).length;
    const p=segments.map(x=>x[0]);let next=1;
    for(const pos of p)if(pos===next)next++;
    const outside=segments.filter(x=>x[1]<v.time_from-150||x[2]>v.time_to+150||x[2]<x[1]);
    const nonmonotonic=segments.filter((x,j)=>j&&x[1]<segments[j-1][1]);
    const adjacent=doc.segments[`${surah}:${ayah+1}`];
    if(adjacent)verseGaps.push({key,gap_ms:adjacent.time_from-v.time_to});
    if(next!==n+1||outside.length||nonmonotonic.length)
      flagged.push({key,word_count:n,positions:p,canonical_order_complete:next===n+1,
        outside,nonmonotonic,range:[v.time_from,v.time_to]});
  }
  const gapValues=verseGaps.map(x=>x.gap_ms).sort((a,b)=>a-b);
  output.chapters[surah]={total_verses:total,flagged,
    interverse_gap:{min:gapValues[0],median:gapValues[Math.floor(gapValues.length/2)],max:gapValues.at(-1),
      negative:verseGaps.filter(x=>x.gap_ms<0),under_80ms:verseGaps.filter(x=>x.gap_ms<80),
      above_500ms:verseGaps.filter(x=>x.gap_ms>500).slice(0,30)}};
  console.log(JSON.stringify({surah,flagged:flagged.map(x=>x.key),gaps:output.chapters[surah].interverse_gap}).slice(0,4500));
}
fs.writeFileSync('review/sudais-qul-chapters-3-4-boundaries.json',JSON.stringify(output,null,2)+'\n');
