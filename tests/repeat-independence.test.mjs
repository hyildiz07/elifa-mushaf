import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync('index.html','utf8');
function fn(name){const start=html.search(new RegExp('(?:async )?function '+name+'\\('));assert.ok(start>=0,name);return html.slice(start,html.indexOf('\n}',start)+2);}
function harness(){
  const heard=[];const c=vm.createContext({SET:{rep:2,combineRep:1,rangeRep:2,repOn:true,cumu:true},
    AD_:{ay:{1:[0,1000],2:[1000,2000],3:[2000,3000]},audio:{pause(){}}},normalChapterAudio:null,
    normalVerseStep:(_a,from,to,o)=>({from,to,f:(from-1)*1000,t:to*1000,...o}),normalVersePlanReady:()=>true,
    plan:[],pi:0,pr:0,pieceCursor:0,planCycle:0,planCycleTemplate:null,pendingPracticeTransition:null,
    playing:true,waiting:null,lastLbl:'',htmlBtimer:null,useWA:false,
    clearHTMLPlaybackWatch(){},cancelFade(){},stopSrc(){},cancelHTMLFade(){},updateStat(){},
    pauseThen:f=>f(),clearTimeout(){},finished:false,selA:5,selB:9,
    goStep(){if(c.skipDisabledPracticeStep())return;heard.push(c.plan[c.pi].from===undefined?[c.plan[c.pi].f,c.plan[c.pi].t]:[c.plan[c.pi].from,c.plan[c.pi].to]);},
    finishPlan(){c.finished=true;},heard});
  for(const n of ['buildLadder','stepReps','planCycleReps','practiceUnit','practicePlan','queuePracticeModeChange','applyPendingPracticeTransition','advancePracticeCycle','handleBoundary','skipDisabledPracticeStep'])vm.runInContext(fn(n),c);
  return c;
}
function start(c,p){c.plan=p;c.planCycleTemplate=p;c.goStep();}
function finish(c){for(let i=0;i<1000&&!c.finished;i++)c.handleBoundary();assert.equal(c.finished,true,'bounded completion');return c.heard;}

test('independent counts: ayah twice, combined once, complete 1–3 program twice',()=>{
  const c=harness(),p=c.practicePlan({kind:'ayah',from:1,to:3},'cumulative');start(c,p);
  const one=[[1,1],[1,1],[2,2],[2,2],[1,2],[3,3],[3,3],[1,3]];
  assert.deepEqual(finish(c),[...one,...one]);assert.equal(p.length,5,'outer tours never duplicate the plan array');
});
test('plain range uses only rangeRep; unrelated counts do not multiply it',()=>{
  const c=harness();c.SET.rep=7;c.SET.combineRep=9;c.SET.rangeRep=3;
  const p=[{from:1,to:3,f:0,t:3000,x:1,dyn:true,repeatKind:'range',ayEnd:3}];p.practice={kind:'ayah',from:1,to:3,mode:'range'};
  start(c,p);assert.deepEqual(finish(c),[[1,3],[1,3],[1,3]]);
});
test('changing one count live leaves the other repeat scopes unchanged',()=>{
  const c=harness(),ayah={dyn:true,repeatKind:'ayah'},combined={dyn:true,repeatKind:'combine'},range={dyn:true,repeatKind:'range'};
  c.SET.combineRep=4;assert.deepEqual([c.stepReps(ayah),c.stepReps(combined),c.stepReps(range)],[2,4,2]);
  c.SET.rangeRep=5;assert.deepEqual([c.stepReps(ayah),c.stepReps(combined),c.stepReps(range)],[2,4,5]);
  c.SET.repOn=false;assert.deepEqual([c.stepReps(ayah),c.stepReps(combined),c.stepReps(range)],[1,1,1]);
});
test('turning 1+2 off finishes current audio, preserves selection and continues range without a restart',()=>{
  const c=harness();start(c,c.practicePlan({kind:'ayah',from:1,to:3},'cumulative'));
  assert.equal(c.queuePracticeModeChange(false),true);assert.deepEqual(c.heard,[[1,1]],'button does not seek/restart current audio');
  c.handleBoundary();assert.deepEqual(c.heard,[[1,1],[2,3]],'next step continues after the completed ayah');
  assert.deepEqual([c.selA,c.selB],[5,9]);assert.deepEqual([c.SET.rep,c.SET.combineRep,c.SET.rangeRep],[2,1,2]);
  assert.deepEqual(finish(c),[[1,1],[2,3],[1,3]],'only the remaining full-range tour returns to the original start');
});
test('turning 1+2 on while a range plays keeps completed tour count',()=>{
  const c=harness(),p=[{from:1,to:3,f:0,t:3000,x:1,dyn:true,repeatKind:'range',ayEnd:3}];p.practice={kind:'ayah',from:1,to:3,mode:'range'};start(c,p);
  c.queuePracticeModeChange(true);assert.deepEqual(c.heard,[[1,3]]);
  assert.deepEqual(finish(c),[[1,3],[1,1],[1,1],[2,2],[2,2],[1,2],[3,3],[3,3],[1,3]]);
});
test('an idle or paused setting change does not initiate playback or discard the marker',()=>{
  const c=harness();c.playing=false;c.plan=[];
  assert.equal(c.queuePracticeModeChange(true),false);assert.deepEqual(c.heard,[]);assert.deepEqual([c.selA,c.selB],[5,9]);
});
test('repeat disabled prevents outer tours but still plays each planned step once',()=>{
  const c=harness();c.SET.repOn=false;start(c,c.practicePlan({kind:'ayah',from:1,to:3},'cumulative'));
  assert.deepEqual(finish(c),[[1,1],[2,2],[1,2],[3,3],[1,3]]);
});
test('a guarded final verse does not loop or transition into unverified audio',()=>{
  const c=harness(),p=c.practicePlan({kind:'ayah',from:1,to:1},'cumulative');p.at(-1).guardedTail=true;start(c,p);
  c.queuePracticeModeChange(false);assert.deepEqual(finish(c),[[1,1],[1,1]]);assert.equal(c.planCycle,0);
});
test('selected word range stays inside the original first and last word in both modes',()=>{
  const c=harness();c.window={elifaPracticeMode:()=>'cumulative'};c.selRange=()=>[0,3];
  c.wordArr=[{ay:1,pos:2,s:100,e:500},{ay:1,pos:3,s:500,e:900},{ay:2,pos:1,s:1100,e:1500},{ay:2,pos:2,s:1500,e:1900}];
  vm.runInContext(fn('selectionPracticePlan'),c);
  const p=c.selectionPracticePlan({f:100,t:1900,x:1,dyn:true,wordCut:true,cutKey:'2:2',l:'Selected'});
  assert.deepEqual(Array.from(p,s=>[s.f,s.t,s.repeatKind]),[[100,900,'ayah'],[1100,1900,'ayah'],[100,1900,'combine']]);
  assert.ok(p.every(s=>s.f>=100&&s.t<=1900));
  start(c,p);c.queuePracticeModeChange(false);c.handleBoundary();
  assert.equal(c.plan[0].f,1100);assert.equal(c.plan[0].t,1900);assert.deepEqual([c.selA,c.selB],[5,9]);
});
test('legacy repeat preference migrates once to separate independent counts',()=>{
  const start=html.indexOf('// Preserve the old count once'),end=html.indexOf('// Repeat and cumulative playback',start);
  const code=html.slice(start,end),c=vm.createContext({SET:{rep:6}});vm.runInContext(code,c);
  assert.deepEqual([c.SET.rep,c.SET.combineRep,c.SET.rangeRep],[6,6,6]);c.SET.combineRep=2;c.SET.rangeRep=3;c.SET.rep=9;vm.runInContext(code,c);
  assert.deepEqual([c.SET.rep,c.SET.combineRep,c.SET.rangeRep],[9,2,3]);
});
test('three independently labelled controls exist and commit without triggering playback',()=>{
  for(const [key,id] of [['repeat_ayah_count','repInp'],['repeat_combine_count','combineRepInp'],['repeat_range_count','rangeRepInp']]){
    assert.ok(html.includes(`data-i18n="${key}"`));assert.ok(html.includes(`id="${id}"`));
  }
  const values={repInp:2,combineRepInp:1,rangeRepInp:3,waitInp:0,spdInp:1,startPadInp:0,endPadInp:0};
  const c=vm.createContext({SET:{},$:id=>id in values?{value:values[id]}:null,saveSet(){},applyLiveSpeed(){},syncRep(){},syncSpeedBtn(){}});
  vm.runInContext(fn('commitInputs'),c);c.commitInputs();assert.deepEqual([c.SET.rep,c.SET.combineRep,c.SET.rangeRep],[2,1,3]);
});

test('settings mode switch to verse keeps a different count for complete tours',()=>{
  const c=harness();start(c,c.practicePlan({kind:'ayah',from:1,to:3},'cumulative'));
  c.queuePracticeModeChange('verse');c.handleBoundary();
  assert.deepEqual(finish(c),[[1,1],[2,2],[2,2],[3,3],[3,3],[1,1],[1,1],[2,2],[2,2],[3,3],[3,3]]);
});
test('switching back before the audio boundary cancels the pending mode change',()=>{
  const c=harness();start(c,c.practicePlan({kind:'ayah',from:1,to:3},'cumulative'));
  assert.equal(c.queuePracticeModeChange('range'),true);assert.equal(c.queuePracticeModeChange('cumulative'),false);
  assert.equal(c.pendingPracticeTransition,null);c.handleBoundary();assert.deepEqual(c.heard,[[1,1],[1,1]]);
});
test('switching mode during the waiting gap applies before another repeat starts',()=>{
  const c=harness();start(c,c.practicePlan({kind:'ayah',from:1,to:3},'cumulative'));
  c.waiting={};c.pendingFn=()=>c.goStep();c.queuePracticeModeChange('range');
  c.pendingFn();assert.deepEqual(c.heard,[[1,1],[2,3]]);
});
test('manually split three parts use independent individual, combined and tour counts',()=>{
  const c=harness(),units=[0,1,2].map(i=>({f:i*1000,t:(i+1)*1000,x:1,dyn:true,studyExact:true,studyPart:i,l:'Part '+i}));
  const p=c.practicePlan({kind:'studyParts',units},'cumulative');start(c,p);
  const one=[[0,1000],[0,1000],[1000,2000],[1000,2000],[0,2000],[2000,3000],[2000,3000],[0,3000]];
  assert.deepEqual(finish(c),[...one,...one]);assert.equal(p.length,5);
});
test('separate split-page plans retain their validated repeated audio ranges while changing mode',()=>{
  const c=harness();c.splitParts=[0,1,2].map(i=>({f:i*1000,t:(i+1)*1000,words:[{pos:i+1}]}));
  c.partStep=(p,k,f,l,combo)=>({f,t:p.t,l,part:k,combo,x:1,dyn:true,ranges:combo?[{f,t:p.t}]:[{f:p.f,t:p.t}]});
  vm.runInContext(fn('buildPartsPlan'),c);const p=c.buildPartsPlan(0);start(c,p);
  c.queuePracticeModeChange(false);c.handleBoundary();
  assert.equal(c.plan[0].part,1);assert.equal(c.plan[0].combo,false);assert.deepEqual(Array.from(c.plan[0].ranges,r=>[r.f,r.t]),[[1000,2000]]);
});

test('listening to one saved part uses only the part count, not the range tour count',()=>{
  const c=harness(),units=[{f:1000,t:2000,x:1,dyn:true,studyExact:true,studyPart:1,l:'Part 2'}];
  const p=c.practicePlan({kind:'studyParts',units,cycle:false},'cumulative');start(c,p);
  assert.equal(c.queuePracticeModeChange(false),false,'a one-part toggle cannot restart or shorten its repeat');
  assert.deepEqual(finish(c),[[1000,2000],[1000,2000]]);
  vm.runInContext(fn('playStudySplitPart'),c);let options;c.activeStudySplitSelection=()=>({parts:units});c.playStudySplitRange=(parts,first,last,opts)=>{options=opts;return true;};
  assert.equal(c.playStudySplitPart(units[0]),true);assert.equal(options.cycle,false);
});

test('a fully marked ayah never expands into the rest of the surah when 1+2 is on',()=>{
  const c=harness();c.window={elifaPracticeMode:()=>'cumulative'};c.curS=1;c.SURAHS=[{n:3}];c.studyRange=null;
  c.audioTimingUnverified=()=>false;c.unsafeNormalVerseStep=()=>false;c.runPlan=p=>{c.result=p;};c.toast=()=>{};
  vm.runInContext(fn('playAyahProgram'),c);c.playAyahProgram(2,2);
  assert.deepEqual(Array.from(c.result,s=>[s.from,s.to]),[[2,2]]);assert.equal(c.result.rangeCycles,false);
  const button={};const args=[];c.$=()=>button;c.playing=false;c.activeStudySplitSelection=()=>null;
  c.selA=4;c.selB=6;c.selMode='ayah';c.wordArr=Array.from({length:7},()=>({ay:2}));c.ayGi={2:[4,6]};
  c.playAyahProgram=(...a)=>args.push(a);c.playSelection=()=>args.push('selection');
  const handler=html.match(/^\$\('playBtn'\)\.onclick=\(\)=>\{[\s\S]*?^\};/m)?.[0];vm.runInContext(handler,c);button.onclick();
  assert.deepEqual(args,[[2,2]]);
});


test('zero combine skips cumulative passages and zero whole-study count never restarts',()=>{
  const c=harness();c.SET.rep=1;c.SET.combineRep=0;c.SET.rangeRep=0;
  start(c,c.practicePlan({kind:'ayah',from:1,to:3},'cumulative'));
  assert.deepEqual(finish(c),[[1,1],[2,2],[3,3]]);
  assert.equal(c.planCycle,0);
});
test('zero combine keeps individual repeats and a positive independent whole-study count',()=>{
  const c=harness();c.SET.combineRep=0;c.SET.rangeRep=2;
  start(c,c.practicePlan({kind:'ayah',from:1,to:3},'cumulative'));
  const one=[[1,1],[1,1],[2,2],[2,2],[3,3],[3,3]];
  assert.deepEqual(finish(c),[...one,...one]);
});
test('zero disables combined steps even with the master repeat switch off',()=>{
  const c=harness();c.SET.combineRep=0;c.SET.repOn=false;
  start(c,c.practicePlan({kind:'ayah',from:1,to:3},'cumulative'));
  assert.deepEqual(finish(c),[[1,1],[2,2],[3,3]]);
});
test('zero whole-study count still reads the fluent range once, not zero times',()=>{
  const c=harness();c.SET.rangeRep=0;
  start(c,c.practicePlan({kind:'ayah',from:1,to:3},'range'));
  assert.deepEqual(finish(c),[[1,3]]);
});
test('zero preferences survive startup migration and settings commit',()=>{
  const start=html.indexOf('// Preserve the old count once'),end=html.indexOf('// Repeat and cumulative playback',start);
  const code=html.slice(start,end),c=vm.createContext({SET:{rep:2,combineRep:0,rangeRep:0}});vm.runInContext(code,c);
  assert.deepEqual([c.SET.rep,c.SET.combineRep,c.SET.rangeRep],[2,0,0]);
  const values={repInp:2,combineRepInp:0,rangeRepInp:0,waitInp:0,spdInp:1,startPadInp:0,endPadInp:0};
  c.$=id=>id in values?{value:values[id]}:null;c.saveSet=()=>{};c.applyLiveSpeed=()=>{};c.syncRep=()=>{};c.syncSpeedBtn=()=>{};
  vm.runInContext(fn('commitInputs'),c);c.commitInputs();assert.deepEqual([c.SET.rep,c.SET.combineRep,c.SET.rangeRep],[2,0,0]);
});
test('zero-count split practice plays only the chosen three parts once',()=>{
  const c=harness();c.SET.rep=1;c.SET.combineRep=0;c.SET.rangeRep=0;
  const units=[0,1,2].map(i=>({f:i*1000,t:(i+1)*1000,x:1,dyn:true,studyExact:true,studyPart:i}));
  start(c,c.practicePlan({kind:'studyParts',units},'cumulative'));
  assert.deepEqual(finish(c),[[0,1000],[1000,2000],[2000,3000]]);
});


test('quick repeat labels follow their own scope, count, enabled state and language',()=>{
  const nodes=new Map();const node=id=>{if(!nodes.has(id))nodes.set(id,{dataset:{},attrs:{},classList:{contains:()=>false,toggle(){}},setAttribute(k,v){this.attrs[k]=v;}});return nodes.get(id);};
  let mode='range',split=false,language='tr';
  const c=vm.createContext({SET:{rep:3,rangeRep:0,combineRep:7,repOn:false},$:node,document:{querySelector:()=>node('repctl')},playing:false,splitAy:null,
    activeStudySplitSelection:()=>split,window:{elifaPracticeMode:()=>mode,elifaT:key=>({tr:{repeat_scope_work:'Tüm çalışma',repeat_scope_unit:'Âyet / parça'},en:{repeat_scope_work:'Whole study',repeat_scope_unit:'Verse / part'}})[language][key]}});
  for(const name of ['syncRepeatScope','readerRepeatKey','syncRep','syncRep2'])vm.runInContext(fn(name),c);
  c.syncRep();c.syncRep2();
  assert.equal(node('readerRepeatScope').textContent,'Tüm çalışma');assert.equal(node('repN').textContent,0);assert.equal(node('repTog').attrs['aria-pressed'],'false');
  assert.equal(node('splitRepeatScope').textContent,'Âyet / parça');assert.equal(node('repN2').textContent,3);
  mode='cumulative';c.SET.repOn=true;c.syncRep();assert.equal(node('readerRepeatScope').dataset.i18n,'repeat_scope_unit');assert.equal(node('repN').textContent,3);assert.equal(node('repTog').attrs['aria-pressed'],'true');
  mode='range';split=true;c.syncRep();assert.equal(node('readerRepeatScope').textContent,'Âyet / parça');
  split=false;language='en';c.syncRep();c.syncRep2();assert.equal(node('readerRepeatScope').textContent,'Whole study');assert.equal(node('splitRepeatScope').textContent,'Verse / part');
  assert.deepEqual([c.SET.rep,c.SET.rangeRep,c.SET.combineRep],[3,0,7],'presentation never changes independent counts');
});
