// Research-only exact-source PCM around the possible 24:35 word 40/41 cut.
import fs from 'node:fs';
import crypto from 'node:crypto';
import { prepareSelectedRange } from '../src/split-audio.mjs';

const sourceUrl='https://download.quranicaudio.com/qdc/abdurrahmaan_as_sudais/murattal/24.mp3';
const from=660000,to=666000,rate=16000;
const context={createBuffer(channels,length,sampleRate){
  const data=Array.from({length:channels},()=>new Float32Array(length));
  return {numberOfChannels:channels,length,sampleRate,duration:length/sampleRate,
    copyToChannel(values,index){data[index].set(values);},getChannelData(index){return data[index];}};
}};
const selected=await prepareSelectedRange({sourceUrl,recordingUrl:sourceUrl,reciterId:3,
  verseRanges:{35:[from,to]},verseSegments:{35:[]}},from,to,context);
const frames=(to-from)*rate/1000,wav=Buffer.alloc(44+frames*2);
wav.write('RIFF',0);wav.writeUInt32LE(wav.length-8,4);
wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);
wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);
wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*2,28);
wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);
wav.write('data',36);wav.writeUInt32LE(frames*2,40);
for(let i=0;i<frames;i++){
  const sourceIndex=Math.max(0,Math.min(selected.buffer.length-1,
    Math.round(((from-selected.off)/1000+i/rate)*selected.buffer.sampleRate)));
  let sample=0;
  for(let channel=0;channel<selected.buffer.numberOfChannels;channel++)
    sample+=selected.buffer.getChannelData(channel)[sourceIndex];
  sample/=selected.buffer.numberOfChannels;
  wav.writeInt16LE(Math.max(-32768,Math.min(32767,Math.round(sample*32767))),44+i*2);
}
const output=`test-results/review-phoneme/24-35-${from}-${to}.wav`;
fs.writeFileSync(output,wav);
console.log(JSON.stringify({output,from,to,sourceUrl,windowOffset:selected.off,
  wavSha256:crypto.createHash('sha256').update(wav).digest('hex')}));
