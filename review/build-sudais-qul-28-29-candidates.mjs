// Review only: the timing source and MP3 URL must remain paired.
import fs from 'node:fs';
const audit=JSON.parse(fs.readFileSync('review/sudais-qul-28-29-structure.json','utf8'));
fs.mkdirSync('test-results/qul-candidates',{recursive:true});
for(const sid of [28,29]){
  const chapter=audit.chapters[sid];
  if(chapter.issues.length)throw Error(`QUL ${sid} has structural issues`);
  const original=JSON.parse(fs.readFileSync(`test-results/timings/3-${sid}.json`,'utf8'));
  const verse_timings=original.verse_timings.map(old=>{
    const row=chapter.rows[old.verse_key];
    if(!row)throw Error(`Missing ${old.verse_key}`);
    return {verse_key:old.verse_key,timestamp_from:row.time_from,timestamp_to:row.time_to,
      duration:row.time_to-row.time_from,segments:row.segments};
  });
  const candidate={...original,audio_url:chapter.audio.url,file_size:chapter.audio.audio_size,
    duration:chapter.audio.duration*1000,verse_timings,review_source:`qul_sudais_${sid}_paired`};
  delete candidate.source_recording;
  fs.writeFileSync(`test-results/qul-candidates/3-${sid}.json`,JSON.stringify(candidate));
  console.log(JSON.stringify({sid,audio:candidate.audio_url,verses:verse_timings.length,
    first:verse_timings[0].timestamp_from,last:verse_timings.at(-1).timestamp_to}));
}
