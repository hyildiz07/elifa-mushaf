import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const asset=JSON.parse(fs.readFileSync(new URL('../assets/audio-timing-overrides-r10.json',import.meta.url)));
const row=asset.rows['10:3:124'];
function fn(name){const start=html.search(new RegExp('(?:async )?function '+name+'\\('));
  return html.slice(start,html.indexOf('\n}',start)+2);}

test('Shuraim 3:124 has a complete mapped occurrence on the verified MP3',()=>{
  const context=vm.createContext({});const start=html.indexOf('const QTEXT=');
  vm.runInContext(html.slice(start,html.indexOf('\n',start)),context);
  vm.runInContext(fn('timingTextKey'),context);
  const words=vm.runInContext('QTEXT[3][123][2].filter(w=>w[1]===0).map(w=>w[0])',context);
  assert.equal(row.url,'https://download.quranicaudio.com/qdc/saud_ash-shuraym/murattal/003.mp3');
  assert.equal(row.text,context.timingTextKey(words));
  assert.equal(row.segments.length,words.length);
  assert.deepEqual(row.segments.map(s=>s[0]),Array.from({length:words.length},(_,i)=>i+1));
  assert.ok(row.range[0]<row.segments[0][1]&&row.segments[0][2]<=row.segments[1][1]);
  assert.ok(row.segments.every(s=>s[2]>s[1]&&s[1]>=row.range[0]&&s[2]<=row.range[1]));
  assert.ok(row.next>=row.range[1]);
  const evidence=JSON.parse(fs.readFileSync(new URL('../review/shuraim-3-124-source-check.json',import.meta.url)));
  assert.equal(asset.alignment_ms,evidence.offsetMs);
  assert.equal(evidence.local.length,5);
  assert.ok(evidence.local.every(point=>point.correlation>0.8&&
    Math.abs(point.offsetMs-asset.alignment_ms)<=6));
  assert.equal(evidence.independentVerseClips.length,2);
  assert.ok(evidence.independentVerseClips.every(clip=>
    clip.correlation>0.5&&Math.abs(clip.startMs-row.segments[0][1])<=50));
});

test('Shuraim correction only applies to the paired recording and text',async()=>{
  const context=vm.createContext({AbortSignal,console:{warn(){}},
    fetch:async()=>({ok:true,json:async()=>asset})});
  const start=html.indexOf('const QTEXT=');
  vm.runInContext(html.slice(start,html.indexOf('\n',start)),context);
  vm.runInContext("const VERIFIED_TIMING_ASSETS={10:'./assets/audio-timing-overrides-r10.json'};const verifiedTimingPromises={};",context);
  for(const name of ['timingTextKey','applyVerifiedTimings'])vm.runInContext(fn(name),context);
  const original={audio_url:row.url,verse_timings:[{verse_key:'3:124',timestamp_from:1731348,
    timestamp_to:1741748,segments:[[2,1731409,1732029]]}]};
  const fixed=await context.applyVerifiedTimings(original,10,3);
  assert.equal(fixed.verse_timings[0].segments.length,13);
  assert.equal(fixed.verse_timings[0].segments[0][0],1);
  assert.equal(fixed.verse_timings[0].timestamp_from,row.range[0]);
  assert.equal(fixed.trustedNext[124],row.next);
  const other=await context.applyVerifiedTimings({...original,audio_url:row.url+'?different'},10,3);
  assert.equal(other.verse_timings[0].segments.length,1);
  const wrongChapter=await context.applyVerifiedTimings(original,10,4);
  assert.equal(wrongChapter.verse_timings[0].segments.length,1);
});
