// Read-only source audio triage: decode a small indexed PCM window at each
// chapter MP3 ending. Energy highlights review priority, not phoneme identity.
import {readFile,writeFile} from 'node:fs/promises';
import {prepareWindow} from '../src/split-audio.mjs';
import {getVerifiedVbrIndex} from '../src/mp3-seek.mjs';

const root=new URL('../',import.meta.url);
const corpus=JSON.parse(await readFile(new URL('test-results/final-verse-corpus-index.json',root)));
const playback=JSON.parse(await readFile(new URL('test-results/all-final-tail-production-playback.json',root)));
const vbr=JSON.parse(await readFile(new URL('assets/sudais-vbr-index.json',root)));
const output=new URL('test-results/final-tail-energy.json',root);
const candidates=corpus.rows.filter(row=>row.gapMs>0&&row.gapMs<=650);
const key=row=>`${row.reciter}:${row.chapter}:${row.verse}`;
const priority=row=>{
  const item=playback.items[key(row)];
  const gap=item?.calibratedGapMs??row.gapMs;
  return gap>0?10000+gap:Math.abs(gap)>500?5000+Math.abs(gap):Math.abs(gap);
};
candidates.sort((a,b)=>priority(b)-priority(a));
const max=Number(process.env.FINAL_TAIL_ENERGY_LIMIT)||candidates.length;
const concurrency=Math.min(6,Math.max(1,Number(process.env.FINAL_TAIL_ENERGY_CONCURRENCY)||4));
const context={createBuffer(channels,length,sampleRate){
  const data=Array.from({length:channels},()=>new Float32Array(length));
  return {numberOfChannels:channels,length,sampleRate,duration:length/sampleRate,
    copyToChannel(source,ch){data[ch].set(source);},getChannelData(ch){return data[ch];}};
}};
let result={checkedAt:new Date().toISOString(),totalCandidates:candidates.length,items:{}};
try{result=JSON.parse(await readFile(output));}catch{}
let next=0,finished=0,saveChain=Promise.resolve();
const profileMuallim=process.env.FINAL_TAIL_PROFILE_MUALLIM==='1';
const profileEarly=process.env.FINAL_TAIL_PROFILE_EARLY==='1';
const todo=candidates.filter(row=>result.items[key(row)]?.status!=='pass'||
  (profileMuallim&&row.reciter===12&&
    (result.items[key(row)]?.gapMs??0)<-1000)||
  (profileEarly&&(result.items[key(row)]?.gapMs??0)<-50&&
    (result.items[key(row)]?.productionAfter50Rms??0)>.02)).slice(0,max);
function rms(buffer,fromMs,toMs){
  const lo=Math.max(0,Math.floor(fromMs*buffer.sampleRate/1000));
  const hi=Math.min(buffer.length,Math.ceil(toMs*buffer.sampleRate/1000));
  if(hi<=lo)return null;
  let sum=0;
  for(let channel=0;channel<buffer.numberOfChannels;channel++){
    const data=buffer.getChannelData(channel);
    for(let i=lo;i<hi;i++)sum+=data[i]*data[i];
  }
  return Math.sqrt(sum/((hi-lo)*buffer.numberOfChannels));
}
async function probe(row){
  const id=key(row),old=playback.items[id];
  const physical=Number.isFinite(old?.calibratedPhysicalEndMs)?
    old.calibratedPhysicalEndMs:row.physicalEndMs;
  const production=old?.productionRange?.[1];
  const item={reciter:row.reciter,verse:row.verse,url:row.url,
    physicalEndMs:physical,productionEndMs:production,
    gapMs:Number.isFinite(old?.calibratedGapMs)?old.calibratedGapMs:
      Number.isFinite(production)&&Number.isFinite(physical)?production-physical:null,
    indexKind:row.indexKind};
  if(!(Number.isFinite(physical)&&Number.isFinite(production))){item.status='missing-index';return item;}
  try{
    const from=Math.max(0,Math.min(production,physical)-150);
    const audio={sourceUrl:row.url,recordingUrl:row.url,reciterId:row.reciter,
      verifiedCbr:row.indexKind==='cbr-tagless',buffer:null,end:physical,
      verseRanges:{1:[from,physical]},verseSegments:{1:[]}};
    if(row.indexKind==='verified-vbr'){
      audio.cbrIndex=await getVerifiedVbrIndex(row.url,vbr.rows[row.url],
        {signal:AbortSignal.timeout(90000)});
      if(!audio.cbrIndex)throw Error('Verified VBR source mismatch');
    }
    const window=await prepareWindow(audio,1,context,
      {signal:AbortSignal.timeout(90000),positions:[]});
    item.decodedEndMs=window.hi;
    item.physicalLast50Rms=rms(window.buffer,window.hi-window.off-50,window.hi-window.off);
    item.physicalLast10Rms=rms(window.buffer,window.hi-window.off-10,window.hi-window.off);
    if(production>=window.lo&&production<=window.hi){
      const relative=production-window.off;
      item.productionBefore50Rms=rms(window.buffer,relative-50,relative);
      item.productionAfter50Rms=rms(window.buffer,relative,relative+50);
      if(row.reciter===12&&physical-production>1000){
        item.postCut100msRms=[];
        for(let ms=production;ms+100<=window.hi;ms+=100)
          item.postCut100msRms.push(rms(window.buffer,ms-window.off,ms-window.off+100));
      }
      if(physical-production>50){
        item.postCut50msRms=[];
        for(let ms=production;ms+50<=window.hi;ms+=50)
          item.postCut50msRms.push(rms(window.buffer,ms-window.off,ms-window.off+50));
      }
    }
    item.status='pass';
  }catch(error){item.status='fail';item.error=String(error);}
  return item;
}
function save(){saveChain=saveChain.then(()=>writeFile(output,JSON.stringify(result,null,2)+'\n'));return saveChain;}
async function worker(){
  while(true){
    const index=next++;
    if(index>=todo.length)return;
    const row=todo[index],item=await probe(row);
    result.items[key(row)]=item;finished++;
    await save();
    process.stderr.write(`${finished}/${todo.length} ${key(row)} ${item.status}`+
      `${item.physicalLast10Rms!=null?' rms10='+item.physicalLast10Rms.toFixed(5):''}\n`);
  }
}
await Promise.all(Array.from({length:Math.min(concurrency,todo.length)},worker));
await saveChain;
console.log(JSON.stringify({total:candidates.length,measured:Object.keys(result.items).length,
  pass:Object.values(result.items).filter(item=>item.status==='pass').length,
  fail:Object.values(result.items).filter(item=>item.status!=='pass').length}));
