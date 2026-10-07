import {test} from 'node:test';
import assert from 'node:assert/strict';
import {quietCut,decodeWindow,calibratedCuts,calibrateRangeTrim,fetchRangeBytes,fetchFullStream,prepareWindow,completeAtIndexedFileEnd} from '../src/split-audio.mjs';

const rangeResponse=(status,bytes,contentRange='bytes 10-12/100')=>new Response(bytes,{status,headers:{'Content-Range':contentRange}});

test('full-stream fetch retries only transient failures before decoding',async()=>{
  const url='https://audio.example/short.mp3',calls=[];
  const controller=new AbortController();
  const body=new ReadableStream({start(stream){stream.enqueue(Uint8Array.of(1));stream.close();}});
  const stream=await fetchFullStream(url,{signal:controller.signal,fetcher:async (requested,options)=>{
    calls.push({requested,signal:options.signal});
    if(calls.length===1)throw new TypeError('connection reset');
    if(calls.length===2)return new Response(null,{status:503});
    return {ok:true,body};
  }});
  assert.equal(stream,body);
  assert.deepEqual(calls,Array.from({length:3},()=>({requested:url,signal:controller.signal})));
});

test('full-stream fetch refuses permanent failures and stops after three transient failures',async()=>{
  let calls=0,cancelled=false;
  await assert.rejects(fetchFullStream('chapter.mp3',{fetcher:async()=>{
    calls++;return {ok:false,status:404,body:{cancel:async()=>{cancelled=true;}}};
  }}),/Chapter audio unavailable/);
  assert.equal(calls,1);assert.equal(cancelled,true);
  calls=0;
  await assert.rejects(fetchFullStream('chapter.mp3',{fetcher:async()=>{
    calls++;return new Response(null,{status:503});
  }}),/temporarily unavailable/);
  assert.equal(calls,3);
  const controller=new AbortController();calls=0;
  const pending=fetchFullStream('chapter.mp3',{signal:controller.signal,fetcher:async()=>{
    calls++;setTimeout(()=>controller.abort(),10);return new Response(null,{status:503});
  }});
  await assert.rejects(pending,error=>error?.name==='AbortError');
  assert.equal(calls,1);
});

test('remote range retries a network error and retryable statuses without changing source or bytes',async()=>{
  const url='https://audio.example/chapter.mp3',seek={start:10,end:12},calls=[];
  const controller=new AbortController();
  const fetcher=async (requested,options)=>{
    calls.push({requested,range:options.headers.Range,signal:options.signal});
    if(calls.length===1)throw new TypeError('connection reset');
    if(calls.length===2)return rangeResponse(429,null);
    return rangeResponse(206,Uint8Array.of(1,2,3));
  };
  assert.deepEqual(await fetchRangeBytes(url,seek,{signal:controller.signal,fetcher}),Uint8Array.of(1,2,3));
  assert.deepEqual(calls,Array.from({length:3},()=>({requested:url,range:'bytes=10-12',signal:controller.signal})));
});

test('remote range retries an interrupted body read before decoding',async()=>{
  let calls=0;
  const bytes=await fetchRangeBytes('chapter.mp3',{start:10,end:12},{fetcher:async()=>{
    calls++;
    if(calls===1)return {status:206,headers:{get:()=>null},arrayBuffer:async()=>{throw new TypeError('body connection lost');}};
    return rangeResponse(206,Uint8Array.of(4,5,6));
  }});
  assert.deepEqual(bytes,Uint8Array.of(4,5,6));
  assert.equal(calls,2);
});

test('remote range retries a truncated 206 body before falling back to a full chapter',async()=>{
  let calls=0;
  const bytes=await fetchRangeBytes('chapter.mp3',{start:10,end:12},{fetcher:async()=>{
    calls++;
    return calls===1?rangeResponse(206,Uint8Array.of(1,2)):
      rangeResponse(206,Uint8Array.of(1,2,3));
  }});
  assert.deepEqual(bytes,Uint8Array.of(1,2,3));
  assert.equal(calls,2);
});

test('remote range rejects changed or nonretryable responses without retrying',async()=>{
  for(const response of [
    rangeResponse(206,Uint8Array.of(1,2,3),'bytes 11-13/100'),
    rangeResponse(404,null),
    rangeResponse(200,Uint8Array.of(1,2,3))
  ]){
    let calls=0;
    assert.equal(await fetchRangeBytes('chapter.mp3',{start:10,end:12},{fetcher:async()=>{calls++;return response;}}),null);
    assert.equal(calls,1);
  }
  let calls=0;
  await assert.rejects(fetchRangeBytes('chapter.mp3',{start:10,end:12},{fetcher:async()=>{
    calls++;throw new Error('application bug');
  }}),/application bug/);
  assert.equal(calls,1);
  const hiddenHeader=new Response(Uint8Array.of(1,2,3),{status:206});
  assert.deepEqual(await fetchRangeBytes('chapter.mp3',{start:10,end:12},{fetcher:async()=>hiddenHeader}),Uint8Array.of(1,2,3));
  let cancelled=false;
  assert.equal(await fetchRangeBytes('chapter.mp3',{start:10,end:12},{fetcher:async()=>({
    status:200,headers:{get:()=>null},body:{cancel:async()=>{cancelled=true;}}
  })}),null);
  assert.equal(cancelled,true,'an ignored Range releases the possible full-chapter response');
});

test('remote range stops after three retryable failures and abort interrupts backoff',async()=>{
  let calls=0;
  await assert.rejects(fetchRangeBytes('chapter.mp3',{start:10,end:12},{fetcher:async()=>{
    calls++;return rangeResponse(503,null);
  }}),error=>error?.name==='RangeFetchExhaustedError');
  assert.equal(calls,3);
  calls=0;
  await assert.rejects(fetchRangeBytes('chapter.mp3',{start:10,end:12},{fetcher:async()=>{
    calls++;return rangeResponse(206,Uint8Array.of(1,2));
  }}),error=>error?.name==='RangeFetchExhaustedError');
  assert.equal(calls,3);
  const controller=new AbortController();
  calls=0;
  const pending=fetchRangeBytes('chapter.mp3',{start:10,end:12},{signal:controller.signal,fetcher:async()=>{
    calls++;setTimeout(()=>controller.abort(),10);return rangeResponse(503,null);
  }});
  await assert.rejects(pending,error=>error?.name==='AbortError');
  assert.equal(calls,1);
});

test('late verse in a long indexed chapter does not decode from zero after range outage',async()=>{
  const originalFetch=globalThis.fetch;
  const requests=[];
  globalThis.fetch=async (_url,options={})=>{
    requests.push(options.headers?.Range||'full');
    if(!options.headers?.Range)throw Error('unexpected full-chapter download');
    return rangeResponse(503,null);
  };
  const audio={sourceUrl:'https://audio.example/chapter.mp3',
    cbrIndex:{frames:3000,samples:1152,rate:44100,size:9*1024*1024,start:0,firstBytes:0,trimSamples:0},
    verseRanges:{1:[40000,41000]},verseSegments:{1:[]}};
  try{
    await assert.rejects(prepareWindow(audio,1,{},{}),error=>error?.name==='RangeFetchExhaustedError');
    assert.equal(requests.length,3);
    assert.equal(new Set(requests).size,1);
    assert.notEqual(requests[0],'full');
  }finally{globalThis.fetch=originalFetch;}
});

test('a short chapter retains its full-stream fallback after a range outage',async()=>{
  const originalFetch=globalThis.fetch;
  const requests=[];
  globalThis.fetch=async (_url,options={})=>{
    requests.push(options.headers?.Range||'full');
    if(!options.headers?.Range)throw Error('full fallback reached');
    return rangeResponse(503,null);
  };
  const audio={sourceUrl:'https://audio.example/short.mp3',
    cbrIndex:{frames:3000,samples:1152,rate:44100,size:1024*1024,start:0,firstBytes:0,trimSamples:0},
    verseRanges:{1:[40000,41000]},verseSegments:{1:[]}};
  try{
    await assert.rejects(prepareWindow(audio,1,{},{}),/full fallback reached/);
    assert.deepEqual(requests.slice(-1),['full']);
    assert.equal(requests.length,4);
  }finally{globalThis.fetch=originalFetch;}
});

test('late verse does not fetch an entire chapter when all index probes fail',async()=>{
  const originalFetch=globalThis.fetch;
  const requests=[];
  globalThis.fetch=async (_url,options={})=>{
    requests.push(options.headers?.Range||'full');
    if(!options.headers?.Range)throw Error('unexpected full-chapter download');
    return rangeResponse(503,null);
  };
  const audio={sourceUrl:'https://audio.example/chapter.mp3',reciterId:1,
    verseRanges:{1:[180000,181000]},verseSegments:{1:[]}};
  try{
    await assert.rejects(prepareWindow(audio,1,{},{}),
      error=>error?.name==='IndexProbeExhaustedError');
    assert.deepEqual(requests,['bytes=0-65535','bytes=0-65535','bytes=0-65535']);
  }finally{globalThis.fetch=originalFetch;}
});

function pcm(channels,rate=1000){return {sampleRate:rate,length:channels[0].length,numberOfChannels:channels.length,getChannelData:c=>channels[c]};}

function calibrationFixture(voicedFromMs,shift){
  const rate=44100,length=rate*4,full=new Float32Array(length),later=new Float32Array(length);
  for(let i=Math.ceil(voicedFromMs*rate/1000);i<length-shift;i++){
    const sample=Math.sin(i*.037+Math.sin(i*.001))*.1;
    full[i]=sample;later[i+shift]=sample;
  }
  const head=new Uint8Array(65536);
  head[0]=1;head[1]=2;
  const decoded=[];
  const decoderFactory=()=>({ready:Promise.resolve(),async decode(bytes){
    const source=bytes[0]===1?full:later;
    decoded.push(bytes[0]);
    return {sampleRate:rate,channelData:[source],samplesDecoded:source.length};
  },async free(){}});
  return {index:{head,start:0,firstBytes:1,rate},decoderFactory,decoded};
}

test('range trim calibration retries after a silent three-second lead',async()=>{
  const {index,decoderFactory,decoded}=calibrationFixture(3250,1105);
  assert.equal(await calibrateRangeTrim(index,{decoderFactory}),1105);
  assert.deepEqual(decoded,[1,2,1,2]);
});

test('range trim calibration still uses the first three seconds when they contain voice',async()=>{
  const {index,decoderFactory,decoded}=calibrationFixture(500,529);
  assert.equal(await calibrateRangeTrim(index,{decoderFactory}),529);
  assert.deepEqual(decoded,[1,2]);
});

test('a connected word boundary and a voiced timestamp gap are never treated as silence',()=>{
  const voice=new Float32Array(2000).fill(.2);
  assert.equal(quietCut(pcm([voice]),0,600,600),null);
  assert.equal(quietCut(pcm([voice]),0,600,1000),null);
});
test('a sustained quiet gap is cut in its middle, not at the next word onset',()=>{
  const voice=new Float32Array(2000).fill(.2);voice.fill(0,600,1000);
  assert.equal(quietCut(pcm([voice]),0,600,1000),800);
  assert.equal(quietCut(pcm([voice,new Float32Array(2000).fill(.2)]),0,600,1000),null);
});
test('a short closure inside speech and a completely silent file are rejected',()=>{
  const voice=new Float32Array(2000).fill(.2);voice.fill(0,700,760);
  assert.equal(quietCut(pcm([voice]),0,600,1000),null);
  assert.equal(quietCut(pcm([new Float32Array(2000)]),0,600,1000),null);
});
test('several shifted acoustic pauses calibrate a noisy chapter recording',()=>{
  const samples=new Float32Array(6000).fill(.1);
  for(const [from,to] of [[1900,2200],[3100,3400],[4300,4600]])samples.fill(.01,from,to);
  const segments=[[1,0,1000],[2,1300,2200],[3,2500,3400],[4,3700,4500]];
  const result=calibratedCuts(pcm([samples]),0,segments,[1,2,3]);
  assert.ok(Math.abs(result.shift-900)<15);
  for(const pos of [1,2,3])assert.ok(Number.isFinite(result.cuts[pos]));
  assert.ok(result.cuts[1]>1900&&result.cuts[1]<2200);
});
test('voiced intervals cannot create a shifted split',()=>{
  const samples=new Float32Array(6000).fill(.1);
  const segments=[[1,0,1000],[2,1300,2200],[3,2500,3400],[4,3700,4500]];
  const result=calibratedCuts(pcm([samples]),0,segments,[1,2,3]);
  assert.equal(result.shift,0);assert.deepEqual(result.cuts,{});
});
test('an acoustic pause can validate a stop even when word timestamps touch',()=>{
  const samples=new Float32Array(2000).fill(.1);samples.fill(.01,800,1080);
  const result=calibratedCuts(pcm([samples]),0,[[1,0,1000],[2,1000,2000]],[1]);
  assert.equal(result.shift,0);
  assert.ok(result.cuts[1]>=1010&&result.cuts[1]<=1065);
});
test('a long breath near touching word timestamps is split without inventing an MP3 shift',()=>{
  const samples=new Float32Array(5000).fill(.1);samples.fill(.001,1000,2500);
  const result=calibratedCuts(pcm([samples]),0,[[1,0,1000],[2,1020,4000]],[1]);
  assert.equal(result.shift,0);
  assert.ok(result.cuts[1]>=1160&&result.cuts[1]<=1200);
  assert.ok(result.starts[1]>=2380&&result.starts[1]<=2420);
});
test('streaming decode keeps the exact requested samples and cancels the remaining download',async()=>{
  let cancelled=false,freed=false,n=0;
  const stream=new ReadableStream({pull(c){c.enqueue(new Uint8Array([1]));},cancel(){cancelled=true;}});
  const decoderFactory=()=>({ready:Promise.resolve(),decode(){const a=Float32Array.from({length:1000},(_,i)=>n*1000+i);n++;return {channelData:[a],sampleRate:1000,samplesDecoded:1000,errors:[]};},free(){freed=true;}});
  const result=await decodeWindow(stream,1500,2600,{decoderFactory});
  assert.equal(result.off,1500);assert.equal(result.channelData[0].length,1100);
  assert.equal(result.channelData[0][0],1500);assert.equal(result.channelData[0].at(-1),2599);
  assert.equal(n,3);assert.ok(cancelled&&freed);
});
test('decoder errors fail closed and release resources instead of shifting timestamps',async()=>{
  let freed=false;
  const stream=new ReadableStream({start(c){c.enqueue(new Uint8Array([1]));c.close();}});
  await assert.rejects(decodeWindow(stream,0,100,{decoderFactory:()=>({ready:Promise.resolve(),decode:()=>({errors:['bad frame']}),free(){freed=true;}})}),/decoding failed/);
  assert.ok(freed);
});
test('only the file-ending verse tolerates a short absent MP3 tail',async()=>{
  const stream=()=>new ReadableStream({start(c){c.enqueue(new Uint8Array([1]));c.close();}});
  const decoderFactory=()=>({ready:Promise.resolve(),decode:()=>({channelData:[new Float32Array(1000)],sampleRate:1000,samplesDecoded:1000,errors:[]}),free(){}});
  await assert.rejects(decodeWindow(stream(),0,1100,{decoderFactory}),/ends before/);
  const result=await decodeWindow(stream(),0,1100,{decoderFactory,maxMissingMs:120});
  assert.equal(result.channelData[0].length,1000);
});
test('a selected final verse may end at the verified physical MP3 end, never mid-file',()=>{
  const index={frames:1000,samples:1152,rate:1000,trimSamples:200,size:200000};
  const fileEnd=1151800,providerEnd=1152200;
  const audio={cbrIndex:index,verseRanges:{1:[0,500000],2:[500000,providerEnd]}};
  assert.equal(completeAtIndexedFileEnd(audio,providerEnd,fileEnd),true);
  assert.equal(completeAtIndexedFileEnd(audio,providerEnd,fileEnd-41),false,'actual audio must reach the indexed end');
  assert.equal(completeAtIndexedFileEnd(audio,providerEnd-100,fileEnd),false,'an interior selection stays strict');
  assert.equal(completeAtIndexedFileEnd(audio,providerEnd+300,fileEnd),false,'large missing tails stay blocked');
  assert.equal(completeAtIndexedFileEnd({...audio,cbrIndex:{...index,size:0}},providerEnd,fileEnd),false);
  assert.equal(completeAtIndexedFileEnd({...audio,cbrIndex:null},providerEnd,fileEnd),false);
  const vbr={...index,fileSize:index.size};delete vbr.size;
  assert.equal(completeAtIndexedFileEnd({...audio,cbrIndex:vbr},providerEnd,fileEnd),true,
    'a verified VBR index carries fileSize rather than size');
  const withFinalWord={...audio,verseSegments:{2:[[1,500000,600000],[2,600000,fileEnd-3]]}};
  assert.equal(completeAtIndexedFileEnd(withFinalWord,fileEnd-3,fileEnd-26),true,
    'a terminal word may end just before indexed EOF while decoded PCM is one frame shorter');
  assert.equal(completeAtIndexedFileEnd(withFinalWord,600000,fileEnd-26),false,
    'an interior word never borrows the terminal EOF allowance');
});
test('prepared final split window carries the verified physical EOF marker only for the last verse',async()=>{
  const buffer={duration:1,numberOfChannels:1,sampleRate:1000,length:1000,getChannelData:()=>new Float32Array(1000)};
  const audio={buffer,cbrIndex:{frames:1,samples:1000,rate:1000,trimSamples:0,size:10000},
    verseRanges:{1:[0,500],2:[500,1025]},verseSegments:{1:[],2:[]}};
  const first=await prepareWindow(audio,1,null,{positions:[]});
  const last=await prepareWindow(audio,2,null,{positions:[]});
  assert.equal(first.finalTailRequestedEnd,null);
  assert.equal(last.finalTailRequestedEnd,1025);
  assert.equal(last.hi,1000);
});
