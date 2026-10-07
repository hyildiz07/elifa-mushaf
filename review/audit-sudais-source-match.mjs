import fs from 'node:fs';
import {prepareWindow} from '../src/split-audio.mjs';
const cases=process.argv.slice(2).length?process.argv.slice(2):['39:54','4:134','5:46','5:82','24:35','3:160'];
const context={createBuffer(n,len,rate){const c=Array.from({length:n},()=>new Float32Array(len));return {sampleRate:rate,length:len,duration:len/rate,numberOfChannels:n,copyToChannel:(x,i)=>c[i].set(x),getChannelData:i=>c[i]};}};
function down(p){const a=p.buffer.getChannelData(0),step=p.buffer.sampleRate/1000,z=new Float32Array(Math.floor(a.length/step));for(let i=0;i<z.length;i++){const lo=Math.floor(i*step),hi=Math.max(lo+1,Math.floor((i+1)*step));let sum=0;for(let j=lo;j<hi;j++)sum+=a[j];z[i]=sum/(hi-lo);}return z;}
function corr(x,y,shift,start,len=1000){let xy=0,xx=0,yy=0;for(let i=0;i<len;i+=4){const a=x[start+i+shift],b=y[start+i];if(a===undefined||b===undefined)return -Infinity;xy+=a*b;xx+=a*a;yy+=b*b;}return xy/Math.sqrt(xx*yy||1);}
function windows(y){const n=y.length,starts=[];for(const [a,b] of [[.1,.3],[.4,.6],[.7,.9]]){let best={s:Math.floor(n*a),en:-1};for(let st=Math.floor(n*a);st+1000<Math.floor(n*b);st+=100){let en=0;for(let i=0;i<1000;i+=10)en+=y[st+i]*y[st+i];if(en>best.en)best={s:st,en};}starts.push(best.s);}return starts;}
for(const key of cases){const [sid,ay]=key.split(':').map(Number),qf=JSON.parse(fs.readFileSync(`test-results/timings/3-${sid}.json`));
 const qv=qf.verse_timings.find(x=>x.verse_key===key),qn=qf.verse_timings.find(x=>x.verse_key===`${sid}:${ay+1}`);
 const r=await fetch(`https://qul.tarteel.ai/api/v1/audio/surah_segments/3?surah=${sid}&from=${ay}&to=${ay}`);
 const data=await r.json(),v=data.segments[key];
 if(!v){console.log(JSON.stringify({key,error:'missing QUL verse'}));continue;}
 const qEnd=Math.max(qv.timestamp_to,...qv.segments.map(segment=>segment[2]));
 const qAudio={sourceUrl:qf.audio_url,verifiedCbr:false,
   ...([3,4,5].includes(sid)?{offlineBlob:new Blob([fs.readFileSync(`test-results/sudais-qdc-${sid}.mp3`)])}:{}),
   verseRanges:{[ay]:[qv.timestamp_from,qEnd],...(qn?{[ay+1]:[qn.timestamp_from,qn.timestamp_to]}:{})},verseSegments:{[ay]:qv.segments}};
 const uAudio={sourceUrl:data.audio.url,verifiedCbr:false,verseRanges:{[ay]:[v.time_from,v.time_to],...(qn?{[ay+1]:[v.time_to+1000,v.time_to+2000]}:{})},verseSegments:{[ay]:v.segments.map(x=>[x[0],x[1],x[2]])}};
 try{
 const [p,q]=await Promise.all([prepareWindow(qAudio,ay,context,{positions:[]}),prepareWindow(uAudio,ay,context,{positions:[]})]);
 const x=down(p),y=down(q),starts=windows(y),minShift=-Math.min(4000,...starts),maxShift=Math.min(4000,x.length-Math.max(...starts)-1000);
 let list=[];for(let shift=minShift;shift<=maxShift;shift+=2){const cs=starts.map(st=>corr(x,y,shift,st));list.push({shift,score:cs.reduce((a,b)=>a+b,0)/cs.length,cs});}
 list.sort((a,b)=>b.score-a.score);let best=list[0];for(let shift=Math.max(minShift,best.shift-3);shift<=Math.min(maxShift,best.shift+3);shift++){const cs=starts.map(st=>corr(x,y,shift,st)),score=cs.reduce((a,b)=>a+b,0)/cs.length;if(score>best.score)best={shift,score,cs};}
 const runner=list.find(x=>Math.abs(x.shift-best.shift)>500),peaks=starts.map(st=>{let b={shift:null,corr:-Infinity};for(let s=best.shift-100;s<=best.shift+100;s++){const value=corr(x,y,s,st);if(value>b.corr)b={shift:s,corr:value};}return b;});
 const out={key,qf_url:qf.audio_url,qul_url:data.audio.url,qf_range:[qv.timestamp_from,qv.timestamp_to],qul_range:[v.time_from,v.time_to],qf_off:p.off,qul_off:q.off,starts,best,runner,peaks,
  chapter_offset_ms:p.off-q.off+best.shift};
 console.log(JSON.stringify(out));
 }catch(e){console.log(JSON.stringify({key,error:String(e)}));}
}
