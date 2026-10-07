// Research-only structural coverage of a single, unguarded alternative reciter.
import fs from 'node:fs';
import vm from 'node:vm';

const rid=4; // Ebû Bekir eş-Şâtırî, the selected QUA chapter source.
const html=fs.readFileSync('index.html','utf8');
const at=html.indexOf('const QTEXT=');
if(at<0)throw Error('QTEXT not found');
const qtext=vm.runInNewContext(`${html.slice(at,html.indexOf('\n',at))};QTEXT`);
const report={reciterId:rid,chapters:0,verses:0,coveredWords:0,issues:[],guardedSudaisVerses:0};
for(let surah=1;surah<=114;surah++){
  const file=`assets/verified-audio/${rid}-${surah}.json`;
  if(!fs.existsSync(file)){report.issues.push({surah,reason:'missing chapter asset'});continue;}
  const chapter=JSON.parse(fs.readFileSync(file,'utf8'));
  report.chapters++;
  if(!/^https:\/\/audio-cdn\.tarteel\.ai\//.test(chapter.audio_url||''))
    report.issues.push({surah,reason:'unexpected audio URL'});
  const rows=new Map((chapter.verse_timings||[]).map(row=>[row.verse_key,row]));
  if(rows.size!==qtext[surah].length)
    report.issues.push({surah,reason:'verse row count',expected:qtext[surah].length,actual:rows.size});
  for(let ayah=1;ayah<=qtext[surah].length;ayah++){
    const key=`${surah}:${ayah}`,row=rows.get(key);
    if(!row){report.issues.push({key,reason:'missing verse row'});continue;}
    report.verses++;
    if([3,4,5,28,29].includes(surah))report.guardedSudaisVerses++;
    const count=qtext[surah][ayah-1][2].filter(word=>word[1]===0).length;
    const positions=new Set((row.segments||[]).filter(segment=>
      Array.isArray(segment)&&segment.length===3&&Number.isFinite(segment[1])&&
      Number.isFinite(segment[2])&&segment[2]>segment[1]).map(segment=>segment[0]));
    const missing=Array.from({length:count},(_,index)=>index+1).filter(position=>!positions.has(position));
    if(missing.length)report.issues.push({key,reason:'missing word positions',missing});
    if(!(Number.isFinite(row.timestamp_from)&&Number.isFinite(row.timestamp_to)&&
      row.timestamp_to>row.timestamp_from))report.issues.push({key,reason:'invalid verse range'});
    report.coveredWords+=count-missing.length;
  }
}
fs.writeFileSync('review/fallback-reciter-coverage-2026-09-30.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({chapters:report.chapters,verses:report.verses,
  coveredWords:report.coveredWords,guardedSudaisVerses:report.guardedSudaisVerses,
  issues:report.issues.length,examples:report.issues.slice(0,12)}));
