// Research-only work queue. No QUL word times or production audio overrides
// are written here; source matches are merely places to examine first.
import fs from 'node:fs';
import crypto from 'node:crypto';

const triage=JSON.parse(fs.readFileSync('review/sudais-batch-structural-triage-2026-09-30.json','utf8'));
const identity34=JSON.parse(fs.readFileSync('review/sudais-qdc-qul-verse-screen-2026-09-30.json','utf8'));
const identity529=JSON.parse(fs.readFileSync('review/sudais-qdc-qul-5-28-29-identity-screen.json','utf8'));
const priority=new Set(['3:160','4:143','5:5','5:46','5:82','28:44','29:45','29:46']);
const queues={sourceAndShape:[],repeatOrLabel:[],directQdcAlign:[]};

for(const [chapterText,data] of Object.entries(triage.chapters)){
  const chapter=Number(chapterText);
  const identity=(chapter===3||chapter===4?identity34:identity529).chapters[chapter];
  const sourceSha256=identity.qdcSha256;
  const exactQdcSource=`test-results/sudais-qdc-${chapter}.mp3`;
  const actualSha256=crypto.createHash('sha256').update(fs.readFileSync(exactQdcSource)).digest('hex');
  if(actualSha256!==sourceSha256)throw Error(`Chapter ${chapter} source SHA mismatch`);
  if(data.rows.length!==identity.rows.length)throw Error(`Chapter ${chapter} row mismatch`);
  for(let index=0;index<data.rows.length;index++){
    const row=data.rows[index],match=identity.rows[index];
    if(row.key!==match.key)throw Error(`Row ${index} key mismatch`);
    const offsets=(chapter===3||chapter===4?match.anchors.map(a=>a.shiftMs):match.anchors.map(a=>a.offsetMs))
      .filter(Number.isFinite).sort((a,b)=>a-b);
    const medianOffsetMs=row.sourceMatched?offsets[Math.floor(offsets.length/2)]:null;
    if(row.sourceMatched&&!Number.isFinite(medianOffsetMs))throw Error(`${row.key} matched without a finite source offset`);
    const job={verse:row.key,chapter,ayah:index+1,priority:priority.has(row.key)?'reported-or-boundary-sample':'normal',
      exactQdcSource,sourceSha256,
      canonicalWords:row.canonicalWords,sourceMatched:row.sourceMatched,
      medianSourceOffsetMs:medianOffsetMs,wordShapeReasons:row.reasons};
    const queue=row.sourceAndStructureCandidate?'sourceAndShape':
      row.sourceMatched?'repeatOrLabel':'directQdcAlign';
    queues[queue].push(job);
  }
}
for(const rows of Object.values(queues))rows.sort((a,b)=>
  Number(b.priority==='reported-or-boundary-sample')-Number(a.priority==='reported-or-boundary-sample')||
  a.chapter-b.chapter||a.ayah-b.ayah);
const counts=Object.fromEntries(Object.entries(queues).map(([key,rows])=>[key,rows.length]));
if(counts.sourceAndShape!==429||counts.repeatOrLabel!==90||counts.directQdcAlign!==134)
  throw Error(`Unexpected queue totals: ${JSON.stringify(counts)}`);
const result={status:'review-only-no-cut-approval',
  meaning:{sourceAndShape:'source waveform and canonical shape only; every cut still needs independent verification',
    repeatOrLabel:'source waveform matched, repetition or provider labels need resolving',
    directQdcAlign:'no full-verse source match in bounded screen; align exact QDC recording independently'},
  counts,queues};
fs.writeFileSync('review/sudais-alignment-queue-2026-09-30.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(counts));
