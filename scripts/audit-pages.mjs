import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync('index.html','utf8'),c=vm.createContext({});
for(const name of ['QTEXT','SURAHS']){const i=html.indexOf('const '+name+'=');vm.runInContext(html.slice(i,html.indexOf('\n',i)),c);}
const {QTEXT,SURAHS}=vm.runInContext('({QTEXT,SURAHS})',c);
const mappingStart=html.indexOf('const PAGE_CORRECTIONS=');
vm.runInContext(html.slice(mappingStart,html.indexOf('async function fetchVerses',mappingStart)),c);
fs.mkdirSync('test-results/pages',{recursive:true});
const report={checkedAt:new Date().toISOString(),source:'https://api.quran.com/api/v4/verses/by_chapter/',chapters:0,verses:0,errors:[]};
let next=1;
async function worker(){while(next<=114){const sid=next++;
  try{
    const file=`test-results/pages/${sid}.json`;let verses;
    if(fs.existsSync(file))verses=JSON.parse(fs.readFileSync(file));
    else{
      verses=[];let page=1;
      do{
        const r=await fetch(`${report.source}${sid}?per_page=50&page=${page}`,{signal:AbortSignal.timeout(25000)});
        if(!r.ok)throw Error('HTTP '+r.status);
        const j=await r.json();verses.push(...j.verses);page=j.pagination.next_page;
      }while(page);
      fs.writeFileSync(file,JSON.stringify(verses));
    }
    report.chapters++;
    if(verses.length!==SURAHS[sid-1].n)report.errors.push({sid,reason:'verse count'});
    for(const v of verses){report.verses++;const local=QTEXT[sid][v.verse_number-1];
      const effective=local&&c.versePage(sid,v.verse_number,local[1]);
      if(!local||effective!==v.page_number)report.errors.push({key:v.verse_key,local:effective,reference:v.page_number});
    }
  }catch(e){report.errors.push({sid,reason:e.message});}
}}
await Promise.all(Array.from({length:4},worker));
fs.writeFileSync('test-results/page-audit.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({...report,errors:report.errors.length,examples:report.errors.slice(0,8)}));
if(report.errors.length||report.verses!==6236)process.exitCode=1;
