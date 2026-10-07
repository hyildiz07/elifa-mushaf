// Review-only broad-offset source-identity test. QUL chapter timing is never
// transferred unless three distant speech windows match the production QDC MP3.
import fs from 'node:fs';
import {prepareWindow} from '../src/split-audio.mjs';
import {getVerifiedVbrIndexFromBlob} from '../src/mp3-seek.mjs';
const context={createBuffer(n,len,rate){const data=Array.from({length:n},()=>new Float32Array(len));
  return {sampleRate:rate,length:len,duration:len/rate,numberOfChannels:n,
    copyToChannel:(samples,ch)=>data[ch].set(samples),getChannelData:ch=>data[ch]};}};
function mono1k(p){const src=p.buffer.getChannelData(0),rate=p.buffer.sampleRate;
  const n=Math.floor(src.length*1000/rate),out=new Float32Array(n);
  for(let i=0;i<n;i++){const a=Math.floor(i*rate/1000),b=Math.max(a+1,Math.floor((i+1)*rate/1000));
    let sum=0;for(let j=a;j<b;j++)sum+=src[j];out[i]=sum/(b-a);}return out;}
function corr(a,b,shift,start,len=750){let aa=0,bb=0,ab=0;
  for(let i=0;i<len;i+=3){const x=a[start+i+shift],y=b[start+i];
    if(x===undefined||y===undefined)return -Infinity;aa+=x*x;bb+=y*y;ab+=x*y;}
  return ab/Math.sqrt(aa*bb||1);}
function windows(y){const n=y.length,starts=[];
  for(const [lo,hi] of [[.08,.29],[.39,.59],[.69,.89]]){
    let best={start:Math.floor(n*lo),energy:-1};
    for(let s=Math.floor(n*lo);s+750<Math.floor(n*hi);s+=75){let e=0;
      for(let i=0;i<750;i+=10)e+=y[s+i]*y[s+i];if(e>best.energy)best={start:s,energy:e};}
    starts.push(best.start);
  }return starts;}
const result=[];
for(const [sid,ay] of [[5,5],[5,46],[5,82],[5,119],[28,2],[28,44],[28,87],[29,2],[29,35],[29,68]]){
  const key=`${sid}:${ay}`,qdc=JSON.parse(fs.readFileSync(`test-results/timings/3-${sid}.json`,'utf8')),
    v=qdc.verse_timings.find(x=>x.verse_key===key),
    data=await (await fetch(`https://qul.tarteel.ai/api/v1/audio/surah_segments/3?surah=${sid}&from=${ay}&to=${ay}`)).json(),
    uv=data.segments[key];
  const bytes=fs.readFileSync(`test-results/sudais-qdc-${sid}.mp3`),blob=new Blob([bytes]),
    catalog=JSON.parse(fs.readFileSync('assets/sudais-vbr-index.json','utf8')),
    index=await getVerifiedVbrIndexFromBlob(blob,catalog.rows[qdc.audio_url]);
  const start=Math.max(0,Math.min(v.timestamp_from,uv.time_from)-20000),
    end=Math.max(v.timestamp_to,uv.time_to)+40000;
  const ap=await prepareWindow({sourceUrl:qdc.audio_url,recordingUrl:qdc.audio_url,
    offlineBlob:blob,cbrIndex:index,reciterId:3,verseRanges:{1:[start,end]},verseSegments:{1:[]}},1,context,{positions:[]});
  const bp=await prepareWindow({sourceUrl:data.audio.url,
    verseRanges:{1:[uv.time_from,uv.time_to]},verseSegments:{1:[]}},1,context,{positions:[]});
  const a=mono1k(ap),b=mono1k(bp),starts=windows(b);
  const min=-Math.min(...starts),max=a.length-Math.max(...starts)-750;
  let best={shift:null,score:-Infinity,cs:[]};
  for(let s=min;s<=max;s+=10){const cs=starts.map(st=>corr(a,b,s,st));
    const score=cs.reduce((x,y)=>x+y,0)/cs.length;if(score>best.score)best={shift:s,score,cs};}
  for(let s=Math.max(min,best.shift-20);s<=Math.min(max,best.shift+20);s++){
    const cs=starts.map(st=>corr(a,b,s,st)),score=cs.reduce((x,y)=>x+y,0)/cs.length;
    if(score>best.score)best={shift:s,score,cs};}
  const row={verse:key,qdc_url:qdc.audio_url,qul_url:data.audio.url,
    qdc_provider_range:[v.timestamp_from,v.timestamp_to],qul_range:[uv.time_from,uv.time_to],
    qdc_window:[ap.off,ap.off+a.length],qul_window:[bp.off,bp.off+b.length],
    speech_windows_ms:starts,best:{...best,qdc_time_at_qul_window_start:ap.off+best.shift},
    same_performance:best.cs.every(x=>x>=.8)};
  result.push(row);console.log(JSON.stringify(row));
}
fs.writeFileSync('review/sudais-qdc-align/qul-broad-source-match.json',JSON.stringify(result,null,2)+'\n');
