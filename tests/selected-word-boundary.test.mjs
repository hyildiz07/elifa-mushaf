import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const start=html.indexOf('function guardedSelectedWordCut(');
assert.ok(start>=0);
const code=html.slice(start,html.indexOf('\n}',start)+2);
const context=vm.createContext({});
vm.runInContext(code,context);

test('a selected word ends before the following word begins',()=>{
  assert.equal(context.guardedSelectedWordCut(1000,1400,1410,null),1340);
  assert.equal(context.guardedSelectedWordCut(1000,1400,1500,1320),1320);
});

test('overlapping or too-short word timing refuses an unsafe isolated cut',()=>{
  assert.equal(context.guardedSelectedWordCut(1000,1400,1300,null),null);
  assert.equal(context.guardedSelectedWordCut(1000,1100,1100,null),null);
  assert.equal(context.guardedSelectedWordCut(1000,1100,1100,null,500),1030,
    'a short final word remains playable when the selected phrase began earlier');
});

test('a final word with no next timing retains its measured end',()=>{
  assert.equal(context.guardedSelectedWordCut(1000,1500,undefined,1410),1410);
});
