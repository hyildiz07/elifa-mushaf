import fs from 'node:fs';
import {fetchMp3quranAudioMeta} from '../assets/mp3quran-reciter.js';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const chapters=JSON.parse(html.match(/^const SURAHS=(\[.*\]);$/m)?.[1]||'null');
if(chapters?.length!==114)throw Error('Chapter reference missing');
const jobs=[220,223].flatMap(reciter=>chapters.map(chapter=>({reciter,chapter})));
const failures=[];
let cursor=0;
await Promise.all(Array.from({length:8},async()=>{
  while(cursor<jobs.length){
    const {reciter,chapter}=jobs[cursor++];
    try{await fetchMp3quranAudioMeta(reciter,chapter.id,chapter.n);}
    catch(error){failures.push({reciter,chapter:chapter.id,error:String(error)});}
  }
}));
console.log(JSON.stringify({checked:jobs.length,failures}));
if(failures.length)process.exitCode=1;
