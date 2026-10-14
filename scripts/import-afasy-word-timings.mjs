import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';

// QUA v3.2.0 is a released CC-BY-4.0 alignment of this exact MP3Quran
// performance. The four merges account for QuranCDN's combined display words.
const SOURCE='mishary_rashid_al_afasy_mp3quran';
const WORD_SHA='d088d20e32252bdbbf14d78eba2b76f3f38d5fc0d5d7ed418ee879085cf3f889';
const CATALOG_SHA='78e8e7723aa6aada16c620a0a386722b0e0b2b9859367613c273ae294eb60057';
const MERGED_WORDS={'2:181':3,'8:6':4,'13:37':8,'37:130':3};
const sourceDir=process.argv[2];
if(!sourceDir)throw Error('Pass the extracted QUA v3.2.0 Afasy MP3Quran ZIP directory');
function sourceFile(name,sha){
  const bytes=fs.readFileSync(path.join(sourceDir,name));
  if(createHash('sha256').update(bytes).digest('hex')!==sha)throw Error(`${name} hash mismatch`);
  return bytes;
}
const catalogue=JSON.parse(sourceFile('catalog.json',CATALOG_SHA));
const source=JSON.parse(gunzipSync(sourceFile('word_timestamps.json.gz',WORD_SHA)));
if(catalogue.slug!==SOURCE||catalogue.coverage?.surahs!==114||
  catalogue.coverage?.ayahs!==6236||source._meta?.slug!==SOURCE||
  source._meta?.verse_count!==6236||source._meta?.tier!=='word')
  throw Error('Unexpected QUA recitation');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const qtext=JSON.parse(html.match(/^const QTEXT=(.*);$/m)?.[1]||'null');
const surahs=JSON.parse(html.match(/^const SURAHS=(.*);$/m)?.[1]||'null');
if(surahs?.length!==114||!qtext)throw Error('Mushaf reference missing');

const grouped=new Map();
for(const row of source.rows){
  const [key,start,end,,silence,segments]=row;
  if(!Array.isArray(segments)||!Number.isFinite(start)||!Number.isFinite(end)||end<=start)
    throw Error(`Invalid source row ${key}`);
  if(!grouped.has(key))grouped.set(key,[]);
  grouped.get(key).push({start,end,silence,segments});
}
if(grouped.size!==6236)throw Error(`Incomplete QUA word coverage: ${grouped.size}`);
const rows={};
let total=0,merged=0,repeated=0;
for(const chapter of surahs){
  const sid=chapter.id,items=[];
  if(catalogue.audio.chapter_urls[sid]!==
    `https://server8.mp3quran.net/afs/${String(sid).padStart(3,'0')}.mp3`)
    throw Error(`Unexpected chapter audio ${sid}`);
  for(let ay=1;ay<=chapter.n;ay++){
    const key=`${sid}:${ay}`,take=grouped.get(key);
    if(!take?.length)throw Error(`Missing ${key}`);
    const wordCount=qtext[sid]?.[ay-1]?.[2]?.filter(w=>w[1]===0).length;
    const mergeAt=MERGED_WORDS[key]||0;
    const sorted=take.flatMap(r=>r.segments).sort((a,b)=>a[1]-b[1]);
    const mapped=[];
    let previousSourcePosition=null;
    for(const [position,start,end] of sorted){
      const pos=mergeAt&&position>mergeAt?position-1:position;
      if(!Number.isInteger(pos)||pos<1||pos>wordCount||
        !Number.isFinite(start)||!Number.isFinite(end)||end<=start)
        throw Error(`Invalid word ${key}:${position}`);
      const previous=mapped.at(-1);
      if(mergeAt&&position===mergeAt+1&&previousSourcePosition===mergeAt&&
        previous?.[0]===pos&&start>=previous[1]-20){
        previous[2]=Math.max(previous[2],end);
        merged++;
      }else mapped.push([pos,start,end]);
      previousSourcePosition=position;
    }
    const positions=new Set(mapped.map(s=>s[0]));
    if(positions.size!==wordCount||Array.from({length:wordCount},(_,i)=>i+1)
      .some(pos=>!positions.has(pos)))throw Error(`Word count mismatch ${key}`);
    const from=Math.min(...take.map(r=>r.start)),to=Math.max(...take.map(r=>r.end));
    if(mapped.some((s,i)=>s[1]<from||s[2]>to||
      (i>0&&s[1]<mapped[i-1][1])))throw Error(`Word clock out of range ${key}`);
    items.push([from,to,mapped]);
    total++;if(take.length>1)repeated++;
  }
  rows[sid]=items;
}
const output={source_recording:SOURCE,release:'v3.2.0',license:'CC-BY-4.0',
  audio_origin:'https://server8.mp3quran.net/afs/',
  audio_alias:'https://cdn.mp3quran.net/audio/mishary-alafasy/r1/',
  rows};
const file=new URL('../assets/afasy-mp3quran-word-timings.json',import.meta.url);
fs.writeFileSync(file,JSON.stringify(output)+'\n');
console.log(JSON.stringify({chapters:Object.keys(rows).length,verses:total,
  repeatedVerses:repeated,mergedDisplayWords:merged,bytes:fs.statSync(file).size}));
