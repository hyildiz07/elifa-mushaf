import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const asset=JSON.parse(fs.readFileSync(new URL('../assets/audio-timing-overrides-r3-r5.json',import.meta.url)));
const proof=JSON.parse(fs.readFileSync(new URL('../review/sudais-39-54-exact-qdc-evidence.json',import.meta.url)));
const source=name=>{
  const at=html.indexOf(`function ${name}(`);
  assert.ok(at>=0,name);
  return html.slice(at,html.indexOf('\n}',at)+2);
};

test('Sudais 39:54 exact source keeps both 4–5 takes and a safe whole-verse card',async()=>{
  const row=asset.rows['3:39:54'],verification=asset.verification['3:39:54'];
  assert.ok(row&&verification);
  assert.equal(proof.source_sha256,'9667e8f7c2f31f437dfb9cc74c4d4c7f419bde1ace94d1df7561dc29bec5f145');
  assert.equal(verification.source_sha256,proof.source_sha256);
  assert.equal(row.url,proof.source_url);
  assert.equal(row.next,807380);
  assert.equal(row.range[1],row.next);
  assert.equal(row.repeatWholeVerse,true);
  const target=model=>proof.models[model].filter(s=>s.from.startsWith('39:54:'));
  assert.deepEqual(target('Base').map(s=>[s.from,s.to,s.start_ms,s.end_ms,s.words]),
    target('Large').map(s=>[s.from,s.to,s.start_ms,s.end_ms,s.words]));
  for(const model of ['Base','Large']){
    assert.equal(proof.models[model].find(s=>s.from==='39:53:17').end_ms,794380);
    assert.equal(proof.models[model].find(s=>s.from==='39:55:1').start_ms,row.next);
  }
  const expected=target('Base').flatMap(s=>s.words.map(([ref,from,to])=>{
    assert.match(ref,/^39:54:\d+$/);
    return [+ref.split(':')[2],Math.round(s.start_ms+from*1000),Math.round(s.start_ms+to*1000)];
  }));
  assert.deepEqual(row.segments,expected);
  assert.deepEqual(row.segments.map(s=>s[0]),[1,2,3,4,5,4,5,6,7,8,9,10,11,12,13]);
  expected.forEach((s,i)=>{
    assert.ok(s[1]>=row.range[0]&&s[2]<=row.range[1]&&s[2]>s[1]);
    if(i)assert.ok(s[1]>=expected[i-1][2]);
  });
  assert.ok(expected.at(-1)[2]<row.next);

  const c=vm.createContext({fetch:async()=>({ok:true,json:async()=>asset}),AbortSignal,console});
  vm.runInContext(html.split(/\r?\n/).find(line=>line.startsWith('const QTEXT=')),c);
  const at=html.indexOf('const VERIFIED_TIMING_ASSETS=');
  vm.runInContext(html.slice(at,html.indexOf('};',at)+2)+'\nconst verifiedTimingPromises={};',c);
  for(const name of ['timingTextKey','repeatedTimeline','repeatedAudioRanges','selTimes','computeParts'])
    vm.runInContext(source(name),c);
  const applyAt=html.indexOf('async function applyVerifiedTimings(');
  vm.runInContext(html.slice(applyAt,html.indexOf('\n}',applyAt)+2),c);
  const words=vm.runInContext('QTEXT',c)[39][53][2].filter(w=>w[1]===0).map(w=>w[0]);
  assert.equal(row.text,c.timingTextKey(words));
  const af=await c.applyVerifiedTimings({audio_url:row.url,verse_timings:[{
    verse_key:'39:54',timestamp_from:794070,timestamp_to:806660,segments:[[1,794070,795985]],
  }]},3,39);
  assert.deepEqual(JSON.parse(JSON.stringify(af.verse_timings[0].segments)),expected);
  assert.equal(af.repeatWholeVerse[54],true);
  assert.equal(af.trustedNext[54],row.next);
  assert.ok(c.repeatedTimeline(row.segments,13,row.range));

  const latest=new Map();for(const [pos,s,e] of row.segments)latest.set(pos,[s,e]);
  const wordArr=words.map((txt,i)=>({ay:54,pos:i+1,txt,joinNext:false,
    s:latest.get(i+1)[0],e:latest.get(i+1)[1],gi:i}));
  c.AD_={reciterId:3,verseSegments:{54:row.segments},verseRanges:{54:row.range},
    repeatWholeVerse:af.repeatWholeVerse,trustedNext:af.trustedNext};
  c.wordArr=wordArr;c.ayGi={54:[0,12]};c.SET={reciter:3};c.curS=39;
  c.selRange=()=>[0,3];
  assert.equal(c.selTimes(),null,'1–4 would contain unselected first word 5');
  c.selRange=()=>[0,4];
  assert.deepEqual(Array.from(c.selTimes()),[latest.get(1)[0],latest.get(5)[1]]);
  c.selRange=()=>[3,4];
  assert.deepEqual(Array.from(c.selTimes()),[latest.get(4)[0],latest.get(5)[1]]);
  c.selRange=()=>[3,3];
  assert.deepEqual(Array.from(c.selTimes()),latest.get(4));
  c.selRange=()=>[4,4];
  assert.deepEqual(Array.from(c.selTimes()),latest.get(5));
  for(let lo=0;lo<13;lo++)for(let hi=lo;hi<13;hi++){
    c.selRange=()=>[lo,hi];
    const span=c.selTimes();
    if(!span)continue;
    assert.ok(row.segments.every(([pos,from,to])=>
      !(from<span[1]&&to>span[0])||(pos>=lo+1&&pos<=hi+1)),
      `selection ${lo+1}–${hi+1} leaks an unselected repeated word`);
  }
  assert.deepEqual(JSON.parse(JSON.stringify(c.repeatedAudioRanges(row.segments,1,13,row.range,13))),
    [{f:row.range[0],t:row.range[1]}]);
  const parts=c.computeParts(54);
  assert.equal(parts.length,1);
  assert.equal(parts[0].wholeVerse,true);
  assert.deepEqual([parts[0].f,parts[0].t],row.range);
});
