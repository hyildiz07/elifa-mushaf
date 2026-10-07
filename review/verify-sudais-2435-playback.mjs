import fs from 'node:fs';
import {prepareWindow} from '../src/split-audio.mjs';

const candidate=JSON.parse(fs.readFileSync('review/sudais-24-35-transfer-candidate.json','utf8'));
const row=JSON.parse(fs.readFileSync('assets/audio-timing-overrides-r3-r5.json','utf8')).rows['3:24:35'];
const audioContext={createBuffer(channels,length,rate){
  const data=Array.from({length:channels},()=>new Float32Array(length));
  return {sampleRate:rate,length,duration:length/rate,numberOfChannels:channels,
    copyToChannel:(samples,index)=>data[index].set(samples),getChannelData:index=>data[index]};
}};
const positions=Array.from({length:47},(_,index)=>index+1);
const window=await prepareWindow({sourceUrl:row.url,verifiedCbr:false,
  verseRanges:{35:row.range,36:[row.next,row.next+1000]},verseSegments:{35:row.segments}},
35,audioContext,{positions});
const results=candidate.candidate_cuts.map(proposal=>{
  const position=proposal.after_word;
  const cut=window.cuts[position],start=window.starts?.[position];
  return {position,proposalMs:proposal.tentative_midpoint_ms,measuredCutMs:cut,
    nextStartMs:start,insideGap:Number.isFinite(cut)&&cut>=row.segments[position-1][2]&&
      cut<=row.segments[position][1],
    bufferCoversCut:Number.isFinite(cut)&&cut>=window.lo&&cut<=window.hi};
});
const output={verse:'24:35',source:row.url,range:row.range,
  pcmWindow:[window.lo,window.hi],sampleRate:window.buffer.sampleRate,results,
  allAcousticCuts:positions.filter(position=>Number.isFinite(window.cuts[position])).map(position=>({
    afterWord:position,cutMs:window.cuts[position],leftEndMs:row.segments[position-1][2],
    rightStartMs:row.segments[position][1]}))};
fs.writeFileSync('review/sudais-2435-playback-check.json',JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify(output,null,2));
