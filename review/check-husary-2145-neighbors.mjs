// Independent byte check of QUD's surprising neighboring-verse labels.
import {createHash} from 'node:crypto';
import {decodeWindow} from '../src/split-audio.mjs';
const numbers=[145,146,147];
const files=[];
for(const ay of numbers){
  const url=`https://everyayah.com/data/Husary_Muallim_128kbps/002${String(ay).padStart(3,'0')}.mp3`;
  const response=await fetch(url);if(!response.ok)throw Error(`${ay}: HTTP ${response.status}`);
  const bytes=Buffer.from(await response.arrayBuffer());
  const pcm=await decodeWindow(new Blob([bytes]).stream(),0,180000,{maxMissingMs:180000});
  files.push({ay,url,bytes,duration_ms:Math.round(pcm.channelData[0].length/pcm.sampleRate*1000),
    sha256:createHash('sha256').update(bytes).digest('hex')});
}
const parent=files[0].bytes;
for(const file of files.slice(1)){
  const anchors=[];
  for(const fraction of [.1,.3,.5,.7,.9]){
    const offset=Math.floor((file.bytes.length-4096)*fraction);
    anchors.push({fraction,offset_in_neighbor:offset,offset_in_145:parent.indexOf(file.bytes.subarray(offset,offset+4096))});
  }
  file.byte_anchors_in_145=anchors;
}
console.log(JSON.stringify(files.map(({ay,url,bytes,duration_ms,sha256,byte_anchors_in_145})=>
  ({ay,url,bytes:bytes.length,duration_ms,sha256,byte_anchors_in_145})),null,2));
