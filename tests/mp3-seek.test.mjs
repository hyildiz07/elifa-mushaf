import {test} from 'node:test';
import assert from 'node:assert/strict';
import {frameHeader,cbrIndex,rangeForWindow,alignedRangeOffset,getCbrIndex,getCbrIndexFromBlob,getVerifiedVbrIndex,getVerifiedVbrIndexFromBlob} from '../src/mp3-seek.mjs';
import {createHash} from 'node:crypto';

test('MPEG frame headers reject unsupported sample rates and formats',()=>{
  assert.equal(frameHeader(new Uint8Array([255,251,144,0]),0)?.bytes,417);
  assert.equal(frameHeader(new Uint8Array([255,251,146,0]),0)?.bytes,418);
  assert.equal(frameHeader(new Uint8Array([255,243,128,0]),0)?.samples,576);
  assert.equal(frameHeader(new Uint8Array([255,243,128,0]),0)?.rate,22050);
  assert.equal(frameHeader(new Uint8Array([255,227,192,192]),0)?.rate,11025);
  assert.equal(frameHeader(new Uint8Array([255,227,192,192]),0)?.samples,576);
  assert.equal(frameHeader(new Uint8Array([255,227,128,0]),0)?.rate,11025);
});

test('CBR seeking identifies the same absolute frame early and late in Nisa',()=>{
  const index={start:45,frames:167508,size:70011714,rate:44100,bitrate:128,firstBytes:208,samples:1152};
  for(const [rangeStart,skip,frame] of [[5046582,110,12075],[69173831,338,165505]]){
    const bytes=new Uint8Array(skip+417*35);
    bytes.set([255,251,144,0],skip);
    for(let i=1;i<35;i++)bytes.set([255,251,144,0],skip+i*417);
    const aligned=alignedRangeOffset(bytes,index,rangeStart);
    assert.equal(aligned.frame,frame);
    assert.equal(aligned.off,(frame-1)*1152/44100*1000);
  }
  const range=rangeForWindow(index,320000,420000);
  assert.ok(range.start>0&&range.end>range.start);
  assert.ok(range.end-range.start<2_000_000);
});

test('MPEG-2 CBR seeking preserves Husary Nisa frame positions',()=>{
  const index={start:45,frames:264397,size:55253698,rate:22050,bitrate:64,firstBytes:208,samples:576};
  for(const [rangeStart,skip,frame] of [[4542936,110,21739],[54573805,127,261145]]){
    const bytes=new Uint8Array(skip+208*35);
    for(let i=0;i<35;i++)bytes.set([255,243,128,0],skip+i*208);
    const aligned=alignedRangeOffset(bytes,index,rangeStart);
    assert.equal(aligned?.frame,frame);
    assert.equal(aligned.off,(frame-1)*576/22050*1000);
  }
});

test('MPEG-2.5 Info-tagged audio supports bounded CBR seeking',()=>{
  const bytes=new Uint8Array(65536);
  for(let at=0;at+4<bytes.length;at+=835)bytes.set([255,227,192,192],at);
  bytes.set([73,110,102,111],13);
  const view=new DataView(bytes.buffer);
  view.setUint32(17,3);view.setUint32(21,1000);view.setUint32(25,835000);
  const index=cbrIndex(bytes,835000);
  assert.equal(index?.rate,11025);
  assert.equal(index?.samples,576);
  assert.equal(index?.tagless,false);
  const range=rangeForWindow(index,20000,23000);
  assert.ok(range.start>0&&range.end-range.start<300000);
});

test('browser-hidden Content-Range uses HEAD size without losing fast seeking',async()=>{
  const bytes=new Uint8Array(65536);
  for(let at=0;at+417<bytes.length;at+=417)bytes.set([255,251,144,0],at);
  bytes.set([73,110,102,111],36); // Info
  const view=new DataView(bytes.buffer);
  view.setUint32(40,3);view.setUint32(44,1000);view.setUint32(48,417000);
  const calls=[];
  const fetcher=async(_url,options)=>{
    calls.push(options);
    if(options.method==='HEAD')return new Response(null,{status:200,headers:{'Content-Length':'417000'}});
    return new Response(bytes,{status:206,headers:{'Content-Length':'65536'}});
  };
  const index=await getCbrIndex('https://example.test/chapter.mp3',{fetcher});
  assert.equal(index?.frames,1000);
  assert.equal(index?.head.length,65536);
  assert.equal(calls.length,2);
  assert.equal(calls[1].method,'HEAD');
});

test('CBR index probes retry transient Range and HEAD failures with identical requests',async()=>{
  const bytes=new Uint8Array(65536);
  for(let at=0;at+417<bytes.length;at+=417)bytes.set([255,251,144,0],at);
  bytes.set([73,110,102,111],36);
  const view=new DataView(bytes.buffer);
  view.setUint32(40,3);view.setUint32(44,1000);view.setUint32(48,417000);
  const calls=[];
  let ranges=0,heads=0;
  const fetcher=async(url,options)=>{
    calls.push({url,range:options.headers?.Range,method:options.method,signal:options.signal});
    if(options.method==='HEAD'){
      if(++heads===1)return new Response(null,{status:503});
      return new Response(null,{status:200,headers:{'Content-Length':'417000'}});
    }
    if(++ranges===1)return new Response(null,{status:429});
    if(ranges===2)throw new TypeError('temporary network failure');
    return new Response(bytes,{status:206});
  };
  const controller=new AbortController();
  const url='https://example.test/chapter.mp3';
  const index=await getCbrIndex(url,{fetcher,signal:controller.signal});
  assert.equal(index?.frames,1000);
  assert.deepEqual(calls.map(({url,range,method})=>[url,range,method]),[
    [url,'bytes=0-65535',undefined],[url,'bytes=0-65535',undefined],
    [url,'bytes=0-65535',undefined],[url,undefined,'HEAD'],[url,undefined,'HEAD']]);
  assert.ok(calls.every(call=>call.signal===controller.signal));
});

test('CBR index retries a truncated 206 head before losing the fast seek path',async()=>{
  const bytes=new Uint8Array(65536);
  for(let at=0;at+417<bytes.length;at+=417)bytes.set([255,251,144,0],at);
  bytes.set([73,110,102,111],36);
  const view=new DataView(bytes.buffer);
  view.setUint32(40,3);view.setUint32(44,1000);view.setUint32(48,417000);
  let calls=0;
  const fetcher=async()=>new Response(++calls===1?bytes.subarray(0,50000):bytes,
    {status:206,headers:{'Content-Range':'bytes 0-65535/417000'}});
  const index=await getCbrIndex('https://example.test/chapter.mp3',{fetcher});
  assert.equal(index?.frames,1000);
  assert.equal(calls,2);
});

test('verified VBR index probes retry transient failures and still reject changed bytes',async()=>{
  const head=new Uint8Array(65536),tail=new Uint8Array(65536);
  head.set([255,251,144,0]);
  const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
  const row={fileSize:140000,start:0,firstFrameBytes:417,frames:500,rate:44100,
    samples:1152,headSha256:sha(head),tailSha256:sha(tail),
    checkpoints:[[0,0],[500,140000]]};
  const url='https://example.test/vbr.mp3',calls=[];
  let headCalls=0,tailCalls=0,sizeCalls=0;
  const fetcher=async(requestUrl,options)=>{
    calls.push([requestUrl,options.headers?.Range,options.method]);
    if(options.method==='HEAD'){
      if(++sizeCalls===1)return new Response(null,{status:429});
      return new Response(null,{status:200,headers:{'Content-Length':String(row.fileSize)}});
    }
    if(options.headers.Range==='bytes=0-65535'){
      if(++headCalls===1)return new Response(null,{status:500});
      return new Response(head,{status:206});
    }
    if(++tailCalls===1)throw new TypeError('temporary network failure');
    return new Response(tail,{status:206});
  };
  assert.equal((await getVerifiedVbrIndex(url,row,{fetcher}))?.vbr,true);
  assert.deepEqual(calls,[
    [url,'bytes=0-65535',undefined],[url,'bytes=0-65535',undefined],
    [url,'bytes=74464-139999',undefined],[url,'bytes=74464-139999',undefined],
    [url,undefined,'HEAD'],[url,undefined,'HEAD']]);
  const changedHead=head.slice();changedHead[100]=1;
  let changedCalls=0;
  const changedFetcher=async(_url,options)=>{
    changedCalls++;
    if(options.method==='HEAD')return new Response(null,{status:200,headers:{'Content-Length':'140000'}});
    return new Response(options.headers.Range==='bytes=0-65535'?changedHead:tail,{status:206});
  };
  assert.equal(await getVerifiedVbrIndex(url,row,{fetcher:changedFetcher}),null);
  assert.equal(changedCalls,3);
});

test('index probes do not retry Range 200, other 4xx, or invalid bytes',async()=>{
  for(const status of [200,404,416]){
    let calls=0,cancellations=0;
    const fetcher=async()=>{
      calls++;
      return new Response(new ReadableStream({cancel(){cancellations++;}}),{status});
    };
    assert.equal(await getCbrIndex('https://example.test/audio.mp3',{fetcher}),null);
    assert.equal(calls,1);
    assert.equal(cancellations,1);
  }
  let calls=0;
  const fetcher=async()=>{calls++;return new Response(new Uint8Array(65536),{status:206,
    headers:{'Content-Range':'bytes 0-65535/140000'}});};
  assert.equal(await getCbrIndex('https://example.test/audio.mp3',{fetcher}),null);
  assert.equal(calls,1);
});

test('index probes stop after two retries when transient errors persist',async()=>{
  for(const status of [429,503]){
    let calls=0,cancellations=0;
    const fetcher=async()=>{
      calls++;
      return new Response(new ReadableStream({cancel(){cancellations++;}}),{status});
    };
    await assert.rejects(getCbrIndex('https://example.test/audio.mp3',{fetcher}),
      error=>error?.name==='IndexProbeExhaustedError');
    assert.equal(calls,3);
    assert.equal(cancellations,3);
  }
  let calls=0;
  await assert.rejects(getCbrIndex('https://example.test/chapter.mp3',{
    fetcher:async()=>{
      calls++;
      return new Response(new Uint8Array(50000),{status:206,
        headers:{'Content-Range':'bytes 0-65535/417000'}});
    }
  }),error=>error?.name==='IndexProbeExhaustedError');
  assert.equal(calls,3);
});

test('index probe retry stops promptly when aborted',async()=>{
  const controller=new AbortController(),reason=new Error('cancelled');
  let calls=0;
  const fetcher=async()=>{
    calls++;
    queueMicrotask(()=>controller.abort(reason));
    return new Response(null,{status:503});
  };
  await assert.rejects(getCbrIndex('https://example.test/audio.mp3',{
    fetcher,signal:controller.signal}),error=>error===reason);
  assert.equal(calls,1);
});

test('pinned tagless CBR audio keeps exact late frame positions without an Info header',()=>{
  const bytes=new Uint8Array(65536),bitrate=128,rate=44100,average=144000*bitrate/rate;
  let at=0;
  for(let frame=0;at+420<bytes.length;frame++){
    const size=Math.floor((frame+1)*average)-Math.floor(frame*average);
    bytes.set([255,251,size===418?146:144,0],at);
    at+=size;
  }
  const total=Math.round(200000*average);
  assert.equal(cbrIndex(bytes,total),null,'unknown tagless files are not assumed safe');
  const index=cbrIndex(bytes,total,{allowTagless:true});
  assert.equal(index?.tagless,true);
  assert.equal(index?.trimSamples,0);
  const frame=180000,skip=214,chunk=new Uint8Array(skip+Math.ceil(35*average));
  let cursor=skip;
  for(let i=0;i<35;i++){
    const size=Math.floor((frame+i+1)*average)-Math.floor((frame+i)*average);
    chunk.set([255,251,size===418?146:144,0],cursor);
    cursor+=size;
  }
  const result=alignedRangeOffset(chunk,index,Math.floor(frame*average)-skip);
  assert.equal(result?.frame,frame);
  assert.equal(result?.off,frame*1152/rate*1000);
  const range=rangeForWindow(index,frame*1152/rate*1000,frame*1152/rate*1000+12000);
  assert.ok(range.end-range.start<500000,'late verse uses a bounded byte range');
});

test('a final ID3v1 tag does not force the last verse into full-file decoding',()=>{
  const frameCount=500,firstFrame=450,average=144000*128/44100;
  const bytes=new Uint8Array(Math.floor(frameCount*average)-Math.floor(firstFrame*average)+128);
  let at=0;
  for(let i=firstFrame;i<frameCount;i++){
    const size=Math.floor((i+1)*average)-Math.floor(i*average);
    bytes.set([255,251,size===418?146:144,0],at);at+=size;
  }
  bytes.set([84,65,71],bytes.length-128); // ID3v1 TAG
  const index={start:0,size:Math.floor(frameCount*average)+128,frames:frameCount,
    rate:44100,bitrate:128,samples:1152,tagless:true};
  const rangeStart=Math.floor(firstFrame*average);
  const aligned=alignedRangeOffset(bytes,index,rangeStart);
  assert.equal(aligned?.frame,firstFrame);
  assert.equal(aligned?.off,firstFrame*1152/44100*1000);
  bytes[bytes.length-128]=0;
  assert.equal(alignedRangeOffset(bytes,index,rangeStart),null);
});

test('offline CBR indexing reads only a bounded slice of the downloaded chapter',async()=>{
  const head=new Uint8Array(65536);
  for(let at=0;at+417<head.length;at+=417)head.set([255,251,144,0],at);
  head.set([73,110,102,111],36); // Info
  const view=new DataView(head.buffer);
  view.setUint32(40,3);view.setUint32(44,1000);view.setUint32(48,417000);
  const calls=[];
  const blob={size:417000,slice(from,to){calls.push([from,to]);return new Blob([head]);}};
  const index=await getCbrIndexFromBlob(blob);
  assert.equal(index?.frames,1000);
  assert.deepEqual(calls,[[0,65536]]);
  assert.equal(index.head.length,65536);
});

test('verified VBR checkpoints seek inside a long chapter and reject changed recordings',async()=>{
  const checkpoints=[],chunks=[];
  let offset=0;
  for(let frame=0;frame<500;frame++){
    if(frame%100===0)checkpoints.push([frame,offset]);
    const size=frame%2?418:417;
    const chunk=new Uint8Array(size);
    chunk.set([255,251,size===418?146:144,0]);
    chunks.push(chunk);offset+=size;
  }
  checkpoints.push([500,offset]);
  const blob=new Blob(chunks);
  const bytes=new Uint8Array(await blob.arrayBuffer());
  const sha=x=>createHash('sha256').update(x).digest('hex');
  const row={fileSize:blob.size,start:0,firstFrameBytes:417,frames:500,rate:44100,
    samples:1152,headSha256:sha(bytes.subarray(0,65536)),
    tailSha256:sha(bytes.subarray(-65536)),checkpoints};
  const index=await getVerifiedVbrIndexFromBlob(blob,row);
  assert.equal(index?.vbr,true);
  const seek=rangeForWindow(index,8500,9000);
  assert.ok(seek.start>0&&seek.end<blob.size&&seek.end-seek.start<blob.size);
  const aligned=alignedRangeOffset(bytes.subarray(seek.start,seek.end+1),index,seek.start);
  assert.equal(aligned?.frame,100);
  assert.equal(aligned?.off,99*1152/44100*1000);
  bytes[blob.size-1]=1;
  assert.equal(await getVerifiedVbrIndexFromBlob(new Blob([bytes]),row),null);
});

