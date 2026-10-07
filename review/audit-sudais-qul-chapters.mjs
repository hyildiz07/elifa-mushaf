import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync('index.html','utf8'),at=html.indexOf('const QTEXT=');
if(at<0)throw Error('QTEXT missing');
const QTEXT=vm.runInNewContext(`${html.slice(at,html.indexOf('\n',at))};QTEXT`);
const report={status:'review-only-not-production',reciter:3,chapters:{}};
for(const [surah,total] of [[3,200],[4,176]]){
  const pages=Math.ceil(total/10),all={};let audio=null;
  for(let page=1;page<=pages;page++){
    const url=`https://qul.tarteel.ai/api/v1/audio/surah_segments/3?surah=${surah}&from=1&to=${total}&page=${page}`;
    const response=await fetch(url,{signal:AbortSignal.timeout(20000)});
    if(!response.ok)throw Error(`${response.status} ${url}`);
    const x=await response.json();
    if(!audio)audio=x.audio;
    if(x.audio?.url!==audio.url)throw Error(`Audio URL changed on page ${page}`);
    Object.assign(all,x.segments);
  }
  fs.writeFileSync(`test-results/sudais-qul-timings-${surah}.json`,JSON.stringify({audio,segments:all},null,2));
  const defects=[],rows=[];
  for(let ayah=1;ayah<=total;ayah++){
    const key=`${surah}:${ayah}`,v=all[key],words=QTEXT[surah][ayah-1][2].filter(x=>x[1]===0),count=words.length;
    if(!v){defects.push({key,type:'missing-verse'});continue;}
    const segments=v.segments||[],positions=segments.map(x=>x[0]),uniq=[...new Set(positions)];
    const missing=Array.from({length:count},(_,i)=>i+1).filter(x=>!uniq.includes(x));
    const outside=uniq.filter(x=>x<1||x>count);
    const backwards=segments.some((s,i)=>i&&s[1]<segments[i-1][1]);
    const timeOutside=segments.some(s=>s[1]<v.time_from-1000||s[2]>v.time_to+1000||s[2]<s[1]);
    if(missing.length||outside.length||backwards||timeOutside)defects.push({key,missing,outside,backwards,timeOutside});
    rows.push({key,from:v.time_from,to:v.time_to,count,rows:segments.length,missing:missing.length,
      repeat:positions.length-uniq.length});
  }
  const verseTimeRegressions=rows.filter((r,i)=>i&&r.from<rows[i-1].from).map(x=>x.key);
  report.chapters[surah]={audio_url:audio.url,expected_verses:total,returned_verses:Object.keys(all).length,
    total_rows:rows.reduce((sum,x)=>sum+x.rows,0),total_words:rows.reduce((sum,x)=>sum+x.count,0),
    verses_with_repeated_positions:rows.filter(x=>x.repeat).map(x=>x.key),
    verses_with_missing_positions:rows.filter(x=>x.missing).map(x=>x.key),
    defects,verse_time_regressions:verseTimeRegressions,
    min_start_ms:rows[0]?.from,max_end_ms:rows.at(-1)?.to};
  console.log(JSON.stringify({surah,...report.chapters[surah]}).slice(0,4500));
}
fs.writeFileSync('review/sudais-qul-chapters-3-4-audit.json',JSON.stringify(report,null,2)+'\n');
