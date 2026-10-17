import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function workerHarness(worker='sw.js',{fail=null,htmlFallback=null}={}){
  const events={},deleted=[],stores=new Map([['elifa-audio-v1',new Map()],['elifa-mushaf-v224-loopfix',new Map()],['another-app-cache',new Map()]]);
  let claimed=false;
  const response=(url)=>({ok:true,status:200,type:'basic',redirected:false,headers:{get:()=>url===htmlFallback?'text/html':url.endsWith('.html')?'text/html':'application/javascript'}});
  const c=vm.createContext({Request,URL,fetch:async req=>{if(fail&&req.url.includes(fail))throw Error('network');return response(req.url);},
    self:{location:{href:'https://app.test/sw.js'},addEventListener:(name,fn)=>events[name]=fn,clients:{claim:async()=>{claimed=true;}}},
    caches:{open:async name=>{if(!stores.has(name))stores.set(name,new Map());const m=stores.get(name),url=r=>r.url||new URL(r,'https://app.test/sw.js').href;return {put:async(r,v)=>m.set(url(r),v),match:async r=>m.get(url(r))};},keys:async()=>[...stores.keys()],delete:async key=>{deleted.push(key);return stores.delete(key);}}});
  c.importScripts=()=>vm.runInContext(fs.readFileSync('sw.js','utf8'),c);
  vm.runInContext(fs.readFileSync(worker,'utf8'),c);
  c.self.location.origin='https://app.test';
  return {c,deleted,stores,claimed:()=>claimed,run:async type=>{let p;events[type]({waitUntil:value=>p=value});return p;},fetch:async request=>{let p;events.fetch({request,respondWith:value=>p=value});return p;}};
}
test('online navigation cannot replace the installed offline shell before a complete update',async()=>{
 const h=workerHarness();await h.run('install');await h.run('activate');
 const cache=h.stores.get(JSON.parse(fs.readFileSync('version.json')).version),old=cache.get('https://app.test/index.html');
 h.c.fetch=async()=>({ok:true,status:200,type:'basic',newRelease:true});
 await h.fetch({method:'GET',mode:'navigate',url:'https://app.test/'});
 assert.equal(cache.get('https://app.test/index.html'),old);
 h.c.fetch=async()=>{throw Error('offline');};
 assert.equal(await h.fetch({method:'GET',mode:'navigate',url:'https://app.test/'}),old);
});
for(const worker of ['sw.js','service-worker.js'])test(worker+': only a complete replacement can delete the old shell',async()=>{
  const h=workerHarness(worker);await h.run('install');await h.run('activate');
  assert.deepEqual(h.deleted,['elifa-mushaf-v224-loopfix']);assert.ok(h.stores.has('elifa-audio-v1'));assert.ok(h.claimed());
});
test('a failed shell download preserves the old worker cache',async()=>{
  const h=workerHarness('sw.js',{fail:'index.html'});await assert.rejects(h.run('install'),/incomplete/);
  assert.ok(h.stores.has('elifa-mushaf-v224-loopfix'));assert.ok(h.stores.has('elifa-audio-v1'));assert.equal(h.claimed(),false);
});
test('a missing script served as HTML cannot become a valid offline update',async()=>{
  const h=workerHarness('sw.js',{htmlFallback:'https://app.test/assets/locale.js?v=2'});
  await assert.rejects(h.run('install'),/incomplete/);assert.ok(h.stores.has('elifa-mushaf-v224-loopfix'));
});
test('an optional help page failure does not invalidate a complete shell',async()=>{
  const h=workerHarness('sw.js',{fail:'/destek/'});await h.run('install');await h.run('activate');assert.ok(h.claimed());
});
test('refresh requests an update without deleting caches, unregistering, or forcing reload',async()=>{
  const h=fs.readFileSync('index.html','utf8'),start=h.indexOf('  function _forceSwRefresh()'),end=h.indexOf("  window.addEventListener('load'",start);let updates=0;
  const c=vm.createContext({navigator:{serviceWorker:{getRegistrations:async()=>[{update:async()=>{updates++;},unregister:()=>assert.fail('must preserve active worker')}]}}});
  vm.runInContext(h.slice(start,end),c);assert.equal(await c._forceSwRefresh(),false);assert.equal(updates,1);
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
