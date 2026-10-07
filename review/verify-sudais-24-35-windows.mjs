import fs from 'node:fs';
import {MPEGDecoder} from 'mpg123-decoder';
import {prepareWindow} from '../src/split-audio.mjs';
const sid=24,ay=35,af=JSON.parse(fs.readFileSync('test-results/timings/3-24.json')),
 vt=af.verse_timings.find(x=>x.verse_key==='24:35'),next=af.verse_timings.find(x=>x.verse_key==='24:36');
const row=JSON.parse(fs.readFileSync('test-results/quranlab-targets.json')).find(x=>x.rid===3&&x.verse==='24:35');
const context={createBuffer(n,len,rate){const c=Array.from({length:n},()=>new Float32Array(len));return {sampleRate:rate,length:len,duration:len/rate,numberOfChannels:n,copyToChannel:(x,i)=>c[i].set(x),getChannelData:i=>c[i]};}};
const chapter=await prepareWindow({sourceUrl:af.audio_url,verifiedCbr:false,verseRanges:{[ay]:[vt.timestamp_from,vt.timestamp_to],[ay+1]:[next.timestamp_from,next.timestamp_to]},verseSegments:{[ay]:vt.segments}},ay,context,{positions:[]});
const clipRes=await fetch(row.source),clipBytes=new Uint8Array(await clipRes.arrayBuffer()),dec=new MPEGDecoder();await dec.ready;const clip=dec.decode(clipBytes);await dec.free();
function down(a,rate){const step=rate/1000,z=new Float32Array(Math.floor(a.length/step));for(let i=0;i<z.length;i++){const lo=Math.floor(i*step),hi=Math.floor((i+1)*step);let sum=0;for(let j=lo;j<hi;j++)sum+=a[j];z[i]=sum/(hi-lo);}return z;}
const x=down(chapter.buffer.getChannelData(0),chapter.buffer.sampleRate),y=down(clip.channelData[0],clip.sampleRate);
function corr(st,shift,len=1000){let xy=0,xx=0,yy=0;for(let i=0;i<len;i+=4){const a=x[st+i+shift],b=y[st+i];if(a==null||b==null)return -Infinity;xy+=a*b;xx+=a*a;yy+=b*b;}return xy/Math.sqrt(xx*yy||1);}
const results=[];for(let decile=0;decile<10;decile++){const lo=Math.floor(y.length*decile/10),hi=Math.floor(y.length*(decile+1)/10);let bestEnergy={at:lo,energy:-Infinity};for(let st=lo;st+1000<hi;st+=100){let energy=0;for(let i=0;i<1000;i+=10)energy+=y[st+i]**2;if(energy>bestEnergy.energy)bestEnergy={at:st,energy};}
 let best={shift:null,corr:-Infinity};for(let shift=2400;shift<=2600;shift++){const value=corr(bestEnergy.at,shift);if(value>best.corr)best={shift,corr:value};}
 results.push({decile,clipMs:bestEnergy.at,chapterMs:Math.round(chapter.off+bestEnergy.at+best.shift),shift:best.shift,corr:+best.corr.toFixed(4)});
}
console.log(JSON.stringify({verse:'24:35',chapterSource:af.audio_url,clipSource:row.source,chapterOff:chapter.off,clipMs:y.length,windows:results},null,2));
fs.writeFileSync('test-results/sudais-24-35-decile-match.json',JSON.stringify({verse:'24:35',chapterSource:af.audio_url,clipSource:row.source,chapterOff:chapter.off,clipMs:y.length,windows:results},null,2)+'\n');
