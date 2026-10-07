import fs from 'node:fs';
import {decodeWindow} from '../src/split-audio.mjs';
const plan=[[3,10],[3,100],[3,195],[4,10],[4,88],[4,170]];
const outDir='test-results/review-sudais-qul-asr';fs.mkdirSync(outDir,{recursive:true});
function wav(p){const rate=22050,step=p.sampleRate/rate,ch=p.channelData[0];
  const n=Math.floor(ch.length/step),out=Buffer.alloc(44+n*2);
  out.write('RIFF',0);out.writeUInt32LE(out.length-8,4);out.write('WAVEfmt ',8);
  out.writeUInt32LE(16,16);out.writeUInt16LE(1,20);out.writeUInt16LE(1,22);
  out.writeUInt32LE(rate,24);out.writeUInt32LE(rate*2,28);out.writeUInt16LE(2,32);out.writeUInt16LE(16,34);
  out.write('data',36);out.writeUInt32LE(n*2,40);
  for(let i=0;i<n;i++){const j=Math.floor(i*step),k=Math.min(ch.length-1,Math.floor((i+1)*step));
    out.writeInt16LE(Math.max(-32768,Math.min(32767,Math.round((ch[j]+ch[k])/2*32767))),44+i*2);}return out;}
for(const [surah,ayah] of plan){const key=`${surah}:${ayah}`;
  const metadata=JSON.parse(fs.readFileSync(`test-results/sudais-qul-timings-${surah}.json`,'utf8'));
  const verse=metadata.segments[key],from=Math.max(0,verse.time_from-1200),to=verse.time_to+1200;
  const p=await decodeWindow(new Blob([fs.readFileSync(`test-results/sudais-qul-${surah}.mp3`)]).stream(),from,to);
  const audio=wav(p);fs.writeFileSync(`${outDir}/${surah}-${ayah}.wav`,audio);
  const form=new FormData();form.set('audio',new Blob([audio],{type:'audio/wav'}),`${surah}-${ayah}.wav`);
  form.set('model_name','Base');form.set('riwayah','hafs');
  const response=await fetch('https://hetchyy-quranic-universal-aligner.hf.space/api/v1/align/audio',
    {method:'POST',body:form,signal:AbortSignal.timeout(180000)});
  const result=await response.json(),matches=(result.segments||[]).filter(z=>
    z.ref_from?.startsWith(`${key}:`)||z.ref_to?.startsWith(`${key}:`));
  const report={key,source_url:metadata.audio.url,window_ms:[p.off,p.off+p.channelData[0].length/p.sampleRate*1000],
    provider_range_ms:[verse.time_from,verse.time_to],status:response.status,result};
  fs.writeFileSync(`${outDir}/${surah}-${ayah}.json`,JSON.stringify(report,null,2));
  console.log(JSON.stringify({key,status:response.status,matched_segments:matches.map(z=>({from:z.ref_from,to:z.ref_to,
    ms:[Math.round(p.off+z.time_from*1000),Math.round(p.off+z.time_to*1000)],confidence:z.confidence})),
    all_refs:result.segments?.map(z=>[z.ref_from,z.ref_to])}));
}
