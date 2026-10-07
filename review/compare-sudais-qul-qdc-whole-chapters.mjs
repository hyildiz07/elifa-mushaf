import fs from 'node:fs';
import {MPEGDecoderWebWorker} from 'mpg123-decoder';

async function decodeSamples(file,windows){
  const decoder=new MPEGDecoderWebWorker();await decoder.ready;
  const reader=new Blob([fs.readFileSync(file)]).stream().getReader();
  const out=windows.map(w=>({ms:w,rate:0,data:null,copied:0}));
  let total=0,rate=0;
  try{
    while(true){const {done,value}=await reader.read();if(done)break;
      for(let offset=0;offset<value.length;offset+=32768){
        const p=await decoder.decode(value.slice(offset,offset+32768));
        if(p.errors?.length)throw Error(`Decode error: ${file}`);
        if(!p.samplesDecoded)continue;
        if(!rate){rate=p.sampleRate;for(const w of out){w.rate=rate;w.data=new Float32Array(Math.ceil(w.ms[1]*rate/1000)-Math.floor(w.ms[0]*rate/1000));}}
        if(p.sampleRate!==rate)throw Error('Sample rate changed');
        for(const w of out){const first=Math.floor(w.ms[0]*rate/1000),last=Math.ceil(w.ms[1]*rate/1000);
          const lo=Math.max(first,total),hi=Math.min(last,total+p.samplesDecoded);
          if(hi>lo){w.data.set(p.channelData[0].subarray(lo-total,hi-total),lo-first);w.copied+=hi-lo;}}
        total+=p.samplesDecoded;
      }
    }
  }finally{await reader.cancel().catch(()=>{});reader.releaseLock();await decoder.free();}
  for(const w of out)if(w.copied<w.data.length)throw Error(`Window incomplete in ${file}: ${w.ms}`);
  return out;
}
function msSamples(w){const step=w.rate/1000,out=new Float32Array(Math.floor(w.data.length/step));
  for(let i=0;i<out.length;i++){const lo=Math.floor(i*step),hi=Math.max(lo+1,Math.floor((i+1)*step));
    let sum=0;for(let j=lo;j<hi;j++)sum+=w.data[j];out[i]=sum/(hi-lo);}return out;}
function corr(x,y,xStart,yStart,len){let xx=0,yy=0,xy=0;
  for(let i=0;i<len;i+=2){const a=x[xStart+i],b=y[yStart+i];
    if(a===undefined||b===undefined)return -Infinity;xx+=a*a;yy+=b*b;xy+=a*b;}
  return xy/Math.sqrt(xx*yy||1);}
for(const [surah,verses] of [[3,[10,100,195]],[4,[10,88,170]]]){
  const timing=JSON.parse(fs.readFileSync(`test-results/sudais-qul-timings-${surah}.json`,'utf8'));
  const centers=verses.map(a=>{const v=timing.segments[`${surah}:${a}`];return Math.floor((v.time_from+v.time_to)/2);});
  const windows=centers.map(c=>[c-1000,c+2000]);
  const [qdc,qul]=await Promise.all([
    decodeSamples(`test-results/sudais-qdc-${surah}.mp3`,windows),
    decodeSamples(`test-results/sudais-qul-${surah}.mp3`,windows)]);
  const checks=[];
  for(let i=0;i<verses.length;i++){
    const x=msSamples(qdc[i]),y=msSamples(qul[i]);let best={offset_ms:null,correlation:-Infinity};
    for(let shift=-500;shift<=500;shift++){const score=corr(x,y,1000+shift,1000,1000);
      if(score>best.correlation)best={offset_ms:shift,correlation:score};}
    checks.push({verse:`${surah}:${verses[i]}`,center_ms:centers[i],...best});
  }
  const result={surah,method:'both whole chapter MP3s decoded sequentially from byte zero; 1-second PCM windows at early/middle/late verses; ±500ms shift search',checks};
  fs.writeFileSync(`review/sudais-qul-qdc-${surah}-chapter-pcm.json`,JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result));
}
