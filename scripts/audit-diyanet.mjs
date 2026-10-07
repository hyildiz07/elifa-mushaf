import fs from 'node:fs';
import vm from 'node:vm';
const h=fs.readFileSync('index.html','utf8'),c=vm.createContext({});
for(const name of ['QTEXT_TR','SURAHS']){const start=h.indexOf('const '+name+'=');vm.runInContext(h.slice(start,h.indexOf('\n',start)),c);}
const {QTEXT_TR,SURAHS}=vm.runInContext('({QTEXT_TR,SURAHS})',c);
// Diyanet's font uses Persian yeh and a different pause-sign code point.
// Keep every vowel/elongation mark; normalize only those explicit variants.
const normalize=s=>s.normalize('NFC').replace(/ی/g,'ي').replace(/ک/g,'ك')
  .replace(/[\s\u0640\u0615-\u0617\u06D6-\u06DC\u06DE\u06E9\u200C-\u200F]/g,'')
  .replace(/ا\u064B/g,'\u064Bا').replace(/\u08D1/g,'\u06EC').replace(/\u08D6/g,'\u06DF');
// This secondary comparison is diagnostic only: removing marks cannot certify recitation.
const letters=s=>s.normalize('NFKD').replace(/ی/g,'ي').replace(/ک/g,'ك').replace(/\p{M}/gu,'').replace(/[\s\u0640\u200C-\u200F]/g,'').replace(/[^ء-ي]/g,'');
const report={checkedAt:new Date().toISOString(),source:'https://kuran.diyanet.gov.tr/mushaf/qurandm/pagedata',pages:0,verses:0,matches:0,differences:[],letterMatches:0,letterDifferences:[],missing:[],duplicates:[]},seen=new Set();
for(const f of fs.readdirSync('test-results/diyanet')){
  const j=JSON.parse(fs.readFileSync('test-results/diyanet/'+f));report.pages++;
  for(const v of j.QuranAyats){if(v.AyetId<1)continue;const key=v.SureId+':'+v.AyetId;
    if(seen.has(key)){report.duplicates.push(key);continue;}seen.add(key);report.verses++;
    const local=QTEXT_TR[v.SureId]?.[v.AyetId-1];
    if(local&&letters(local)===letters(v.AyetText))report.letterMatches++;
    else report.letterDifferences.push({key,local,reference:v.AyetText});
    if(local&&normalize(local)===normalize(v.AyetText))report.matches++;
    else report.differences.push({key,local,reference:v.AyetText});
  }
}
for(const s of SURAHS)for(let ay=1;ay<=s.n;ay++)if(!seen.has(s.id+':'+ay))report.missing.push(s.id+':'+ay);
fs.writeFileSync('test-results/diyanet-text-audit.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({...report,differences:report.differences.length,examples:report.differences.slice(0,4),missing:report.missing.length}));
if(report.verses!==6236||report.missing.length||report.duplicates.length)process.exitCode=1;
