import fs from 'node:fs';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';

// QUA v3.2.0 uses another MP3 of the same performance. Five decoded waveform
// windows across 3:124 align to the QuranCDN MP3 at -2743 ms (review probe).
// Transfer the complete verse together so a missing first word cannot inherit
// the original provider's mislabeled second-word range.
const release='https://github.com/QUD-Technologies/quranic-universal-audio/releases/download/v3.2.0/';
async function asset(name){
  const path=`test-results/qua-source-${name}`;
  if(!fs.existsSync(path)){
    const response=await fetch(release+name);
    if(!response.ok)throw Error(`${name}: HTTP ${response.status}`);
    fs.mkdirSync('test-results',{recursive:true});
    fs.writeFileSync(path,Buffer.from(await response.arrayBuffer()));
  }
  return fs.readFileSync(path);
}
const source='test-results/qua-source-saud_al_shuraim_mp3quran.zip';
const manifest=JSON.parse(await asset('manifest.json'));
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const zip=await asset('saud_al_shuraim_mp3quran.zip');
if(manifest.release_version!=='v3.2.0'||
  sha(zip)!==manifest.recitations.saud_al_shuraim_mp3quran.sha256)
  throw Error('QUA source integrity mismatch');
const catalog=JSON.parse(await asset('catalog.json'));
const recording=catalog.recitations.find(x=>x.slug==='saud_al_shuraim_mp3quran');
if(recording?.riwayah!=='hafs_an_asim'||
   recording.audio.chapter_urls['3']!=='https://server7.mp3quran.net/shur/003.mp3')
  throw Error('Unexpected QUA recording');
const qdc=JSON.parse(fs.readFileSync('test-results/timings/10-3.json'));
if(qdc.audio_url!=='https://download.quranicaudio.com/qdc/saud_ash-shuraym/murattal/003.mp3')
  throw Error('Unexpected QuranCDN recording');
const rows=JSON.parse(zlib.gunzipSync(execFileSync('tar',['-xOf',source,'word_timestamps.json.gz']))).rows;
const occurrence=rows.filter(x=>x[0]==='3:124'&&x[3]);
if(occurrence.length!==1)throw Error('Complete verse occurrence unavailable');
const row=occurrence[0],following=rows[rows.indexOf(row)+1];
if(following?.[0]!=='3:125'||row[5].length!==13||
   row[5].some((s,i)=>s[0]!==i+1||s[2]<=s[1]||(i&&s[1]<row[5][i-1][2])))
  throw Error('Verse word timeline invalid');
const html=fs.readFileSync('index.html','utf8'),start=html.indexOf('const QTEXT=');
const c=vm.createContext({});vm.runInContext(html.slice(start,html.indexOf('\n',start)),c);
const words=vm.runInContext('QTEXT[3][123][2].filter(w=>w[1]===0).map(w=>w[0])',c);
const norm=s=>s.normalize('NFKD').replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g,'')
  .replace(/[ٱأإآ]/g,'ا').replace(/[ىی]/g,'ي').replace(/ة/g,'ه').replace(/ؤ/g,'و').replace(/ئ/g,'ي')
  .replace(/[^\u0621-\u063A\u0641-\u064A]/g,'');
const scriptBuffer=await asset('digital_khatt_v2_script.json');
if(sha(scriptBuffer)!==manifest.static_refs['digital_khatt_v2_script.json'].sha256)
  throw Error('QUA script integrity mismatch');
const script=JSON.parse(scriptBuffer);
const reference=Array.from({length:13},(_,i)=>norm(script[`3:124:${i+1}`]?.text||''));
if(words.length!==13||words.map(norm).join('|')!==reference.join('|'))
  throw Error('Quran text or word positions differ');
const offset=-2743;
const converted={url:qdc.audio_url,text:words.map(norm).join('|'),
  range:[row[1]+offset,row[2]+offset],next:following[1]+offset,
  segments:row[5].map(s=>[s[0],s[1]+offset,s[2]+offset])};
if(converted.segments[0][1]<converted.range[0]||
   converted.segments.at(-1)[2]>converted.range[1]||
   converted.next<converted.range[1])throw Error('Converted source boundary invalid');
const output={source:'Qur’anic Universal Audio v3.2.0; waveform-aligned QuranCDN source',
  license:'CC BY 4.0',recording:'saud_al_shuraim_mp3quran',source_url:recording.audio.chapter_urls['3'],
  alignment_ms:offset,alignment_evidence:'review/shuraim-3-124-source-check.json',
  rows:{'10:3:124':converted}};
fs.writeFileSync('assets/audio-timing-overrides-r10.json',JSON.stringify(output));
console.log(JSON.stringify({key:'10:3:124',words:words.length,range:converted.range,next:converted.next}));
