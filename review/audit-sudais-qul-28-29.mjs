// Review only. QUL word clocks are paired with the QUL MP3, never with QDC by default.
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync('index.html','utf8');
const textStart=html.indexOf('const QTEXT=');
const c=vm.createContext({});
vm.runInContext(html.slice(textStart,html.indexOf('\n',textStart)),c);
const qtext=vm.runInContext('QTEXT',c);
const chapters={};
for(const sid of [28,29]){
  const first=await fetch(`https://qul.tarteel.ai/api/v1/audio/surah_segments/3?surah=${sid}`).then(r=>r.json());
  const rows={...first.segments};
  for(let page=2;page<=first.pagination.total_pages;page++){
    const response=await fetch(`https://qul.tarteel.ai/api/v1/audio/surah_segments/3?surah=${sid}&page=${page}`);
    if(!response.ok)throw Error(`${sid} page ${page}: HTTP ${response.status}`);
    const data=await response.json();
    Object.assign(rows,data.segments);
  }
  const issues=[],statistics={verses:0,words:0,rows:0,repeatRows:0,missingPositions:0,
    outsideRanges:0,overlaps:0,rangeOrder:0};
  let previousEnd=0;
  for(let ay=1;ay<=qtext[sid].length;ay++){
    const key=`${sid}:${ay}`,v=rows[key];
    if(!v){issues.push({key,issue:'missing verse'});continue;}
    statistics.verses++;
    const count=qtext[sid][ay-1][2].filter(w=>w[1]===0).length;
    statistics.words+=count;statistics.rows+=v.segments.length;
    if(v.time_from<previousEnd-50){statistics.rangeOrder++;issues.push({key,issue:'verse overlap',ms:previousEnd-v.time_from});}
    previousEnd=v.time_to;
    if(!(v.time_to>v.time_from)){issues.push({key,issue:'invalid range'});continue;}
    const seen=new Set();let lastEnd=v.time_from;
    for(const [pos,from,to] of v.segments){
      if(seen.has(pos))statistics.repeatRows++;
      seen.add(pos);
      if(!Number.isInteger(pos)||pos<1||pos>count){issues.push({key,issue:'invalid position',pos});}
      if(!(to>from)||from<v.time_from||to>v.time_to){statistics.outsideRanges++;issues.push({key,issue:'segment outside verse',pos,from,to});}
      if(from<lastEnd){statistics.overlaps++;issues.push({key,issue:'segment overlap',pos,ms:lastEnd-from});}
      lastEnd=to;
    }
    const missing=Array.from({length:count},(_,i)=>i+1).filter(pos=>!seen.has(pos));
    if(missing.length){statistics.missingPositions+=missing.length;issues.push({key,issue:'missing positions',missing});}
  }
  chapters[sid]={audio:first.audio,statistics,issues,rows};
  console.log(JSON.stringify({sid,audio:first.audio.url,statistics,issueCount:issues.length,
    firstIssues:issues.slice(0,12)}));
}
fs.writeFileSync('review/sudais-qul-28-29-structure.json',JSON.stringify({
  status:'review-only-not-source-transferred',checked_at:new Date().toISOString(),chapters
},null,2)+'\n');
