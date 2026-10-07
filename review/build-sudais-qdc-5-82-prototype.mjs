// Review-only source-matched candidate for 5:82. Automatic agreement and
// acoustic energy do not certify either side of a word cut.
import fs from 'node:fs';

const base='review/sudais-qdc-align/5-82-to-84-';
const read=label=>({align:JSON.parse(fs.readFileSync(`${base}${label}-align.json`,'utf8')),
  words:JSON.parse(fs.readFileSync(`${base}${label}-words.json`,'utf8'))});
const large=read('full'),small=read('full-base');
if(large.align.source_sha256!==small.align.source_sha256||
  large.align.excerpt_sha256!==small.align.excerpt_sha256)throw Error('Source or excerpt mismatch');
const flatten=record=>record.align.aligner.segments.flatMap((group,i)=>
  (record.words.result.segments[i]?.words||[]).filter(w=>w[0].startsWith('5:82:'))
    .map(([key,from,to])=>({key,position:Number(key.split(':')[2]),
      from_ms:Math.round(record.align.excerpt_from_ms+(group.time_from+from)*1000),
      to_ms:Math.round(record.align.excerpt_from_ms+(group.time_from+to)*1000)})));
const a=flatten(large),b=flatten(small),expected=[...Array.from({length:23},(_,i)=>i+1),23,24,25,26];
if(a.length!==27||b.length!==a.length||a.some((x,i)=>x.position!==expected[i]||
  x.key!==b[i].key||Math.abs(x.from_ms-b[i].from_ms)>20||
  Math.abs(x.to_ms-b[i].to_ms)>20||x.to_ms<=x.from_ms))
  throw Error('Canonical coverage, repeat, or Base/Large agreement failed');

const audio=fs.readFileSync('test-results/sudais-qdc-align/5-82-to-84.wav');
if(audio.toString('ascii',0,4)!=='RIFF')throw Error('Missing source WAV');
const rate=audio.readUInt32LE(24),channels=audio.readUInt16LE(22),from=large.align.excerpt_from_ms;
function rms(at,duration=20){
  const lo=Math.max(0,Math.floor((at-from)*rate/1000)),
    hi=Math.min((audio.length-44)/channels/2,Math.ceil((at+duration-from)*rate/1000));
  let max=0;
  for(let c=0;c<channels;c++){let sum=0;
    for(let i=lo;i<hi;i++){const x=audio.readInt16LE(44+(i*channels+c)*2)/32768;sum+=x*x;}
    max=Math.max(max,Math.sqrt(sum/Math.max(1,hi-lo)));}
  return max;
}
const candidatePositions=[7,9,14,18,20,23];
const cuts=candidatePositions.map(position=>{
  const left=a.find(w=>w.position===position),
    right=position===23?a.findLast(w=>w.position===23):a.find(w=>w.position===position+1);
  if(!left||!right)throw Error(`No model words around ${position}`);
  const midpoint=Math.round((left.to_ms+right.from_ms)/2),
    scanFrom=Math.min(midpoint-100,left.to_ms),scanTo=Math.max(midpoint+100,right.from_ms),
    energy=Array.from({length:Math.ceil((scanTo-scanFrom)/20)+1},(_,i)=>
      ({at_ms:scanFrom+i*20,rms:+rms(scanFrom+i*20).toFixed(5)}));
  return {after_word:position,left_end_ms:left.to_ms,right_start_ms:right.from_ms,
    model_gap_ms:right.from_ms-left.to_ms,midpoint_ms:midpoint,
    minimum_20ms_energy:energy.reduce((x,y)=>y.rms<x.rms?y:x),
    status:'candidate-needs-two-sided-audition'};
});
const last82=a.at(-1),first83=large.align.aligner.segments.find(s=>s.ref_from?.startsWith('5:83:'));
const nextStart=Math.round(from+first83.time_from*1000),terminalMid=Math.round((last82.to_ms+nextStart)/2);
const terminalEnergy=Array.from({length:11},(_,i)=>({at_ms:terminalMid-100+i*20,
  rms:+rms(terminalMid-100+i*20).toFixed(5)}));
const out={status:'review-only-not-for-production',verse:'5:82',
  source_url:large.align.source_url,source_sha256:large.align.source_sha256,
  excerpt_sha256:large.align.excerpt_sha256,
  excerpt_from_ms:from,excerpt_to_ms:large.align.excerpt_to_ms,
  models:['Large','Base'],model_agreement_max_ms:20,
  canonical_positions:26,spoken_positions:27,repeated_position:23,
  model_verse_start_ms:a[0].from_ms,model_last_word_end_ms:last82.to_ms,
  model_next_verse_start_ms:nextStart,
  terminal_gap_ms:nextStart-last82.to_ms,
  terminal_minimum_20ms_energy:terminalEnergy.reduce((x,y)=>y.rms<x.rms?y:x),
  proposed_phrase_groups:[[1,9],[10,18],[19,23],[23,26]],
  note:'The final group contains the second occurrence of word 23. The first two groups have nine words, so this is not eight-word compliance.',
  words:a,cuts,
  blockers:['Every proposed cut needs two-sided human listening for phoneme completion and no leakage.',
    'The repeated 23rd word must be confirmed by listening; both ASR models share an alignment family.',
    'The full verse end and next verse start must be listened to before any normal/repeat playback change.',
    'Chapter-wide QDC timing is still quarantined.']};
fs.writeFileSync('review/sudais-qdc-align/5-82-prototype.json',JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({source_sha256:out.source_sha256,positions:a.length,
  verse_start:out.model_verse_start_ms,last_word_end:out.model_last_word_end_ms,
  next_verse_start:out.model_next_verse_start_ms,cuts}));
