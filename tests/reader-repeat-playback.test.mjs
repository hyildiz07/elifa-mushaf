import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
function source(name){
  const start=html.search(new RegExp(`(?:async )?function ${name}\\(`));
  assert.ok(start>=0,name);
  const end=html.indexOf('\n',start),line=html.slice(start,end).trimEnd();
  return html.slice(start,line.endsWith('}')?end:html.indexOf('\n}',start)+2);
}
function harness(mode='range'){
  const heard=[],buttons=new Map(),fallback=[];
  const c=vm.createContext({SET:{reciter:223,rep:2,rangeRep:3,combineRep:4,repOn:true,cumu:mode==='cumulative'},
    window:{elifaPracticeMode:()=>mode},SURAHS:[{n:3}],curS:1,curAy:1,visAy:1,studyRange:null,
    AD_:{sourceUrl:'https://example.test/matched.mp3',recordingUrl:'https://example.test/matched.mp3',buffer:{duration:4},
      ay:{1:[0,1000],2:[1000,2000],3:[2000,3000]}},normalChapterAudio:null,
    plan:[],pi:0,pr:0,pieceCursor:0,planCycle:0,planCycleTemplate:null,pendingPracticeTransition:null,
    playing:false,waiting:null,pausedAtMs:null,lastLbl:'',htmlBtimer:null,useWA:false,
    audioRequestId:0,surahRequestId:1,selA:null,selB:2,wordArr:[{ay:1},{ay:1},{ay:1}],
    $:id=>{if(!buttons.has(id))buttons.set(id,{});return buttons.get(id);},
    activeStudySplitSelection:()=>null,audioTimingUnverified:()=>false,
    normalVerseStep:(_audio,from,to,o)=>({from,to,f:(from-1)*1000,t:to*1000,...o}),
    normalVersePlanReady:()=>true,unsafeNormalVerseStep:()=>false,
    clearHTMLPlaybackWatch(){},cancelFade(){},stopSrc(){},cancelHTMLFade(){},updateStat(){},clearTimeout(){},
    pauseThen:f=>f(),toast:message=>{c.message=message;},
    playAyahProgram:a=>fallback.push(a),togglePause:()=>{c.pauses=(c.pauses||0)+1;},
    goStep(){if(c.skipDisabledPracticeStep())return;const step=c.plan[c.pi];heard.push([step.f,step.t]);},
    finishPlan(){c.playing=false;c.finished=true;},
    runPlan(p){c.plan=p;c.planCycleTemplate=p;c.pi=0;c.pr=0;c.pieceCursor=0;c.planCycle=0;c.finished=false;c.playing=true;c.goStep();},
    stopPlan(){c.playing=false;c.audioRequestId++;},ac:()=>({state:'running'}),heard,fallback});
  for(const name of ['buildLadder','practiceUnit','practicePlan','stepReps','planCycleReps','advancePracticeCycle',
    'handleBoundary','skipDisabledPracticeStep','playReaderProgram','playStudySplitRange'])vm.runInContext(source(name),c);
  const handler=html.match(/^\$\('playBtn'\)\.onclick=\(\)=>\{[\s\S]*?^\};/m)?.[0];
  assert.ok(handler);vm.runInContext(handler,c);
  return {c,heard,fallback,play:()=>buttons.get('playBtn').onclick()};
}
function finish(c){
  let boundaries=0;
  while(c.playing&&boundaries++<200)c.handleBoundary();
  assert.ok(boundaries<200,'program terminates');
  assert.equal(c.finished,true);
  return c.heard;
}
test('main Play repeats the whole remaining chapter with the whole-study count',()=>{
  const {c,play}=harness('range');c.curAy=2;play();
  assert.deepEqual(finish(c),[[1000,3000],[1000,3000],[1000,3000]]);
  assert.equal(c.plan[0].full,false,'a study tour does not automatically open another surah');
  assert.deepEqual([c.SET.rep,c.SET.rangeRep,c.SET.combineRep],[2,3,4]);
});
test('main Play studies every remaining ayah separately and retains independent whole-study tours',()=>{
  const {c,play}=harness('verse');c.curAy=2;play();
  const tour=[[1000,2000],[1000,2000],[2000,3000],[2000,3000]];
  assert.deepEqual(finish(c),[...tour,...tour,...tour]);
  assert.deepEqual([c.SET.rep,c.SET.rangeRep,c.SET.combineRep],[2,3,4]);
});
test('main Play preserves continuous listening and cumulative entry points, and resumes instead of starting a second plan',()=>{
  for(const mode of ['range','verse','cumulative']){
    const {c,play,fallback}=harness(mode);c.SET.repOn=false;play();assert.deepEqual(fallback,[1]);
  }
  const {c,play,fallback}=harness('cumulative');play();assert.deepEqual(fallback,[1]);
  c.playing=true;play();assert.equal(c.pauses,1);assert.deepEqual(fallback,[1]);
});
test('main Play preserves selection and saved-study entry points',()=>{
  const {c,play}=harness('verse');const entered=[];
  c.playSelection=()=>entered.push('selection');c.selA=2;play();
  c.selA=null;c.studyRange={sid:1,from:1,to:2};c.playStudyRange=()=>entered.push('study');play();
  c.activeStudySplitSelection=()=>({parts:[1,2]});c.playActiveStudySplit=()=>entered.push('parts');play();
  assert.deepEqual(entered,['selection','study','parts']);assert.deepEqual(c.heard,[]);
});
test('main Play refuses incomplete or unsafe intermediate ayah audio',()=>{
  for(const mode of ['range','verse']){
    const {c,play}=harness(mode);delete c.AD_.ay[2];play();assert.deepEqual(c.heard,[]);assert.ok(c.message);
    c.AD_.ay[2]=[1000,2000];c.normalVersePlanReady=steps=>!steps.some(s=>s.ayEnd===2);play();
    assert.deepEqual(c.heard,[],'a whole-range plan must validate individual verse guards first');
  }
});
test('the explicit ayah-program entry keeps its single-ayah repeat behavior',()=>{
  const {c}=harness('range');vm.runInContext(source('playAyahProgram'),c);c.playAyahProgram(2);
  assert.deepEqual(finish(c),[[1000,2000],[1000,2000]]);
});
function splitFixture(c){
  const recipe={sid:1,fromAy:1,toAy:1,mode:'manual',cutsByAy:{1:[1,2]}};
  const parts=[{f:100,t:350},{f:350,t:700},{f:700,t:1000}].map((bounds,i)=>({...bounds,
    ay:1,fromPos:i+1,toPos:i+1,canPlay:true,recipe,reciterId:223,sourceId:c.AD_.sourceUrl}));
  c.studySplitRecipeCurrent=()=>true;c.buildStudySplitParts=()=>({parts});c.ayGi={1:[0,2]};
  return parts;
}
test('saved cuts in whole-study mode read only the chosen exact window once per tour',async()=>{
  const {c}=harness('range'),parts=splitFixture(c);
  assert.equal(await c.playStudySplitRange(parts,1,2),true);
  assert.equal(c.plan.length,1);assert.equal(c.plan[0].studyExact,true);
  assert.deepEqual(finish(c),[[350,1000],[350,1000],[350,1000]]);
  assert.deepEqual([c.SET.rep,c.SET.rangeRep,c.SET.combineRep],[2,3,4]);
});
test('saved cuts in verse mode repeat each chosen part and then the whole program',async()=>{
  const {c}=harness('verse'),parts=splitFixture(c);
  assert.equal(await c.playStudySplitRange(parts,1,2),true);
  assert.ok(c.plan.every(s=>s.studyExact));
  const tour=[[350,700],[350,700],[700,1000],[700,1000]];
  assert.deepEqual(finish(c),[...tour,...tour,...tour]);
});
test('a direct part tap still uses the part count even when the reader selects whole-study mode',async()=>{
  const {c}=harness('range'),parts=splitFixture(c);
  assert.equal(await c.playStudySplitRange(parts,1,1,{cycle:false}),true);
  assert.deepEqual(finish(c),[[350,700],[350,700]]);
  assert.equal(c.SET.rangeRep,3);
});
test('saved-cut cumulative programs retain their own combined repeat count and exact boundaries',async()=>{
  const {c}=harness('cumulative'),parts=splitFixture(c);c.SET.rangeRep=1;
  assert.equal(await c.playStudySplitRange(parts,1,2),true);
  assert.deepEqual(finish(c),[[350,700],[350,700],[700,1000],[700,1000],
    [350,1000],[350,1000],[350,1000],[350,1000]]);
  assert.ok(c.plan.every(s=>s.studyExact));
});
test('reader Combine synchronizes the canonical mode for both saved parts and ordinary reading',()=>{
  for(const partsActive of [true,false]){
    const {c}=harness('range'),modes=[],transitions=[];
    let mode='range';
    c.window.elifaPracticeMode=()=>mode;
    c.window.elifaSetPracticeMode=value=>{mode=value;modes.push(value);};
    c.activeStudySplitSelection=()=>partsActive?{parts:[1,2]}:null;
    c.cumuLongFired=false;c.saveSet=()=>{};c.syncPracticeControls=()=>{};
    c.queuePracticeModeChange=value=>transitions.push(value);
    const handler=html.match(/^\$\('cumuTog'\)\.onclick=\(\)=>\{[\s\S]*?^\};/m)?.[0];
    assert.ok(handler);vm.runInContext(handler,c);vm.runInContext(source('readerRepeatKey'),c);
    c.$('cumuTog').onclick();
    assert.equal(mode,'cumulative');assert.equal(c.SET.cumu,true);assert.equal(c.readerRepeatKey(),'rep');
    c.$('cumuTog').onclick();
    assert.equal(c.SET.cumu,false);
    assert.deepEqual(modes,['cumulative',partsActive?'verse':'range']);
    assert.deepEqual(transitions,modes);
    assert.equal(c.readerRepeatKey(),partsActive?'rep':'rangeRep');
    assert.deepEqual(c.heard,[],'changing the scope queues a transition without starting a second audio source');
    assert.deepEqual([c.SET.rep,c.SET.rangeRep,c.SET.combineRep],[2,3,4]);
  }
});
test('repeat edits distinguish saved parts from the separate legacy split screen',()=>{
  const {c}=harness(),changes=[];
  c.window.elifaRepeatSettingChanged=(key,context)=>changes.push([key,context]);
  c.saveSet=()=>{};c.syncPracticeControls=()=>{};
  c.$('repInp2').value='7';c.$('waitInp2').value='0';
  let legacySplit=false;c.$('split').classList={contains:()=>legacySplit};
  vm.runInContext(source('commitInputs2'),c);
  c.commitInputs2('rep');
  legacySplit=true;c.commitInputs2({target:{id:'repInp2'}});
  c.activeStudySplitSelection=()=>({parts:[1,2]});c.commitInputs2('rep');
  c.commitInputs2('wait');
  assert.deepEqual(changes,[['rep','ayah'],['rep','parts'],['rep','studyParts']]);
  assert.equal(c.SET.rep,7);assert.equal(c.SET.rangeRep,3);
});
test('a verified whole-ayah fallback counts down each repeat when individual word timing is missing',async()=>{
  const {c}=harness('verse');c.SET.rep=3;c.SET.rangeRep=1;c.selA=0;c.selB=2;c.ayGi={1:[0,2]};
  c.selRange=()=>[0,2];c.selTimes=()=>null;
  for(const name of ['playSelection','readerRepeatKey','remainingReaderRepeats'])vm.runInContext(source(name),c);
  await c.playSelection();
  assert.equal(c.plan[0].repeatKind,'ayah');assert.equal(c.remainingReaderRepeats(),3);
  c.handleBoundary();assert.equal(c.remainingReaderRepeats(),2);
  c.handleBoundary();assert.equal(c.remainingReaderRepeats(),1);
  assert.deepEqual(finish(c),[[0,1000],[0,1000],[0,1000]]);
  assert.equal(c.SET.rep,3,'progress never overwrites the configured repeat count');
});
test('verified single-selection fallbacks honor whole-study and verse counts without changing their audio bounds',async()=>{
  for(const mode of ['range','verse']){
    const {c}=harness(mode);c.selA=0;c.selB=2;c.ayGi={1:[0,2]};
    c.selRange=()=>[0,2];c.selTimes=()=>null;vm.runInContext(source('playSelection'),c);
    await c.playSelection();
    assert.equal(c.plan.practice.mode,mode);assert.equal(c.plan.practice.kind,'selection');
    const count=mode==='range'?3:6;
    assert.deepEqual(finish(c),Array.from({length:count},()=>[0,1000]));
    assert.deepEqual([c.SET.rep,c.SET.rangeRep],[2,3]);
  }
});
test('repaired word recordings retain their verified positions in both repeat scopes',async()=>{
  for(const mode of ['range','verse']){
    const {c}=harness(mode);c.SET.reciter=12;c.selA=0;c.selB=1;c.ayGi={1:[0,2]};
    c.wordArr=[{ay:1,pos:1},{ay:1,pos:2},{ay:1,pos:3}];c.selRange=()=>[0,1];
    c.HUSARY_WORD_REPAIRS=new Set(['1:1']);c.HUSARY_CHAPTER_GAPS=new Set();
    c.goStep=()=>{const piece=c.plan[c.pi].sourceRanges[0];c.heard.push([piece.verseSource,...piece.verifiedWordRange,piece.fullVerse]);};
    vm.runInContext(source('playSelection'),c);await c.playSelection();
    assert.equal(c.plan.practice.kind,'selection');assert.equal(c.plan.practice.mode,mode);
    assert.deepEqual(finish(c),Array.from({length:mode==='range'?3:6},()=>[1,1,2,false]));
  }
});
test('verified selection fallback can queue a mode change at its boundary without adding another source',async()=>{
  const {c}=harness('range');c.selA=0;c.selB=2;c.ayGi={1:[0,2]};
  c.selRange=()=>[0,2];c.selTimes=()=>null;
  for(const name of ['playSelection','queuePracticeModeChange','applyPendingPracticeTransition'])vm.runInContext(source(name),c);
  await c.playSelection();assert.equal(c.queuePracticeModeChange('verse'),true);
  assert.equal(c.heard.length,1,'the in-flight whole-study read is not restarted');
  c.handleBoundary();assert.equal(c.plan.practice.mode,'verse');
  assert.deepEqual(finish(c),Array.from({length:5},()=>[0,1000]));
  assert.deepEqual([c.SET.rep,c.SET.rangeRep],[2,3]);
});
test('a one-part saved study applies range-to-verse and verse-to-range transitions at its next boundary',()=>{
  for(const [from,to,total] of [['range','verse',5],['verse','range',3]]){
    const {c}=harness(from);
    for(const name of ['queuePracticeModeChange','applyPendingPracticeTransition'])vm.runInContext(source(name),c);
    c.runPlan(c.practicePlan({kind:'studyParts',units:[{f:100,t:350,x:1,dyn:true,studyExact:true,studyPart:0,repeatKind:'ayah'}]},from));
    assert.equal(c.queuePracticeModeChange(to),true);
    assert.equal(c.plan.practice.mode,from);assert.equal(c.heard.length,1,'the current audio is not restarted');
    c.handleBoundary();assert.equal(c.plan.practice.mode,to);assert.equal(c.planCycle,1);
    assert.deepEqual(finish(c),Array.from({length:total},()=>[100,350]));
    assert.equal(c.plan[0].studyExact,true);assert.deepEqual([c.SET.rep,c.SET.rangeRep],[2,3]);
  }
});
