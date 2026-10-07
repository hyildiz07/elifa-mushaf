// These verses use an EveryAyah recording with its own QuranLab word alignment.
// Keep every verse on its own recording time axis; 2:145's MP3 also contains
// 2:146–147, so its playable end is earlier than the file's physical end.
export const HUSARY_VERSE_KEYS = new Set([
  '28:71','3:127','3:177','4:9','4:10','4:11','4:23','43:32','5:64','9:36','2:145',
  '11:26','11:116','114:6','23:80','23:91','33:23','35:3','38:30','38:44',
  '40:31','46:33','58:8','8:40'
]);

// Review: review/hani-6-139-full-verse-qud-candidate.json. The linked
// EveryAyah file is the same Hânî performance as the chapter MP3. Its 22
// words and the adjacent 6:140 onset were independently checked. The audio
// remains on EveryAyah (reciter/producer rights); no MP3 is distributed here.
export const HANI_6139_FULL_VERSE = Object.freeze({
  verse_key:'6:139',reciter:5,
  audio_url:'https://everyayah.com/data/Hani_Rifai_192kbps/006139.mp3',
  file_size:647755,
  audio_sha256:'f8a51b189b7f35c5fb566d9366323a8e79126c4adcb15f119bb4c4f076cef26f',
  playback_end_ms:26984.48979591837,
  chapter_audio_url:'https://download.quranicaudio.com/qdc/hani_ar_rifai/murattal/6.mp3',
  chapter_match_start_ms:2835105,
  // This is inside the independently matched silence before 6:140's first
  // spoken word (~2862100 ms), after the 6:139 clip ends (~2862089.49 ms).
  chapter_resume_ms:2862090,
  attribution:'Hânî er-Rifâî · EveryAyah; audio rights remain with reciter/producer'
});

export function verifiedHaniFullVerseKey(reciter,surah,ayah){
  return Number(reciter)===5&&Number(surah)===6&&Number(ayah)===139?'6:139':null;
}

export function validateHaniFullVerseSource(row,wordCount,chapterUrl){
  const expected=HANI_6139_FULL_VERSE;
  if(wordCount!==22||chapterUrl!==expected.chapter_audio_url||
    !row||Object.keys(expected).some(key=>row[key]!==expected[key]))
    throw Error('HANI_FULL_VERSE_SOURCE');
  return row;
}

export async function verifyHaniFullVerseBytes(row,bytes){
  validateHaniFullVerseSource(row,22,row?.chapter_audio_url);
  if(!(bytes instanceof ArrayBuffer)||bytes.byteLength!==row.file_size)
    throw Error('HANI_FULL_VERSE_SOURCE_SIZE');
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  const hash=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
  if(hash!==row.audio_sha256)throw Error('HANI_FULL_VERSE_SOURCE_HASH');
}

export function makeHaniFullVerseTiming(row){
  const end=validateHaniFullVerseSource(row,22,row?.chapter_audio_url).playback_end_ms;
  return {ws:{},segs:[],ay:{139:[0,end]},verseRanges:{139:[0,end]},
    verseEnds:{139:end},verseSegments:{139:[]},end};
}

export function verifiedHusaryVerseKey(reciter,surah,ayah){
  const key=`${surah}:${ayah}`;
  return Number(reciter)===12&&HUSARY_VERSE_KEYS.has(key)?key:null;
}

export function validateHusaryVerseRow(catalog,key,wordCount){
  if(catalog?.status!=='split-verse-source-v1'||catalog?.reciter!==12||catalog?.recording!=='Husary_Muallim_128kbps'||
    catalog?.dataset!=='quranlab/quran-audio@55d48a9cfc9dec3836efc9b0f8631c4ff6399c28')
    throw Error('Doğrulanmış âyet kaynağı uyuşmuyor');
  const row=catalog.rows?.[key];
  const [surah,ayah]=key.split(':').map(Number);
  const expectedUrl=`https://everyayah.com/data/Husary_Muallim_128kbps/${String(surah).padStart(3,'0')}${String(ayah).padStart(3,'0')}.mp3`;
  if(!row||row.verse_key!==key||row.audio_url!==expectedUrl||
    !Number.isInteger(row.file_size)||row.file_size<10000||
    !Number.isFinite(row.audio_duration_ms)||row.audio_duration_ms<=0||
    row.timestamp_from!==0||!Number.isFinite(row.timestamp_to)||
    row.timestamp_to<=0||row.timestamp_to>=row.audio_duration_ms||
    !Number.isInteger(wordCount)||wordCount<1||row.segments?.length!==wordCount)
    throw Error('Doğrulanmış âyet sesi geçersiz');
  const playbackEnd=row.playback_end_ms??row.audio_duration_ms;
  if(!Number.isFinite(playbackEnd)||playbackEnd<row.timestamp_to||
    playbackEnd>row.audio_duration_ms||
    (key==='114:6'&&(row.audio_sha256!=='010db0dcd7fda9f2339e8ae46c361b3d9c0c0cb39e87891f9896cb3cde5c7b54'||
      row.file_size!==186378||row.audio_duration_ms!==11572||
      playbackEnd!==5500||row.timestamp_to!==4800))||
    (key==='2:145'&&(row.audio_sha256!=='cc4640fa78a211b598a6e5f47880a5ff39112d3f8279d5260f860f1e1a1cad28'||
      row.file_size!==1890314||row.audio_duration_ms!==118073||
      playbackEnd!==61250||row.timestamp_to!==60750||
      row.chapter_audio_url!=='https://download.quranicaudio.com/qdc/khalil_al_husary/muallim/2.mp3'||
      row.chapter_base_byte!==95617872)))
    throw Error('Doğrulanmış âyet kesimi geçersiz');
  for(let i=0;i<wordCount;i++){
    const seg=row.segments[i],prev=row.segments[i-1];
    if(!Array.isArray(seg)||seg.length!==3||seg[0]!==i+1||
      !Number.isFinite(seg[1])||!Number.isFinite(seg[2])||
      seg[1]<0||seg[2]<=seg[1]||seg[2]>row.timestamp_to||
      (prev&&seg[1]<prev[2]))throw Error('Doğrulanmış kelime sınırı geçersiz');
  }
  return row;
}

export function makeHusaryVerseTiming(row,ayah){
  const ws={},segs=[];
  for(const [pos,from,to] of row.segments){ws[`${ayah}:${pos}`]=[from,to];segs.push([from,to]);}
  const playbackEnd=row.playback_end_ms??row.audio_duration_ms;
  return {
    ws,segs,
    ay:{[ayah]:[0,playbackEnd]},
    verseRanges:{[ayah]:[0,playbackEnd]},
    verseEnds:{[ayah]:playbackEnd},
    verseSegments:{[ayah]:row.segments},
    end:playbackEnd
  };
}

export async function verifyHusaryVerseBytes(row,bytes){
  if(row?.verse_key!=='2:145'&&row?.verse_key!=='114:6')return;
  if(!(bytes instanceof ArrayBuffer)||bytes.byteLength!==row.file_size)
    throw Error('HUSARY_VERSE_SOURCE_SIZE');
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  const hash=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
  if(hash!==row.audio_sha256)throw Error('HUSARY_VERSE_SOURCE_HASH');
}

// The only three internal 2:145 cuts independently sit inside both QuranLab
// word gaps and QUD phrase gaps, with measured near-silence. Other apparent
// word boundaries (5/23/28) do not have that acoustic evidence.
export function makeHusary145PhraseRanges(row){
  if(row?.verse_key!=='2:145'||row.audio_sha256!==
    'cc4640fa78a211b598a6e5f47880a5ff39112d3f8279d5260f860f1e1a1cad28'||
    row.playback_end_ms!==61250||row.segments?.length!==32)
    throw Error('HUSARY_PHRASE_SOURCE');
  const phrases=[[1,10,0,15465],[11,14,15465,27140],
    [15,19,27140,38665],[20,32,38665,61250]];
  for(let i=0;i<phrases.length-1;i++){
    const [,last,,cut]=phrases[i];
    const left=row.segments[last-1],right=row.segments[last];
    if(left?.[0]!==last||right?.[0]!==last+1||
      !(cut>left[2]&&cut<right[1]))throw Error('HUSARY_PHRASE_GAP');
  }
  return phrases.map(([fromWord,toWord,fromMs,toMs])=>
    ({fromWord,toWord,fromMs,toMs}));
}
