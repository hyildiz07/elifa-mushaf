import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {HUSARY_VERSE_KEYS,verifiedHusaryVerseKey,validateHusaryVerseRow,makeHusaryVerseTiming,
  verifyHusaryVerseBytes,makeHusary145PhraseRanges} from '../src/verified-verse-audio.mjs';

test('concurrent verified verse requests share one download and retry after failure',async()=>{
  const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const start=html.indexOf('async function getVerifiedVerseAudio(');
  assert.ok(start>=0);
  const source=html.slice(start,html.indexOf('\n}',start)+2);
  const c=vm.createContext({SET:{reciter:12},HUSARY_SPLIT_VERSES:new Set(['2:145']),
    verifiedVerseAudioCache:new Map(),verifiedVerseAudioPending:new Map()});
  vm.runInContext(source,c);
  let calls=0,rejectFirst;
  c.loadVerifiedVerseAudio=()=>{
    calls++;
    if(calls===1)return new Promise((_,reject)=>{rejectFirst=reject;});
    return Promise.resolve({ready:true});
  };
  const a=c.getVerifiedVerseAudio(2,145),b=c.getVerifiedVerseAudio(2,145);
  assert.equal(calls,1);
  rejectFirst(Error('temporary download failure'));
  await assert.rejects(a,/temporary/);
  await assert.rejects(b,/temporary/);
  assert.equal(c.verifiedVerseAudioPending.size,0);
  const result=await c.getVerifiedVerseAudio(2,145);
  assert.equal(result.ready,true);
  assert.equal(calls,2);
});

test('Husary Muallim candidate timing stays paired with its own complete verse audio',()=>{
  const candidate=JSON.parse(fs.readFileSync(new URL('../assets/verified-verse-audio-r12.json',import.meta.url)));
  const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const start=html.indexOf('const QTEXT='),context=vm.createContext({});
  vm.runInContext(html.slice(start,html.indexOf('\n',start)),context);
  const text=vm.runInContext('QTEXT',context);
  assert.equal(candidate.status,'split-verse-source-v1');
  assert.equal(candidate.reciter,12);
  assert.equal(candidate.recording,'Husary_Muallim_128kbps');
  assert.equal(candidate.dataset,'quranlab/quran-audio@55d48a9cfc9dec3836efc9b0f8631c4ff6399c28');
  assert.equal(candidate.timing_license,'CC-BY-4.0');
  assert.ok(candidate.rows['2:145']); // The apparent tail is byte-identical 2:146–147 audio.
  assert.equal(Object.keys(candidate.rows).length,24);
  assert.deepEqual(new Set(Object.keys(candidate.rows)),HUSARY_VERSE_KEYS);
  const keyLiteral=html.match(/const HUSARY_SPLIT_VERSES=new Set\((\[[^\]]+\])\)/)?.[1];
  assert.ok(keyLiteral);
  assert.deepEqual(new Set(vm.runInNewContext(keyLiteral)),HUSARY_VERSE_KEYS);
  assert.equal(verifiedHusaryVerseKey(12,2,145),'2:145');
  assert.equal(verifiedHusaryVerseKey(3,4,11),null);
  for(const [key,row] of Object.entries(candidate.rows)){
    const [sid,ay]=key.split(':').map(Number);
    const count=text[sid][ay-1][2].filter(w=>w[1]===0).length;
    assert.equal(row.verse_key,key);
    assert.equal(row.audio_url,`https://everyayah.com/data/Husary_Muallim_128kbps/${String(sid).padStart(3,'0')}${String(ay).padStart(3,'0')}.mp3`);
    assert.ok(row.file_size>10000);
    assert.ok(row.audio_duration_ms>=row.timestamp_to);
    if(key==='114:6'){
      assert.equal(row.playback_end_ms,5500);
      assert.equal(row.audio_sha256,'010db0dcd7fda9f2339e8ae46c361b3d9c0c0cb39e87891f9896cb3cde5c7b54');
      assert.ok(row.audio_duration_ms-row.playback_end_ms>6000);
    }else if(key==='2:145'){
      assert.equal(row.playback_end_ms,61250);
      assert.equal(row.audio_sha256,'cc4640fa78a211b598a6e5f47880a5ff39112d3f8279d5260f860f1e1a1cad28');
      assert.ok(row.audio_duration_ms-row.playback_end_ms>50000);
    }else assert.ok(row.audio_duration_ms-row.timestamp_to<8000);
    assert.equal(row.segments.length,count);
    assert.equal(validateHusaryVerseRow(candidate,key,count),row);
    const timing=makeHusaryVerseTiming(row,ay);
    assert.deepEqual(timing.verseRanges[ay],[0,row.playback_end_ms??row.audio_duration_ms]);
    assert.equal(timing.verseEnds[ay],row.playback_end_ms??row.audio_duration_ms);
    assert.deepEqual(timing.ws[`${ay}:${count}`],row.segments.at(-1).slice(1));
    row.segments.forEach(([position,from,to],i)=>{
      assert.equal(position,i+1);
      assert.ok(Number.isInteger(from)&&Number.isInteger(to)&&from>=0&&to>from);
      assert.ok(to<=row.timestamp_to);
      if(i)assert.ok(from>=row.segments[i-1][2]);
    });
  }
  const bad=structuredClone(candidate);
  bad.rows['4:23'].audio_url=candidate.rows['4:11'].audio_url;
  assert.throws(()=>validateHusaryVerseRow(bad,'4:23',54));
});

test('the final 4:23 split step preserves the spoken tail after its last aligned word',()=>{
  const catalog=JSON.parse(fs.readFileSync(new URL('../assets/verified-verse-audio-r12.json',import.meta.url)));
  const row=catalog.rows['4:23'],timing=makeHusaryVerseTiming(row,23);
  assert.ok(row.audio_duration_ms-row.timestamp_to>4000);
  const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const extract=name=>{
    const start=html.indexOf(`function ${name}(`);
    assert.ok(start>=0);
    return html.slice(start,html.indexOf('\n}',start)+2);
  };
  const c=vm.createContext({AD_:{...timing,splitBuf:{ay:23,shift:0,hi:row.audio_duration_ms}},
    wordArr:[{ay:23,pos:54}],ayGi:{23:[0,0]},SET:{startPad:0,endPad:-90},pieceCursor:0});
  for(const name of ['partKey','partStep','terminalMuallimTailEnd','splitBounds','stepBounds'])vm.runInContext(extract(name),c);
  const step=c.partStep({t:row.timestamp_to,giTo:0,words:[{pos:54}]},0,row.segments.at(-1)[1],'Son parça',false);
  assert.equal(step.ayEnd,23);
  assert.equal(c.stepBounds(step).t,row.audio_duration_ms);
});

test('the verified verse sources cover their words with safe short plans',()=>{
  const catalog=JSON.parse(fs.readFileSync(new URL('../assets/verified-verse-audio-r12.json',import.meta.url)));
  const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const start=html.indexOf('const QTEXT='),q=vm.createContext({});
  vm.runInContext(html.slice(start,html.indexOf('\n',start)),q);
  const qtext=vm.runInContext('QTEXT',q);
  const c=vm.createContext({AD_:null,wordArr:[],ayGi:{},curS:0,QTEXT:qtext,SET:{reciter:12}});
  for(const name of ['splitPauseAllowed','splitPhraseBoundary','splitChunkPositions',
    'repeatedTimeline','repeatedAudioRanges','computeParts']){
    const i=html.indexOf(`function ${name}(`);
    assert.ok(i>=0,name);
    vm.runInContext(html.slice(i,html.indexOf('\n}',i)+2),c);
  }
  for(const [key,row] of Object.entries(catalog.rows)){
    if(key==='2:145')continue;
    const [sid,ay]=key.split(':').map(Number),words=qtext[sid][ay-1][2].filter(w=>w[1]===0);
    c.curS=sid;c.AD_={...makeHusaryVerseTiming(row,ay),verifiedCbr:true,reciterId:12};
    c.wordArr=words.map(([txt],gi)=>({txt,gi,ay,pos:gi+1,joinNext:false}));
    c.ayGi={[ay]:[0,words.length-1]};
    const parts=c.computeParts(ay);
    if(words.length>=8)assert.ok(parts.length>1,`${key} was not split`);
    assert.ok(parts.every(p=>!p.timingFallback&&p.words.length<=8&&p.f<p.t),key);
    assert.deepEqual(Array.from(parts.flatMap(p=>p.words.map(w=>w.pos))),
      Array.from({length:words.length},(_,i)=>i+1),key);
  }
});

test('the thirteen missing chapter word positions use complete independent verse timelines',()=>{
  const catalog=JSON.parse(fs.readFileSync(new URL('../assets/verified-verse-audio-r12.json',import.meta.url)));
  const gaps={'11:26':[1],'11:116':[10],'114:6':[1],'23:80':[10],
    '23:91':[1],'33:23':[1],'35:3':[20,21],'38:30':[4],
    '38:44':[11],'40:31':[10],'46:33':[17],'58:8':[37,38],'8:40':[7]};
  for(const [key,positions] of Object.entries(gaps)){
    const [sid,ayah]=key.split(':').map(Number);
    const row=catalog.rows[key];
    assert.ok(row,key);
    assert.equal(verifiedHusaryVerseKey(12,sid,ayah),key);
    const timing=makeHusaryVerseTiming(row,ayah);
    for(const pos of positions){
      const [from,to]=timing.ws[`${ayah}:${pos}`];
      assert.ok(to>from,`${key} word ${pos} remains missing`);
    }
    assert.equal(row.segments.length,Math.max(...row.segments.map(s=>s[0])));
    assert.ok(row.segments.every((s,i)=>s[0]===i+1&&s[2]<=row.timestamp_to),key);
  }
});

test('114:6 first-reading stop and source hash are fail-closed',async()=>{
  const catalog=JSON.parse(fs.readFileSync(new URL('../assets/verified-verse-audio-r12.json',import.meta.url)));
  const row=catalog.rows['114:6'];
  assert.equal(makeHusaryVerseTiming(row,6).verseEnds[6],5500);
  assert.throws(()=>validateHusaryVerseRow({...catalog,rows:{...catalog.rows,'114:6':{...row,playback_end_ms:6500}}},'114:6',3));
  await assert.rejects(verifyHusaryVerseBytes(row,new ArrayBuffer(row.file_size)),/HUSARY_VERSE_SOURCE_HASH/);
});

test('selected repaired words use their verse source and exact positions',async()=>{
  const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const start=html.indexOf('async function playSelection(');
  const src=html.slice(start,html.indexOf('\n}',start)+2);
  const planned=[];
  const c=vm.createContext({selA:0,selB:1,audioRequestId:0,
    selRange:()=>[0,1],SET:{reciter:12},curS:11,
    wordArr:[{ay:26,pos:1},{ay:26,pos:2}],ayGi:{26:[0,10]},
    HUSARY_WORD_REPAIRS:new Set(['11:26']),HUSARY_CHAPTER_GAPS:new Set(),
    runPlan:steps=>planned.push(steps),console});
  vm.runInContext(src,c);
  await c.playSelection();
  assert.equal(planned.length,1);
  assert.equal(planned[0][0].sourceRanges[0].verseSource,26);
  assert.deepEqual(Array.from(planned[0][0].sourceRanges[0].verifiedWordRange),[1,2]);
});

test('partial repaired verse playback validates positions on the loaded source',async()=>{
  const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const start=html.indexOf('async function goStep(');
  const src=html.slice(start,html.indexOf('\n}',start)+2);
  const row=JSON.parse(fs.readFileSync(new URL('../assets/verified-verse-audio-r12.json',import.meta.url))).rows['11:26'];
  const chapter={audio:{pause(){}}},verse={audio:{pause(){}},
    ...makeHusaryVerseTiming(row,26)};
  const piece={verseSource:26,f:0,t:null,fullVerse:false,verifiedWordRange:[1,2]};
  const step={sourceRanges:[piece]};
  const played=[];
  const c=vm.createContext({plan:[step],pi:0,pieceCursor:0,playing:true,
    audioRequestId:1,stepRequestId:0,curS:11,SET:{reciter:12},
    HUSARY_WORD_REPAIRS:new Set(['11:26']),normalChapterAudio:chapter,AD_:chapter,
    getVerifiedVerseAudio:async()=>verse,rewireTimings:()=>{},
    stepBounds:st=>st.sourceRanges[0],seekPlay:(f,t)=>played.push([f,t]),
    stopPlan:()=>{throw Error('Unexpected fail-closed')},toast:()=>{},console});
  vm.runInContext(src,c);
  await c.goStep();
  assert.deepEqual(played,[[row.segments[0][1],row.segments[1][2]]]);
});

test('unavailable offline verse audio fails before chapter timing can be reused',async()=>{
  const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const i=html.indexOf('async function getVerifiedVerseAudio(');
  assert.ok(i>=0);
  const j=html.indexOf('async function loadVerifiedVerseAudio(');
  assert.ok(j>=0);
  const c=vm.createContext({SET:{reciter:12},HUSARY_SPLIT_VERSES:new Set(['4:11']),
    navigator:{onLine:false},verifiedVerseAudioCache:new Map(),verifiedVerseAudioPending:new Map()});
  vm.runInContext(html.slice(i,html.indexOf('\n}',i)+2),c);
  vm.runInContext(html.slice(j,html.indexOf('\n}',j)+2),c);
  await assert.rejects(c.getVerifiedVerseAudio(4,11),/VERIFIED_VERSE_OFFLINE/);
});

test('normal Husary listening replaces eight incomplete verses and the overlapping 2:145 span',()=>{
  const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const keyLiteral=html.match(/const HUSARY_CHAPTER_GAPS=new Set\((\[[^\]]+\])\)/)?.[1];
  assert.ok(keyLiteral);
  const keys=new Set(vm.runInNewContext(keyLiteral));
  assert.deepEqual(keys,new Set(['3:127','3:177','4:9','4:10','4:11','4:23','5:64','43:32','2:145']));
  const context=vm.createContext({SET:{reciter:12},HUSARY_CHAPTER_GAPS:keys});
  const start=html.indexOf('function husaryNormalRanges(');
  vm.runInContext(html.slice(start,html.indexOf('\n}',start)+2),context);
  const chapter={ay:{8:[100,200],9:[210,330],10:[340,440],11:[450,560],12:[570,680]},
    verseRanges:{8:[90,205],9:[205,335],10:[335,445],11:[445,565],12:[565,685]}};
  const ranges=context.husaryNormalRanges(chapter,4,8,12);
  assert.deepEqual(Array.from(ranges,part=>[part.chapter??false,part.verseSource??null,part.f,part.t]),
    [[true,null,90,200],[false,9,0,null],[false,10,0,null],
      [false,11,0,null],[true,null,565,680]]);
  assert.equal(context.husaryNormalRanges(chapter,4,12,12),null);
  context.SET.reciter=3;
  assert.equal(context.husaryNormalRanges(chapter,4,8,12),null);
});

test('normal playback switches sources for the whole verified verse and restores chapter audio',async()=>{
  const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const start=html.indexOf('async function goStep(');
  const src=html.slice(start,html.indexOf('\n}',start)+2);
  const played=[],rewired=[];
  const chapter={name:'chapter',audio:{pause(){}}};
  const verse={name:'verse',audio:{pause(){}},verseEnds:{23:154514}};
  const step={sourceRanges:[{chapter:true,f:1000,t:2000},{verseSource:23,f:0,t:null,fullVerse:true}]};
  const c=vm.createContext({plan:[step],pi:0,pieceCursor:0,playing:true,audioRequestId:1,stepRequestId:0,
    curS:4,normalChapterAudio:chapter,AD_:chapter,
    getVerifiedVerseAudio:async()=>verse,
    rewireTimings:()=>rewired.push(c.AD_.name),
    stepBounds:st=>st.sourceRanges[c.pieceCursor],
    seekPlay:(f,t)=>played.push([c.AD_.name,f,t]),
    stopPlan:()=>{throw Error('Unexpected fail-closed')},toast:()=>{},console});
  vm.runInContext(src,c);
  await c.goStep();
  c.pieceCursor=1;await c.goStep();
  assert.equal(step.sourceRanges[1].t,154514);
  c.pieceCursor=0;await c.goStep();
  assert.deepEqual(played,[['chapter',1000,2000],['verse',0,154514],['chapter',1000,2000]]);
  assert.deepEqual(rewired,['verse','chapter']);
});

test('2:145 full step stops before 2:146 and partial source steps fail closed',async()=>{
  const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const start=html.indexOf('async function goStep(');
  const src=html.slice(start,html.indexOf('\n}',start)+2);
  const played=[];
  const chapter={audio:{pause(){}}};
  const verse={audio:{pause(){}},verseEnds:{145:61250}};
  const full={sourceRanges:[{verseSource:145,f:0,t:null,fullVerse:true}]};
  const stopped=[],messages=[];
  const c=vm.createContext({plan:[full],pi:0,pieceCursor:0,playing:true,
    audioRequestId:1,stepRequestId:0,curS:2,normalChapterAudio:chapter,AD_:chapter,
    getVerifiedVerseAudio:async()=>verse,rewireTimings:()=>{},
    stepBounds:st=>st.sourceRanges[0],seekPlay:(f,t)=>played.push([f,t]),
    stopPlan:()=>{stopped.push(true);c.playing=false},toast:msg=>messages.push(msg),
    console:{warn(){}}});
  vm.runInContext(src,c);
  await c.goStep();
  assert.deepEqual(played,[[0,61250]]);
  assert.ok(full.sourceRanges[0].t<67000); // 2:146 starts in the same MP3 at ~66.9 s.
  const partial={sourceRanges:[{verseSource:145,f:1650,t:2710,fullVerse:false}]};
  c.plan=[partial];c.AD_=chapter;c.playing=true;
  await c.goStep();
  assert.deepEqual(played,[[0,61250]]);
  assert.equal(stopped.length,1);
  assert.match(messages[0],/Eksik sûre kaydı/);
});

test('stale verse loads cannot restart audio after a newer step or stop',async()=>{
  const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const start=html.indexOf('async function goStep(');
  const src=html.slice(start,html.indexOf('\n}',start)+2);
  const played=[],resolve=[];
  const chapter={audio:{pause(){}}},verse={audio:{pause(){}},verseEnds:{23:154514}};
  const step={sourceRanges:[{verseSource:23,f:0,t:null,fullVerse:true}]};
  const c=vm.createContext({plan:[step],pi:0,pieceCursor:0,playing:true,audioRequestId:1,stepRequestId:0,
    curS:4,normalChapterAudio:chapter,AD_:chapter,
    getVerifiedVerseAudio:()=>new Promise(r=>resolve.push(r)),
    rewireTimings:()=>{},stepBounds:st=>st.sourceRanges[0],
    seekPlay:(f,t)=>played.push([f,t]),stopPlan:()=>{},toast:()=>{},console});
  vm.runInContext(src,c);
  const stale=c.goStep(),fresh=c.goStep();
  resolve[1](verse);await fresh;
  resolve[0](verse);await stale;
  assert.deepEqual(played,[[0,154514]]);
  step.sourceRanges[0].t=null;c.AD_=chapter;
  const stopped=c.goStep();c.audioRequestId++;c.stepRequestId++;c.playing=false;
  resolve[2](verse);await stopped;
  assert.deepEqual(played,[[0,154514]]);
});

test('offline normal listening fails before an incomplete chapter verse is played',()=>{
  const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const start=html.indexOf('function normalVersePlanReady('),messages=[];
  const c=vm.createContext({navigator:{onLine:false},toast:message=>messages.push(message)});
  vm.runInContext(html.slice(start,html.indexOf('\n}',start)+2),c);
  assert.equal(c.normalVersePlanReady([{sourceRanges:[{verseSource:23}]}]),false);
  assert.equal(c.normalVersePlanReady([{sourceRanges:[{chapter:true,f:100,t:200}]}]),true);
  assert.equal(c.normalVersePlanReady([{f:100,t:200}]),true);
  assert.match(messages[0],/çevrimdışı/);
});

test('Husary 2:145 skips the duplicated next two verses in whole and cumulative plans',()=>{
  const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const start=html.indexOf('function normalVerseStep(');
  const chapter={ay:{144:[5960000,5976000],145:[5976160,6091565],146:[6094230,6124795]},
    verseRanges:{144:[5960000,5976160],145:[5976160,6094230],146:[6094230,6129780]}};
  const c=vm.createContext({SET:{reciter:12},curS:2,HUSARY_CHAPTER_GAPS:new Set(['2:145'])});
  const r=html.indexOf('function husaryNormalRanges(');
  vm.runInContext(html.slice(r,html.indexOf('\n}',r)+2),c);
  for(const name of ['hani139NormalRanges','verifiedNormalRanges']){
    const i=html.indexOf(`function ${name}(`);
    vm.runInContext(html.slice(i,html.indexOf('\n}',i)+2),c);
  }
  vm.runInContext(html.slice(start,html.indexOf('\n}',start)+2),c);
  const single=c.normalVerseStep(chapter,145,145,{x:2,ayEnd:145});
  assert.deepEqual(Array.from(single.sourceRanges,p=>[p.verseSource,p.f,p.t,p.fullVerse]),[[145,0,null,true]]);
  const cumulative=c.normalVerseStep(chapter,144,145,{x:2,ayEnd:145});
  assert.deepEqual(Array.from(cumulative.sourceRanges,part=>[part.chapter??false,part.verseSource??null,part.f,part.t]),
    [[true,null,5960000,5976000],[false,145,0,null]]);
  const fluent=c.normalVerseStep(chapter,145,146,{x:1});
  assert.deepEqual(Array.from(fluent.sourceRanges,part=>[part.chapter??false,part.verseSource??null,part.f,part.t]),
    [[false,145,0,null],[true,null,6094230,6124795]]);
  c.SET.reciter=3;
  assert.equal(c.normalVerseStep(chapter,145,145,{}).t,6091565);
});

test('Husary 2:145 full selection uses verified span; partial selection fails closed',async()=>{
  const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const start=html.indexOf('async function playSelection('),messages=[],plans=[];
  const chapter={ay:{145:[5976160,6091565]},verseRanges:{145:[5976160,6094230]}};
  const c=vm.createContext({SET:{reciter:12},curS:2,selA:0,selB:2,audioRequestId:0,
    selectedRange:[0,2],selRange:()=>c.selectedRange,
    wordArr:[{ay:145,pos:1},{ay:145,pos:2},{ay:145,pos:32}],ayGi:{145:[0,2]},
    HUSARY_CHAPTER_GAPS:new Set(['2:145']),HUSARY_WORD_REPAIRS:new Set(),normalChapterAudio:null,AD_:chapter,
    normalVerseStep:(audio,first,last,extra)=>({audio,first,last,...extra}),
    normalVersePlanReady:()=>true,runPlan:plan=>plans.push(plan),toast:msg=>messages.push(msg),console});
  vm.runInContext(html.slice(start,html.indexOf('\n}',start)+2),c);
  await c.playSelection();
  assert.equal(plans.length,1);
  assert.equal(plans[0][0].first,145);
  c.selectedRange=[0,1];
  await c.playSelection();
  assert.equal(plans.length,1);
  assert.match(messages[0],/bazı iç ses sınırları doğrulanmadı/);
});

test('Husary 2:145 source guard rejects a changed file or a cut into 2:146',()=>{
  const catalog=JSON.parse(fs.readFileSync(new URL('../assets/verified-verse-audio-r12.json',import.meta.url)));
  const row=catalog.rows['2:145'];
  assert.equal(row.segments.length,32);
  assert.equal(makeHusaryVerseTiming(row,145).verseEnds[145],61250);
  assert.throws(()=>validateHusaryVerseRow({...catalog,rows:{...catalog.rows,'2:145':{...row,playback_end_ms:67000}}},'2:145',32));
  assert.throws(()=>validateHusaryVerseRow({...catalog,rows:{...catalog.rows,'2:145':{...row,audio_sha256:'wrong'}}},'2:145',32));
});

test('2:145 browser byte guard rejects missing bytes and a same-size replacement',async()=>{
  const catalog=JSON.parse(fs.readFileSync(new URL('../assets/verified-verse-audio-r12.json',import.meta.url)));
  const row=catalog.rows['2:145'];
  await assert.rejects(verifyHusaryVerseBytes(row,new ArrayBuffer(row.file_size-1)),
    /HUSARY_VERSE_SOURCE_SIZE/);
  await assert.rejects(verifyHusaryVerseBytes(row,new ArrayBuffer(row.file_size)),
    /HUSARY_VERSE_SOURCE_HASH/);
});

test('Husary 2:145 split fails closed without its SHA-verified verse source',()=>{
  const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const start=html.indexOf('function computeParts(');
  const c=vm.createContext({AD_:null,SET:{reciter:12},curS:2,ayGi:{145:[0,2]},
    wordArr:[{ay:145,pos:1},{ay:145,pos:2},{ay:145,pos:3}]});
  vm.runInContext(html.slice(start,html.indexOf('\n}',start)+2),c);
  const parts=c.computeParts(145);
  assert.equal(parts.length,1);
  assert.equal(parts[0].unalignedCompleteVerse,true);
  assert.equal(parts[0].unsafeTiming,true);
  assert.equal(parts[0].f,null);
  assert.equal(parts[0].t,null);
});

test('2:145 exposes only four independently bracketed phrase cards on the verified source',()=>{
  const catalog=JSON.parse(fs.readFileSync(new URL('../assets/verified-verse-audio-r12.json',import.meta.url)));
  const row=catalog.rows['2:145'];
  const approved=makeHusary145PhraseRanges(row);
  assert.deepEqual(approved.map(p=>[p.fromWord,p.toWord,p.fromMs,p.toMs]),
    [[1,10,0,15465],[11,14,15465,27140],[15,19,27140,38665],[20,32,38665,61250]]);
  const qud=JSON.parse(fs.readFileSync(new URL('../review/husary-2145-qud-candidate.json',import.meta.url)));
  approved.forEach((p,i)=>{
    const segment=qud.response.segments[i];
    assert.equal(segment.ref_from,`2:145:${p.fromWord}`);
    assert.equal(segment.ref_to,`2:145:${p.toWord}`);
    if(i){assert.ok(p.fromMs>qud.response.segments[i-1].time_to*1000);
      assert.ok(p.fromMs<segment.time_from*1000);}
  });
  const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const start=html.indexOf('const QTEXT='),q=vm.createContext({});
  vm.runInContext(html.slice(start,html.indexOf('\n',start)),q);
  const QTEXT=vm.runInContext('QTEXT',q);
  const words=QTEXT[2][144][2].filter(w=>w[1]===0);
  const audio={...makeHusaryVerseTiming(row,145),recordingUrl:row.audio_url,
    verifiedHusary145:true,safePhraseRanges:approved,
    splitBuf:{ay:145,shift:-85,hi:61250}};
  const c=vm.createContext({AD_:audio,curS:2,splitAy:145,QTEXT,
    SET:{reciter:12,repOn:true,rep:3,cumu:true,startPad:0,endPad:-90},
    wordArr:words.map(([txt],gi)=>({txt,gi,ay:145,pos:gi+1,joinNext:false})),
    ayGi:{145:[0,31]},pieceCursor:0});
  for(const name of ['computeParts','partKey','partStep','buildPartsPlan','terminalMuallimTailEnd','splitBounds','stepBounds','stepReps']){
    const i=html.indexOf(`function ${name}(`);
    assert.ok(i>=0,name);
    vm.runInContext(html.slice(i,html.indexOf('\n}',i)+2),c);
  }
  c.splitParts=c.computeParts(145);
  assert.deepEqual(Array.from(c.splitParts,p=>[p.words[0].pos,p.words.at(-1).pos,p.f,p.t]),
    [[1,10,0,15465],[11,14,15465,27140],[15,19,27140,38665],[20,32,38665,61250]]);
  const plan=c.buildPartsPlan(0);
  assert.equal(plan.length,7); // Four cards and three cumulative 1..N repetitions.
  assert.deepEqual(Array.from(plan,st=>[st.part,st.combo,c.stepBounds(st).f,c.stepBounds(st).t,c.stepReps(st)]),
    [[0,false,0,15465,3],[1,false,15465,27140,3],[1,true,0,27140,3],
      [2,false,27140,38665,3],[2,true,0,38665,3],[3,false,38665,61250,3],[3,true,0,61250,3]]);
  assert.throws(()=>makeHusary145PhraseRanges({...row,audio_sha256:'wrong'}),/HUSARY_PHRASE_SOURCE/);
});

test('range memorization repeats complete verse sources, including cumulative 4:9–11',()=>{
  const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const extract=name=>{
    const start=html.indexOf(`function ${name}(`);
    assert.ok(start>=0,name);
    return html.slice(start,html.indexOf('\n}',start)+2);
  };
  const chapter={ay:{9:[200,300],10:[310,400],11:[410,500]},
    verseRanges:{9:[190,305],10:[305,405],11:[405,505]}};
  const c=vm.createContext({SET:{reciter:12,cumu:true},curS:4,AD_:chapter,
    normalChapterAudio:null,HUSARY_CHAPTER_GAPS:new Set(['4:9','4:10','4:11'])});
  for(const name of ['husaryNormalRanges','hani139NormalRanges','verifiedNormalRanges',
    'normalVerseStep','buildLadder'])vm.runInContext(extract(name),c);
  const plan=c.buildLadder(9,11);
  assert.equal(plan.length,5);
  assert.deepEqual(Array.from(plan,st=>Array.from(st.sourceRanges,part=>part.verseSource)),
    [[9],[10],[9,10],[11],[9,10,11]]);
  assert.ok(plan.every(st=>st.dyn&&st.x===1));
});

test('opening a different split verse restores chapter timing before computing parts',()=>{
  const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const start=html.indexOf('function openSplit(');
  const src=html.slice(start,html.indexOf('\n}',start)+2);
  const chapter={name:'chapter',sourceUrl:'https://example.test/chapter.mp3',verseRanges:{12:[1,2]}},verse={name:'other-verse'},observed=[];
  const elements=new Map();
  const c=vm.createContext({normalChapterAudio:chapter,AD_:verse,splitChapterAudio:null,
    splitVerseLoading:null,splitAy:null,splitSelIdx:null,splitParts:[],
    splitVisitId:0,pendingSplitPlay:null,tryStartPendingSplitPlay:()=>false,
    SET:{reciter:12},curS:4,HUSARY_SPLIT_VERSES:new Set(['4:11']),
    SURAHS:[null,null,null,{tr:'Nisâ'}],tr:()=> 'âyet',
    $:id=>{if(!elements.has(id))elements.set(id,{textContent:'',scrollTop:0,classList:{contains:()=>false,add(){},remove(){}}});return elements.get(id)},
    stopPlan:()=>{observed.push('stop');c.AD_=c.normalChapterAudio;c.normalChapterAudio=null},
    computeParts:()=>{observed.push(c.AD_.name);return []},
    show:()=>{},renderSplit:()=>{},syncRep2:()=>{},syncCumu2:()=>{},updateSplitIntro:()=>{},
    splitAudioReady:()=>true,ensureSplitAudio:async()=>{},playing:false});
  vm.runInContext(src,c);
  c.openSplit(12);
  assert.deepEqual(observed,['stop','chapter']);
  assert.equal(c.AD_,chapter);
});

test('a split opened before chapter audio loads shows no false single part and redraws on success',async()=>{
  const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const start=html.indexOf('function openSplit(');
  const src=html.slice(start,html.indexOf('\n}',start)+2);
  let resolveAudio,computations=0,rewires=0;
  const loading=new Promise(resolve=>{resolveAudio=resolve;});
  const elements=new Map();
  const c=vm.createContext({normalChapterAudio:null,AD_:{buffer:null,ay:{},ws:{}},splitChapterAudio:null,
    splitVerseLoading:null,splitAy:null,splitSelIdx:null,splitParts:[],playing:false,SET:{reciter:7},curS:2,
    splitVisitId:0,pendingSplitPlay:null,
    HUSARY_SPLIT_VERSES:new Set(),SURAHS:[null,{tr:'Bakara'}],tr:()=> 'âyet',
    $:id=>{if(!elements.has(id))elements.set(id,{textContent:'',scrollTop:0,
      classList:{contains:()=>true,add(){},remove(){}}});return elements.get(id)},
    stopPlan:()=>{},computeParts:()=>{computations++;return [{words:[{pos:1}]}];},
    getAudio:()=>loading,rewireTimings:()=>{rewires++;c.splitParts=c.computeParts(277);},
    show:()=>{},renderSplit:()=>{},syncRep2:()=>{},syncCumu2:()=>{},updateSplitIntro:()=>{}});
  vm.runInContext(src,c);
  c.openSplit(277);
  assert.equal(c.splitParts.length,0);
  assert.equal(computations,0);
  assert.match(elements.get('splitPlayStatus').textContent,/yükleniyor/);
  const audio={sourceUrl:'https://example.test/chapter.mp3',verseRanges:{277:[100,200]}};
  resolveAudio(audio);await loading;await Promise.resolve();
  assert.equal(c.AD_,audio);
  assert.equal(rewires,1);
  assert.equal(c.splitParts.length,1);
});
