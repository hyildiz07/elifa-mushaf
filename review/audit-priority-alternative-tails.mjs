// Read-only batch screen for alternate endings of 103 acoustically prioritized
// terminal verses. Sources: already-known QuranicAudio legacy and EveryAyah.
import {readFile,writeFile} from 'node:fs/promises';
import {MPEGDecoder} from 'mpg123-decoder';

const root=new URL('../',import.meta.url);
const input=JSON.parse(await readFile(new URL('test-results/final-tail-energy.json',root)));
const output=new URL('test-results/priority-alternative-tails.json',root);
const folders={3:'Abdurrahmaan_As-Sudais_192kbps',5:'Hani_Rifai_192kbps',
  6:'Husary_128kbps',7:'Alafasy_128kbps',10:'Saood_ash-Shuraym_128kbps',
  12:'Husary_Muallim_128kbps',97:'Yasser_Ad-Dussary_128kbps'};
const flagged=Object.entries(input.items).filter(([,r])=>r.physicalLast10Rms>.01||
  (r.gapMs< -50&&r.productionAfter50Rms>.02)||
  (r.gapMs>0&&r.physicalLast10Rms>.002));
if(flagged.length!==103)throw Error(`Priority count changed: ${flagged.length}`);
const pad=n=>String(n).padStart(3,'0');
const buildSources=(r)=>{
  const [ch,verse]=r.verse.split(':').map(Number),sources=[];
  if(r.reciter===3)sources.push({kind:'quranicaudio-legacy',url:`https://download.quranicaudio.com/quran/abdurrahmaan_as-sudays/${pad(ch)}.mp3`});
  if(r.reciter===5)sources.push({kind:'quranicaudio-legacy',url:`https://download.quranicaudio.com/quran/rifai/${pad(ch)}.mp3`});
  if(folders[r.reciter])sources.push({kind:'everyayah-verse',url:`https://everyayah.com/data/${folders[r.reciter]}/${pad(ch)}${pad(verse)}.mp3`});
  return sources;
};
const timeout=ms=>AbortSignal.timeout(ms);
async function fetchRetry(url,options){
  let error;
  for(let attempt=0;attempt<4;attempt++){
    try{return await fetch(url,{...options,signal:timeout(45000)});}
    catch(e){error=e;if(attempt<3)await new Promise(resolve=>setTimeout(resolve,500*(attempt+1)));}
  }
  throw error;
}
async function fetchTail(url,maxBytes=1_500_000){
  // archive.org's public redirect stalls Node fetch on this host. Its current
  // item CDN endpoint is byte-identical and supports bounded ranges.
  const resolvedUrl=url.replace('https://archive.org/download/Yasser_Aldosari_MP3_Quran/',
    'https://dn710809.ca.archive.org/0/items/Yasser_Aldosari_MP3_Quran/');
  const h=await fetchRetry(resolvedUrl,{method:'HEAD'});
  if(!h.ok)throw Error(`HEAD HTTP ${h.status}`);
  const bytes=Number(h.headers.get('content-length'));
  if(!(bytes>0))throw Error('No content length');
  const from=Math.max(0,bytes-maxBytes);
  const r=await fetchRetry(resolvedUrl,{headers:{Range:`bytes=${from}-${bytes-1}`}});
  if(r.status!==206&&!(r.status===200&&from===0))throw Error(`Range HTTP ${r.status}`);
  const raw=new Uint8Array(await r.arrayBuffer());
  if(raw.length!==bytes-from)throw Error(`Range length ${raw.length} != ${bytes-from}`);
  const decoder=new MPEGDecoder();await decoder.ready;
  try{
    const pcm=decoder.decode(raw),x=pcm.channelData[0],rate=pcm.sampleRate;
    const ms=new Float32Array(Math.floor(x.length/rate*1000));
    for(let i=0;i<ms.length;i++){
      const a=Math.floor(i*rate/1000),b=Math.max(a+1,Math.floor((i+1)*rate/1000));
      let sum=0;for(let j=a;j<b;j++)sum+=x[j];ms[i]=sum/(b-a);
    }
    return {bytes,rangeFrom:from,rate,ms,resolvedUrl};
  }finally{await decoder.free();}
}
function correlation(a,b,ai,bi,n=500){
  if(ai<0||bi<0||ai+n>a.length||bi+n>b.length)return -Infinity;
  let xy=0,xx=0,yy=0;
  for(let i=0;i<n;i+=2){const x=a[ai+i],y=b[bi+i];xy+=x*y;xx+=x*x;yy+=y*y;}
  return xy/Math.sqrt(xx*yy||1);
}
function findMatch(production,alternate){
  const p=production.ms,l=alternate.ms,pAnchor=p.length-700;
  if(pAnchor<0||l.length<500)return {status:'too-short'};
  let best={positionMs:null,correlation:-Infinity};
  for(let i=Math.max(0,l.length-18000);i<=l.length-500;i+=10){
    const c=correlation(p,l,pAnchor,i);
    if(c>best.correlation)best={positionMs:i,correlation:c};
  }
  if(best.positionMs==null)return {status:'no-match'};
  for(let i=Math.max(0,best.positionMs-20);i<=Math.min(l.length-500,best.positionMs+20);i++){
    const c=correlation(p,l,pAnchor,i);if(c>best.correlation)best={positionMs:i,correlation:c};
  }
  const extensionMs=l.length-best.positionMs-700;
  const checks=[1500,2500].map(back=>{
    const pa=p.length-back,expected=best.positionMs-(back-700);
    let match={correlation:-Infinity,positionMs:null};
    if(pa>=0)for(let i=Math.max(0,expected-100);i<=Math.min(l.length-500,expected+100);i+=2){
      const c=correlation(p,l,pa,i);if(c>match.correlation)match={correlation:c,positionMs:i};
    }
    return {backMs:back,...match,driftMs:match.positionMs==null?null:match.positionMs-expected};
  });
  const identity=best.correlation>=.95&&checks[0].correlation>=.85&&Math.abs(checks[0].driftMs)<=100;
  const start=l.length-extensionMs;
  const first250=Math.min(250,Math.max(0,Math.floor(extensionMs)));
  let sum=0;for(let i=start;i<start+first250;i++)sum+=l[i]*l[i];
  const extensionRms250=first250?Math.sqrt(sum/first250):0;
  return {status:identity?'same-performance-candidate':'unmatched',
    eofWindow:best,checks,extensionMs,extensionRms250,
    extraAudioCandidate:identity&&extensionMs>50&&extensionRms250>.001};
}
let prior={checkedAt:null,priorityCount:103,items:{}};
try{prior=JSON.parse(await readFile(output));}catch{}
const rows=flagged.map(([key,r])=>({key,r,sources:buildSources(r)}));
let cursor=0,done=0,saveChain=Promise.resolve();
function save(){
  const serialized=JSON.stringify(prior,null,2)+'\n';
  saveChain=saveChain.then(()=>writeFile(output,serialized));
  return saveChain;
}
async function worker(){
  while(cursor<rows.length){
    const {key,r,sources}=rows[cursor++];
    if(prior.items[key]?.complete&&!prior.items[key]?.error){done++;continue;}
    const result={reciter:r.reciter,verse:r.verse,productionUrl:r.url,priority:{gapMs:r.gapMs,last10Rms:r.physicalLast10Rms},alternatives:[],complete:false};
    try{
      const p=await fetchTail(r.url);
      result.productionBytes=p.bytes;
      result.productionResolvedUrl=p.resolvedUrl;
      for(const source of sources){
        try{
          const a=await fetchTail(source.url);
          result.alternatives.push({...source,bytes:a.bytes,rate:a.rate,...findMatch(p,a)});
        }catch(error){result.alternatives.push({...source,status:'source-error',error:String(error)});}
      }
      result.complete=true;
    }catch(error){result.error=String(error);result.complete=true;}
    prior.items[key]=result;done++;
    // Frequent checkpoints keep the one-pass screen resumable.
    if(done%5===0||done===rows.length){
      prior.checkedAt=new Date().toISOString();
      await save();
      process.stderr.write(`${done}/${rows.length} completed\n`);
    }
  }
}
await Promise.all(Array.from({length:Math.min(Number(process.env.AUDIO_AUDIT_CONCURRENCY)||6,rows.length)},worker));
prior.checkedAt=new Date().toISOString();
await save();
console.log(JSON.stringify({priority:rows.length,completed:Object.keys(prior.items).length,
  candidates:Object.values(prior.items).flatMap(x=>x.alternatives||[]).filter(a=>a.extraAudioCandidate).length}));
