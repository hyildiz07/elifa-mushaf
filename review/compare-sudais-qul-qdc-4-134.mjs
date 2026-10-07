// Review-only QUL/QDC identity check at the exact quarantined verse.
import fs from 'node:fs';
import {decodeWindow} from '../src/split-audio.mjs';

const surah=4,ayah=134,key='4:134',from=2779000,to=2798000;
const api=`https://qul.tarteel.ai/api/v1/audio/surah_segments/3?surah=${surah}&from=${ayah}&to=${ayah}`;
const response=await fetch(api);if(!response.ok)throw Error(`QUL API ${response.status}`);
const metadata=await response.json(),qulPath='test-results/sudais-qul-4.mp3',
  qdcPath='test-results/sudais-qdc-4.mp3';
if(!fs.existsSync(qulPath)||!fs.existsSync(qdcPath))throw Error('Missing local source MP3');
function monoMs(p){const x=p.channelData[0],step=p.sampleRate/1000,
  out=new Float32Array(Math.floor(x.length/step));
  for(let i=0;i<out.length;i++){const lo=Math.floor(i*step),hi=Math.max(lo+1,Math.floor((i+1)*step));
    let sum=0;for(let j=lo;j<hi;j++)sum+=x[j];out[i]=sum/(hi-lo);}return out;}
function corr(a,b,ai,bi,len=1000){let aa=0,bb=0,ab=0;
  for(let i=0;i<len;i+=3){const x=a[ai+i],y=b[bi+i];
    if(x===undefined||y===undefined)return -Infinity;aa+=x*x;bb+=y*y;ab+=x*y;}
  return ab/Math.sqrt(aa*bb||1);}
const [a,b]=await Promise.all([
  decodeWindow(new Blob([fs.readFileSync(qdcPath)]).stream(),from,to),
  decodeWindow(new Blob([fs.readFileSync(qulPath)]).stream(),from,to)]);
const qdc=monoMs(a),qul=monoMs(b),range=metadata.segments[key],
  starts=[.15,.45,.75].map(frac=>Math.round(range.time_from-from+frac*(range.time_to-range.time_from-1000)));
const windows=starts.map(at=>{let best={offset_ms:null,correlation:-Infinity};
  for(let offset=-500;offset<=500;offset++){const value=corr(qdc,qul,at+offset,at);
    if(value>best.correlation)best={offset_ms:offset,correlation:value};}
  return {qul_start_ms:from+at,...best};});
const out={status:'review-only-not-for-production',key,
  method:'Both full MP3 streams decoded from byte zero; three independent 1-second PCM windows, 1ms offset search',
  qdc_url:'https://download.quranicaudio.com/qdc/abdurrahmaan_as_sudais/murattal/4.mp3',
  qul_url:metadata.audio.url,qul_verse_range_ms:[range.time_from,range.time_to],
  qul_word_positions:range.segments.map(s=>s[0]),windows};
fs.writeFileSync('review/sudais-qul-qdc-4-134-pcm.json',JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify(out));
