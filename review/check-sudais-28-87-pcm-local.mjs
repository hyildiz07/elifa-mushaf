import fs from 'node:fs';
import {MPEGDecoder} from 'mpg123-decoder';
import {decodeWindow,prepareWindow} from '../src/split-audio.mjs';
import {getVerifiedVbrIndexFromBlob} from '../src/mp3-seek.mjs';

const timing=JSON.parse(fs.readFileSync('test-results/timings/3-28.json','utf8'));
const catalog=JSON.parse(fs.readFileSync('assets/sudais-vbr-index.json','utf8'));
const row=timing.verse_timings.find(v=>v.verse_key==='28:87');
const next=timing.verse_timings.find(v=>v.verse_key==='28:88');
const blob=new Blob([fs.readFileSync('test-results/sudais-qdc-28.mp3')]);
const index=await getVerifiedVbrIndexFromBlob(blob,catalog.rows[timing.audio_url]);
const context={createBuffer(n,len,rate){const data=Array.from({length:n},()=>new Float32Array(len));
  return {sampleRate:rate,length:len,duration:len/rate,numberOfChannels:n,
    copyToChannel:(samples,ch)=>data[ch].set(samples),getChannelData:ch=>data[ch]};}};
const audio={sourceUrl:timing.audio_url,recordingUrl:timing.audio_url,reciterId:3,
  offlineBlob:blob,cbrIndex:index,verseRanges:{87:[row.timestamp_from,row.timestamp_to],
    88:[next.timestamp_from,next.timestamp_to]},verseSegments:{87:row.segments}};
const ranged=await prepareWindow(audio,87,context,{positions:[]});
const from=row.timestamp_from+100,to=row.timestamp_to-100;
const full=await decodeWindow(blob.stream(),from,to,{decoderFactory:()=>new MPEGDecoder()});
const rate=full.sampleRate,block=Math.round(rate*.01),out=[];
for(let at=0;at<full.channelData[0].length-block;at+=block){
  const absTime=full.off+at/rate*1000;
  const j=Math.round((absTime-ranged.off)*rate/1000);
  let sum=0,max=0,n=0;
  for(let ch=0;ch<full.channelData.length;ch++)for(let k=0;k<block;k++){
    const diff=full.channelData[ch][at+k]-ranged.buffer.getChannelData(ch)[j+k];
    sum+=diff*diff;max=Math.max(max,Math.abs(diff));n++;
  }
  const rms=Math.sqrt(sum/n);
  if(rms>1e-4)out.push({at_ms:Math.round(absTime),rms_diff:+rms.toFixed(6),max_abs_diff:+max.toFixed(6)});
}
const report={verse:'28:87',source:'same MP3, full-stream decode vs VBR-indexed range decode',
  suspect_blocks_10ms:out.length,first_suspect:out[0],last_suspect:out.at(-1),blocks:out};
fs.writeFileSync('review/sudais-qdc-align/28-87-local-pcm.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,blocks:out.slice(0,8)}));
