// MP3Quran's read IDs identify the recording and its matching ayah clock.
// Keep these distinct from QuranCDN IDs and from the existing Afasy recording.
export const MP3QURAN_READS = Object.freeze({
  223: {read:123, slug:'mishary-alafasy', name:'Mişârî el-Afâsî · MP3Quran Murattal'}
});

export function mp3quranChapterUrl(reciterId, chapter){
  const source=MP3QURAN_READS[reciterId];
  if(!source||!Number.isInteger(chapter)||chapter<1||chapter>114)
    throw Error('Unknown MP3Quran recording or chapter');
  return `https://cdn.mp3quran.net/audio/${source.slug}/r1/${String(chapter).padStart(3,'0')}.mp3`;
}

export function mp3quranAudioMeta(reciterId, chapter, rows, verseCount){
  const source=MP3QURAN_READS[reciterId];
  if(!source||!Array.isArray(rows)||rows.length!==verseCount||!verseCount)
    throw Error('MP3Quran ayah timing count mismatch');
  let previousEnd=0;
  const verse_timings=rows.map((row,index)=>{
    const start=row.start_time,end=row.end_time;
    if(row.ayah!==index+1||!Number.isFinite(start)||!Number.isFinite(end)||
      start<previousEnd||end<=start)throw Error('MP3Quran ayah timing invalid');
    previousEnd=end;
    return {verse_key:`${chapter}:${index+1}`,timestamp_from:start,timestamp_to:end,
      duration:end-start,segments:[]};
  });
  return {id:`mp3quran-${source.read}-${chapter}`,audio_url:mp3quranChapterUrl(reciterId,chapter),
    recording_source:`mp3quran-read-${source.read}`,verse_timings};
}

export async function fetchMp3quranAudioMeta(reciterId, chapter, verseCount,{fetcher=fetch}={}){
  const source=MP3QURAN_READS[reciterId];
  if(!source)throw Error('Unknown MP3Quran recording');
  const url=`https://mp3quran.net/api/v3/ayat_timing?surah=${chapter}&read=${source.read}`;
  const response=await fetcher(url,{signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw Error(`MP3Quran timing unavailable (${response.status})`);
  return mp3quranAudioMeta(reciterId,chapter,await response.json(),verseCount);
}
