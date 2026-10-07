// Reproduce the production split/selection path for every final verse whose
// metadata extends past its chapter MP3. The raw result is resumable.
import {readFile,writeFile} from 'node:fs/promises';
import {prepareWindow,prepareSelectedRange} from '../src/split-audio.mjs';
import {getVerifiedVbrIndex} from '../src/mp3-seek.mjs';

const root=new URL('../',import.meta.url);
const output=new URL('test-results/all-final-tail-production-playback.json',root);
const corpus=JSON.parse(await readFile(new URL('test-results/final-verse-corpus-index.json',root)));
const vbrCatalog=JSON.parse(await readFile(new URL('assets/sudais-vbr-index.json',root)));
const rows=corpus.rows.filter(row=>row.gapMs>0&&row.gapMs<=650);
const limit=Number(process.env.FINAL_TAIL_LIMIT)||rows.length;
const concurrency=Math.min(6,Math.max(1,Number(process.env.FINAL_TAIL_CONCURRENCY)||4));
const context={createBuffer(channels,length,sampleRate){
  const data=Array.from({length:channels},()=>new Float32Array(length));
  return {numberOfChannels:channels,length,sampleRate,duration:length/sampleRate,
    copyToChannel(source,ch){data[ch].set(source);},getChannelData(ch){return data[ch];}};
}};
let previous={};
try{previous=JSON.parse(await readFile(output));}catch{}
const result={checkedAt:new Date().toISOString(),totalCandidates:rows.length,items:previous.items||{}};
const key=row=>`${row.reciter}:${row.chapter}:${row.verse}`;
const force=process.env.FINAL_TAIL_FORCE==='1';
const todo=rows.filter(row=>force||!result.items[key(row)]).slice(0,limit);
let next=0,completed=0;
async function save(){await writeFile(output,JSON.stringify(result,null,2)+'\n');}
async function probe(row){
  const item={reciter:row.reciter,chapter:row.chapter,verse:row.verse,
    indexKind:row.indexKind,rawGapMs:row.gapMs,source:row.source};
  const metadata=JSON.parse(await readFile(new URL(row.metadataPath,root)));
  const final=metadata.verse_timings.at(-1);
  const ay=Number(final.verse_key.split(':')[1]);
  const verseRanges={};
  let end=0;
  for(const timing of metadata.verse_timings){
    const verse=Number(timing.verse_key.split(':')[1]);
    const segments=timing.segments||[];
    const range=segments.length?
      [segments[0][1],segments.at(-1)[2]]:
      [timing.timestamp_from,timing.timestamp_to];
    verseRanges[verse]=range;
    end=Math.max(end,range[1]);
  }
  const [from,to]=verseRanges[ay];
  const audio={reciterId:row.reciter,sourceUrl:row.url,recordingUrl:row.url,
    verifiedCbr:!!metadata.source_recording,buffer:null,end,
    verseRanges,verseSegments:{[ay]:final.segments||[]}};
  item.providerEndMs=final.timestamp_to;
  item.productionRange=[from,to];
  let stage='index';
  try{
    if(row.indexKind==='verified-vbr'){
      audio.cbrIndex=await getVerifiedVbrIndex(row.url,vbrCatalog.rows[row.url],
        {signal:AbortSignal.timeout(90000)});
      if(!audio.cbrIndex)throw Error('Verified VBR source mismatch');
    }
    stage='window';
    const window=await prepareWindow(audio,ay,context,
      {signal:AbortSignal.timeout(90000),positions:[]});
    item.window={lo:window.lo,hi:window.hi,
      finalTailRequestedEnd:window.finalTailRequestedEnd};
    stage='selection';
    const selected=await prepareSelectedRange(audio,from,to,
      context,{signal:AbortSignal.timeout(90000)});
    item.selection={lo:selected.lo,hi:selected.hi,
      finalTailRequestedEnd:selected.finalTailRequestedEnd};
    item.status='pass';
  }catch(error){item.status='fail';item.stage=stage;item.error=String(error);}
  if(audio.cbrIndex){
    const index=audio.cbrIndex;
    item.calibratedPhysicalEndMs=(index.frames*index.samples-index.trimSamples)/index.rate*1000;
    item.calibratedGapMs=to-item.calibratedPhysicalEndMs;
    item.trimSamples=index.trimSamples;
  }
  return item;
}
async function worker(){
  while(true){
    const index=next++;
    if(index>=todo.length)return;
    const row=todo[index],item=await probe(row);
    result.items[key(row)]=item;
    completed++;
    // A single worker writes after each result; overlapping writes would
    // corrupt the resumable JSON if workers finished together.
    await enqueueSave();
    process.stderr.write(`${completed}/${todo.length} ${key(row)} ${item.status}`+
      `${item.error?' '+item.error:''}\n`);
  }
}
let saveChain=Promise.resolve();
function enqueueSave(){saveChain=saveChain.then(save);return saveChain;}
await Promise.all(Array.from({length:Math.min(concurrency,todo.length)},worker));
await saveChain;
const items=Object.values(result.items);
const summary={candidates:rows.length,completed:items.length,
  pass:items.filter(item=>item.status==='pass').length,
  fail:items.filter(item=>item.status==='fail').length,
  failures:items.filter(item=>item.status==='fail').map(item=>({reciter:item.reciter,
    verse:item.verse,stage:item.stage,error:item.error,rawGapMs:item.rawGapMs,
    calibratedGapMs:item.calibratedGapMs}))};
console.log(JSON.stringify(summary,null,2));
