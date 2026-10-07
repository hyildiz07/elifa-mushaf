// Review-only: compare independent EveryAyah verse clips with the production
// Quran Foundation chapter audio. Never turns model timings into playback data.
import {MPEGDecoder} from 'mpg123-decoder';
import {getCbrIndex,rangeForWindow,alignedRangeOffset} from '../src/mp3-seek.mjs';
import {calibrateRangeTrim,decodeWindow} from '../src/split-audio.mjs';

const candidates=[
  {key:'2:25',chapter:'https://download.quranicaudio.com/qdc/abdul_baset/murattal/2.mp3',verse:'https://everyayah.com/data/Abdul_Basit_Murattal_64kbps/002025.mp3',rough:404000,window:[395000,460000]},
  {key:'7/60:11',chapter:'https://download.quranicaudio.com/qdc/mishari_al_afasy/murattal/60.mp3',verse:'https://everyayah.com/data/Alafasy_128kbps/060011.mp3',rough:343200,window:[337000,375000]},
  {key:'7/60:12',chapter:'https://download.quranicaudio.com/qdc/mishari_al_afasy/murattal/60.mp3',verse:'https://everyayah.com/data/Alafasy_128kbps/060012.mp3',rough:370300,window:[365000,423000]},
  {key:'7/14:17',chapter:'https://download.quranicaudio.com/qdc/mishari_al_afasy/murattal/14.mp3',verse:'https://everyayah.com/data/Alafasy_128kbps/014017.mp3',rough:405900,window:[399000,436000]},
  {key:'7/14:18',chapter:'https://download.quranicaudio.com/qdc/mishari_al_afasy/murattal/14.mp3',verse:'https://everyayah.com/data/Alafasy_128kbps/014018.mp3',rough:432100,window:[426000,460000]},
  {key:'4/17:12',chapter:'https://download.quranicaudio.com/qdc/abu_bakr_shatri/murattal/17.mp3',verse:'https://everyayah.com/data/Abu_Bakr_Ash-Shaatree_128kbps/017012.mp3',rough:190000,window:[183000,225000]},
];

async function chapterWindow(url,from,to){
  const idx=await getCbrIndex(url);if(!idx)throw Error('No verified CBR index');
  idx.trimSamples=await calibrateRangeTrim(idx);if(idx.trimSamples==null)throw Error('No exact trim');
  const seek=rangeForWindow(idx,from,to),res=await fetch(url,{headers:{Range:`bytes=${seek.start}-${seek.end}`}});
  if(res.status!==206)throw Error(`No range response: ${res.status}`);
  const bytes=new Uint8Array(await res.arrayBuffer()),align=alignedRangeOffset(bytes,idx,seek.start);
  if(!align)throw Error('No aligned MP3 frames');
  const off=align.off-idx.trimSamples/idx.rate*1000;
  const out=await decodeWindow(new Blob([bytes.subarray(align.skip)]).stream(),from-off,to-off,{decoderFactory:()=>new MPEGDecoder()});
  out.off+=off;return out;
}
async function verseAudio(url){
  const res=await fetch(url);if(!res.ok)throw Error(`Verse HTTP ${res.status}`);
  const bytes=new Uint8Array(await res.arrayBuffer()),dec=new MPEGDecoder();await dec.ready;
  try{return dec.decode(bytes);}finally{await dec.free();}
}
function corr(a,b,start,clipMs,durationMs){
  const ratio=a.sampleRate/b.sampleRate;
  if(!Number.isInteger(ratio)||ratio<1||ratio>4)throw Error(`Rate ${a.sampleRate}/${b.sampleRate}`);
  const x=a.channelData[0],y=b.channelData[0],ax=Math.round((start+clipMs-a.off)*a.sampleRate/1000),by=Math.round(clipMs*b.sampleRate/1000),len=Math.round(durationMs*b.sampleRate/1000);
  if(ax<0||by<0||ax+len*ratio>x.length||by+len>y.length)return null;
  let xx=0,yy=0,xy=0;
  for(let j=0;j<len;j+=4){let p=0;for(let k=0;k<ratio;k++)p+=x[ax+j*ratio+k];p/=ratio;const q=y[by+j];xx+=p*p;yy+=q*q;xy+=p*q;}
  return xx&&yy?xy/Math.sqrt(xx*yy):null;
}
function search(a,b,rough,clipMs,durationMs,radiusMs){
  let best={correlation:-1};
  for(let delta=-radiusMs;delta<=radiusMs;delta+=10){const start=rough+delta,v=corr(a,b,start,clipMs,durationMs);if(v!=null&&v>best.correlation)best={start,correlation:v};}
  const coarse=best.start;
  for(let start=coarse-20;start<=coarse+20;start++){const v=corr(a,b,start,clipMs,durationMs);if(v!=null&&v>best.correlation)best={start,correlation:v};}
  return {startMs:best.start,correlation:+best.correlation.toFixed(6)};
}
for(const candidate of candidates){
  try{
    const [a,b]=await Promise.all([chapterWindow(candidate.chapter,...candidate.window),verseAudio(candidate.verse)]);
    const duration=b.samplesDecoded/b.sampleRate*1000;
    const positions=[3000,Math.round(duration/2),Math.round(duration-3800)];
    const matches=positions.map(ms=>({clipMs:ms,...search(a,b,candidate.rough,ms,700,5000)}));
    console.log(JSON.stringify({key:candidate.key,chapterUrl:candidate.chapter,verseUrl:candidate.verse,durationMs:+duration.toFixed(1),matches}));
  }catch(error){console.log(JSON.stringify({key:candidate.key,error:String(error)}));}
}
