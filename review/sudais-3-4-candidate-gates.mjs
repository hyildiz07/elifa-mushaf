// Review-only comparison. QUL boundaries are candidates, never production cuts.
import fs from 'node:fs';

const report={status:'review-only',chapters:{}};
for(const [surah,total] of [[3,200],[4,176]]){
  const qul=JSON.parse(fs.readFileSync(`test-results/sudais-qul-timings-${surah}.json`,'utf8')).segments;
  const qdc=JSON.parse(fs.readFileSync(`test-results/timings/3-${surah}.json`,'utf8')).verse_timings;
  const structural=JSON.parse(fs.readFileSync('review/sudais-qul-chapters-3-4-boundaries.json','utf8')).chapters[surah];
  const rejected=new Set(structural.flagged.map(x=>x.key));
  const rows=[];
  for(let ay=1;ay<=total;ay++){
    const key=`${surah}:${ay}`,a=qul[key],b=qdc.find(x=>x.verse_key===key);
    if(!a||!b)throw Error(`Missing ${key}`);
    const startDelta=a.time_from-b.timestamp_from,endDelta=a.time_to-b.timestamp_to;
    rows.push({key,structural_candidate:!rejected.has(key),start_delta_ms:startDelta,end_delta_ms:endDelta,
      provider_disjoint:a.time_to<b.timestamp_from||a.time_from>b.timestamp_to,
      provider_large_start_error:Math.abs(startDelta)>1000,
      provider_large_end_error:Math.abs(endDelta)>1000});
  }
  const absSorted=(field)=>rows.map(x=>Math.abs(x[field])).sort((a,b)=>a-b);
  const percentile=(vals,p)=>vals[Math.floor((vals.length-1)*p)];
  const starts=absSorted('start_delta_ms'),ends=absSorted('end_delta_ms');
  report.chapters[surah]={verse_count:total,structurally_eligible:rows.filter(x=>x.structural_candidate).length,
    structurally_rejected:structural.flagged.map(x=>x.key),
    provider_comparison:{start_abs_p50_ms:percentile(starts,.5),start_abs_p90_ms:percentile(starts,.9),
      start_abs_max_ms:starts.at(-1),end_abs_p50_ms:percentile(ends,.5),end_abs_p90_ms:percentile(ends,.9),
      end_abs_max_ms:ends.at(-1),disjoint_count:rows.filter(x=>x.provider_disjoint).length,
      start_gt_1s_count:rows.filter(x=>x.provider_large_start_error).length,
      end_gt_1s_count:rows.filter(x=>x.provider_large_end_error).length},
    largest_start_disagreements:[...rows].sort((a,b)=>Math.abs(b.start_delta_ms)-Math.abs(a.start_delta_ms)).slice(0,8),
    rows};
}
fs.writeFileSync('review/sudais-3-4-candidate-gates.json',JSON.stringify(report,null,2)+'\n');
for(const [surah,x] of Object.entries(report.chapters))console.log(JSON.stringify({surah,structurally_eligible:x.structurally_eligible,structurally_rejected:x.structurally_rejected,provider_comparison:x.provider_comparison,largest_start_disagreements:x.largest_start_disagreements}));
