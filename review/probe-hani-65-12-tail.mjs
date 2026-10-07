import {readFile} from 'node:fs/promises';
import {decodeWindow,prepareSelectedRange} from '../src/split-audio.mjs';

const row=JSON.parse(await readFile(new URL('../test-results/timings/5-65.json',import.meta.url)));
const verse=row.verse_timings.at(-1),clipUrl='https://everyayah.com/data/Hani_Rifai_192kbps/065012.mp3';
const context={createBuffer(n,length,sampleRate){
  const channels=Array.from({length:n},()=>new Float32Array(length));
  return {numberOfChannels:n,length,sampleRate,duration:length/sampleRate,
    copyToChannel(samples,i){channels[i].set(samples);},getChannelData(i){return channels[i];}};
}};
const audio={sourceUrl:row.audio_url,recordingUrl:row.audio_url,reciterId:5,
  verifiedCbr:false,end:verse.timestamp_to,
  verseRanges:{12:[verse.timestamp_from,verse.timestamp_to]},verseSegments:{12:[]}};
const chapter=await prepareSelectedRange(audio,verse.timestamp_from,316500,context);
const response=await fetch(clipUrl,{signal:AbortSignal.timeout(15000)});
if(!response.ok)throw Error(`Verse clip HTTP ${response.status}`);
const clipBytes=await response.arrayBuffer();
const clip=await decodeWindow(new Blob([clipBytes]).stream(),0,40000,{maxMissingMs:40000});
const chapterData=chapter.buffer.getChannelData(0),clipData=clip.channelData[0];
function rms(data,a,b){let sum=0;for(let i=a;i<b;i++)sum+=data[i]*data[i];return Math.sqrt(sum/Math.max(1,b-a));}
function tailProfile(data,rate){
  const result=[];for(let back=200;back>=20;back-=20){
    const from=Math.max(0,data.length-Math.round(back*rate/1000));
    const to=Math.max(from+1,data.length-Math.round((back-20)*rate/1000));
    result.push({msBeforeEnd:`${back}-${back-20}`,rms:rms(data,from,to)});
  }return result;
}
// Match the same phrase by normalized PCM correlation, allowing for a small
// lead offset and different MP3 encoder delay. A high score establishes a
// shared performance; it does not by itself certify phonetic completion.
function correlation(a,b,shift,start,n,stride){
  let xy=0,xx=0,yy=0;for(let j=0;j<n;j+=stride){const x=a[start+j],y=b[start+j+shift];xy+=x*y;xx+=x*x;yy+=y*y;}
  return xy/Math.sqrt(xx*yy||1);
}
let match=null;
if(chapter.buffer.sampleRate===clip.sampleRate){
  const rate=clip.sampleRate,start=Math.round(5000*rate/1000),n=Math.round(6000*rate/1000);
  // The clip and chapter may have independent opening silence. Search ±3 s.
  for(let shift=-3*rate;shift<=3*rate;shift+=Math.round(rate*.005)){
    if(start+shift<0||start+n+shift>=clipData.length)continue;
    const score=correlation(chapterData,clipData,shift,start,n,83);
    if(!match||score>match.score)match={shiftSamples:shift,score};
  }
  if(match){
    for(let shift=match.shiftSamples-300;shift<=match.shiftSamples+300;shift++){
      if(start+shift<0||start+n+shift>=clipData.length)continue;
      const score=correlation(chapterData,clipData,shift,start,n,167);
      if(score>match.score)match={shiftSamples:shift,score};
    }
    match.shiftMs=match.shiftSamples/rate*1000;
    const chapterLastClipMs=(chapterData.length+match.shiftSamples)/rate*1000;
    match.clipBeyondChapterMs=clipData.length/rate*1000-chapterLastClipMs;
  }
}
console.log(JSON.stringify({chapter:{url:row.audio_url,metadataFromMs:verse.timestamp_from,
    metadataEndMs:verse.timestamp_to,decodedLoMs:chapter.lo,decodedHiMs:chapter.hi,
    physicalEndMs:(audio.cbrIndex.frames*audio.cbrIndex.samples-audio.cbrIndex.trimSamples)/audio.cbrIndex.rate*1000,
    sampleRate:chapter.buffer.sampleRate,tail200ms:tailProfile(chapterData,chapter.buffer.sampleRate)},
  clip:{url:clipUrl,bytes:clipBytes.byteLength,durationMs:clipData.length/clip.sampleRate*1000,
    sampleRate:clip.sampleRate,tail200ms:tailProfile(clipData,clip.sampleRate)},match},null,2));
