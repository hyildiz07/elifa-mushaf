import fs from 'node:fs';
import {MPEGDecoder} from 'mpg123-decoder';
import {decodeWindow,calibratedCuts} from '../src/split-audio.mjs';

// Network-backed acoustic audit; defaults to the reported Shatri/Nisa 12 case.
const [reciter='4',chapter='4',verse='12',cutWords='49,64,82']=process.argv.slice(2);
const positions=cutWords.split(',').map(Number);
const fixture=new URL(`../tests/fixtures/${reciter}-${chapter}.json`,import.meta.url);
const cached=new URL(`../test-results/timings/${reciter}-${chapter}.json`,import.meta.url);
const data=JSON.parse(fs.readFileSync(fs.existsSync(fixture)?fixture:cached));
const timing=data.verse_timings.find(v=>v.verse_key===`${chapter}:${verse}`);
if(!timing)throw Error('Verse fixture missing');
const sourceSegments=timing.segments.filter(s=>s.length===3);
const mismatches=sourceSegments.filter((s,i)=>s[0]!==i+1).length;
const segments=sourceSegments.length===Math.max(...sourceSegments.map(s=>s[0]))&&
  mismatches>0&&mismatches<=Math.max(2,Math.floor(sourceSegments.length*.05))&&
  sourceSegments.every((s,i)=>i===0||s[1]>=sourceSegments[i-1][1])
  ?sourceSegments.map((s,i)=>[i+1,s[1],s[2]]):sourceSegments;
for(let i=1;i<segments.length;){
  const prev=segments[i-1][0];if(segments[i][0]>prev){i++;continue;}
  let j=i;while(j<segments.length&&segments[j][0]<=prev&&j-i<4)j++;
  if(j<segments.length&&j-i<=3&&segments[j][0]===prev+(j-i)+1)
    for(let k=i;k<j;k++)segments[k]=[prev+(k-i)+1,segments[k][1],segments[k][2]];
  i=Math.max(j,i+1);
}
const response=await fetch(data.audio_url);
if(!response.ok||!response.body)throw Error(`Audio HTTP ${response.status}`);
const pcm=await decodeWindow(response.body,Math.max(0,timing.timestamp_from-2500),timing.timestamp_to+2500,
  {decoderFactory:()=>new MPEGDecoder()});
const buffer={sampleRate:pcm.sampleRate,length:pcm.channelData[0].length,
  numberOfChannels:pcm.channelData.length,getChannelData:i=>pcm.channelData[i]};
const result=calibratedCuts(buffer,pcm.off,segments,positions);
console.log(JSON.stringify({reciter,chapter,verse,shiftMs:Math.round(result.shift),cuts:result.cuts,starts:result.starts,pauses:result.pauses},null,2));
if(process.env.DEBUG_AUDIO==='1'){
  const rate=buffer.sampleRate,frame=Math.round(rate*.01),levels=[];
  for(let i=0;i+frame<buffer.length;i+=frame){let max=0;for(const ch of pcm.channelData){let sum=0;for(let j=i;j<i+frame;j++)sum+=ch[j]*ch[j];max=Math.max(max,Math.sqrt(sum/frame));}levels.push({at:pcm.off+i/rate*1000,rms:max});}
  const sorted=levels.map(x=>x.rms).sort((a,b)=>a-b);
  const threshold=Math.max(.001,Math.min(sorted[Math.floor(sorted.length*.25)],sorted[Math.floor(sorted.length*.5)]*.65));
  console.log('threshold',threshold,'median',sorted[Math.floor(sorted.length*.5)]);
  for(const pos of positions){const left=segments.filter(s=>s[0]<=pos),right=segments.filter(s=>s[0]>pos);const end=Math.max(...left.map(s=>s[2])),next=Math.min(...right.map(s=>s[1])),mid=(end+next)/2;
    const nearby=levels.filter(x=>Math.abs(x.at-mid)<1500).sort((a,b)=>a.rms-b.rms).slice(0,5);console.log('word',pos,'end',end,'next',next,'minima',nearby);
    const runs=[];let open=null;for(const x of levels){if(x.rms<=threshold){if(open==null)open=x.at;}else if(open!=null){if(x.at-open>=120&&Math.abs((x.at+open)/2-mid)<500)runs.push([Math.round(open),Math.round(x.at)]);open=null;}}
    console.log('near-runs',runs);
    const wide=[];let opened=null;for(const x of levels){if(x.rms<=threshold){if(opened==null)opened=x.at;}else if(opened!=null){if(x.at-opened>=100&&Math.abs((x.at+opened)/2-mid)<2300)wide.push([Math.round(opened),Math.round(x.at),Math.round((x.at+opened)/2-mid)]);opened=null;}}
    console.log('wide-runs',wide.map(([from,to,offset])=>{
      const avg=(a,b)=>{const v=levels.filter(x=>x.at>=a&&x.at<b);return v.reduce((sum,x)=>sum+x.rms,0)/Math.max(1,v.length);};
      return {from,to,offset,low:+avg(from,to).toFixed(4),before:+avg(from-250,from).toFixed(4),after:+avg(to,to+250).toFixed(4)};
    }));}
}
if(reciter==='4'&&chapter==='4'&&verse==='12'&&positions.includes(49)){
  if(result.shift<900||result.shift>1050||![49,64,82].every(pos=>Number.isFinite(result.cuts[pos])))
    throw Error('Shatri/Nisa 12 acoustic regression');
}
