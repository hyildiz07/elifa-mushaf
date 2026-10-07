// Research-only join of source-identity screening and canonical word-shape
// checks. No result approves an audio cut or writes production timing data.
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync('index.html','utf8');
const at=html.indexOf('const QTEXT=');
if(at<0)throw Error('QTEXT missing');
const text=vm.runInNewContext(`${html.slice(at,html.indexOf('\n',at))};QTEXT`);
const source34=JSON.parse(fs.readFileSync('review/sudais-qdc-qul-verse-screen-2026-09-30.json','utf8'));
const source529=JSON.parse(fs.readFileSync('review/sudais-qdc-qul-5-28-29-identity-screen.json','utf8'));
const counts={3:200,4:176,5:120,28:88,29:69};

function wordShape(row,count){
  if(!row||!Array.isArray(row.segments))return ['missing-row'];
  const positions=row.segments.map(s=>s[0]),seen=new Set(positions),reasons=[];
  if(Array.from({length:count},(_,i)=>i+1).some(pos=>!seen.has(pos)))reasons.push('missing-position');
  if(positions.some(pos=>!Number.isInteger(pos)||pos<1||pos>count))reasons.push('outside-position');
  if(row.segments.some(s=>s[2]<s[1]||s[1]<row.time_from-1000||s[2]>row.time_to+1000))reasons.push('time-outside-verse');
  if(row.segments.some((s,i)=>i&&s[1]<row.segments[i-1][1]))reasons.push('time-regression');
  if(positions.some((pos,i)=>i&&pos<positions[i-1]))reasons.push('repeat-or-label-regression');
  return reasons;
}

const report={status:'research-only-no-cut-approval',chapters:{}};
for(const [chapterText,total] of Object.entries(counts)){
  const chapter=Number(chapterText),identity=chapter===3||chapter===4?
    source34.chapters[chapter]:source529.chapters[chapter];
  const timing=JSON.parse(fs.readFileSync(`test-results/sudais-qul-timings-${chapter}.json`,'utf8'));
  if(identity.rows.length!==total)throw Error(`${chapter}: incomplete identity screening`);
  const rows=[];
  for(let ay=1;ay<=total;ay++){
    const key=`${chapter}:${ay}`,matched=identity.rows[ay-1];
    if(matched.key!==key)throw Error(`${key}: screening order changed`);
    const canonical=text[chapter][ay-1][2].filter(word=>word[1]===0).length;
    const reasons=wordShape(timing.segments[key],canonical);
    const sourceMatched=chapter===3||chapter===4?
      matched.anchors.length===3&&matched.anchors.every(a=>a.correlation>=.95&&a.shiftMs===0):
      matched.sameRecording;
    rows.push({key,sourceMatched,canonicalWords:canonical,
      timingRows:timing.segments[key]?.segments?.length??0,
      structuralCandidate:reasons.length===0,
      sourceAndStructureCandidate:sourceMatched&&reasons.length===0,reasons});
  }
  report.chapters[chapter]={total,sourceMatched:rows.filter(x=>x.sourceMatched).length,
    structuralCandidates:rows.filter(x=>x.structuralCandidate).length,
    sourceAndStructureCandidates:rows.filter(x=>x.sourceAndStructureCandidate).length,
    rows};
  console.log(JSON.stringify({chapter,total,...Object.fromEntries(['sourceMatched','structuralCandidates','sourceAndStructureCandidates'].map(k=>[k,report.chapters[chapter][k]]))}));
}
fs.writeFileSync('review/sudais-batch-structural-triage-2026-09-30.json',JSON.stringify(report,null,2)+'\n');
