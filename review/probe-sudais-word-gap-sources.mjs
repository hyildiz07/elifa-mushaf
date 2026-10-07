import fs from 'node:fs';
import vm from 'node:vm';

// Read-only candidate survey. It never writes a playback override.
const keys=['2:25','2:61','2:90','2:282','3:37','4:95','4:134','4:146',
  '5:46','5:82','5:91','5:103','7:5','16:35','16:45','22:23',
  '39:54','39:72','41:44','42:52','45:12','73:4'];
const nextOnly=process.argv.includes('--next-only');
const selected=process.argv.find(arg=>arg.startsWith('--verse='))?.slice(8);
const targetKeys=selected?[selected]:nextOnly?['2:62','2:283','7:6','16:36','16:46','22:24',
  '39:73','42:53','73:5']:keys;
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const c=vm.createContext({});
vm.runInContext(html.split(/\r?\n/).find(line=>line.startsWith('const QTEXT=')),c);
const text=vm.runInContext('QTEXT',c);
const offsets={};
let total=0;
for(let sid=1;sid<=114;sid++){offsets[sid]=total;total+=text[sid].length;}
const results=[];
for(const key of targetKeys){
  const [sid,ay]=key.split(':').map(Number);
  const url=`https://datasets-server.huggingface.co/rows?dataset=quranlab/quran-audio&config=abdul-rahman-al-sudais&split=train&offset=${offsets[sid]+ay-1}&length=1`;
  let response;
  for(let attempt=0;attempt<4;attempt++){
    response=await fetch(url,{signal:AbortSignal.timeout(30000)});
    if(response.ok)break;
    if(attempt===3)throw Error(`${key}: HTTP ${response.status}`);
    await new Promise(resolve=>setTimeout(resolve,1000*(attempt+1)));
  }
  const row=(await response.json()).rows?.[0]?.row;
  if(row?.verse_key!==key)throw Error(`${key}: wrong row ${row?.verse_key}`);
  const count=text[sid][ay-1][2].filter(word=>word[1]===0).length;
  const covered=new Set((row.segments||[]).flatMap(segment=>
    Array.from({length:segment.word_end-segment.word_start},(_,i)=>segment.word_start+i+1)));
  const missing=Array.from({length:count},(_,i)=>i+1).filter(pos=>!covered.has(pos));
  const source=JSON.parse(fs.readFileSync(new URL(`../test-results/timings/3-${sid}.json`,import.meta.url)));
  const vt=source.verse_timings.find(verse=>verse.verse_key===key);
  results.push({key,count,source_url:source.audio_url,source_range:[vt.timestamp_from,vt.timestamp_to],
    candidate_audio_url:row.audio_url,candidate_duration:row.duration_ms,
    candidate_has_word_timing:row.has_word_timing,candidate_covered:covered.size,
    candidate_missing:missing,candidate_segments:row.segments});
  console.log(`${key} ${covered.size}/${count} ${row.audio_url}`);
}
fs.writeFileSync(new URL(selected?'../test-results/sudais-gap-selected-candidate.json':
  nextOnly?'../test-results/sudais-gap-next-candidates.json':
    '../test-results/sudais-gap-quranlab-candidates.json',import.meta.url),
  JSON.stringify(results,null,2)+'\n');
