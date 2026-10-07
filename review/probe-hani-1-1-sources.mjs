// Review-only audit. Never generates playback word timings.
import fs from 'node:fs';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {MPEGDecoder} from 'mpg123-decoder';

const qdcPath='test-results/timings/5-1.json';
if(!fs.existsSync(qdcPath)){
  const response=await fetch('https://api.qurancdn.com/api/qdc/audio/reciters/5/audio_files?chapter=1&segments=true');
  if(!response.ok)throw Error(`QuranCDN metadata: HTTP ${response.status}`);
  const row=(await response.json()).audio_files?.[0];
  if(!row?.verse_timings?.length)throw Error('QuranCDN metadata unavailable');
  fs.mkdirSync('test-results/timings',{recursive:true});
  fs.writeFileSync(qdcPath,JSON.stringify(row));
}
const qdc=JSON.parse(fs.readFileSync(qdcPath,'utf8'));
async function sourceAsset(path,url,expectedSha){
  if(!fs.existsSync(path)){
    const response=await fetch(url);
    if(!response.ok)throw Error(`${url}: HTTP ${response.status}`);
    fs.mkdirSync('test-results',{recursive:true});
    fs.writeFileSync(path,Buffer.from(await response.arrayBuffer()));
  }
  const data=fs.readFileSync(path),sha=crypto.createHash('sha256').update(data).digest('hex');
  if(sha!==expectedSha)throw Error(`${path}: source hash mismatch`);
  return path;
}
const archive=await sourceAsset('test-results/qua-source-hani_al_rifai_qdc_128k.zip',
  'https://github.com/QUD-Technologies/quranic-universal-audio/releases/download/v3.2.0/hani_al_rifai_qdc_128k.zip',
  '8154fefe083c324a9c391eb4d79eec6392795aea896c5b0b7ff1c784ef99d898');
const qua=JSON.parse(zlib.gunzipSync(execFileSync('tar',['-xOf',archive,'word_timestamps.json.gz']))).rows;
const fairArchive=await sourceAsset('test-results/cpfair-quran-align-2016.zip',
  'https://github.com/cpfair/quran-align/releases/download/release-2016-11-24/quran-align-data-2016-11-24.zip',
  '5eeb045d8a7895208c94d2d7ec243567f8f550728835411527c4ffa1e789c9b7');
const fair=JSON.parse(execFileSync('tar',['-xOf',fairArchive,'Hani_Rifai_192kbps.json'],{maxBuffer:10_000_000}));
const fairRow=fair.find(x=>x.surah===1&&x.ayah===1);
const sources=[qdc.audio_url,
  'https://everyayah.com/data/Hani_Rifai_192kbps/001001.mp3',
  'https://everyayah.com/data/Hani_Rifai_64kbps/001001.mp3'];
async function readAudio(url){
  const response=await fetch(url);
  if(!response.ok)throw Error(`${url}: HTTP ${response.status}`);
  const bytes=new Uint8Array(await response.arrayBuffer());
  const decoder=new MPEGDecoder();await decoder.ready;
  try{
    const pcm=decoder.decode(bytes),input=pcm.channelData[0],ratio=pcm.sampleRate/1000;
    const audio=new Float32Array(Math.floor(input.length/ratio));
    for(let i=0;i<audio.length;i++){
      const first=Math.floor(i*ratio),last=Math.max(first+1,Math.floor((i+1)*ratio));
      let sum=0;for(let j=first;j<last;j++)sum+=input[j];audio[i]=sum/(last-first);
    }
    return {url,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),
      durationMs:audio.length,audio};
  }finally{await decoder.free();}
}
const [chapter,...clips]=await Promise.all(sources.map(readAudio));
function corr(clip,start,mark){let xy=0,xx=0,yy=0;
  for(let i=0;i<450;i+=3){const left=chapter.audio[start+mark+i],right=clip.audio[mark+i];
    if(left===undefined||right===undefined)return -Infinity;
    xy+=left*right;xx+=left*left;yy+=right*right;}
  return xy/Math.sqrt(xx*yy||1);}
const matches=clips.map(clip=>{
  const marks=[350,1200,2500],local=marks.map(mark=>{
    let best={startMs:null,correlation:-Infinity};
    for(let start=0;start<=1600;start++){
      const similarity=corr(clip,start,mark);
      if(similarity>best.correlation)best={startMs:start,correlation:similarity};
    }
    return {mark,startMs:best.startMs,correlation:+best.correlation.toFixed(5)};
  });
  return {url:clip.url,bytes:clip.bytes,durationMs:clip.durationMs,local};
});
const result={verse:'1:1',production:{url:chapter.url,bytes:chapter.bytes,
  sha256:chapter.sha256,verse:qdc.verse_timings[0]},
  quaV320CompleteOccurrences:qua.filter(x=>x[0]==='1:1'&&x[3]).length,
  cpfair2016:{source:'quran-align-data-2016-11-24.zip/Hani_Rifai_192kbps.json',
    firstRow:fairRow},matches,
  conclusion:'QDC omits three word positions; QUA omits the entire occurrence; cpfair fuses words 1–2. No independently verified four-word boundary set.'};
fs.writeFileSync('review/hani-1-1-source-audit.json',`${JSON.stringify(result,null,2)}\n`);
console.log(JSON.stringify(result,null,2));
