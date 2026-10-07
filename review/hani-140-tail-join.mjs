// Review only: independently match 6:140 and 6:141 clips to the same chapter
// around the cumulative 6:139→6:140 join. No production timestamps are made.
import {MPEGDecoder} from 'mpg123-decoder';
import {getCbrIndex,rangeForWindow,alignedRangeOffset} from '../src/mp3-seek.mjs';
import {calibrateRangeTrim,decodeWindow} from '../src/split-audio.mjs';

const chapter='https://download.quranicaudio.com/qdc/hani_ar_rifai/murattal/6.mp3';
const index=await getCbrIndex(chapter);
if(!index)throw Error('No CBR index');
index.trimSamples=await calibrateRangeTrim(index);
if(index.trimSamples==null)throw Error('No trim calibration');
const seek=rangeForWindow(index,2880000,2889000);
const response=await fetch(chapter,{headers:{Range:`bytes=${seek.start}-${seek.end}`}});
if(response.status!==206)throw Error(`Range ${response.status}`);
const bytes=new Uint8Array(await response.arrayBuffer());
const aligned=alignedRangeOffset(bytes,index,seek.start);
if(!aligned)throw Error('No frame alignment');
const corrected=aligned.off-index.trimSamples/index.rate*1000;
const pcm=await decodeWindow(new Blob([bytes.subarray(aligned.skip)]).stream(),
  2880000-corrected,2889000-corrected,{decoderFactory:()=>new MPEGDecoder()});
pcm.off+=corrected;
async function verse(v){
  const url=`https://everyayah.com/data/Hani_Rifai_192kbps/006${v}.mp3`;
  const response=await fetch(url);if(!response.ok)throw Error(`${v} HTTP ${response.status}`);
  const decoder=new MPEGDecoder();await decoder.ready;
  try{return decoder.decode(new Uint8Array(await response.arrayBuffer()));}
  finally{await decoder.free();}
}
const [v140,v141]=await Promise.all([verse(140),verse(141)]);
function corr(v,clipMs,chapterStart,lengthMs){
  const x=pcm.channelData[0],y=v.channelData[0],rate=pcm.sampleRate;
  if(rate!==v.sampleRate)throw Error('Rate mismatch');
  const a=Math.round((chapterStart+clipMs-pcm.off)*rate/1000),b=Math.round(clipMs*rate/1000);
  const n=Math.round(lengthMs*rate/1000);
  if(a<0||a+n>x.length||b+n>y.length)return null;
  let xx=0,yy=0,xy=0;
  for(let i=0;i<n;i+=5){const p=x[a+i],q=y[b+i];xx+=p*p;yy+=q*q;xy+=p*q;}
  return xy/Math.sqrt(xx*yy);
}
function match(v,rough,clipMs,len,radius){
  let best={startMs:null,correlation:-1};
  for(let t=rough-radius;t<=rough+radius;t++){
    const c=corr(v,clipMs,t,len);if(c!=null&&c>best.correlation)best={startMs:t,correlation:c};
  }
  return best;
}
const a=match(v140,2862080,19000,500,100);
const b=match(v141,2881724,5000,500,500);
console.log(JSON.stringify({source:chapter,
  clip140:{start:a,durationMs:v140.samplesDecoded/v140.sampleRate*1000,
    matchedEndMs:a.startMs+v140.samplesDecoded/v140.sampleRate*1000},
  clip141:{start:b,firstQudWordOffsetMs:4200,
    estimatedFirstWordMs:b.startMs+4200},
  gapMs:b.startMs-(a.startMs+v140.samplesDecoded/v140.sampleRate*1000)},null,2));
