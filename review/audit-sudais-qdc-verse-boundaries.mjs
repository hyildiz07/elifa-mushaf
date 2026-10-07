import fs from 'node:fs';
const targets=[['3-160','real-search',2677407],['4-143','real-search',2980867],['5-5','sequential',192853]];
const dir='test-results/review-sudais-qdc-verse-ends';
for(const [key,type,boundary] of targets){
  const meta=JSON.parse(fs.readFileSync(`${dir}/${key}-${type}.json`,'utf8'));
  const wav=fs.readFileSync(meta.wav_file),rate=wav.readUInt32LE(24),dataOff=44,off=meta.actual_window_ms[0];
  const frames=(wav.length-dataOff)/2,step=Math.round(rate*.01),levels=[];
  const lo=Math.max(0,Math.floor((boundary-1000-off)*rate/1000)),
    hi=Math.min(frames,Math.ceil((boundary+1000-off)*rate/1000));
  for(let i=lo;i+step<=hi;i+=step){let sum=0;
    for(let j=i;j<i+step;j++){const x=wav.readInt16LE(dataOff+j*2)/32768;sum+=x*x;}
    levels.push({ms:Math.round(off+i/rate*1000),rms:Math.sqrt(sum/step)});
  }
  const local=levels.filter(x=>Math.abs(x.ms-boundary)<=500),
    median=[...local.map(x=>x.rms)].sort((a,b)=>a-b)[Math.floor(local.length/2)];
  const near=local.reduce((best,x)=>x.rms<best.rms?x:best);
  const threshold=Math.min(.01,median*.15);
  let current=null,best=null;
  for(const x of local){if(x.rms<=threshold){current??={from:x.ms,to:x.ms+10};current.to=x.ms+10;}
    else if(current){if(!best||current.to-current.from>best.to-best.from)best=current;current=null;}}
  if(current&&(!best||current.to-current.from>best.to-best.from))best=current;
  console.log(JSON.stringify({key,boundary_ms:boundary,median_rms:+median.toFixed(5),
    min_near_boundary:{ms:near.ms,rms:+near.rms.toFixed(5)},threshold:+threshold.toFixed(5),
    longest_quiet_run_near_boundary:best,levels_center:local.filter(x=>Math.abs(x.ms-boundary)<=80)
      .map(x=>[x.ms,+x.rms.toFixed(5)])}));
}
