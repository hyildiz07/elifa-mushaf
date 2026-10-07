import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
function fn(name){
  const start=html.search(new RegExp('(?:async )?function '+name+'\\('));
  assert.ok(start>=0,name+' exists');
  const firstLine=html.slice(start,html.indexOf('\n',start));
  if(firstLine.trimEnd().endsWith('}'))return firstLine;
  return html.slice(start,html.indexOf('\n}',start)+2);
}
function fixture(rid,sid,suffix=''){return JSON.parse(fs.readFileSync(new URL(`fixtures/${rid}-${sid}${suffix}.json`,import.meta.url),'utf8'));}
function context(af){
  const c={SET:{startPad:0,endPad:-60,cumu:false,repOn:true,rep:5,speed:1},AD_:null,
    wordArr:[],ayGi:{},splitParts:[],splitAy:null,splitSelIdx:0,curS:af.sid,sid:af.sid,
    plan:[],pi:0,pieceCursor:0,segFlat:[],audioRequestId:0,splitVisitId:0,pendingSplitPlay:null,
    renderSplit(){},updateSplitIntro(){},$:()=>({dataset:{},classList:{contains:()=>true,add(){},remove(){}}}),toast(){},
    clearHTMLPlaybackWatch(){},
    stopPlan(){c.audioRequestId++;},runPlan(p){c.result=p;},
    ac:()=>({state:'running'}),
    WAQF_RE:/[\u06D6-\u06DC]/,splitLastReady:null};
  c.QTEXT=vm.runInContext('QTEXT',textContext);c.ensureSplitAudio=async()=>{};
  vm.createContext(c);
  for(const name of ['alignTurkishWords','splitAudioKey','splitAudioReady','splitPauseAllowed','splitPhraseBoundary','splitChunkPositions','repeatedTimeline','repeatedAudioRanges','computeParts','partKey','partStep','terminalMuallimTailEnd','splitBounds','stepBounds','buildPartsPlan','selectedBufferCovers','offerSplitReciterChoice','showUnsafeSplitTiming','showSplitError','startFromPart','startPartsRange','ensureSelAudio','rewireTimings','tryStartPendingSplitPlay','stepReps','seekPlay'])vm.runInContext(fn(name),c);
  const start=html.indexOf('  const ay={},ws={},verseEnds={},verseRanges={},verseSegments={}');
  const end=html.indexOf('  allSegs.sort',start);
  c.af=af;
  vm.runInContext('AD_=(()=>{'+html.slice(start,end)+'return {ay,ws,verseEnds,verseRanges,verseSegments,end,segs:allSegs,buffer:null};})()',c);
  return c;
}
const textContext=vm.createContext({});
for(const name of ['QTEXT','QTEXT_TR']){
  const start=html.indexOf('const '+name+'=');
  assert.ok(start>=0,name);
  vm.runInContext(html.slice(start,html.indexOf('\n',start)),textContext);
}
function loadVerse(c,ay,mushaf='turk'){
  const base=vm.runInContext(`QTEXT[${c.curS}][${ay-1}][2].filter(w=>w[1]===0).map(w=>w[0])`,textContext);
  const printed=mushaf==='turk'?vm.runInContext(`QTEXT_TR[${c.curS}][${ay-1}].split(/\\s+/).filter(Boolean)`,textContext):base;
  const words=mushaf==='turk'?(c.alignTurkishWords(base,printed)||printed):base;
  c.wordArr=words.map((txt,gi)=>{const seg=c.AD_.ws[ay+':'+(gi+1)];return {txt,gi,ay,pos:gi+1,joinNext:!!words.joinNext?.has(gi),audioAligned:true,s:seg?.[0]??null,e:seg?.[1]??null};});
  c.ayGi={[ay]:[0,words.length-1]};c.splitAy=ay;c.splitParts=c.computeParts(ay);
}

test('all inline application scripts parse',()=>{
  let count=0;
  for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
    if(/type\s*=\s*["']application\//i.test(m[1]))continue;
    new vm.Script(m[2],{filename:`inline-${++count}.js`});
  }
  assert.ok(count>10);
});
test('split choices look ahead to avoid a nine-word remainder',()=>{
  const c=vm.createContext({});vm.runInContext(fn('splitChunkPositions'),c);
  assert.deepEqual(Array.from(c.splitChunkPositions(13,[4,5,6],new Set(),{})),[6]);
  const eight=Array.from(c.splitChunkPositions(8,[4],new Set(),{}));
  assert.deepEqual(eight,[4]);
  assert.deepEqual(Array.from(c.splitChunkPositions(8,[1],new Set(),{})),[]);
});
test('a split plan stops when any requested part has no playable audio range',()=>{
  const c=vm.createContext({SET:{cumu:false},splitParts:[
    {f:100,t:200,words:[{pos:1}]},
    {f:null,t:null,words:[{pos:2}]},
    {f:300,t:400,words:[{pos:3}]}
  ],partStep:(p,k,from)=>({part:k,f:from,t:p.t})});
  vm.runInContext(fn('buildPartsPlan'),c);
  assert.equal(c.buildPartsPlan(0).length,0,'a missing middle part must not be skipped');
  assert.equal(c.buildPartsPlan(1).length,0,'a missing first part must not be skipped');
  assert.deepEqual(Array.from(c.buildPartsPlan(2),step=>step.part),[2]);
  c.SET.cumu=true;
  assert.equal(c.buildPartsPlan(2,2,1).length,0,'a combined range needs its base part');
});
test('concurrent chapter audio requests share one metadata load and can retry after failure',async()=>{
  let attempts=0;
  const c=vm.createContext({audioCache:{},audioPending:{},audioCacheGeneration:{},loadAudio:async()=>{
    attempts++;if(attempts===1)throw Error('temporary network error');
    return {sourceUrl:'https://example.test/chapter.mp3'};
  }});
  vm.runInContext(fn('audioTimingUnverified'),c);vm.runInContext(fn('getAudio'),c);
  const failed=await Promise.allSettled([c.getAudio(2,277),c.getAudio(2,277)]);
  assert.equal(attempts,1);
  assert.ok(failed.every(result=>result.status==='rejected'));
  const ready=await c.getAudio(2,277);
  assert.equal(attempts,2);
  assert.equal(ready.sourceUrl,'https://example.test/chapter.mp3');
});
test('split play retries chapter audio when a reciter change left no audio',()=>{
  const button={};
  const c=vm.createContext({AD_:null,splitAy:12,splitParts:[],SET:{reciter:4},curS:4,
    splitVisitId:0,pendingSplitPlay:null,tryStartPendingSplitPlay(){},ac:()=>({state:'running'}),
    audioPending:{},splitVerseLoading:null,playing:false,openSplit(ay){c.retriedAy=ay;},
    $:()=>button,startFromPart(){throw Error('No parts should be played');}});
  const handler=html.match(/^\$\('playBtn2'\)\.onclick=\(\)=>\{[\s\S]*?^\};/m)?.[0];
  assert.ok(handler,'split play handler exists');
  vm.runInContext(handler,c);
  button.onclick();
  assert.equal(c.retriedAy,12);
});
test('Play honors 1+2 for its selected whole ayah without redirecting word selections',()=>{
  const button={};const calls=[];
  const c=vm.createContext({SET:{reciter:5,cumu:true},curS:65,AD_:{},playing:false,
    selMode:'ayah',selA:0,selB:2,wordArr:[{ay:12},{ay:12},{ay:12}],ayGi:{12:[0,2]},
    audioTimingUnverified:()=>false,$:()=>button,
    playAyahProgram:a=>calls.push(['program',a]),playSelection:()=>calls.push(['selection'])});
  const handler=html.match(/^\$\('playBtn'\)\.onclick=\(\)=>\{[\s\S]*?^\};/m)?.[0];
  assert.ok(handler,'reader Play handler exists');vm.runInContext(handler,c);
  button.onclick();assert.deepEqual(calls,[['program',12]]);
  c.selMode='word';button.onclick();assert.deepEqual(calls.at(-1),['selection']);
  c.selMode='ayah';c.SET.cumu=false;button.onclick();assert.deepEqual(calls.at(-1),['selection']);
});
test('pause keeps a normal selected passage at its current position',()=>{
  const c=vm.createContext({plan:[{f:100,t:2000}],pi:0,pieceCursor:0,
    pausedAtMs:null,srcNode:{},AD_:{},useWA:true,raf:null,htmlBtimer:null,
    curMs:()=>735,stopPlan(){c.stopped=true;},stopSrc(){c.sourceStopped=true;},
    cancelHTMLFade(){},clearHTMLPlaybackWatch(){},setIco(value){c.iconPlaying=value;},toast(){}});
  vm.runInContext(fn('pausePlayback'),c);
  c.pausePlayback();
  assert.equal(c.pausedAtMs,735);
  assert.equal(c.sourceStopped,true);
  assert.equal(c.iconPlaying,false);
  assert.equal(c.stopped,undefined,'normal playback must pause, not stop as an unloaded verse source');
});
test('second Play tap cancels a verified verse still loading before playback starts',async()=>{
  let complete;
  const loading=new Promise(resolve=>{complete=resolve;});
  const step={sourceRanges:[{verseSource:286,fullVerse:true,f:0,t:1000}]};
  const c=vm.createContext({SET:{reciter:12},curS:2,plan:[step],pi:0,pieceCursor:0,
    playing:true,audioRequestId:0,stepRequestId:0,pausedAtMs:null,srcNode:null,
    htmlPlaybackWatch:null,AD_:{audio:{paused:true}},useWA:false,
    unsafeSudaisNormalStep:()=>false,unsafeHaniNormalStep:()=>false,
    getVerifiedVerseAudio:()=>loading,toast(){},seekPlay(){c.started=true;},
    stopPlan(){c.playing=false;c.audioRequestId++;c.stepRequestId++;}});
  vm.runInContext(fn('goStep'),c);
  vm.runInContext(fn('pausePlayback'),c);
  const started=c.goStep();
  c.pausePlayback();
  complete({verseEnds:{286:1000}});
  await started;
  assert.equal(c.playing,false);
  assert.equal(c.started,undefined,'the late verified verse must not begin playing');
});
test('second Play tap cancels a pending HTMLAudio play but pauses active HTMLAudio',()=>{
  for(const paused of [true,false]){
    const audio={paused,currentTime:0.735,volume:1,pause(){this.paused=true;}};
    const c=vm.createContext({plan:[{f:100,t:2000}],pi:0,pieceCursor:0,
      pausedAtMs:null,srcNode:null,htmlPlaybackWatch:{audio},AD_:{audio},useWA:false,
      raf:null,htmlBtimer:null,stopPlan(){c.stopped=true;},stopSrc(){c.sourceStopped=true;},
      curMs:()=>735,cancelHTMLFade(){},clearHTMLPlaybackWatch(){},setIco(){},toast(){}});
    vm.runInContext(fn('pausePlayback'),c);
    c.pausePlayback();
    assert.equal(!!c.stopped,paused);
    assert.equal(c.pausedAtMs,paused?null:735);
  }
});
test('opening split view stops normal playback before its first Play tap',()=>{
  const elements={};
  const c=vm.createContext({playing:true,AD_:{sourceUrl:null},normalChapterAudio:null,
    splitVisitId:0,pendingSplitPlay:null,
    splitChapterAudio:null,splitAy:null,splitSelIdx:0,splitParts:[],curS:4,
    SET:{reciter:7},HUSARY_SPLIT_VERSES:new Set(),SURAHS:[{},{},{},{tr:'Nisâ'}],
    stopPlan(){c.stopped=true;c.playing=false;},show(){},renderSplit(){},
    syncRep2(){},syncCumu2(){},tr:()=> 'âyet',getAudio:()=>new Promise(()=>{}),
    $:id=>elements[id]??=(id==='splitPlayStatus'?{classList:{add(){}}}:{textContent:'',scrollTop:0})});
  vm.runInContext(fn('openSplit'),c);
  c.openSplit(12);
  assert.equal(c.stopped,true);
  assert.equal(c.playing,false);
  assert.equal(c.splitAy,12);
});
test('failed reciter change keeps the current audio and repeat session',async()=>{
  const status={textContent:'',classList:{add(){}}};
  const list={appendChild(button){this.button=button;}};
  const c=vm.createContext({SET:{reciter:4},RECITERS:[{id:5,n:'Reader',s:'style'}],
    curS:4,splitAy:12,splitParts:[{old:true}],audioRequestId:0,AD_:{sourceUrl:'old'},
    reciterChoiceGeneration:0,
    splitChapterAudio:null,splitVerseLoading:null,
    $:id=>id==='split'?{classList:{contains:()=>true}}:id==='reader'?{classList:{contains:()=>false}}:id==='rlist'?list:status,
    document:{createElement:()=>({})},elifaRecStyle:s=>s,saveSet(){},closeSheets(){},
    updateRecStrip(){},fillAyarlar(){},updateStat(){},renderSplit(){},
    stopPlan(){c.audioRequestId++;},openSheet(){},toast(message){c.lastToast=message;},
    getAudio:async()=>{throw Error('temporary network error');}});
  vm.runInContext(fn('audioTimingUnverified'),c);
  vm.runInContext(fn('selectReciter'),c);
  vm.runInContext(fn('openReciterSheet'),c);
  c.openReciterSheet();
  const pending=list.button.onclick();
  assert.equal(c.splitAy,12,'the verse remains selected during the request');
  await pending;
  assert.equal(c.splitAy,12);
  assert.equal(c.SET.reciter,4);
  assert.equal(c.AD_.sourceUrl,'old');
  assert.equal(c.audioRequestId,0,'the current repeat session is not stopped');
  assert.equal(c.splitParts.length,1);
  assert.match(c.lastToast,/korundu/);
});
test('mismatched Sudais chapters cannot play with the provider verse clock',async()=>{
  let loads=0;
  const c=vm.createContext({audioCache:{},audioPending:{},audioCacheGeneration:{},loadAudio:async()=>{loads++;return {sourceUrl:'ok'};}});
  vm.runInContext(fn('audioTimingUnverified'),c);vm.runInContext(fn('getAudio'),c);
  for(const sid of [3,4,5,28,29])await assert.rejects(c.getAudio(3,sid),/RECITER_CHAPTER_TIMING_UNVERIFIED/);
  assert.equal(loads,0);
  assert.equal((await c.getAudio(3,24)).sourceUrl,'ok');
  assert.equal(loads,1);
});
test('a successful download invalidates pending audio without interrupting its existing caller',async()=>{
  const resolvers=[];
  const c=vm.createContext({audioCache:{},audioPending:{},audioCacheGeneration:{},
    loadAudio:()=>new Promise(resolve=>resolvers.push(resolve))});
  for(const name of ['audioTimingUnverified','getAudio','invalidateAudioCache'])vm.runInContext(fn(name),c);
  const oldRequest=c.getAudio(4,2);
  assert.equal(resolvers.length,1);
  c.invalidateAudioCache(4,2);
  const newRequest=c.getAudio(4,2);
  assert.equal(resolvers.length,2,'new reader must not share a pre-download request');
  resolvers[0]({sourceUrl:'old'});
  assert.equal((await oldRequest).sourceUrl,'old','existing caller may finish');
  assert.ok(c.audioPending['4:2'],'old completion must not clear the new request');
  resolvers[1]({sourceUrl:'new'});
  assert.equal((await newRequest).sourceUrl,'new');
  assert.equal(c.audioPending['4:2'],undefined);
});
test('a complete-verse fallback starts without waiting for split PCM',async()=>{
  const af=fixture(7,2,'-277');const c=context(af);
  loadVerse(c,277);
  const words=c.wordArr;
  c.splitParts=[{words,giFrom:0,giTo:words.length-1,
    f:c.AD_.verseRanges[277][0],t:c.AD_.verseRanges[277][1],wholeVerse:true,timingFallback:true}];
  let decoded=false;c.ensureSplitAudio=async()=>{decoded=true;};
  await c.startFromPart(0);
  assert.equal(decoded,false);
  assert.equal(c.result.length,1);
  assert.equal(c.result[0].wholeVerse,true);
});
test('verified Hani timing is accepted only for the exact audio and Quran words',async()=>{
  const data=JSON.parse(fs.readFileSync(new URL('../assets/audio-timing-overrides-v3.json',import.meta.url)));
  const row=data.rows['5:13:27'];
  const c=vm.createContext({QTEXT:vm.runInContext('QTEXT',textContext),AbortSignal,
    fetch:async()=>({ok:true,json:async()=>data}),console:{warn(){}}});
  vm.runInContext("const VERIFIED_TIMING_ASSETS={5:'./assets/audio-timing-overrides-v3.json'};const verifiedTimingPromises={};",c);
  for(const name of ['timingTextKey','applyVerifiedTimings'])vm.runInContext(fn(name),c);
  const original={audio_url:row.url,verse_timings:[{verse_key:'13:27',timestamp_from:643614,timestamp_to:661248,segments:[[1,643614,645434]]}]};
  const fixed=await c.applyVerifiedTimings(original,5,13);
  assert.deepEqual(Array.from(fixed.verse_timings[0].segments,x=>Array.from(x)),row.segments);
  assert.equal(fixed.verse_timings[0].timestamp_to,row.range[1]);
  assert.equal(fixed.trustedNext[27],row.next);
  const other=await c.applyVerifiedTimings({...original,audio_url:row.url+'?other-recording'},5,13);
  assert.equal(other.verse_timings[0].timestamp_to,661248);
  const differentText=await c.applyVerifiedTimings(original,5,14);
  assert.equal(differentText.verse_timings[0].timestamp_to,661248);
});
test('verified Hani timing repairs an early verse end only for the paired MP3',async()=>{
  const data=JSON.parse(fs.readFileSync(new URL('../assets/audio-timing-overrides-v3.json',import.meta.url)));
  const row=data.rows['5:16:50'];
  assert.ok(row);
  const c=vm.createContext({QTEXT:vm.runInContext('QTEXT',textContext),AbortSignal,
    fetch:async()=>({ok:true,json:async()=>data}),console:{warn(){}}});
  vm.runInContext("const VERIFIED_TIMING_ASSETS={5:'./assets/audio-timing-overrides-v3.json'};const verifiedTimingPromises={};",c);
  for(const name of ['timingTextKey','applyVerifiedTimings'])vm.runInContext(fn(name),c);
  const source={verse_key:'16:50',timestamp_from:803831,timestamp_to:810007,
    segments:[[1,803831,813026]]};
  const af={audio_url:row.url,verse_timings:[source]};
  const fixed=await c.applyVerifiedTimings(af,5,16);
  assert.ok(row.range[1]>source.timestamp_to+3000);
  assert.deepEqual(Array.from(fixed.verse_timings[0].segments,x=>Array.from(x)),row.segments);
  assert.equal(fixed.verse_timings[0].timestamp_to,row.range[1]);
  assert.ok(row.next>=row.range[1]);
});
test('a complete verse take excludes a nearby reciter repetition',async()=>{
  const data=JSON.parse(fs.readFileSync(new URL('../assets/audio-timing-overrides-v3.json',import.meta.url)));
  const row=data.rows['5:4:152'];
  assert.ok(row);
  assert.equal(row.segments.length,17);
  assert.ok(row.next>=row.range[1]);
  assert.ok(row.next-row.range[1]<1000,'next boundary is the repeated take');
  assert.deepEqual([...new Set(row.segments.map(s=>s[0]))],Array.from({length:17},(_,i)=>i+1));
});
test('a verified next-verse start prevents shortening the final word',()=>{
  const c=vm.createContext({AD_:{trustedNext:{27:2000},verseRanges:{28:[1000,3000]},verseEnds:{27:1500}},
    SET:{startPad:0,endPad:0}});
  vm.runInContext(fn('terminalMuallimTailEnd'),c);
  vm.runInContext(fn('splitBounds'),c);
  const bounds=c.splitBounds({f:1100,t:1500,cutKey:'27:5',ayEnd:27});
  assert.equal(bounds.t,1500);
});
test('Turkish orthography groups split compounds without changing Quran letters',()=>{
  const c=vm.createContext({});vm.runInContext(fn('alignTurkishWords'),c);
  for(const [sid,ay,expected] of [[2,21,11],[10,23,25],[2,1,1]]){
    const reference=vm.runInContext(`QTEXT[${sid}][${ay-1}][2].filter(w=>w[1]===0).map(w=>w[0])`,textContext);
    const printed=vm.runInContext(`QTEXT_TR[${sid}][${ay-1}].split(/\\s+/).filter(Boolean)`,textContext);
    const grouped=c.alignTurkishWords(reference,printed);
    assert.ok(grouped,`${sid}:${ay} aligns`);
    assert.equal(grouped.length,expected);
    assert.equal(grouped.map((t,i)=>t+(grouped.joinNext?.has(i)?'':' ')).join('').trimEnd(),printed.join(' '));
  }
});
test('part cards count printed Arabic words, including aligned compounds',()=>{
  const c=vm.createContext({});vm.runInContext(fn('printedWordCount'),c);
  assert.equal(c.printedWordCount({words:[{txt:'يَٓا اَيُّهَا'},{txt:'النَّاسُ'}]}),3);
  assert.equal(c.printedWordCount({words:[{txt:'ذُو',joinNext:true},{txt:'انْتِقَامٍ'}]}),1);
  assert.equal(c.printedWordCount({words:[{txt:'الٓمٓ ۚ'}]}),1);
});
test('all Turkish printed verses retain their exact text after verified grouping',()=>{
  const c=vm.createContext({});vm.runInContext(fn('alignTurkishWords'),c);
  const {base,alternate}=vm.runInContext('({base:QTEXT,alternate:QTEXT_TR})',textContext);
  let repaired=0,checked=0;
  for(let sid=1;sid<=114;sid++)for(let ay=0;ay<base[sid].length;ay++){
    const reference=base[sid][ay][2].filter(w=>w[1]===0).map(w=>w[0]);
    const printed=alternate[sid][ay].split(/\s+/).filter(Boolean);
    const grouped=c.alignTurkishWords(reference,printed);
    assert.ok(grouped,`${sid}:${ay+1} aligns`);
    assert.equal(grouped.length,reference.length,`${sid}:${ay+1} group count`);
    assert.equal(grouped.map((t,i)=>t+(grouped.joinNext?.has(i)?'':' ')).join('').trimEnd(),printed.join(' '),`${sid}:${ay+1} printed text`);
    checked++;
    if(printed.length!==grouped.length)repaired++;
  }
  assert.ok(repaired>=370);
  assert.equal(checked,6236);
});
test('Al Imran 3:4 maps its joined printed word to two audio positions without a cut inside it',()=>{
  const reference=vm.runInContext('QTEXT[3][3][2].filter(w=>w[1]===0).map(w=>w[0])',textContext);
  const printed=vm.runInContext('QTEXT_TR[3][3].split(/\\s+/).filter(Boolean)',textContext);
  const c=vm.createContext({});vm.runInContext(fn('alignTurkishWords'),c);
  const aligned=c.alignTurkishWords(reference,printed);
  assert.equal(printed.length,17);
  assert.equal(aligned.length,18);
  assert.equal(aligned[16]+aligned[17],printed[16]);
  assert.ok(aligned.joinNext.has(16));
});
test('equal printed and audio word counts still verify each position',()=>{
  const c=vm.createContext({});vm.runInContext(fn('alignTurkishWords'),c);
  for(const [sid,ay] of [[5,95],[8,29]]){
    const reference=vm.runInContext(`QTEXT[${sid}][${ay-1}][2].filter(w=>w[1]===0).map(w=>w[0])`,textContext);
    const printed=vm.runInContext(`QTEXT_TR[${sid}][${ay-1}].split(/\\s+/).filter(Boolean)`,textContext);
    assert.equal(reference.length,printed.length);
    const aligned=c.alignTurkishWords(reference,printed);
    assert.ok(aligned.joinNext.size>0,`${sid}:${ay} contains a fused printed word`);
    assert.notDeepEqual([...aligned],printed,`${sid}:${ay} needs positional realignment`);
    assert.equal(aligned.map((t,i)=>t+(aligned.joinNext.has(i)?'':' ')).join('').trimEnd(),printed.join(' '));
  }
});
test('Sudais Nur 24:35 preview covers all words in short ordered parts',()=>{
  const row=JSON.parse(fs.readFileSync(new URL('../assets/audio-timing-overrides-r3-r5.json',import.meta.url),'utf8')).rows['3:24:35'];
  assert.ok(row);
  const af={sid:24,audio_url:row.url,verse_timings:[{
    verse_key:'24:35',timestamp_from:row.range[0],timestamp_to:row.range[1],segments:row.segments}]};
  const c=context(af);c.SET.reciter=3;c.AD_.reciterId=3;c.AD_.trustedNext={35:row.next};
  c.AD_.allowedSplitCuts={35:row.allowedCuts};
  loadVerse(c,35,'medine');
  const sizes=Array.from(c.splitParts,part=>part.words.length);
  assert.deepEqual(sizes.flatMap((_,i)=>Array.from(c.splitParts[i].words,word=>word.pos)),
    Array.from({length:48},(_,i)=>i+1));
  assert.deepEqual(sizes,[4,5,5,5,6,7,3,9,4]);
  assert.ok(c.splitParts.slice(0,-1).every(part=>row.allowedCuts.includes(part.words.at(-1).pos)));
  assert.ok(c.splitParts.every(part=>!part.timingFallback&&!part.unsafeTiming));
  const acoustic=JSON.parse(fs.readFileSync(new URL('../review/sudais-2435-playback-check.json',import.meta.url),'utf8'));
  c.AD_.splitBuf={ay:35,shift:0,lo:acoustic.pcmWindow[0],hi:acoustic.pcmWindow[1],
    cuts:Object.fromEntries(acoustic.allAcousticCuts.map(cut=>[cut.afterWord,cut.cutMs])),
    starts:Object.fromEntries(acoustic.allAcousticCuts.map(cut=>[cut.afterWord,cut.cutMs])),pauses:{}};
  const refined=Array.from(c.computeParts(35),part=>part.words.length);
  assert.deepEqual(refined,sizes);
});

test('Al Imran 3:4 has short playable parts for every supplied reciter',()=>{
  const files=JSON.parse(fs.readFileSync(new URL('fixtures/al-imran-4-timings.json',import.meta.url),'utf8'));
  for(const af of files){
    const c=context(af);loadVerse(c,4);
    assert.ok(c.splitParts.length>=3,`reciter ${af.rid} splits`);
    assert.ok(c.splitParts.every(p=>p.words.length<=6),`reciter ${af.rid} short parts`);
    assert.ok(!c.splitParts.some(p=>p.words.at(-1).joinNext),`reciter ${af.rid} keeps joined printed word together`);
    assert.equal(c.splitParts.flatMap(p=>p.words).length,18);
    const next=c.AD_.verseRanges[5]?.[0];
    assert.ok(c.buildPartsPlan(0).every(p=>{const b=c.stepBounds(p);return b.t>b.f&&(!next||b.t<=next);}),`reciter ${af.rid} safe audio bounds`);
  }
});
test('a bad final-word timestamp cannot suppress safe earlier splits or enter the next verse',()=>{
  const c=context(fixture(5,10,'-27'));loadVerse(c,27);
  const next=c.AD_.verseRanges[28][0];
  assert.ok(c.AD_.verseSegments[27].at(-1)[2]>next+1000,'provider final label is 1219 ms late');
  assert.ok(c.splitParts.length>=3,'earlier words remain split');
  assert.ok(c.splitParts.every(p=>!p.timingFallback));
  assert.ok(c.buildPartsPlan(0).every(p=>c.stepBounds(p).t<=next),'no part plays into verse 28');
  assert.equal(c.splitParts.flatMap(p=>p.words).length,27);
});
test('Shatri Nisa 12 retains the 1297 ms missing tail',()=>{
  const c=context(fixture(4,4));loadVerse(c,12);
  const last=c.buildPartsPlan(0).at(-1), bounds=c.stepBounds(last);
  assert.equal(last.ayEnd,12);
  assert.equal(last.t,414755);
  assert.equal(bounds.t,416052);
  assert.equal(bounds.t-last.t,1297);
  assert.equal(bounds.t,c.AD_.ay[13][0]);
  assert.ok(c.splitParts.length>=8);
  const single=c.buildPartsPlan(0).filter(p=>!p.combo).map(c.stepBounds);
  for(const seg of c.AD_.verseSegments[12])assert.ok(single.some(b=>b.f<=seg[1]&&b.t>=seg[2]),'Every repeated/mislabelled segment is retained');
});
test('prepared Shatri Nisa retains every word in short playable parts',()=>{
  const c=context(fixture(4,4));loadVerse(c,12);
  c.AD_.splitBuf={ay:12,shift:965,cuts:{49:370345,64:387890,82:408145},hi:420000};
  c.splitParts=c.computeParts(12);
  assert.ok(c.splitParts.length>10);
  assert.equal(c.splitParts[0].f,c.AD_.verseRanges[12][0]+965);
  assert.equal(c.splitParts.flatMap(p=>p.words).length,88);
  assert.ok(c.splitParts.every(p=>p.words.length<=6&&p.t>p.f));
  for(let i=0;i<c.splitParts.length-1;i++)assert.equal(c.splitParts[i+1].f,c.splitParts[i].t);
  assert.equal(c.stepBounds(c.buildPartsPlan(0).at(-1)).t,c.AD_.verseRanges[12][1]+965);
});
test('mislabeled timing rows are repaired only where missing positions prove their place',()=>{
  const c=context(fixture(4,4));loadVerse(c,12);
  const s=c.AD_.verseSegments[12];
  assert.ok(s.some(x=>x[0]===43)&&s.some(x=>x[0]===44)&&s.some(x=>x[0]===74));
  assert.equal(s.filter(x=>x[0]===61).length,2);
  assert.equal(s.filter(x=>x[0]===62).length,2);
  assert.ok(c.splitParts.length>=8,'Nisa 12 has short, meaningful text candidates');
  c.AD_.splitBuf={ay:12,shift:970,cuts:{10:330665,25:346665,34:354460,42:362985,49:370350,64:387895,73:397260,82:408150,85:412385},hi:420000};
  const parts=c.computeParts(12);
  assert.ok(parts.length>=8,'real acoustic pauses keep the verse in memorisable parts');
  assert.ok(parts.every(p=>p.words.length<=19));
});
test('a verified reciter breath shortens a long phrase at a clause boundary',()=>{
  const c=context(fixture(4,4));loadVerse(c,12);
  c.AD_.splitBuf={ay:12,shift:995,
    cuts:{7:327000,10:330665,18:339000,25:346665,34:354460,42:362985,49:370350,60:383000,64:387895,73:397260,82:408150,85:412385},
    pauses:{7:120,10:580,18:525,25:400,34:515,42:420,49:330,60:120,64:260,73:650,82:570,85:370},hi:420000};
  const parts=c.computeParts(12);
  assert.ok(parts.some(p=>p.words.at(-1).pos===60));
  assert.ok(!parts.some(p=>p.words.at(-1).pos===7),'do not strand the negation لم');
  assert.ok(Math.max(...parts.map(p=>p.words.length))<=11);
  assert.equal(parts.flatMap(p=>p.words).length,88);
  assert.ok(parts.every(p=>p.t>p.f));
});
test('prepared split audio is reused only for the same source, verse and timing range',()=>{
  const c=context(fixture(4,4));loadVerse(c,12);
  c.AD_.sourceUrl='shatri-4.mp3';
  const key=c.splitAudioKey(c.AD_,12);
  c.splitLastReady={key,result:{ay:12}};
  assert.equal(c.splitAudioReady(c.AD_,12),true);
  assert.equal(c.splitAudioReady({...c.AD_,sourceUrl:'minshawi-4.mp3'},12),false);
  assert.equal(c.splitAudioReady(c.AD_,13),false);
  assert.equal(c.splitAudioReady({...c.AD_,verseRanges:{...c.AD_.verseRanges,12:[1,2]}},12),false);
});
test('offline PCM reuse survives a blob URL change only for the same downloaded recording',()=>{
  const c=context(fixture(4,4));loadVerse(c,12);
  const offline={...c.AD_,sourceUrl:'blob:first',recordingUrl:'https://example.test/4.mp3',
    offlineBlob:{size:12345},offlineCacheId:'download-a',fileSize:12345,fileId:'4:4'};
  const key=c.splitAudioKey(offline,12);
  assert.equal(c.splitAudioKey({...offline,sourceUrl:'blob:second'},12),key);
  assert.notEqual(c.splitAudioKey({...offline,offlineCacheId:'download-b'},12),key);
  assert.notEqual(c.splitAudioKey({...offline,verseSegments:{...offline.verseSegments,12:[]}},12),key);
});
test('a split step repeats the requested number of times before completion',()=>{
  const c={plan:[{dyn:true,part:0,l:'Parça 1'}],pi:0,pr:0,playing:true,waiting:null,htmlBtimer:null,useWA:true,AD_:null,
    SET:{repOn:true,rep:3},replays:0,finished:false,cancelFade(){},stopSrc(){},cancelHTMLFade(){},clearHTMLPlaybackWatch(){},
    updateStat(){},pauseThen(f){f();},goStep(){c.replays++;},finishPlan(){c.finished=true;}};
  vm.createContext(c);
  for(const name of ['stepReps','handleBoundary'])vm.runInContext(fn(name),c);
  c.handleBoundary();assert.equal(c.replays,1);assert.equal(c.pr,1);assert.equal(c.finished,false);
  c.handleBoundary();assert.equal(c.replays,2);assert.equal(c.pr,2);assert.equal(c.finished,false);
  c.handleBoundary();assert.equal(c.finished,true);
});
test('the next part starts after a long verified breath without cutting either word',()=>{
  const c=context(fixture(9,4));loadVerse(c,12);
  c.AD_.splitBuf={ay:12,shift:0,cuts:{10:389080,18:398140,25:407470,34:416410,42:426000,49:434780,64:452010,73:463430,82:475350,85:479900},starts:{10:389960,18:399640,25:408530,34:417220,42:426980,49:435740,64:453540,73:464510,82:476630,85:480510},hi:490000};
  const parts=c.computeParts(12);
  assert.ok(parts.length>=9);
  const before=parts.findIndex(p=>p.words.at(-1).pos===10);
  assert.ok(before>=0);
  assert.equal(parts[before].t,389080);
  assert.equal(parts[before+1].f,389960);
  assert.ok(parts.every(p=>p.t>p.f));
  assert.ok(parts.every(p=>p.words.length<=15));
});
test('text/audio word-count mismatch uses the complete verse',()=>{
  const c=context(fixture(4,4));loadVerse(c,12);
  c.wordArr.push({gi:88,pos:89,ay:12,txt:'test',s:null,e:null});c.ayGi[12][1]=88;
  c.splitParts=c.computeParts(12);
  assert.equal(c.splitParts.length,1);assert.equal(c.splitParts[0].timingFallback,true);
  assert.equal(c.stepBounds(c.buildPartsPlan(0)[0]).t,c.AD_.verseRanges[12][1]);
});
test('a missing provider word timestamp does not collapse unrelated safe pauses',()=>{
  const c=context(fixture(4,4));loadVerse(c,12);
  c.AD_.verseSegments[12]=c.AD_.verseSegments[12].filter(s=>s[0]!==20&&s[0]!==88);
  c.splitParts=c.computeParts(12);
  assert.ok(c.splitParts.length>=5);
  assert.equal(c.splitParts.flatMap(p=>p.words).length,88);
  assert.equal(c.stepBounds(c.buildPartsPlan(0).at(-1)).t,c.AD_.verseRanges[12][1]);
});
test('only a terminal timestamp conflict preserves earlier splits',()=>{
  const c=context(fixture(4,4));loadVerse(c,12);
  c.AD_.verseSegments[12].at(-1)[2]=c.AD_.verseRanges[13][0]+2000;
  c.splitParts=c.computeParts(12);
  assert.ok(c.splitParts.length>1);
  assert.ok(!c.splitParts.some(p=>p.timingFallback));
  assert.equal(c.stepBounds(c.buildPartsPlan(0).at(-1)).t,c.AD_.verseRanges[12][1]);
  const conflicting=context(fixture(4,4));loadVerse(conflicting,12);
  conflicting.AD_.verseSegments[12].find(s=>s[0]===20)[2]=conflicting.AD_.verseRanges[13][0]+2000;
  conflicting.splitParts=conflicting.computeParts(12);
  assert.equal(conflicting.splitParts[0].timingFallback,true);
});
test('Sudais verses with a final word beyond the provider verse end cannot pretend to play completely',async()=>{
  const fixtures=JSON.parse(fs.readFileSync(new URL('fixtures/sudais-unsafe-tail.json',import.meta.url),'utf8'));
  for(const af of fixtures){
    const ay=Number(af.verse_timings[0].verse_key.split(':')[1]);
    const c=context(af);c.AD_.reciterId=af.rid;loadVerse(c,ay);
    const range=c.AD_.verseRanges[ay],last=c.AD_.verseSegments[ay].at(-1);
    assert.ok(last[2]>range[1]+300,`${af.sid}:${ay} source conflict is present`);
    assert.equal(c.splitParts.length,1);
    assert.equal(c.splitParts[0].unsafeTiming,true);
    assert.equal(c.buildPartsPlan(0).length,0);
    const ui=new Map();c.$=id=>{
      if(!ui.has(id))ui.set(id,{textContent:'',dataset:{},classList:{contains:()=>true,add(){}}});
      return ui.get(id);
    };
    c.ensureSplitAudio=()=>{throw Error('Unsafe audio must not be prepared');};
    await c.startFromPart(0);
    await c.startPartsRange(0,0);
    assert.equal(c.result,undefined,`${af.sid}:${ay} never starts a truncated plan`);
    assert.match(ui.get('splitIntro').textContent,/Başka bir hoca seçebilirsin/);
    assert.match(ui.get('splitPlayStatus').textContent,/Ses sınırı doğrulanamadı/);
  }
});
test('Nisa third page: each part and combined step covers its final word',()=>{
  for(const ay of [12,13,14])for(const mushaf of ['turk','medine']){
    const c=context(fixture(4,4));loadVerse(c,ay,mushaf);c.SET.cumu=true;
    for(const p of c.buildPartsPlan(0)){
      const b=c.stepBounds(p);assert.ok(b.t>=p.t,`${ay} ${mushaf} ${p.l}`);
      assert.ok(b.t<=c.AD_.verseRanges[ay+1][0]);assert.ok(b.t>b.f);
      assert.equal(p.preserveTail,true);
    }
  }
});
for(const rid of [7,6,12,9,2,1,3,10,4,5,97])test(`reciter ${rid}: Ikhlas all verse endings`,()=>{
  for(const ay of [1,2,3,4]){
    const c=context(fixture(rid,112));loadVerse(c,ay);
    for(const st of c.buildPartsPlan(0)){
      const b=c.stepBounds(st);
      assert.ok(b.t>=st.t,`verse ${ay} shortened`);
      if(c.AD_.ay[ay+1])assert.ok(b.t<=c.AD_.verseRanges[ay+1][0]);
      assert.ok(b.t>b.f);
    }
  }
});
test('automatic bounds never cross supplied next-word metadata despite positive padding',()=>{
  const c=context(fixture(4,4));loadVerse(c,12);c.SET.endPad=300;
  for(const st of c.buildPartsPlan(0)){
    if(Number.isFinite(st.nextStart))assert.ok(c.stepBounds(st).t<=st.nextStart);
  }
});
test('reciter changes refresh the parts, including their stored end times',()=>{
  const c=context(fixture(4,112));loadVerse(c,4);const before=c.splitParts.at(-1).t;
  c.AD_=context(fixture(7,112)).AD_;c.rewireTimings();
  assert.notEqual(c.splitParts.at(-1).t,before);
  assert.equal(c.splitParts.at(-1).t,c.wordArr.at(-1).e);
});
test('range playback and cumulative plan preserve the chosen range',async()=>{
  const c=context(fixture(4,4));loadVerse(c,12);c.SET.cumu=true;
  await c.startPartsRange(0,c.splitParts.length-1);
  assert.ok(c.result.length>0);
  assert.ok(c.result.every(s=>s.part>=0&&s.part<c.splitParts.length&&s.preserveTail));
  assert.ok(c.result.filter(s=>s.combo).every(s=>s.f===c.splitParts[0].f));
});
test('changing cumulative mode during a selected range never plays outside that range',async()=>{
  const c=context(fixture(4,4));loadVerse(c,12);
  const from=2,to=4;
  assert.ok(c.splitParts.length>to);
  await c.startPartsRange(from,to);
  c.plan=c.result;c.pi=1;c.playing=true;c.waiting=null;c.pausedAtMs=null;
  c.updateStat=()=>{};c.goStep=()=>{};
  vm.runInContext(fn('liveRebuildParts'),c);
  c.SET.cumu=true;
  assert.equal(c.liveRebuildParts(),true);
  assert.ok(c.plan.every(st=>st.part>=from&&st.part<=to));
  assert.deepEqual(Array.from(c.plan.filter(st=>!st.combo),st=>st.part),[from+1,to]);
  assert.ok(c.plan.filter(st=>st.combo).every(st=>st.f===c.splitParts[from].f));
  c.pi=1;c.SET.cumu=false;
  assert.equal(c.liveRebuildParts(),true);
  assert.ok(c.plan.every(st=>st.part>=from&&st.part<=to&&!st.combo));
});
test('stopping during audio loading cannot restart playback',async()=>{
  const c=context(fixture(4,4));loadVerse(c,12);
  let done;c.ensureSplitAudio=()=>new Promise(r=>done=r);
  const pending=c.startFromPart(0);c.stopPlan();done();await pending;
  assert.equal(c.result,undefined);
});
test('part buttons during reciter loading do not cancel the pending reciter request',async()=>{
  const c=context(fixture(4,4));loadVerse(c,12);c.AD_=null;
  const request=c.audioRequestId;
  await c.startFromPart(0);await c.startPartsRange(0,1);
  assert.equal(c.audioRequestId,request);assert.equal(c.result,undefined);
});
test('latest part request wins while preparing a verse',async()=>{
  const c=context(fixture(4,4));loadVerse(c,12);
  let done;const preparation=new Promise(r=>done=r);c.ensureSplitAudio=()=>preparation;
  const p1=c.startFromPart(0),p2=c.startFromPart(c.splitParts.length-1);done();await Promise.all([p1,p2]);
  assert.equal(c.result[0].part,c.splitParts.length-1);
});
test('whole-chapter decode cannot block the selected verse',async()=>{
  const c=context(fixture(4,4));loadVerse(c,12);
  c.AD_.decodePromise=new Promise(()=>{});
  await c.startFromPart(0);
  assert.ok(c.result?.length);
});
test('failed pause preparation never pretends to play a split verse',async()=>{
  const c=context(fixture(4,4));loadVerse(c,12);
  const candidates=c.splitParts.length;
  c.AD_.audio={};c.ensureSplitAudio=async()=>{throw Error('timeout');};
  await c.startFromPart(2);
  assert.equal(c.splitParts.length,candidates);
  assert.equal(c.result,undefined);
});
test('a split part retries after transient decoder failure',async()=>{
  const c=context(fixture(4,4));loadVerse(c,12);
  let attempts=0;
  c.ensureSplitAudio=async()=>{if(++attempts===1)throw Error('temporary decoder failure');};
  await c.startFromPart(0);
  assert.equal(c.result,undefined);
  await c.startFromPart(0);
  assert.equal(attempts,2);
  assert.ok(c.result?.length);
});
test('split playback never uses separately recorded verse audio',()=>{
  const c=context(fixture(4,4));loadVerse(c,12);c.plan=c.buildPartsPlan(0);
  c.AD_.audio={};c.AD_.selBuf={lo:0,hi:1e9,off:123,buffer:{}};
  c.seekPlayHTML=()=>c.path='chapter-html';c.seekPlayWA=()=>c.path='web-audio';
  c.seekPlay(c.plan[0].f,c.plan[0].t);assert.equal(c.path,undefined);
  c.AD_.buffer={duration:1e9};c.seekPlay(c.plan[0].f,c.plan[0].t);assert.equal(c.path,'web-audio');
  assert.equal(c.activeOff,0);assert.equal(c.activeBuf,null);
});
test('indexed physical EOF remains playable in a repeated final split take',()=>{
  const c=context(fixture(4,4));loadVerse(c,12);
  c.AD_.splitBuf={ay:12,lo:0,hi:9980,off:0,buffer:{},finalTailRequestedEnd:10000};
  const final={f:9600,t:10000,ayEnd:12,ranges:[{f:9600,t:10000}]};
  assert.deepEqual({...c.splitBounds(final)},{f:9600,t:9980});
  c.AD_.splitBuf.finalTailRequestedEnd=null;
  assert.equal(c.splitBounds(final).t,10000,'unverified EOF must fail closed');
  c.AD_.splitBuf.finalTailRequestedEnd=10000;
  final.ayEnd=11;
  assert.equal(c.splitBounds(final).t,10000,'another verse must not inherit EOF');
});
test('Husary Muallim final split take keeps its release without looping long unlabelled silence',()=>{
  const c=context(fixture(4,4));
  c.curS=95;
  c.AD_.reciterId=12;
  c.AD_.recordingUrl='https://download.quranicaudio.com/qdc/khalil_al_husary/muallim/95.mp3';
  c.AD_.ay={8:[64110,70265]};
  c.AD_.verseEnds={8:73980};
  c.AD_.verseRanges={8:[64110,73980]};
  const last={f:68000,t:70265,cutKey:'8:4',ayEnd:8};
  assert.equal(c.splitBounds(last).t,70665);
  assert.equal(c.splitBounds({...last,wholeVerse:true,t:73980}).t,70665);
  assert.equal(c.splitBounds({...last,ranges:[{f:68000,t:73980}]}).t,70665);
  c.AD_.reciterId=3;
  assert.equal(c.splitBounds(last).t,73980,'other reciters keep the full terminal tail');
  c.AD_.reciterId=12;
  c.AD_.verseRanges[9]=[74100,78000];
  assert.equal(c.splitBounds(last).t,73980,'an interior verse must not be capped');
  delete c.AD_.verseRanges[9];
  c.curS=96;
  assert.equal(c.splitBounds(last).t,73980,'unaudited chapters keep their existing timing');
});
test('an unverified short split buffer never silently clips a whole or final part',()=>{
  const c=context(fixture(4,4));loadVerse(c,12);
  c.AD_.verseEnds={};
  c.AD_.splitBuf={ay:12,lo:0,hi:9500,off:0,buffer:{}};
  const whole={f:9000,t:10000,cutKey:'12:88',ayEnd:12,wholeVerse:true};
  const final={f:9000,t:10000,cutKey:'12:88',ayEnd:12};
  assert.equal(c.splitBounds(whole).t,10000);
  assert.equal(c.splitBounds(final).t,10000);
  c.AD_.splitBuf.finalTailRequestedEnd=10000;
  assert.equal(c.splitBounds(whole).t,9500);
  assert.equal(c.splitBounds(final).t,9500);
});
test('a short PCM buffer fails closed instead of marking a split take as playing',()=>{
  const c=context(fixture(4,4));loadVerse(c,12);
  c.plan=[{preserveTail:true,wholeVerse:false}];c.AD_.buffer={duration:9.5};
  c.AD_.splitBuf={ay:12,lo:9000,hi:9500,off:9000,buffer:{duration:.5}};
  c.stopPlan=()=>{c.stopped=true};c.toast=m=>{c.message=m};
  c.seekPlayWA=()=>{c.path='web-audio'};
  c.seekPlay(9000,10000);
  assert.equal(c.stopped,true);
  assert.match(c.message,/tam ses doğrulanamadı/);
  assert.equal(c.path,undefined);
});
test('long-chapter selection prepares one source-matched window across verses',async()=>{
  const c=context(fixture(4,4));loadVerse(c,12);
  const original={duration:120};
  c.AD_.buffer=null;
  c.AD_.sourceUrl='https://example.test/chapter.mp3';
  c.computeWordCuts=()=>({'12:49':123,'13:1':456});
  c.fetch=()=>{throw Error('Unrelated ayah recording must not be requested');};
  c.AbortController=AbortController;c.setTimeout=setTimeout;c.clearTimeout=clearTimeout;
  c.selectedRangeModule=async()=>({prepareSelectedRange:async(audio,from,to)=>{
    assert.equal(audio,c.AD_);assert.equal(from,310000);assert.equal(to,320000);
    return {buffer:original,off:300000,lo:300000,hi:420000};
  }});
  await c.ensureSelAudio(12,13,[310000,320000]);
  assert.equal(c.AD_.selBuf.buffer,original);
  assert.equal(c.AD_.selBuf.off,300000);
  assert.equal(c.AD_.wcut['12:49'],300123);
  assert.equal(c.AD_.wcut['13:1'],300456);
  await c.ensureSelAudio(12,13,[311000,319000]);
  assert.equal(c.AD_.lastSelError,undefined,'the ready buffer is reused');
});

test('stopping a pending selection cancels its preparation and a later tap retries',async()=>{
  const c=context(fixture(4,4));
  c.AD_.verseRanges[12]=[310000,315000];c.AD_.verseRanges[13]=[315000,320000];
  c.AbortController=AbortController;c.setTimeout=setTimeout;c.clearTimeout=clearTimeout;
  c.computeWordCuts=()=>({});
  let attempts=0;
  let markStarted;
  const started=new Promise(resolve=>{markStarted=resolve;});
  c.selectedRangeModule=async()=>({prepareSelectedRange:async(_audio,_from,_to,_context,{signal})=>{
    attempts++;
    if(attempts===1)return new Promise((_resolve,reject)=>{
      signal.addEventListener('abort',()=>reject(Error('aborted')),{once:true});
      markStarted();
    });
    return {buffer:{duration:30},off:300000,lo:300000,hi:330000};
  }});
  Object.assign(c,{stepRequestId:0,raf:null,waiting:null,htmlBtimer:null,
    normalChapterAudio:null,cancelHTMLFade(){},cancelFade(){},stopSrc(){},clearHi(){},
    setIco(){},wake(){},updateStat(){}});
  vm.runInContext(fn('stopPlan'),c);
  const pending=c.ensureSelAudio(12,13,[310000,320000]);
  await started;
  c.stopPlan(false);
  await assert.rejects(pending,/aborted/);
  assert.equal(c.AD_.selAbort,null);
  await c.ensureSelAudio(12,13,[310000,320000]);
  assert.equal(attempts,2);
  assert.ok(c.AD_.selBuf.buffer);
});

test('default reciter plans short Fatiha and late Bakara selections from verified word times',async()=>{
  for(const [sid,ay] of [[1,1],[2,286]]){
    const af=JSON.parse(fs.readFileSync(new URL(`../assets/verified-audio/7-${sid}.json`,import.meta.url),'utf8'));
    af.sid=sid;
    const c=context(af);
    c.SET.reciter=7;c.AD_.audio={};c.AD_.sourceUrl='https://example.test/chapter.mp3';c.AD_.decodePromise=null;
    const positions=Object.keys(c.AD_.ws).filter(key=>key.startsWith(ay+':'))
      .map(key=>+key.split(':')[1]).sort((a,b)=>a-b);
    c.wordArr=positions.map(pos=>({ay,pos,s:c.AD_.ws[ay+':'+pos][0],e:c.AD_.ws[ay+':'+pos][1]}));
    c.ayGi={[ay]:[0,c.wordArr.length-1]};
    c.selA=0;c.selB=c.wordArr.length-1;
    vm.runInContext(fn('selRange'),c);vm.runInContext(fn('selTimes'),c);
    let prepared=0;
    c.ensureSelAudio=async(first,last,range)=>{
      prepared++;
      assert.equal(first,ay);assert.equal(last,ay);
      assert.deepEqual(Array.from(range),[c.wordArr[0].s,c.wordArr.at(-1).e]);
      c.AD_.selBuf={lo:range[0],hi:range[1],off:range[0],buffer:{}};
    };
    vm.runInContext(fn('playSelection'),c);
    await c.playSelection();
    assert.equal(prepared,1);
    assert.equal(c.result[0].ayEnd,ay);
    assert.deepEqual([c.result[0].f,c.result[0].t],
      [c.wordArr[0].s,c.wordArr.at(-1).e]);
  }
});

test('Bakara 2:286 starts its second split part and repeats it for each shipped QUA reciter',async()=>{
  for(const rid of [1,2,4,6,7,9,10,97]){
    const af=JSON.parse(fs.readFileSync(new URL(`../assets/verified-audio/${rid}-2.json`,import.meta.url),'utf8'));
    af.sid=2;
    const c=context(af);
    c.SET.reciter=rid;c.SET.rep=4;c.AD_.reciterId=rid;
    loadVerse(c,286);
    assert.ok(c.splitParts.length>1,`reciter ${rid} has a second part`);
    const second=c.splitParts[1];
    assert.ok(second.f>=c.splitParts[0].f&&second.t>second.f,`reciter ${rid} has ordered audio`);
    await c.startFromPart(1);
    assert.equal(c.result?.[0]?.part,1,`reciter ${rid} starts at the tapped part`);
    assert.equal(c.stepReps(c.result[0]),4,`reciter ${rid} repeats the selected part`);
  }
});

test('the first split Play tap waits for the same chapter request and cannot survive a changed visit',()=>{
  const c=context(fixture(4,4));
  const ui=new Map(),element=id=>{if(!ui.has(id))ui.set(id,{classList:{contains:()=>true,add(){},remove(){}}});return ui.get(id);};
  c.$=element;c.curS=2;c.SET.reciter=7;c.splitAy=286;c.splitVisitId=3;
  c.AD_=null;c.splitParts=[];c.audioPending={'7:2':Promise.resolve()};c.splitVerseLoading=null;c.playing=false;
  c.openSplit=()=>{throw Error('an existing chapter load must not be restarted');};
  const start=html.indexOf("$('playBtn2').onclick=()=>{");
  assert.ok(start>=0);
  vm.runInContext(html.slice(start,html.indexOf('\n};',start)+3),c);
  element('playBtn2').onclick();
  assert.equal(c.pendingSplitPlay?.visit,3);
  let started=0;
  c.startFromPart=i=>{assert.equal(i,0);started++;};
  c.AD_={sourceUrl:'https://example.test/002.mp3'};
  c.splitParts=[{f:1,t:2}];c.splitVerseLoading=Promise.resolve();
  assert.equal(c.tryStartPendingSplitPlay(),false,'a separate verse source is still loading');
  c.splitVerseLoading=null;
  assert.equal(c.tryStartPendingSplitPlay(),true);
  assert.equal(started,1);assert.equal(c.pendingSplitPlay,null);
  c.pendingSplitPlay={visit:3,sid:2,ay:286,reciter:7};c.splitVisitId=4;
  assert.equal(c.tryStartPendingSplitPlay(),false);
  assert.equal(started,1);assert.equal(c.pendingSplitPlay,null);
  Object.assign(c,{stepRequestId:0,raf:null,waiting:null,htmlBtimer:null,
    normalChapterAudio:null,cancelHTMLFade(){},cancelFade(){},stopSrc(){},clearHi(){},
    setIco(){},wake(){},updateStat(){}});
  vm.runInContext(fn('stopPlan'),c);
  c.pendingSplitPlay={visit:4,sid:2,ay:286,reciter:7};
  c.stopPlan(true);
  assert.equal(c.pendingSplitPlay,null,'Stop cancels an unfulfilled Play tap');
});

test('normal reader plays a selected passage spanning two verses',async()=>{
  const c=context(fixture(4,4));
  c.SET.reciter=4;c.selA=0;c.selB=1;c.wordArr=[
    {ay:12,pos:1,s:310000,e:311000},{ay:13,pos:1,s:319000,e:320000}];
  c.selRange=()=>[0,1];c.selTimes=()=>[310000,320000];
  c.AD_.audio={};c.AD_.sourceUrl='https://example.test/chapter.mp3';c.AD_.buffer=null;c.AD_.decodePromise=null;
  c.ensureSelAudio=async(first,last,range)=>{
    assert.equal(first,12);assert.equal(last,13);
    assert.deepEqual(Array.from(range),[310000,320000]);
    c.AD_.selBuf={lo:300000,hi:330000,off:300000,buffer:{}};
  };
  vm.runInContext(fn('playSelection'),c);
  await c.playSelection();
  assert.equal(c.result.length,1);
  assert.equal(c.result[0].f,310000);
  assert.equal(c.result[0].t,320000);
  assert.equal(c.result[0].wordCut,true);
});

test('first selected Play waits for pending chapter timing and then starts the exact words',async()=>{
  const c=context(fixture(4,4));loadVerse(c,12);c.splitAy=null;c.SET.reciter=4;
  const ready=c.AD_;ready.sourceUrl='https://example.test/chapter.mp3';
  c.AD_={buffer:null,ws:{}};
  c.wordArr.forEach(w=>{w.s=null;w.e=null;});
  c.selA=0;c.selB=1;
  vm.runInContext(fn('selRange'),c);vm.runInContext(fn('selTimes'),c);
  vm.runInContext(fn('playSelection'),c);
  let finishLoad;
  c.getAudio=()=>new Promise(resolve=>{finishLoad=resolve;});
  c.ensureSelAudio=async(_first,_last,range)=>{
    c.AD_.selBuf={buffer:{},off:range[0],lo:range[0],hi:range[1]};
  };
  const pending=c.playSelection();
  assert.equal(c.result,undefined);
  finishLoad(ready);await pending;
  assert.equal(c.AD_,ready);
  assert.deepEqual([c.result?.[0]?.f,c.result?.[0]?.t],
    [ready.ws['12:1'][0],ready.ws['12:2'][1]]);
});

test('stopping while selected Play waits for chapter timing cannot start stale audio',async()=>{
  const c=context(fixture(4,4));loadVerse(c,12);c.splitAy=null;c.SET.reciter=4;
  const ready=c.AD_;ready.sourceUrl='https://example.test/chapter.mp3';
  c.AD_={buffer:null,ws:{}};c.selA=0;c.selB=1;
  let finishLoad;
  c.getAudio=()=>new Promise(resolve=>{finishLoad=resolve;});
  vm.runInContext(fn('selRange'),c);vm.runInContext(fn('selTimes'),c);
  vm.runInContext(fn('playSelection'),c);
  const pending=c.playSelection();
  c.stopPlan();finishLoad(ready);await pending;
  assert.equal(c.result,undefined);
  assert.notEqual(c.AD_,ready);
});

test('selection with a missing first, middle, or last word never plays a shortened passage',async()=>{
  for(const missing of [0,1,2]){
    const c=context(fixture(4,4));loadVerse(c,12);c.splitAy=null;c.SET.reciter=4;
    c.AD_.sourceUrl='https://example.test/chapter.mp3';
    c.selA=0;c.selB=2;c.wordArr[missing].s=null;c.wordArr[missing].e=null;
    c.messages=[];c.toast=message=>c.messages.push(message);
    vm.runInContext(fn('selRange'),c);vm.runInContext(fn('selTimes'),c);
    vm.runInContext(fn('playSelection'),c);
    assert.equal(c.selTimes(),null);
    await c.playSelection();
    assert.equal(c.result,undefined);
    assert.ok(c.messages.some(message=>message.includes('ses zamanı yok')));
  }
});
test('a complete verse selection with missing word times uses only its verified whole-verse range',async()=>{
  const c=context(fixture(4,4));loadVerse(c,12);c.splitAy=null;c.SET.reciter=4;
  c.AD_.sourceUrl='https://example.test/chapter.mp3';
  c.selA=0;c.selB=c.wordArr.length-1;
  c.wordArr[1].s=null;c.wordArr[1].e=null;
  c.normalVerseStep=(chapter,first,last,extra)=>({
    ...extra,f:chapter.ay[first][0],t:chapter.ay[last][1]});
  c.normalVersePlanReady=steps=>{
    assert.equal(steps.length,1);
    assert.equal(steps[0].ayEnd,12);
    return true;
  };
  vm.runInContext(fn('selRange'),c);vm.runInContext(fn('selTimes'),c);
  vm.runInContext(fn('playSelection'),c);
  await c.playSelection();
  assert.deepEqual([c.result?.[0]?.f,c.result?.[0]?.t],Array.from(c.AD_.ay[12]));
  assert.equal(c.result?.[0]?.wordCut,undefined);
});
test('selected final verse reuses physical-end PCM without a false loading error or end padding',async()=>{
  for(const accepted of [true,false]){
    const c=context(fixture(4,4));loadVerse(c,12);c.splitAy=null;c.SET.reciter=4;
    c.AD_.sourceUrl='https://example.test/chapter.mp3';
    c.selA=0;c.selB=c.wordArr.length-1;
    c.selRange=()=>[c.selA,c.selB];c.selTimes=()=>[310000,310200];
    c.AD_.selBuf={buffer:{},off:309900,lo:309900,hi:310150,
      finalTailRequestedEnd:accepted?310200:null};
    c.ensureSelAudio=async()=>{};
    c.messages=[];c.toast=message=>c.messages.push(message);
    vm.runInContext(fn('playSelection'),c);
    await c.playSelection();
    if(accepted){
      assert.equal(c.result?.[0]?.physicalEnd,true);
      assert.deepEqual([c.result[0].f,c.result[0].t],[310000,310150]);
      const bounds=c.stepBounds(c.result[0]);
      assert.deepEqual([bounds.f,bounds.t],[310000,310150]);
    }else{
      assert.equal(c.result,undefined);
      assert.ok(c.messages.some(message=>message.includes('hassas ses henüz hazırlanamadı')));
    }
  }
});
test('1+2 plays the safe prefix before a guarded Hânî tail and stops with an honest status',()=>{
  for(const [surah,last,guarded] of [[34,54,46],[65,12,12]]){
    const chapter={ay:{},recordingUrl:'test-chapter'};
    for(let ay=1;ay<=last;ay++)chapter.ay[ay]=[ay*1000,ay*1000+900];
    const messages=[];
    const c=vm.createContext({
      SET:{reciter:5,cumu:true,repOn:true},curS:surah,curAy:1,AD_:chapter,
      normalChapterAudio:null,
      SURAHS:Array.from({length:114},(_,i)=>({n:i===surah-1?last:1})),
      navigator:{onLine:true},verifiedNormalRanges:()=>null,
      audioTimingUnverified:()=>false,toast:message=>messages.push(message),
      runPlan:steps=>{c.started=steps;},stopPlan:()=>{c.stopped=true;},
    });
    for(const name of ['normalVerseStep','unsafeHaniNormalStep','unsafeNormalVerseStep',
      'normalVersePlanReady','playAyahProgram','finishPlan'])vm.runInContext(fn(name),c);
    assert.equal(c.unsafeHaniNormalStep(c.normalVerseStep(chapter,1,1,{ayEnd:1})),false);
    c.playAyahProgram(1);
    assert.ok(c.started?.length>1,`${surah}:1 must play`);
    assert.ok(c.started.every(step=>step.ayEnd<guarded));
    assert.equal(c.started.at(-1).ayEnd,guarded-1);
    assert.equal(c.started.at(-1).guardedTail,true);
    c.plan=c.started;c.finishPlan();
    assert.equal(c.stopped,true);
    assert.ok(messages.some(message=>message.includes('başka hoca seç')));
    assert.ok(!messages.some(message=>message.includes('Tamamlandı')));
    c.started=null;c.stopped=false;messages.length=0;
    c.playAyahProgram(guarded);
    assert.equal(c.started,null,`${surah}:${guarded} must stay guarded`);
    assert.ok(messages.some(message=>message.includes('doğrulanamadı')));
  }
});
test('Hânî Fâtiha 1:1 plays the whole verse but rejects incomplete word selections',async()=>{
  const af=fixture('hani','1-1');
  for(const [first,last,playable] of [[0,3,true],[0,0,false],[2,2,false],[3,3,false],[0,1,false],[1,3,false]]){
    const c=context(af);loadVerse(c,1,'medine');c.splitAy=null;c.SET.reciter=5;
    c.AD_.sourceUrl=af.audio_url;c.AD_.recordingUrl=af.audio_url;c.selA=first;c.selB=last;
    c.verifiedNormalRanges=()=>null;
    vm.runInContext(fn('normalVerseStep'),c);
    c.normalVersePlanReady=steps=>steps.every(step=>step.t>step.f);
    c.messages=[];c.toast=message=>c.messages.push(message);
    vm.runInContext(fn('selRange'),c);vm.runInContext(fn('selTimes'),c);
    vm.runInContext(fn('playSelection'),c);
    await c.playSelection();
    if(playable){
      assert.deepEqual([c.result?.[0]?.f,c.result?.[0]?.t],[7,4065]);
      assert.equal(c.result?.[0]?.wordCut,undefined);
      assert.equal(c.result?.[0]?.preserveTail,true);
    }else{
      assert.equal(c.result,undefined,`${first}–${last} must not play a partial recording`);
      assert.ok(c.messages.some(message=>message.includes('ses zamanı yok')));
    }
  }
  const unrelated=context(af);unrelated.SET.reciter=5;unrelated.AD_.recordingUrl='https://example.test/other.mp3';
  unrelated.verifiedNormalRanges=()=>null;
  vm.runInContext(fn('normalVerseStep'),unrelated);
  assert.equal(unrelated.normalVerseStep(unrelated.AD_,1,1,{}).t,3972,
    'the Hânî tail correction must not transfer to another recording');
});
test('stopping while selected audio decodes cannot restart an old selection',async()=>{
  const c=context(fixture(4,4));
  c.SET.reciter=4;c.selA=0;c.selB=1;
  c.wordArr=[{ay:12,pos:1},{ay:12,pos:2}];
  c.selRange=()=>[0,1];c.selTimes=()=>[310000,320000];
  c.AD_.audio={};c.AD_.sourceUrl='https://example.test/chapter.mp3';c.AD_.buffer=null;
  let finishDecode;
  c.AD_.decodePromise=new Promise(resolve=>{finishDecode=resolve;});
  let selectionLoads=0;c.ensureSelAudio=async()=>{selectionLoads++;};
  vm.runInContext(fn('playSelection'),c);
  const pending=c.playSelection();
  c.stopPlan();finishDecode();await pending;
  assert.equal(selectionLoads,0);
  assert.equal(c.result,undefined);
});
test('only the latest selected-audio preparation may start playback',async()=>{
  const c=context(fixture(4,4));
  c.SET.reciter=4;c.selA=0;c.selB=1;
  c.wordArr=[{ay:12,pos:1},{ay:12,pos:2}];
  c.selRange=()=>[0,1];c.selTimes=()=>[310000,320000];
  c.AD_.audio={};c.AD_.sourceUrl='https://example.test/chapter.mp3';c.AD_.buffer=null;c.AD_.decodePromise=null;
  const finishes=[];c.ensureSelAudio=()=>new Promise(resolve=>finishes.push(resolve));
  let starts=0;c.runPlan=()=>{starts++;};
  vm.runInContext(fn('playSelection'),c);
  const first=c.playSelection(),second=c.playSelection();
  assert.equal(finishes.length,2);
  c.AD_.selBuf={lo:300000,hi:330000,off:300000,buffer:{}};
  finishes[1]();await second;
  finishes[0]();await first;
  assert.equal(starts,1);
});
test('repeat count is unchanged; turning repeat off makes one pass',()=>{
  const c=context(fixture(4,4));loadVerse(c,12);const st=c.buildPartsPlan(0)[0];
  assert.equal(c.stepReps(st),5);c.SET.rep=3;assert.equal(c.stepReps(st),3);
  c.SET.repOn=false;assert.equal(c.stepReps(st),1);
});

test('stop signs are classified by their role and the corresponding reference word',()=>{
  const c=context(fixture(4,4));
  assert.equal(c.splitPauseAllowed('wordۙ','wordۙ'),false);
  assert.equal(c.splitPauseAllowed('wordۚۛ','wordۛ'),false);
  assert.equal(c.splitPauseAllowed('wordۜ','wordۜ'),false);
  assert.equal(c.splitPauseAllowed('wordۜ','wordۗ'),true);
  assert.equal(c.splitPauseAllowed('word','wordۚ'),true);
});
test('a long passage without printed stops still gets short memorisation chunks',()=>{
  const c=context(fixture(4,4));loadVerse(c,12);
  const verse=c.QTEXT[4][11];c.QTEXT={...c.QTEXT,4:c.QTEXT[4].slice()};
  c.QTEXT[4][11]=[verse[0],verse[1],verse[2].map(w=>[w[0].replace(/[\u06D6-\u06DC]/g,''),w[1]])];
  c.wordArr.forEach(w=>w.txt='word');c.splitParts=c.computeParts(12);
  assert.ok(c.splitParts.length>10);
  assert.ok(c.splitParts.every(p=>p.words.length<=6));
  assert.equal(c.splitParts.flatMap(p=>p.words).length,88);
});
test('aligned word timestamps still create short parts without a reciter pause',()=>{
  const c=context(fixture(4,4));loadVerse(c,12);
  assert.ok(c.splitParts.length>1);
  c.AD_.splitBuf={ay:12,shift:0,cuts:{},lo:0,hi:1e9};
  const parts=c.computeParts(12);
  assert.ok(parts.length>10);
  assert.ok(parts.every(p=>p.words.length<=6&&p.t>p.f));
  assert.equal(parts.flatMap(p=>p.words).length,88);
  for(let i=0;i<parts.length-1;i++)assert.equal(parts[i+1].f,parts[i].t);
});
for(const rid of [7,4])test(`Bakara 277 reciter ${rid} uses short clauses despite no printed waqf`,()=>{
  const c=context(fixture(rid,2,'-277'));loadVerse(c,277,'medine');
  assert.deepEqual(Array.from(c.splitParts,p=>p.words.length),[5,4,4,6]);
  c.AD_.splitBuf={ay:277,shift:0,cuts:{},lo:0,hi:1e9};
  const parts=c.computeParts(277);
  assert.deepEqual(Array.from(parts,p=>p.words.length),[5,4,4,6]);
  assert.deepEqual(Array.from(parts,p=>p.words.at(-1).pos),[5,9,13,19]);
  for(let i=0;i<parts.length-1;i++)assert.equal(parts[i+1].f,parts[i].t);
});
