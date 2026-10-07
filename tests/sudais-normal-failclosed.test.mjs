import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
function extract(name,async=false){const at=html.indexOf(`${async?'async ':''}function ${name}(`);assert.ok(at>=0,name);return html.slice(at,html.indexOf('\n}',at)+2)}
const keyCases=[[3,160],[4,143],[5,5]];

test('Südeys uncertain-tail verses cannot start a single or repeated normal step',()=>{
  for(const [surah,ayah] of keyCases){
    const messages=[],c=vm.createContext({SET:{reciter:3},curS:surah,navigator:{onLine:true},toast:m=>messages.push(m)});
    vm.runInContext(extract('unsafeSudaisNormalStep')+extract('unsafeHaniNormalStep')+
      extract('normalVersePlanReady'),c);
    assert.equal(c.normalVersePlanReady([{ayEnd:ayah,x:3}]),false);
    assert.match(messages[0],/son sesi doğrulanamadı/);
    assert.equal(c.normalVersePlanReady([{f:1,t:100,full:true,fluent:true}]),true);
    assert.equal(c.normalVersePlanReady([{ayEnd:ayah-1},{ayEnd:ayah}]),false,
      'the plan must reject a later unsafe repeat before playback begins');
    c.SET.reciter=5;
    assert.equal(c.normalVersePlanReady([{ayEnd:ayah}]),true);
  }
});

test('a cumulative plan stops before reaching an uncertain-tail step',async()=>{
  for(const [surah,ayah] of keyCases){
    const safe={f:100,t:200,ayEnd:ayah-1},unsafe={f:200,t:300,ayEnd:ayah};
    const played=[],stops=[],messages=[];
    const chapter={audio:{pause(){}}};
    const c=vm.createContext({SET:{reciter:3},curS:surah,plan:[safe,unsafe],pi:0,pieceCursor:0,
      playing:true,audioRequestId:1,stepRequestId:0,AD_:chapter,normalChapterAudio:null,
      stepBounds:st=>({f:st.f,t:st.t}),seekPlay:(f,t)=>played.push([f,t]),
      stopPlan:()=>stops.push('stop'),toast:m=>messages.push(m),console:{warn(){}}});
    vm.runInContext(extract('unsafeSudaisNormalStep')+extract('goStep',true),c);
    await c.goStep();assert.deepEqual(played,[[100,200]]);
    c.pi=1;await c.goStep();assert.deepEqual(played,[[100,200]]);
    assert.deepEqual(stops,['stop']);assert.match(messages[0],/son sesi doğrulanamadı/);
  }
});

test('whole and partial word selections involving uncertain-tail verses fail closed',async()=>{
  for(const [surah,ayah] of keyCases){
    const messages=[],plans=[];
    const c=vm.createContext({SET:{reciter:3},curS:surah,selA:0,selB:2,audioRequestId:0,selectedRange:[0,2],
      selRange:()=>c.selectedRange,wordArr:[{ay:ayah},{ay:ayah},{ay:ayah}],
      ayGi:{[ayah]:[0,2]},toast:m=>messages.push(m),runPlan:p=>plans.push(p)});
    vm.runInContext(extract('playSelection',true),c);
    await c.playSelection();c.selectedRange=[0,1];await c.playSelection();
    assert.equal(plans.length,0);assert.equal(messages.length,2);
    assert.ok(messages.every(m=>/Seçilen kesiti güvenle çalamıyoruz/.test(m)));
  }
});
