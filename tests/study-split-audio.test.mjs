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
const names=['validStudyWordRange','studyWordBounds','buildStudySplitParts','studyValidateManualCut','playStudySplitRange',
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
  c.selection={sid:1,ay,parts:result.parts,selectedIndex:0,mode,cutsByAy,
    wordRange:c.studyRange.wordRange?{...c.studyRange.wordRange}:null};
}

test('partial-word study keeps canonical positions and exact audio bounds without neighboring words or the verse tail',async()=>{
  const {c}=context();
  c.studyRange={sid:1,from:1,to:1,wordRange:{fromAy:1,fromWord:2,toAy:1,toWord:2}};
  const result=c.buildStudySplitParts(1,1,'manual');
  assert.equal(result.error,null);
  assert.deepEqual(Array.from(result.parts,p=>[p.fromPos,p.toPos,p.fromGi,p.toGi,p.f,p.t]),[[2,2,1,1,250,450]]);
  assert.deepEqual(Array.from(result.parts[0].words,w=>w.pos),[2]);
  assert.equal(c.studyValidateManualCut(1,1).ok,false);
  assert.equal(c.studyValidateManualCut(1,2).ok,true,'selected end may close a part before the verse ends');
  assert.equal(c.studyValidateManualCut(1,3).ok,false);
  assert.ok(c.buildStudySplitParts(1,1,'manual',{1:[1]}).error);
  assert.ok(c.buildStudySplitParts(1,1,'manual',{1:[2]}).error,'selected final is implicit, not an interior cut');
  select(c,result);
  assert.equal(await c.playStudySplitPart(result.parts[0]),true);
  assert.deepEqual(Array.from(c.started,p=>[p.f,p.t]),[[250,450]]);
});

test('multi-verse word bounds retain global cut positions while validating every full verse timing row',()=>{
  const {c,recording}=context();
  c.studyRange.wordRange={fromAy:1,fromWord:2,toAy:2,toWord:2};
  const result=c.buildStudySplitParts(1,2,'manual',{1:[2],2:[1]});
  assert.equal(result.error,null);
  assert.deepEqual(Array.from(result.parts,p=>[p.ay,p.fromPos,p.toPos,p.f,p.t]),
    [[1,2,2,250,450],[1,3,3,450,900],[2,1,1,920,1100],[2,2,2,1100,1400]]);
  recording.ws['1:1']=[101,250];recording.ws['1:1'][0]=103;
  assert.match(c.buildStudySplitParts(1,2,'auto').error,/zamanları/,'unselected words still participate in recording identity validation');
});

test('partial start and end boundaries cannot cut joined or unsupported audio words',()=>{
  const {c,recording}=context();
  c.studyRange={sid:1,from:1,to:1,wordRange:{fromAy:1,fromWord:2,toAy:1,toWord:2}};
  c.wordArr[0].joinNext=true;
  assert.match(c.buildStudySplitParts(1,1,'manual').error,/başlangıcında/);
  c.wordArr[0].joinNext=false;recording.allowedSplitCuts={1:[2]};
  assert.match(c.buildStudySplitParts(1,1,'manual').error,/başlangıcında/);
  recording.allowedSplitCuts={1:[1]};
  assert.ok(c.buildStudySplitParts(1,1,'manual').error,'the selected final word also needs a verified cut');
});

test('repeated-recording fallback never widens a partial-word selection to the whole verse',()=>{
  const {c,recording}=context();
  c.studyRange={sid:1,from:2,to:2,wordRange:{fromAy:2,fromWord:2,toAy:2,toWord:3}};
  recording.verseSegments[2]=[[1,920,1100],[2,1100,1250],[2,1250,1400],[3,1400,1770]];
  for(const mode of ['auto','manual']){
    const result=c.buildStudySplitParts(2,2,mode);
    assert.ok(result.error);
    assert.ok(result.parts.every(p=>p.fromPos>=2&&!p.fallbackVerse&&!p.canPlay));
  }
});

test('partial selection fails closed when its bound resolver is unavailable instead of using a whole-verse compatibility fallback',()=>{
  const {c}=context();c.studyWordBounds=undefined;
  assert.equal(c.buildStudySplitParts(1,1,'manual').error,null,'old whole-verse callers remain compatible');
  c.studyRange.wordRange={fromAy:1,fromWord:2,toAy:2,toWord:2};
  assert.ok(c.buildStudySplitParts(1,1,'manual').error);
  assert.equal(c.studyValidateManualCut(1,2).ok,false);
});

test('changing only selected word bounds cancels a pending split playback and invalidates its recipe',async()=>{
  const {c,recording}=context(false);
  c.studyRange={sid:1,from:1,to:1,wordRange:{fromAy:1,fromWord:2,toAy:1,toWord:3}};
  const pending=c.buildStudySplitParts(1,1,'auto');select(c,pending,1,'auto');
  assert.equal(c.studySplitRecipeCurrent(pending.parts[0].recipe),true);
  let release;c.getAudio=()=>new Promise(resolve=>release=resolve);
  const playing=c.playStudySplitPart(pending.parts[0]);
  c.studyRange.wordRange.fromWord=1;
  release(recording);
  assert.equal(await playing,false);assert.equal(c.started,undefined);
  assert.equal(pending.parts[0].recipe.wordRange.fromWord,2,'recipe keeps its own immutable selection identity');
});

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

test('playing a single saved part preserves its actual number for progress and resume',async()=>{
  const {c}=context();
  const parts=c.buildStudySplitParts(2,2,'manual',{2:[1,2]});
  select(c,parts,2,'manual',{2:[1,2]});
  assert.equal(await c.playStudySplitPart(parts.parts[2]),true);
  assert.equal(c.started.length,1);
  assert.equal(c.started[0].studyPart,2);
  assert.deepEqual([c.started[0].f,c.started[0].t],[1400,1800]);
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
