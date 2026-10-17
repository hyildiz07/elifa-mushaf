import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {validStudySettings,validStudyProgress} from '../src/study-settings.mjs';
function harness(){
 const nodes=new Map();class Element{
  constructor(){this.dataset={};this.children=[];this.value='';this.hidden=false;this.handlers={};this.attrs={};this.classes=new Set();this.classList={contains:c=>this.classes.has(c),add:c=>this.classes.add(c)};}
  set id(v){this._id=v;nodes.set(v,this);}get id(){return this._id;}
  append(...v){this.children.push(...v);}before(){}after(){}setAttribute(k,v){this.attrs[k]=v;}
  addEventListener(k,fn){this.handlers[k]=fn;}dispatchEvent(e){this.handlers[e.type]?.(e);}showModal(){this.open=true;}close(){this.open=false;}
 }
 for(const m of fs.readFileSync('index.html','utf8').matchAll(/\bid="([^"]+)"/g)){const el=new Element();el.id=m[1];}
 nodes.get('studySetup').classes.add('on');const events=[],progress=[];
 const c=vm.createContext({document:{getElementById:id=>nodes.get(id)||null,createElement:()=>new Element(),body:new Element()},
  window:{tr:k=>k,addEventListener(){},elifaApplyI18n(){},elifaLog:(event,p)=>events.push({event,...p}),elifaStudySessions:{rememberProgress:p=>progress.push(p)}},
  SET:{reciter:223,speed:1,rep:5,repOn:true,wait:0,cumu:true},RECITERS:[{id:223,n:'Afasy'},{id:7,n:'Husary'}],SURAHS:[{tr:'Fatiha'}],
  plan:[],pi:0,pr:0,playing:false,curS:1,curAy:1,studyRange:{sid:1,from:1,to:5},rangeSelectionDraft:null,gearCtx:'ayah',
  stepReps:()=>5,saveSet(){},syncRep(){},syncRep2(){},syncCumu(){},syncSpeedBtn(){},renderContinue(){},renderHomeHeroLine(){},toast(){},
  MutationObserver:class{observe(){}},Event:class{constructor(type){this.type=type;}},navigator:{onLine:true},validStudySettings,validStudyProgress});
 vm.runInContext(fs.readFileSync('src/study-workflow.mjs','utf8').replace(/^import[^\n]*\n/,''),c);
 return {c,nodes,events,progress};
}
test('workflow mounts against real page anchors and restores saved settings independently of global combine',()=>{
 const {c,nodes}=harness();const settings={reciter:7,speed:1.25,rep:3,repOn:true,wait:2,mode:'verse',splitCombine:false};
 c.window.elifaStudySettings.load({settings});assert.deepEqual(JSON.parse(JSON.stringify(c.window.elifaStudySettings.capture())),{...settings,combineRep:3,rangeRep:3});
 c.window.elifaStudySettings.beforeOpen();assert.equal(c.SET.cumu,false);assert.equal(c.SET.reciter,7);assert.equal(c.window.elifaPracticeMode(),'verse');
 nodes.get('studySetting_rep').value=100;assert.equal(c.window.elifaStudySettings.beforeOpen(),false);assert.equal(c.SET.rep,3);
});
test('study progress is bounded and completion emits once without a false stop',()=>{
 const {c,events,progress,nodes}=harness();nodes.get('studySetup').classes.delete('on');
 c.plan=[{ayEnd:5}];c.window.elifaPlaybackEvent('start');c.window.elifaPlaybackEvent('progress');
 assert.equal(progress[0].ay,1,'whole-range resume starts at the beginning of its pass');
 c.pr=2;c.window.elifaPlaybackEvent('progress');assert.match(nodes.get('practiceProgress').textContent,/practice_progress/);
 c.window.elifaPlaybackEvent('complete');c.window.elifaPlaybackEvent('stop');
 assert.deepEqual(events.map(x=>x.event),['playback_start','playback_complete']);assert.equal(progress.at(-1).completed,true);
});

test('three repeat counts save independently and display the outer study round',()=>{
 const {c,nodes}=harness();const settings={reciter:223,speed:1,rep:2,combineRep:3,rangeRep:4,repOn:true,wait:0,mode:'cumulative',splitCombine:true};
 c.window.elifaStudySettings.load({settings});assert.deepEqual(JSON.parse(JSON.stringify(c.window.elifaStudySettings.capture())),settings);
 c.window.elifaStudySettings.beforeOpen();assert.deepEqual([c.SET.rep,c.SET.combineRep,c.SET.rangeRep],[2,3,4]);
 nodes.get('studySetup').classes.delete('on');c.plan=[{ayEnd:2,repeatKind:'combine'}];c.planCycle=1;c.planCycleReps=()=>4;
 c.window.elifaPlaybackEvent('start');c.window.elifaPlaybackEvent('progress');
 assert.match(nodes.get('practiceProgress').textContent,/practice_cycle/);
});

test('live mode selection queues the requested mode while setup selection remains silent',()=>{
 const {c,nodes}=harness(),queued=[];c.queuePracticeModeChange=mode=>queued.push(mode);
 nodes.get('studyMode').value='verse';nodes.get('studyMode').handlers.change();assert.deepEqual(queued,[]);
 nodes.get('practiceMode').value='verse';nodes.get('practiceMode').handlers.change();assert.deepEqual(queued,['verse']);assert.equal(c.SET.cumu,false);
 nodes.get('practiceMode').value='cumulative';nodes.get('practiceMode').handlers.change();assert.deepEqual(queued,['verse','cumulative']);assert.equal(c.SET.cumu,true);
});
test('split resume focuses the saved verse and part without starting playback',()=>{
 const {c}=harness();const restored=[];c.window.elifaResumeStudySplit=(a,p)=>restored.push([a,p]);
 const item={sid:1,from:1,to:5,progress:{ay:3,part:2,completed:false}};
 c.window.elifaStudySettings.load(item,{resume:true});const target=c.window.elifaStudySettings.beforeOpen();assert.equal(target.ay,3);
 c.window.elifaStudySettings.afterOpen();assert.deepEqual(restored,[[3,2]]);assert.equal(c.playing,false);assert.equal(c.window.elifaStudySettings.resume(),null);
});


test('zero combine and tour preferences save and reopen without being replaced by one',()=>{
 const {c,nodes}=harness();const settings={reciter:223,speed:1,rep:1,combineRep:0,rangeRep:0,repOn:true,wait:0,mode:'cumulative',splitCombine:true};
 assert.equal(validStudySettings(settings),true);
 for(const key of ['combineRep','rangeRep'])assert.equal(validStudySettings({...settings,[key]:-1}),false);
 c.window.elifaStudySettings.load({settings});assert.equal(Number(nodes.get('studySetting_combineRep').value),0);
 assert.equal(Number(nodes.get('studySetting_rangeRep').value),0);
 c.window.elifaStudySettings.beforeOpen();assert.deepEqual([c.SET.combineRep,c.SET.rangeRep],[0,0]);
 assert.deepEqual(JSON.parse(JSON.stringify(c.window.elifaStudySettings.capture())),settings);
});
