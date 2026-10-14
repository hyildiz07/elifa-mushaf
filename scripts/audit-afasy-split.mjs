import fs from 'node:fs';
import vm from 'node:vm';
import {afasyWordAudioMeta} from '../assets/mp3quran-reciter.js';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const qtext=JSON.parse(html.match(/^const QTEXT=(.*);$/m)[1]);
const qtextTr=JSON.parse(html.match(/^const QTEXT_TR=(.*);$/m)[1]);
const surahs=JSON.parse(html.match(/^const SURAHS=(.*);$/m)[1]);
const pack=JSON.parse(fs.readFileSync(new URL('../assets/afasy-mp3quran-word-timings.json',import.meta.url)));
function fn(name){
  const start=html.search(new RegExp('(?:async )?function '+name+'\\('));
  if(start<0)throw Error(`Missing ${name}`);
  const line=html.slice(start,html.indexOf('\n',start));
  return line.endsWith('}')?line:html.slice(start,html.indexOf('\n}',start)+2);
}
const c=vm.createContext({SET:{reciter:223,startPad:0,endPad:-60,cumu:true},
  AD_:null,wordArr:[],ayGi:{},splitParts:[],pieceCursor:0,
  WAQF_RE:/[\u06D6-\u06DC]/});
for(const name of ['QTEXT','QTEXT_TR']){
  const start=html.indexOf('const '+name+'=');
  vm.runInContext(html.slice(start,html.indexOf('\n',start)),c);
}
for(const name of ['alignTurkishWords','splitPauseAllowed','splitPhraseBoundary',
  'splitChunkPositions','repeatedTimeline','repeatedAudioRanges','computeParts',
  'partKey','partStep','terminalMuallimTailEnd','splitBounds','stepBounds',
  'buildPartsPlan'])vm.runInContext(fn(name),c);
const start=html.indexOf('  const ay={},ws={},verseEnds={}');
const end=html.indexOf('  allSegs.sort',start);
const metadata=new vm.Script('AD_=(()=>{'+html.slice(start,end)+
  'return {ay,ws,verseEnds,verseRanges,verseSegments,end,segs:allSegs,buffer:null};})()');
const result={chapters:0,verses:0,modes:0,multiPart:0,longSingle:0,
  fallback:0,unsafe:0,invalidPlans:0,examples:[]};
for(const chapter of surahs){
  const sid=chapter.id,counts=qtext[sid].map(v=>v[2].filter(w=>w[1]===0).length);
  c.sid=sid;c.curS=sid;
  c.af=afasyWordAudioMeta(sid,pack,counts);
  metadata.runInContext(c);
  c.AD_.reciterId=223;c.AD_.verifiedCbr=true;
  c.AD_.recordingUrl=c.af.audio_url;c.AD_.sourceUrl=c.af.audio_url;
  c.AD_.trustedNext={};c.AD_.allowedSplitCuts={};
  result.chapters++;
  for(let ay=1;ay<=chapter.n;ay++){
    result.verses++;
    const base=qtext[sid][ay-1][2].filter(w=>w[1]===0).map(w=>w[0]);
    for(const mode of ['medine','turk']){
      const printed=mode==='turk'?qtextTr[sid][ay-1].split(/\s+/).filter(Boolean):base;
      const words=mode==='turk'?(c.alignTurkishWords(base,printed)||printed):base;
      c.wordArr=words.map((txt,gi)=>{const s=c.AD_.ws[ay+':'+(gi+1)];
        return {gi,txt,ay,pos:gi+1,joinNext:!!words.joinNext?.has(gi),
          s:s?.[0]??null,e:s?.[1]??null};});
      c.ayGi={[ay]:[0,words.length-1]};
      c.splitParts=c.computeParts(ay);
      const parts=c.splitParts;
      result.modes++;
      if(parts.length>1)result.multiPart++;
      if(words.length>=8&&parts.length===1)result.longSingle++;
      if(parts.some(p=>p.timingFallback))result.fallback++;
      if(parts.some(p=>p.unsafeTiming))result.unsafe++;
      const covered=parts.flatMap(p=>p.words.map(w=>w.gi));
      const plan=c.buildPartsPlan(0);
      const bad=covered.length!==words.length||covered.some((gi,i)=>gi!==i)||
        !plan.length||plan.some(step=>{
          const b=c.stepBounds(step);
          return !Number.isFinite(b.f)||!Number.isFinite(b.t)||b.t<=b.f||
            b.t>c.AD_.verseRanges[ay][1]+1;
        });
      if(bad){result.invalidPlans++;if(result.examples.length<25)
        result.examples.push({key:`${sid}:${ay}`,mode,words:words.length,
          parts:parts.map(p=>p.words.length),fallback:!!parts[0]?.timingFallback});}
    }
  }
}
console.log(JSON.stringify(result));
if(result.invalidPlans||result.unsafe)process.exitCode=1;
