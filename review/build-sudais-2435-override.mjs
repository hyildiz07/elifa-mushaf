import fs from 'node:fs';
import vm from 'node:vm';

const source=JSON.parse(fs.readFileSync('review/sudais-24-35-transfer-candidate.json','utf8'));
const html=fs.readFileSync('index.html','utf8');
const textStart=html.indexOf('const QTEXT=');
const textLine=html.slice(textStart,html.indexOf('\n',textStart));
const qtext=vm.runInNewContext(textLine+';QTEXT');
const words=qtext[24][34][2].filter(word=>word[1]===0).map(word=>word[0]);
const timingKey=word=>word.normalize('NFKD').replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g,'')
  .replace(/[ٱأإآ]/g,'ا').replace(/[ىی]/g,'ي').replace(/ة/g,'ه').replace(/ؤ/g,'و').replace(/ئ/g,'ي')
  .replace(/[^\u0621-\u063A\u0641-\u064A]/g,'');
if(source.verse!=='24:35'||words.length!==48||source.mapped_words.length!==48||
  source.chapter_audio_url!=='https://download.quranicaudio.com/qdc/abdurrahmaan_as_sudais/murattal/24.mp3'||
  source.source_identity.window_correlations.length!==10||
  source.source_identity.window_correlations.some(correlation=>correlation<0.87)||
  words.some((word,index)=>timingKey(word)!==timingKey(source.mapped_words[index].word)))
  throw Error('Source performance or canonical text is not verified');
const [from,to]=source.current_qdc_range_ms;
if(to!==source.next_qdc_start_ms||source.candidate_cuts.length!==9)
  throw Error('Verse end or proposed cuts changed');
const segments=source.mapped_words.map((word,index)=>[
  index+1,word.from_ms,index===words.length-1?to:word.to_ms
]);
if(segments.some(([position,start,end],index)=>position!==index+1||start<from||end>to||
    end<=start||(index>0&&start<segments[index-1][2])))
  throw Error('Word intervals are incomplete or overlapping');
const acoustic=JSON.parse(fs.readFileSync('review/sudais-2435-playback-check.json','utf8'));
const allowedCuts=[4,9,14,19,25,32,35,44];
if(acoustic.source!==source.chapter_audio_url||allowedCuts.some(position=>
  !acoustic.allAcousticCuts.some(cut=>cut.afterWord===position&&
    cut.cutMs>=segments[position-1][2]&&cut.cutMs<=segments[position][1])))
  throw Error('A proposed break lacks a same-recording acoustic pause');

const path='assets/audio-timing-overrides-r3-r5.json';
const overrides=JSON.parse(fs.readFileSync(path,'utf8'));
overrides.verification['3:24:35']={
  clip_url:source.timing_audio_url,
  timing_credit:source.timing_credit,
  timing_license_url:source.timing_license_url,
  matching_pcm_windows:source.source_identity.window_correlations,
  chapter_offset_ms:source.source_identity.chapter_offset_ms,
  offset_spread_ms:source.source_identity.offset_spread_ms,
  approved_acoustic_cuts:allowedCuts,
  note:'Local listening preview. Candidate cuts need two-sided playback review before live deployment.'
};
overrides.rows['3:24:35']={url:source.chapter_audio_url,
  text:words.map(timingKey).join('|'),range:[from,to],next:to,segments,
  allowedCuts};
fs.writeFileSync(path,JSON.stringify(overrides,null,2)+'\n');
console.log('Prepared local Südeys 24:35 timing preview');
