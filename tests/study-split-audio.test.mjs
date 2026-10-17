import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
function source(name){
  const start=html.search(new RegExp(`(?:async )?function ${name}\\(`));
  assert.ok(start>=0,`${name} exists`);
  const lineEnd=html.indexOf('\n',start);
  return html.slice(start,html.slice(start,lineEnd).trimEnd().endsWith('}')?
    lineEnd:html.indexOf('\n}',start)+2);
}
const names=['buildStudySplitParts','studyValidateManualCut','playStudySplitRange',
  'playStudySplitPart','activeStudySplitSelection','studySplitRecipeCurrent',
  'playActiveStudySplit','stepBounds','stepReps'];
function audio(){
  const rows={
    1:[[1,100,250],[2,250,450],[3,450,870]],
    2:[[1,920,1100],[2,1100,1400],[3,1400,1770]]
  };
  return {reciterId:223,sourceUrl:'https://example.test/same.mp3',
    recordingUrl:'https://example.test/same.mp3',verseRanges:{1:[0,900],2:[901,1800]},
    ay:{1:[0,900],2:[901,1800]},verseSegments:rows,
    ws:Object.fromEntries(Object.entries(rows).flatMap(([ay,words])=>
      words.map(([pos,from,to])=>[ay+':'+pos,[from,to]]))),
    end:1800};
}
function context(loaded=true){
  const recording=audio(),words=[];
  for(const ay of [1,2])for(const [pos,from,to] of recording.verseSegments[ay]){
    words.push({gi:words.length,ay,pos,txt:`${ay}:${pos}`,s:from,e:to,
      audioAligned:true,joinNext:false});
  }
  const c=vm.createContext({curS:1,SURAHS:[{n:2}],SET:{reciter:223,startPad:300,endPad:300,repOn:false,cumu:false},
    wordArr:words,ayGi:{1:[0,2],2:[3,5]},AD_:loaded?recording:{sourceUrl:null},
    normalChapterAudio:null,studyRange:{sid:1,from:1,to:2},
    audioTimingUnverified:()=>false,
    QTEXT:{1:[null,null]},audioRequestId:0,surahRequestId:4,playing:false,
    ac:()=>({state:'running'}),stopPlan(){c.audioRequestId++},
    getAudio:async()=>recording,rewireTimings(){},ensureSelAudio:async()=>{
      recording.selBuf={lo:0,hi:1800,off:0,buffer:{duration:1.8}};
    },normalVersePlanReady:()=>true,runPlan:p=>{c.playing=true;c.started=p},
    toast:m=>{c.message=m},window:{elifaStudySplitSelection:()=>c.selection}
  });
  for(const name of names)vm.runInContext(source(name),c);
  return {c,recording};
}
function select(c,result,ay=1,mode='manual',cutsByAy={}){
  c.selection={sid:1,ay,parts:result.parts,selectedIndex:0,mode,cutsByAy};
}

test('automatic word parts preserve the verse tail and never overlap the next word',()=>{
  const {c}=context();
  const result=c.buildStudySplitParts(1,2,'auto');
  assert.equal(result.error,null);
  assert.equal(result.parts.length,6);
  assert.ok(result.parts.every(p=>p.canPlay&&!p.pendingAudio&&p.sourceId==='https://example.test/same.mp3'));
  assert.deepEqual(Array.from(result.parts,p=>p.ay),[1,1,1,2,2,2]);
  for(let i=0;i<result.parts.length-1;i++)assert.ok(result.parts[i].t<=result.parts[i+1].f);
  assert.equal(result.parts[2].t,900,'the final word keeps the verified verse tail');
  const exact={f:450,t:900,studyExact:true};
  assert.deepEqual({...c.stepBounds(exact)},{f:450,t:900},'padding cannot trim or extend a study cut');
});

test('manual cuts remain within each verse and reject unsafe or repeated boundaries',()=>{
  const {c,recording}=context();
  const result=c.buildStudySplitParts(1,2,'manual',{1:[2],2:[1]});
  assert.deepEqual(Array.from(result.parts,p=>[p.ay,p.fromPos,p.toPos]),
    [[1,1,2],[1,3,3],[2,1,1],[2,2,3]]);
  assert.equal(c.studyValidateManualCut(1,2).ok,true);
  assert.equal(c.studyValidateManualCut(1,3).ok,true,'last word can close a verse');
  assert.equal(c.studyValidateManualCut(2,3).ok,true,'last word can close any verse');
  recording.allowedSplitCuts={1:[1],2:[1,2]};
  assert.equal(c.studyValidateManualCut(1,2).ok,false);
  recording.allowedSplitCuts=null;
  recording.verseSegments[1][1]=[1,250,450];
  assert.match(c.buildStudySplitParts(1,2,'auto').error,/eşleşmesi|zamanları/);
});

test('automatic parts keep a joined printed word and its two audio positions together',()=>{
  const {c}=context();
  c.wordArr[0].joinNext=true;
  const result=c.buildStudySplitParts(1,2,'auto');
  assert.equal(result.error,null);
  assert.deepEqual(Array.from(result.parts.slice(0,2),p=>[p.fromPos,p.toPos,p.f,p.t]),
    [[1,2,100,450],[3,3,450,900]]);
  assert.equal(c.studyValidateManualCut(1,1).ok,false,
    'manual cutting inside a joined printed word remains unsafe');
  c.AD_={sourceUrl:null};
  assert.equal(c.studyValidateManualCut(1,1).ok,false,
    'the printed-word boundary remains guarded while audio is pending');
});

test('a repeated Afasy verse falls back to one complete verse without blocking safe words',async()=>{
  const {c,recording}=context();
  recording.verseSegments[2]=[[1,920,1100],[2,1100,1250],[2,1250,1400],[3,1400,1770]];
  const result=c.buildStudySplitParts(1,2,'auto');
  assert.equal(result.error,null);
  assert.deepEqual(Array.from(result.warningAys),[2]);
  assert.deepEqual(Array.from(result.parts,p=>[p.ay,p.fromPos,p.toPos,p.f,p.t]),
    [[1,1,1,100,250],[1,2,2,250,450],[1,3,3,450,900],[2,1,3,901,1800]]);
  assert.equal(result.parts[3].fallbackVerse,true);
  assert.equal(c.buildStudySplitParts(1,2,'manual',{2:[2]}).error!==null,true,
    'manual cuts inside a repeated passage remain disallowed');
  const selected=c.buildStudySplitParts(2,2,'auto');
  select(c,selected,2,'auto');
  assert.equal(await c.playStudySplitPart(selected.parts[0]),true);
  assert.equal(c.started[0].t,1800);
});

test('text cards appear before audio; playback loads and revalidates that same source',async()=>{
  const {c}=context(false);
  const pending=c.buildStudySplitParts(1,1,'auto');
  assert.equal(pending.error,null);
  assert.equal(pending.pendingAudio,true);
  assert.equal(pending.parts.length,3);
  assert.ok(pending.parts.every(p=>!p.canPlay&&p.pendingAudio&&Number.isInteger(p.index)));
  assert.deepEqual({...c.studyValidateManualCut(1,2)},
    {ok:true,pendingAudio:true,message:'Ses yüklenince kesim yeniden doğrulanacak.'});
  select(c,pending,1,'auto');
  assert.equal((await c.playStudySplitRange(pending.parts,0,2)),true);
  assert.equal(c.started.length,3);
  assert.ok(c.started.every(step=>step.studyExact&&step.dyn));
  assert.deepEqual(Array.from(c.started,step=>[step.f,step.t]),
    [[100,250],[250,450],[450,900]]);
});

test('manual three-part verse uses only that verse for repeat and cumulative study',async()=>{
  const {c}=context();
  c.SET.repOn=true;c.SET.rep=5;c.SET.cumu=true;
  const parts=c.buildStudySplitParts(2,2,'manual',{2:[1,2]});
  select(c,parts,2,'manual',{2:[1,2]});
  assert.equal(await c.playActiveStudySplit(),true);
  assert.deepEqual(Array.from(c.started,step=>[step.f,step.t]),
    [[920,1100],[1100,1400],[920,1400],[1400,1800],[920,1800]]);
  assert.ok(c.started.every(step=>step.studyExact&&step.dyn));
  assert.deepEqual(Array.from(c.started,step=>c.stepReps(step)),[5,5,5,5,5],
    'each solo and cumulative take uses the selected repeat count');
  assert.ok(c.started.every(step=>step.f>=901&&step.t<=1800));
  c.SET.cumu=false;
  assert.equal(await c.playStudySplitRange(parts.parts,1,2),true);
  assert.deepEqual(Array.from(c.started,step=>[step.f,step.t]),[[1100,1400],[1400,1800]]);
});

test('an obsolete study selection cannot start after asynchronous audio loading',async()=>{
  const {c,recording}=context(false);
  const pending=c.buildStudySplitParts(1,1,'auto');
  select(c,pending,1,'auto');
  let resolve;
  c.getAudio=()=>new Promise(r=>{resolve=r});
  const playback=c.playStudySplitPart(pending.parts[0]);
  c.studyRange={sid:1,from:2,to:2};
  resolve(recording);
  assert.equal(await playback,false);
  assert.equal(c.started,undefined);
});

test('a pending word never silently becomes a whole verse after audio loads',async()=>{
  const {c,recording}=context(false);
  const pending=c.buildStudySplitParts(2,2,'auto');
  select(c,pending,2,'auto');
  recording.verseSegments[2]=[[1,920,1100],[2,1100,1250],[2,1250,1400],[3,1400,1770]];
  assert.equal(await c.playStudySplitPart(pending.parts[0]),false);
  assert.match(c.message,/tam âyet kartını seç/);
  assert.equal(c.started,undefined);
});

test('a whole-chapter word plan cannot flood the audio scheduler',async()=>{
  const {c}=context();
  const repeated=Array.from({length:201},()=>({recipe:{}}));
  assert.equal(await c.playStudySplitRange(repeated),false);
  assert.match(c.message,/200/);
  assert.equal(c.started,undefined);
});

test('selected buffer passes the first exact study cut through the real scheduler',async()=>{
  const {c,recording}=context();
  recording.audio={};
  Object.assign(c,{plan:[],pi:0,pr:0,pieceCursor:0,stepRequestId:0,
    setIco(){},updateStat(){},wake(){},seekPlay:(from,to)=>{c.startedAt=[from,to]}});
  vm.runInContext(source('goStep'),c);
  vm.runInContext(source('runPlan'),c);
  const parts=c.buildStudySplitParts(1,1,'auto');
  select(c,parts,1,'auto');
  assert.equal(await c.playStudySplitRange(parts.parts,1,2),true);
  await Promise.resolve();
  assert.deepEqual(Array.from(c.startedAt),[250,450]);
  assert.equal(c.plan[0].studyExact,true);
  assert.ok(recording.selBuf?.buffer,'the same source selected buffer was prepared');
});
