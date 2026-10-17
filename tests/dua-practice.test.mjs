import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {PrayerPlayer,pcmExcerptWav,pcmRangesWav,buildPrayerStudyPlan,restorePrayerState,validExcerpt} from '../src/dua-practice-core.mjs';
import {prayerLocales,prayerLabels,prayerCopy} from '../src/dua-copy.mjs';
import {prayerCatalog} from '../src/dua-catalog.mjs';
const html=fs.readFileSync('index.html','utf8'),at=html.indexOf('var NAMAZ=['),end=html.indexOf('\n  ];',at)+6;
const texts=vm.runInNewContext(html.slice(at,end)+';NAMAZ'),catalog=prayerCatalog(texts);

test('prayer recordings retain exact source bytes, and unavailable prayers never acquire a misleading voice',()=>{
  const recordings=catalog.filter(x=>x.recording);assert.equal(recordings.length,10);
  for(const item of recordings){const r=item.recording,bytes=fs.readFileSync('.'+r.path);assert.equal(bytes.length,r.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),r.sha256);assert.ok(r.source.startsWith('https://namaz.diyanet.gov.tr/namaz/assets/audio/dualar/')||r.source.startsWith('https://d1.islamhouse.com/'));if(r.source.includes('islamhouse.com')){assert.ok(r.reader);assert.equal(r.permissionUrl,'https://d1.islamhouse.com/html/faq.htm');assert.ok(r.sourcePage);}}
  for(const id of ['kuran-baslama','yemek','amentü'])assert.equal(catalog.find(x=>x.id===id).recording,undefined);
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

const studyParts=[{name:'A',start:0,end:1},{name:'B',start:2,end:3},{name:'C',start:4,end:5}];
const studySettings={method:'cumulative',partRepeat:2,combineRepeat:3,tourRepeat:2,speed:1.25,wait:2};
test('independent phrase, cumulative and whole-study counts produce the exact hifz sequence',()=>{
  const plan=Array.from(buildPrayerStudyPlan(studyParts,studySettings));
  const singleTour=['A','A','B','B','AB','AB','AB','C','C','ABC','ABC','ABC'];
  assert.deepEqual(plan.map(s=>s.ranges.map(r=>r.name).join('')),[...singleTour,...singleTour]);
  assert.deepEqual(plan.map(s=>s.tour),[...Array(12).fill(1),...Array(12).fill(2)]);
  assert.equal(plan[4].phase,'combine');assert.equal(plan[4].partIndex,1);assert.equal(plan[4].current,1);assert.equal(plan[6].current,3);assert.equal(plan[6].total,3);
  assert.deepEqual(Array.from(buildPrayerStudyPlan(studyParts,{...studySettings,method:'sequential',partRepeat:0,combineRepeat:99,tourRepeat:0})).map(s=>s.ranges[0].name),['A','B','C'],'zero extra part/tour repetitions still reads each part once; combine is separately disabled by method');
  assert.deepEqual(Array.from(buildPrayerStudyPlan(studyParts,{...studySettings,partRepeat:1,combineRepeat:0,tourRepeat:1})).map(s=>s.phase),['part','part','part']);
  assert.throws(()=>buildPrayerStudyPlan(studyParts,{...studySettings,partRepeat:-1}));
  assert.throws(()=>buildPrayerStudyPlan([studyParts[1],studyParts[0]],studySettings));
  assert.throws(()=>buildPrayerStudyPlan([{start:0,end:2},{start:1,end:3}],studySettings));
  const huge=buildPrayerStudyPlan(Array.from({length:50},(_,i)=>({start:i,end:i+0.5})),{...studySettings,partRepeat:99,combineRepeat:99,tourRepeat:99});
  assert.equal(Array.isArray(huge),false,'the million-step plan is streamed');assert.equal(huge.next().value.current,1);
});

test('combined prayer audio excludes unselected gaps and following words without changing pitch or channels',()=>{
  const left=Float32Array.from({length:100},(_,i)=>i<20?0.1:i<60?0.9:i<80?0.2:0.8);
  const right=Float32Array.from(left,x=>-x);
  const buffer={duration:1,length:100,sampleRate:100,numberOfChannels:2,getChannelData:c=>c?right:left};
  const wav=pcmRangesWav(buffer,[{start:0,end:0.2},{start:0.6,end:0.8}]),view=new DataView(wav);
  assert.equal(view.getUint16(22,true),2);assert.equal(view.getUint32(24,true),100);assert.equal(view.getUint32(40,true),40*2*2);
  for(let i=0;i<40;i++){
    const sample=view.getInt16(44+i*4,true);assert.ok(Math.abs(sample-(i<20?3277:6553))<=1);
    assert.ok(view.getInt16(46+i*4,true)<0,'stereo channel polarity survives');
    assert.ok(sample<7000,'neither loud excluded gap nor following word leaks into the clip');
  }
  assert.throws(()=>pcmRangesWav(buffer,[{start:0,end:0.6},{start:0.5,end:0.8}]));
});

test('hifz playback reports stages, waits, ignores duplicate/stale callbacks and prepares only source changes',async()=>{
  const states=[],jobs=[],prepared=[];let plays=0;
  const audio={pause(){},async play(){plays++;}};
  const player=new PrayerPlayer({audio,preparePlan:async ranges=>{const name=ranges.map(r=>r.name).join('');prepared.push(name);return '/'+name;},schedule:(fn,delay)=>{jobs.push({fn,delay});return jobs.length;},unschedule:id=>{jobs[id-1]=null;},onState:(state,data)=>states.push([state,data])});
  await player.playPlan(studyParts.slice(0,2),{...studySettings,tourRepeat:1});
  const firstEnd=audio.onended;firstEnd();firstEnd();assert.equal(jobs.length,1,'duplicate media end must schedule one next step');assert.equal(jobs[0].delay,2000);
  await jobs[0].fn();firstEnd();assert.equal(jobs.length,1,'a previous playback callback must not advance the next repetition');
  for(let i=1;i<6;i++){audio.onended();await jobs[i].fn();}
  audio.onended();assert.equal(plays,7);assert.deepEqual(prepared,['A','B','AB']);assert.equal(player.active,false);assert.equal(states.at(-1)[0],'complete');
  assert.deepEqual(states.filter(([s])=>s==='playing').map(([,s])=>[s.phase,s.current,s.total]),[['part',1,2],['part',2,2],['part',1,2],['part',2,2],['combine',1,3],['combine',2,3],['combine',3,3]]);
  assert.equal(audio.preservesPitch,true);assert.equal(audio.playbackRate,1.25);
});

test('changing a study while its audio is preparing invalidates the old source and pending timers',async()=>{
  let resolveOld,lateIsCurrent,plays=0;const jobs=[];
  const audio={pause(){},async play(){plays++;}};
  const player=new PrayerPlayer({audio,preparePlan:(ranges,isCurrent)=>ranges[0].name==='A'?new Promise(resolve=>{resolveOld=resolve;lateIsCurrent=isCurrent;}):Promise.resolve('/B'),schedule:fn=>{jobs.push(fn);return jobs.length;},unschedule:id=>jobs[id-1]=null});
  const older=player.playPlan([studyParts[0]],studySettings);
  await player.playPlan([studyParts[1]],studySettings);assert.equal(lateIsCurrent(),false);resolveOld('/obsolete');await older;
  assert.equal(audio.src,'/B');assert.equal(plays,1);audio.onended();const stale=jobs[0];player.stop();assert.equal(jobs[0],null);await stale();assert.equal(plays,1);assert.equal(audio.onended,null);
});

test('study preferences preserve zero and migrate existing recording-bound prayer settings',()=>{
  const old={hash:'h',repeat:4,speed:1,wait:0,clips:[]};
  assert.equal(restorePrayerState(old,'h').partRepeat,4);
  const next=restorePrayerState({...old,method:'cumulative',partRepeat:0,combineRepeat:3,tourRepeat:0},'h');
  assert.deepEqual([next.method,next.partRepeat,next.combineRepeat,next.tourRepeat],['cumulative',0,3,0]);
  assert.equal(restorePrayerState({...old,partRepeat:100},'h').partRepeat,4);
});
