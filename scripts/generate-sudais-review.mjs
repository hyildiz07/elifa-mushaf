// Local listening worksheet only. Its acoustic candidates never enter the app.
import fs from 'node:fs';
import {prepareWindow} from '../src/split-audio.mjs';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const start=html.indexOf('const QTEXT=')+'const QTEXT='.length;
const stop=html.indexOf(';',start);
if(start<12||stop<start)throw Error('Canonical Quran text unavailable');
const qtext=JSON.parse(html.slice(start,stop));
const cases=[[24,35],[3,160],[39,54],[4,134],[4,143],[5,5],[5,46],[5,82]];
const issues={
  '24:35':'48 kelimeye karşılık yalnız 45 farklı sağlayıcı konumu var; 33–35. kelimelerde etiket kaybı.',
  '3:160':'Sağlayıcının âyet bitişi son kelime etiketinden 6,475 saniye önce.',
  '39:54':'13 kelimelik âyet için tek kelime etiketi; akustik iç nefes kanıtlanmadı.',
  '4:134':'Tekrarlı/hatalı etiketler; güvenli iç durak kanıtlanmadı.',
  '4:143':'Sağlayıcının âyet bitişi son kelime etiketinden 2,295 saniye önce.',
  '5:5':'Sağlayıcının âyet bitişi son kelime etiketinden 29,155 saniye önce; sonraki âyetlerle çakışıyor.',
  '5:46':'İç kelime etiketlerinde atlama var; bulunan tek erken durak uzun kalan bölümü çözmüyor.',
  '5:82':'İç kelime etiketlerinde atlama var; bulunan tek erken durak uzun kalan bölümü çözmüyor.'
};
const context={createBuffer(channels,length,rate){const ch=Array.from({length:channels},()=>new Float32Array(length));
  return {sampleRate:rate,length,duration:length/rate,numberOfChannels:channels,
    copyToChannel(a,c){ch[c].set(a);},getChannelData(c){return ch[c];}};}};
const manifest=JSON.parse(fs.readFileSync(new URL('../test-results/review-sudais-24-35/manifest.json',import.meta.url)));
const records=[];
for(const [sid,ay] of cases){
  const source=JSON.parse(fs.readFileSync(new URL(`../test-results/timings/3-${sid}.json`,import.meta.url)));
  const key=`${sid}:${ay}`;
  const verse=source.verse_timings.find(x=>x.verse_key===key);
  const next=source.verse_timings.find(x=>x.verse_key===`${sid}:${ay+1}`);
  if(!verse)throw Error(`Missing ${key}`);
  const words=qtext[sid][ay-1][2].filter(w=>w[1]===0).map(w=>w[0]);
  const lastWordEnd=Math.max(...verse.segments.map(row=>row[2]));
  const audio={sourceUrl:source.audio_url,verifiedCbr:false,
    verseRanges:{[ay]:[verse.timestamp_from,Math.max(verse.timestamp_to,lastWordEnd)],
      ...(next?{[ay+1]:[next.timestamp_from,next.timestamp_to]}:{})},
    verseSegments:{[ay]:verse.segments}};
  const pcm=await prepareWindow(audio,ay,context,{positions:[]});
  const frame=Math.round(pcm.buffer.sampleRate*.02),frames=Math.floor(pcm.buffer.length/frame),rms=[];
  for(let i=0;i<frames;i++){
    let peak=0;for(let ch=0;ch<pcm.buffer.numberOfChannels;ch++){
      const data=pcm.buffer.getChannelData(ch);let sum=0;
      for(let j=i*frame;j<(i+1)*frame;j++)sum+=data[j]*data[j];
      peak=Math.max(peak,Math.sqrt(sum/frame));
    }
    rms.push(+peak.toFixed(5));
  }
  records.push({key,sid,ay,issue:issues[key],words,audioUrl:source.audio_url,
    audioBytes:source.file_size,providerRange:[verse.timestamp_from,verse.timestamp_to],
    lastWordEnd,nextStart:next?.timestamp_from??null,
    providerSegments:verse.segments,
    waveStart:pcm.off,waveFrameMs:frame/pcm.buffer.sampleRate*1000,rms,
    reviewCandidates:key==='24:35'?manifest.candidates:[]});
  console.log(`${key}: ${words.length} words, ${rms.length} PCM frames`);
}
const template=fs.readFileSync(new URL('./sudais-review.template.html',import.meta.url),'utf8');
const payload=JSON.stringify({reciter:'Abdurrahman es-Südeys',records,
  candidateSource:'test-results/review-sudais-24-35/manifest.json',
  sourceNote:'QuranCDN sûre MP3 + uygulamanın kanonik QTEXT kelimeleri + kaynak sağlayıcı zamanları'})
  .replace(/</g,'\\u003c');
const page=template.replace('<!--REVIEW_DATA-->',`<script id="review-data" type="application/json">${payload}</script>`);
if(page===template)throw Error('Review template marker missing');
const output=new URL('../docs/sudais-verse-review.html',import.meta.url);
fs.writeFileSync(output,page);
console.log(`Wrote ${output.pathname}`);
