// Review-only VBR source-identity probe. Relative PCM positions are not
// chapter timestamps; never transfer word timings from this output alone.
import {MPEGDecoder} from 'mpg123-decoder';
import {frameHeader} from '../src/mp3-seek.mjs';

const target=process.argv[2]||'2:25';
const cases={
  '2:25':{chapter:'https://download.quranicaudio.com/qdc/abdul_baset/murattal/2.mp3',verse:'https://everyayah.com/data/Abdul_Basit_Murattal_64kbps/002025.mp3',fromByte:4_800_000,toByte:8_800_000,midMs:22000,tailMs:40000},
  '17:12':{chapter:'https://download.quranicaudio.com/qdc/abu_bakr_shatri/murattal/17.mp3',verse:'https://everyayah.com/data/Abu_Bakr_Ash-Shaatree_128kbps/017012.mp3',fromByte:180_000,toByte:760_000,midMs:14000,tailMs:25000},
};
if(!cases[target])throw Error(`Unknown target ${target}`);
const {chapter,verse,fromByte,toByte,midMs,tailMs}=cases[target];
const [chResponse,vResponse]=await Promise.all([fetch(chapter,{headers:{Range:`bytes=${fromByte}-${toByte}`}}),fetch(verse)]);
if(chResponse.status!==206||!vResponse.ok)throw Error(`HTTP ${chResponse.status}/${vResponse.status}`);
let chBytes=new Uint8Array(await chResponse.arrayBuffer()),vBytes=new Uint8Array(await vResponse.arrayBuffer());
let skip=-1;
for(let i=0;i<chBytes.length-1500;i++){
  const a=frameHeader(chBytes,i),b=a&&frameHeader(chBytes,i+a.bytes),c=b&&frameHeader(chBytes,i+a.bytes+b.bytes);
  if(a&&b&&c&&a.rate===b.rate&&a.rate===c.rate){skip=i;break;}
}
if(skip<0)throw Error('No stable frame start');
const decA=new MPEGDecoder(),decB=new MPEGDecoder();await Promise.all([decA.ready,decB.ready]);
try{
  const a=decA.decode(chBytes.subarray(skip)),b=decB.decode(vBytes),x=a.channelData[0],y=b.channelData[0];
  if(a.sampleRate!==b.sampleRate)throw Error(`Sample rates ${a.sampleRate}/${b.sampleRate}`);
  const rate=a.sampleRate;
  function corr(offsetMs,clipMs,spanMs){
    const ax=Math.round((offsetMs+clipMs)*rate/1000),by=Math.round(clipMs*rate/1000),len=Math.round(spanMs*rate/1000);
    if(ax<0||ax+len>x.length||by+len>y.length)return null;
    let xx=0,yy=0,xy=0;
    for(let j=0;j<len;j+=4){const p=x[ax+j],q=y[by+j];xx+=p*p;yy+=q*q;xy+=p*q;}
    return xx&&yy?xy/Math.sqrt(xx*yy):null;
  }
  let best={correlation:-1};
  for(let t=0;t<a.samplesDecoded/rate*1000-tailMs-2000;t+=50){let v=corr(t,3000,400);if(v!=null&&v>best.correlation)best={offsetMs:t,correlation:v};}
  const coarse=best.offsetMs;
  for(let t=coarse-100;t<=coarse+100;t++){let v=corr(t,3000,700);if(v!=null&&v>best.correlation)best={offsetMs:t,correlation:v};}
  const mid=corr(best.offsetMs,midMs,700),tail=corr(best.offsetMs,tailMs,700);
  console.log(JSON.stringify({chapter,verse,rangeBytes:[fromByte,toByte],frameSkip:skip,chapterChunkMs:a.samplesDecoded/rate*1000,verseDurationMs:b.samplesDecoded/rate*1000,relativeStartMs:best.offsetMs,correlations:[best.correlation,mid,tail]}));
}finally{await Promise.all([decA.free(),decB.free()]);}
