// CBR fast seek is allowed with a complete Xing/Info frame. For a pinned,
// separately verified CBR source, a tagless file can use its MPEG frame size.
// The original chapter MP3 remains the sole audio source for split playback.
const BITRATES_MPEG1=[0,32,40,48,56,64,80,96,112,128,160,192,224,256,320];
const BITRATES_MPEG2=[0,8,16,24,32,40,48,56,64,80,96,112,128,144,160];
const RATES_MPEG1=[44100,48000,32000];
const RATES_MPEG2=[22050,24000,16000];
const RATES_MPEG25=[11025,12000,8000];

export function frameHeader(bytes,at){
  if(at+4>bytes.length||bytes[at]!==255||![0xfa,0xf2,0xe2].includes(bytes[at+1]&0xfe))return null;
  const b=bytes[at+2],version=(bytes[at+1]>>3)&3,layer=(bytes[at+1]>>1)&3;
  const mpeg1=version===3;
  const bitrate=(mpeg1?BITRATES_MPEG1:BITRATES_MPEG2)[b>>4];
  const rate=(mpeg1?RATES_MPEG1:version===2?RATES_MPEG2:RATES_MPEG25)[(b>>2)&3],padding=(b>>1)&1;
  if(![0,2,3].includes(version)||layer!==1||!bitrate||!rate)return null;
  return {rate,bitrate,bytes:Math.floor((mpeg1?144000:72000)*bitrate/rate)+padding,
    samples:mpeg1?1152:576,mono:(bytes[at+3]>>6)===3};
}

export function cbrIndex(bytes,totalBytes,{allowTagless=false}={}){
  let start=0;
  if(bytes.length>=10&&String.fromCharCode(...bytes.subarray(0,3))==='ID3'){
    start=10+((bytes[6]&127)<<21)+((bytes[7]&127)<<14)+((bytes[8]&127)<<7)+(bytes[9]&127);
    if(bytes[5]&16)start+=10;
  }
  const header=frameHeader(bytes,start);
  if(!header)return null;
  const xing=start+4+(header.samples===1152?(header.mono?17:32):(header.mono?9:17));
  const hasInfo=xing+16<=bytes.length&&String.fromCharCode(...bytes.subarray(xing,xing+4))==='Info';
  if(!hasInfo&&!allowTagless)return null;
  let frames,size;
  if(hasInfo){
    const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
    const flags=view.getUint32(xing+4);
    frames=view.getUint32(xing+8);size=view.getUint32(xing+12);
    if((flags&3)!==3||frames<10||size<1000||Math.abs(totalBytes-start-size)>4096)return null;
  }else{
    const frameBytes=(header.samples===1152?144000:72000)*header.bitrate/header.rate;
    frames=Math.round((totalBytes-start)/frameBytes);
    size=totalBytes-start;
    if(frames<30||Math.abs(size-frames*frameBytes)>4096)return null;
  }
  // Reject mixed bitrate files even when an encoder incorrectly labels them CBR.
  let at=start+header.bytes,checked=0,bitrate=null;
  while(at+4<bytes.length&&checked<100){
    const f=frameHeader(bytes,at);
    if(!f||f.rate!==header.rate||f.samples!==header.samples||bitrate&&f.bitrate!==bitrate)return null;
    bitrate=f.bitrate;at+=f.bytes;checked++;
  }
  if(checked<30)return null;
  return {start,frames,size,rate:header.rate,bitrate,firstBytes:hasInfo?header.bytes:0,
    samples:header.samples,tagless:!hasInfo,...(!hasInfo?{trimSamples:0}:{})};
}

const INDEX_PROBE_RETRY_DELAYS_MS=[200,600];

function waitForIndexProbeRetry(ms,signal){
  signal?.throwIfAborted();
  return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{
      signal?.removeEventListener('abort',onAbort);
      resolve();
    },ms);
    function onAbort(){
      clearTimeout(timer);
      reject(signal.reason);
    }
    signal?.addEventListener('abort',onAbort,{once:true});
    if(signal?.aborted)onAbort();
  });
}

async function cancelIndexProbeBody(response){
  try{await response.body?.cancel();}catch{}
}

function indexProbeExhausted(cause){
  const error=Error('Audio index temporarily unavailable',{cause});
  error.name='IndexProbeExhaustedError';
  return error;
}

// Retry only transient probe failures. A wrong status, changed recording, or
// malformed full-length bytes must fail closed.
async function fetchIndexProbe(url,options,fetcher,{readBytes=false}={}){
  for(let attempt=0;;attempt++){
    options.signal?.throwIfAborted();
    try{
      const response=await fetcher(url,options);
      let incomplete=false;
      if(response.status!==429&&(response.status<500||response.status>599)){
        if(readBytes&&response.status===206){
          const bytes=new Uint8Array(await response.arrayBuffer());
          const range=/^bytes=(\d+)-(\d+)$/.exec(options.headers?.Range||'');
          incomplete=!!range&&bytes.length!==Number(range[2])-Number(range[1])+1;
          if(!incomplete)return {response,bytes};
          if(attempt===INDEX_PROBE_RETRY_DELAYS_MS.length)throw indexProbeExhausted();
        }
        if(!incomplete){
          if(readBytes)await cancelIndexProbeBody(response);
          return {response};
        }
      }
      await cancelIndexProbeBody(response);
      if(attempt===INDEX_PROBE_RETRY_DELAYS_MS.length)throw indexProbeExhausted();
    }catch(error){
      if(options.signal?.aborted)throw options.signal.reason;
      if(error?.name==='IndexProbeExhaustedError')throw error;
      if(!['TypeError','NetworkError'].includes(error?.name))throw error;
      if(attempt===INDEX_PROBE_RETRY_DELAYS_MS.length)throw indexProbeExhausted(error);
    }
    await waitForIndexProbeRetry(INDEX_PROBE_RETRY_DELAYS_MS[attempt],options.signal);
  }
}

export async function getCbrIndex(url,{signal,fetcher=fetch,allowTagless=false}={}){
  const {response,bytes:head}=await fetchIndexProbe(url,{headers:{Range:'bytes=0-65535'},signal},fetcher,{readBytes:true});
  if(response.status!==206)return null;
  let total=Number(response.headers.get('Content-Range')?.match(/\/(\d+)$/)?.[1]);
  // Some audio CDNs support Range but omit Content-Range from CORS-exposed
  // headers. HEAD still exposes Content-Length, the exact total file size.
  if(!Number.isSafeInteger(total)||total<=65536){
    const {response:headResponse}=await fetchIndexProbe(url,{method:'HEAD',signal},fetcher);
    if(!headResponse.ok)return null;
    total=Number(headResponse.headers.get('Content-Length'));
  }
  if(!Number.isSafeInteger(total))return null;
  if(head.length!==65536)return null;
  const index=cbrIndex(head,total,{allowTagless});
  return index?{...index,head}:null;
}

// An offline download already has random access through Blob.slice(). Reading
// only its header avoids copying a whole long surah into an ArrayBuffer before
// the selected verse can play. Use the same conservative index validation as
// the HTTP Range path, with the downloaded blob's exact byte length.
export async function getCbrIndexFromBlob(blob,{signal,allowTagless=false}={}){
  if(!blob||!Number.isSafeInteger(blob.size)||blob.size<=65536)return null;
  signal?.throwIfAborted();
  const head=new Uint8Array(await blob.slice(0,65536).arrayBuffer());
  signal?.throwIfAborted();
  if(head.length!==65536)return null;
  const index=cbrIndex(head,blob.size,{allowTagless});
  return index?{...index,head}:null;
}

// The indexed Sudais chapter recordings are VBR. Their frame checkpoints are built
// from the exact original MP3, then paired with its size and head/tail hashes.
// If the recording changes, decline ranged decoding instead of guessing.
async function validateVbrIndex(row,head,tail){
  if(!row||!Number.isSafeInteger(row.fileSize)||!Array.isArray(row.checkpoints)||
    row.checkpoints.length<2||!globalThis.crypto?.subtle||
    head.length!==65536||tail.length!==65536)return null;
  const sha=async bytes=>Array.from(new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256',bytes)))
    .map(x=>x.toString(16).padStart(2,'0')).join('');
  if(await sha(head)!==row.headSha256||await sha(tail)!==row.tailSha256)return null;
  const first=frameHeader(head,row.start);
  if(!first||first.bytes!==row.firstFrameBytes||first.rate!==row.rate||first.samples!==row.samples||
    row.checkpoints[0][0]!==0||row.checkpoints[0][1]!==row.start||
    row.checkpoints.at(-1)[0]!==row.frames||row.checkpoints.at(-1)[1]>row.fileSize)return null;
  return {...row,head,vbr:true,firstBytes:row.firstFrameBytes,trimSamples:undefined};
}
export async function getVerifiedVbrIndex(url,row,{signal,fetcher=fetch}={}){
  if(!row||!Number.isSafeInteger(row.fileSize))return null;
  const {response:headResponse,bytes:head}=await fetchIndexProbe(url,{headers:{Range:'bytes=0-65535'},signal},fetcher,{readBytes:true});
  if(headResponse.status!==206)return null;
  const tailStart=row.fileSize-65536;
  const {response:tailResponse,bytes:tail}=await fetchIndexProbe(url,{headers:{Range:`bytes=${tailStart}-${row.fileSize-1}`},signal},fetcher,{readBytes:true});
  if(tailResponse.status!==206)return null;
  const {response:sizeResponse}=await fetchIndexProbe(url,{method:'HEAD',signal},fetcher);
  if(!sizeResponse.ok||Number(sizeResponse.headers.get('Content-Length'))!==row.fileSize)return null;
  return validateVbrIndex(row,head,tail);
}
export async function getVerifiedVbrIndexFromBlob(blob,row,{signal}={}){
  if(!blob||!row||blob.size!==row.fileSize)return null;
  signal?.throwIfAborted();
  const head=new Uint8Array(await blob.slice(0,65536).arrayBuffer());
  const tail=new Uint8Array(await blob.slice(blob.size-65536).arrayBuffer());
  signal?.throwIfAborted();
  return validateVbrIndex(row,head,tail);
}

export function rangeForWindow(index,fromMs,toMs){
  if(index.vbr){
    const frameMs=index.samples/index.rate*1000;
    const first=Math.max(1,Math.floor(fromMs/frameMs)+1-160);
    const last=Math.min(index.frames,Math.ceil(toMs/frameMs)+1+100);
    const checkpoints=index.checkpoints;
    let lo=0,hi=checkpoints.length-1;
    while(lo<hi){const mid=(lo+hi+1)>>1;if(checkpoints[mid][0]<=first)lo=mid;else hi=mid-1;}
    const start=checkpoints[lo][1];
    lo=0;hi=checkpoints.length-1;
    while(lo<hi){const mid=(lo+hi)>>1;if(checkpoints[mid][0]<last)lo=mid+1;else hi=mid;}
    const end=checkpoints[lo][1]-1;
    return {start,end,frameMs,firstFrame:checkpoints.find(x=>x[1]===start)?.[0]};
  }
  const frameMs=index.samples/index.rate*1000;
  const first=Math.max(0,Math.floor(fromMs/frameMs)-160);
  const last=Math.min(index.frames,Math.ceil(toMs/frameMs)+100);
  // Include several full frames before the requested verse for MP3 reservoir
  // and decoder priming. The cut is made only after decoding this prefix.
  const avg=index.size/index.frames;
  const start=Math.max(index.start+index.firstBytes, index.start+Math.floor(first*avg)-4096);
  const end=index.start+Math.min(index.size-1,Math.ceil(last*avg)+4096);
  return {start,end,frameMs,avg};
}

export function alignedRangeOffset(bytes,index,rangeStart){
  if(index.vbr){
    const checkpoint=index.checkpoints.find(x=>x[1]===rangeStart);
    if(!checkpoint||checkpoint[0]<1)return null;
    let at=0,count=0;
    while(at+4<=bytes.length&&count<30){
      const f=frameHeader(bytes,at);
      if(!f||f.rate!==index.rate||f.samples!==index.samples)return null;
      at+=f.bytes;count++;
    }
    if(count<30)return null;
    return {skip:0,off:(checkpoint[0]-1)*index.samples/index.rate*1000,frame:checkpoint[0]};
  }
  for(let i=0;i<bytes.length-8;i++){
    const h=frameHeader(bytes,i),next=h&&frameHeader(bytes,i+h.bytes);
    const third=next&&frameHeader(bytes,i+h.bytes+next.bytes);
    if(!third||h.bitrate!==index.bitrate||next.bitrate!==index.bitrate||
      third.bitrate!==index.bitrate||h.rate!==index.rate||next.rate!==index.rate||third.rate!==index.rate||
      h.samples!==index.samples||next.samples!==index.samples||third.samples!==index.samples)continue;
    const absolute=rangeStart+i;
    // The first Xing/Info frame may have a different bitrate and byte size.
    // Exclude it when converting a byte position to a frame count.
    const frame=index.tagless?
      Math.round((absolute-index.start)/((index.samples===576?72000:144000)*index.bitrate/index.rate)):
      1+Math.ceil(index.samples===576?
        (absolute-index.start-index.firstBytes)/((72000*index.bitrate)/index.rate)-1e-9:
        (absolute-index.start-index.firstBytes)*(index.frames-1)/(index.size-index.firstBytes)-1e-9);
    if(frame<(index.tagless?0:1)||frame>=index.frames)return null;
    // The Info frame is metadata, not a sample in the chapter timeline.
    let at=i,count=0;
    while(at+4<=bytes.length){
      const f=frameHeader(bytes,at);
      if(!f){
        // Some complete chapter MP3s end in an ID3v1 TAG. A final-verse
        // ranged request includes those 128 bytes; they are not audio frames.
        const isFinalTag=bytes.length-at===128&&
          bytes[at]===84&&bytes[at+1]===65&&bytes[at+2]===71&&
          rangeStart+bytes.length===index.start+index.size;
        if(isFinalTag)break;
        return null;
      }
      if(f.bitrate!==index.bitrate||f.rate!==index.rate||f.samples!==index.samples)return null;
      at+=f.bytes;count++;
    }
    if(count<30||at-bytes.length>418)return null;
    return {skip:i,off:(frame-(index.tagless?0:1))*index.samples/index.rate*1000,frame};
  }
  return null;
}
