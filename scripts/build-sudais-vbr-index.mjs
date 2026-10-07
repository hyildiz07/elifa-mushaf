import fs from 'node:fs';
import crypto from 'node:crypto';
import {frameHeader} from '../src/mp3-seek.mjs';

const rows={};
for(const sid of [3,4,5,27,28,29]){
  const af=JSON.parse(fs.readFileSync(`test-results/timings/3-${sid}.json`));
  const bytes=fs.readFileSync(`test-results/sudais-qdc-${sid}.mp3`);
  let start=0;
  if(bytes.toString('ascii',0,3)==='ID3'){
    start=10+((bytes[6]&127)<<21)+((bytes[7]&127)<<14)+((bytes[8]&127)<<7)+(bytes[9]&127);
    if(bytes[5]&16)start+=10;
  }
  const first=frameHeader(bytes,start);
  if(!first)throw Error(`${sid}: first frame missing`);
  const xing=start+4+(first.samples===1152?(first.mono?17:32):(first.mono?9:17));
  if(bytes.toString('ascii',xing,xing+4)!=='Xing')throw Error(`${sid}: Xing missing`);
  const declared=bytes.readUInt32BE(xing+8),declaredSize=bytes.readUInt32BE(xing+12);
  let at=start,frame=0;
  const checkpoints=[];
  while(at+4<=bytes.length){
    const h=frameHeader(bytes,at);
    if(!h)break;
    if(h.rate!==first.rate||h.samples!==first.samples)throw Error(`${sid}: format changed at frame ${frame}`);
    if(frame%100===0)checkpoints.push([frame,at]);
    at+=h.bytes;frame++;
  }
  // Xing counts playable frames; the first metadata frame is separate.
  if(frame!==declared+1||Math.abs(at-start-declaredSize)>4096)
    throw Error(`${sid}: frame/size mismatch: ${frame}/${declared}, ${at-start}/${declaredSize}`);
  checkpoints.push([frame,at]);
  const sha=data=>crypto.createHash('sha256').update(data).digest('hex');
  rows[af.audio_url]={fileSize:bytes.length,start,firstFrameBytes:first.bytes,frames:frame,
    rate:first.rate,samples:first.samples,headSha256:sha(bytes.subarray(0,65536)),
    tailSha256:sha(bytes.subarray(-65536)),checkpoints};
  console.log(`${sid}: ${frame} frames, ${checkpoints.length} checkpoints, ${at-start} audio bytes`);
}
fs.writeFileSync('assets/sudais-vbr-index.json',JSON.stringify({format:'frame-checkpoints-v1',rows}));
