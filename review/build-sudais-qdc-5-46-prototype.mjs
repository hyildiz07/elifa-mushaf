// Review-only prototype: source-matched word positions for Sudais 5:46.
// Base and Large agreement is necessary, but does not replace audition.
import fs from 'node:fs';

const base='review/sudais-qdc-align/5-46-to-47-';
const model=label=>({align:JSON.parse(fs.readFileSync(`${base}${label}-align.json`,'utf8')),
  words:JSON.parse(fs.readFileSync(`${base}${label}-words.json`,'utf8'))});
const large=model('full'),small=model('full-base');
const flatten=record=>record.align.aligner.segments.flatMap((segment,i)=>
  (record.words.result.segments[i]?.words||[]).filter(w=>w[0].startsWith('5:46:'))
    .map(([key,from,to])=>({key,position:Number(key.split(':')[2]),
      from_ms:Math.round(record.align.excerpt_from_ms+(segment.time_from+from)*1000),
      to_ms:Math.round(record.align.excerpt_from_ms+(segment.time_from+to)*1000)})));
const a=flatten(large),b=flatten(small);
if(a.length!==27||b.length!==a.length||a.some((x,i)=>x.key!==b[i].key||
  Math.abs(x.from_ms-b[i].from_ms)>20||Math.abs(x.to_ms-b[i].to_ms)>20))
  throw Error('Independent model timing disagreement');
const expected=[...Array.from({length:24},(_,i)=>i+1),24,25,26];
if(a.some((x,i)=>x.position!==expected[i]||x.to_ms<=x.from_ms))
  throw Error('Canonical 1–26 with repeated 24 not recovered');
const audio=fs.readFileSync('test-results/sudais-qdc-align/5-46-to-47.wav');
if(audio.toString('ascii',0,4)!=='RIFF')throw Error('Missing exact-source WAV');
const rate=audio.readUInt32LE(24),channels=audio.readUInt16LE(22),from=large.align.excerpt_from_ms;
function rms(at,duration=20){const lo=Math.max(0,Math.floor((at-from)*rate/1000)),
  hi=Math.min((audio.length-44)/channels/2,Math.ceil((at+duration-from)*rate/1000));
  let max=0;for(let c=0;c<channels;c++){let sum=0;
    for(let i=lo;i<hi;i++){const x=audio.readInt16LE(44+(i*channels+c)*2)/32768;sum+=x*x;}
    max=Math.max(max,Math.sqrt(sum/Math.max(1,hi-lo)));}return max;}
const cuts=[6,12,17,23].map(position=>{
  const left=a.findLast(w=>w.position===position),right=a.find(w=>w.position===position+1);
  const midpoint=Math.round((left.to_ms+right.from_ms)/2),
    energy=Array.from({length:11},(_,i)=>({at_ms:midpoint-100+i*20,rms:+rms(midpoint-100+i*20).toFixed(5)}));
  return {after_word:position,left_end_ms:left.to_ms,right_start_ms:right.from_ms,
    gap_ms:right.from_ms-left.to_ms,midpoint_ms:midpoint,
    minimum_20ms_energy:energy.reduce((x,y)=>y.rms<x.rms?y:x),
    status:'candidate-needs-two-sided-audition'};
});
const out={status:'review-only-not-for-production',verse:'5:46',
  source_url:large.align.source_url,source_sha256:large.align.source_sha256,
  excerpt_from_ms:large.align.excerpt_from_ms,excerpt_to_ms:large.align.excerpt_to_ms,
  models:['Large','Base'],model_agreement_max_ms:20,
  canonical_positions:26,spoken_positions:27,repeated_position:24,
  model_verse_start_ms:large.align.excerpt_from_ms+18200,
  model_verse_end_ms:large.align.excerpt_from_ms+40627,
  model_next_verse_start_ms:large.align.excerpt_from_ms+40657,
  proposed_parts:[6,6,5,6,3],words:a,cuts,
  blockers:['Four internal cuts still require two-sided listening for complete syllables and no leakage.',
    'Machine models may agree because they share the same alignment pipeline.',
    'Chapter-wide source-matched timing remains ungenerated and unreviewed.']};
fs.writeFileSync('review/sudais-qdc-align/5-46-prototype.json',JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({word_count:a.length,parts:out.proposed_parts,cuts,verse_start:out.model_verse_start_ms,
  verse_end:out.model_verse_end_ms,next_start:out.model_next_verse_start_ms}));
