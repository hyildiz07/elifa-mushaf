// Review-only: inspect energy around the QUD phrase boundaries on the same 192 kbps clip.
import fs from 'node:fs';
import {MPEGDecoder} from 'mpg123-decoder';

const candidate=JSON.parse(fs.readFileSync(new URL('./hani-006139-qud-candidate.json',import.meta.url)));
const response=await fetch(candidate.source_url);
if(!response.ok)throw Error(`HTTP ${response.status}`);
const decoder=new MPEGDecoder();await decoder.ready;
let pcm;
try{pcm=decoder.decode(new Uint8Array(await response.arrayBuffer()));}
finally{await decoder.free();}
const x=pcm.channelData[0],rate=pcm.sampleRate;
function measure(from,to){
  const a=Math.max(0,Math.floor(from*rate)),b=Math.min(x.length,Math.ceil(to*rate));
  let sum=0,peak=0;
  for(let i=a;i<b;i++){sum+=x[i]*x[i];peak=Math.max(peak,Math.abs(x[i]));}
  return {rms:Math.sqrt(sum/(b-a)),peak};
}
const segments=candidate.response.segments.filter(s=>s.kind==='quran');
const boundaries=[];
for(let i=0;i<segments.length-1;i++){
  const left=segments[i],right=segments[i+1];
  const end=left.time_to,start=right.time_from,mid=(end+start)/2;
  boundaries.push({after:left.ref_to,before:right.ref_from,gapMs:Math.round((start-end)*1000),
    atEnd:{before100:measure(end-.1,end),after100:measure(end,end+.1)},
    atMid:{before50:measure(mid-.05,mid),after50:measure(mid,mid+.05)},
    atStart:{before100:measure(start-.1,start),after100:measure(start,start+.1)}});
}
console.log(JSON.stringify({source:candidate.source_url,rate,durationMs:x.length/rate*1000,boundaries},null,2));
