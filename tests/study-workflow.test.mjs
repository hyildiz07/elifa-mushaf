import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {validStudySettings,validStudyProgress} from '../src/study-settings.mjs';
function harness(initial={}){
 const nodes=new Map(),timers=new Map();let timerId=0;class Element{
  constructor(){this.dataset={};this.children=[];this.value='';this.hidden=false;this.handlers={};this.attrs={};this.classes=new Set();this.classList={contains:c=>this.classes.has(c),add:c=>this.classes.add(c),toggle:(c,on)=>on?this.classes.add(c):this.classes.delete(c)};}
  set id(v){this._id=v;nodes.set(v,this);}get id(){return this._id;}
  append(...v){this.children.push(...v);for(const child of v)child.parent=this;}before(){}after(){}setAttribute(k,v){this.attrs[k]=v;}
  addEventListener(k,fn){this.handlers[k]=fn;}dispatchEvent(e){this.handlers[e.type]?.(e);}showModal(){this.open=true;}close(){this.open=false;}
 }
 for(const m of fs.readFileSync('index.html','utf8').matchAll(/\bid="([^"]+)"/g)){const el=new Element();el.id=m[1];}
 nodes.get('studySetup').classes.add('on');const events=[],progress=[];
 const c=vm.createContext({document:{getElementById:id=>nodes.get(id)||null,querySelector:selector=>selector==='.repctl'?nodes.get('repTog'):null,createElement:()=>new Element(),body:new Element()},$:id=>nodes.get(id)||null,
  window:{tr:k=>k,addEventListener(){},elifaApplyI18n(){},elifaLog:(event,p)=>events.push({event,...p}),elifaStudySessions:{rememberProgress:p=>progress.push(p)}},
  SET:{reciter:223,speed:1,rep:5,repOn:true,wait:0,cumu:true,...initial},RECITERS:[{id:223,n:'Afasy'},{id:7,n:'Husary'}],SURAHS:[{tr:'Fatiha'}],
  plan:[],pi:0,pr:0,playing:false,curS:1,curAy:1,studyRange:{sid:1,from:1,to:5},rangeSelectionDraft:null,gearCtx:'ayah',
  splitAy:null,activeStudySplitSelection:()=>null,stepReps:()=>5,saveSet(){},syncSpeedBtn(){},renderContinue(){},renderHomeHeroLine(){},toast(){},
  setTimeout:(fn,delay)=>{timers.set(++timerId,{fn,delay});return timerId;},clearTimeout:id=>timers.delete(id),
  MutationObserver:class{observe(){}},Event:class{constructor(type){this.type=type;}},navigator:{onLine:true},validStudySettings,validStudyProgress});
 const html=fs.readFileSync('index.html','utf8');
 for(const name of ['syncRepeatScope','readerRepeatKey','remainingStudyRounds','syncRep','syncRep2','syncCumu','syncCumu2','syncPracticeControls','commitInputs','commitInputs2']){
  const start=html.indexOf('function '+name+'('),line=html.slice(start,html.indexOf('\n',start)).trimEnd();
  vm.runInContext(line.endsWith('}')?line:html.slice(start,html.indexOf('\n}',start)+2),c);
 }
 c.applyLiveSpeed=()=>{};
 vm.runInContext(fs.readFileSync('src/study-workflow.mjs','utf8').replace(/^import[^\n]*\n/,''),c);
 return {c,nodes,events,progress,timers};
}
test('practice status disappears after three seconds and progress ticks cannot reopen it',()=>{
 const {c,nodes,timers}=harness();nodes.get('studySetup').classes.delete('on');
 assert.equal(nodes.get('practiceProgress').hidden,true);
 c.plan=[{ayEnd:5}];c.window.elifaPlaybackEvent('start');c.window.elifaPlaybackEvent('progress');
 assert.equal(nodes.get('practiceProgress').hidden,false);assert.equal(timers.size,1);
 const [id,timer]=[...timers][0];assert.equal(timer.delay,3000);
 c.pr=1;c.window.elifaPlaybackEvent('progress');assert.equal([...timers][0][0],id,'progress does not postpone the deadline');
 timers.delete(id);timer.fn();
 for(let i=0;i<4;i++){c.pr=i;c.window.elifaPlaybackEvent('progress');}
 assert.equal(nodes.get('practiceProgress').hidden,true);assert.equal(nodes.get('readerPracticeProgress').hidden,true);assert.equal(timers.size,0);
 nodes.get('practiceMode').value='verse';nodes.get('practiceMode').handlers.change();
 assert.equal(nodes.get('practiceProgress').hidden,false);assert.equal(timers.size,1,'an explicit mode choice may show a fresh short notice');
 c.window.elifaPlaybackEvent('stop');assert.equal(nodes.get('practiceProgress').hidden,true);assert.equal(timers.size,0);
});
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


test('legacy zero tours migrate to the equivalent single tour while zero combined readings stay disabled',()=>{
 const {c,nodes}=harness();const settings={reciter:223,speed:1,rep:1,combineRep:0,rangeRep:0,repOn:true,wait:0,mode:'cumulative',splitCombine:true};
 assert.equal(validStudySettings(settings),true);
 for(const key of ['combineRep','rangeRep'])assert.equal(validStudySettings({...settings,[key]:-1}),false);
 c.window.elifaStudySettings.load({settings});assert.equal(Number(nodes.get('studySetting_combineRep').value),0);
 assert.equal(Number(nodes.get('studySetting_rangeRep').value),1);
 assert.equal(nodes.get('studySetting_rangeRep').min,1);
 c.window.elifaStudySettings.beforeOpen();assert.deepEqual([c.SET.combineRep,c.SET.rangeRep],[0,1]);
 assert.deepEqual(JSON.parse(JSON.stringify(c.window.elifaStudySettings.capture())),{...settings,rangeRep:1});
});

test('both settings panels expose only relevant repeat counts without losing inactive preferences',()=>{
 const {c,nodes}=harness({rep:2,combineRep:3,rangeRep:4,cumu:false});
 for(const mode of ['range','verse','cumulative','range']){
  nodes.get('studyMode').value=mode;nodes.get('studyMode').handlers.change();
  assert.equal(nodes.get('studySetting_rep').parent.hidden,mode==='range');
  assert.equal(nodes.get('studySetting_combineRep').parent.hidden,mode!=='cumulative');
  c.window.elifaStudySettings.beforeOpen();
  assert.equal(nodes.get('gearRepRow').hidden,mode==='range');
  assert.equal(nodes.get('gearCombineRow').hidden,mode!=='cumulative');
  assert.deepEqual([c.SET.rep,c.SET.combineRep,c.SET.rangeRep],[2,3,4]);
 }
 c.gearCtx='studyParts';c.SET.cumu=false;c.syncPracticeControls();
 assert.equal(nodes.get('gearRepRow').hidden,false);assert.equal(nodes.get('gearCombineRow').hidden,true);
 c.SET.cumu=true;c.syncPracticeControls();assert.equal(nodes.get('gearCombineRow').hidden,false);
 assert.equal(c.playing,false);
});


test('configured studies have no second master checkbox and draft changes remain silent',()=>{
 const {c,nodes,events}=harness({repOn:false});
 assert.equal(nodes.has('studyRepeatEnabled'),false);
 nodes.get('studyMode').value='verse';nodes.get('studyMode').handlers.change();
 assert.equal(c.window.elifaStudySettings.capture().repOn,true);
 assert.equal(c.SET.repOn,false);assert.equal(c.playing,false);assert.deepEqual(events,[]);
});

test('settings report opens an inspectable diagnostic without sending a message or occupying reader space',()=>{
 const {c,nodes,events}=harness();const report=nodes.get('setReportIssue');assert.ok(report);assert.equal(typeof report.onclick,'function');
 const html=fs.readFileSync('index.html','utf8'),settings=html.indexOf('id="ayarlar"'),button=html.indexOf('id="setReportIssue"');assert.ok(button>settings);assert.ok(button<html.indexOf('id="tbAyarlar"'));
 report.onclick();const dialog=c.document.body.children.find(x=>x.className==='workflowDialog');assert.equal(dialog.open,true);assert.equal(dialog.attrs['aria-labelledby'],'issueReportTitle');
 const preview=dialog.children[3],data=JSON.parse(preview.textContent.split('\n\n')[1]);assert.equal(data.surah,1);assert.equal(data.ayah,1);assert.equal(data.reciter,223);assert.equal(data.online,true);
 assert.ok(dialog.children[4].href.startsWith('mailto:info@elifaplatform.com?'),'sending still requires the mail app');assert.equal(events.at(-1).event,'audio_feedback_open');
 dialog.children[5].onclick();assert.equal(dialog.open,false);
});

test('a settings report opened before reading has no fabricated verse context',()=>{
 const {c,nodes}=harness();c.curS=0;nodes.get('setReportIssue').onclick();
 const dialog=c.document.body.children.find(x=>x.className==='workflowDialog');const data=JSON.parse(dialog.children[3].textContent.split('\n\n')[1]);
 assert.equal(dialog.children[2].value,'report_other');assert.equal(data.surah,null);assert.equal(data.ayah,null);
});

test('editing verse repeats selects verse practice and activates both repeat controls on Open, without Combine',()=>{
 const {c,nodes}=harness();c.SET.repOn=false;c.SET.cumu=false;c.window.elifaStudySettings.onSetup(false);
 nodes.get('studySetting_rep').value='2';nodes.get('studySetting_rep').handlers.input();
 assert.equal(c.window.elifaStudySettings.capture().mode,'verse');
 assert.equal(c.SET.repOn,false,'draft does not alter playback');
 c.window.elifaStudySettings.beforeOpen();
 assert.equal(c.window.elifaPracticeMode(),'verse');assert.equal(c.SET.rep,2);assert.equal(c.SET.repOn,true);
 for(const id of ['repTog','repTog2'])assert.equal(nodes.get(id).attrs['aria-pressed'],'true');
 for(const id of ['cumuTog','cumuTog2'])assert.equal(nodes.get(id).attrs['aria-pressed'],'false');
 assert.equal(nodes.get('readerRepeatScope').textContent,'Tüm çalışma');assert.equal(c.playing,false);
});

test('explicit cumulative method also applies to split parts and both Combine buttons immediately',()=>{
 const {c,nodes}=harness();c.SET.cumu=false;c.window.elifaStudySettings.onSetup(false);
 nodes.get('studyMode').value='cumulative';nodes.get('studyMode').handlers.change();
 assert.equal(c.SET.cumu,false,'choosing a draft remains silent');
 c.window.elifaStudySettings.beforeOpen();c.activeStudySplitSelection=()=>({parts:[{},{},{}]});c.syncPracticeControls();
 assert.equal(c.SET.cumu,true);
 for(const id of ['cumuTog','cumuTog2']){assert.equal(nodes.get(id).attrs['aria-pressed'],'true');assert.equal(nodes.get(id).classes.has('on'),true);}
 assert.equal(c.playing,false);
});

test('legacy saved cumulative studies repair the missing parts flag without changing whole-section preferences',()=>{
 const {c}=harness();const saved={reciter:223,speed:1,rep:2,combineRep:3,rangeRep:4,repOn:true,wait:0,mode:'cumulative',splitCombine:false};
 c.window.elifaStudySettings.load({settings:saved});assert.equal(c.window.elifaStudySettings.capture().splitCombine,true);
 c.window.elifaStudySettings.beforeOpen();assert.equal(c.SET.cumu,true);assert.equal(c.window.elifaPracticeMode(),'cumulative');
 c.window.elifaStudySettings.load({settings:{...saved,mode:'range',splitCombine:true}});c.window.elifaStudySettings.beforeOpen();
 assert.equal(c.SET.cumu,true);assert.equal(c.window.elifaPracticeMode(),'range','whole-section playback can still remember a separate parts preference');
});

test('whole-study count preserves the inner method; explicit whole-section selection remains authoritative',()=>{
 const {c,nodes}=harness();c.window.elifaStudySettings.load({settings:{reciter:223,speed:1,rep:2,combineRep:3,rangeRep:4,repOn:true,wait:0,mode:'cumulative',splitCombine:true}});
 nodes.get('studySetting_rangeRep').value=6;nodes.get('studySetting_rangeRep').handlers.input();
 assert.equal(c.window.elifaStudySettings.capture().mode,'cumulative');
 nodes.get('studyMode').value='range';nodes.get('studyMode').handlers.change();c.window.elifaStudySettings.beforeOpen();
 assert.equal(c.window.elifaPracticeMode(),'range');assert.equal(c.SET.rangeRep,6);assert.equal(c.SET.cumu,false);
 assert.equal(nodes.get('readerRepeatScope').textContent,'Tüm çalışma');
});

test('draft method changes and saved-study inspection do not leak into the active reader',()=>{
 const {c,nodes}=harness();c.window.elifaSetPracticeMode('verse');
 const saved={reciter:223,speed:1,rep:2,combineRep:3,rangeRep:4,repOn:true,wait:0,mode:'cumulative',splitCombine:true};
 c.window.elifaStudySettings.load({settings:saved});
 assert.equal(c.window.elifaStudySettings.capture().mode,'cumulative');assert.equal(c.window.elifaPracticeMode(),'verse');
 nodes.get('studyMode').value='range';nodes.get('studyMode').handlers.change();nodes.get('studySetup').classes.delete('on');
 assert.equal(c.window.elifaStudySettings.capture().mode,'verse','Back leaves the prior committed method intact');
 c.window.elifaStudySettings.onSetup(true);assert.equal(nodes.get('studyMode').value,'verse');
});

test('gear count edits activate verse practice while wait and speed edits never change method or repetition',()=>{
 const {c,nodes}=harness();c.window.elifaStudySettings.onSetup(false);c.SET.repOn=false;c.SET.cumu=false;
 nodes.get('repInp').value=2;nodes.get('combineRepInp').value=3;nodes.get('rangeRepInp').value=4;
 nodes.get('waitInp').value=1;nodes.get('spdInp').value=1.25;
 c.commitInputs({target:nodes.get('spdInp')});assert.equal(c.SET.repOn,false);assert.equal(c.window.elifaPracticeMode(),'range');
 c.commitInputs({target:nodes.get('repInp')});assert.equal(c.SET.repOn,true);assert.equal(c.window.elifaPracticeMode(),'verse');
 assert.equal(nodes.get('gearRepeatEnabled').checked,true,'the header switch reflects automatic activation');
 assert.equal(nodes.get('repN2').textContent,2);assert.equal(nodes.get('repTog2').attrs['aria-pressed'],'true');
 c.commitInputs('rangeRep');assert.equal(c.window.elifaPracticeMode(),'verse');
 assert.deepEqual([c.SET.rep,c.SET.combineRep,c.SET.rangeRep],[2,3,4]);assert.equal(c.playing,false);
});

test('the visible gear repeat switch updates both players without changing counts, method or starting audio',()=>{
 const {c,nodes,events}=harness(),html=fs.readFileSync('index.html','utf8');
 const handler=html.split('\n').find(line=>line.startsWith("$('gearRepeatEnabled').onchange="));vm.runInContext(handler,c);
 c.SET.combineRep=2;c.SET.rangeRep=4;c.window.elifaSetPracticeMode('cumulative');
 for(const enabled of [false,true]){
  nodes.get('gearRepeatEnabled').checked=enabled;nodes.get('gearRepeatEnabled').onchange();
  assert.equal(c.SET.repOn,enabled);
  for(const id of ['repTog','repTog2'])assert.equal(nodes.get(id).attrs['aria-pressed'],String(enabled));
  assert.equal(c.window.elifaPracticeMode(),'cumulative');assert.deepEqual([c.SET.rep,c.SET.combineRep,c.SET.rangeRep],[5,2,4]);
 }
 assert.equal(c.playing,false);assert.deepEqual(events,[]);
});

test('editing positive combine count activates cumulative practice; zero remains a valid skip',()=>{
 const {c,nodes}=harness();c.SET.cumu=false;c.window.elifaStudySettings.onSetup(false);
 nodes.get('studySetting_combineRep').value=2;nodes.get('studySetting_combineRep').handlers.input();c.window.elifaStudySettings.beforeOpen();
 assert.equal(c.SET.cumu,true);assert.equal(c.window.elifaPracticeMode(),'cumulative');assert.equal(nodes.get('cumuTog').attrs['aria-pressed'],'true');
 nodes.get('combineRepInp').value=0;c.commitInputs('combineRep');assert.equal(c.SET.combineRep,0);assert.equal(c.window.elifaPracticeMode(),'cumulative');
});

test('parts gear changes stay local to parts and refresh the manual-part buttons',()=>{
 const {c,nodes}=harness();c.SET.cumu=false;c.SET.combineRep=2;c.SET.rangeRep=3;c.gearCtx='studyParts';
 let refreshes=0;c.window.elifaStudySplitRefreshStatus=()=>refreshes++;
 c.window.elifaRepeatSettingChanged('combineRep');assert.equal(c.SET.cumu,true);assert.equal(c.window.elifaPracticeMode(),'range');assert.ok(refreshes>0);
 assert.equal(nodes.get('cumuTog2').attrs['aria-pressed'],'true');
 c.window.elifaRepeatSettingChanged('rep');assert.equal(c.SET.cumu,true,'verse count does not turn off an active parts ladder');
});

test('full player count uses the same activation and keeps valid persisted values',()=>{
 const {c,nodes}=harness();c.SET.repOn=false;c.gearCtx='parts';nodes.get('repInp2').value=100;nodes.get('waitInp2').value=70;
 c.commitInputs2({target:nodes.get('repInp2')});assert.equal(c.SET.rep,99);assert.equal(c.SET.wait,60);assert.equal(c.SET.repOn,true);assert.equal(c.window.elifaPracticeMode(),'verse');
 assert.equal(nodes.get('repInp').value,99);assert.equal(nodes.get('repTog').attrs['aria-pressed'],'true');assert.equal(c.playing,false);
});

test('Open followed by Play builds the actual verse ladder with separate tour and combine counts',async()=>{
 const {c,nodes}=harness();c.SET.cumu=false;c.window.elifaStudySettings.onSetup(false);
 nodes.get('studySetting_rep').value=2;nodes.get('studySetting_rep').handlers.input();
 nodes.get('studySetting_rangeRep').value=3;nodes.get('studySetting_rangeRep').handlers.input();
 c.window.elifaStudySettings.beforeOpen();
 const html=fs.readFileSync('index.html','utf8');
 for(const name of ['buildLadder','playStudyRange','stepReps']){
  const start=html.search(new RegExp('(?:async )?function '+name+'\\('));vm.runInContext(html.slice(start,html.indexOf('\n}',start)+2),c);
 }
 const chapter={ay:{1:[0,1000],2:[1000,2000],3:[2000,3000]}};
 Object.assign(c,{AD_:chapter,normalChapterAudio:chapter,studyRange:{sid:1,from:1,to:3},studyPlayRequestId:0,surahRequestId:1,
  audioTimingUnverified:()=>false,normalVersePlanReady:()=>true,
  normalVerseStep:(_chapter,from,to,options)=>({from,to,...options}),runPlan:p=>{c.plan=p;}});
 await c.playStudyRange();
 assert.deepEqual(Array.from(c.plan,s=>[s.from,s.to,c.stepReps(s)]),[[1,1,2],[2,2,2],[3,3,2]]);
 assert.equal(c.plan.rangeCycles,true);assert.equal(c.SET.rangeRep,3);
 // Choosing 1+2 in the same setup must work without touching the bottom button.
 nodes.get('studyMode').value='cumulative';nodes.get('studyMode').handlers.change();
 nodes.get('studySetting_combineRep').value=4;c.window.elifaStudySettings.beforeOpen();await c.playStudyRange();
 assert.deepEqual(Array.from(c.plan,s=>[s.from,s.to,c.stepReps(s)]),[[1,1,2],[2,2,2],[1,2,4],[3,3,2],[1,3,4]]);
 assert.equal(c.SET.rangeRep,3);
});

test('unchanged saved studies activate every relevant count on Open despite an old disabled repeat flag',()=>{
 for(const mode of ['range','verse','cumulative']){
  const {c,nodes}=harness({repOn:false,cumu:false});
  const settings={reciter:223,speed:1.25,rep:2,combineRep:3,rangeRep:4,repOn:false,wait:1,mode,splitCombine:false};
  c.window.elifaStudySettings.load({settings});
  assert.equal(c.SET.repOn,false,'loading is silent');
  c.window.elifaStudySettings.beforeOpen();
  assert.equal(c.SET.repOn,true);assert.equal(c.SET.cumu,mode==='cumulative');
  assert.equal(c.window.elifaPracticeMode(),mode);assert.equal(c.SET.studyMode,mode);
  assert.deepEqual([c.SET.rep,c.SET.combineRep,c.SET.rangeRep],[2,3,4]);
  assert.equal(nodes.get('repTog').attrs['aria-pressed'],'true');
  assert.equal(nodes.get('cumuTog').attrs['aria-pressed'],String(mode==='cumulative'));
  assert.equal(c.playing,false);
 }
});

test('unchanged home setup applies its program and remembers the last committed method across reloads',()=>{
 for(const mode of ['range','verse','cumulative']){
  const {c,nodes}=harness({repOn:false,cumu:false,studyMode:mode,rep:2,combineRep:3,rangeRep:4});
  assert.equal(c.window.elifaPracticeMode(),'range','normal reading startup stays neutral');
  c.window.elifaStudySettings.onSetup(false);
  assert.equal(nodes.get('studyMode').value,mode);
  assert.equal(nodes.get('studySetting_rep').parent.hidden,mode==='range');
  assert.equal(nodes.get('studySetting_combineRep').parent.hidden,mode!=='cumulative');
  c.window.elifaStudySettings.beforeOpen();
  assert.equal(c.SET.repOn,true);assert.equal(c.window.elifaPracticeMode(),mode);
  assert.equal(c.playing,false);
 }
});

test('opening a saved parts resume enables repetition and refreshes controls after the selection is restored',()=>{
 const {c,nodes}=harness({repOn:false,cumu:false});
 c.window.elifaResumeStudySplit=()=>{c.activeStudySplitSelection=()=>({parts:[{},{},{}]});};
 c.window.elifaStudySettings.load({sid:1,from:1,to:5,
  settings:{reciter:223,speed:1,rep:2,combineRep:3,rangeRep:4,repOn:false,wait:0,mode:'cumulative',splitCombine:false},
  progress:{ay:3,part:1,completed:false}},{resume:true});
 c.window.elifaStudySettings.beforeOpen();c.window.elifaStudySettings.afterOpen();
 assert.equal(c.SET.repOn,true);assert.equal(c.SET.cumu,true);
 assert.equal(nodes.get('repTog2').attrs['aria-pressed'],'true');
 assert.equal(nodes.get('cumuTog2').attrs['aria-pressed'],'true');assert.equal(c.playing,false);
});

test('unchanged saved programs produce real playback plans without any input or toggle event',async()=>{
 for(const mode of ['range','verse','cumulative']){
  const {c}=harness({repOn:false,cumu:false});
  c.window.elifaStudySettings.load({settings:{reciter:223,speed:1,rep:2,combineRep:3,rangeRep:4,repOn:false,wait:0,mode,splitCombine:false}});
  c.window.elifaStudySettings.beforeOpen();
  const html=fs.readFileSync('index.html','utf8');
  for(const name of ['buildLadder','playStudyRange','stepReps','planCycleReps']){
   const start=html.search(new RegExp('(?:async )?function '+name+'\\('));vm.runInContext(html.slice(start,html.indexOf('\n}',start)+2),c);
  }
  const chapter={ay:{1:[0,1000],2:[1000,2000],3:[2000,3000]}};
  Object.assign(c,{AD_:chapter,normalChapterAudio:chapter,studyRange:{sid:1,from:1,to:3},studyPlayRequestId:0,surahRequestId:1,planCycleTemplate:null,
   audioTimingUnverified:()=>false,normalVersePlanReady:()=>true,normalVerseStep:(_chapter,from,to,options)=>({from,to,...options}),runPlan:p=>{c.plan=p;c.planCycleTemplate=p;}});
  await c.playStudyRange();
  const expected=mode==='range'?[[1,3,4]]:mode==='verse'?[[1,1,2],[2,2,2],[3,3,2]]:[[1,1,2],[2,2,2],[1,2,3],[3,3,2],[1,3,3]];
  assert.deepEqual(Array.from(c.plan,s=>[s.from,s.to,c.stepReps(s)]),expected);
  if(mode!=='range')assert.equal(c.planCycleReps(),4);
 }
});

test('Fatiha 1–3 with all counts one stays one after Open, Play and opening the settings sheet',async()=>{
 const {c,nodes}=harness({repOn:false,cumu:false});
 c.window.elifaStudySettings.load({settings:{reciter:223,speed:1.25,rep:1,combineRep:1,rangeRep:1,repOn:false,wait:0,mode:'cumulative',splitCombine:false}});
 c.window.elifaStudySettings.beforeOpen();c.window.elifaStudySettings.afterOpen();
 const html=fs.readFileSync('index.html','utf8');
 for(const name of ['buildLadder','playStudyRange','stepReps','fillGearSheet']){
  const start=html.search(new RegExp('(?:async )?function '+name+'\\('));vm.runInContext(html.slice(start,html.indexOf('\n}',start)+2),c);
 }
 const chapter={ay:{1:[0,1000],2:[1000,2000],3:[2000,3000]}};
 Object.assign(c,{AD_:chapter,normalChapterAudio:chapter,studyRange:{sid:1,from:1,to:3},studyPlayRequestId:0,surahRequestId:1,
  splitParts:[],guardedRangeDraft:null,visAy:1,syncTestBtn(){},SURAHS:[{n:7}],
  audioTimingUnverified:()=>false,normalVersePlanReady:()=>true,normalVerseStep:(_chapter,from,to,options)=>({from,to,...options}),runPlan:p=>{c.plan=p;}});
 nodes.get('testModeBtn').style={};
 await c.playStudyRange();c.fillGearSheet();
 assert.deepEqual([c.SET.rep,c.SET.combineRep,c.SET.rangeRep],[1,1,1]);
 assert.deepEqual(['repInp','combineRepInp','rangeRepInp'].map(id=>nodes.get(id).value),[1,1,1]);
 assert.deepEqual(Array.from(c.plan,s=>[s.from,s.to,c.stepReps(s)]),[[1,1,1],[2,2,1],[1,2,1],[3,3,1],[1,3,1]]);
 assert.equal(c.SET.speed,1.25);assert.equal(c.SET.wait,0);
});

test('the themed method menu applies a draft through the same model and closes with the selected state',()=>{
 const {c,nodes}=harness({repOn:false,cumu:false});c.window.elifaStudySettings.onSetup(false);
 const toggle=nodes.get('studyModeToggle'),panel=nodes.get('studyModeDialog');
 assert.equal(nodes.get('studyMode').hidden,true);assert.equal(toggle.attrs['aria-haspopup'],'dialog');
 toggle.onclick();assert.equal(panel.open,true);assert.equal(toggle.attrs['aria-expanded'],'true');
 nodes.get('studyModeOption_cumulative').onclick();
 assert.equal(panel.open,false);assert.equal(toggle.attrs['aria-expanded'],'false');
 assert.equal(nodes.get('studyModeOption_cumulative').attrs['aria-pressed'],'true');
 assert.equal(c.window.elifaStudySettings.capture().mode,'cumulative');
 assert.equal(c.SET.cumu,false,'draft menu does not change current playback');assert.equal(c.playing,false);
 c.window.elifaStudySettings.beforeOpen();
 assert.equal(c.SET.cumu,true);assert.equal(nodes.get('practiceModeOption_cumulative').attrs['aria-pressed'],'true');
});

test('cancelling the themed menu does not change practice; reader selection uses the existing queued transition',()=>{
 const {c,nodes}=harness(),queued=[];c.queuePracticeModeChange=m=>queued.push(m);
 nodes.get('studyModeToggle').onclick();nodes.get('studyModeDialog').handlers.close();
 assert.equal(nodes.get('studyModeToggle').attrs['aria-expanded'],'false');assert.deepEqual(queued,[]);
 nodes.get('practiceModeToggle').onclick();nodes.get('practiceModeOption_verse').onclick();
 assert.deepEqual(queued,['verse']);assert.equal(c.window.elifaPracticeMode(),'verse');
 assert.equal(nodes.get('practiceModeDialog').open,false);assert.equal(c.playing,false);
});
