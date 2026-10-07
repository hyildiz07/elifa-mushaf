import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
const h=fs.readFileSync('index.html','utf8'),c=vm.createContext({});
for(const name of ['SURAHS','QTEXT','QTEXT_TR','QLATIN','QLATIN_INTL']){const s=h.indexOf('const '+name+'=');vm.runInContext(h.slice(s,h.indexOf('\n',s)),c);}
const {SURAHS,QTEXT,QTEXT_TR,QLATIN,QLATIN_INTL}=vm.runInContext('({SURAHS,QTEXT,QTEXT_TR,QLATIN,QLATIN_INTL})',c);
const mappingStart=h.indexOf('const PAGE_CORRECTIONS=');
vm.runInContext(h.slice(mappingStart,h.indexOf('async function fetchVerses',mappingStart)),c);
test('all 6236 page assignments match the external 604-page reference',()=>{
  const pages=JSON.parse(fs.readFileSync('tests/fixtures/pages.json'));
  let checked=0;
  for(const s of SURAHS)for(const row of QTEXT[s.id]){
    assert.equal(c.versePage(s.id,row[0],row[1]),pages[s.id][row[0]-1],s.id+':'+row[0]);checked++;
  }
  assert.equal(checked,6236);
});
test('all 114 chapters and 6236 verses retain order and valid page numbers',()=>{
  assert.equal(SURAHS.length,114);let total=0;
  for(const s of SURAHS){
    assert.equal(QTEXT[s.id].length,s.n);assert.equal(QTEXT_TR[s.id].length,s.n);
    QTEXT[s.id].forEach((row,i)=>{assert.equal(row[0],i+1);assert.ok(row[1]>=1&&row[1]<=604);assert.ok(row[2].filter(w=>w[1]===0).length>0);assert.ok(QTEXT_TR[s.id][i].trim().length>0);});
    total+=s.n;
  }
  assert.equal(total,6236);
});
test('both transliteration datasets contain all verses without empty entries',()=>{
  for(const data of [QLATIN,QLATIN_INTL])for(const s of SURAHS){
    assert.equal(data[s.id].length,s.n);
    for(const line of data[s.id])assert.ok(typeof line==='string'&&line.trim().length>0);
  }
});
test('both Arabic text datasets are unchanged from the original deployment',()=>{
  for(const [text,expected] of [[QTEXT,'feee3c9cd1ddee7b36a9e942a40c21fc4c7ae7381735d83ee5dcfc64b101bf46'],[QTEXT_TR,'02d2f42ff7700c9294a938b03ab516f1ada307884b17a4ab2d889a2977051066']]){
    assert.equal(crypto.createHash('sha256').update(JSON.stringify(text)).digest('hex'),expected);
  }
});
