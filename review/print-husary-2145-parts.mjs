// Diagnostic only: print the actual 2:145 split-card ranges without changing assets.
import fs from 'node:fs';
import vm from 'node:vm';
import {makeHusaryVerseTiming} from '../src/verified-verse-audio.mjs';
import {decodeWindow,calibratedCuts} from '../src/split-audio.mjs';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const textStart=html.indexOf('const QTEXT='),q=vm.createContext({});
vm.runInContext(html.slice(textStart,html.indexOf('\n',textStart)),q);
const QTEXT=vm.runInContext('QTEXT',q);
const row=JSON.parse(fs.readFileSync(new URL('../assets/verified-verse-audio-r12.json',import.meta.url))).rows['2:145'];
const words=QTEXT[2][144][2].filter(w=>w[1]===0);
const c=vm.createContext({AD_:{...makeHusaryVerseTiming(row,145),verifiedCbr:true,reciterId:12},
  wordArr:words.map(([txt],gi)=>({txt,gi,ay:145,pos:gi+1,joinNext:false})),
  ayGi:{145:[0,words.length-1]},curS:2,QTEXT,SET:{reciter:12}});
for(const name of ['splitPauseAllowed','splitPhraseBoundary','splitChunkPositions',
  'repeatedTimeline','repeatedAudioRanges','computeParts']){
  const i=html.indexOf(`function ${name}(`);
  vm.runInContext(html.slice(i,html.indexOf('\n}',i)+2),c);
}
if(process.argv.includes('--acoustic')){
  const pcm=await decodeWindow((await fetch(row.audio_url)).body,0,row.playback_end_ms,{maxMissingMs:100});
  const buffer={sampleRate:pcm.sampleRate,length:pcm.channelData[0].length,
    duration:pcm.channelData[0].length/pcm.sampleRate,
    numberOfChannels:pcm.channelData.length,getChannelData:ch=>pcm.channelData[ch]};
  const cuts=calibratedCuts(buffer,0,row.segments,Array.from({length:31},(_,i)=>i+1));
  c.AD_.splitBuf={buffer,off:0,lo:0,hi:row.playback_end_ms,ay:145,...cuts};
}
const parts=c.computeParts(145).map(p=>({from_word:p.words[0]?.pos,to_word:p.words.at(-1)?.pos,
  count:p.words.length,from_ms:p.f,to_ms:p.t,merged:p.mergedForTiming||false}));
console.log(JSON.stringify({verse:'2:145',parts},null,2));
