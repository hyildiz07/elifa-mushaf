import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
const dir='test-results/timings';fs.mkdirSync(dir,{recursive:true});
const html=fs.readFileSync('index.html','utf8'),c=vm.createContext({});
for(const name of ['QTEXT','QTEXT_TR']){const s=html.indexOf('const '+name+'=');vm.runInContext(html.slice(s,html.indexOf('\n',s)),c);}
const texts=vm.runInContext('({QTEXT,QTEXT_TR})',c);
const reciters=[4,7,6,12,9,2,1,3,10,5,97];
const jobs=reciters.flatMap(rid=>Array.from({length:114},(_,i)=>({rid,sid:i+1})));
const report={checkedAt:new Date().toISOString(),files:0,verses:0,unavailable:[],unsafe:[],missingTail:[],maxTailMs:0};
let cursor=0,completed=0;
async function worker(){
  while(cursor<jobs.length){const {rid,sid}=jobs[cursor++];const file=path.join(dir,`${rid}-${sid}.json`);
    try{
      let af;
      if(fs.existsSync(file))af=JSON.parse(fs.readFileSync(file));
      else{
        const url=`https://api.qurancdn.com/api/qdc/audio/reciters/${rid}/audio_files?chapter=${sid}&segments=true`;
        const r=await fetch(url,{signal:AbortSignal.timeout(25000)});if(!r.ok)throw Error('HTTP '+r.status);
        const j=await r.json();af=j.audio_files?.[0];if(!af?.verse_timings?.length)throw Error('No timings');
        fs.writeFileSync(file,JSON.stringify(af));
      }
      report.files++;
      for(const v of af.verse_timings){
        const ay=+v.verse_key.split(':')[1],segs=v.segments.filter(s=>s.length===3),ws={};
        for(const s of segs)ws[s[0]]=[s[1],s[2]];
        report.verses++;
        const tail=v.timestamp_to-(segs.at(-1)?.[2]??v.timestamp_to);
        if(tail>0){report.missingTail.push({rid,key:v.verse_key,ms:tail});report.maxTailMs=Math.max(report.maxTailMs,tail);}
        for(const mode of ['turk','medine']){
          const words=mode==='turk'?texts.QTEXT_TR[sid]?.[ay-1]?.split(/\s+/).filter(Boolean):texts.QTEXT[sid]?.[ay-1]?.[2]?.filter(w=>w[1]===0);
          let reason=null,prev=null;
          if(!words)reason='missing text';
          else if(Object.keys(ws).length!==words.length)reason='word count';
          else for(let i=1;i<=words.length;i++){
            const s=ws[i];
            if(!s||!Number.isFinite(s[0])||!Number.isFinite(s[1])||s[1]<=s[0]){reason='missing/invalid segment';break;}
            if(prev&&(s[0]<prev[0]||s[1]<prev[1])){reason='non-monotonic';break;}
            prev=s;
          }
          if(reason)report.unsafe.push({rid,key:v.verse_key,mode,reason,textWords:words?.length,positions:Object.keys(ws).length});
        }
      }
    }catch(e){report.unavailable.push({rid,sid,error:e.message});}
    completed++;if(completed%60===0)console.log(JSON.stringify({completed,total:jobs.length,files:report.files,unavailable:report.unavailable.length}));
  }
}
await Promise.all(Array.from({length:4},worker));
fs.writeFileSync('test-results/timing-audit.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({...report,missingTail:report.missingTail.length,unsafe:report.unsafe.length}));
