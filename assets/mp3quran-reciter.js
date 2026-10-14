// MP3Quran's read IDs identify the recording and its matching ayah clock.
// Keep these distinct from QuranCDN IDs and from the existing Afasy recording.
export const MP3QURAN_READS = Object.freeze({
  223: {read:123, slug:'mishary-alafasy', name:'Mişârî el-Afâsî · MP3Quran Murattal'}
});
const AFASY_WORD_SOURCE='mishary_rashid_al_afasy_mp3quran';
let afasyWordPackPromise;

export async function fetchAfasyWordPack({fetcher=fetch}={}){
  if(fetcher!==fetch){
    const response=await fetcher('./assets/afasy-mp3quran-word-timings.json?v=324');
    if(!response.ok)throw Error('Afasy word timing unavailable');
    return response.json();
  }
  afasyWordPackPromise??=fetcher('./assets/afasy-mp3quran-word-timings.json?v=324')
    .then(response=>{
      if(!response.ok)throw Error('Afasy word timing unavailable');
      return response.json();
    }).catch(error=>{afasyWordPackPromise=null;throw error;});
  return afasyWordPackPromise;
}

export function afasyWordAudioMeta(chapter,pack,wordCounts){
  const source=MP3QURAN_READS[223],rows=pack?.rows?.[chapter];
  if(pack?.source_recording!==AFASY_WORD_SOURCE||pack?.release!=='v3.2.0'||
    pack?.audio_alias!=='https://cdn.mp3quran.net/audio/mishary-alafasy/r1/'||
    !Array.isArray(rows)||rows.length!==wordCounts?.length)
    throw Error('Afasy word timing source mismatch');
  let previousEnd=0;
  const verse_timings=rows.map(([start,end,segments],index)=>{
    const count=wordCounts[index],positions=new Set();
    if(!Number.isFinite(start)||!Number.isFinite(end)||start<previousEnd||end<=start||
      !Number.isInteger(count)||count<1||!Array.isArray(segments))
      throw Error(`Afasy verse timing invalid ${chapter}:${index+1}`);
    for(const [pos,from,to] of segments){
      if(!Number.isInteger(pos)||pos<1||pos>count||!Number.isFinite(from)||
        !Number.isFinite(to)||from<start||to>end||to<=from)
        throw Error(`Afasy word timing invalid ${chapter}:${index+1}:${pos}`);
      positions.add(pos);
    }
    if(positions.size!==count)throw Error(`Afasy word timing incomplete ${chapter}:${index+1}`);
    previousEnd=end;
    return {verse_key:`${chapter}:${index+1}`,timestamp_from:start,
      timestamp_to:end,segments};
  });
  return {id:`qua-v3.2.0:${AFASY_WORD_SOURCE}:${chapter}`,
    audio_url:mp3quranChapterUrl(223,chapter),recording_source:`mp3quran-read-${source.read}`,
    verified_word_source:`qua-v3.2.0:${AFASY_WORD_SOURCE}`,verse_timings};
}

export function upgradeAfasyCachedMeta(oldMeta,chapter,pack,wordCounts){
  if(oldMeta?.audio_url!==mp3quranChapterUrl(223,chapter)||
    oldMeta?.recording_source!=='mp3quran-read-123')
    throw Error('Cached Afasy audio does not match the word timing source');
  return {...afasyWordAudioMeta(chapter,pack,wordCounts),
    offline_cache_id:oldMeta.offline_cache_id,
    offline_cache_version:oldMeta.offline_cache_version};
}

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
