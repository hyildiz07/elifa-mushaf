import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function workerHarness(worker='sw.js',{fail=null,htmlFallback=null,versionOverride=null}={}){
  const events={},deleted=[],stores=new Map([['elifa-audio-v1',new Map()],['elifa-mushaf-v224-loopfix',new Map()],['another-app-cache',new Map()]]);
  let claimed=false;
  const requestUrl=r=>r.url||new URL(r,'https://app.test/sw.js').href;
  const response=(url)=>({url,served:'network',ok:true,status:200,type:'basic',redirected:false,headers:{get:()=>url===htmlFallback?'text/html':url.endsWith('.html')?'text/html':'application/javascript'},clone:()=>response(url)});
  const c=vm.createContext({Request,URL,fetch:async req=>{if(fail&&req.url.includes(fail))throw Error('network');return response(req.url);},
    self:{location:{href:'https://app.test/sw.js'},addEventListener:(name,fn)=>events[name]=fn,clients:{claim:async()=>{claimed=true;}}},
    caches:{open:async name=>{if(!stores.has(name))stores.set(name,new Map());const m=stores.get(name);return {put:async(r,v)=>m.set(requestUrl(r),v),match:async r=>m.get(requestUrl(r))};},match:async r=>{for(const store of stores.values()){const found=store.get(requestUrl(r));if(found)return found;}},keys:async()=>[...stores.keys()],delete:async key=>{deleted.push(key);return stores.delete(key);}}});
  c.importScripts=()=>vm.runInContext(fs.readFileSync('sw.js','utf8'),c);
  const workerCode=fs.readFileSync(worker,'utf8');
  vm.runInContext(versionOverride?workerCode.replace(/const VERSION = '[^']+'/,`const VERSION = '${versionOverride}'`):workerCode,c);
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
const repeatAssets=[['study-workflow.css','355'],['study-workflow.js','360'],['workflow-i18n.js','358'],['study-split.js','360']];
function readerAssetUrls(){
  const html=fs.readFileSync('index.html','utf8');
  return repeatAssets.map(([name,oldVersion])=>{
    const path='/assets/'+name;
    const urls=[...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(match=>new URL(match[1],'https://app.test/')).filter(url=>url.pathname===path);
    assert.equal(urls.length,1,name+' has one explicit reader asset URL');
    assert.notEqual(urls[0].searchParams.get('v'),oldVersion,name+' must not reuse the previous release cache key');
    assert.ok(Number(urls[0].searchParams.get('v'))>=365,name+' includes the repeat-menu cache repair');
    return urls[0].href;
  });
}
test('reader repeat assets use matching new URLs in HTML and the required offline shell',()=>{
  const urls=readerAssetUrls(),h=workerHarness();
  const core=vm.runInContext('CORE.map(path=>new URL(path,self.location.href).href)',h.c);
  const required=vm.runInContext('REQUIRED.map(path=>new URL(path,self.location.href).href)',h.c);
  assert.equal(new Set(urls.map(url=>new URL(url).search)).size,1,'the related reader assets advance together');
  for(const url of urls){assert.ok(core.includes(url),url+' is preloaded');assert.ok(required.includes(url),url+' is required before activation');}
});
test('new reader HTML bypasses v363 cached workflow CSS and scripts before the new worker activates',async()=>{
  const oldVersion='elifa-mushaf-v363-old-shell',h=workerHarness('sw.js',{versionOverride:oldVersion});
  const oldUrls=repeatAssets.map(([name,version])=>`https://app.test/assets/${name}?v=${version}`);
  h.stores.set(oldVersion,new Map(oldUrls.map(url=>[url,{url,served:'old shell'}])));
  const network=h.c.fetch,requested=[];
  h.c.fetch=async req=>{requested.push(req.url);if(oldUrls.includes(req.url))throw Error('old asset unavailable');return network(req);};
  const navigation=await h.fetch({method:'GET',mode:'navigate',url:'https://app.test/'});
  assert.equal(navigation.served,'network','new HTML can arrive while the previous worker still controls the page');
  for(const url of oldUrls)assert.equal((await h.fetch({method:'GET',mode:'cors',url})).served,'old shell','unchanged URLs reproduce the stale-asset failure');
  for(const url of readerAssetUrls()){
    const asset=await h.fetch({method:'GET',mode:'cors',url});
    assert.equal(asset.served,'network');assert.equal(asset.url,url);assert.ok(requested.includes(url));
  }
  assert.equal(h.claimed(),false,'the repair works before any new worker is installed or activated');
  assert.deepEqual(h.deleted,[],'reading the update preserves existing offline and audio data');
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
