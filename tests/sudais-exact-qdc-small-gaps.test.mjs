import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const evidence=JSON.parse(fs.readFileSync(new URL('../review/sudais-small-gap-qdc-evidence.json',import.meta.url)));
const asset=JSON.parse(fs.readFileSync(new URL('../assets/audio-timing-overrides-r3-r5.json',import.meta.url)));
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const source=name=>{
  const at=html.indexOf(`function ${name}(`);
  assert.ok(at>=0,name);
  return html.slice(at,html.indexOf('\n}',at)+2);
};

test('exact QDC Sudais repairs preserve true repeats and the next-verse boundary',async()=>{
  const c=vm.createContext({fetch:async()=>({ok:true,json:async()=>asset}),AbortSignal,console});
  vm.runInContext(html.split(/\r?\n/).find(line=>line.startsWith('const QTEXT=')),c);
  const at=html.indexOf('const VERIFIED_TIMING_ASSETS=');
  vm.runInContext(html.slice(at,html.indexOf('};',at)+2)+'\nconst verifiedTimingPromises={};',c);
  for(const name of ['timingTextKey','repeatedTimeline','repeatedAudioRanges'])
    vm.runInContext(source(name),c);
  const applyAt=html.indexOf('async function applyVerifiedTimings(');
  vm.runInContext(html.slice(applyAt,html.indexOf('\n}',applyAt)+2),c);
  const qtext=vm.runInContext('QTEXT',c);
  for(const [key,missing] of [['2:25',22],['41:44',17]]){
    const [sid,ay]=key.split(':').map(Number),e=evidence[key],row=asset.rows[`3:${key}`],
      proof=asset.verification[`3:${key}`];
    assert.ok(row&&proof,key);
    assert.equal(row.url,e.source_url,key);
    assert.equal(proof.source_sha256,e.source_sha256,key);
    assert.equal(proof.wav_sha256,e.wav_sha256,key);
    assert.equal(row.range[0],e.provider.range[0],key);
    const words=qtext[sid][ay-1][2].filter(word=>word[1]===0).map(word=>word[0]);
    assert.equal(row.text,c.timingTextKey(words),key);
    const target=model=>e.models[model].segments.filter(s=>s.from.startsWith(`${key}:`));
    const shape=model=>target(model).map(s=>[s.from,s.to,s.start_ms,s.end_ms,s.words]);
    assert.deepEqual(shape('Base'),shape('Large'),key);
    const expected=target('Base').flatMap(s=>s.words.map(([ref,from,to])=>{
      assert.match(ref,new RegExp(`^${key}:\\d+$`));
      return [+ref.split(':')[2],Math.round(s.start_ms+from*1000),Math.round(s.start_ms+to*1000)];
    }));
    assert.deepEqual(row.segments,expected,key);
    assert.equal(new Set(expected.map(s=>s[0])).size,words.length,key);
    assert.ok(expected.some(s=>s[0]===missing),key);
    expected.forEach((s,i)=>{
      assert.ok(s[1]>=row.range[0]&&s[2]<=row.range[1]&&s[2]>s[1],key);
      if(i)assert.ok(s[1]>=expected[i-1][2],key);
    });
    const modelNext=e.models.Base.segments.find(s=>s.from===`${sid}:${ay+1}:1`);
    assert.equal(row.next,modelNext.start_ms,key);
    assert.ok(target('Base').at(-1).end_ms<row.next,key);
    const input={verse_key:key,timestamp_from:e.provider.range[0],
      timestamp_to:e.provider.range[1],segments:[]};
    const applied=await c.applyVerifiedTimings({audio_url:row.url,verse_timings:[input]},3,sid);
    assert.deepEqual(JSON.parse(JSON.stringify(applied.verse_timings[0].segments)),expected,key);
    assert.equal(applied.trustedNext[ay],row.next,key);
  }
  const repeated=asset.rows['3:2:25'];
  assert.deepEqual(repeated.segments.filter(s=>s[0]===6).map(s=>s[1]),[332657,335990]);
  assert.deepEqual(repeated.segments.filter(s=>s[0]===19).map(s=>s[1]),[347983,349217]);
  assert.ok(c.repeatedTimeline(repeated.segments,34,repeated.range));
  assert.deepEqual(JSON.parse(JSON.stringify(c.repeatedAudioRanges(repeated.segments,22,22,repeated.range,34))),
    [{f:351557,t:352497}]);
  assert.equal(asset.rows['3:41:44'].segments.find(s=>s[0]===17)[1],588403);
  assert.match(html,/function audioTimingUnverified\(rid,sid\)\{return rid===3&&\[3,4,5,28,29\]\.includes\(sid\);\}/);
});
