// Research-only energy check for the 13 high-priority Husary Muallim endings.
import {readFile,writeFile} from 'node:fs/promises';
import {prepareWindow} from '../src/split-audio.mjs';

const root=new URL('../',import.meta.url);
const energy=JSON.parse(await readFile(new URL('test-results/final-tail-energy.json',root)));
const rows=Object.values(energy.items).filter(item=>item.reciter===12&&
  item.gapMs< -1500&&item.productionAfter50Rms>.02);
const context={createBuffer(channels,length,sampleRate){
  const data=Array.from({length:channels},()=>new Float32Array(length));
  return {numberOfChannels:channels,length,sampleRate,duration:length/sampleRate,
    copyToChannel(source,ch){data[ch].set(source);},getChannelData(ch){return data[ch];}};
}};
function rms(buffer,start,end){
  const a=Math.max(0,Math.floor(start/1000*buffer.sampleRate));
  const b=Math.min(buffer.length,Math.ceil(end/1000*buffer.sampleRate));
  if(b<=a)return null;
  let sum=0;
  for(let ch=0;ch<buffer.numberOfChannels;ch++){
    const data=buffer.getChannelData(ch);
    for(let i=a;i<b;i++)sum+=data[i]*data[i];
  }
  return Math.sqrt(sum/((b-a)*buffer.numberOfChannels));
}
const output=[];
for(const row of rows){
  const from=row.productionEndMs-200,to=row.physicalEndMs;
  const audio={sourceUrl:row.url,recordingUrl:row.url,reciterId:12,verifiedCbr:false,
    buffer:null,end:to,verseRanges:{1:[from,to]},verseSegments:{1:[]}};
  const window=await prepareWindow(audio,1,context,
    {signal:AbortSignal.timeout(90000),positions:[]});
  const base=row.productionEndMs-window.off;
  const bins=[];
  for(let n=0;n<1900;n+=100)bins.push(rms(window.buffer,base+n,base+n+100));
  const item={verse:row.verse,gapMs:row.gapMs,decodedHi:window.hi,
    rms100:bins,maxAfter400:Math.max(...bins.slice(4))};
  output.push(item);
  process.stderr.write(`${row.verse} maxRmsAfter400=${item.maxAfter400.toFixed(5)}\n`);
}
await writeFile(new URL('test-results/husary-terminal-silence.json',root),
  JSON.stringify({checkedAt:new Date().toISOString(),rows:output},null,2)+'\n');
console.log(JSON.stringify({count:output.length,maxAfter400:Math.max(...output.map(x=>x.maxAfter400)),
  over001:output.filter(x=>x.maxAfter400>.01).map(x=>x.verse)},null,2));
