// Reuse only PCM decoded from the same original chapter recording. The cache
// never manufactures a timing boundary; acoustic cuts travel with that PCM.
const DB_NAME='elifa-split-audio';
const STORE='windows';
const META='index';
const FORMAT=1;
const MAX_AGE_MS=7*24*60*60*1000;
const MAX_ENTRY_BYTES=48*1024*1024;
const MAX_TOTAL_BYTES=96*1024*1024;
let opening;

function database(){
  if(!globalThis.indexedDB)return Promise.resolve(null);
  if(!opening)opening=new Promise(resolve=>{
    const req=indexedDB.open(DB_NAME,FORMAT);
    req.onupgradeneeded=()=>{
      if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE,{keyPath:'key'});
      if(!req.result.objectStoreNames.contains(META))req.result.createObjectStore(META,{keyPath:'key'});
    };
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>resolve(null);
    req.onblocked=()=>resolve(null);
  });
  return opening;
}

export function packWindow(key,result){
  const buffer=result?.buffer;
  if(!key||!buffer||!Number.isFinite(result.off)||!Number.isFinite(buffer.sampleRate)||
     !Number.isInteger(buffer.length)||buffer.length<1||
     !Number.isInteger(buffer.numberOfChannels)||buffer.numberOfChannels<1||buffer.numberOfChannels>2)return null;
  const bytes=buffer.length*buffer.numberOfChannels*4;
  if(bytes>MAX_ENTRY_BYTES)return null;
  const channels=[];
  for(let i=0;i<buffer.numberOfChannels;i++)channels.push(buffer.getChannelData(i).slice());
  return {key,format:FORMAT,ay:result.ay,off:result.off,rate:buffer.sampleRate,
    length:buffer.length,channels,shift:result.shift||0,cuts:result.cuts||{},
    starts:result.starts||{},pauses:result.pauses||{},
    finalTailRequestedEnd:Number.isFinite(result.finalTailRequestedEnd)?result.finalTailRequestedEnd:null,
    bytes,usedAt:Date.now()};
}

export function unpackWindow(entry,context){
  if(entry?.format!==FORMAT||!Number.isInteger(entry.ay)||
     !Number.isFinite(entry.off)||!Number.isFinite(entry.rate)||
     !Number.isInteger(entry.length)||entry.length<1||
     !Array.isArray(entry.channels)||entry.channels.length<1||entry.channels.length>2||
     entry.channels.some(ch=>!(ch instanceof Float32Array)||ch.length!==entry.length))return null;
  const buffer=context.createBuffer(entry.channels.length,entry.length,entry.rate);
  entry.channels.forEach((data,i)=>buffer.copyToChannel(data,i));
  return {buffer,off:entry.off,lo:entry.off,hi:entry.off+buffer.duration*1000,
    ay:entry.ay,shift:entry.shift||0,cuts:entry.cuts||{},
    starts:entry.starts||{},pauses:entry.pauses||{},
    finalTailRequestedEnd:Number.isFinite(entry.finalTailRequestedEnd)?entry.finalTailRequestedEnd:null};
}

export async function getWindow(key,context){
  const db=await database();if(!db||!key)return null;
  try{
    const entry=await new Promise(resolve=>{
      const request=db.transaction(STORE,'readonly').objectStore(STORE).get(key);
      request.onsuccess=()=>resolve(request.result||null);request.onerror=()=>resolve(null);
    });
    return entry&&Date.now()-entry.usedAt<=MAX_AGE_MS?unpackWindow(entry,context):null;
  }catch{return null;}
}

export async function putWindow(key,result){
  const entry=packWindow(key,result),db=await database();if(!db||!entry)return;
  try{
    const rows=await new Promise(resolve=>{
      const request=db.transaction(META,'readonly').objectStore(META).getAll();
      request.onsuccess=()=>resolve(request.result||[]);request.onerror=()=>resolve([]);
    });
    let total=rows.filter(row=>row.key!==key).reduce((sum,row)=>sum+(row.bytes||0),entry.bytes);
    const evict=rows.filter(row=>row.key!==key).sort((a,b)=>(a.usedAt||0)-(b.usedAt||0));
    const remove=[];
    for(const row of evict){if(total<=MAX_TOTAL_BYTES)break;remove.push(row.key);total-=row.bytes||0;}
    await new Promise(resolve=>{
      const tx=db.transaction([STORE,META],'readwrite'),store=tx.objectStore(STORE),meta=tx.objectStore(META);
      for(const oldKey of remove){store.delete(oldKey);meta.delete(oldKey);}
      store.put(entry);
      meta.put({key,bytes:entry.bytes,usedAt:entry.usedAt});
      tx.oncomplete=resolve;tx.onerror=resolve;tx.onabort=resolve;
    });
  }catch{/* Quota or private mode: playback remains available without a cache. */}
}
