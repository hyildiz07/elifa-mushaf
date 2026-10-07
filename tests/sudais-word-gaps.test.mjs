import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Pinned review inventory from the original Sudais QuranCDN metadata. Keep
// these cases local to the test: ignored test-results files are not available
// in a clean checkout.
const gaps={
  '2:25':[22], '2:61':[30,31], '2:90':[3,4,5,6], '2:282':[56],
  '3:37':[10], '4:95':[15], '4:134':[14], '4:146':[6],
  '5:46':[13,14,15,16,17,18], '5:82':[9,18,19,20,21,22,23],
  '5:91':[5,6], '5:103':[1,2], '7:5':[4,5], '16:35':[9,10],
  '16:45':[7,8], '22:23':[20], '39:54':[2,3,4,5,6,7,8,9,10,11,12,13],
  '39:72':[1], '41:44':[17], '42:52':[17], '45:12':[9], '73:4':[4,5],
};
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const qtextLine=html.split(/\r?\n/).find(line=>line.startsWith('const QTEXT='));
const at=html.indexOf('function selTimes(');
const selTimesSource=html.slice(at,html.indexOf('\n}',at)+2);

test('all 22 known Sudais word gaps refuse incomplete selections',()=>{
  assert.equal(Object.keys(gaps).length,22);
  assert.equal(Object.values(gaps).flat().length,54);
  const c=vm.createContext({});
  vm.runInContext(qtextLine,c);
  vm.runInContext(selTimesSource,c);
  const qtext=vm.runInContext('QTEXT',c);
  for(const [key,missing] of Object.entries(gaps)){
    const [surah,ayah]=key.split(':').map(Number);
    const count=qtext[surah][ayah-1][2].filter(word=>word[1]===0).length;
    assert.ok(missing.every(pos=>pos>=1&&pos<=count),key);
    const absent=new Set(missing);
    c.wordArr=Array.from({length:count},(_,i)=>({
      ay:ayah,pos:i+1,s:absent.has(i+1)?null:i*1000,
      e:absent.has(i+1)?null:(i+1)*1000,
    }));
    c.selRange=()=>[0,count-1];
    assert.equal(c.selTimes(),null,`${key} complete selection`);
    for(const pos of missing){
      c.selRange=()=>[pos-1,pos-1];
      assert.equal(c.selTimes(),null,`${key}:${pos} single word`);
    }
    const valid=c.wordArr.findIndex(word=>word.s!==null);
    assert.ok(valid>=0,key);
    c.selRange=()=>[valid,valid];
    assert.deepEqual(Array.from(c.selTimes()),[valid*1000,(valid+1)*1000],`${key} valid control`);
  }
});
