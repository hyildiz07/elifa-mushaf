import fs from 'node:fs';
import vm from 'node:vm';

// Candidate build from the local source-matching audit. Never infer a missing
// word's time from its neighbours; all output spans come from QuranLab's
// complete word alignment of an acoustically matched recitation.
const approved=['2:61','2:90','2:282','7:5','16:35','16:45','22:23',
  '39:72','42:52','45:12','73:4'];
const candidate=JSON.parse(fs.readFileSync('test-results/sudais-gap-quranlab-candidates.json'));
const matches=[...JSON.parse(fs.readFileSync('test-results/sudais-gap-source-matches.json')),
  ...JSON.parse(fs.readFileSync('test-results/sudais-second-source-matches.json'))];
const nextMatches=[...JSON.parse(fs.readFileSync('test-results/sudais-gap-next-matches.json')),
  ...JSON.parse(fs.readFileSync('test-results/sudais-second-next-matches.json'))];
const file='assets/audio-timing-overrides-r3-r5.json';
const asset=JSON.parse(fs.readFileSync(file));
asset.source='QuranLab per-ayah word alignment transferred only where three separated PCM windows and the next verse head match the production QuranCDN performance';
const html=fs.readFileSync('index.html','utf8'),c=vm.createContext({});
vm.runInContext(html.split(/\r?\n/).find(line=>line.startsWith('const QTEXT=')),c);
const qtext=vm.runInContext('QTEXT',c);
const norm=s=>s.normalize('NFKD').replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g,'')
  .replace(/[ٱأإآ]/g,'ا').replace(/[ىی]/g,'ي').replace(/ة/g,'ه').replace(/ؤ/g,'و').replace(/ئ/g,'ي')
  .replace(/[^\u0621-\u063A\u0641-\u064A]/g,'');
for(const key of approved){
  const [sid,ay]=key.split(':').map(Number);
  const source=JSON.parse(fs.readFileSync(`test-results/timings/3-${sid}.json`));
  const verse=source.verse_timings.find(v=>v.verse_key===key);
  const next=source.verse_timings.find(v=>v.verse_key===`${sid}:${ay+1}`);
  const row=candidate.find(x=>x.key===key),match=matches.find(x=>x.verse===key&&
    (key==='2:90'||key==='45:12'?x.clipUrl.includes('_192kbps/'):x.clipUrl.includes('_64kbps/')));
  const nextMatch=nextMatches.find(x=>x.verse===`${sid}:${ay+1}`);
  if(!row||!match||match.sourceUrl!==source.audio_url||row.source_url!==source.audio_url)
    throw Error(`${key}: source mismatch`);
  if(match.peaks.length!==3||match.peaks.some(x=>x.corr<.7)||
    Math.max(...match.peaks.map(x=>x.shift))-Math.min(...match.peaks.map(x=>x.shift))>40||
    match.runner.corr>.35)throw Error(`${key}: PCM source identity not strong enough`);
  if(!nextMatch||nextMatch.sourceUrl!==source.audio_url||
    Math.abs(nextMatch.clipStart-next.timestamp_from)>75||
    nextMatch.peaks[0]?.corr<.5||nextMatch.runner.corr>.35)
    throw Error(`${key}: next verse head is not independently matched`);
  const words=qtext[sid][ay-1][2].filter(w=>w[1]===0).map(w=>w[0]);
  if(row.candidate_segments.length!==words.length||row.candidate_missing.length)
    throw Error(`${key}: incomplete canonical text`);
  const segments=row.candidate_segments.map((x,i)=>{
    if(x.word_position!==i+1||x.word_start!==i||x.word_end!==i+1)
      throw Error(`${key}: ambiguous word position ${i+1}`);
    return [i+1,Math.round(match.clipStart+x.start_ms),Math.round(match.clipStart+x.end_ms)];
  });
  if(segments.some((s,i)=>s[1]<verse.timestamp_from||s[2]>verse.timestamp_to||
    s[2]<=s[1]||(i>0&&s[1]<segments[i-1][2]))||
    !next||next.timestamp_from!==verse.timestamp_to)
    throw Error(`${key}: verse or next-verse boundary conflict`);
  const assetKey=`3:${key}`;
  asset.verification[assetKey]={clip_url:match.clipUrl,
    clip_start_ms:Math.round(match.clipStart),
    window_correlations:match.peaks.map(x=>Number(x.corr.toFixed(4))),
    window_offsets_ms:match.peaks.map(x=>x.shift),
    second_peak_correlation:Number(match.runner.corr.toFixed(4)),
    next_clip_url:nextMatch.clipUrl,
    next_clip_start_ms:Math.round(nextMatch.clipStart),
    next_head_correlation:Number(nextMatch.peaks[0].corr.toFixed(4)),
    corrected_rows:'complete QuranLab word alignment on source-matched QDC PCM'};
  asset.rows[assetKey]={url:source.audio_url,text:words.map(norm).join('|'),
    range:[verse.timestamp_from,verse.timestamp_to],next:next.timestamp_from,segments};
}
fs.writeFileSync(file,JSON.stringify(asset,null,2)+'\n');
console.log(JSON.stringify({added:approved.length,keys:approved}));
