// Research-only batch screen of QUL candidate verse boundaries against the
// locally pinned QDC MP3. Quiet PCM narrows review; it cannot prove phonemes.
import fs from 'node:fs';
import {MPEGDecoderWebWorker} from 'mpg123-decoder';

async function metadata(surah,count){
  const prefix=`https://qul.tarteel.ai/api/v1/audio/surah_segments/3?surah=${surah}&from=1&to=${count}&page=`;
  async function page(number){
    const response=await fetch(prefix+number,{signal:AbortSignal.timeout(30000)});
    if(!response.ok)throw Error(`QUL ${surah} page ${number}: ${response.status}`);
    return response.json();
  }
  const first=await page(1),rows={...first.segments};
  for(let start=2;start<=first.pagination.total_pages;start+=3){
    const batch=await Promise.all(Array.from({length:Math.min(3,first.pagination.total_pages-start+1)},(_,i)=>page(start+i)));
    for(const result of batch)Object.assign(rows,result.segments);
  }
  return rows;
}

async function energyTrace(path){
  const decoder=new MPEGDecoderWebWorker();
  let rate=0,total=0;
  const sums=[],counts=[];
  try{
    await decoder.ready;
    for await(const chunk of fs.createReadStream(path,{highWaterMark:32768})){
      const decoded=await decoder.decode(new Uint8Array(chunk));
      if(decoded.errors?.length)throw Error(`Decode failed: ${path}`);
      if(!decoded.samplesDecoded)continue;
      if(!rate)rate=decoded.sampleRate;
      if(rate!==decoded.sampleRate)throw Error(`Sample rate changed: ${path}`);
      const channels=decoded.channelData;
      for(let i=0;i<decoded.samplesDecoded;i++){
        const bin=Math.floor((total+i)*100/rate);
        let power=0;
        for(const channel of channels)power=Math.max(power,channel[i]*channel[i]);
        sums[bin]=(sums[bin]||0)+power;
        counts[bin]=(counts[bin]||0)+1;
      }
      total+=decoded.samplesDecoded;
    }
  }finally{await decoder.free();}
  return {rate,durationMs:total/rate*1000,rms:sums.map((sum,i)=>Math.sqrt(sum/counts[i]))};
}

function screen(trace,leftMs,rightMs){
  const levels=trace.rms,lo=Math.max(0,Math.floor(leftMs/10)),hi=Math.min(levels.length,Math.ceil(rightMs/10));
  const context=levels.slice(Math.max(0,lo-50),Math.min(levels.length,hi+50));
  const peak=Math.max(...context);
  const threshold=Math.min(.002,peak*.015);
  let run=0,best=0;
  for(let i=lo;i<hi;i++){
    if(levels[i]<=threshold){run++;best=Math.max(best,run);}else run=0;
  }
  return {gapMs:rightMs-leftMs,quietRunMs:best*10,threshold,peak,
    gapRms:Math.sqrt(levels.slice(lo,hi).reduce((sum,value)=>sum+value*value,0)/Math.max(1,hi-lo))};
}

const report={status:'research-only-no-production-cut',chapters:{}};
for(const [surah,count] of [[3,200],[4,176]]){
  const rows=await metadata(surah,count);
  const trace=await energyTrace(`test-results/sudais-qdc-${surah}.mp3`);
  const boundaries=[];
  for(let ayah=1;ayah<count;ayah++){
    const left=rows[`${surah}:${ayah}`],right=rows[`${surah}:${ayah+1}`];
    if(!left||!right){boundaries.push({after:`${surah}:${ayah}`,missing:true});continue;}
    boundaries.push({after:`${surah}:${ayah}`,leftEndMs:left.time_to,rightStartMs:right.time_from,
      ...screen(trace,left.time_to,right.time_from)});
  }
  const quiet=boundaries.filter(row=>row.quietRunMs>=120);
  report.chapters[surah]={verses:count,pcmDurationMs:trace.durationMs,boundaries,
    quietBoundaryCount:quiet.length,nonQuietBoundaryCount:boundaries.length-quiet.length};
  console.log(JSON.stringify({surah,verses:count,boundaries:boundaries.length,
    quiet:quiet.length,nonQuiet:boundaries.length-quiet.length}));
}
fs.writeFileSync('review/sudais-interverse-acoustics-2026-09-30.json',JSON.stringify(report,null,2)+'\n');
