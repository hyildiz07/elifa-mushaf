// Review only. Quantifies whether unapproved 2:145 internal word boundaries lie in real pauses.
import fs from 'node:fs';
import {MPEGDecoder} from 'mpg123-decoder';

const row=JSON.parse(fs.readFileSync(new URL('../assets/verified-verse-audio-r12.json',import.meta.url))).rows['2:145'];
const response=await fetch(row.audio_url);
if(!response.ok)throw Error(`HTTP ${response.status}`);
const decoder=new MPEGDecoder(); await decoder.ready;
let pcm; try{pcm=decoder.decode(new Uint8Array(await response.arrayBuffer()));}
finally{await decoder.free();}
const x=pcm.channelData[0],rate=pcm.sampleRate;
const energy=(a,b)=>{
  const i=Math.max(0,Math.floor(a*rate/1000)),j=Math.min(x.length,Math.ceil(b*rate/1000));
  let sum=0,peak=0;
  for(let k=i;k<j;k++){sum+=x[k]*x[k];peak=Math.max(peak,Math.abs(x[k]));}
  return {rms:+Math.sqrt(sum/(j-i)).toFixed(6),peak:+peak.toFixed(6)};
};
const boundaries=[];
for(const n of [5,10,14,19,20,22,23,24,25,26,27,28,29]){
  const left=row.segments.find(s=>s[0]===n),right=row.segments.find(s=>s[0]===n+1);
  if(!left||!right)continue;
  const mid=(left[2]+right[1])/2,windows=[];
  for(let center=mid-250;center<=mid+250;center+=10)windows.push({centerMs:center,...energy(center-20,center+20)});
  windows.sort((a,b)=>a.rms-b.rms);
  boundaries.push({afterWord:n,labelGapMs:right[1]-left[2],modelMidMs:mid,
    atModelMid40ms:energy(mid-20,mid+20),min40msWithin500ms:windows[0],
    before100ms:energy(mid-100,mid),after100ms:energy(mid,mid+100)});
}
console.log(JSON.stringify({source:row.audio_url,sampleRate:rate,boundaries},null,2));
