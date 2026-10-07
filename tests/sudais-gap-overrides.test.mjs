import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const asset=JSON.parse(fs.readFileSync(new URL('../assets/audio-timing-overrides-r3-r5.json',import.meta.url)));
const repaired={
  '2:61':[30,31], '2:90':[3,4,5,6], '2:282':[56], '7:5':[4,5],
  '16:35':[9,10], '16:45':[7,8], '22:23':[20],
  '39:72':[1], '42:52':[17], '45:12':[9], '73:4':[4,5],
};
function source(name){
  const at=html.indexOf(`function ${name}(`);
  assert.ok(at>=0,name);
  return html.slice(at,html.indexOf('\n}',at)+2);
}

test('eleven source-matched Sudais gaps pass the production timing gate',async()=>{
  assert.equal(Object.keys(repaired).length,11);
  assert.equal(Object.values(repaired).flat().length,19);
  const c=vm.createContext({
    fetch:async()=>({ok:true,json:async()=>asset}),
    AbortSignal,console,
  });
  vm.runInContext(html.split(/\r?\n/).find(line=>line.startsWith('const QTEXT=')),c);
  const assetAt=html.indexOf('const VERIFIED_TIMING_ASSETS=');
  vm.runInContext(html.slice(assetAt,html.indexOf('};',assetAt)+2)+
    '\nconst verifiedTimingPromises={};',c);
  vm.runInContext(source('timingTextKey'),c);
  const at=html.indexOf('async function applyVerifiedTimings(');
  vm.runInContext(html.slice(at,html.indexOf('\n}',at)+2),c);
  vm.runInContext(source('selTimes'),c);
  const qtext=vm.runInContext('QTEXT',c);
  for(const [key,missing] of Object.entries(repaired)){
    const [sid,ay]=key.split(':').map(Number),row=asset.rows[`3:${key}`],proof=asset.verification[`3:${key}`];
    assert.ok(row&&proof,key);
    assert.match(row.url,new RegExp(`/murattal/${sid}\\.mp3$`));
    assert.equal(proof.window_correlations.length,3,key);
    assert.ok(proof.window_correlations.every(value=>value>=.7),key);
    assert.ok(Math.max(...proof.window_offsets_ms)-Math.min(...proof.window_offsets_ms)<=40,key);
    assert.ok(proof.second_peak_correlation<.35,key);
    assert.match(proof.next_clip_url,new RegExp(`/${String(sid).padStart(3,'0')}${String(ay+1).padStart(3,'0')}\\.mp3$`),key);
    assert.ok(Math.abs(proof.next_clip_start_ms-row.next)<=75,key);
    assert.ok(proof.next_head_correlation>=.5,key);
    const words=qtext[sid][ay-1][2].filter(word=>word[1]===0).map(word=>word[0]);
    assert.equal(row.segments.length,words.length,key);
    assert.equal(row.text,c.timingTextKey(words),key);
    assert.ok(row.next>=row.range[1],key);
    row.segments.forEach(([pos,from,to],index)=>{
      assert.equal(pos,index+1,key);
      assert.ok(from>=row.range[0]&&to<=row.range[1]&&to>from,key);
      if(index)assert.ok(from>=row.segments[index-1][2],key);
    });
    const original={verse_key:key,timestamp_from:row.range[0],timestamp_to:row.range[1],segments:[]};
    const applied=await c.applyVerifiedTimings({audio_url:row.url,verse_timings:[original]},3,sid);
    assert.deepEqual(JSON.parse(JSON.stringify(applied.verse_timings[0].segments)),row.segments,key);
    assert.equal(applied.trustedNext[ay],row.next,key);
    c.wordArr=row.segments.map(([pos,s,e])=>({ay,pos,s,e}));
    for(const pos of missing){
      c.selRange=()=>[pos-1,pos-1];
      assert.deepEqual(Array.from(c.selTimes()),row.segments[pos-1].slice(1),`${key}:${pos}`);
    }
  }
});
