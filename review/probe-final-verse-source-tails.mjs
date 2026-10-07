// Read-only source comparison. Run: node review/probe-final-verse-source-tails.mjs
import {MPEGDecoder} from 'mpg123-decoder';
import {getCbrIndex,rangeForWindow,alignedRangeOffset} from '../src/mp3-seek.mjs';
import {calibrateRangeTrim,decodeWindow} from '../src/split-audio.mjs';

const cases=[
  ['sudais-2:286','https://download.quranicaudio.com/qdc/abdurrahmaan_as_sudais/murattal/2.mp3',
    'https://everyayah.com/data/Abdurrahmaan_As-Sudais_192kbps/002286.mp3'],
  ['sudais-36:83','https://download.quranicaudio.com/qdc/abdurrahmaan_as_sudais/murattal/36.mp3',
    'https://everyayah.com/data/Abdurrahmaan_As-Sudais_192kbps/036083.mp3'],
  ['hani-2:286','https://download.quranicaudio.com/qdc/hani_ar_rifai/murattal/2.mp3',
    'https://everyayah.com/data/Hani_Rifai_192kbps/002286.mp3'],
];

async function bytes(url,range){
  const response=await fetch(url,range?{headers:{Range:`bytes=${range[0]}-${range[1]}`}}:{});
  if(!response.ok||range&&response.status!==206)throw Error(`${response.status} ${url}`);
  return new Uint8Array(await response.arrayBuffer());
}
async function size(url){
  const response=await fetch(url,{method:'HEAD'});
  if(!response.ok)throw Error(`${response.status} ${url}`);
  return Number(response.headers.get('content-length'));
}
async function decode(data){
  const decoder=new MPEGDecoder();await decoder.ready;
  try{return decoder.decode(data);}finally{await decoder.free();}
}
function tail(pcm,ms=10){
  const x=pcm.channelData[0],n=Math.round(pcm.sampleRate*ms/1000);
  let sum=0;for(let i=x.length-n;i<x.length;i++)sum+=x[i]*x[i];
  return {rms:Math.sqrt(sum/n),lastSample:x.at(-1)};
}
function monoMs(pcm){
  const x=pcm.channelData[0],rate=pcm.sampleRate,y=new Float32Array(Math.floor(x.length/rate*1000));
  for(let i=0;i<y.length;i++){
    const lo=Math.floor(i*rate/1000),hi=Math.floor((i+1)*rate/1000);
    let sum=0;for(let j=lo;j<hi;j++)sum+=x[j];y[i]=sum/(hi-lo);
  }
  return y;
}
function correlation(x,y,p,q,n=1200){
  if(p<0||q<0||p+n>x.length||q+n>y.length)return -Infinity;
  let xx=0,yy=0,xy=0;
  for(let i=0;i<n;i+=2){const a=x[p+i],b=y[q+i];xx+=a*a;yy+=b*b;xy+=a*b;}
  return xy/Math.sqrt(xx*yy||1);
}

for(const [key,chapterUrl,verseUrl] of cases){
  const chapterBytes=await size(chapterUrl);
  const chapterTailStart=Math.max(0,chapterBytes-2_000_000);
  const [chapterTail,verse]=await Promise.all([
    bytes(chapterUrl,[chapterTailStart,chapterBytes-1]),bytes(verseUrl),
  ]);
  const probes=[.1,.3,.5,.7,.9].map(f=>{
    const verseOffset=Math.floor(verse.length*f);
    const tailOffset=Buffer.from(chapterTail).indexOf(verse.subarray(verseOffset,verseOffset+4096));
    return tailOffset<0?null:chapterTailStart+tailOffset-verseOffset;
  });
  const encodedMatch=probes.every(x=>x!==null&&x===probes[0]);
  const clipStartsInFetchedTail=encodedMatch&&probes[0]>=chapterTailStart;
  let lastDifferentByte=-1;
  if(clipStartsInFetchedTail){
    const match=chapterTail.subarray(probes[0]-chapterTailStart,probes[0]-chapterTailStart+verse.length);
    for(let i=0;i<verse.length;i++)if(match[i]!==verse[i])lastDifferentByte=i;
  }
  const matchingSuffixBytes=clipStartsInFetchedTail?verse.length-lastDifferentByte-1:0;
  const matchingEof=matchingSuffixBytes>verse.length*.9&&probes[0]+verse.length===chapterBytes;
  if(matchingEof){
    const [c,v]=await Promise.all([
      decode(await bytes(chapterUrl,[chapterBytes-300_000,chapterBytes-1])),decode(verse),
    ]);
    const n=Math.round(.2*c.sampleRate),cx=c.channelData[0],vx=v.channelData[0];
    let maxDifference=0;for(let i=0;i<n;i++)maxDifference=Math.max(maxDifference,
      Math.abs(cx[cx.length-n+i]-vx[vx.length-n+i]));
    console.log(JSON.stringify({key,chapterBytes,verseBytes:verse.length,byteProbeOffsets:probes,
      matchingSuffixBytes,firstMatchingSuffixByte:lastDifferentByte+1,
      clipEndsAtChapterEof:true,
      last200msPcmMaxDifference:maxDifference,last10ms:tail(c)}));
    continue;
  }

  // Hânî's verse file uses another encoding. Align decoded audio near its end.
  const index=await getCbrIndex(chapterUrl);
  index.trimSamples=await calibrateRangeTrim(index);
  if(index.trimSamples==null)throw Error('Hânî chapter trim not calibrated');
  const fileEnd=(index.frames*index.samples-index.trimSamples)/index.rate*1000;
  const range=rangeForWindow(index,fileEnd-70_000,fileEnd);
  const rangeBytes=await bytes(chapterUrl,[range.start,range.end]);
  const aligned=alignedRangeOffset(rangeBytes,index,range.start);
  if(!aligned)throw Error('Hânî chapter range not frame-aligned');
  const offset=aligned.off-index.trimSamples/index.rate*1000;
  const c=await decodeWindow(new Blob([rangeBytes.subarray(aligned.skip)]).stream(),
    fileEnd-70_000-offset,fileEnd-offset,{decoderFactory:()=>new MPEGDecoder()});
  const v=await decode(verse),chapterStart=c.off+offset;
  const x=monoMs(c),y=monoMs(v),clipMs=v.samplesDecoded/v.sampleRate*1000;
  const anchor=y.length-10_000,roughStart=fileEnd-clipMs;
  const center=Math.round(roughStart+anchor-chapterStart);
  let best={p:null,correlation:-Infinity};
  for(let p=center-1000;p<=center+1000;p++){
    const score=correlation(x,y,p,anchor);
    if(score>best.correlation)best={p,correlation:score};
  }
  const matchedStart=chapterStart+best.p-anchor;
  console.log(JSON.stringify({key,chapterBytes,verseBytes:verse.length,byteProbeOffsets:probes,matchingSuffixBytes,
    fileEndMs:fileEnd,chapterWindowStartMs:chapterStart,clipDurationMs:clipMs,matchedStartMs:matchedStart,
    matchCorrelation:best.correlation,clipEndMs:matchedStart+clipMs,
    fileEndMinusClipEndMs:fileEnd-matchedStart-clipMs,
    chapterLast10ms:tail(c),clipLast10ms:tail(v)}));
}
