import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=name=>JSON.parse(fs.readFileSync(new URL(`../review/${name}`,import.meta.url),'utf8'));
const approved=read('hani-6-139-full-verse-qud-candidate.json');
const aligned139=read('hani-006139-qud-candidate.json');
const aligned46=read('hani-034046-qud-candidate.json');
const acoustics=read('hani-independent-acoustics.json');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const at=html.indexOf('const QTEXT=');
const qtext=JSON.parse(html.slice(at+'const QTEXT='.length,html.indexOf('\n',at)).replace(/;\s*$/,''));

test('Hânî 6:139 whole-source candidate has every canonical word and an independently quiet next boundary',()=>{
  const expected=qtext[6][138][2].filter(w=>w[1]===0).length;
  assert.equal(expected,22);
  const rows=aligned139.response.segments;
  const positions=[];
  for(const row of rows){
    assert.equal(row.kind,'quran');
    assert.equal(row.error,null);
    assert.equal(row.has_missing_words,false);
    assert.equal(row.has_repeated_words,false);
    assert.ok(row.confidence>=0.78);
    const a=Number(row.ref_from.match(/^6:139:(\d+)$/)?.[1]);
    const b=Number(row.ref_to.match(/^6:139:(\d+)$/)?.[1]);
    assert.ok(Number.isInteger(a)&&Number.isInteger(b)&&b>=a);
    for(let p=a;p<=b;p++)positions.push(p);
  }
  assert.deepEqual(positions,Array.from({length:expected},(_,i)=>i+1));
  assert.equal(rows.at(-1).matched_text,'إِنَّهُۥ حَكِيمٌ عَلِيمٌ');
  assert.ok(approved.decoded_duration_ms-rows.at(-1).time_to*1000<20);
  assert.equal(approved.source_url,aligned139.source_url);
  assert.equal(approved.source_sha256,aligned139.source_sha256);
  assert.equal(approved.source_bytes,aligned139.source_bytes);
  assert.ok(acoustics.matches.start139hi.correlation>.9);
  assert.ok(acoustics.matches.start140hi.correlation>.99);
  assert.ok(acoustics.case139.chapterAtAndAfterHiEnd[1].rms<.0001);
  assert.ok(acoustics.case139.chapterAtAndAfterHiEnd[2].rms<.0001);
  assert.equal(acoustics.case139.hiNextClipFirstWindows[0].rms,0);
  assert.equal(acoustics.case139.hiNextClipFirstWindows[1].rms,0);
  assert.equal(approved.word_split_verified,false);
  assert.equal(approved.connected_to_app,false);
});

test('Hânî 34:46 extra sound remains unrecognized, so no production candidate is issued',()=>{
  const rows=aligned46.response.segments;
  assert.equal(rows.at(-2).ref_to,'34:46:24');
  assert.equal(rows.at(-1).ref_from,'');
  assert.equal(rows.at(-1).ref_to,'');
  assert.equal(rows.at(-1).confidence,0);
  assert.match(rows.at(-1).error,/Low confidence/);
  assert.ok(rows.at(-1).time_from>rows.at(-2).time_to);
  assert.ok(rows.at(-1).time_to*1000>acoustics.durationsMs.verse46hi-30);
});
