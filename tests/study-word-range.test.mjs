import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
function source(name){const start=html.search(new RegExp(`(?:async )?function ${name}\\(`));assert.ok(start>=0);return html.slice(start,html.indexOf('\n}',start)+2);}
function setup(){
  const c=vm.createContext({curS:2,studyRange:{sid:2,from:127,to:128,wordRange:{fromAy:127,fromWord:8,toAy:128,toWord:3}},
    ayGi:{127:[0,13],128:[14,21]},wordArr:Array.from({length:22},(_,gi)=>({gi,ay:gi<14?127:128,pos:gi<14?gi+1:gi-13})),
    selA:null,selB:null,selMode:'ayah',renderSel(){},playSelection(){c.played=[c.selA,c.selB];}});
  for(const name of ['validStudyWordRange','studyWordBounds','restoreStudyWordSelection','constrainStudyWordSelection','playStudyRange'])vm.runInContext(source(name),c);
  return c;
}
test('saved dua words restore by verse positions after focused reader reindexes global words',()=>{
  const c=setup();assert.equal(c.restoreStudyWordSelection(),true);
  assert.deepEqual([c.selA,c.selB,c.selMode],[7,16,'word']);
  assert.equal(c.restoreStudyWordSelection(128,128),true);assert.deepEqual([c.selA,c.selB],[14,16]);
  assert.equal(c.restoreStudyWordSelection(126,128),false);
});
test('Study Desk play restores only stored words even after marking is cleared',async()=>{
  const c=setup();await c.playStudyRange();assert.deepEqual(Array.from(c.played),[7,16]);
  c.selA=null;c.selB=null;await c.playStudyRange();assert.deepEqual(Array.from(c.played),[7,16]);
});
test('missing or reversed saved word positions cannot silently widen to the whole verse',()=>{
  const c=setup();c.studyRange.wordRange.fromWord=99;assert.equal(c.restoreStudyWordSelection(),false);assert.equal(c.selA,null);
  c.studyRange.to=127;c.studyRange.wordRange={fromAy:127,toAy:127,fromWord:8,toWord:3};assert.equal(c.restoreStudyWordSelection(),false);
});
test('changing the setup verse range drops old word metadata instead of applying it elsewhere',()=>{
  const c=setup();c.studyDraft={...c.studyRange,selectionTitle:'Kabul duası'};
  const fields={studySurah:{value:2},studyFrom:{value:127},studyTo:{value:128}};c.$=id=>fields[id];
  vm.runInContext(source('readStudyDraft'),c);
  assert.equal(c.readStudyDraft().wordRange.fromWord,8);
  fields.studyTo.value=129;assert.equal(c.readStudyDraft().wordRange,undefined);
  fields.studySurah.value=3;assert.equal(c.readStudyDraft().selectionTitle,undefined);
});
test('dragging a marker beyond a saved prayer clamps it to the study words',()=>{
  const c=setup();c.selA=0;c.selB=21;c.constrainStudyWordSelection();assert.deepEqual([c.selA,c.selB],[7,16]);
  c.selA=0;c.selB=3;c.constrainStudyWordSelection();assert.equal(c.selA,null);
});
test('editing settings stays silent; explicit Start plays only the saved prayer words',()=>{
  const c=setup();Object.assign(c,{gearCtx:'ayah',guardedRangeDraft:null,rangeSelectionDraft:null,SET:{},
    $:id=>({value:id==='fromInp'?127:128}),commitInputs(){},syncCumu(){},syncRep(){},syncRep2(){},saveSet(){},
    clampAy:x=>x,audioTimingUnverified:()=>false});
  for(const name of ['rememberRangeSelection','applyRangeProgram'])vm.runInContext(source(name),c);
  c.rememberRangeSelection();assert.equal(c.played,undefined);assert.equal(c.rangeSelectionDraft.from,127);
  assert.equal(c.applyRangeProgram(),true);assert.deepEqual(Array.from(c.played),[7,16]);
});
