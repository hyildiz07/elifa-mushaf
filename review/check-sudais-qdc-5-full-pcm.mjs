// Independent full-stream vs indexed-range PCM check for Sudais chapter 5.
// Reads the same locally pinned original MP3. Review only.
import fs from 'node:fs';
import {MPEGDecoder} from 'mpg123-decoder';
import {decodeWindow,prepareWindow} from '../src/split-audio.mjs';
import {getVerifiedVbrIndexFromBlob} from '../src/mp3-seek.mjs';

const surah=Number(process.env.QDC_SURA||5);
const timing=JSON.parse(fs.readFileSync(`test-results/timings/3-${surah}.json`,'utf8'));
const source=timing.audio_url;
const catalog=JSON.parse(fs.readFileSync('assets/sudais-vbr-index.json','utf8'));
const blob=new Blob([fs.readFileSync(`test-results/sudais-qdc-${surah}.mp3`)]);
const index=await getVerifiedVbrIndexFromBlob(blob,catalog.rows[source]);
const context={createBuffer(n,len,rate){const c=Array.from({length:n},()=>new Float32Array(len));
  return {sampleRate:rate,length:len,duration:len/rate,numberOfChannels:n,
    copyToChannel:(x,i)=>c[i].set(x),getChannelData:i=>c[i]};}};
const results=[];
const requested=process.argv.slice(2).map(Number);
for(const ay of requested.length?requested:[1,46,82,119]){
  const v=timing.verse_timings.find(r=>r.verse_key===`${surah}:${ay}`);
  const n=timing.verse_timings.find(r=>r.verse_key===`${surah}:${ay+1}`);
  const audio={sourceUrl:source,recordingUrl:source,offlineBlob:blob,cbrIndex:index,reciterId:3,
    verseRanges:{[ay]:[v.timestamp_from,v.timestamp_to],...(n?{[ay+1]:[n.timestamp_from,n.timestamp_to]}:{})},
    verseSegments:{[ay]:v.segments}};
  const indexed=await prepareWindow(audio,ay,context,{positions:[]});
  const from=Math.max(0,v.timestamp_from+100),to=Math.min(v.timestamp_to-100,from+1500);
  const full=await decodeWindow(blob.stream(),from,to,{decoderFactory:()=>new MPEGDecoder()});
  const points=[.2,.5,.8].map(x=>from+(to-from)*x);
  // Compute a single integer sample displacement. Rounding each timestamp
  // separately can create a one-sample comparison artifact at .5 ms ties.
  const baseOffset=Math.round((full.off-indexed.off)*full.sampleRate/1000);
  const comparisons=points.map(t=>{
    let sum=0,count=0,max=0;
    for(let ch=0;ch<full.channelData.length;ch++){
      const a=full.channelData[ch],b=indexed.buffer.getChannelData(ch),rate=full.sampleRate;
      for(let k=0;k<500;k++){
        const f=Math.round((t-full.off)*rate/1000)+k;
        const i=baseOffset+f;
        if(f>=a.length||i>=b.length)break;
        const diff=a[f]-b[i];sum+=diff*diff;max=Math.max(max,Math.abs(diff));count++;
      }
    }
    return {at_ms:Math.round(t),rms_diff:Math.sqrt(sum/count),max_abs_diff:max};
  });
  results.push({verse:`${surah}:${ay}`,indexed_off:indexed.off,full_off:full.off,
    rate:full.sampleRate,comparisons});
  console.log(JSON.stringify(results.at(-1)));
}
fs.writeFileSync(`review/sudais-qdc-align/full-pcm-check-${surah}.json`,JSON.stringify(results,null,2)+'\n');
