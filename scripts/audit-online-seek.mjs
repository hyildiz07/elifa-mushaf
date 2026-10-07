import fs from 'node:fs';
import {getCbrIndex} from '../src/mp3-seek.mjs';

// Probe every verified QUA chapter against its current source MP3. This is an
// on-demand network audit, not a build step: CDNs can have transient errors.
const files=fs.readdirSync('assets/verified-audio').filter(name=>name.endsWith('.json'));
const failed=[];
let cursor=0,done=0;
async function worker(){
  while(cursor<files.length){
    const file=files[cursor++];
    const row=JSON.parse(fs.readFileSync(`assets/verified-audio/${file}`));
    let index=null,error=null;
    for(let attempt=0;attempt<2&&!index;attempt++)try{
      index=await getCbrIndex(row.audio_url,{allowTagless:true,
        signal:AbortSignal.timeout(30000)});
      if(!index)error='no verified CBR index';
    }catch(caught){error=String(caught);}
    if(!index)failed.push({file,url:row.audio_url,reason:error});
    done++;
    if(done%100===0)console.log(JSON.stringify({checked:done,total:files.length,failed:failed.length}));
  }
}
await Promise.all(Array.from({length:8},worker));
fs.mkdirSync('test-results',{recursive:true});
fs.writeFileSync('test-results/online-seek-audit.json',JSON.stringify({files:files.length,failed},null,2));
console.log(JSON.stringify({files:files.length,failed:failed.length,examples:failed.slice(0,20)}));
if(failed.length)process.exitCode=1;
