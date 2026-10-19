import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync('index.html','utf8');
function source(name){const start=html.search(new RegExp('(?:async )?function '+name+'\\('));assert.ok(start>=0);return html.slice(start,html.indexOf('\n}',start)+2);}
function harness(){
 const nodes=new Map(),events=[];let screen='org';
 const node=id=>{if(!nodes.has(id))nodes.set(id,{hidden:id==='studySplitPanel',scrollTop:100,classList:{contains:()=>screen==='reader'},scrollIntoView(){}});return nodes.get(id);};
 const c=vm.createContext({window:{bkCurrent:{code:'aaaaaa'},renderOrg:()=>events.push('renderOrg')},$:node,events,
  surahRequestId:0,studyRange:null,readerReturn:'home',curS:1,curAy:1,selA:null,SET:{reciter:223},
  SURAHS:[{id:1,tr:'Fâtiha',p:1},{id:2,tr:'Bakara',p:2}],verses:[],
  show:id=>{screen=id;events.push(id);},setTest(){},stopPlan(){},clearSel(){c.selA=null;},saveProgress(){events.push('saveProgress');},
  fetchVerses:async()=>[{n:1,pg:2},{n:10,pg:4}],getAudio:async()=>({ay:{},ws:{}}),buildDOM(){},updateStat(){},rewireTimings(){},toast(){},
  renderContinue(){},openTogetherScreen:()=>{screen='birlikte';events.push('birlikte');}});
 for(const name of ['surahForPage','openSurah','gotoPage'])vm.runInContext(source(name),c);
 const handler=html.match(/^\$\('backBtn'\)\.onclick=\(\)=>\{[\s\S]*?^\};/m)?.[0];assert.ok(handler);vm.runInContext(handler,c);
 return {c,node,events,screen:()=>screen};
}
test('a hatim juz opens its real page and the reader Back returns to the same hatim',async()=>{
 const h=harness();await h.c.gotoPage(4,{returnTo:'org'});
 assert.equal(h.screen(),'reader');assert.equal(h.c.curS,2);assert.equal(h.c.curAy,10);assert.equal(h.c.readerReturn,'org');
 h.node('backBtn').onclick();assert.equal(h.screen(),'org');assert.ok(h.events.includes('renderOrg'));assert.equal(h.c.window.bkCurrent.code,'aaaaaa');
});
test('reader Back has a safe Together fallback if its old hatim is no longer active',async()=>{
 const h=harness();await h.c.gotoPage(4,{returnTo:'org'});h.c.window.bkCurrent=null;h.node('backBtn').onclick();
 assert.equal(h.screen(),'birlikte');assert.equal(h.events.includes('renderOrg'),false);
});
test('ordinary page jumps still return home instead of inheriting an old hatim return target',async()=>{
 const h=harness();h.c.readerReturn='org';await h.c.gotoPage(4);assert.equal(h.c.readerReturn,'home');h.node('backBtn').onclick();assert.equal(h.screen(),'home');
});
test('continuing to another surah preserves the hatim return target, and first Back clears a word selection',async()=>{
 const h=harness();await h.c.openSurah(1,undefined,{returnTo:'org'});await h.c.openSurah(2);
 assert.equal(h.c.readerReturn,'org');h.c.selA=3;h.node('backBtn').onclick();assert.equal(h.screen(),'reader');assert.equal(h.c.selA,null);
 h.node('backBtn').onclick();assert.equal(h.screen(),'org');
});
