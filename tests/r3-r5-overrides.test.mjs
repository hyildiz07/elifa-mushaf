import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
function fn(name){const start=html.search(new RegExp('(?:async )?function '+name+'\\('));
  assert.ok(start>=0,`${name} exists`);
  const line=html.slice(start,html.indexOf('\n',start));
  return line.endsWith('}')?line:html.slice(start,html.indexOf('\n}',start)+2);
}
const c=vm.createContext({SET:{startPad:0,endPad:-60,cumu:true},AD_:null,wordArr:[],ayGi:{},splitParts:[],WAQF_RE:/[\u06D6-\u06DC]/});
for(const name of ['QTEXT','QTEXT_TR']){
  const start=html.indexOf('const '+name+'=');vm.runInContext(html.slice(start,html.indexOf('\n',start)),c);
}
for(const name of ['alignTurkishWords','splitPauseAllowed','splitPhraseBoundary','splitChunkPositions',
  'repeatedTimeline','repeatedAudioRanges','computeParts','partKey','partStep','terminalMuallimTailEnd','splitBounds','stepBounds','buildPartsPlan'])
  vm.runInContext(fn(name),c);
const qtext=vm.runInContext('QTEXT',c),start=html.indexOf('  const ay={},ws={},verseEnds={}'),end=html.indexOf('  allSegs.sort',start);
const metadata=new vm.Script('AD_=(()=>{'+html.slice(start,end)+'return {ay,ws,verseEnds,verseRanges,verseSegments,end,segs:allSegs,buffer:null};})()');
const rows=JSON.parse(fs.readFileSync(new URL('../assets/audio-timing-overrides-r3-r5.json',import.meta.url))).rows;

test('same-recording Sudais label corrections produce short, complete playable parts',()=>{
  const originalKeys=['3:16:71','3:2:114','3:2:223','3:48:29',
    '3:6:38','3:61:14','3:9:74','3:24:35'];
  assert.equal(originalKeys.length,8);
  for(const key of originalKeys){
    const row=rows[key];
    assert.ok(row,key);
    const [rid,sid,ay]=key.split(':').map(Number);
    assert.equal(rid,3,key);
    assert.match(row.url,/^https:\/\/download\.quranicaudio\.com\/qdc\/abdurrahmaan_as_sudais\/murattal\/\d+\.mp3$/);
    const af={audio_url:row.url,verse_timings:[{verse_key:`${sid}:${ay}`,
      timestamp_from:row.range[0],timestamp_to:row.range[1],segments:row.segments}]};
    c.af=af;c.curS=sid;c.sid=sid;metadata.runInContext(c);
    c.AD_.trustedNext=Number.isFinite(row.next)?{[ay]:row.next}:{};
    c.AD_.allowedSplitCuts=Array.isArray(row.allowedCuts)?{[ay]:row.allowedCuts}:{};
    const words=qtext[sid][ay-1][2].filter(w=>w[1]===0).map(w=>w[0]);
    c.wordArr=words.map((txt,gi)=>({txt,gi,ay,pos:gi+1,joinNext:false}));c.ayGi={[ay]:[0,words.length-1]};
    c.splitParts=c.computeParts(ay);
    assert.ok(c.splitParts.length>=2,key);
    const limit=key==='3:24:35'?9:8;
    assert.ok(c.splitParts.every(p=>p.words.length<=limit&&!p.timingFallback),key);
    assert.deepEqual(Array.from(c.splitParts.flatMap(p=>p.words.map(w=>w.pos))),Array.from({length:words.length},(_,i)=>i+1),key);
    const single=c.buildPartsPlan(0).filter(p=>!p.combo);
    const bounds=single.flatMap(p=>p.ranges?.length?p.ranges:[c.stepBounds(p)]);
    for(const segment of c.AD_.verseSegments[ay])
      assert.ok(bounds.some(b=>b.f<=segment[1]&&b.t>=segment[2]),`${key} word ${segment[0]} uncovered`);
    if(row.next!=null)assert.ok(bounds.every(b=>b.t<=row.next),`${key} crosses next ayah`);
  }
});
