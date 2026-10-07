import fs from 'node:fs';import vm from 'node:vm';
const html=fs.readFileSync('index.html','utf8'),c=vm.createContext({});vm.runInContext(html.split(/\r?\n/).find(x=>x.startsWith('const QTEXT=')),c);const Q=vm.runInContext('QTEXT',c);
for(const [rid,sid,ay,config] of [[2,2,25,'abdul-basit'],[7,60,11,'mishary-alafasy'],[7,14,17,'mishary-alafasy'],[4,17,12,'abu-bakr-al-shatri']]){
 const offset=Object.entries(Q).filter(([s])=>+s<sid).reduce((n,[,v])=>n+v.length,0)+ay-1;
 const url=`https://datasets-server.huggingface.co/rows?dataset=quranlab/quran-audio&config=${config}&split=train&offset=${offset}&length=1`;
 const response=await fetch(url);const data=await response.json();const row=data.rows?.[0]?.row;console.log(JSON.stringify({rid,key:`${sid}:${ay}`,status:response.status,source:row?.audio_url,duration:row?.duration_ms,count:row?.segments?.length,has:row?.has_word_timing,timing_source:row?.timing_source,positions:[row?.segments?.[0],row?.segments?.at(-1)],segments:rid===7?row?.segments:undefined}));
}
