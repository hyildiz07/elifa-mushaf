import fs from 'node:fs';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';

// Version-pinned feasibility check. Optional --write-candidates writes paired
// chapter MP3 URLs and timings; it never applies timings to a different MP3.
const release='https://github.com/QUD-Technologies/quranic-universal-audio/releases/download/v3.2.0/';
const candidates=[
  [1,'abdulbasit_abdulsamad_mujawwad_tarteel'],
  [2,'abdulbasit_abdulsamad_tarteel'],
  [4,'abu_bakr_al_shatri_tarteel'],
  [6,'mahmoud_khalil_al_husary_qdc_128k'],
  [7,'mishary_rashid_al_afasy_2008_qdc'],
  [9,'mohammed_siddiq_al_minshawi_mp3quran'],
  [10,'saud_al_shuraim_mp3quran'],
  [97,'yasser_al_dosari_archive'],
];
const outputArg=process.argv.find(arg=>arg.startsWith('--write-candidates='));
const candidateDir=outputArg?.slice('--write-candidates='.length);
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
function sha(data){return crypto.createHash('sha256').update(data).digest('hex');}
function norm(s){return s.normalize('NFKD').replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g,'')
  .replace(/[ٱأإآ]/g,'ا').replace(/[ىی]/g,'ي').replace(/ة/g,'ه').replace(/ؤ/g,'و').replace(/ئ/g,'ي')
  .replace(/[^\u0621-\u063A\u0641-\u064A]/g,'');}
function mapWords(source,reference){
  if(source.join('')!==reference.join(''))return null;
  const positions=[];let cursor=0;
  for(let i=0;i<source.length;i++){
    let joined='';const first=cursor;
    while(cursor<reference.length&&joined.length<source[i].length){joined+=reference[cursor++];positions[cursor]=i+1;}
    if(joined!==source[i]||first===cursor)return null;
  }
  return cursor===reference.length?positions:null;
}
function safePositions(segments,count){
  const safe=[];
  for(let pos=1;pos<count;pos++){
    const left=segments.filter(s=>s[0]<=pos),right=segments.filter(s=>s[0]>pos);
    const end=left.filter(s=>s[0]===pos),next=right.filter(s=>s[0]===pos+1);
    if(end.length&&next.length&&Math.max(...left.map(s=>s[2]))===Math.max(...end.map(s=>s[2]))&&
      Math.min(...right.map(s=>s[1]))>=Math.max(...left.map(s=>s[2])))safe.push(pos);
  }
  return safe;
}
const manifest=JSON.parse(await asset('manifest.json'));
if(manifest.release_version!=='v3.2.0')throw Error('Unexpected QUA release');
const scriptBuffer=await asset('digital_khatt_v2_script.json');
if(sha(scriptBuffer)!==manifest.static_refs['digital_khatt_v2_script.json'].sha256)throw Error('Script checksum mismatch');
const script=JSON.parse(scriptBuffer),catalog=JSON.parse(await asset('catalog.json'));
const html=fs.readFileSync('index.html','utf8'),start=html.indexOf('const QTEXT='),context=vm.createContext({});
vm.runInContext(html.slice(start,html.indexOf('\n',start)),context);
const qtext=vm.runInContext('QTEXT',context);
const exceptions=JSON.parse(fs.readFileSync('docs/split-exceptions-v244.json','utf8')).cases;
const verses=Object.entries(qtext).flatMap(([sid,items])=>items.map((_,i)=>`${sid}:${i+1}`));
const output=[];
for(const [rid,slug] of candidates){
  const zip=await asset(`${slug}.zip`);
  if(sha(zip)!==manifest.recitations[slug]?.sha256)throw Error(`${slug}: checksum mismatch`);
  const recording=catalog.recitations.find(r=>r.slug===slug);
  if(recording?.riwayah!=='hafs_an_asim')throw Error(`${slug}: recording mismatch`);
  const rows=JSON.parse(zlib.gunzipSync(execFileSync('tar',['-xOf',`test-results/qua-source-${slug}.zip`,'word_timestamps.json.gz']))).rows;
  const byKey=new Map();
  for(const row of rows){const group=byKey.get(row[0])||[];group.push(row);byKey.set(row[0],group);}
  const rowIndex=new Map(rows.map((row,i)=>[row,i]));
  const chapters=new Map(),failedChapters=new Set();
  const result={rid,slug,accepted:0,safeWithinEight:0,exceptions:0,exceptionsAccepted:0,exceptionsSafeWithinEight:0,reasons:{},overEightExamples:[]};
  const exceptionKeys=new Set(exceptions.filter(x=>x.reciter===rid).map(x=>x.verse));
  result.exceptions=exceptionKeys.size;
  for(const key of verses){
    const [sid,ay]=key.split(':').map(Number),canonical=byKey.get(key)?.filter(r=>r[3]);
    let reason='';
    if(!recording.audio.chapter_urls[String(sid)])reason='missing chapter MP3';
    else if(canonical?.length!==1)reason='missing or ambiguous complete verse';
    const source=qtext[sid][ay-1][2].filter(w=>w[1]===0).map(w=>norm(w[0]));
    const reference=[];
    if(!reason)for(let i=1;script[`${key}:${i}`];i++){
      const word=norm(script[`${key}:${i}`].text);if(word)reference.push(word);
    }
    const mapped=!reason?mapWords(source,reference):null;
    if(!reason&&!mapped)reason='text or word boundary mismatch';
    const row=canonical?.[0],segments=!reason?row[5].map(s=>[mapped[s[0]],s[1],s[2]]):null;
    if(!reason&&(segments.some((s,i)=>!Number.isInteger(s[0])||s[0]<1||s[0]>source.length||
      s[1]<row[1]||s[2]>row[2]||s[2]<=s[1]||(i>0&&s[1]<segments[i-1][2]))||
      source.some((_,i)=>!segments.some(s=>s[0]===i+1))))reason='invalid word timing';
    const following=row?rows[rowIndex.get(row)+1]:null;
    const next=following?.[0]?.startsWith(`${sid}:`)?following[1]:null;
    if(!reason&&next!=null&&next<row[2])reason='next timeline span overlaps complete verse';
    if(reason){result.reasons[reason]=(result.reasons[reason]||0)+1;failedChapters.add(sid);continue;}
    result.accepted++;
    if(candidateDir){
      const chapter=chapters.get(sid)||{id:`qua-v3.2.0:${slug}:${sid}`,audio_url:recording.audio.chapter_urls[String(sid)],
        file_size:null,source_recording:slug,verse_timings:[],trustedNext:{}};
      chapter.verse_timings.push({verse_key:key,timestamp_from:row[1],timestamp_to:row[2],segments});
      if(next!=null)chapter.trustedNext[ay]=next;
      chapters.set(sid,chapter);
    }
    if(exceptionKeys.has(key))result.exceptionsAccepted++;
    const points=[0,...safePositions(segments,source.length),source.length];
    let longest=0;
    for(let i=1;i<points.length;i++)longest=Math.max(longest,points[i]-points[i-1]);
    if(longest<=8){result.safeWithinEight++;if(exceptionKeys.has(key))result.exceptionsSafeWithinEight++;}
    else if(result.overEightExamples.length<12)result.overEightExamples.push({key,words:source.length,longest});
  }
  if(candidateDir){
    fs.mkdirSync(candidateDir,{recursive:true});
    for(const [sid,chapter] of chapters){
      if(failedChapters.has(sid))continue; // Never mix two performances in one chapter.
      if(chapter.verse_timings.length!==qtext[sid].length)throw Error(`${slug} chapter ${sid}: incomplete coverage`);
      fs.writeFileSync(`${candidateDir}/${rid}-${sid}.json`,JSON.stringify(chapter));
    }
  }
  output.push(result);
}
console.log(JSON.stringify({source:'QUA v3.2.0',verseCount:verses.length,results:output},null,2));
