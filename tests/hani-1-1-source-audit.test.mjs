import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Hani 1:1 stays unmodified until four source-matched word bounds exist',()=>{
  const evidence=JSON.parse(fs.readFileSync(new URL('../review/hani-1-1-source-audit.json',import.meta.url)));
  const overrides=JSON.parse(fs.readFileSync(new URL('../assets/audio-timing-overrides-v3.json',import.meta.url))).rows;
  assert.equal(evidence.production.verse.verse_key,'1:1');
  assert.deepEqual(evidence.production.verse.segments,[[2,7,3972]]);
  assert.equal(evidence.quaV320CompleteOccurrences,0);
  assert.deepEqual(evidence.cpfair2016.firstRow.segments.map(s=>s.slice(0,2)),
    [[0,2],[2,3],[3,4]]);
  assert.equal(overrides['5:1:1'],undefined);
  assert.ok(evidence.matches.every(m=>
    m.local.filter(p=>p.mark>350).every(p=>p.startMs===0&&p.correlation>0.99)));
});
