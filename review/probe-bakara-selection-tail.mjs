// Research-only reproduction of final-verse selected-range loading.
import fs from 'node:fs';
import { prepareSelectedRange,prepareWindow } from '../src/split-audio.mjs';

const context={createBuffer(channels,length,sampleRate){
  const data=Array.from({length:channels},()=>new Float32Array(length));
  return {numberOfChannels:channels,length,sampleRate,duration:length/sampleRate,
    copyToChannel(values,index){data[index].set(values);},getChannelData(index){return data[index];}};
}};
for(const rid of [3,5,12]){
  const row=JSON.parse(fs.readFileSync(`test-results/timings/${rid}-2.json`,'utf8'));
  const verse=row.verse_timings.find(v=>v.verse_key==='2:286');
  const from=verse.timestamp_to-4000,to=verse.timestamp_to;
  const audio={sourceUrl:row.audio_url,recordingUrl:row.audio_url,reciterId:rid,
    verifiedCbr:!!row.source_recording,end:to,verseRanges:{286:[from,to]},verseSegments:{286:[]}};
  const started=Date.now();
  try{
    const result=await prepareSelectedRange(audio,from,to,context);
    const split=await prepareWindow(audio,286,context,{positions:[]});
    console.log(JSON.stringify({rid,from,to,status:'ready',lo:result.lo,hi:result.hi,
      splitHi:split.hi,splitFinalTailRequestedEnd:split.finalTailRequestedEnd,
      indexed:!!audio.cbrIndex,elapsedMs:Date.now()-started}));
  }catch(error){
    const index=audio.cbrIndex;
    const fileEnd=index?(index.frames*index.samples-(index.trimSamples||0))/index.rate*1000:null;
    console.log(JSON.stringify({rid,from,to,status:'failed',message:error.message,
      indexed:!!index,indexFields:index?{fileSize:index.fileSize,size:index.size,trimSamples:index.trimSamples,frames:index.frames,rate:index.rate,samples:index.samples}:null,
      fileEnd,missingMs:fileEnd==null?null:to-fileEnd,
      elapsedMs:Date.now()-started}));
  }
}
