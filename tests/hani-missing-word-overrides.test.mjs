import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const targets=[
  '12:62','2:38','22:19','23:36','24:58','26:118','3:15','3:61',
  '3:162','3:197','39:39','41:30','48:29','5:2','5:57','57:20','59:5',
  '59:8','68:51','7:155','89:1','89:30','9:21','9:109'
];
const rows=JSON.parse(fs.readFileSync(new URL('../assets/audio-timing-overrides-v3.json',import.meta.url))).rows;
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const c=vm.createContext({});
for(const name of ['QTEXT']){
  const start=html.indexOf('const '+name+'=');
  vm.runInContext(html.slice(start,html.indexOf('\n',start)),c);
}
const qtext=vm.runInContext('QTEXT',c);
const start=html.indexOf('function timingTextKey(');
vm.runInContext(html.slice(start,html.indexOf('\n}',start)+2),c);

test('Hani gaps use complete timings from the same chapter recording',()=>{
  for(const key of targets){
    const [sid,ay]=key.split(':').map(Number),row=rows[`5:${key}`];
    assert.ok(row,`${key} has source-matched replacement`);
    const count=qtext[sid][ay-1][2].filter(w=>w[1]===0).length;
    assert.equal(row.url,`https://download.quranicaudio.com/qdc/hani_ar_rifai/murattal/${sid}.mp3`,key);
    assert.equal(row.text,c.timingTextKey(qtext[sid][ay-1][2].filter(w=>w[1]===0).map(w=>w[0])),key);
    assert.deepEqual([...new Set(row.segments.map(s=>s[0]))].sort((a,b)=>a-b),
      Array.from({length:count},(_,i)=>i+1),key);
    assert.ok(row.range[1]>row.range[0]&&(row.next==null||row.next>=row.range[1]),key);
    for(const [pos,from,to] of row.segments){
      assert.ok(pos>=1&&pos<=count&&from>=row.range[0]&&to<=row.range[1]&&to>from,key);
    }
  }
});

test('Hani Fatiha 1:1 stays unresolved without a complete source occurrence',()=>{
  assert.equal(rows['5:1:1'],undefined);
});
