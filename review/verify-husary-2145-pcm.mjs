// Read-only source identity check for Husary Muallim 2:145.
// Re-run before using per-verse word timings on the chapter recording.
import {decodeWindow} from '../src/split-audio.mjs';
import {createHash} from 'node:crypto';

const verseUrl='https://everyayah.com/data/Husary_Muallim_128kbps/002145.mp3';
const chapterUrl='https://download.quranicaudio.com/qdc/khalil_al_husary/muallim/2.mp3';
const expected='cc4640fa78a211b598a6e5f47880a5ff39112d3f8279d5260f860f1e1a1cad28';
const verseResponse=await fetch(verseUrl);
if(!verseResponse.ok)throw Error(`Verse HTTP ${verseResponse.status}`);
const verse=Buffer.from(await verseResponse.arrayBuffer());
const hash=createHash('sha256').update(verse).digest('hex');
if(hash!==expected)throw Error(`Verse audio changed: ${hash}`);

// Previously measured byte offset, independently checked with five 4096-byte
// anchors across the complete 118-second recording (husary-byte-match.json).
const chapterBase=95617872;
const rangeResponse=await fetch(chapterUrl,{headers:{Range:`bytes=${chapterBase}-${chapterBase+verse.length-1}`}});
if(rangeResponse.status!==206)throw Error(`Chapter range refused: ${rangeResponse.status}`);
const chapter=Buffer.from(await rangeResponse.arrayBuffer());
if(chapter.length!==verse.length)throw Error(`Chapter range size ${chapter.length} != ${verse.length}`);
const anchors=[10000,472578,945157,1417735,1880314].map(offset=>({
  verse_byte_offset:offset,
  same_bytes:chapter.subarray(offset,offset+4096).equals(verse.subarray(offset,offset+4096))
}));
if(anchors.some(anchor=>!anchor.same_bytes))throw Error('Chapter/verse byte anchor mismatch');

// Start both streams on the same MP3 frame-aligned section, past the differing
// per-file ID3/header bytes. Distinct early/middle/late windows must decode to
// exactly the same PCM. The original file's time is approximately +625 ms.
const trim=10000;
const windows=[];
for(const from_ms of [3000,43000,103000]){
  const to_ms=from_ms+6000;
  const [a,b]=await Promise.all([
    decodeWindow(new Blob([verse.subarray(trim)]).stream(),from_ms,to_ms),
    decodeWindow(new Blob([chapter.subarray(trim)]).stream(),from_ms,to_ms)
  ]);
  if(a.sampleRate!==b.sampleRate||a.channelData.length!==b.channelData.length)throw Error('PCM format mismatch');
  let maxDifference=0;
  for(let c=0;c<a.channelData.length;c++){
    const x=a.channelData[c],y=b.channelData[c];
    if(x.length!==y.length)throw Error('PCM length mismatch');
    for(let i=0;i<x.length;i++)maxDifference=Math.max(maxDifference,Math.abs(x[i]-y[i]));
  }
  if(maxDifference!==0)throw Error(`PCM mismatch at ${from_ms} ms: ${maxDifference}`);
  windows.push({from_ms,to_ms,sample_rate:a.sampleRate,samples:a.channelData[0].length,max_difference:maxDifference});
}
console.log(JSON.stringify({verse_url:verseUrl,chapter_url:chapterUrl,verse_sha256:hash,
  chapter_base_byte:chapterBase,anchors,windows,identity:'byte-exact-and-pcm-exact'},null,2));
