import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
function source(name){
  const start=html.indexOf(`function ${name}(`);
  assert.ok(start>=0);
  return html.slice(start,html.indexOf('\n}',start)+2);
}
function fixture(){
  const heard=[];
  const c=vm.createContext({playing:true,AD_:{audio:{paused:true}},
    plan:[{f:1000,t:3000}],pi:0,waiting:null,pausedAtMs:null,
    srcNode:null,clipAudio:null,htmlPlaybackWatch:null,useWA:false,
    stepBounds:step=>step,curMs:()=>1500,seekPlay:(from,to)=>heard.push([from,to])});
  vm.runInContext(source('playbackEndForCurrentBuffer')+source('seekTo')+source('applyLiveSpeed'),c);
  return {c,heard};
}
test('seek and speed changes cannot start an imprecise stream while PCM loads',()=>{
  const f=fixture();f.c.seekTo(1600);f.c.applyLiveSpeed();
  assert.deepEqual(f.heard,[]);
});
test('seek and speed changes still work after a precise source starts',()=>{
  const f=fixture();f.c.srcNode={};f.c.seekTo(1600);f.c.applyLiveSpeed();
  assert.deepEqual(f.heard,[[1600,3000],[1500,3000]]);
});
test('seeking a final verse cannot escape its verified physical file end',()=>{
  const f=fixture();f.c.srcNode={};f.c.plan[0].normalVerse=true;
  f.c.AD_.selBuf={hi:2800,finalTailRequestedEnd:3000};
  f.c.seekTo(2980);f.c.applyLiveSpeed();
  assert.deepEqual(f.heard,[[2780,2800],[1500,2800]]);
});
