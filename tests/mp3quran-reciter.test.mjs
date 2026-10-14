import test from 'node:test';
import assert from 'node:assert/strict';
import {fetchMp3quranAudioMeta, mp3quranAudioMeta, mp3quranChapterUrl} from '../assets/mp3quran-reciter.js';

test('each MP3Quran read keeps its own recording and ayah clock', async()=>{
  const requests=[];
  const fetcher=async url=>{
    requests.push(url);
    return {ok:true,json:async()=>[
      {ayah:1,start_time:0,end_time:1200},
      {ayah:2,start_time:1200,end_time:2600}
    ]};
  };
  for(const [reciter,read,slug] of [[223,123,'mishary-alafasy']]){
    const meta=await fetchMp3quranAudioMeta(reciter,48,2,{fetcher});
    assert.equal(meta.audio_url,`https://cdn.mp3quran.net/audio/${slug}/r1/048.mp3`);
    assert.equal(meta.recording_source,`mp3quran-read-${read}`);
    assert.deepEqual(meta.verse_timings.map(row=>row.verse_key),['48:1','48:2']);
    assert.deepEqual(meta.verse_timings.map(row=>row.segments),[[],[]]);
  }
  assert.deepEqual(requests,[
    'https://mp3quran.net/api/v3/ayat_timing?surah=48&read=123'
  ]);
});

test('rejects incomplete or inconsistent ayah clocks instead of guessing word cuts',()=>{
  const good=[{ayah:1,start_time:0,end_time:1000},{ayah:2,start_time:1000,end_time:2000}];
  assert.throws(()=>mp3quranAudioMeta(223,2,good,3),/count mismatch/);
  assert.throws(()=>mp3quranAudioMeta(223,2,[good[0],{...good[1],ayah:3}],2),/invalid/);
  assert.throws(()=>mp3quranAudioMeta(223,2,[good[0],{...good[1],start_time:900}],2),/invalid/);
  assert.throws(()=>mp3quranChapterUrl(123,48),/Unknown/);
  assert.throws(()=>mp3quranChapterUrl(220,48),/Unknown/);
});
