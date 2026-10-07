import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
function fn(name){
  const start=html.search(new RegExp('(?:async )?function '+name+'\\('));
  if(start<0)throw Error(`${name} missing`);
  return html.slice(start,html.indexOf('\n}',start)+2);
}
const c=vm.createContext({SET:{reciter:0},curS:0,AD_:null,wordArr:[],ayGi:{}});
for(const name of ['QTEXT','QTEXT_TR']){
  const start=html.indexOf(`const ${name}=`);
  vm.runInContext(html.slice(start,html.indexOf('\n',start)),c);
}
c.QTEXT=vm.runInContext('QTEXT',c);
 c.QTEXT_TR=vm.runInContext('QTEXT_TR',c);
for(const name of ['alignTurkishWords','splitPauseAllowed','splitPhraseBoundary','splitChunkPositions','repeatedTimeline',
  'repeatedAudioRanges','computeParts'])vm.runInContext(fn(name),c);
const report={files:0,verses:0,long:0,single:[],missing:[],overlap:[]};
const dir=process.argv.includes('--legacy')?
  new URL('../test-results/timings/',import.meta.url):
  new URL('../assets/verified-audio/',import.meta.url);
for(const file of fs.readdirSync(dir).filter(s=>s.endsWith('.json'))){
  const [rid,sid]=file.replace('.json','').split('-').map(Number);
  const af=JSON.parse(fs.readFileSync(new URL(file,dir)));
  c.SET.reciter=rid;c.curS=sid;
  c.AD_={reciterId:rid,verifiedCbr:!process.argv.includes('--legacy'),verseRanges:{},verseSegments:{},trustedNext:{}};
  for(const v of af.verse_timings){
    const ay=+v.verse_key.split(':')[1];
    c.AD_.verseRanges[ay]=[v.timestamp_from,v.timestamp_to];
    c.AD_.verseSegments[ay]=v.segments;
  }
  report.files++;
  for(const v of af.verse_timings){
    const ay=+v.verse_key.split(':')[1];
    const words=c.QTEXT[sid]?.[ay-1]?.[2]?.filter(w=>w[1]===0).map(w=>w[0]);
    if(!words)continue;
    report.verses++;if(words.length<8)continue;report.long++;
    const printed=c.QTEXT_TR[sid]?.[ay-1]?.split(/\s+/).filter(Boolean)||[];
    const grouped=process.argv.includes('--turk')?c.alignTurkishWords(words,printed):null;
    const display=grouped||words;
    c.wordArr=display.map((txt,i)=>({txt,gi:i,ay,pos:i+1,joinNext:!!grouped?.joinNext?.has(i)}));
    c.ayGi={[ay]:[0,words.length-1]};
    const parts=c.computeParts(ay);
    const positions=parts.flatMap(p=>p.words.map(w=>w.pos));
    const expected=Array.from({length:words.length},(_,i)=>i+1);
    if(JSON.stringify(positions)!==JSON.stringify(expected))report.missing.push({rid,sid,ay,count:words.length,positions});
    if(parts.length===1)report.single.push({rid,sid,ay,count:words.length,fallback:!!parts[0]?.timingFallback});
  }
}
console.log(JSON.stringify({...report,singleCount:report.single.length,
  singleByReciter:Object.fromEntries([...new Set(report.single.map(s=>s.rid))].sort((a,b)=>a-b)
    .map(rid=>[rid,report.single.filter(s=>s.rid===rid).length])),
  legacyRelevant:process.argv.includes('--legacy')?report.single.filter(s=>[3,5,12].includes(s.rid)):undefined,
  singleExamples:report.single.slice(0,40),single:undefined,missing:report.missing.slice(0,20)},null,2));
