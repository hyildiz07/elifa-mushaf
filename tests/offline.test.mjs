import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

for(const worker of ['sw.js','service-worker.js'])test(`${worker}: update preserves downloaded audio`,async()=>{
  const events={},deleted=[],version=JSON.parse(fs.readFileSync('version.json')).version;
  const c=vm.createContext({self:{addEventListener:(name,fn)=>events[name]=fn,clients:{claim:async()=>{},matchAll:async()=>[]},registration:{unregister:async()=>{}},skipWaiting(){}},
    caches:{keys:async()=>['elifa-audio-v1','elifa-mushaf-v224-loopfix',version,'another-app-cache'],delete:async k=>deleted.push(k)}});
  vm.runInContext(fs.readFileSync(worker,'utf8'),c);let done;events.activate({waitUntil:p=>done=p});await done;
  assert.ok(deleted.includes('elifa-mushaf-v224-loopfix'));
  assert.ok(!deleted.includes('elifa-audio-v1'));assert.ok(!deleted.includes('another-app-cache'));
  if(worker==='sw.js')assert.ok(!deleted.includes(version));
});
test('HTML refresh migration preserves offline audio',async()=>{
  const h=fs.readFileSync('index.html','utf8');
  const start=h.indexOf('  function _forceSwRefresh()'),end=h.indexOf("  window.addEventListener('load'",start);
  const deleted=[],data={};
  const c=vm.createContext({window:{},SW_FRESH_KEY:'test',SW_CACHE_EXPECTED:'elifa-mushaf-v225-audio',_elifaBusy:()=>false,
    localStorage:{getItem:k=>data[k],setItem:(k,v)=>data[k]=v},
    navigator:{serviceWorker:{getRegistrations:async()=>[]}},console:{log(){}},
    caches:{keys:async()=>['elifa-audio-v1','elifa-mushaf-v224-loopfix'],delete:async k=>deleted.push(k)}});
  c.window.caches=c.caches;
  vm.runInContext(h.slice(start,end),c);assert.equal(await c._forceSwRefresh(),true);
  assert.deepEqual(deleted,['elifa-mushaf-v224-loopfix']);
});
test('app, worker and release manifest versions agree',()=>{
  const v=JSON.parse(fs.readFileSync('version.json')).version;
  assert.ok(fs.readFileSync('sw.js','utf8').includes(`const VERSION = '${v}'`));
  assert.ok(fs.readFileSync('index.html','utf8').includes(`var SW_CACHE_EXPECTED = '${v}'`));
});
test('downloaded current chapter becomes the next playback source without interrupting playback or split view',async()=>{
  const html=fs.readFileSync('index.html','utf8');
  const start=html.indexOf('let pendingOfflineAudioRefresh=null,splitPreparationRequest=null;');
  const end=html.indexOf('async function loadAudio(',start);
  assert.ok(start>0&&end>start);
  const old={sourceUrl:'https://example.test/chapter.mp3'};
  const offline={sourceUrl:'blob:offline',offlineBlob:{}};
  let rewires=0;
  const ctx=vm.createContext({playing:true,curS:2,SET:{reciter:3},
    audioCacheGeneration:{'3:2':1},AD_:old,splitChapterAudio:null,
    getAudio:async()=>offline,rewireTimings:()=>{rewires++;},console});
  vm.runInContext(html.slice(start,end),ctx);
  vm.runInContext('activateDownloadedChapterAudio(3,2)',ctx);
  assert.equal(ctx.AD_,old);
  assert.equal(rewires,0);
  await vm.runInContext('pendingOfflineAudioRefresh.loading',ctx);
  await new Promise(resolve=>setImmediate(resolve));
  ctx.playing=false;
  const refresh=vm.runInContext('refreshDownloadedChapterAudio()',ctx);
  assert.equal(ctx.AD_,offline);
  await refresh;
  assert.equal(ctx.AD_,offline);
  assert.equal(rewires,1);

  const verse={sourceUrl:'blob:verified-verse'};
  ctx.AD_=verse;ctx.splitChapterAudio=old;
  ctx.audioCacheGeneration['3:2']=2;
  vm.runInContext('activateDownloadedChapterAudio(3,2)',ctx);
  await vm.runInContext('refreshDownloadedChapterAudio()',ctx);
  assert.equal(ctx.AD_,verse);
  assert.equal(ctx.splitChapterAudio,offline);
  assert.equal(rewires,1);
});

test('downloaded source waits for an in-flight split preparation and its playback',async()=>{
  const html=fs.readFileSync('index.html','utf8');
  const start=html.indexOf('let pendingOfflineAudioRefresh=null,splitPreparationRequest=null;');
  const end=html.indexOf('async function loadAudio(',start);
  const chapter={sourceUrl:'https://example.test/chapter.mp3'};
  const downloaded={sourceUrl:'blob:downloaded'};
  let rewires=0;
  const ctx=vm.createContext({playing:false,curS:2,SET:{reciter:3},
    audioCacheGeneration:{'3:2':1},AD_:chapter,splitChapterAudio:null,
    getAudio:async()=>downloaded,rewireTimings:()=>{rewires++;},console});
  vm.runInContext(html.slice(start,end),ctx);
  vm.runInContext('splitPreparationRequest=7;activateDownloadedChapterAudio(3,2)',ctx);
  await vm.runInContext('pendingOfflineAudioRefresh.loading',ctx);
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(ctx.AD_,chapter,'the split tap keeps the source it is preparing');

  vm.runInContext('splitPreparationRequest=null;playing=true',ctx);
  await vm.runInContext('refreshDownloadedChapterAudio()',ctx);
  assert.equal(ctx.AD_,chapter,'playback keeps the source used to build its plan');

  ctx.playing=false;
  await vm.runInContext('refreshDownloadedChapterAudio()',ctx);
  assert.equal(ctx.AD_,downloaded);
  assert.equal(rewires,1);
});
