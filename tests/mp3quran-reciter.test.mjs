import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fetchMp3quranAudioMeta, mp3quranAudioMeta, mp3quranChapterUrl,
  afasyWordAudioMeta,upgradeAfasyCachedMeta} from '../assets/mp3quran-reciter.js';

const pack=JSON.parse(fs.readFileSync(new URL('../assets/afasy-mp3quran-word-timings.json',import.meta.url)));
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const qtext=JSON.parse(html.match(/^const QTEXT=(.*);$/m)[1]);
const surahs=JSON.parse(html.match(/^const SURAHS=(.*);$/m)[1]);
const wordCounts=sid=>qtext[sid].map(v=>v[2].filter(w=>w[1]===0).length);

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

test('released Afasy word rows align with all 114 exact MP3Quran chapters and displayed words',()=>{
  let verses=0,repeats=0;
  for(const chapter of surahs){
    const meta=afasyWordAudioMeta(chapter.id,pack,wordCounts(chapter.id));
    assert.equal(meta.audio_url,mp3quranChapterUrl(223,chapter.id));
    assert.equal(meta.verse_timings.length,chapter.n);
    for(const verse of meta.verse_timings){
      const count=wordCounts(chapter.id)[Number(verse.verse_key.split(':')[1])-1];
      assert.equal(new Set(verse.segments.map(s=>s[0])).size,count,verse.verse_key);
      if(verse.segments.length>count)repeats++;
      verses++;
    }
  }
  assert.equal(verses,6236);
  assert.ok(repeats>0,'repeated recitation positions remain available for split playback');
  for(const [sid,ay] of [[2,181],[8,6],[13,37],[37,130]]){
    const meta=afasyWordAudioMeta(sid,pack,wordCounts(sid));
    assert.equal(new Set(meta.verse_timings[ay-1].segments.map(s=>s[0])).size,wordCounts(sid)[ay-1]);
  }
});

test('an existing offline Afasy download keeps its MP3 and gains the released word clock',()=>{
  const old=mp3quranAudioMeta(223,48,[{ayah:1,start_time:6100,end_time:11860}],1);
  old.offline_cache_id='existing-download';old.offline_cache_version=2;
  const upgraded=upgradeAfasyCachedMeta(old,48,{
    ...pack,rows:{48:[pack.rows[48][0]]}
  },[wordCounts(48)[0]]);
  assert.equal(upgraded.audio_url,old.audio_url);
  assert.equal(upgraded.offline_cache_id,'existing-download');
  assert.equal(upgraded.verse_timings[0].segments.length,wordCounts(48)[0]);
  assert.throws(()=>upgradeAfasyCachedMeta({...old,audio_url:'https://wrong.example/audio.mp3'},48,
    {...pack,rows:{48:[pack.rows[48][0]]}},[wordCounts(48)[0]]),/does not match/);
});
