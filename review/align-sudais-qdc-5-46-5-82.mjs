// Review-only: align excerpts cut from the *same* QuranCDN chapter MP3 that
// the production player uses. No result here is a production timing override.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {getVerifiedVbrIndexFromBlob} from '../src/mp3-seek.mjs';
import {MPEGDecoder} from 'mpg123-decoder';
import {decodeWindow,prepareWindow} from '../src/split-audio.mjs';

const endpoint='https://hetchyy-quranic-universal-aligner.hf.space/api/v1';
const catalog=JSON.parse(fs.readFileSync('assets/sudais-vbr-index.json','utf8'));
const surah=Number(process.env.QDC_SURA||5);
if(!Number.isInteger(surah)||surah<1||surah>114)throw Error('Invalid QDC_SURA');
const timing=JSON.parse(fs.readFileSync(`test-results/timings/3-${surah}.json`,'utf8'));
const source=timing.audio_url;
const bytes=fs.readFileSync(`test-results/sudais-qdc-${surah}.mp3`);
const blob=new Blob([bytes],{type:'audio/mpeg'});
const index=await getVerifiedVbrIndexFromBlob(blob,catalog.rows[source]);
if(!index||bytes.length!==catalog.rows[source].fileSize)throw Error('Source MP3 signature mismatch');
const sourceSha256=crypto.createHash('sha256').update(bytes).digest('hex');
const context={createBuffer(channels,length,sampleRate){
  const data=Array.from({length:channels},()=>new Float32Array(length));
  return {numberOfChannels:channels,length,sampleRate,duration:length/sampleRate,
    copyToChannel(samples,ch){data[ch].set(samples)},getChannelData(ch){return data[ch]}};
}};
function wav(buffer,off,from,to){
  const lo=Math.max(0,Math.round((from-off)*buffer.sampleRate/1000));
  const hi=Math.min(buffer.length,Math.round((to-off)*buffer.sampleRate/1000));
  if(!(lo<hi&&off<=from&&off+buffer.duration*1000>=to-1))throw Error('Incomplete source window');
  const channels=buffer.numberOfChannels,frames=hi-lo,body=frames*channels*2,out=Buffer.alloc(44+body);
  out.write('RIFF',0);out.writeUInt32LE(body+36,4);out.write('WAVEfmt ',8);out.writeUInt32LE(16,16);
  out.writeUInt16LE(1,20);out.writeUInt16LE(channels,22);out.writeUInt32LE(buffer.sampleRate,24);
  out.writeUInt32LE(buffer.sampleRate*channels*2,28);out.writeUInt16LE(channels*2,32);out.writeUInt16LE(16,34);
  out.write('data',36);out.writeUInt32LE(body,40);
  let at=44;for(let i=lo;i<hi;i++)for(let ch=0;ch<channels;ch++){
    const sample=buffer.getChannelData(ch)[i];out.writeInt16LE(Math.max(-32768,Math.min(32767,Math.round(sample*32767))),at);at+=2;
  }
  return out;
}
async function postJson(url,body){
  const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(300000)});
  const t=await r.text();if(!r.ok)throw Error(`${url}: HTTP ${r.status} ${t.slice(0,500)}`);return JSON.parse(t);
}
fs.mkdirSync('review/sudais-qdc-align',{recursive:true});
fs.mkdirSync('test-results/sudais-qdc-align',{recursive:true});
const requested=process.argv.slice(2).map(Number);
const ayahs=requested.length?requested:[46,82];
for(const ay of ayahs){
  const row=timing.verse_timings.find(v=>v.verse_key===`${surah}:${ay}`);
  const toAy=Number(process.env.QDC_TO_AY||ay);
  const last=timing.verse_timings.find(v=>v.verse_key===`${surah}:${toAy}`);
  const next=timing.verse_timings.find(v=>v.verse_key===`${surah}:${toAy+1}`);
  if(!row)throw Error(`Missing ${surah}:${ay}`);
  if(!last||toAy<ay)throw Error(`Invalid QDC_TO_AY ${toAy}`);
  const audio={sourceUrl:source,recordingUrl:source,offlineBlob:blob,cbrIndex:index,reciterId:3,
    verseRanges:{[ay]:[row.timestamp_from,last.timestamp_to],...(next?{[ay+1]:[next.timestamp_from,next.timestamp_to]}:{})},
    verseSegments:{[ay]:row.segments}};
  const prepared=process.env.QDC_FULL_DECODE==='1'?
    await decodeWindow(blob.stream(),row.timestamp_from,last.timestamp_to,
      {decoderFactory:()=>new MPEGDecoder()}):
    await prepareWindow(audio,ay,context,{positions:[]});
  const pcm=prepared.buffer??{sampleRate:prepared.sampleRate,length:prepared.channelData[0].length,
    duration:prepared.channelData[0].length/prepared.sampleRate,
    numberOfChannels:prepared.channelData.length,getChannelData:ch=>prepared.channelData[ch]};
  const excerpt=wav(pcm,prepared.off,row.timestamp_from,last.timestamp_to);
  const name=`${surah}-${ay}${toAy===ay?'':`-to-${toAy}`}`,file=`test-results/sudais-qdc-align/${name}.wav`;
  fs.writeFileSync(file,excerpt);
  const form=new FormData();form.append('audio',new Blob([excerpt],{type:'audio/wav'}),`${name}.wav`);
  form.append('riwayah','hafs');form.append('model_name',process.env.QDC_MODEL||'Large');form.append('device','GPU');
  const response=await fetch(`${endpoint}/align/audio`,{method:'POST',body:form,signal:AbortSignal.timeout(300000)});
  const body=await response.text();
  if(!response.ok)throw Error(`${name}: HTTP ${response.status}: ${body.slice(0,500)}`);
  const aligned=JSON.parse(body);
  const suffix=`${process.env.QDC_FULL_DECODE==='1'?'-full':''}${process.env.QDC_MODEL==='Base'?'-base':''}`,
    output=`review/sudais-qdc-align/${name}${suffix}`;
  fs.writeFileSync(`${output}-align.json`,JSON.stringify({status:'machine-review-only',
    source_url:source,source_file_size:bytes.length,source_sha256:sourceSha256,
    excerpt_file:file,excerpt_sha256:crypto.createHash('sha256').update(excerpt).digest('hex'),
    excerpt_from_ms:row.timestamp_from,excerpt_to_ms:last.timestamp_to,
    provider_segments:row.segments,aligner:aligned},null,2)+'\n');
  const wordTimes=await postJson(`${endpoint}/sessions/${aligned.audio_id}/timestamps`,{granularity:'words'});
  fs.writeFileSync(`${output}-words.json`,JSON.stringify({status:'machine-review-only',
    source_sha256:sourceSha256,excerpt_from_ms:row.timestamp_from,
    note:'Returned times are relative to exact source excerpt; add excerpt_from_ms to map into chapter time. Audition remains required.',
    result:wordTimes},null,2)+'\n');
  console.log(JSON.stringify({verse:`${surah}:${ay}`,excerpt_bytes:excerpt.length,audio_id:aligned.audio_id,
    groups:aligned.segments?.map(s=>[s.ref_from,s.ref_to,s.time_from,s.time_to,s.confidence,s.has_missing_words,s.has_repeated_words]),
    word_result_keys:Object.keys(wordTimes)}));
}
