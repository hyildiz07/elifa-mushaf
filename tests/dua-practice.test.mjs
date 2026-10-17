import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {PrayerPlayer,pcmExcerptWav,restorePrayerState,validExcerpt} from '../src/dua-practice-core.mjs';
import {prayerLocales,prayerLabels,prayerCopy} from '../src/dua-copy.mjs';
import {prayerCatalog} from '../src/dua-catalog.mjs';
const html=fs.readFileSync('index.html','utf8'),at=html.indexOf('var NAMAZ=['),end=html.indexOf('\n  ];',at)+6;
const texts=vm.runInNewContext(html.slice(at,end)+';NAMAZ'),catalog=prayerCatalog(texts);

test('prayer recordings retain exact source bytes, and unavailable prayers never acquire a misleading voice',()=>{
  const recordings=catalog.filter(x=>x.recording);assert.equal(recordings.length,7);
  for(const item of recordings){const r=item.recording,bytes=fs.readFileSync('.'+r.path);assert.equal(bytes.length,r.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),r.sha256);assert.ok(r.source.startsWith('https://namaz.diyanet.gov.tr/namaz/assets/audio/dualar/'));}
  for(const id of ['istigfar','kuran-baslama','yemek','amentü'])assert.equal(catalog.find(x=>x.id===id).recording,undefined);
  assert.deepEqual(catalog.find(x=>x.id==='kunut').namaz,[4,5]);
  assert.ok(catalog.find(x=>x.id==='kunut').ar.includes(texts[5].ar),'a combined recording is accompanied by both prayers');
  const sw=fs.readFileSync('sw.js','utf8');const core=sw.slice(sw.indexOf('const CORE'),sw.indexOf('for(const language'));
  assert.ok(!core.includes('.mp3'),'no prayer audio is downloaded with the app shell');
  assert.ok(sw.includes("url.pathname.startsWith('/assets/dua-audio/')"),'generic SW caching cannot bypass explicit prayer download controls');
});

test('prayer audio excerpts include only their selected PCM samples and retain source sample rate',()=>{
  const samples=Float32Array.from({length:100},(_,i)=>i<50?0.2:0.9);
  const buffer={duration:1,length:100,sampleRate:100,numberOfChannels:1,getChannelData:()=>samples};
  const wav=pcmExcerptWav(buffer,{start:0.1,end:0.5}),view=new DataView(wav);
  assert.equal(view.getUint32(24,true),100);assert.equal(view.getUint32(40,true),80);
  for(let i=44;i<wav.byteLength;i+=2)assert.ok(view.getInt16(i,true)<7000,'the louder following phrase is absent');
  assert.throws(()=>pcmExcerptWav(buffer,{start:0.9,end:1.5}));assert.equal(validExcerpt({start:0,end:0.1},1),false);
});

function harness(){
  const states=[],jobs=[];let plays=0;
  const audio={currentTime:0,pause(){},async play(){plays++;}};
  const player=new PrayerPlayer({audio,prepare:async()=>'/exact-source',schedule:fn=>{jobs.push(fn);return jobs.length;},unschedule:id=>{jobs[id-1]=null;},onState:(state,data)=>states.push([state,data])});
  return {audio,player,states,jobs,get plays(){return plays;}};
}
test('a prayer plays the complete chosen recording three times, waits independently and then stops',async()=>{
  const h=harness();await h.player.play(null,{repeat:3,speed:1.25,wait:2});assert.equal(h.plays,1);assert.equal(h.audio.playbackRate,1.25);assert.equal(h.audio.preservesPitch,true);
  for(let i=0;i<2;i++){h.audio.onended();assert.equal(h.plays,i+1,'end event alone does not restart before the wait');await h.jobs[i]();}
  h.audio.onended();assert.equal(h.plays,3);assert.equal(h.player.active,false);assert.equal(h.states.at(-1)[0],'complete');
});
test('closing or stopping cancels delayed repeats and pending audio preparation',async()=>{
  const h=harness();await h.player.play(null,{repeat:3,speed:1,wait:10});h.audio.onended();h.player.stop();assert.equal(h.jobs[0],null);assert.equal(h.audio.onended,null);
  let resolve;h.player.prepare=()=>new Promise(r=>resolve=r);const pending=h.player.play(null,{repeat:2,speed:1,wait:0});h.player.stop();resolve('/late-audio');await pending;assert.equal(h.plays,1);
});
test('a saved prayer keeps settings and editable clips only for the exact recording',()=>{
  const state={hash:'source-a',repeat:3,speed:1.25,wait:2,clips:[{name:'First phrase',start:1,end:3}]};
  assert.deepEqual(restorePrayerState(state,'source-a').clips,state.clips);assert.equal(restorePrayerState(state,'source-b').clips.length,0);
  assert.equal(restorePrayerState({...state,repeat:0},'source-a').repeat,1);
  assert.equal(restorePrayerState({...state,clips:[{name:'bad',start:-1,end:4}]},'source-a').clips.length,0);
});
test('new prayer controls have complete labels across all supported languages',()=>{
  assert.equal(prayerLocales.length,21);for(const [key,values]of Object.entries(prayerLabels)){assert.equal(values.length,21,key);for(const locale of prayerLocales)assert.ok(prayerCopy(locale,key)?.trim());}
  assert.equal(prayerCopy('unsupported','full'),'Whole supplication');
});


test('a corrupt optional audio download is repaired; a valid offline download needs no network',async()=>{
 const {loadPrayerBytes}=await import('../src/prayer-audio-cache.mjs');const data=new Uint8Array([1,2,3,4]);const record={path:'/assets/dua-audio/test.mp3',bytes:4,sha256:createHash('sha256').update(data).digest('hex')};
 const response=v=>new Response(v,{headers:{'Content-Type':'audio/mpeg'}});let removed=0,fetched=0;
 const cache={match:async()=>response(new Uint8Array([9])),delete:async()=>{removed++;}};
 assert.deepEqual(new Uint8Array(await loadPrayerBytes(record,{cache,fetcher:async()=>{fetched++;return response(data);}})),data);assert.equal(removed,1);assert.equal(fetched,1);
 cache.match=async()=>response(data);await loadPrayerBytes(record,{cache,fetcher:()=>{throw Error('offline');}});assert.equal(fetched,1);
 await assert.rejects(()=>loadPrayerBytes(record,{fetcher:async()=>new Response('<html>SPA fallback</html>',{headers:{'Content-Type':'text/html'}})}));
});


test('default repeat timers keep the browser Window receiver',async()=>{
 const jobs=[],states=[];let plays=0,host;const c=vm.createContext({setTimeout:function(fn){assert.equal(this,host,'native browser timer receiver');jobs.push(fn);return jobs.length;},clearTimeout:function(){assert.equal(this,host);}});host=vm.runInContext('globalThis',c);
 vm.runInContext(fs.readFileSync('src/dua-practice-core.mjs','utf8').replaceAll('export ',''),c);const Player=vm.runInContext('PrayerPlayer',c);const audio={pause(){},async play(){plays++;}};const player=new Player({audio,prepare:async()=>'/audio',onState:s=>states.push(s)});
 await player.play(null,{repeat:2,speed:1,wait:0});audio.onended();assert.equal(jobs.length,1);await jobs[0]();assert.equal(plays,2);audio.onended();assert.equal(states.at(-1),'complete');
});
