import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
function fn(name){
  const start=html.search(new RegExp('function '+name+'\\('));
  assert.ok(start>=0,name+' exists');
  return html.slice(start,html.indexOf('\n}',start)+2);
}
function fixture(){
  const callbacks=new Map(),listeners=new Map(),rejects=[];
  let nextTimer=0,stops=0;
  const audio={currentTime:0,paused:true,volume:1,
    addEventListener(name,cb){listeners.set(name,cb);},
    removeEventListener(name,cb){if(listeners.get(name)===cb)listeners.delete(name);},
    play(){return new Promise((_,reject)=>rejects.push(reject));}};
  const c=vm.createContext({AD_:{audio},SET:{speed:1},playing:true,useWA:false,
    audioRequestId:4,stepRequestId:7,htmlPlaybackSeq:0,htmlPlaybackWatch:null,
    htmlBtimer:null,raf:null,toast(){},stopSrc(){},cancelHTMLFade(){},
    pp(){},lowerBound(){return 0;},scheduleHTMLBoundary(){},tick(){},
    requestAnimationFrame(){return 1;},cancelAnimationFrame(){},
    setTimeout(cb,ms){const id=++nextTimer;callbacks.set(id,{cb,ms});return id;},
    clearTimeout(id){callbacks.delete(id);},
    stopPlan(){stops++;c.playing=false;c.clearHTMLPlaybackWatch();}});
  vm.runInContext(fn('clearHTMLPlaybackWatch'),c);
  vm.runInContext(fn('seekPlayHTML'),c);
  return {c,audio,listeners,rejects,callbacks,stops:()=>stops,
    expireWatch(){const watch=[...callbacks.entries()].find(([,v])=>v.ms===20000);
      assert.ok(watch,'watchdog is armed');callbacks.delete(watch[0]);watch[1].cb();}};
}

test('short HTMLAudio buffering recovers without stopping playback',()=>{
  const f=fixture();f.c.seekPlayHTML(1000,3000);
  f.audio.currentTime=1.2;f.listeners.get('timeupdate')();
  assert.equal([...f.callbacks.values()].filter(t=>t.ms===20000).length,1);
  f.listeners.get('waiting')();
  f.audio.currentTime=1.4;f.listeners.get('timeupdate')();
  assert.equal([...f.callbacks.values()].filter(t=>t.ms===20000).length,1);
  assert.equal(f.stops(),0);
});

test('a silent freeze after the first progress event cannot wait forever',()=>{
  const f=fixture();f.c.seekPlayHTML(1000,3000);
  f.audio.currentTime=1.2;f.listeners.get('timeupdate')();
  f.expireWatch();
  assert.equal(f.stops(),1);
});

test('background playback keeps running when timeupdate is throttled',()=>{
  const f=fixture();f.c.seekPlayHTML(1000,3000);
  f.audio.currentTime=1.4;
  f.expireWatch();
  assert.equal(f.stops(),0,'the media clock advanced without a timeupdate event');
  f.expireWatch();
  assert.equal(f.stops(),1,'a later frozen clock still stops the step');
});

test('an indefinitely stalled HTMLAudio step fails with a retry path',()=>{
  const f=fixture();f.c.seekPlayHTML(1000,3000);f.expireWatch();
  assert.equal(f.rejects.length,1,'play() may still be unresolved when the deadline expires');
  assert.equal(f.stops(),1);
  assert.equal(f.c.playing,false);
  assert.equal(f.listeners.size,0);
});

test('repeated waiting events cannot postpone a frozen stream',()=>{
  const f=fixture();f.c.seekPlayHTML(1000,3000);
  const initial=[...f.callbacks.entries()].find(([,v])=>v.ms===20000);
  f.listeners.get('waiting')();f.listeners.get('stalled')();f.listeners.get('waiting')();
  assert.ok(f.callbacks.has(initial[0]),'the original deadline remains active');
  assert.equal([...f.callbacks.values()].filter(v=>v.ms===20000).length,1);
  f.expireWatch();assert.equal(f.stops(),1);
});

test('a boundary timer that keeps retrying during buffering cannot outlive the watchdog',()=>{
  const f=fixture();
  Object.assign(f.c,{waiting:null,plan:[{}],pi:0,currentFadeMs:()=>45});
  vm.runInContext(fn('scheduleHTMLBoundary'),f.c);
  f.c.seekPlayHTML(1000,3000);
  const boundary=[...f.callbacks.entries()].find(([,v])=>v.ms<20000);
  assert.ok(boundary,'the chapter boundary is scheduled');
  f.callbacks.delete(boundary[0]);boundary[1].cb();
  assert.ok([...f.callbacks.values()].some(t=>t.ms<20000),'buffering reschedules the boundary');
  f.expireWatch();
  assert.equal(f.stops(),1,'the requeued boundary cannot keep the UI waiting forever');
});

test('old play rejection and timeout cannot stop a newer seek or reciter',async()=>{
  const f=fixture();f.c.seekPlayHTML(1000,3000);
  const oldWatch=[...f.callbacks.values()].find(t=>t.ms===20000).cb;
  f.c.seekPlayHTML(1200,3000);
  f.rejects[0](Error('old request failed'));
  await Promise.resolve();
  oldWatch();
  assert.equal(f.stops(),0);
  assert.equal(f.c.playing,true);
  f.c.AD_={audio:{}};
  f.expireWatch();
  assert.equal(f.stops(),0,'old reciter must not be interrupted');
});
