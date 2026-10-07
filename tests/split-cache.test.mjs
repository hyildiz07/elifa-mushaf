import {test} from 'node:test';
import assert from 'node:assert/strict';
import {packWindow,unpackWindow} from '../assets/split-cache.js';

const context={createBuffer(channels,length,rate){
  const data=Array.from({length:channels},()=>new Float32Array(length));
  return {sampleRate:rate,length,numberOfChannels:channels,duration:length/rate,
    getChannelData:i=>data[i],copyToChannel:(from,i)=>data[i].set(from)};
}};

test('persisted verse audio restores exact PCM and acoustic cuts',()=>{
  const buffer=context.createBuffer(2,8,8000);
  buffer.getChannelData(0).set([0,.1,.2,.3,.4,.5,.6,.7]);
  buffer.getChannelData(1).set([0,-.1,-.2,-.3,-.4,-.5,-.6,-.7]);
  const original={buffer,ay:12,off:1000,shift:965,cuts:{4:1004},starts:{4:1005},pauses:{4:200},finalTailRequestedEnd:1020};
  const entry=packWindow('same-reciter/source/verse/timings',original);
  assert.equal(entry.bytes,64);
  buffer.getChannelData(0)[1]=.9;
  const restored=unpackWindow(entry,context);
  assert.equal(restored.buffer.getChannelData(0)[1],Math.fround(.1));
  assert.equal(restored.buffer.getChannelData(1)[7],Math.fround(-.7));
  assert.deepEqual(restored.cuts,{4:1004});
  assert.deepEqual(restored.starts,{4:1005});
  assert.deepEqual(restored.pauses,{4:200});
  assert.equal(restored.shift,965);
  assert.equal(restored.hi,1001);
  assert.equal(restored.finalTailRequestedEnd,1020);
});

test('large and malformed windows are never restored',()=>{
  assert.equal(packWindow('key',{buffer:context.createBuffer(2,7_000_000,44100),ay:1,off:0}),null);
  const entry=packWindow('key',{buffer:context.createBuffer(1,4,8000),ay:1,off:0});
  entry.channels[0]=new Float32Array(3);
  assert.equal(unpackWindow(entry,context),null);
});
