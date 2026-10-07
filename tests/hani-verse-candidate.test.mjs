import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {HANI_6139_FULL_VERSE,verifiedHaniFullVerseKey,
  validateHaniFullVerseSource,makeHaniFullVerseTiming,
  verifyHaniFullVerseBytes} from '../src/verified-verse-audio.mjs';

const root=new URL('../',import.meta.url);
const read=path=>fs.readFileSync(new URL(path,root),'utf8');
const candidate=JSON.parse(read('review/verified-verse-audio-r5-candidate.json'));
const review=JSON.parse(read('review/hani-audio-review.json'));
const context=vm.createContext({});
vm.runInContext(read('index.html').split(/\r?\n/).find(line=>line.startsWith('const QTEXT=')),context);
const QTEXT=vm.runInContext('QTEXT',context);

test('Hânî 6:139 candidate covers every canonical word exactly once',()=>{
  const row=candidate.rows['6:139'];
  const words=QTEXT[6][138][2].filter(word=>word[1]===0);
  assert.equal(candidate.status,'split-verse-source-candidate-v1');
  assert.equal(candidate.review_status,'not-connected-pending-word-audition');
  assert.equal(candidate.reciter,5);
  assert.equal(words.length,22);
  assert.equal(row.segments.length,words.length);
  assert.equal(row.verse_key,'6:139');
  assert.equal(row.audio_url,'https://everyayah.com/data/Hani_Rifai_64kbps/006139.mp3');
  assert.match(row.sha256,/^[0-9a-f]{64}$/);
  assert.ok(row.audio_duration_ms>row.timestamp_to);
  for(let i=0;i<row.segments.length;i++){
    const [position,from,to]=row.segments[i];
    assert.equal(position,i+1);
    assert.ok(Number.isInteger(from)&&Number.isInteger(to)&&from>=0&&to>from);
    assert.ok(to<=row.timestamp_to);
    if(i)assert.ok(from>=row.segments[i-1][2]&&from-row.segments[i-1][2]<=10,
      `unexpected gap before word ${position}`);
  }
  assert.equal(row.segments.at(-1)[2],row.timestamp_to);
});

test('Hânî 6:139 candidate ends before independently matched 6:140 clip',()=>{
  const row=candidate.rows['6:139'],v=candidate.verification;
  assert.equal(v.independent_word_identity_confirmed,false);
  assert.ok(v.three_window_correlation.every(value=>value>.6));
  assert.ok(v.max_window_shift_spread_ms<=20);
  assert.ok(v.next_verse_clip_correlation>.9);
  assert.equal(v.last_word_chapter_end_ms,v.chapter_clip_start_ms+row.timestamp_to);
  assert.ok(Math.abs(v.clip_chapter_end_ms-v.chapter_clip_start_ms-row.audio_duration_ms)<=1);
  assert.ok(v.next_verse_clip_start_ms-v.last_word_chapter_end_ms>=300);
  assert.ok(v.next_verse_clip_start_ms-v.clip_chapter_end_ms>=0);
});

test('the old word-level Hânî candidate is not used for split playback',()=>{
  assert.ok(!read('index.html').includes('verified-verse-audio-r5-candidate.json'));
  assert.ok(!read('src/verified-verse-audio.mjs').includes('verified-verse-audio-r5-candidate.json'));
});

test('only the exact same-performance Hânî 6:139 source is eligible for full playback',async()=>{
  const row=HANI_6139_FULL_VERSE;
  const evidence=JSON.parse(read('review/hani-6-139-full-verse-qud-candidate.json'));
  assert.equal(verifiedHaniFullVerseKey(5,6,139),'6:139');
  assert.equal(verifiedHaniFullVerseKey(5,34,46),null);
  assert.equal(verifiedHaniFullVerseKey(12,6,139),null);
  assert.equal(validateHaniFullVerseSource(row,22,row.chapter_audio_url),row);
  assert.equal(row.audio_url,evidence.source_url);
  assert.equal(row.audio_sha256,evidence.source_sha256);
  assert.equal(row.file_size,evidence.source_bytes);
  assert.equal(row.playback_end_ms,evidence.decoded_duration_ms);
  assert.equal(row.chapter_match_start_ms,evidence.independent_evidence.chapter_matched_source_start_ms);
  assert.ok(row.chapter_resume_ms>row.chapter_match_start_ms+row.playback_end_ms);
  assert.ok(row.chapter_resume_ms<evidence.independent_evidence.next_verse_chapter_matched_start_ms+20);
  const timing=makeHaniFullVerseTiming(row);
  assert.deepEqual(timing.verseRanges[139],[0,row.playback_end_ms]);
  assert.equal(timing.verseEnds[139],row.playback_end_ms);
  assert.equal(timing.verseSegments[139].length,0); // no guessed word cuts
  assert.throws(()=>validateHaniFullVerseSource(row,21,row.chapter_audio_url),/HANI_FULL_VERSE_SOURCE/);
  assert.throws(()=>validateHaniFullVerseSource(row,22,row.chapter_audio_url+'?other'),/HANI_FULL_VERSE_SOURCE/);
  assert.throws(()=>validateHaniFullVerseSource({...row,audio_sha256:'wrong'},22,row.chapter_audio_url),/HANI_FULL_VERSE_SOURCE/);
  await assert.rejects(verifyHaniFullVerseBytes(row,new ArrayBuffer(row.file_size-1)),/SOURCE_SIZE/);
  await assert.rejects(verifyHaniFullVerseBytes(row,new ArrayBuffer(row.file_size)),/SOURCE_HASH/);
});

test('normal and repeat plans use the complete 6:139 file; unverified 140 remains blocked',()=>{
  const html=read('index.html');
  const extract=name=>{const start=html.indexOf(`function ${name}(`);assert.ok(start>=0,name);
    return html.slice(start,html.indexOf('\n}',start)+2);};
  const c=vm.createContext({SET:{reciter:5,startPad:0,endPad:-90,repOn:true,rep:4},
    curS:6,HUSARY_CHAPTER_GAPS:new Set(),pieceCursor:0});
  for(const name of ['husaryNormalRanges','hani139NormalRanges','verifiedNormalRanges',
    'normalVerseStep','unsafeHaniNormalStep','stepBounds','stepReps'])
    vm.runInContext(extract(name),c);
  const chapter={recordingUrl:HANI_6139_FULL_VERSE.chapter_audio_url,
    ay:{138:[2798653,2834508],139:[2834444,2861169],140:[2861533,2881098],141:[2881584,2923669]},
    verseRanges:{138:[2798653,2834437],139:[2834444,2861526],
      140:[2861533,2881577],141:[2881584,2923551]}};
  const single=c.normalVerseStep(chapter,139,139,{x:1,dyn:true,ayEnd:139});
  assert.equal(single.preserveTail,true);
  assert.equal(single.wholeVerse,true);
  assert.equal(c.unsafeHaniNormalStep(single),false);
  assert.deepEqual(Array.from(single.sourceRanges,p=>[p.verseSource,p.f,p.t]),[[139,0,null]]);
  single.sourceRanges[0].t=HANI_6139_FULL_VERSE.playback_end_ms;
  assert.deepEqual([c.stepBounds(single).f,c.stepBounds(single).t],
    [0,HANI_6139_FULL_VERSE.playback_end_ms]);
  assert.equal(c.stepReps(single),4);
  const combined=c.normalVerseStep(chapter,138,139,{x:1,dyn:true,ayEnd:139});
  assert.deepEqual(Array.from(combined.sourceRanges,p=>[p.from,p.to,p.f,p.t]),
    [[138,138,2798653,2835105],[139,139,0,null]]);
  assert.equal(c.unsafeHaniNormalStep(combined),false);
  assert.equal(c.unsafeHaniNormalStep(c.normalVerseStep(chapter,139,140,{ayEnd:140})),true);
  assert.equal(c.normalVerseStep(chapter,141,141,{ayEnd:141}).f,2881584);
  const other={...chapter,recordingUrl:chapter.recordingUrl+'?other'};
  assert.equal(c.unsafeHaniNormalStep(c.normalVerseStep(other,139,140,{ayEnd:140})),true);
});

test('local listening review maps the full candidate and neighboring verse without applying it',()=>{
  assert.equal(review.status,'local-human-listening-review-only');
  assert.deepEqual(review.cases.map(item=>item.id),['6:139','34:46']);
  const item=review.cases[0],row=candidate.rows['6:139'];
  assert.equal(item.verseAudio,row.audio_url);
  assert.equal(item.verseAudioSha256,row.sha256);
  assert.equal(item.wordContext.length,23);
  for(let i=0;i<row.segments.length;i++){
    const [position,from,to]=row.segments[i],entry=item.wordContext[i];
    assert.equal(entry.position,position);
    assert.equal(entry.arabic,QTEXT[6][138][2].filter(w=>w[1]===0)[i][0]);
    assert.deepEqual(entry.candidateMs,[item.chapterClipStartMs+from,item.chapterClipStartMs+to]);
  }
  assert.equal(item.wordContext.at(-1).position,'6:140/klip');
  assert.equal(item.wordContext.at(-1).candidateMs[1],null);
  assert.ok(item.windows.some(w=>w.source==='next'));
  assert.ok(review.cases[1].windows.some(w=>w.id==='34-extra'));
  assert.ok(review.cases[1].wordContext.some(w=>w.position==='ek ses'&&w.arabic==='Kimliği belirsiz'));
  const html=read('review/hani-audio-review.html');
  const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(script);
  assert.doesNotThrow(()=>new vm.Script(script));
});
