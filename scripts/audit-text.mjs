import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
const html=fs.readFileSync('index.html','utf8'),c=vm.createContext({});
for(const name of ['SURAHS','QTEXT','QTEXT_TR']){const s=html.indexOf('const '+name+'=');vm.runInContext(html.slice(s,html.indexOf('\n',s)),c);}
const {SURAHS,QTEXT,QTEXT_TR}=vm.runInContext('({SURAHS,QTEXT,QTEXT_TR})',c);
const sources={quran:'https://api.quran.com/api/v4/quran/verses/uthmani',chapters:'https://api.quran.com/api/v4/chapters?language=tr'};
fs.mkdirSync('test-results',{recursive:true});
for(const [key,url] of Object.entries(sources)){
  const file=`test-results/${key}.json`;
  if(!fs.existsSync(file)){const r=await fetch(url);if(!r.ok)throw Error(url+' '+r.status);fs.writeFileSync(file,await r.text());}
}
const reference=JSON.parse(fs.readFileSync('test-results/quran.json')).verses;
const chapters=JSON.parse(fs.readFileSync('test-results/chapters.json')).chapters;
// Keep vowel marks and small waw/yeh. Exclude spacing, direction controls,
// pause/sajdah ornaments and the two alternate small-meem annotation glyphs.
const normalize=s=>s.normalize('NFC').replace(/[\s\u0640\u06D6-\u06DC\u06DE\u06E2\u06E9\u06ED\u200C-\u200F]/g,'');
const letters=s=>s.normalize('NFKD').replace(/\p{M}/gu,'').replace(/ٱ/g,'ا').replace(/\u0640/g,'').replace(/[^ء-ي]/g,'');
const report={checkedAt:new Date().toISOString(),sources,chapters:0,verses:0,structureErrors:[],uthmaniExact:0,uthmaniNormalized:0,uthmaniLetterMatches:0,uthmaniDifferences:[],turkishLetterMatches:0,turkishDifferences:[],hashes:{}};
for(const name of ['QTEXT','QTEXT_TR'])report.hashes[name]=crypto.createHash('sha256').update(JSON.stringify(name==='QTEXT'?QTEXT:QTEXT_TR)).digest('hex');
for(const ch of chapters){
  const sid=ch.id,meta=SURAHS[sid-1];report.chapters++;
  if(meta.id!==sid||meta.n!==ch.verses_count||QTEXT[sid]?.length!==ch.verses_count||QTEXT_TR[sid]?.length!==ch.verses_count)report.structureErrors.push({sid,reason:'chapter/count'});
  for(let i=0;i<QTEXT[sid].length;i++){
    const row=QTEXT[sid][i];if(row[0]!==i+1||row[1]<1||row[1]>604)report.structureErrors.push({sid,ay:i+1,reason:'order/page'});
  }
}
for(const v of reference){
  const [sid,ay]=v.verse_key.split(':').map(Number),row=QTEXT[sid][ay-1];
  const a=row[2].filter(w=>w[1]===0).map(w=>w[0]).join(' '),b=QTEXT_TR[sid][ay-1],r=v.text_uthmani;
  report.verses++;
  if(a===r)report.uthmaniExact++;
  if(normalize(a)===normalize(r))report.uthmaniNormalized++;
  else report.uthmaniDifferences.push({key:v.verse_key,local:a,reference:r,lettersMatch:letters(a)===letters(r)});
  if(letters(a)===letters(r))report.uthmaniLetterMatches++;
  if(letters(b)===letters(r))report.turkishLetterMatches++;
  else report.turkishDifferences.push({key:v.verse_key,local:b,reference:r});
}
fs.writeFileSync('test-results/text-audit.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({...report,uthmaniDifferences:report.uthmaniDifferences.length,turkishDifferences:report.turkishDifferences.length}));
console.log(JSON.stringify({uthmaniExamples:report.uthmaniDifferences.slice(0,3),turkishExamples:report.turkishDifferences.slice(0,3)}));
if(report.structureErrors.length)process.exitCode=1;
