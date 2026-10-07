import fs from 'node:fs';
import {getCbrIndex,frameHeader} from '../src/mp3-seek.mjs';
const id=Number(process.argv[2]||9),chapter=Number(process.argv[3]||4);
for(const [rid,sid] of [[id,chapter]]){
  const path=new URL(`../tests/fixtures/${rid}-${sid}.json`,import.meta.url);
  const f=fs.existsSync(path)?JSON.parse(fs.readFileSync(path,'utf8')):
    (await (await fetch(`https://api.qurancdn.com/api/qdc/audio/reciters/${rid}/audio_files?chapter=${sid}&segments=true`)).json()).audio_files[0];
  const x=await getCbrIndex(f.audio_url);
  if(!x){console.log(rid,sid,'not CBR indexed');continue;}
  const bytes=new Uint8Array(await (await fetch(f.audio_url)).arrayBuffer());
  let at=x.start,mismatches=0,mismatchesAfter383=0,physicalMismatches=0,lastBad=0,bad=[],groups=[],pads=[],frame=0;
  while(at+4<bytes.length){
    const h=frameHeader(bytes,at);if(!h)break;
    if(frame>0){
      const predicted=1+Math.ceil((at-x.start-x.firstBytes)*(x.frames-1)/(x.size-x.firstBytes)-1e-9);
      const physical=1+Math.ceil((at-x.start-x.firstBytes)/
        ((x.samples===1152?144000:72000)*x.bitrate/x.rate)-1e-9);
      if(physical!==frame)physicalMismatches++;
      if(predicted!==frame){mismatches++;lastBad=frame;if(frame>383)mismatchesAfter383++;if(bad.length<12)bad.push({frame,predicted,at});if(groups.length&&groups.at(-1).to===frame-1)groups.at(-1).to=frame;else groups.push({from:frame,to:frame});}
      if(frame<300)pads.push(h.bytes);
    }
    at+=h.bytes;frame++;
  }
  console.log(rid,sid,{frames:frame,expected:x.frames,at,total:bytes.length,mismatches,mismatchesAfter383,physicalMismatches,lastBad,groups:groups.slice(0,12),bad:bad.slice(0,3)});
}
