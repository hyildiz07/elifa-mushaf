import fs from 'node:fs';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';

// QUA v3.2.0 is pinned. Its Hani file points to the very same MP3 URLs used
// by QuranCDN reciter 5. Never transfer timings to a different recording.
const release='https://github.com/QUD-Technologies/quranic-universal-audio/releases/download/v3.2.0/';
async function asset(name){
  const path='test-results/qua-source-'+name;
  if(!fs.existsSync(path)){
    const response=await fetch(release+name);
    if(!response.ok)throw Error(`${name}: HTTP ${response.status}`);
    fs.mkdirSync('test-results',{recursive:true});
    fs.writeFileSync(path,Buffer.from(await response.arrayBuffer()));
  }
  return fs.readFileSync(path);
}
function sha(buffer){return crypto.createHash('sha256').update(buffer).digest('hex');}
function norm(s){return s.normalize('NFKD').replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g,'')
  .replace(/[ٱأإآ]/g,'ا').replace(/[ىی]/g,'ي').replace(/ة/g,'ه').replace(/ؤ/g,'و').replace(/ئ/g,'ي')
  .replace(/[^\u0621-\u063A\u0641-\u064A]/g,'');}
function mapWordPositions(source,reference){
  if(source.join('')!==reference.join(''))return null;
  const positions=[];let cursor=0;
  for(let i=0;i<source.length;i++){
    let joined='';const first=cursor;
    while(cursor<reference.length&&joined.length<source[i].length){
      joined+=reference[cursor++];positions[cursor]=i+1;
    }
    if(joined!==source[i]||first===cursor)return null;
  }
  return cursor===reference.length?positions:null;
}

const manifest=JSON.parse(await asset('manifest.json'));
if(manifest.release_version!=='v3.2.0'||manifest.license!=='CC-BY-4.0')throw Error('Unexpected release');
const zip=await asset('hani_al_rifai_qdc_128k.zip');
const scriptBuffer=await asset('digital_khatt_v2_script.json');
if(sha(zip)!==manifest.recitations.hani_al_rifai_qdc_128k.sha256||
   sha(scriptBuffer)!==manifest.static_refs['digital_khatt_v2_script.json'].sha256)throw Error('Release checksum mismatch');
const script=JSON.parse(scriptBuffer),catalog=JSON.parse(await asset('catalog.json'));
const recording=catalog.recitations.find(r=>r.slug==='hani_al_rifai_qdc_128k');
if(!recording||recording.riwayah!=='hafs_an_asim')throw Error('Recording metadata mismatch');
const words=JSON.parse(zlib.gunzipSync(execFileSync('tar',['-xOf','test-results/qua-source-hani_al_rifai_qdc_128k.zip','word_timestamps.json.gz']))).rows;
const rowsByKey=new Map();
for(const row of words){const list=rowsByKey.get(row[0])||[];list.push(row);rowsByKey.set(row[0],list);}
const html=fs.readFileSync('index.html','utf8'),start=html.indexOf('const QTEXT='),context=vm.createContext({});
vm.runInContext(html.slice(start,html.indexOf('\n',start)),context);
const qtext=vm.runInContext('QTEXT',context);
const targets=new Map(JSON.parse(fs.readFileSync('docs/split-exceptions-v242.json','utf8')).cases
  .filter(x=>x.reciter===5).map(x=>[x.verse,x]));
// QuranCDN omits at least one playable word position in these verses. QUA
// points to the identical Hani chapter MP3 and can replace a verse only after
// the source URL, text map, complete word list, and next boundary pass below.
for(const key of [
  '1:1','12:62','2:38','22:19','23:36','24:58','26:118','3:15','3:61',
  '3:162','3:197','39:39','41:30','48:29','5:2','5:57','57:20','59:5',
  '59:8','68:51','7:155','89:1','89:30','9:21','9:109'
])targets.set(key,{reciter:5,verse:key});
// The provider's final word can extend far beyond its own verse range. Check
// all chapters, including short ayat absent from the original split backlog.
// Only the version-pinned timing for the identical MP3 may replace such rows.
for(const file of fs.readdirSync('test-results/timings').filter(x=>/^5-\d+\.json$/.test(x))){
  const chapter=JSON.parse(fs.readFileSync(`test-results/timings/${file}`,'utf8'));
  for(const vt of chapter.verse_timings){
    if((vt.segments||[]).some(s=>s[2]>vt.timestamp_to+300)){
      targets.set(vt.verse_key,{reciter:5,verse:vt.verse_key});
      // Replacing this verse can reveal that its predecessor used the old,
      // incorrect next-verse start. Pair the predecessor with the same source.
      const [sid,ay]=vt.verse_key.split(':').map(Number);
      if(ay>1)targets.set(`${sid}:${ay-1}`,{reciter:5,verse:`${sid}:${ay-1}`});
    }
  }
}
const overrides={},rejected={};
for(const exception of targets.values()){
  const key=exception.verse,[sid,ay]=key.split(':').map(Number);
  const af=JSON.parse(fs.readFileSync(`test-results/timings/5-${sid}.json`,'utf8'));
  const url=recording.audio.chapter_urls[String(sid)];
  const occurrences=rowsByKey.get(key)||[];
  const source=qtext[sid]?.[ay-1]?.[2]?.filter(w=>w[1]===0).map(w=>w[0])||[];
  // QUA marks one complete occurrence per verse. A repeated partial or full
  // performance is omitted from learning cards to retain word order.
  const canonical=occurrences.filter(o=>o[3]);
  const row=canonical.length===1?canonical[0]:null;
  let reason=null;
  if(!url||url!==af.audio_url)reason='audio source differs';
  else if(!row)reason='complete occurrence unavailable';
  const reference=[];
  if(!reason)for(let i=1;script[`${key}:${i}`];i++){
    const word=norm(script[`${key}:${i}`].text);
    if(word)reference.push(word);
  }
  const normalized=source.map(norm);
  const positions=!reason?mapWordPositions(normalized,reference):null;
  if(!reason&&!positions)reason='text or word boundary differs';
  const segments=!reason?row[5].map(s=>[positions[s[0]],s[1],s[2]]):null;
  if(!reason&&(segments.some((s,i)=>!Number.isInteger(s[0])||s[0]<1||s[0]>source.length||
    s[1]<row[1]||s[2]>row[2]||s[2]<=s[1]||(i>0&&s[1]<segments[i-1][2]))||
    normalized.some((_,i)=>!segments.some(s=>s[0]===i+1))))reason='word timing invalid';
  const following=words[words.indexOf(row)+1];
  const next=following?.[0]?.startsWith(sid+':')?following:null;
  if(!reason&&ay<qtext[sid].length&&(!next||next[1]<row[2]))reason='next verse boundary invalid';
  if(reason){rejected[key]=reason;continue;}
  overrides[`5:${key}`]={url,text:normalized.join('|'),range:[row[1],row[2]],
    next:next?.[1]??null,segments};
}
const result={source:'Qur’anic Universal Audio v3.2.0',license:'CC BY 4.0',release,
  recording:'hani_al_rifai_qdc_128k',rows:overrides};
fs.writeFileSync('assets/audio-timing-overrides-v3.json',JSON.stringify(result));
console.log(JSON.stringify({accepted:Object.keys(overrides).length,rejected,bytes:fs.statSync('assets/audio-timing-overrides-v3.json').size}));
