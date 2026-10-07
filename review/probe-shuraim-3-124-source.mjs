// Review-only source comparison. Never writes playback timings.
import fs from 'node:fs';
import {prepareWindow} from '../src/split-audio.mjs';
import {MPEGDecoder} from 'mpg123-decoder';

const key='3:124', ay=124;
const qdc=JSON.parse(fs.readFileSync('test-results/timings/10-3.json','utf8'));
const qverse=qdc.verse_timings.find(row=>row.verse_key===key);
const qua=JSON.parse(fs.readFileSync('test-results/qua-source-catalog.json','utf8')).recitations
  .find(row=>row.slug==='saud_al_shuraim_mp3quran');
const context={createBuffer(channels,length,sampleRate){
  const data=Array.from({length:channels},()=>new Float32Array(length));
  return {numberOfChannels:channels,length,sampleRate,duration:length/sampleRate,
    copyToChannel(values,index){data[index].set(values);},getChannelData(index){return data[index];}};
}};
const start=qverse.timestamp_from-1200,end=qverse.timestamp_to+1000;
const [a,b]=await Promise.all([
  prepareWindow({sourceUrl:qdc.audio_url,verifiedCbr:false,
    verseRanges:{[ay]:[start,end]},verseSegments:{[ay]:qverse.segments}},ay,context,{positions:[]}),
  prepareWindow({sourceUrl:qua.audio.chapter_urls['3'],verifiedCbr:false,
    verseRanges:{[ay]:[start+1800,end+4000]},verseSegments:{[ay]:[]}},ay,context,{positions:[]})
]);
function mono1k(p){const x=p.buffer.getChannelData(0),ratio=p.buffer.sampleRate/1000;
  const out=new Float32Array(Math.floor(x.length/ratio));
  for(let i=0;i<out.length;i++){const from=Math.floor(i*ratio),to=Math.max(from+1,Math.floor((i+1)*ratio));
    let sum=0;for(let j=from;j<to;j++)sum+=x[j];out[i]=sum/(to-from);}
  return out;}
const x=mono1k(a),y=mono1k(b);
function corr(shift,at){let xy=0,xx=0,yy=0;
  for(let i=0;i<800;i+=4){const left=x[at+shift+i],right=y[at+i];
    if(left===undefined||right===undefined)return -Infinity;
    xy+=left*right;xx+=left*left;yy+=right*right;}
  return xy/Math.sqrt(xx*yy||1);}
const points=[1734400,1735200,1737400,1740200,1743500].map(t=>Math.round(t-b.off));
let best={shift:0,average:-Infinity,correlations:[]};
const local=points.map(at=>{let row={shift:0,correlation:-Infinity};
  for(let shift=-2500;shift<=2500;shift++){
    const correlation=corr(shift,at);
    if(correlation>row.correlation)row={shift,correlation};
  }
  return {quaPosition:b.off+at,offsetMs:a.off-b.off+row.shift,
    correlation:+row.correlation.toFixed(5)};
});
for(let shift=-2500;shift<=2500;shift++){
  const correlations=points.map(point=>corr(shift,point));
  const average=correlations.reduce((sum,value)=>sum+value,0)/correlations.length;
  if(average>best.average)best={shift,average,correlations};
}
const report={key,sourceUrls:[qdc.audio_url,qua.audio.chapter_urls['3']],qdcRange:[start,end],
  quaRange:[start+1800,end+4000],offsetMs:a.off-b.off+best.shift,
  correlation:+best.average.toFixed(5),points:best.correlations.map(value=>+value.toFixed(5)),local,
  note:'Waveform alignment supports the same recitation and a stable clock offset. Correlation does not prove every phoneme or word boundary.'};
function rms(p,from,to){const x=p.buffer.getChannelData(0),sr=p.buffer.sampleRate;
  const first=Math.max(0,Math.floor((from-p.off)*sr/1000)),last=Math.min(x.length,Math.ceil((to-p.off)*sr/1000));
  let sum=0;for(let i=first;i<last;i++)sum+=x[i]*x[i];
  return last>first?+Math.sqrt(sum/(last-first)).toFixed(5):null;}
report.qdcFirstRms=Array.from({length:24},(_,i)=>({at:1730900+i*50,rms:rms(a,1730900+i*50,1730950+i*50)}));
async function verseClip(bitrate){
  const url=`https://everyayah.com/data/Saood_ash-Shuraym_${bitrate}kbps/003124.mp3`;
  const response=await fetch(url);
  if(!response.ok)throw Error(`${url}: HTTP ${response.status}`);
  const bytes=new Uint8Array(await response.arrayBuffer());
  const decoder=new MPEGDecoder();await decoder.ready;
  try{
    const decoded=decoder.decode(bytes);
    const samples=decoded.channelData[0],ratio=decoded.sampleRate/1000;
    const clip=new Float32Array(Math.floor(samples.length/ratio));
    for(let i=0;i<clip.length;i++){
      const from=Math.floor(i*ratio),to=Math.max(from+1,Math.floor((i+1)*ratio));
      let sum=0;for(let j=from;j<to;j++)sum+=samples[j];clip[i]=sum/(to-from);
    }
    const marks=[1000,4000,7500];
    function similarity(start,mark){let xy=0,xx=0,yy=0;
      for(let i=0;i<800;i+=4){
        const left=x[Math.round(start-a.off)+mark+i],right=clip[mark+i];
        if(left===undefined||right===undefined)return -Infinity;
        xy+=left*right;xx+=left*left;yy+=right*right;
      }
      return xy/Math.sqrt(xx*yy||1);
    }
    let best={startMs:null,average:-Infinity,points:[]};
    for(let startMs=1730000;startMs<=1732200;startMs++){
      const points=marks.map(mark=>similarity(startMs,mark));
      const average=points.reduce((sum,value)=>sum+value,0)/points.length;
      if(average>best.average)best={startMs,average,points};
    }
    return {url,bytes:bytes.length,durationMs:clip.length,startMs:best.startMs,
      correlation:+best.average.toFixed(5),points:best.points.map(v=>+v.toFixed(5))};
  }finally{await decoder.free();}
}
report.independentVerseClips=await Promise.all([verseClip(64),verseClip(128)]);
fs.writeFileSync('review/shuraim-3-124-source-check.json',`${JSON.stringify(report,null,2)}\n`);
console.log(JSON.stringify(report,null,2));
