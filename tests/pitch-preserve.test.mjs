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
function buffer(length=1000,channels=1){
  const data=Array.from({length:channels},()=>new Float32Array(length).fill(.5));
  return {sampleRate:1000,numberOfChannels:channels,length,
    getChannelData(ch){return data[ch];}};
}
const context=vm.createContext({Blob,ArrayBuffer,DataView,Math,Number});
vm.runInContext(fn('boundedPitchClip'),context);

test('pitch-preserving clip contains exactly the selected samples and soft edges',async()=>{
  const wav=await context.boundedPitchClip(buffer(),.1,.2,5).arrayBuffer();
  const v=new DataView(wav);
  assert.equal(new TextDecoder().decode(new Uint8Array(wav,0,4)),'RIFF');
  assert.equal(new TextDecoder().decode(new Uint8Array(wav,8,4)),'WAVE');
  assert.equal(v.getUint16(22,true),1);
  assert.equal(v.getUint32(24,true),1000);
  assert.equal(v.getUint32(40,true),400,'200 frames at 16 bits');
  assert.equal(wav.byteLength,444);
  assert.ok(v.getInt16(44,true)<v.getInt16(44+2*10,true),'fade-in avoids a click');
  assert.ok(v.getInt16(44+2*199,true)<v.getInt16(44+2*190,true),'fade-out avoids a click');
});

test('stereo clips are interleaved, capped at the buffer end, and size guarded',async()=>{
  const wav=await context.boundedPitchClip(buffer(250,2),.1,.5,5).arrayBuffer();
  const v=new DataView(wav);
  assert.equal(v.getUint16(22,true),2);
  assert.equal(v.getUint32(40,true),600,'150 frames times two channels');
  assert.equal(v.getInt16(44,true),v.getInt16(46,true));
  const huge={sampleRate:48000,numberOfChannels:2,length:48000*400,
    getChannelData(){throw Error('should not allocate an oversized clip');}};
  assert.equal(context.boundedPitchClip(huge,0,400,5),null);
});

test('non-1x step uses pitch-preserving media and revokes its clip URL on stop',()=>{
  const revoked=[],players=[];
  class Audio{
    constructor(src){this.src=src;this.currentTime=0;this.paused=true;players.push(this);}
    play(){this.paused=false;return Promise.resolve();}
    pause(){this.paused=true;}
    removeAttribute(key){if(key==='src')this.src='';}
    load(){}
  }
  const c=vm.createContext({Blob,ArrayBuffer,DataView,Math,Number,Date,Audio,
    URL:{createObjectURL(){return 'blob:test-clip';},revokeObjectURL(url){revoked.push(url);}},
    plan:[{preserveTail:true}],pi:0,pp(a){a.preservesPitch=true;},lowerBound(){return 0;},
    splitTimingMs(ms){return ms;},requestAnimationFrame(){return 1;},cancelAnimationFrame(){},
    tick(){},playing:true,toast(){},stopPlan(){},useWA:true,
    setTimeout(){return 2;},clearTimeout(){}});
  vm.runInContext('let clipAudio=null,clipUrl=null,clipStartMs=0,pitchPlayer=null,clipCache=null,clipWatchTimer=null,srcNode=null,gainNode=null,raf=null,playOffsetMs=0,playEndMs=0,stepEnded=false,pausedAtMs=null,segIdx=0;',c);
  for(const name of ['boundedPitchClip','stopSrc','seekPlayPitchClip'])vm.runInContext(fn(name),c);
  const source=buffer();let reads=0;const get=source.getChannelData;
  source.getChannelData=ch=>{reads++;return get(ch);};
  c.seekPlayPitchClip(source,10000,10200,.1,.2,1.25);
  assert.equal(players.length,1);
  assert.equal(players[0].playbackRate,1.25);
  assert.equal(players[0].preservesPitch,true);
  assert.equal(players[0].paused,false);
  assert.equal(vm.runInContext('clipStartMs',c),10000);
  c.stopSrc();
  assert.equal(players[0].paused,true);
  assert.deepEqual(revoked,['blob:test-clip']);
  assert.equal(vm.runInContext('clipAudio',c),null);
  c.seekPlayPitchClip(source,10000,10200,.1,.2,.75);
  assert.equal(players.length,1,'the same element handles automatic following steps');
  assert.equal(players[0].playbackRate,.75);
  assert.equal(reads,1,'a repeated step reuses its encoded samples');
});
