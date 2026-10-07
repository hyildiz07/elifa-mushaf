import {MPEGDecoderWebWorker} from 'mpg123-decoder';
import {getCbrIndex,getCbrIndexFromBlob,getVerifiedVbrIndex,getVerifiedVbrIndexFromBlob,
  rangeForWindow,alignedRangeOffset} from './mp3-seek.mjs';

// Retry only a byte request that has not reached the decoder. Each attempt
// asks the same source for the same bytes; a changed or incomplete response
// still fails the existing range validation and falls back to full decoding.
export async function fetchRangeBytes(url,seek,{signal,fetcher=fetch}={}){
  const delays=[120,300];
  const expectedLength=seek.end-seek.start+1;
  const range=`bytes=${seek.start}-${seek.end}`;
  for(let attempt=0;;attempt++){
    signal?.throwIfAborted();
    let response;
    let incomplete=false;
    try{
      response=await fetcher(url,{headers:{Range:range},signal});
      if(response.status===206){
        const contentRange=response.headers.get('Content-Range');
        if(!contentRange||contentRange.startsWith(`bytes ${seek.start}-${seek.end}/`)){
          const bytes=new Uint8Array(await response.arrayBuffer());
          signal?.throwIfAborted();
          if(bytes.length===expectedLength)return bytes;
          // A truncated 206 body is often a dropped connection. Retry the
          // exact same byte interval before attempting a full chapter stream.
          if(attempt===delays.length){
            const error=Error('Audio byte range incomplete');
            error.name='RangeFetchExhaustedError';
            throw error;
          }
          incomplete=true;
        }
      }
      // An ignored Range may be a whole chapter. Release that response before
      // trying the established full-stream path or another small byte request.
      try{await response.body?.cancel();}catch{}
      if(!incomplete&&response.status!==429&&(response.status<500||response.status>599))return null;
      if(attempt===delays.length){
        const error=Error('Audio byte range temporarily unavailable');
        error.name='RangeFetchExhaustedError';
        throw error;
      }
    }catch(error){
      if(signal?.aborted||error?.name==='AbortError')throw error;
      if(error?.name==='RangeFetchExhaustedError')throw error;
      // Fetch reports connection and interrupted-body failures as TypeError.
      // An unrelated application error is not evidence of a transient link.
      if(!(error instanceof TypeError||error?.name==='NetworkError'))throw error;
      if(attempt===delays.length){
        const exhausted=Error('Audio byte range temporarily unavailable',{cause:error});
        exhausted.name='RangeFetchExhaustedError';
        throw exhausted;
      }
    }
    await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{signal?.removeEventListener('abort',onAbort);resolve();},delays[attempt]);
      const onAbort=()=>{clearTimeout(timer);reject(signal.reason);};
      signal?.addEventListener('abort',onAbort,{once:true});
      if(signal?.aborted)onAbort();
    });
  }
}

// The short-chapter and first-verse path sometimes needs a full stream.
// Retry only before handing its body to the decoder, so an interrupted decode
// never resumes at an invented byte or phoneme boundary.
export async function fetchFullStream(url,{signal,fetcher=fetch}={}){
  const delays=[120,300];
  for(let attempt=0;;attempt++){
    signal?.throwIfAborted();
    try{
      const response=await fetcher(url,{signal});
      if(response.ok&&response.body)return response.body;
      try{await response.body?.cancel();}catch{}
      if(response.status!==429&&(response.status<500||response.status>599))
        throw Error('Chapter audio unavailable');
      if(attempt===delays.length)throw Error('Chapter audio temporarily unavailable');
    }catch(error){
      if(signal?.aborted||error?.name==='AbortError')throw error;
      if(!(error instanceof TypeError||error?.name==='NetworkError'))throw error;
      if(attempt===delays.length)throw Error('Chapter audio temporarily unavailable',{cause:error});
    }
    await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{signal?.removeEventListener('abort',onAbort);resolve();},delays[attempt]);
      const onAbort=()=>{clearTimeout(timer);reject(signal.reason);};
      signal?.addEventListener('abort',onAbort,{once:true});
      if(signal?.aborted)onAbort();
    });
  }
}

let sudaisVbrCatalogPromise;
async function sudaisVbrRow(url){
  sudaisVbrCatalogPromise??=fetch('./assets/sudais-vbr-index.json?v=263',
    {signal:AbortSignal.timeout(8000)}).then(r=>{
    if(!r.ok)throw Error('VBR index unavailable');return r.json();
  }).catch(error=>{sudaisVbrCatalogPromise=null;throw error;});
  return (await sudaisVbrCatalogPromise).rows?.[url]||null;
}

// A ranged decoder does not see the MP3 gapless header, so its first PCM
// sample can precede the full decoder by an encoder-specific number of samples.
// Measure that difference on the same chapter's first seconds. If the match is
// not unambiguous, use the exact full-stream path instead of guessing a shift.
export async function calibrateRangeTrim(index,{signal,decoderFactory}={}){
  const head=index.head;
  if(!head||!index.firstBytes)return null;
  // The 64 KiB head can cover less than three seconds on a high-bitrate
  // recording, or the first three seconds can be silent. Try a longer sample
  // for silence and shorter ones for truncated heads; exact PCM matching is
  // still required before any ranged playback is allowed.
  for(const ms of [3000,4000,2000,1500]){
    try{
      const first=await decodeWindow(new Blob([head]).stream(),0,ms,{signal,decoderFactory});
      const later=await decodeWindow(new Blob([head.subarray(index.start+index.firstBytes)]).stream(),0,ms,{signal,decoderFactory});
      if(first.sampleRate!==later.sampleRate||first.sampleRate!==index.rate)return null;
      const a=first.channelData[0],b=later.channelData[0],max=Math.min(2304,b.length-a.length+2304);
      if(max<0)continue;
      const points=[];
      for(let j=3000;j<a.length-2304;j+=37)if(Math.abs(a[j])>.001)points.push(j);
      // Some chapters begin with more than three seconds of silence. A
      // successful decode of that silence cannot establish the trim shift.
      if(points.length<50)continue;
      let best=Infinity,shift=-1;
      for(let k=0;k<=max;k++){
        let error=0;
        for(const j of points){const d=a[j]-b[j+k];error+=d*d;}
        if(error<best){best=error;shift=k;}
      }
      if(best/points.length<1e-9)return shift;
    }catch(error){
      if(!String(error).includes('Audio ends before the requested verse'))throw error;
    }
  }
  return null;
}

// Decode the original chapter from its beginning (including encoder delay), but
// retain PCM only for this verse. No second recording or guessed time offset.
export async function decodeWindow(stream, fromMs, toMs, {signal,maxMissingMs=40,decoderFactory=()=>new MPEGDecoderWebWorker()}={}) {
  if (!(fromMs>=0 && toMs>fromMs && toMs-fromMs<=600000)) throw Error('Invalid audio window');
  const decoder=decoderFactory(), reader=stream.getReader();
  let rate=0, channels=null, total=0, copied=0;
  try {
    await decoder.ready;
    outer: while (true) {
      signal?.throwIfAborted();
      const {done,value}=await reader.read();
      if (done) break;
      // Bounded blocks also bound temporary decoded PCM memory.
      for(let offset=0;offset<value.length;offset+=32768){
        signal?.throwIfAborted();
        const d=await decoder.decode(value.slice(offset,offset+32768));
        if(d.errors?.length)throw Error('Audio decoding failed');
        if(!d.samplesDecoded)continue;
        if(!rate){
          rate=d.sampleRate;
          const size=Math.ceil(toMs*rate/1000)-Math.floor(fromMs*rate/1000);
          if(size*d.channelData.length*4>128*1024*1024)throw Error('Audio window too large');
          channels=d.channelData.map(()=>new Float32Array(size));
        }
        if(rate!==d.sampleRate || channels.length!==d.channelData.length)throw Error('Audio format changed');
        const first=Math.floor(fromMs*rate/1000),last=Math.ceil(toMs*rate/1000);
        const lo=Math.max(first,total),hi=Math.min(last,total+d.samplesDecoded);
        if(hi>lo){for(let ch=0;ch<channels.length;ch++)channels[ch].set(d.channelData[ch].subarray(lo-total,hi-total),lo-first);copied+=hi-lo;}
        total+=d.samplesDecoded;
        if(total>=last)break outer;
      }
    }
    if(!channels||!copied)throw Error('Audio window missing');
    // Up to one MP3 frame of end padding may be absent at the file end.
    const missing=channels[0].length-copied;
    if(missing>rate*maxMissingMs/1000)throw Error(`Audio ends before the requested verse (${Math.round(missing/rate*1000)} ms)`);
    return {channelData:channels.map(c=>c.subarray(0,copied)),sampleRate:rate,off:Math.floor(fromMs*rate/1000)/rate*1000};
  } finally {
    await reader.cancel().catch(()=>{});
    reader.releaseLock();
    await decoder.free();
  }
}

// Conservative acoustic check, not a linguistic judgement: require a sustained
// quiet interval strictly between the supplied words, on every audio channel.
export function quietCut(buffer, off, end, next) {
  if(!Number.isFinite(end)||!Number.isFinite(next)||next-end<160)return null;
  const sr=buffer.sampleRate, frame=Math.max(1,Math.round(sr*.005));
  const lo=Math.ceil((end-off)*sr/1000),hi=Math.floor((next-off)*sr/1000);
  if(lo<0||hi>buffer.length||hi<=lo)return null;
  const data=Array.from({length:buffer.numberOfChannels},(_,c)=>buffer.getChannelData(c));
  const rms=(a,b)=>{let max=0;for(const ch of data){let sum=0;for(let i=a;i<b;i++)sum+=ch[i]*ch[i];max=Math.max(max,Math.sqrt(sum/(b-a)));}return max;};
  let peak=0;
  for(let i=Math.max(0,lo-sr);i<Math.min(buffer.length,hi+sr);i+=frame)peak=Math.max(peak,rms(i,Math.min(buffer.length,i+frame)));
  if(peak<.0001)return null; // silent/corrupt recording is not a verified pause
  const threshold=Math.min(.002,peak*.015);
  let run=0,bestStart=0,bestLength=0;
  for(let i=lo;i+frame<=hi;i+=frame){
    if(rms(i,i+frame)<=threshold){run+=frame;if(run>bestLength){bestLength=run;bestStart=i+frame-run;}}
    else run=0;
  }
  if(bestLength/sr<.12)return null;
  return off+(bestStart+bestLength/2)/sr*1000;
}

// QuranCDN word timestamps and the chapter MP3 can have a fixed offset (for
// example, Shatri/Nisa is about 0.95 s). Match several independent metadata
// gaps to actual low-energy pauses before trusting any shifted boundary.
export function calibratedCuts(buffer,off,segments,positions) {
  const boundary=pos=>{
    const left=segments.filter(s=>s[0]<=pos),right=segments.filter(s=>s[0]>pos);
    if(!left.length||!right.length)return null;
    const end=Math.max(...left.map(s=>s[2])),next=Math.min(...right.map(s=>s[1]));
    return Number.isFinite(end)&&Number.isFinite(next)&&next>=end?{pos,end,next,mid:(end+next)/2}:null;
  };
  const boundaries=positions.map(boundary).filter(Boolean);
  if(!boundaries.length)return {shift:0,cuts:{}};
  // A long reciter pause is not an MP3 offset. With touching word timestamps,
  // its midpoint may be >1 s after the word, while the word itself is aligned.
  // Infer a global offset only from metadata that itself contains a pause.
  const evidence=[...new Set([...positions,...segments.map(s=>s[0])])].map(boundary)
    .filter(b=>b&&b.next-b.end>=160);
  const rate=buffer.sampleRate,frame=Math.max(1,Math.round(rate*.01));
  const channelData=Array.from({length:buffer.numberOfChannels},(_,i)=>buffer.getChannelData(i));
  const levels=[];
  for(let i=0;i+frame<=buffer.length;i+=frame){
    let peak=0;
    for(const channel of channelData){let sum=0;for(let j=i;j<i+frame;j++)sum+=channel[j]*channel[j];peak=Math.max(peak,Math.sqrt(sum/frame));}
    levels.push(peak);
  }
  if(levels.length<30)return {shift:0,cuts:{}};
  const ordered=[...levels].sort((a,b)=>a-b),median=ordered[Math.floor(ordered.length*.5)];
  if(median<.0001)return {shift:0,cuts:{}};
  const threshold=Math.max(.001,Math.min(ordered[Math.floor(ordered.length*.25)],median*.65));
  const runs=[];
  const mean=(from,to)=>levels.slice(from,to).reduce((a,b)=>a+b,0)/Math.max(1,to-from);
  for(let i=0;i<levels.length;){
    if(levels[i]>threshold){i++;continue;}
    const start=i;while(i<levels.length&&levels[i]<=threshold)i++;
    if(i-start<12||start<25||i+25>=levels.length)continue;
    const low=mean(start,i),before=mean(start-25,start),after=mean(i,i+25);
    const contrast=Math.max(low*1.4,threshold*(i-start>=35?.9:1.05));
    if(before<contrast||after<contrast)continue;
    runs.push({from:off+start*frame/rate*1000,to:off+i*frame/rate*1000});
  }
  const matches=[];
  for(const b of evidence)for(const run of runs){
    const offset=(run.from+run.to)/2-b.mid;
    if(Math.abs(offset)<=1500)matches.push({pos:b.pos,offset});
  }
  let cluster=[];
  for(const seed of matches){
    const own=[];
    for(const match of matches.filter(m=>Math.abs(m.offset-seed.offset)<=130).sort((a,b)=>Math.abs(a.offset-seed.offset)-Math.abs(b.offset-seed.offset))) {
      if(!own.some(x=>x.pos===match.pos))own.push(match);
    }
    if(own.length>cluster.length)cluster=own;
  }
  const shift=cluster.length>=3?cluster.map(x=>x.offset).sort((a,b)=>a-b)[Math.floor(cluster.length/2)]:0;
  const cuts={},starts={},pauses={};
  for(const b of boundaries){
    const end=b.end+shift,next=b.next+shift;
    if(next-end<160){
      // Some reciters have 20 ms metadata gaps but breathe for a full second
      // or longer. The metadata boundary lies near the START of that pause,
      // not its midpoint. Keep both words outside the cut and omit the long
      // silent middle from isolated memorisation parts.
      const longPause=runs.filter(run=>run.to-run.from>=350&&
        run.from>=end-750&&run.from<=end+200&&run.to>=end+120)
        .sort((a,b)=>Math.abs(a.from-end)-Math.abs(b.from-end))[0];
      if(longPause){
        // Leave the tail/reverb of the completed word intact before cutting.
        const cut=Math.max(end+10,longPause.from+180);
        if(cut<=longPause.to-100){cuts[b.pos]=cut;starts[b.pos]=Math.max(cut,longPause.to-100);pauses[b.pos]=longPause.to-longPause.from;continue;}
      }
      const nearby=runs.map(run=>({run,distance:Math.abs((run.from+run.to)/2-b.mid-shift)}))
        .filter(x=>x.distance<=350).sort((a,b)=>a.distance-b.distance);
      if(nearby.length){
        const run=nearby[0].run,cut=Math.max((run.from+run.to)/2,end+10);
        if(cut<=run.to-15){cuts[b.pos]=cut;starts[b.pos]=cut;pauses[b.pos]=run.to-run.from;}
      }
      continue;
    }
    const candidates=runs.map(run=>({from:Math.max(end,run.from),to:Math.min(next,run.to)}))
      .filter(run=>run.to-run.from>=120).sort((a,b)=>(b.to-b.from)-(a.to-a.from));
    if(candidates.length){cuts[b.pos]=(candidates[0].from+candidates[0].to)/2;pauses[b.pos]=candidates[0].to-candidates[0].from;}
    else if(!shift){const cut=quietCut(buffer,off,end,next);if(cut!=null){cuts[b.pos]=cut;pauses[b.pos]=120;}}
    if(Number.isFinite(cuts[b.pos]))starts[b.pos]=cuts[b.pos];
  }
  return {shift,cuts,starts,pauses};
}

export async function prepareWindow(audio, ay, context, {signal,positions}={}) {
  const range=audio.verseRanges[ay];
  if(!range)throw Error('Verse timing missing');
  let buffer=audio.buffer,off=0;
  if(!buffer){
    const from=Math.max(0,range[0]-2500);
    let to=range[1]+(audio.verseRanges[ay+1]?2500:0);
    const maxMissingMs=audio.verseRanges[ay+1]?40:120;
    let window=null;
    let indexedBytes=0;
    if(audio.offlineBlob||!audio.sourceUrl.startsWith('blob:')){
      try{
        // A transient Range/HEAD failure must not permanently disable the
        // fast path for this reciter for the rest of the browser session.
        let index=audio.cbrIndex||(audio.offlineBlob?
          await getCbrIndexFromBlob(audio.offlineBlob,{signal,allowTagless:audio.verifiedCbr===true}):
          await getCbrIndex(audio.sourceUrl,{signal,allowTagless:audio.verifiedCbr===true}));
        if(!index&&audio.reciterId===3){
          const row=await sudaisVbrRow(audio.recordingUrl||audio.sourceUrl);
          if(row)index=audio.offlineBlob?
            await getVerifiedVbrIndexFromBlob(audio.offlineBlob,row,{signal}):
            await getVerifiedVbrIndex(audio.sourceUrl,row,{signal});
        }
        if(index){audio.cbrIndex=index;indexedBytes=index.fileSize||index.size||0;}
        const rawEnd=index&&index.frames*index.samples/index.rate*1000;
        // The verified frame index also locates selections in the last ten
        // seconds. Clamping to its calibrated physical end avoids decoding a
        // whole long chapter just because the final metadata exceeds the MP3.
        if(index&&from>10000&&from<rawEnd-1000){
          if(index.trimSamples===undefined)index.trimSamples=await calibrateRangeTrim(index,{signal});
          if(index.trimSamples!=null){
            const fileEnd=index.frames*index.samples/index.rate*1000-index.trimSamples/index.rate*1000;
            to=Math.min(to,fileEnd);
          }
          const seek=rangeForWindow(index,from,to);
          let bytes=null;
          if(audio.offlineBlob){
            signal?.throwIfAborted();
            bytes=new Uint8Array(await audio.offlineBlob.slice(seek.start,seek.end+1).arrayBuffer());
            signal?.throwIfAborted();
          }else{
            bytes=await fetchRangeBytes(audio.sourceUrl,seek,{signal});
          }
          if(bytes){
            const aligned=bytes.length===seek.end-seek.start+1?
              alignedRangeOffset(bytes,index,seek.start):null;
            const trim=index.trimSamples;
            const correctedOff=aligned&&trim!=null?aligned.off-trim/index.rate*1000:null;
            if(correctedOff!=null&&correctedOff<=from){
              window=await decodeWindow(new Blob([bytes.subarray(aligned.skip)]).stream(),from-correctedOff,to-correctedOff,{signal,maxMissingMs});
              window.off+=correctedOff;
            }
          }
        }
      }catch(error){
        if(signal?.aborted)throw error;
        // A verified seek into a long chapter must not silently turn three
        // failed small byte requests into a many-megabyte decode from zero.
        // Keep the established full-stream fallback for short recordings.
        if(error?.name==='RangeFetchExhaustedError'&&indexedBytes>=8*1024*1024&&from>=30000)throw error;
        // Without a verified index, a late verse would otherwise require
        // decoding minutes of audio after the same host failed every probe.
        if(error?.name==='IndexProbeExhaustedError'&&from>=120000)throw error;
      }
    }
    if(!window){
      if(audio.offlineBlob)window=await decodeWindow(audio.offlineBlob.stream(),from,to,{signal,maxMissingMs});
      else{
        const stream=await fetchFullStream(audio.sourceUrl,{signal});
        window=await decodeWindow(stream,from,to,{signal,maxMissingMs});
      }
    }
    buffer=context.createBuffer(window.channelData.length,window.channelData[0].length,window.sampleRate);
    window.channelData.forEach((data,ch)=>buffer.copyToChannel(data,ch));off=window.off;
  }
  const segments=audio.verseSegments[ay]||[];
  const result=calibratedCuts(buffer,off,segments,positions||[...new Set(segments.map(s=>s[0]))]);
  const hi=off+buffer.duration*1000;
  return {buffer,off,lo:off,hi,ay,...result,
    finalTailRequestedEnd:!audio.verseRanges[ay+1]&&
      completeAtIndexedFileEnd(audio,range[1],hi)?range[1]:null};
}

// Decode an arbitrary selected passage from the same chapter recording. A
// selection may cross verse boundaries, while prepareWindow normally accepts
// only one verse. Do not use another recital or an imprecise HTMLAudio fallback.
export async function prepareSelectedRange(audio, fromMs, toMs, context, {signal}={}) {
  if(!(Number.isFinite(fromMs)&&Number.isFinite(toMs)&&fromMs>=0&&toMs>fromMs))
    throw Error('Invalid selected audio range');
  const end=Math.min(toMs+250,Number.isFinite(audio.end)?audio.end:Infinity);
  const selected={...audio,buffer:null,verseRanges:{1:[fromMs,Math.max(toMs,end)]},verseSegments:{1:[]}};
  const result=await prepareWindow(selected,1,context,{signal,positions:[]});
  if(selected.cbrIndex)audio.cbrIndex=selected.cbrIndex;
  if(result.lo>fromMs+1||
    (result.hi<toMs-1&&!completeAtIndexedFileEnd(audio,toMs,result.hi)))
    throw Error('Selected audio range incomplete');
  return result;
}

export function completeAtIndexedFileEnd(audio,requestedEnd,decodedEnd){
  const index=audio.cbrIndex,verseEntries=Object.entries(audio.verseRanges||{});
  const indexedBytes=Number.isFinite(index?.size)&&index.size>0?index.size:index?.fileSize;
  if(!index||!verseEntries.length||!Number.isFinite(index.frames)||
    !Number.isFinite(index.samples)||!Number.isFinite(index.rate)||index.rate<=0||
    !Number.isFinite(index.trimSamples)||!Number.isFinite(indexedBytes)||indexedBytes<=0)
    return false;
  const [finalVerse,range]=verseEntries.reduce((latest,row)=>row[1][1]>latest[1][1]?row:latest);
  const finalVerseEnd=range[1];
  const fileEnd=(index.frames*index.samples-index.trimSamples)/index.rate*1000;
  const absent=requestedEnd-fileEnd;
  const finalWordEnd=Math.max(-Infinity,...(audio.verseSegments?.[finalVerse]||[]).map(segment=>segment[2]));
  const terminalSelection=requestedEnd>=finalVerseEnd-1||
    (Number.isFinite(finalWordEnd)&&requestedEnd>=finalWordEnd-1);
  // Never excuse an interior selection or a missing chunk of a recording.
  // The last word can end a few milliseconds before the indexed file end,
  // while the decoder yields up to one frame less than that estimate. Accept
  // only a terminal word/verse and PCM within 40 ms of the physical MP3 end.
  return terminalSelection&&absent>=-40&&absent<=650&&
    decodedEnd>=fileEnd-40&&decodedEnd<=fileEnd+40;
}
