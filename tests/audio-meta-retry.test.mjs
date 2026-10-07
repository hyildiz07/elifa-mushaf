import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const start=html.indexOf('async function fetchAudioMeta(');
const end=html.indexOf('\nconst OFF=',start);
assert.ok(start>=0&&end>start);
const source=html.slice(start,end);

function response(status,body={audio_files:[{audio_url:'https://example.test/audio.mp3'}]}){
  return {ok:status>=200&&status<300,status,json:async()=>body};
}
function setup(replies,{verified=false,signal=AbortSignal.timeout(20000)}={}){
  const calls=[];
  const c=vm.createContext({
    verifiedAudioChapter:()=>verified,
    VERIFIED_AUDIO_SLUGS:{7:'expected-recording'},QTEXT:{2:[[]]},
    navigator:{onLine:true},console:{warn(){}},
    AbortSignal:{timeout:()=>signal},
    setTimeout:(fn)=>setTimeout(fn,0),clearTimeout,
    fetch:async(url,options)=>{
      calls.push({url,options});
      const reply=replies.shift();
      if(reply instanceof Error)throw reply;
      return reply;
    }
  });
  vm.runInContext(source,c);
  return {c,calls};
}

test('QuranCDN metadata retries network, 503, and 429 failures within one signal',async()=>{
  const expected=response(200);
  const {c,calls}=setup([new TypeError('network'),response(503),expected]);
  assert.equal((await c.fetchAudioMeta(2,2)).audio_url,'https://example.test/audio.mp3');
  assert.equal(calls.length,3);
  assert.ok(calls.every(call=>call.options.signal===calls[0].options.signal));
  const throttled=setup([response(429),expected]);
  await throttled.c.fetchAudioMeta(2,2);
  assert.equal(throttled.calls.length,2);
});

test('metadata failures stop after three attempts and never retry 4xx or bad JSON',async()=>{
  const exhausted=setup([response(500),response(502),response(503)]);
  await assert.rejects(exhausted.c.fetchAudioMeta(2,2),/503/);
  assert.equal(exhausted.calls.length,3);
  const badRequest=setup([response(404),response(200)]);
  await assert.rejects(badRequest.c.fetchAudioMeta(2,2),/404/);
  assert.equal(badRequest.calls.length,1);
  const badJson=setup([{ok:true,status:200,json:async()=>{throw SyntaxError('invalid JSON');}},response(200)]);
  await assert.rejects(badJson.c.fetchAudioMeta(2,2),/invalid JSON/);
  assert.equal(badJson.calls.length,1);
});

test('verified source mismatch is not retried',async()=>{
  const mismatch=response(200,{source_recording:'different-recording',
    audio_url:'https://example.test/audio.mp3',verse_timings:[]});
  const {c,calls}=setup([mismatch,response(404),response(200)],{verified:true});
  await assert.rejects(c.fetchAudioMeta(7,2),/404/);
  assert.equal(calls.filter(call=>call.url.startsWith('./assets/verified-audio/')).length,1);
  assert.equal(calls.length,2);
});

test('aborted metadata budget stops the retry wait',async()=>{
  const controller=new AbortController();
  const {c,calls}=setup([new TypeError('network'),response(200)],{signal:controller.signal});
  c.setTimeout=(fn)=>{queueMicrotask(()=>controller.abort(Error('deadline reached')));return setTimeout(fn,1000);};
  await assert.rejects(c.fetchAudioMeta(2,2),/deadline reached/);
  assert.equal(calls.length,1);
});
