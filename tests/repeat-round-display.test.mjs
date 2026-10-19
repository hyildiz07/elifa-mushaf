import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync('index.html','utf8');
function source(name){
 const start=html.search(new RegExp('(?:async )?function '+name+'\\('));assert.ok(start>=0,name);
 const lineEnd=html.indexOf('\n',start),line=html.slice(start,lineEnd).trimEnd();
 return html.slice(start,line.endsWith('}')?lineEnd:html.indexOf('\n}',start)+2);
}
function harness(){
 const nodes=new Map(),heard=[];
 const node=id=>{if(!nodes.has(id))nodes.set(id,{dataset:{},attrs:{},textContent:'',classList:{contains:()=>false,toggle(){},remove(){}},setAttribute(k,v){this.attrs[k]=v;}});return nodes.get(id);};
 const c=vm.createContext({SET:{rep:2,combineRep:1,rangeRep:9,repOn:true,cumu:true},
  plan:[],pi:0,pr:0,pieceCursor:0,planCycle:0,planCycleTemplate:null,pendingPracticeTransition:null,completedStudyRounds:false,completedStepRepeatKey:null,
  playing:false,AD_:{ay:{1:[0,1000],2:[1000,2000],3:[2000,3000]},audio:{pause(){}}},normalChapterAudio:null,curS:1,SURAHS:[{n:3,tr:'Test'}],splitAy:null,
  audioRequestId:0,stepRequestId:0,pausedAtMs:null,raf:null,waiting:null,pendingFn:null,htmlBtimer:null,lastLbl:'',
  srcNode:{},clipAudio:null,htmlPlaybackWatch:null,useWA:false,$:node,document:{querySelector:()=>node('repctl')},
  window:{},audioTimingUnverified:()=>false,normalVersePlanReady:()=>true,
  normalVerseStep:(_a,from,to,o)=>({from,to,f:(from-1)*1000,t:to*1000,...o}),
  clearHTMLPlaybackWatch(){},cancelFade(){},stopSrc(){},cancelHTMLFade(){},clearHi(){},setIco(){},wake(){},updateStat(){},
  clearTimeout(){},cancelAnimationFrame(){},toast(){},pauseThen:fn=>fn(),saveSet(){},syncPracticeControls:()=>c.syncPlaybackRepeatCounters(),
  curMs:()=>123,stepBounds:step=>({f:step.f,t:step.t}),seekPlay:(f,t)=>heard.push(['resume',f,t]),
  heard,console});
 for(const name of ['stepReps','planCycleReps','buildLadder','practiceUnit','practicePlan','applyPendingPracticeTransition',
  'advancePracticeCycle','handleBoundary','runPlan','finishPlan','stopPlan','syncRepeatScope','readerRepeatKey',
  'remainingStudyRounds','splitRepeatKey','remainingStepRepeats','syncPlaybackRepeatCounters','syncRep','syncRep2',
  'goStep','skipDisabledPracticeStep','pausePlayback','resumePlayback'])vm.runInContext(source(name),c);
 return {c,node,heard,count:()=>Number(node('repN').textContent)};
}
test('single-step whole-range counter decreases once per complete pass, preserves settings, survives pause and resets only for a new or stopped program',()=>{
 const {c,count}=harness(),p=[{from:1,to:3,f:0,t:3000,x:1,dyn:true,repeatKind:'range'}];
 c.runPlan(p);assert.equal(count(),9);
 c.handleBoundary();assert.equal(count(),8);assert.equal(c.SET.rangeRep,9);assert.equal(c.SET.rep,2);
 c.pausePlayback();c.syncRep();assert.equal(count(),8);assert.equal(c.pausedAtMs,123);
 c.resumePlayback();assert.equal(count(),8);assert.equal(c.pr,1);assert.equal(c.pausedAtMs,null);
 for(let i=0;i<8;i++)c.handleBoundary();assert.equal(c.playing,false);assert.equal(count(),0);
 assert.equal(c.SET.rangeRep,9);assert.equal(c.SET.rep,2);
 c.runPlan(p);assert.equal(count(),9);c.handleBoundary();assert.equal(count(),8);
 c.stopPlan(false);assert.equal(count(),9,'manual stop restores the configured value for the next start');
});
for(const mode of ['range','verse','cumulative'])test(mode+' plan consumes one outer round only after all its solo and combined steps finish',()=>{
 const {c,count}=harness();c.SET.rangeRep=3;
 c.runPlan(c.practicePlan({kind:'ayah',from:1,to:3},mode));assert.equal(count(),3);
 let previousCycle=0,boundaries=0;
 while(c.playing&&boundaries++<100){
  c.handleBoundary();
  if(c.playing){assert.equal(count(),3-c.planCycle);if(c.planCycle===previousCycle)assert.equal(count(),3-previousCycle,'inner repeats must not consume a whole round');previousCycle=c.planCycle;}
 }
 assert.ok(boundaries<100);assert.equal(count(),0);assert.equal(c.SET.rangeRep,3);assert.equal(c.SET.rep,2);assert.equal(c.SET.combineRep,1);
});
test('the reader whole-study buttons adjust only the configured tour count while split quick controls remain per-part',()=>{
 const {c,node,count}=harness();c.syncRep();c.syncRep2();assert.equal(c.readerRepeatKey(),'rangeRep');
 assert.equal(node('repN2').textContent,2);assert.equal(count(),9);
 for(const id of ['repPlus','repMinus','repPlus2']){
  const line=html.split('\n').find(line=>line.startsWith("$('"+id+"').onclick="));assert.ok(line,id);vm.runInContext(line,c);
 }
 node('repPlus').onclick();assert.equal(c.SET.rangeRep,10);assert.equal(c.SET.rep,2);assert.equal(count(),10);
 node('repMinus').onclick();assert.equal(c.SET.rangeRep,9);assert.equal(c.SET.rep,2);
 node('repPlus2').onclick();assert.equal(c.SET.rep,3);assert.equal(c.SET.rangeRep,9);
});
test('a single selected part with outer cycling disabled reports one program pass without decrementing its own repetitions',()=>{
 const {c,count}=harness(),units=[{f:0,t:1000,x:1,dyn:true,studyPart:0,repeatKind:'ayah'}];
 c.runPlan(c.practicePlan({kind:'studyParts',units,cycle:false},'verse'));c.syncRep2();
 assert.equal(count(),1);assert.equal(c.$('repN2').textContent,2);
 c.handleBoundary();assert.equal(count(),1);assert.equal(c.SET.rep,2);
 assert.equal(c.$('repN2').textContent,1);
 c.handleBoundary();assert.equal(count(),0);assert.equal(c.SET.rangeRep,9);
 assert.equal(c.$('repN2').textContent,0);
});

test('the existing part counter counts down, survives pause and resets at the next part without changing settings',()=>{
 const {c,node}=harness();c.SET.rep=7;c.SET.rangeRep=1;
 let focusedPart=-1;c.window.elifaStudySplitSetIndex=index=>{focusedPart=index;};
 const units=[0,1].map(i=>({f:i*1000,t:(i+1)*1000,x:1,dyn:true,studyPart:i}));
 c.runPlan(c.practicePlan({kind:'studyParts',units},'verse'));
 assert.equal(node('repN2').textContent,7);
 assert.equal(focusedPart,0);
 for(let remaining=6;remaining>=1;remaining--){c.handleBoundary();assert.equal(node('repN2').textContent,remaining);}
 c.pausePlayback();c.syncPlaybackRepeatCounters();assert.equal(node('repN2').textContent,1);
 c.resumePlayback();assert.equal(node('repN2').textContent,1);
 c.handleBoundary();assert.equal(c.pi,1);assert.equal(node('repN2').textContent,7,'the new part starts with its configured repeat count');
 assert.equal(focusedPart,1,'the current card and its repeat counter advance together');
 for(let i=0;i<7;i++)c.handleBoundary();
 assert.equal(node('repN2').textContent,0);assert.equal(c.SET.rep,7);assert.equal(c.SET.rangeRep,1);
 c.stopPlan(false);assert.equal(node('repN2').textContent,7,'manual stop prepares the next start');
});

test('combined steps count down their own repetitions and quick adjustments preserve the individual-part setting',()=>{
 const {c,node}=harness();c.SET.rep=2;c.SET.combineRep=3;c.SET.rangeRep=1;
 const units=[0,1].map(i=>({f:i*1000,t:(i+1)*1000,x:1,dyn:true,part:i}));
 const p=c.practicePlan({kind:'studyParts',units},'cumulative');c.runPlan(p);
 for(let i=0;i<4;i++)c.handleBoundary();
 assert.equal(c.pi,2);assert.equal(c.splitRepeatKey(),'combineRep');assert.equal(node('repN2').textContent,3);
 assert.equal(node('splitRepeatScope').textContent,'1+2');
 c.handleBoundary();assert.equal(node('repN2').textContent,2);
 for(const id of ['repPlus2','repMinus2']){
  const line=html.split('\n').find(line=>line.startsWith("$('"+id+"').onclick="));vm.runInContext(line,c);
 }
 node('repPlus2').onclick();assert.equal(c.SET.combineRep,4);assert.equal(node('repN2').textContent,3);
 node('repMinus2').onclick();assert.equal(c.SET.combineRep,3);assert.equal(node('repN2').textContent,2);
 assert.equal(c.SET.rep,2);assert.equal(c.SET.rangeRep,1);
 c.handleBoundary();assert.equal(node('repN2').textContent,1);
 c.pausePlayback();c.resumePlayback();assert.equal(node('repN2').textContent,1);
 c.handleBoundary();assert.equal(node('repN2').textContent,0);assert.equal(c.SET.combineRep,3);
 c.runPlan(p);assert.equal(node('repN2').textContent,2);assert.equal(c.splitRepeatKey(),'rep');
});

test('a multi-source part consumes a repetition only after its last audio piece',()=>{
 const {c,node}=harness();c.SET.rep=2;
 c.runPlan([{f:0,t:1000,x:1,dyn:true,studyPart:0,repeatKind:'ayah',ranges:[{f:0,t:400},{f:400,t:1000}]}]);
 c.handleBoundary();assert.equal(c.pieceCursor,1);assert.equal(node('repN2').textContent,2);
 c.handleBoundary();assert.equal(c.pieceCursor,0);assert.equal(node('repN2').textContent,1);
 c.handleBoundary();assert.equal(node('repN2').textContent,1);
 c.handleBoundary();assert.equal(node('repN2').textContent,0);assert.equal(c.SET.rep,2);
});
