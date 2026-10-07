import fs from 'node:fs';
import {decodeWindow} from '../src/split-audio.mjs';

function monoMs(p){const x=p.channelData[0],step=p.sampleRate/1000,out=new Float32Array(Math.floor(x.length/step));
  for(let i=0;i<out.length;i++){const lo=Math.floor(i*step),hi=Math.max(lo+1,Math.floor((i+1)*step));
    let sum=0;for(let j=lo;j<hi;j++)sum+=x[j];out[i]=sum/(hi-lo);}return out;}
function corr(qdc,qul,qs,us,len=1000){let aa=0,bb=0,ab=0;
  for(let i=0;i<len;i+=3){const a=qdc[qs+i],b=qul[us+i];
    if(a===undefined||b===undefined)return -Infinity;aa+=a*a;bb+=b*b;ab+=a*b;}
  return ab/Math.sqrt(aa*bb||1);}
const targets=[{s:3,a:160,from:2656000,to:2679500},
  {s:4,a:143,from:2963000,to:2983500}];
for(const item of targets){
  const key=`${item.s}:${item.a}`,api=`https://qul.tarteel.ai/api/v1/audio/surah_segments/3?surah=${item.s}&from=${item.a}&to=${item.a}`;
  const response=await fetch(api);if(!response.ok)throw Error(`${response.status} ${api}`);
  const metadata=await response.json(),qulUrl=metadata.audio.url;
  const qulPath=`test-results/sudais-qul-${item.s}.mp3`;
  if(!fs.existsSync(qulPath)){
    const audio=await fetch(qulUrl,{signal:AbortSignal.timeout(90000)});
    if(!audio.ok)throw Error(`${audio.status} ${qulUrl}`);
    fs.writeFileSync(qulPath,Buffer.from(await audio.arrayBuffer()));
  }
  const qdcPath=`test-results/sudais-qdc-${item.s}.mp3`;
  const [qdcP,qulP]=await Promise.all([
    decodeWindow(new Blob([fs.readFileSync(qdcPath)]).stream(),item.from,item.to),
    decodeWindow(new Blob([fs.readFileSync(qulPath)]).stream(),item.from,item.to)]);
  const qdc=monoMs(qdcP),qul=monoMs(qulP),starts=[.15,.45,.75].map(frac=>
    Math.round((metadata.segments[key].time_from-item.from)+frac*(metadata.segments[key].time_to-metadata.segments[key].time_from-1000)));
  const windows=[];
  for(const us of starts){let best={offset_ms:null,correlation:-Infinity};
    for(let offset=-2000;offset<=2000;offset++){
      const qs=us+offset;if(qs<0||qs+1000>=qdc.length)continue;
      const value=corr(qdc,qul,qs,us);
      if(value>best.correlation)best={offset_ms:offset,correlation:value};
    }
    windows.push({qul_start_ms:item.from+us,...best});
  }
  const out={key,method:'both full MP3 streams decoded from byte zero; 1-second PCM cross correlation, 1ms search steps',
    qdc_url:`https://download.quranicaudio.com/qdc/abdurrahmaan_as_sudais/murattal/${item.s}.mp3`,
    qul_url:qulUrl,qul_verse_range_ms:[metadata.segments[key].time_from,metadata.segments[key].time_to],
    decoded_window_ms:[item.from,item.to],windows};
  fs.writeFileSync(`review/sudais-qul-qdc-${item.s}-${item.a}-pcm.json`,JSON.stringify(out,null,2)+'\n');
  console.log(JSON.stringify(out));
}
