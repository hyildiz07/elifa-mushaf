import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {afasyWordAudioMeta} from '../assets/mp3quran-reciter.js';
const html=fs.readFileSync('index.html','utf8'),pack=JSON.parse(fs.readFileSync('assets/afasy-mp3quran-word-timings.json'));
const qtext=JSON.parse(html.match(/^const QTEXT=(.*);$/m)[1]);
function fn(name){const p=html.search(new RegExp('(?:async )?function '+name+'\\('));assert.ok(p>=0,name);return html.slice(p,html.indexOf('\n}',p)+2);}
function loader(sid=1,rid=223,offline=false){
 const meta=afasyWordAudioMeta(sid,pack,qtext[sid].map(v=>v[2].filter(w=>w[1]===0).length));let fetches=0,decodes=0;
 const c=vm.createContext({Response,Uint8Array,URL:{createObjectURL:()=> 'blob:same-source'},console,QTEXT:qtext,audioCacheGeneration:{},audioCache:{},
  OFF:{getMeta:async()=>offline?meta:null,getBlob:async()=>new Blob([new Uint8Array(10)]),variant:()=>''},
  fetchAudioMeta:async()=>meta,applyVerifiedTimings:async a=>a,pp(){},Audio:class{},
  fetch:async()=>{fetches++;return new Response(new Uint8Array(10));},
  ac:()=>({decodeAudioData:async()=>{decodes++;return {duration:52};}}),computeWordCuts:()=>({})});
 for(const name of ['smallChapterBytes','loadAudio'])vm.runInContext(fn(name),c);
 return {c,load:()=>c.loadAudio(rid,sid),fetches:()=>fetches,decodes:()=>decodes};
}
test('Fatiha without provider file_size prepares same-source PCM online and offline',async()=>{
 for(const offline of [false,true]){const f=loader(1,223,offline),a=await f.load();
  assert.equal(a.exactChapter,true);assert.ok(a.decodePromise);await a.decodePromise;
  assert.ok(a.buffer);assert.equal(f.decodes(),1);assert.equal(f.fetches(),offline?0:1);
  assert.equal(a.recordingUrl,'https://cdn.mp3quran.net/audio/mishary-alafasy/r1/001.mp3');
 }
});
test('long Afasy chapters and other reciters do not acquire whole-chapter PCM downloads',async()=>{
 for(const [sid,rid] of [[2,223],[1,7]]){const f=loader(sid,rid),a=await f.load();assert.equal(a.exactChapter,false);assert.equal(a.decodePromise,null);assert.equal(f.fetches(),0);}
});
test('the unknown-size fallback stops at its byte cap even without Content-Length',async()=>{
 const c=vm.createContext({Uint8Array});vm.runInContext(fn('smallChapterBytes'),c);
 await assert.rejects(c.smallChapterBytes(new Response(new Uint8Array(11)),10),/CHAPTER_AUDIO_SIZE/);
 await assert.rejects(c.smallChapterBytes(new Response(new Uint8Array(1),{headers:{'Content-Length':'11'}}),10),/CHAPTER_AUDIO_SIZE/);
 assert.equal((await c.smallChapterBytes(new Response(new Uint8Array(10)),10)).byteLength,10);
});
function scheduler(){let resolve,started=0,stopped=0;const chapter={audio:{},exactChapter:true,buffer:null};
 chapter.decodePromise=new Promise(r=>{resolve=()=>{chapter.buffer={duration:52};r();};});
 const st={f:6360,t:17720,ayEnd:2,repeatKind:'combine'},c=vm.createContext({console:{warn(){}},
  SET:{reciter:223},curS:1,AD_:chapter,normalChapterAudio:chapter,plan:[st],pi:0,pieceCursor:0,
  playing:true,audioRequestId:0,stepRequestId:0,ac:()=>({state:'running'}),
  stepBounds:s=>({f:s.f,t:s.t}),seekPlay(){started++;},stopPlan(){stopped++;c.playing=false;},toast(){}});
 vm.runInContext(fn('goStep'),c);return {c,chapter,resolve,started:()=>started,stopped:()=>stopped};
}
test('combined Fatiha waits for precise PCM instead of entering timer-stopped HTMLAudio',async()=>{
 const f=scheduler(),pending=f.c.goStep();assert.equal(f.started(),0);f.resolve();await pending;assert.equal(f.started(),1);assert.equal(f.stopped(),0);
});
test('stopping or changing the program while PCM loads cannot start stale audio',async()=>{
 for(const change of ['stop','step']){const f=scheduler(),pending=f.c.goStep();
  if(change==='stop'){f.c.playing=false;f.c.audioRequestId++;}else f.c.stepRequestId++;
  f.resolve();await pending;assert.equal(f.started(),0);
 }
});
test('failed precise decoding cannot silently fall back to the leaking stream path',async()=>{
 const f=scheduler();f.chapter.decodePromise=Promise.resolve();await f.c.goStep();assert.equal(f.started(),0);assert.equal(f.stopped(),1);
});
