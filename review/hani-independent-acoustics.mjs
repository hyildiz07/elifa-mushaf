// Independent acoustic probe for review only. Does not generate playback data.
import {MPEGDecoder} from 'mpg123-decoder';
import {getCbrIndex,rangeForWindow,alignedRangeOffset} from '../src/mp3-seek.mjs';
import {calibrateRangeTrim,decodeWindow} from '../src/split-audio.mjs';

const chapterUrl=n=>`https://download.quranicaudio.com/qdc/hani_ar_rifai/murattal/${n}.mp3`;
const verseUrl=(n,v,bitrate=64)=>`https://everyayah.com/data/Hani_Rifai_${bitrate}kbps/${String(n).padStart(3,'0')}${String(v).padStart(3,'0')}.mp3`;

async function chapterWindow(n,from,to){
  const url=chapterUrl(n),index=await getCbrIndex(url);
  if(!index)throw Error(`No checked CBR index for chapter ${n}`);
  index.trimSamples=await calibrateRangeTrim(index);
  if(index.trimSamples==null)throw Error(`No exact range calibration for chapter ${n}`);
  const seek=rangeForWindow(index,from,to);
  const response=await fetch(url,{headers:{Range:`bytes=${seek.start}-${seek.end}`}});
  if(response.status!==206)throw Error(`No range response for chapter ${n}: ${response.status}`);
  const bytes=new Uint8Array(await response.arrayBuffer());
  const aligned=alignedRangeOffset(bytes,index,seek.start);
  if(!aligned)throw Error(`No verified frame alignment for chapter ${n}`);
  const correctedOff=aligned.off-index.trimSamples/index.rate*1000;
  const out=await decodeWindow(new Blob([bytes.subarray(aligned.skip)]).stream(),
    from-correctedOff,to-correctedOff,{decoderFactory:()=>new MPEGDecoder()});
  out.off+=correctedOff;
  return out;
}

async function fullVerse(n,v,bitrate=64){
  const response=await fetch(verseUrl(n,v,bitrate));
  if(!response.ok)throw Error(`Verse ${n}:${v}: ${response.status}`);
  const bytes=new Uint8Array(await response.arrayBuffer());
  const decoder=new MPEGDecoder();await decoder.ready;
  try{return {url:verseUrl(n,v,bitrate),bytes:bytes.length,...decoder.decode(bytes)};}
  finally{await decoder.free();}
}

function rms(pcm,from,to){
  const x=pcm.channelData[0],sr=pcm.sampleRate,off=pcm.off||0;
  const a=Math.max(0,Math.floor((from-off)*sr/1000)),b=Math.min(x.length,Math.ceil((to-off)*sr/1000));
  if(b<=a)return null;
  let sum=0,peak=0;for(let i=a;i<b;i++){sum+=x[i]*x[i];peak=Math.max(peak,Math.abs(x[i]));}
  return {rms:+Math.sqrt(sum/(b-a)).toFixed(6),peak:+peak.toFixed(6)};
}

function correlation(a,b,chapterMs,clipMs,lengthMs){
  const sr=b.sampleRate,ratio=a.sampleRate/sr;
  if(ratio!==1&&ratio!==2)throw Error(`Unsupported sample-rate ratio: ${a.sampleRate} vs ${sr}`);
  const x=a.channelData[0],y=b.channelData[0];
  const startX=Math.round((chapterMs-a.off)*a.sampleRate/1000),startY=Math.round(clipMs*sr/1000);
  const n=Math.round(lengthMs*sr/1000);
  if(startX<0||startY<0||startX+n*ratio>x.length||startY+n>y.length)return null;
  let xx=0,yy=0,xy=0;
  for(let j=0;j<n;j+=3){const i=startX+j*ratio,p=ratio===2?(x[i]+x[i+1])/2:x[i],q=y[startY+j];xx+=p*p;yy+=q*q;xy+=p*q;}
  return xx&&yy?xy/Math.sqrt(xx*yy):null;
}

function bestMatch(chapter,verse,roughStart,clipMs,lengthMs,radiusMs){
  let best={corr:-Infinity};
  for(let delta=-radiusMs;delta<=radiusMs;delta+=1){
    const start=roughStart+delta;
    const corr=correlation(chapter,verse,start+clipMs,clipMs,lengthMs);
    if(corr!=null&&corr>best.corr)best={start,corr};
  }
  return {startMs:best.start,correlation:+best.corr.toFixed(6)};
}

const [chapter6,verse139,verse140,chapter34,verse46,verse47,verse139hi,verse46hi,verse140hi,verse47hi]=await Promise.all([
  chapterWindow(6,2858500,2865000),fullVerse(6,139),fullVerse(6,140),
  chapterWindow(34,869000,875400),fullVerse(34,46),fullVerse(34,47),
  fullVerse(6,139,192),fullVerse(34,46,192),fullVerse(6,140,192),fullVerse(34,47,192)
]);
const start139=bestMatch(chapter6,verse139,2835125,25500,700,80);
const start140=bestMatch(chapter6,verse140,2862106,1600,550,120);
const start46=bestMatch(chapter34,verse46,844852,25500,700,120);
const start47=bestMatch(chapter34,verse47,872725,1600,650,200);
const start139hi=bestMatch(chapter6,verse139hi,2835125,25500,700,80);
const start46hi=bestMatch(chapter34,verse46hi,844852,25500,700,120);
const start140hi=bestMatch(chapter6,verse140hi,2862106,1600,550,120);
const start47hi=bestMatch(chapter34,verse47hi,872725,1600,650,200);
const duration139=verse139.samplesDecoded/verse139.sampleRate*1000;
const duration46=verse46.samplesDecoded/verse46.sampleRate*1000;
const duration47=verse47.samplesDecoded/verse47.sampleRate*1000;
const end139=start139.startMs+duration139;
const end46=start46.startMs+duration46;
const duration139hi=verse139hi.samplesDecoded/verse139hi.sampleRate*1000;
const duration46hi=verse46hi.samplesDecoded/verse46hi.sampleRate*1000;
const end139hi=start139hi.startMs+duration139hi;
const end46hi=start46hi.startMs+duration46hi;
const report={sources:{chapter6:chapterUrl(6),verse139:verse139.url,verse140:verse140.url,
  chapter34:chapterUrl(34),verse46:verse46.url,verse47:verse47.url,
  verse139hi:verse139hi.url,verse46hi:verse46hi.url,
  verse140hi:verse140hi.url,verse47hi:verse47hi.url},
  matches:{start139,start140,start46,start47,start139hi,start46hi,start140hi,start47hi},
  durationsMs:{verse139:duration139,verse46:duration46,verse47:duration47,
    verse139hi:duration139hi,verse46hi:duration46hi},
  case139:{alignedClipEndMs:end139,nextClipStartMs:start140.startMs,
    hiClipEndMs:end139hi,hiNextClipStartMs:start140hi.startMs,
    hiGapToNextClipMs:start140hi.startMs-end139hi,
    clipLastWindows:[10,25,50,100,250].map(ms=>({ms,...rms(verse139,duration139-ms,duration139)})),
    hiClipLastWindows:[10,25,50,100,250].map(ms=>({ms,...rms(verse139hi,duration139hi-ms,duration139hi)})),
    chapterAtAndAfterEnd:[[-100,0],[0,25],[25,50],[50,75],[75,100],[100,150],[150,200]].map(([a,b])=>({offsetMs:[a,b],...rms(chapter6,end139+a,end139+b)})),
    chapterAtAndAfterHiEnd:[[-50,0],[0,10],[10,20],[20,40],[40,80]].map(([a,b])=>({offsetMs:[a,b],...rms(chapter6,end139hi+a,end139hi+b)})),
    hiNextClipFirstWindows:[[0,10],[10,20],[20,40],[40,80],[80,160]].map(([a,b])=>({ms:[a,b],...rms(verse140hi,a,b)})),
    continuationCorrelations:[500,100,25].map(ms=>({endBeforeClipMs:ms,
      corr:correlation(chapter6,verse139,end139-ms,duration139-ms,ms-1)}))},
  case46:{alignedClipEndMs:end46,nextClipStartMs:start47.startMs,
    hiClipEndMs:end46hi,hiNextClipStartMs:start47hi.startMs,
    hiGapToNextClipMs:start47hi.startMs-end46hi,
    chapterExtraWindows:[[871900,872100],[872100,872300],[872300,872500],[872500,872700],[872700,872900],[872900,873100],[873100,873500],[873500,874000],[874000,874300]].map(([a,b])=>({ms:[a,b],...rms(chapter34,a,b)})),
    clip46LastWindows:[100,250,500,1000].map(ms=>({ms,...rms(verse46,duration46-ms,duration46)})),
    hiClip46LastWindows:[10,25,100,250,500,1000].map(ms=>({ms,...rms(verse46hi,duration46hi-ms,duration46hi)})),
    chapterAtAndAfterHiEnd:[[-50,0],[0,10],[10,20],[20,40],[40,80]].map(([a,b])=>({offsetMs:[a,b],...rms(chapter34,end46hi+a,end46hi+b)})),
    hiNextClipFirstWindows:[[0,10],[10,20],[20,40],[40,80],[80,160]].map(([a,b])=>({ms:[a,b],...rms(verse47hi,a,b)})),
    clip47FirstWindows:[[0,250],[250,500],[500,1000],[1000,1500],[1500,2000]].map(([a,b])=>({ms:[a,b],...rms(verse47,a,b)})),
    extraCorrelations:[872100,872250,872400,872550,872750,872800,872900].map(t=>({chapterAtMs:t,
      inVerse46:correlation(chapter34,verse46,t,t-start46.startMs,250),
      inVerse47:correlation(chapter34,verse47,t,t-start47.startMs,250)}))}
};
console.log(JSON.stringify(report,null,2));
