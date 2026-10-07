// Read-only review of QuranicAudio legacy chapter recordings against QDC tails.
import {MPEGDecoder} from 'mpg123-decoder';

const rows=[
  ['sudais-2:286','https://download.quranicaudio.com/qdc/abdurrahmaan_as_sudais/murattal/2.mp3','https://download.quranicaudio.com/quran/abdurrahmaan_as-sudays/002.mp3'],
  ['sudais-36:83','https://download.quranicaudio.com/qdc/abdurrahmaan_as_sudais/murattal/36.mp3','https://download.quranicaudio.com/quran/abdurrahmaan_as-sudays/036.mp3'],
  ['hani-2:286','https://download.quranicaudio.com/qdc/hani_ar_rifai/murattal/2.mp3','https://download.quranicaudio.com/quran/rifai/002.mp3'],
  ['hani-65:12','https://download.quranicaudio.com/qdc/hani_ar_rifai/murattal/65.mp3','https://download.quranicaudio.com/quran/rifai/065.mp3'],
];
async function tail(url){
  const head=await fetch(url,{method:'HEAD',signal:AbortSignal.timeout(15000)});
  if(!head.ok)throw Error(`${url} HEAD ${head.status}`);
  const size=Number(head.headers.get('content-length')),from=Math.max(0,size-1_500_000);
  const r=await fetch(url,{headers:{Range:`bytes=${from}-${size-1}`},signal:AbortSignal.timeout(30000)});
  if(r.status!==206)throw Error(`${url} range ${r.status}`);
  const decoder=new MPEGDecoder();await decoder.ready;
  try{
    const pcm=decoder.decode(new Uint8Array(await r.arrayBuffer()));
    const x=pcm.channelData[0],rate=pcm.sampleRate;
    const ms=new Float32Array(Math.floor(x.length/rate*1000));
    for(let i=0;i<ms.length;i++){
      const start=Math.floor(i*rate/1000),end=Math.max(start+1,Math.floor((i+1)*rate/1000));
      let sum=0;for(let j=start;j<end;j++)sum+=x[j];ms[i]=sum/(end-start);
    }
    const lastSamples=Math.min(x.length,Math.round(rate*10));
    return {url,size,from,rate,durationMs:ms.length,ms,
      lastPcm:x.slice(x.length-lastSamples),lastPcmStartMs:(x.length-lastSamples)/rate*1000};
  }finally{await decoder.free();}
}
function score(a,b,ai,bi,n=5000){
  let xy=0,xx=0,yy=0;
  for(let i=0;i<n;i+=5){const x=a[ai+i],y=b[bi+i];xy+=x*y;xx+=x*x;yy+=y*y;}
  return xy/Math.sqrt(xx*yy||1);
}
function rms(a,start,end){
  let total=0;for(let i=Math.max(0,start);i<Math.min(a.length,end);i++)total+=a[i]*a[i];
  return Math.sqrt(total/Math.max(1,Math.min(a.length,end)-Math.max(0,start)));
}
function spectralPower(x,rate,startMs,endMs,freq){
  const lo=Math.max(0,Math.round(startMs*rate/1000)),hi=Math.min(x.length,Math.round(endMs*rate/1000));
  let real=0,imag=0;
  for(let i=lo;i<hi;i++){const phase=2*Math.PI*freq*(i-lo)/rate;real+=x[i]*Math.cos(phase);imag+=x[i]*Math.sin(phase);}
  return (real*real+imag*imag)/Math.max(1,(hi-lo)*(hi-lo));
}
for(const [key,production,legacy] of rows){
  const [p,l]=await Promise.all([tail(production),tail(legacy)]);
  if(p.rate!==l.rate){console.log(JSON.stringify({key,productionBytes:p.size,legacyBytes:l.size,rateMismatch:[p.rate,l.rate]}));continue;}
  const pAnchor=p.ms.length-15000, searchStart=Math.max(0,l.ms.length-50000),searchEnd=l.ms.length-5000;
  let best={legacyPositionMs:null,correlation:-Infinity};
  for(let pos=searchStart;pos<searchEnd;pos+=10){const c=score(p.ms,l.ms,pAnchor,pos);
    if(c>best.correlation)best={legacyPositionMs:pos,correlation:c};}
  for(let pos=Math.max(searchStart,best.legacyPositionMs-30);pos<Math.min(searchEnd,best.legacyPositionMs+30);pos++){
    const c=score(p.ms,l.ms,pAnchor,pos);if(c>best.correlation)best={legacyPositionMs:pos,correlation:c};}
  // Aligned expected legacy EOF minus production EOF; positive means possible extension.
  const beyondMs=l.ms.length-best.legacyPositionMs-(p.ms.length-pAnchor);
  const alignedLegacyEof=l.ms.length-beyondMs;
  const legacyEnergyAfterProduction=[0,250,500,1000,2000,4000,6000].filter(x=>x<beyondMs)
    .map(x=>({fromMs:x,toMs:Math.min(beyondMs,x+250),rms:rms(l.ms,alignedLegacyEof+x,alignedLegacyEof+Math.min(beyondMs,x+250))}));
  const anchorChecks=[30000,20000,10000].map(backMs=>{
    const pPos=p.ms.length-backMs;
    const expected=best.legacyPositionMs+(pPos-pAnchor);
    let local={positionMs:null,correlation:-Infinity};
    for(let pos=Math.max(0,expected-300);pos<Math.min(l.ms.length-5000,expected+300);pos++){
      const c=score(p.ms,l.ms,pPos,pos);if(c>local.correlation)local={positionMs:pos,correlation:c};
    }
    return {backMs,...local,offsetFromExpectedMs:local.positionMs-expected};
  });
  const nearEndChecks=[2500,1500,700].map(backMs=>{
    const pPos=p.ms.length-backMs,expected=best.legacyPositionMs+(pPos-pAnchor);
    let local={positionMs:null,correlation:-Infinity};
    for(let pos=Math.max(0,expected-250);pos<Math.min(l.ms.length-(backMs-100),expected+250);pos++){
      const c=score(p.ms,l.ms,pPos,pos,Math.min(500,backMs-100));
      if(c>local.correlation)local={positionMs:pos,correlation:c};
    }
    return {backMs,...local,offsetFromExpectedMs:local.positionMs-expected};
  });
  const strongEnd=nearEndChecks.at(-1).correlation>0.9?nearEndChecks.at(-1):null;
  const confirmedBeyondMs=strongEnd?beyondMs-strongEnd.offsetFromExpectedMs:null;
  const extra50ms=confirmedBeyondMs==null?[]:Array.from({length:Math.ceil(Math.min(confirmedBeyondMs,1000)/50)},(_,i)=>{
    const fromMs=i*50,toMs=Math.min(confirmedBeyondMs,fromMs+50),a=l.ms.length-confirmedBeyondMs+fromMs,b=l.ms.length-confirmedBeyondMs+toMs;
    const rawA=a-l.lastPcmStartMs,rawB=b-l.lastPcmStartMs;
    return {fromMs,toMs,rms:rms(l.ms,a,b),spectralPower500:spectralPower(l.lastPcm,l.rate,rawA,rawB,500),
      spectralPower2000:spectralPower(l.lastPcm,l.rate,rawA,rawB,2000)};
  });
  console.log(JSON.stringify({key,productionBytes:p.size,legacyBytes:l.size,
    productionRate:p.rate,legacyRate:l.rate,productionTailMs:p.ms.length,legacyTailMs:l.ms.length,
    best,beyondMs,anchorChecks,nearEndChecks,confirmedBeyondMs,extra50ms,legacyEnergyAfterProduction}));
}
