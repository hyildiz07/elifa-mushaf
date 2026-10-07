import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const root=new URL('../',import.meta.url);
const read=path=>fs.readFileSync(new URL(path,root),'utf8');
const catalog=JSON.parse(read('review/sudais-full-verse-candidates.json'));
const context=vm.createContext({});
vm.runInContext(read('index.html').split(/\r?\n/).find(line=>line.startsWith('const QTEXT=')),context);
const QTEXT=vm.runInContext('QTEXT',context);

test('Südeys full-verse candidates cover the canonical words but remain review-only',()=>{
  assert.equal(catalog.status,'local-human-listening-review-only');
  assert.equal(catalog.review_status,'pending-final-phoneme-audition');
  assert.equal(catalog.reciter,3);
  assert.equal(catalog.word_timing_transfer,false);
  assert.deepEqual(Object.keys(catalog.rows),['3:160','4:143','5:5']);
  for(const [key,row] of Object.entries(catalog.rows)){
    const [surah,ayah]=key.split(':').map(Number);
    const words=QTEXT[surah][ayah-1][2].filter(word=>word[1]===0);
    const stem=`${String(surah).padStart(3,'0')}${String(ayah).padStart(3,'0')}`;
    assert.equal(row.verse_key,key);
    assert.equal(row.canonical_word_count,words.length,key);
    assert.equal(row.final_word,words.at(-1)[0],key);
    assert.equal(row.audio_url,`${catalog.candidate_audio_source}${stem}.mp3`,key);
    assert.equal(row.next_verse_url,
      `${catalog.candidate_audio_source}${String(surah).padStart(3,'0')}${String(ayah+1).padStart(3,'0')}.mp3`,key);
    assert.match(row.sha256,/^[0-9a-f]{64}$/);
    assert.ok(row.file_size>100000&&row.decoded_duration_ms>row.quranlab_64kbps_last_word_end_ms,key);
    assert.ok(row.pcm_64_to_192_correlation.length===4&&
      row.pcm_64_to_192_correlation.every(value=>value>.85),key);
    assert.ok(row.end_rms_10ms>.01,'active file end must remain an explicit review risk');
    assert.ok(row.next_verse_head_max_correlation<.3,key);
  }
});

test('review-only Südeys recordings are not selected by the production player',()=>{
  assert.ok(!read('index.html').includes('sudais-full-verse-candidates.json'));
  assert.ok(!read('src/verified-verse-audio.mjs').includes('sudais-full-verse-candidates.json'));
});
