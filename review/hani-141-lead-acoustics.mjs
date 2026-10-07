// Review-only inspection of the long prelude before Hânî 6:141's first word.
import {MPEGDecoder} from 'mpg123-decoder';
const source='https://everyayah.com/data/Hani_Rifai_192kbps/006141.mp3';
const response=await fetch(source);if(!response.ok)throw Error(`HTTP ${response.status}`);
const decoder=new MPEGDecoder();await decoder.ready;
let pcm;try{pcm=decoder.decode(new Uint8Array(await response.arrayBuffer()));}
finally{await decoder.free();}
const x=pcm.channelData[0],rate=pcm.sampleRate,bins=[];
for(let from=0;from<4200;from+=200){
  const a=Math.floor(from*rate/1000),b=Math.floor((from+200)*rate/1000);
  let sum=0,peak=0;
  for(let i=a;i<b;i++){sum+=x[i]*x[i];peak=Math.max(peak,Math.abs(x[i]));}
  bins.push({fromMs:from,toMs:from+200,rms:+Math.sqrt(sum/(b-a)).toFixed(6),peak:+peak.toFixed(6)});
}
console.log(JSON.stringify({source,chapterMatchStartMs:2881724,
  qudLargeFirstCanonicalWordOffsetMs:4200,bins},null,2));
