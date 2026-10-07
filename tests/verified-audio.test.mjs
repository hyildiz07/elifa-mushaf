import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const begin=html.indexOf('const VERIFIED_AUDIO_SLUGS='),end=html.indexOf('/* Meal/Tefsir çevrimdışı',begin);
assert.ok(begin>=0&&end>begin);
function appContext(extra={}){
  const c=vm.createContext({Blob,Response,AbortSignal,console,navigator:{onLine:true},window:{caches:true},
    audioTimingUnverified:()=>false,...extra});
  vm.runInContext(html.slice(begin,end),c);
  return {c,OFF:vm.runInContext('OFF',c)};
}

test('every selected hoca–sûre pair has exactly one source-matched timing asset',()=>{
  const {c}=appContext();
  const files=new Set(fs.readdirSync(new URL('../assets/verified-audio/',import.meta.url)));
  let expected=0;
  for(const rid of [1,2,4,6,7,9,10,97])for(let sid=1;sid<=114;sid++){
    const selected=c.verifiedAudioChapter(rid,sid),file=`${rid}-${sid}.json`;
    assert.equal(files.has(file),selected,file);
    if(selected)expected++;
  }
  assert.equal(expected,909);
  assert.equal(files.size,909);
  assert.equal(c.verifiedAudioChapter(3,2),false);
  assert.equal(c.verifiedAudioChapter(12,4),false);
});

test('a new recording keeps its audio and timing cache separate from the old recording',async()=>{
  const saved=new Map(),blobs=new Map();
  const cache={match:async key=>blobs.get(key),put:async(key,response)=>{blobs.set(key,response);},delete:async key=>blobs.delete(key)};
  const meta={audio_url:'https://example.test/new.mp3',source_recording:'abu_bakr_al_shatri_tarteel',verse_timings:[]};
  const {c,OFF}=appContext({caches:{open:async()=>cache},fetch:async()=>new Response(new Uint8Array([1,2,3]),
    {status:200,headers:{'Content-Length':'3'}})});
  OFF.metaGet=async key=>saved.get(key)||null;
  OFF.metaSet=async(key,value)=>{saved.set(key,value);return true;};
  OFF.metaDel=async key=>saved.delete(key);
  saved.set('seg:4:2',{audio_url:'https://example.test/old.mp3'});
  blobs.set(OFF.audioUrlKey(4,2,'legacy'),new Response(new Uint8Array([9])));
  c.testMeta=meta;
  vm.runInContext('fetchAudioMeta=async()=>testMeta',c);
  assert.equal(await OFF.getMeta(4,2),null,'old MP3 must not provide new timing metadata');
  assert.equal((await OFF.getMeta(4,2,'legacy')).audio_url,'https://example.test/old.mp3');
  await OFF.download(4,2);
  assert.equal((await OFF.getMeta(4,2)).audio_url,meta.audio_url);
  assert.ok((await OFF.getMeta(4,2)).offline_cache_id,'new download has a stable per-blob PCM cache identity');
  assert.equal((await OFF.getBlob(4,2)).size,3);
  assert.equal((await OFF.getBlob(4,2,'legacy')).size,1,'old offline recording stays intact');
  assert.equal(await OFF.isDownloaded(4,2),true);
});

test('failed audio download cannot leave a false downloaded timing entry',async()=>{
  const saved=new Map();
  const {c,OFF}=appContext({fetch:async()=>{throw Error('network failed');}});
  OFF.metaGet=async key=>saved.get(key)||null;
  OFF.metaSet=async(key,value)=>{saved.set(key,value);return true;};
  c.testMeta={audio_url:'https://example.test/fail.mp3',source_recording:'abu_bakr_al_shatri_tarteel'};
  vm.runInContext('fetchAudioMeta=async()=>testMeta',c);
  await assert.rejects(OFF.download(4,2));
  assert.equal(saved.size,0);
});

test('truncated audio response is not saved as an offline chapter',async()=>{
  const saved=new Map(),blobs=new Map();
  const cache={put:async(key,response)=>{blobs.set(key,response);},delete:async key=>blobs.delete(key)};
  const {c,OFF}=appContext({caches:{open:async()=>cache},fetch:async()=>new Response(new Uint8Array([1,2,3]),
    {status:200,headers:{'Content-Length':'4'}})});
  OFF.metaGet=async key=>saved.get(key)||null;
  OFF.metaSet=async(key,value)=>{saved.set(key,value);return true;};
  c.testMeta={audio_url:'https://example.test/short.mp3',source_recording:'abu_bakr_al_shatri_tarteel'};
  vm.runInContext('fetchAudioMeta=async()=>testMeta',c);
  await assert.rejects(OFF.download(4,2),/Ses dosyası eksik indirildi/);
  assert.equal(saved.size,0);
  assert.equal(blobs.size,0);
});

test('failed metadata storage removes the matching MP3 cache entry',async()=>{
  const blobs=new Map(),cache={match:async key=>blobs.get(key),
    put:async(key,response)=>{blobs.set(key,response);},delete:async key=>blobs.delete(key)};
  const {c,OFF}=appContext({caches:{open:async()=>cache},fetch:async()=>new Response(new Uint8Array([1,2,3]),
    {status:200,headers:{'Content-Length':'3'}})});
  OFF.metaSet=async()=>false;
  c.testMeta={audio_url:'https://example.test/new.mp3',source_recording:'abu_bakr_al_shatri_tarteel'};
  vm.runInContext('fetchAudioMeta=async()=>testMeta',c);
  await assert.rejects(OFF.download(4,2),/çevrimdışı kaydedilemedi/);
  assert.equal(blobs.size,0);
});

test('metadata storage succeeds only after its IndexedDB transaction commits',async()=>{
  const {OFF}=appContext();
  let tx,request;
  let entered;
  const writing=()=>new Promise(resolve=>{entered=resolve;});
  OFF.openDB=async()=>({transaction:()=>{
    tx={objectStore:()=>({put:()=>{request={};entered();return request;}})};
    return tx;
  }});
  let started=writing();
  const aborted=OFF.metaSet('segqua:4:2',{audio_url:'https://example.test/audio.mp3'});
  await started;
  request.onsuccess?.();
  tx.onabort();
  assert.equal(await aborted,false,'a successful put request can still roll back');

  started=writing();
  const committed=OFF.metaSet('segqua:4:2',{audio_url:'https://example.test/audio.mp3'});
  await started;
  request.onsuccess?.();
  tx.oncomplete();
  assert.equal(await committed,true);

  OFF.openDB=async()=>({transaction:()=>{throw Error('storage unavailable');}});
  assert.equal(await OFF.metaSet('segqua:4:2',{}),false);
});

test('download list excludes metadata whose MP3 was evicted so it can be downloaded again',async()=>{
  const saved=new Map(),blobs=new Map();
  const cache={match:async key=>blobs.get(key)};
  const {OFF}=appContext({caches:{open:async()=>cache}});
  for(const sid of [2,3])saved.set(OFF.metaKey(4,sid),{
    source_recording:'abu_bakr_al_shatri_tarteel',offline_cache_id:'cache-'+sid,
    offline_cache_version:2,audio_url:'https://example.test/'+sid+'.mp3'});
  blobs.set(OFF.blobKey(4,2,OFF.variant(4,2),saved.get(OFF.metaKey(4,2))),
    new Response(new Uint8Array([1,2,3])));
  OFF.metaGet=async key=>saved.get(key)||null;
  OFF.openDB=async()=>({transaction:()=>({objectStore:()=>({getAllKeys:()=>{
    const request={};queueMicrotask(()=>{request.result=[...saved.keys()];request.onsuccess();});
    return request;
  }})})});
  assert.deepEqual(Array.from(await OFF.downloadedList(4)),[2]);
  assert.equal(await OFF.isDownloaded(4,3),false);
});

test('re-download never pairs old timing metadata with replacement MP3 bytes',async()=>{
  const saved=new Map(),blobs=new Map();
  const cache={match:async key=>blobs.get(key),put:async(key,response)=>{blobs.set(key,response);},
    delete:async key=>blobs.delete(key)};
  const source='abu_bakr_al_shatri_tarteel';
  const oldMeta={audio_url:'https://example.test/old.mp3',source_recording:source,
    offline_cache_id:'old-pcm-id',verse_timings:[]};
  const {c,OFF}=appContext({caches:{open:async()=>cache},fetch:async()=>new Response(new Uint8Array([1,2,3]),
    {status:200,headers:{'Content-Length':'3'}})});
  const metaKey=OFF.metaKey(4,2),oldKey=OFF.audioUrlKey(4,2);
  saved.set(metaKey,oldMeta);
  blobs.set(oldKey,new Response(new Uint8Array([9])));
  OFF.metaGet=async key=>saved.get(key)||null;
  let entered,release;
  const atCommit=new Promise(resolve=>entered=resolve),commitGate=new Promise(resolve=>release=resolve);
  OFF.metaSet=async(key,value)=>{entered();await commitGate;saved.set(key,value);return true;};
  c.testMeta={audio_url:'https://example.test/new.mp3',source_recording:source,verse_timings:[]};
  vm.runInContext('fetchAudioMeta=async()=>testMeta',c);
  const downloading=OFF.download(4,2);
  await atCommit;
  const previous=await OFF.getMeta(4,2);
  assert.equal(previous.audio_url,oldMeta.audio_url);
  assert.deepEqual(new Uint8Array(await (await OFF.getBlob(4,2,OFF.variant(4,2),previous)).arrayBuffer()),
    new Uint8Array([9]),'in-flight reader keeps the old source');
  assert.equal(await OFF.isDownloaded(4,2),true);
  release();await downloading;
  const current=await OFF.getMeta(4,2);
  assert.equal(current.offline_cache_version,2);
  assert.notEqual(OFF.blobKey(4,2,OFF.variant(4,2),current),oldKey);
  assert.deepEqual(new Uint8Array(await (await OFF.getBlob(4,2,OFF.variant(4,2),current)).arrayBuffer()),
    new Uint8Array([1,2,3]));
  assert.equal(blobs.has(oldKey),true,'old key stays available to in-flight readers');
});

test('failed re-download preserves the previous playable audio and timing',async()=>{
  const saved=new Map(),blobs=new Map();
  const cache={match:async key=>blobs.get(key),put:async(key,response)=>{blobs.set(key,response);},
    delete:async key=>blobs.delete(key)};
  const {c,OFF}=appContext({caches:{open:async()=>cache},fetch:async()=>new Response(new Uint8Array([1,2,3]),
    {status:200,headers:{'Content-Length':'3'}})});
  const oldMeta={audio_url:'https://example.test/old.mp3',source_recording:'abu_bakr_al_shatri_tarteel',
    verse_timings:[]};
  saved.set(OFF.metaKey(4,2),oldMeta);
  const oldKey=OFF.audioUrlKey(4,2);
  blobs.set(oldKey,new Response(new Uint8Array([9])));
  OFF.metaGet=async key=>saved.get(key)||null;
  OFF.metaSet=async()=>false;
  c.testMeta={audio_url:'https://example.test/new.mp3',source_recording:'abu_bakr_al_shatri_tarteel',
    verse_timings:[]};
  vm.runInContext('fetchAudioMeta=async()=>testMeta',c);
  await assert.rejects(OFF.download(4,2),/çevrimdışı kaydedilemedi/);
  assert.equal((await OFF.getMeta(4,2)).audio_url,oldMeta.audio_url);
  assert.deepEqual(new Uint8Array(await (await OFF.getBlob(4,2)).arrayBuffer()),new Uint8Array([9]));
  assert.equal(blobs.size,1);
});

test('versioned metadata snapshots select their own blobs and remove cleans old and new keys',async()=>{
  const saved=new Map(),blobs=new Map(),keyOf=key=>typeof key==='string'?key:key.url;
  const cache={match:async key=>blobs.get(keyOf(key)),
    delete:async key=>blobs.delete(keyOf(key)),
    keys:async()=>[...blobs.keys()].map(url=>({url}))};
  const {OFF}=appContext({caches:{open:async()=>cache}});
  const variant=OFF.variant(4,2),metaKey=OFF.metaKey(4,2);
  const old={source_recording:'abu_bakr_al_shatri_tarteel',offline_cache_id:'old-id',
    offline_cache_version:2};
  const current={source_recording:'abu_bakr_al_shatri_tarteel',offline_cache_id:'new-id',
    offline_cache_version:2};
  const legacy={audio_url:'https://example.test/legacy.mp3'};
  saved.set(metaKey,current);saved.set(OFF.metaKey(4,2,'legacy'),legacy);
  OFF.metaGet=async key=>saved.get(key)||null;
  OFF.metaDel=async key=>{saved.delete(key);return true;};
  blobs.set(OFF.blobKey(4,2,variant,old),new Response(new Uint8Array([1])));
  blobs.set(OFF.blobKey(4,2,variant,current),new Response(new Uint8Array([2])));
  blobs.set(OFF.audioUrlKey(4,2,'legacy'),new Response(new Uint8Array([3])));
  const snapshot=await OFF.getBlob(4,2,variant,old);
  assert.deepEqual(new Uint8Array(await snapshot.arrayBuffer()),new Uint8Array([1]));
  const latest=await OFF.getBlob(4,2);
  assert.deepEqual(new Uint8Array(await latest.arrayBuffer()),new Uint8Array([2]));
  assert.equal(await OFF.remove(4,2),true);
  assert.equal(blobs.size,0);
  assert.equal(saved.size,0);
});
