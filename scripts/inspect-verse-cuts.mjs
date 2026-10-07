import fs from 'node:fs';
import vm from 'node:vm';
import {prepareWindow} from '../src/split-audio.mjs';

const [chapter='2',verse='277',reciter='7']=process.argv.slice(2);
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const start=html.indexOf('const QTEXT=');
const q=vm.runInNewContext(html.slice(start,html.indexOf('\n',start))+'; QTEXT');
const words=q[chapter][verse-1][2].filter(w=>w[1]===0).map(w=>w[0]);
const af=JSON.parse(fs.readFileSync(new URL(`../test-results/timings/${reciter}-${chapter}.json`,import.meta.url)));
const vt=af.verse_timings.find(x=>x.verse_key===`${chapter}:${verse}`);
const positions=Array.from({length:words.length-1},(_,i)=>i+1);
const audio={sourceUrl:af.audio_url,verseRanges:{[verse]:[vt.timestamp_from,vt.timestamp_to],
  [Number(verse)+1]:af.verse_timings.find(x=>x.verse_key===`${chapter}:${Number(verse)+1}`)?.timestamp_from!=null?
    [af.verse_timings.find(x=>x.verse_key===`${chapter}:${Number(verse)+1}`).timestamp_from,0]:undefined},
  verseSegments:{[verse]:vt.segments}};
const ctx={createBuffer(channels,length,rate){const data=Array.from({length:channels},()=>new Float32Array(length));return{
  sampleRate:rate,length,duration:length/rate,numberOfChannels:channels,
  getChannelData:i=>data[i],copyToChannel:(x,i)=>data[i].set(x)};}};
const result=await prepareWindow(audio,Number(verse),ctx,{positions});
const valleys={};
for(const pos of positions){
  const left=vt.segments.filter(s=>s[0]<=pos),right=vt.segments.filter(s=>s[0]>pos);
  if(!left.length||!right.length)continue;
  const at=Math.max(...left.map(s=>s[2]))+result.shift;
  const samples=[];
  for(let delta=-150;delta<=150;delta+=10){
    const start=Math.max(0,Math.floor((at+delta-result.off)*result.buffer.sampleRate/1000));
    const end=Math.min(result.buffer.length,start+Math.round(result.buffer.sampleRate*.01));
    if(end<=start)continue;
    let rms=0;
    for(let channel=0;channel<result.buffer.numberOfChannels;channel++){
      const data=result.buffer.getChannelData(channel);let sum=0;
      for(let j=start;j<end;j++)sum+=data[j]*data[j];
      rms=Math.max(rms,Math.sqrt(sum/(end-start)));
    }
    samples.push({delta,rms});
  }
  const min=samples.sort((a,b)=>a.rms-b.rms)[0];
  valleys[pos]={at,min};
}
console.log(JSON.stringify({chapter,verse,reciter,shift:result.shift,words:words.map((text,i)=>({
  pos:i+1,text,segments:vt.segments.filter(s=>s[0]===i+1).map(s=>[s[1],s[2]]),
  cut:result.cuts[i+1],pause:result.pauses[i+1],valley:valleys[i+1]}))},null,2));
