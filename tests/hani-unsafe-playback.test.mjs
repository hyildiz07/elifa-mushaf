import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const candidate=JSON.parse(fs.readFileSync(new URL('../review/verified-full-verse-audio-r5-candidate.json',import.meta.url),'utf8'));
function extract(name,async=false){const at=html.indexOf(`${async?'async ':''}function ${name}(`);assert.ok(at>=0,name);return html.slice(at,html.indexOf('\n}',at)+2)}

test('Hânî 6:139 existing normal end omits active audio; alternative remains review-only',()=>{
  assert.equal(candidate.status,'full-verse-source-candidate-v1');
  assert.equal(candidate.review_status,'hold-physical-tail-still-active');
  const row=candidate.rows['6:139'];
  assert.equal(row.chapter_clip_start_ms+row.audio_duration_ms,2862031);
  assert.equal(row.next_verse_clip_start_ms-(row.chapter_clip_start_ms+row.audio_duration_ms),75);
  assert.equal(row.chapter_clip_start_ms+row.tail_audit.model_last_word_end_ms-
    row.tail_audit.provider_last_word_end_ms,596);
  assert.ok(row.tail_audit.last_10ms_rms>0);
  assert.ok(!html.includes('verified-full-verse-audio-r5'));
  assert.ok(!fs.existsSync(new URL('../assets/verified-full-verse-audio-r5.json',import.meta.url)));
});

test('Hânî unverified ending steps fail closed; verified 6:139 source is accepted',()=>{
  for(const [surah,ayah] of [[6,139],[34,46],[65,12]]){
    const messages=[],c=vm.createContext({SET:{reciter:5},curS:surah,navigator:{onLine:true},toast:m=>messages.push(m)});
    vm.runInContext(extract('unsafeHaniNormalStep')+extract('normalVersePlanReady'),c);
    assert.equal(c.normalVersePlanReady([{ayEnd:ayah,dyn:true}]),false);
    assert.match(messages[0],/son sesi doğrulanamadı/);
    if(surah===6)assert.equal(c.normalVersePlanReady([{ayEnd:139,
      sourceRanges:[{verseSource:139,fullVerse:true}]}]),true);
    assert.equal(c.normalVersePlanReady([{full:true,fluent:true,f:1,t:100}]),true);
    assert.equal(c.normalVersePlanReady([{ayEnd:ayah-1},{ayEnd:ayah}]),false,
      'a later unsafe repeat must be rejected before starting the plan');
    c.SET.reciter=4;
    assert.equal(c.normalVersePlanReady([{ayEnd:ayah}]),true);
  }
});

test('a cumulative plan stops before the Hânî unsafe ending step',async()=>{
  for(const [surah,ayah] of [[6,139],[34,46],[65,12]]){
    const safe={f:100,t:200,ayEnd:ayah-1},unsafe={f:200,t:300,ayEnd:ayah},played=[],stops=[];
    const chapter={audio:{pause(){}}};
    const c=vm.createContext({SET:{reciter:5},curS:surah,plan:[safe,unsafe],pi:0,pieceCursor:0,
      playing:true,audioRequestId:1,stepRequestId:0,AD_:chapter,normalChapterAudio:null,
      unsafeSudaisNormalStep:()=>false,stepBounds:st=>({f:st.f,t:st.t}),
      seekPlay:(f,t)=>played.push([f,t]),stopPlan:()=>stops.push('stop'),toast:()=>{},console:{warn(){}}});
    vm.runInContext(extract('unsafeHaniNormalStep')+extract('goStep',true),c);
    await c.goStep();c.pi=1;await c.goStep();
    assert.deepEqual(played,[[100,200]]);
    assert.deepEqual(stops,['stop']);
  }
});

test('Hânî full 6:139 selection uses verified source; uncertain tails stay blocked',async()=>{
  for(const [surah,ayah] of [[6,139],[34,46],[65,12]]){
    const messages=[],plans=[];
    const c=vm.createContext({SET:{reciter:5},curS:surah,selA:0,selB:2,audioRequestId:0,selectedRange:[0,2],
      selRange:()=>c.selectedRange,wordArr:[{ay:ayah},{ay:ayah},{ay:ayah}],
      ayGi:{[ayah]:[0,2]},AD_:{recordingUrl:'chapter'},normalChapterAudio:null,
      normalVerseStep:(audio,first,last,extra)=>({audio,first,last,...extra}),
      normalVersePlanReady:()=>true,toast:m=>messages.push(m),runPlan:p=>plans.push(p)});
    vm.runInContext(extract('playSelection',true),c);
    await c.playSelection();c.selectedRange=[0,1];await c.playSelection();
    assert.equal(plans.length,surah===6?1:0);
    assert.equal(messages.length,surah===6?1:2);
    if(surah===6)assert.equal(plans[0][0].ayEnd,139);
    assert.ok(messages.every(m=>/Seçilen kesiti güvenle çalamıyoruz/.test(m)));
  }
});

test('Hânî split exposes no playable guessed pieces for uncertain endings',()=>{
  for(const [surah,ayah,count] of [[6,139,22],[34,46,24],[65,12,10]]){
    const words=Array.from({length:count},(_,i)=>({ay:ayah,pos:i+1,gi:i,txt:'كلمة'}));
    const c=vm.createContext({SET:{reciter:5},curS:surah,ayGi:{[ayah]:[0,count-1]},wordArr:words});
    vm.runInContext(extract('computeParts'),c);
    const parts=c.computeParts(ayah);
    assert.equal(parts.length,1);assert.equal(parts[0].unsafeTiming,true);
    assert.equal(parts[0].f,null);assert.equal(parts[0].t,null);
    assert.equal(parts[0].words.length,count);
  }
});

test('Hânî 65:12 fluent single-verse start is guarded without an ayEnd marker',()=>{
  const c=vm.createContext({SET:{reciter:5},curS:65,
    verifiedNormalRanges:()=>null,navigator:{onLine:true},toast(){},
    chapter:{ay:{12:[300000,317440]}}});
  vm.runInContext(extract('normalVerseStep')+extract('unsafeHaniNormalStep')+
    extract('normalVersePlanReady'),c);
  const step=c.normalVerseStep(c.chapter,12,12,{full:true,fluent:true});
  assert.equal(step.unsafeHani65Tail,true);
  assert.equal(c.normalVersePlanReady([step]),false);
  c.SET.reciter=4;
  assert.equal(c.normalVersePlanReady([step]),true);
});
