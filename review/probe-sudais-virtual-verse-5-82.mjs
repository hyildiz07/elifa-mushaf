// Review-only transport proof. A virtual clip is decoded from the original
// pinned QDC chapter MP3 and compared with an independently full-decoded WAV.
// This does not certify verse endpoints or internal word cuts.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {getVerifiedVbrIndex,getVerifiedVbrIndexFromBlob,rangeForWindow} from '../src/mp3-seek.mjs';
import {prepareSelectedRange} from '../src/split-audio.mjs';

const url='https://download.quranicaudio.com/qdc/abdurrahmaan_as_sudais/murattal/5.mp3';
const bytes=fs.readFileSync('test-results/sudais-qdc-5.mp3');
const sha=crypto.createHash('sha256').update(bytes).digest('hex');
if(sha!=='16fad03b000d69492da95e9f970f220ae097a6693815917924b43f1730ae8cdb')
  throw Error('QDC source SHA mismatch');
const blob=new Blob([bytes],{type:'audio/mpeg'});
const catalog=JSON.parse(fs.readFileSync('assets/sudais-vbr-index.json','utf8'));
const remote=process.argv.includes('--remote');
const index=remote?await getVerifiedVbrIndex(url,catalog.rows[url]):
  await getVerifiedVbrIndexFromBlob(blob,catalog.rows[url]);
if(!index)throw Error('Pinned VBR index mismatch');
const context={createBuffer(channels,length,sampleRate){
  const data=Array.from({length:channels},()=>new Float32Array(length));
  return {numberOfChannels:channels,length,sampleRate,duration:length/sampleRate,
    copyToChannel(samples,ch){data[ch].set(samples)},getChannelData(ch){return data[ch]}};
}};
const fromMs=1867803,toMs=1897033;
const audio={sourceUrl:url,recordingUrl:url,offlineBlob:remote?null:blob,reciterId:3,cbrIndex:index,
  verseRanges:{82:[fromMs,toMs]},verseSegments:{82:[]}};
const start=performance.now();
const clip=await prepareSelectedRange(audio,fromMs,toMs,context);
const elapsedMs=performance.now()-start;
if(clip.lo>fromMs+1||clip.hi<toMs-1)throw Error('Selected clip incomplete');

const wav=fs.readFileSync('test-results/sudais-qdc-align/5-82-to-84.wav');
if(wav.toString('ascii',0,4)!=='RIFF')throw Error('Missing full-decode WAV');
const rate=wav.readUInt32LE(24),channels=wav.readUInt16LE(22),referenceFromMs=1852870;
if(rate!==clip.buffer.sampleRate||channels!==clip.buffer.numberOfChannels)
  throw Error(`Sample format mismatch ${rate}/${channels}`);
function matchWindow(atMs,spanMs=1000){
  const a=clip.buffer.getChannelData(0),clipAt=Math.round((atMs-clip.off)*rate/1000),
    wavAt=Math.round((atMs-referenceFromMs)*rate/1000),n=Math.round(spanMs*rate/1000);
  if(clipAt<0||wavAt<0||clipAt+n>a.length||44+(wavAt+n)*channels*2>wav.length)
    throw Error(`Window ${atMs} unavailable`);
  let aa=0,bb=0,ab=0,error=0;
  for(let i=0;i<n;i+=3){const x=a[clipAt+i],y=wav.readInt16LE(44+((wavAt+i)*channels)*2)/32768;
    aa+=x*x;bb+=y*y;ab+=x*y;error+=(x-y)*(x-y);}
  return {at_ms:atMs,correlation:ab/Math.sqrt(aa*bb),difference_rms:Math.sqrt(error/Math.ceil(n/3))};
}
const result={status:'transport-only-not-a-cut-approval',source_url:url,source_sha256:sha,
  transport:remote?'remote-verified-range':'local-verified-blob-slice',
  virtual_clip_range_ms:[fromMs,toMs],decoded_window_ms:[clip.lo,clip.hi],
  elapsed_ms:Math.round(elapsedMs),sample_rate:rate,
  indexed_source_bytes:audio.cbrIndex?.fileSize,
  source_window_bytes:(()=>{const seek=rangeForWindow(audio.cbrIndex,fromMs-2500,toMs+250);
    return seek.end-seek.start+1})(),
  windows:[1869000,1881000,1895000].map(ms=>matchWindow(ms))};
fs.writeFileSync(`review/sudais-virtual-verse-5-82-${remote?'remote':'local'}.json`,
  JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));
