import fs from 'node:fs';
import {decodeWindow,prepareWindow} from '../src/split-audio.mjs';
const targetPath=process.argv.find(x=>x.startsWith('--targets='))?.slice(10)||
  'test-results/sudais-gap-quranlab-candidates.json';
const targets=JSON.parse(fs.readFileSync(targetPath));
const bufferContext={createBuffer(channels,length,rate){const data=Array.from({length:channels},()=>new Float32Array(length));
  return {sampleRate:rate,length,duration:length/rate,numberOfChannels:channels,copyToChannel(a,ch){data[ch].set(a);},getChannelData(ch){return data[ch];}};}};
function mono1k(data,rate){const ratio=rate/1000,output=new Float32Array(Math.floor(data.length/ratio));
  for(let i=0;i<output.length;i++){const a=Math.floor(i*ratio),b=Math.max(a+1,Math.floor((i+1)*ratio));let total=0;
    for(let j=a;j<b;j++)total+=data[j];output[i]=total/(b-a);}
  return output;
}
function windows(y){const result=[],n=y.length;
  for(const [start,end] of [[.13,.29],[.42,.58],[.72,.88]]){
    const lo=Math.floor(n*start),hi=Math.floor(n*end);let best={at:lo,energy:-1};
    for(let at=lo;at+1000<hi;at+=250){let energy=0;for(let i=0;i<1000;i+=10)energy+=y[at+i]*y[at+i];
      if(energy>best.energy)best={at,energy};}
    result.push(best.at);
  }
  return result;
}
function corr(x,y,shift,starts,length=1000){let xy=0,xx=0,yy=0;
  for(const start of starts)for(let i=0;i<length;i+=4){const a=x[start+i+shift],b=y[start+i];if(!Number.isFinite(a)||!Number.isFinite(b))return -Infinity;
    xy+=a*b;xx+=a*a;yy+=b*b;}
  return xy/Math.sqrt(xx*yy||1);
}
function locate(chapter,clip){const x=mono1k(chapter.data,chapter.rate),y=mono1k(clip.data,clip.rate),starts=windows(y);
  const max=x.length-Math.max(...starts)-1000;
  let ranked=[];
  for(let shift=0;shift<=max;shift+=2)ranked.push({shift,corr:corr(x,y,shift,starts)});
  ranked.sort((a,b)=>b.corr-a.corr);let best=ranked[0];
  for(const candidate of ranked.slice(0,12))for(let shift=Math.max(0,candidate.shift-3);shift<=Math.min(max,candidate.shift+3);shift++){
    const value=corr(x,y,shift,starts);if(value>best.corr)best={shift,corr:value};}
  const peaks=[];
  for(const start of starts){let peak={shift:best.shift,corr:-Infinity};
    for(let shift=Math.max(0,best.shift-100);shift<=Math.min(max,best.shift+100);shift++){
      const value=corr(x,y,shift,[start]);if(value>peak.corr)peak={shift,corr:value};}
    peaks.push(peak);
  }
  const runner=ranked.find(x=>Math.abs(x.shift-best.shift)>500)||{corr:-Infinity,shift:null};
  return {shift:best.shift,corr:best.corr,runner,peaks,chapterLength:x.length,clipLength:y.length};
}
async function target(t){
  const [sid,ay]=t.key.split(':').map(Number),af=JSON.parse(fs.readFileSync(`test-results/timings/3-${sid}.json`));
  const vt=af.verse_timings.find(v=>v.verse_key===t.key),next=af.verse_timings.find(v=>v.verse_key===`${sid}:${ay+1}`);
  const actual=process.argv.find(x=>x.startsWith('--actual='))?.slice(9).split(':').map(Number);
  const actualWordEnd=Math.max(vt.timestamp_to,...vt.segments.map(s=>s[2]));
  const range=actual?.length===2?actual:[vt.timestamp_from,actualWordEnd];
  const chapter={sourceUrl:af.audio_url,verifiedCbr:false,verseRanges:{[ay]:range,
    ...(next?{[ay+1]:[range[1]+1000,range[1]+2000]}:{})},verseSegments:{[ay]:vt.segments}};
  const prepared=await prepareWindow(chapter,ay,bufferContext,{positions:[]});
  const clipUrl=process.argv.includes('--ey192')?
    t.candidate_audio_url.replace('_64kbps/','_192kbps/'):t.candidate_audio_url;
  const response=await fetch(clipUrl);if(!response.ok)throw Error(`${t.key}: clip HTTP ${response.status}`);
  const clip=await decodeWindow(response.body,0,t.candidate_duration+1200,{maxMissingMs:2000});
  const match=locate({data:prepared.buffer.getChannelData(0),rate:prepared.buffer.sampleRate},
    {data:clip.channelData[0],rate:clip.sampleRate});
  return {rid:3,verse:t.key,sourceUrl:af.audio_url,clipUrl,chapterStart:prepared.off,
    clipStart:prepared.off+match.shift,duration:t.candidate_duration,wordCount:t.count,segmentCount:t.candidate_segments.length,
    ...match};
}
const choose=process.argv.find(x=>x.startsWith('--verse='))?.split('=')[1];
const run=choose?targets.filter(x=>x.key===choose):targets;
const outputPath=process.argv.find(x=>x.startsWith('--out='))?.slice(6)||'test-results/sudais-gap-source-matches.json';
const out=process.argv.includes('--append')&&fs.existsSync(outputPath)?
  JSON.parse(fs.readFileSync(outputPath,'utf8')):[];
for(const t of run){try{const r=await target(t);out.push(r);console.log(JSON.stringify(r));}
  catch(e){console.log(JSON.stringify({rid:3,verse:t.key,error:String(e)}));}}
fs.writeFileSync(outputPath,JSON.stringify(out,null,2));
