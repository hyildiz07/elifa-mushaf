import fs from 'node:fs';
import vm from 'node:vm';
import {getCbrIndex} from '../src/mp3-seek.mjs';

// Separate split-mode verse source. The chapter MP3 must not be paired with these timings:
// eight original chapter files physically truncate the corresponding verse.
const revision='55d48a9cfc9dec3836efc9b0f8631c4ff6399c28';
const keys=['28:71','3:127','3:177','4:9','4:10','4:11','4:23','43:32','5:64','9:36',
  '11:26','11:116','114:6','23:80','23:91','33:23','35:3','38:30','38:44',
  '40:31','46:33','58:8','8:40'];
const sourceUrl='https://huggingface.co/datasets/quranlab/quran-audio';
const html=fs.readFileSync('index.html','utf8'),start=html.indexOf('const QTEXT='),context=vm.createContext({});
vm.runInContext(html.slice(start,html.indexOf('\n',start)),context);
const qtext=vm.runInContext('QTEXT',context);
const rows={};
for(const key of keys){
  const [sid,ay]=key.split(':').map(Number);
  const count=qtext[sid][ay-1][2].filter(w=>w[1]===0).length;
  const offset=Object.keys(qtext).filter(x=>+x<sid).reduce((n,x)=>n+qtext[x].length,0)+ay-1;
  const endpoint=`https://datasets-server.huggingface.co/rows?dataset=quranlab/quran-audio&config=husary-muallim&split=train&offset=${offset}&length=1&revision=${revision}`;
  const response=await fetch(endpoint);
  if(!response.ok)throw Error(`${key} source HTTP ${response.status}`);
  const row=(await response.json()).rows?.[0]?.row;
  if(row?.verse_key!==key||row.recitation_id!=='husary-muallim'||row.riwayah!=='hafs-asim'||
    row.style!=='muallim'||row.timing_source!=='cpfair/quran-align'||!row.has_word_timing||
    !row.audio_url?.startsWith('https://everyayah.com/data/Husary_Muallim_128kbps/')||
    row.segments?.length!==count)throw Error(`${key} source identity or coverage mismatch`);
  const segments=row.segments.map((s,i)=>{
    if(s.word_position!==i+1||s.word_start!==i||s.word_end!==i+1||
      !Number.isInteger(s.start_ms)||!Number.isInteger(s.end_ms)||s.end_ms<=s.start_ms||
      s.end_ms>row.duration_ms||(i&&s.start_ms<row.segments[i-1].end_ms))
      throw Error(`${key} word timing invalid at ${i+1}`);
    return [i+1,s.start_ms,s.end_ms];
  });
  const index=await getCbrIndex(row.audio_url,{allowTagless:true});
  if(!index||index.bitrate!==128)throw Error(`${key} MP3 index unavailable`);
  const audioDurationMs=Math.round(index.frames*index.samples/index.rate*1000);
  if(audioDurationMs<row.duration_ms||audioDurationMs-row.duration_ms>8000)
    throw Error(`${key} audio/timing duration mismatch: ${audioDurationMs}/${row.duration_ms}`);
  const head=await fetch(row.audio_url,{method:'HEAD',headers:{Origin:'https://mushaf.elifaplatform.com'}});
  const bytes=Number(head.headers.get('Content-Length'));
  if(!head.ok||head.headers.get('Access-Control-Allow-Origin')!=='*'||!Number.isSafeInteger(bytes)||bytes<10000)
    throw Error(`${key} audio source or CORS unavailable`);
  rows[key]={audio_url:row.audio_url,file_size:bytes,audio_duration_ms:audioDurationMs,
    verse_key:key,timestamp_from:0,timestamp_to:row.duration_ms,segments};
  if(key==='114:6'){
    // The clip repeats the complete verse after 6.3 s. Stop in measured
    // silence after the first reading; pin bytes before trusting that cut.
    rows[key].playback_end_ms=5500;
    rows[key].audio_sha256='010db0dcd7fda9f2339e8ae46c361b3d9c0c0cb39e87891f9896cb3cde5c7b54';
  }
}
const out={status:'split-verse-source-v1',recording:'Husary_Muallim_128kbps',reciter:12,
  dataset:`quranlab/quran-audio@${revision}`,dataset_url:sourceUrl,
  timing_source:'cpfair/quran-align',timing_license:'CC-BY-4.0',
  audio_source:'everyayah.com',audio_rights:'© reciter / producer; external link only',
  excluded:{},
  rows};
// This row has a separately established stop before the next two verses.
// Preserve it when regenerating the catalog from the pinned QuranLab revision.
const existing=JSON.parse(fs.readFileSync('assets/verified-verse-audio-r12.json','utf8'));
if(existing.rows?.['2:145'])out.rows['2:145']=existing.rows['2:145'];
fs.writeFileSync('assets/verified-verse-audio-r12.json',JSON.stringify(out));
console.log(JSON.stringify({candidates:Object.keys(rows).length,bytes:fs.statSync('assets/verified-verse-audio-r12.json').size}));
