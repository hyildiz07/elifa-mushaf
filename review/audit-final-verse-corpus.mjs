// Read-only corpus audit. Downloads only MP3 head probes (and the tail of a
// pinned Sudais VBR index), never a whole chapter recording.
import {readFile,writeFile} from 'node:fs/promises';
import {getCbrIndex,getVerifiedVbrIndex} from '../src/mp3-seek.mjs';

const base=new URL('../',import.meta.url);
const remote=JSON.parse(await readFile(new URL('review/remote-audio-all-retry.json',base)));
const sudais=JSON.parse(await readFile(new URL('assets/sudais-vbr-index.json',base)));
const output=new URL('test-results/final-verse-corpus-index.json',base);
const rows=new Array(remote.rows.length);
let next=0,done=0;
async function worker(){
  while(next<remote.rows.length){
    const i=next++,source=remote.rows[i];
    const path=source.source==='bundled'?`assets/verified-audio/${source.reciter}-${source.chapter}.json`:
      `test-results/timings/${source.reciter}-${source.chapter}.json`;
    try{
      const metadata=JSON.parse(await readFile(new URL(path,base)));
      if(metadata.audio_url!==source.url)throw Error('Active source URL differs from metadata');
      const last=metadata.verse_timings.at(-1);
      if(!last||!Number.isFinite(last.timestamp_to))throw Error('No final verse timing');
      const signal=AbortSignal.timeout(20000);
      let index=await getCbrIndex(source.url,{signal,allowTagless:!!metadata.source_recording});
      let kind=index?.tagless?'cbr-tagless':index?'cbr-info':null;
      if(!index&&source.reciter===3&&sudais.rows[source.url]){
        index=await getVerifiedVbrIndex(source.url,sudais.rows[source.url],{signal});
        if(index)kind='verified-vbr';
      }
      const physicalEndMs=index?index.frames*index.samples/index.rate*1000:null;
      const gapMs=physicalEndMs==null?null:last.timestamp_to-physicalEndMs;
      rows[i]={reciter:source.reciter,chapter:source.chapter,verse:last.verse_key,
        source:source.source,url:source.url,metadataPath:path,metadataEndMs:last.timestamp_to,
        indexKind:kind,physicalEndMs,gapMs,over650:gapMs!=null&&gapMs>650,
        fileSize:index?.fileSize??(index?index.start+index.size:null),
        headLength:source.head?.length?Number(source.head.length):null};
    }catch(error){
      rows[i]={reciter:source.reciter,chapter:source.chapter,source:source.source,url:source.url,
        metadataPath:path,error:String(error)};
    }
    done++;
    if(done%100===0)process.stderr.write(`checked ${done}/${remote.rows.length}\n`);
  }
}
await Promise.all(Array.from({length:12},worker));
await writeFile(output,JSON.stringify({checkedAt:new Date().toISOString(),sourceAudit:'review/remote-audio-all-retry.json',rows},null,2)+'\n');
const indexed=rows.filter(row=>row.indexKind);
const high=indexed.filter(row=>row.over650).sort((a,b)=>b.gapMs-a.gapMs);
console.log(JSON.stringify({total:rows.length,indexed:indexed.length,unindexed:rows.filter(row=>!row.indexKind&&!row.error).length,
  errors:rows.filter(row=>row.error).length,over650:high.length,high:high.map(row=>({reciter:row.reciter,chapter:row.chapter,verse:row.verse,gapMs:row.gapMs})),output:output.pathname},null,2));
