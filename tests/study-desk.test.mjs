import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync('index.html','utf8');
function source(name){
  const start=html.search(new RegExp('(?:async )?function '+name+'\\('));
  assert.ok(start>=0,`missing ${name}`);
  return html.slice(start,html.indexOf('\n}',start)+2);
}

test('study range accepts only verses inside one surah',()=>{
  const context=vm.createContext({SURAHS:[{n:7},{n:286}]});
  vm.runInContext(source('validStudyRange'),context);
  assert.equal(context.validStudyRange(2,26,28),true);
  for(const range of [[2,28,26],[2,0,5],[2,1,287],[3,1,2],[2,1.5,3]])
    assert.equal(context.validStudyRange(...range),false);
});

test('a verse tap inside Study Desk cannot continue into the rest of the surah',()=>{
  const played=[];
  const context=vm.createContext({studyRange:{sid:18,from:1,to:10},curS:18,curAy:1,
    SET:{reciter:7,repOn:false,cumu:false},SURAHS:Array.from({length:18},(_,i)=>({n:i===17?110:7})),
    AD_:{ay:Object.fromEntries(Array.from({length:110},(_,i)=>[i+1,[i*1000,(i+1)*1000]]))},
    normalChapterAudio:null,audioTimingUnverified:()=>false,normalVersePlanReady:()=>true,
    normalVerseStep:(_chapter,from,to,options)=>({from,to,...options}),unsafeNormalVerseStep:()=>false,
    runPlan:p=>played.push(p),toast(){}});
  vm.runInContext(source('playAyahProgram'),context);
  context.playAyahProgram(8);
  assert.equal(played[0].length,1);
  assert.deepEqual([played[0][0].from,played[0][0].to,played[0][0].full],[8,10,false]);
  context.SET.repOn=true;context.SET.cumu=true;context.playAyahProgram(8);
  assert.equal(Math.max(...played[1].map(step=>step.to)),10);
  assert.equal(played[1].at(-1).to,10);
});

test('Study Desk play uses the whole selected range and refuses incomplete audio',async()=>{
  const played=[],messages=[];
  const context=vm.createContext({studyRange:{sid:18,from:1,to:10},curS:18,curAy:5,
    studyPlayRequestId:0,surahRequestId:1,AD_:{ay:{1:[0,1],10:[9,10]}},
    SET:{reciter:7,repOn:false},audioTimingUnverified:()=>false,
    buildLadder:()=>[],normalVersePlanReady:()=>true,
    runPlan:p=>played.push(p),toast:m=>messages.push(m),window:{tr:null}});
  vm.runInContext(source('playStudyRange'),context);
  await context.playStudyRange();assert.equal(played.length,0);assert.equal(messages.length,1);
  context.buildLadder=(from,to)=>[{from,to}];await context.playStudyRange();
  assert.deepEqual([played[0][0].from,played[0][0].to],[1,10]);
  assert.equal(context.SET.repOn,false);
});

test('Study Desk waits for chapter audio on the first Play tap',async()=>{
  let finishLoad;const played=[];
  const audio={ay:{1:[0,1],2:[1,2]}};
  const context=vm.createContext({studyRange:{sid:18,from:1,to:2},curS:18,
    studyPlayRequestId:0,surahRequestId:1,AD_:{ay:{}},SET:{reciter:223},
    audioTimingUnverified:()=>false,getAudio:()=>new Promise(resolve=>{finishLoad=resolve;}),
    $:()=>({classList:{contains:()=>true}}),rewireTimings(){},
    buildLadder:()=>[{from:1,to:2}],normalVersePlanReady:()=>true,
    runPlan:p=>played.push(p),toast(){},window:{tr:null}});
  vm.runInContext(source('playStudyRange'),context);
  const pending=context.playStudyRange();
  assert.equal(played.length,0);
  finishLoad(audio);await pending;
  assert.equal(context.AD_,audio);
  assert.equal(played.length,1);
});

test('opening a Study Desk range does not autoplay and normal reading clears its limit',async()=>{
  const events=[];let screen='home';
  const elements={reader:{classList:{contains:()=>screen==='reader'}},rTitle:{textContent:''},
    rbody:{innerHTML:''}};
  const context=vm.createContext({studyRange:{sid:18,from:1,to:10},surahRequestId:0,
    readerReturn:'studySetup',curS:0,SURAHS:Array.from({length:18},(_,i)=>({tr:'S'+(i+1)})),
    SET:{reciter:7},window:{},$:id=>elements[id]||{},show:id=>{screen=id;},setTest(){},
    stopPlan(){},clearSel(){},syncStudyBanner(){},fetchVerses:async()=>[{n:1}],
    buildDOM:()=>events.push('render'),updateStat(){},getAudio:async()=>({ay:{}}),
    rewireTimings(){},toast(){},runPlan:()=>events.push('play')});
  vm.runInContext(source('openSurah'),context);
  await context.openSurah(18,1,{study:true});
  assert.equal(context.studyRange.to,10);assert.equal(context.readerReturn,'studySetup');
  assert.deepEqual(events,['render']);
  await context.openSurah(2);
  assert.equal(context.studyRange,null);
  assert.deepEqual(events,['render','render']);
});
