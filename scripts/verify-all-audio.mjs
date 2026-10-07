import fs from 'node:fs';
import vm from 'node:vm';
import {verifiedHusaryVerseKey,validateHusaryVerseRow,makeHusaryVerseTiming,
  makeHusary145PhraseRanges} from '../src/verified-verse-audio.mjs';
const html=fs.readFileSync('index.html','utf8');
function fn(name){const s=html.search(new RegExp('(?:async )?function '+name+'\\('));const line=html.slice(s,html.indexOf('\n',s));return line.endsWith('}')?line:html.slice(s,html.indexOf('\n}',s)+2);}
const c=vm.createContext({SET:{startPad:0,endPad:-60,cumu:true},AD_:null,wordArr:[],ayGi:{},splitParts:[],pieceCursor:0,WAQF_RE:/[\u06D6-\u06DC]/});
for(const name of ['QTEXT','QTEXT_TR']){const s=html.indexOf('const '+name+'=');vm.runInContext(html.slice(s,html.indexOf('\n',s)),c);}
const texts=vm.runInContext('({QTEXT,QTEXT_TR})',c);
for(const name of ['alignTurkishWords','audioTimingUnverified','timingTextKey','splitPauseAllowed','splitPhraseBoundary','splitChunkPositions','repeatedTimeline','repeatedAudioRanges','computeParts','partKey','partStep','terminalMuallimTailEnd','splitBounds','stepBounds','buildPartsPlan'])vm.runInContext(fn(name),c);
const start=html.indexOf('  const ay={},ws={},verseEnds={}'),end=html.indexOf('  allSegs.sort',start);
const metadata=new vm.Script('AD_=(()=>{'+html.slice(start,end)+'return {ay,ws,verseEnds,verseRanges,verseSegments,end,segs:allSegs,buffer:null};})()');
const overrideFile=process.argv.find(x=>x.startsWith('--override-file='))?.slice('--override-file='.length)||'assets/audio-timing-overrides-v3.json';
const extraOverrideFile=process.argv.find(x=>x.startsWith('--extra-override-file='))?.slice('--extra-override-file='.length)||'assets/audio-timing-overrides-r3-r5.json';
const shuraimOverrideFile=process.argv.find(x=>x.startsWith('--shuraim-override-file='))?.slice('--shuraim-override-file='.length)||'assets/audio-timing-overrides-r10.json';
const timingOverrides={...JSON.parse(fs.readFileSync(overrideFile,'utf8')).rows,
  ...JSON.parse(fs.readFileSync(extraOverrideFile,'utf8')).rows,
  ...JSON.parse(fs.readFileSync(shuraimOverrideFile,'utf8')).rows};
const verifiedVerseCatalog=JSON.parse(fs.readFileSync('assets/verified-verse-audio-r12.json','utf8'));
const report={files:0,verseModes:0,alternateVerseModes:0,steps:0,unsafeBlocked:[],fallback:0,longFallback:0,fallbackCauses:{},fallbackExamples:[],merged:0,longSingle:0,singleEightPlus:0,partsOverEight:0,alignedPartsOverEight:0,alignedLongExamples:[],longSingleByReciter:{},longSingleExamples:[],targetExamples:[],terminalMetadataOverlap:0,sourceTailOverruns:[],sourceTailUnprotected:[],selectionMissingVerses:0,selectionMissingWords:0,selectionMissingByReciter:{},selectionMissingExamples:[],maxPartWords:0,errorCount:0,errors:[],examples:[],splitExceptions:[]};
function fail(key,reason,detail){if(report.errors.length<100)report.errors.push({key,reason,...detail});report.errorCount=(report.errorCount||0)+1;}
function playableBounds(step){
  const count=step.ranges?.length||1,bounds=[];
  for(let i=0;i<count;i++){
    c.pieceCursor=i;
    bounds.push(c.stepBounds(step));
  }
  c.pieceCursor=0;
  return bounds;
}
const onlyReciter=Number(process.argv.find(x=>x.startsWith('--reciter='))?.split('=')[1])||0;
const candidateDir=process.argv.find(x=>x.startsWith('--candidate-dir='))?.slice('--candidate-dir='.length);
for(const file of fs.readdirSync('test-results/timings').filter(f=>f.endsWith('.json')&&(!onlyReciter||f.startsWith(onlyReciter+'-')))){
  const [rid,sid]=file.slice(0,-5).split('-').map(Number);c.curS=sid;c.sid=sid;c.SET.reciter=rid;
  const candidatePath=candidateDir&&`${candidateDir}/${file}`;
  c.af=JSON.parse(fs.readFileSync(candidatePath&&fs.existsSync(candidatePath)?candidatePath:'test-results/timings/'+file));
  const trustedNext={...c.af.trustedNext},trustedCuts={...c.af.trustedCuts};
  c.af.verse_timings=c.af.verse_timings.map(vt=>{
    const row=timingOverrides[rid+':'+vt.verse_key];
    if(!row||row.url!==c.af.audio_url)return vt;
    const ay=+vt.verse_key.split(':')[1];
    const words=texts.QTEXT[sid][ay-1][2].filter(w=>w[1]===0).map(w=>w[0]),count=words.length;
    if(c.timingTextKey(words)!==row.text||row.segments.length<count||
      row.range[1]<=row.range[0]||(row.next!=null&&row.next<row.range[1])||
      Array.from({length:count},(_,i)=>i+1).some(pos=>!row.segments.some(s=>s[0]===pos))||
      row.segments.some((s,i)=>!Number.isInteger(s[0])||s[0]<1||s[0]>count||
        s[1]<row.range[0]||s[2]>row.range[1]||s[2]<=s[1]||
        (i>0&&s[1]<row.segments[i-1][2])))return vt;
    if(row.next!=null)trustedNext[ay]=row.next;
    if(Array.isArray(row.allowedCuts)&&row.allowedCuts.length&&
      row.allowedCuts.every(pos=>Number.isInteger(pos)&&pos>0&&pos<count&&
        row.segments.some(s=>s[0]===pos)&&row.segments.some(s=>s[0]===pos+1)))
      trustedCuts[ay]=row.allowedCuts;
    return {...vt,timestamp_from:row.range[0],timestamp_to:row.range[1],segments:row.segments};
  });
  metadata.runInContext(c);c.AD_.trustedNext=trustedNext;c.AD_.allowedSplitCuts=trustedCuts;
  c.AD_.recordingUrl=c.af.audio_url;
  c.AD_.reciterId=rid;c.AD_.verifiedCbr=!!c.af.source_recording;report.files++;
  for(const vt of c.af.verse_timings){const ay=+vt.verse_key.split(':')[1];
    const rawForTail=c.AD_.verseSegments[ay]||[],rangeForTail=c.AD_.verseRanges[ay];
    const tailEnd=rawForTail.length?Math.max(...rawForTail.map(s=>s[2])):null;
    const tailFinding=rangeForTail&&tailEnd>rangeForTail[1]+300?{
      key:`${rid}/${sid}:${ay}`,ms:tailEnd-rangeForTail[1],rangeEnd:rangeForTail[1],
      next:c.AD_.trustedNext[ay]??c.AD_.verseRanges[ay+1]?.[0]??null,
      lastPosition:rawForTail.at(-1)?.[0],wordCount:texts.QTEXT[sid][ay-1][2].filter(w=>w[1]===0).length
    }:null;
    const chapterAD=c.AD_,alternateKey=verifiedHusaryVerseKey(rid,sid,ay);
    if(alternateKey){
      const count=texts.QTEXT[sid][ay-1][2].filter(w=>w[1]===0).length;
      const row=validateHusaryVerseRow(verifiedVerseCatalog,alternateKey,count);
      c.AD_={...makeHusaryVerseTiming(row,ay),buffer:null,reciterId:12,
        sourceUrl:row.audio_url,recordingUrl:row.audio_url,splitVerseSource:true,
        verifiedHusary145:alternateKey==='2:145',
        safePhraseRanges:alternateKey==='2:145'?makeHusary145PhraseRanges(row):null,
        verifiedCbr:true,trustedNext:{}};
    }
    if(tailFinding){
      tailFinding.handling=alternateKey?'verified_alternate_verse':
        c.audioTimingUnverified(rid,sid)?'guarded_chapter':'none';
      report.sourceTailOverruns.push(tailFinding);
      if(tailFinding.handling==='none')report.sourceTailUnprotected.push(tailFinding);
    }
    for(const mode of ['turk','medine']){
      const key=`${rid}/${sid}:${ay}/${mode}`;
      const base=texts.QTEXT[sid][ay-1][2].filter(w=>w[1]===0).map(w=>w[0]);
      const printed=mode==='turk'?texts.QTEXT_TR[sid][ay-1].split(/\s+/).filter(Boolean):base;
      const words=mode==='turk'?(c.alignTurkishWords(base,printed)||printed):base;
      c.wordArr=words.map((txt,gi)=>{const s=c.AD_.ws[ay+':'+(gi+1)];return {gi,txt,ay,pos:gi+1,joinNext:!!words.joinNext?.has(gi),s:s?.[0]??null,e:s?.[1]??null};});
      if(mode==='medine'){
        const missing=c.wordArr.filter(w=>!Number.isFinite(w.s)||!Number.isFinite(w.e)||w.e<=w.s).map(w=>w.pos);
        if(missing.length){
          report.selectionMissingVerses++;
          report.selectionMissingWords+=missing.length;
          report.selectionMissingByReciter[rid]=(report.selectionMissingByReciter[rid]||0)+1;
          if(report.selectionMissingExamples.length<100)report.selectionMissingExamples.push({key,missing});
        }
      }
      c.ayGi={[ay]:[0,words.length-1]};c.splitParts=c.computeParts(ay);report.verseModes++;
      if(alternateKey)report.alternateVerseModes++;
      if(c.splitParts.some(p=>p.timingFallback)){
        report.fallback++;
        const raw=c.AD_.verseSegments[ay]||[],next=c.AD_.trustedNext[ay]??c.AD_.verseRanges[ay+1]?.[0];
        const cause=!raw.length?'no segments':raw.some(s=>!Number.isInteger(s[0])||s[0]<1||!Number.isFinite(s[1])||!Number.isFinite(s[2])||s[2]<=s[1])?'invalid row':
          base.length!==words.length?'text map':raw.some(s=>s[0]>words.length)?'position overflow':
          raw.some((s,i)=>i>0&&s[1]<raw[i-1][1])?'time order':next!=null&&Math.max(...raw.map(s=>s[2]))>next+300?'verse overlap':'other';
        report.fallbackCauses[cause]=(report.fallbackCauses[cause]||0)+1;
        if(words.length>=8){report.longFallback++;if(report.fallbackExamples.length<20)report.fallbackExamples.push({key,words:words.length,segments:c.AD_.verseSegments[ay]?.length||0});}
      }
      if(c.splitParts.some(p=>p.mergedForTiming))report.merged++;
      if(words.length>=8&&c.splitParts.length===1){report.longSingle++;report.longSingleByReciter[rid]=(report.longSingleByReciter[rid]||0)+1;if(report.longSingleExamples.length<35)report.longSingleExamples.push({key,words:words.length,segments:c.AD_.verseSegments[ay]?.length||0,fallback:!!c.splitParts[0].timingFallback});}
      if(words.length>=8&&c.splitParts.length===1)report.singleEightPlus++;
      if(words.length>=8&&(c.splitParts.length===1||c.splitParts.some(p=>p.words.length>8))&&mode==='medine'){
        const raw=c.AD_.verseSegments[ay]||[];
        const safe=[];const gaps=[];
        for(let pos=1;pos<words.length;pos++){
          const left=raw.filter(x=>x[0]<=pos),right=raw.filter(x=>x[0]>pos),end=left.filter(x=>x[0]===pos),next=right.filter(x=>x[0]===pos+1);
          const leftEnd=left.length?Math.max(...left.map(x=>x[2])):null,rightStart=right.length?Math.min(...right.map(x=>x[1])):null;
          if(end.length&&next.length&&leftEnd===Math.max(...end.map(x=>x[2]))&&rightStart>=leftEnd)safe.push(pos);
          if(end.length&&next.length&&leftEnd!=null&&rightStart!=null)gaps.push({pos,ms:rightStart-leftEnd});
        }
        report.splitExceptions.push({key,words:words.length,parts:c.splitParts.map(p=>p.words.length),fallback:!!c.splitParts[0]?.timingFallback,rows:raw.length,uniquePositions:new Set(raw.map(x=>x[0])).size,safe,gaps,range:c.AD_.verseRanges[ay],segments:raw});
      }
      report.partsOverEight+=c.splitParts.filter(p=>p.words.length>8).length;
      if(!c.splitParts.some(p=>p.timingFallback)){
        const over=c.splitParts.filter(p=>p.words.length>8);
        report.alignedPartsOverEight+=over.length;
        if(over.length&&report.alignedLongExamples.length<30)report.alignedLongExamples.push({key,words:words.length,parts:c.splitParts.map(p=>p.words.length),segments:c.AD_.verseSegments[ay]?.length||0});
      }
      if(sid===3&&ay===4)report.targetExamples.push({key,words:words.length,segments:c.AD_.verseSegments[ay]?.length||0,parts:c.splitParts.map(p=>p.words.length),fallback:!!c.splitParts[0].timingFallback});
      report.maxPartWords=Math.max(report.maxPartWords,...c.splitParts.map(p=>p.words.length));
      const covered=c.splitParts.flatMap(p=>p.words.map(w=>w.gi));
      if(covered.length!==words.length||covered.some((gi,i)=>gi!==i))fail(key,'text partition');
      if(c.splitParts.some(p=>p.unsafeTiming)){
        // The UI deliberately blocks split playback for early-ending or
        // ambiguous provider rows. A missing plan is expected, never safe.
        report.unsafeBlocked.push(key);
        if(!new Set(['3/3:160','3/4:143','3/5:5','5/6:139','5/34:46','5/65:12','12/2:145']).has(`${rid}/${sid}:${ay}`))
          fail(key,'unexpected blocked verse');
        continue;
      }
      const plan=c.buildPartsPlan(0);const single=plan.filter(p=>!p.combo);
      if(!plan.length)fail(key,'no playable range');
      for(const p of plan){const bounds=playableBounds(p);report.steps+=bounds.length;
        if(p.ranges&&bounds.length!==p.ranges.length)fail(key,'missing playback piece',{part:p.part});
        for(let i=0;i<bounds.length;i++){
          const b=bounds[i],expected=p.ranges?.[i]||{t:p.t};
          if(!Number.isFinite(b.f)||!Number.isFinite(b.t)||b.t<=b.f)fail(key,'invalid bounds',{b,part:p.part,piece:i});
          if(b.t<expected.t)fail(key,'shortened tail',{ms:expected.t-b.t,part:p.part,piece:i});
          if(!p.ranges&&p.nextStart!=null&&b.t>p.nextStart)fail(key,'crossed next word');
        }
      }
      for(const p of single.filter(p=>p.ranges)){
        const part=c.splitParts[p.part],lo=part.words[0].pos,hi=part.words.at(-1).pos;
        for(const b of playableBounds(p))for(const s of c.AD_.verseSegments[ay]||[]){
          if(s[1]>=b.t||s[2]<=b.f)continue;
          if(s[0]<lo||s[0]>hi)fail(key,'repeated audio leaked into another part',{part:p.part,pos:s[0],range:b});
        }
      }
      if(!c.splitParts.some(p=>p.timingFallback)){
        const next=c.AD_.trustedNext[ay]??c.AD_.verseRanges[ay+1]?.[0];
        for(const seg of c.AD_.verseSegments[ay]){
          if(next!=null&&seg[2]>next&&(seg[2]<=next+300||seg[0]===words.length)){report.terminalMetadataOverlap++;continue;}
          if(!single.some(p=>playableBounds(p).some(b=>b.f<=seg[1]&&b.t>=seg[2])))fail(key,'uncovered audio segment',{pos:seg[0]});
        }
      }
      if(rid===4&&sid===4&&[12,13,14].includes(ay))report.examples.push({key,parts:single.length,bounds:single.map(p=>c.stepBounds(p))});
    }
    c.AD_=chapterAD;
  }
  if(report.files%200===0)console.log(JSON.stringify({files:report.files,verseModes:report.verseModes,errors:report.errorCount||0}));
}
const reportFile=process.argv.find(x=>x.startsWith('--report-file='))?.slice('--report-file='.length)||'test-results/full-validation.json';
fs.writeFileSync(reportFile,JSON.stringify(report,null,2));
console.log(JSON.stringify({...report,splitExceptions:report.splitExceptions.length,
  sourceTailOverruns:report.sourceTailOverruns.length,sourceTailExamples:report.sourceTailOverruns.slice(0,25),
  sourceTailUnprotected:report.sourceTailUnprotected.length,
  errors:report.errors.slice(0,12),examples:report.examples.map(x=>({key:x.key,parts:x.parts}))}));
if(report.errorCount)process.exitCode=1;
else if(process.argv.includes('--strict-splits')&&(report.singleEightPlus||report.partsOverEight))process.exitCode=2;
