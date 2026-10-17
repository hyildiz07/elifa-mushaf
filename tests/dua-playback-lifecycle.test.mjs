import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {PrayerPlayer} from '../src/dua-practice-core.mjs';
import {bindPrayerMediaSession,createPrayerDecoder} from '../src/dua-media-session.mjs';

test('an OS pause cancels the active prayer and cannot later advance into another repeat',async()=>{
  const states=[],jobs=[];let plays=0;
  const audio={paused:true,ended:false,pause(){this.paused=true;this.onpause?.();},async play(){this.paused=false;plays++;}};
  const player=new PrayerPlayer({audio,prepare:async()=>'/prayer',schedule:fn=>{jobs.push(fn);return jobs.length;},unschedule:id=>jobs[id-1]=null,onState:s=>states.push(s)});
  await player.play(null,{repeat:3,speed:1,wait:2});const lateEnd=audio.onended;audio.pause();
  assert.equal(player.active,false);assert.equal(states.at(-1),'interrupted');lateEnd();assert.equal(jobs.length,0);assert.equal(plays,1);
  await player.play(null,{repeat:3,speed:1,wait:2});audio.ended=true;audio.onended();const queued=jobs[0];player.interrupt();assert.equal(jobs[0],null);await queued();assert.equal(plays,2);
});

test('normal media end and old pause events do not falsely interrupt the next source',async()=>{
  const states=[],jobs=[];let plays=0;
  const audio={paused:true,ended:false,pause(){this.paused=true;},async play(){this.paused=false;this.ended=false;plays++;}};
  const player=new PrayerPlayer({audio,prepare:async()=>'/prayer',schedule:fn=>{jobs.push(fn);return jobs.length;},onState:s=>states.push(s)});
  await player.play(null,{repeat:2,speed:1,wait:0});audio.ended=true;audio.paused=true;audio.onpause();assert.equal(player.active,true);audio.onended();await jobs[0]();audio.onpause();assert.equal(player.active,true);assert.equal(plays,2);audio.ended=true;audio.onended();assert.equal(states.at(-1),'complete');
});

test('prayer media-session ownership returns original Quran handlers and metadata after close',()=>{
  const html=fs.readFileSync('index.html','utf8');
  const start=html.indexOf("  if(!('mediaSession' in navigator)) return;"),end=html.indexOf('})();',start);
  assert.ok(start>=0&&end>start);
  const handlers={},buttons=[],intervals=[];
  const session={setActionHandler:(key,fn)=>handlers[key]=fn};
  const context={navigator:{mediaSession:session},window:{setIco(){}},document:{getElementById:id=>({click:()=>buttons.push(id)})},MediaMetadata:function(value){Object.assign(this,value);},setInterval:fn=>intervals.push(fn)};
  vm.runInNewContext('(function(){'+html.slice(start,end)+'})();',context);
  handlers.play();assert.deepEqual(buttons,['playBtn2']);const originalTitle=session.metadata.title;
  let pauses=0,restarts=0,stops=0;
  const prayer=bindPrayerMediaSession({gateway:context.window.elifaMediaSession,title:'Sübhâneke',reader:'Prayer reader',play:()=>restarts++,interrupt:()=>pauses++,stop:()=>stops++});
  prayer.remember({kind:'plan'});prayer.update('playing');intervals[0]();assert.equal(session.metadata.title,'Sübhâneke');assert.equal(session.playbackState,'playing');
  context.window.setIco(false);assert.equal(session.playbackState,'playing','the paused Quran player cannot overwrite the active prayer state');
  handlers.pause();handlers.play();handlers.stop();handlers.nexttrack();assert.deepEqual([pauses,restarts,stops],[1,1,1]);assert.equal(buttons.length,1,'prayer controls never start Quran playback');
  prayer.close();prayer.close();assert.equal(session.metadata.title,originalTitle);handlers.nexttrack();handlers.pause();assert.deepEqual(buttons,['playBtn2','nextAy','playBtn2']);
});

test('releasing an older prayer owner cannot erase a newer owner',()=>{
  const html=fs.readFileSync('index.html','utf8'),start=html.indexOf("  if(!('mediaSession' in navigator)) return;"),end=html.indexOf('})();',start),handlers={};
  const session={setActionHandler:(key,fn)=>handlers[key]=fn};
  const context={navigator:{mediaSession:session},window:{},document:{getElementById:()=>null},MediaMetadata:function(v){Object.assign(this,v);},setInterval(){}};
  vm.runInNewContext('(function(){'+html.slice(start,end)+'})();',context);
  const gateway=context.window.elifaMediaSession;const first=gateway.claim({metadata:{title:'First'},handlers:{}});const second=gateway.claim({metadata:{title:'Second'},handlers:{}});
  first.release();first.update('playing');assert.equal(session.metadata.title,'Second');assert.equal(session.playbackState,'none');second.release();assert.notEqual(session.metadata.title,'Second');
});

test('decoder work is shared and its WebAudio context is closed after success, failure and overlay dismissal',async()=>{
  let creates=0,closes=0,resolved,decoded=0;const result={duration:8};
  const decoder=createPrayerDecoder({createContext:()=>{creates++;return {decodeAudioData:()=>new Promise(resolve=>resolved=resolve),close:async()=>closes++};},onDecoded:()=>decoded++});
  const a=decoder.decode(new ArrayBuffer(2)),b=decoder.decode(new ArrayBuffer(2));assert.equal(creates,1);resolved(result);assert.equal(await a,result);assert.equal(await b,result);assert.equal(closes,1);assert.equal(decoded,1);await decoder.decode(new ArrayBuffer(2));assert.equal(creates,1);
  let failedCloses=0;const failed=createPrayerDecoder({createContext:()=>({decodeAudioData:async()=>{throw Error('Bad audio');},close:async()=>failedCloses++})});await assert.rejects(failed.decode(new ArrayBuffer(2)),/Bad audio/);assert.equal(failedCloses,1);
  let closeLater,lateUpdates=0,lateCloses=0;const dismissed=createPrayerDecoder({createContext:()=>({decodeAudioData:()=>new Promise(resolve=>closeLater=resolve),close:async()=>lateCloses++}),onDecoded:()=>lateUpdates++});
  const pending=dismissed.decode(new ArrayBuffer(2));dismissed.close();closeLater(result);await assert.rejects(pending,/Closed/);assert.equal(lateUpdates,0);assert.equal(lateCloses,1);await assert.rejects(dismissed.decode(new ArrayBuffer(2)),/Closed/);
});
