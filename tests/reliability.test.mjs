import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const h=fs.readFileSync('index.html','utf8');
function fn(name){const s=h.search(new RegExp('(?:async )?function '+name+'\\('));return h.slice(s,h.indexOf('\n}',s)+2);}
function reader(){
  const pending={},events=[];let screen='reader';
  const c=vm.createContext({surahRequestId:0,curS:null,readerReturn:'home',SURAHS:[{id:1,tr:'A'},{id:2,tr:'B'}],SET:{reciter:4},window:{},
    show:s=>screen=s,setTest(){},$:()=>({classList:{contains:()=>screen==='reader'}}),stopPlan(){},clearSel(){},updateStat(){},toast(){},
    fetchVerses:async sid=>[{sid}],getAudio:(rid,sid)=>new Promise((resolve,reject)=>pending[sid]={resolve,reject}),
    buildDOM:meta=>events.push({type:'render',sid:meta.id,verses:c.verses[0].sid}),rewireTimings:()=>events.push({type:'audio',sid:c.AD_.sid})});
  vm.runInContext(fn('openSurah'),c);return {c,pending,events};
}
test('text renders before the audio request completes',async()=>{
  const {c,pending,events}=reader(),p=c.openSurah(1);await new Promise(r=>setImmediate(r));
  assert.deepEqual(events,[{type:'render',sid:1,verses:1}]);pending[1].resolve({sid:1});await p;
});
test('a slow previous surah cannot overwrite the latest text or audio',async()=>{
  const {c,pending,events}=reader();const a=c.openSurah(1);await new Promise(r=>setImmediate(r));
  const b=c.openSurah(2);await new Promise(r=>setImmediate(r));pending[2].resolve({sid:2});await b;pending[1].resolve({sid:1});await a;
  assert.equal(c.curS,2);assert.equal(c.verses[0].sid,2);assert.equal(c.AD_.sid,2);
  assert.deepEqual(events.filter(e=>e.type==='audio'),[{type:'audio',sid:2}]);
});
test('changing reciter while a surah loads rejects the obsolete audio',async()=>{
  const {c,pending}=reader();const p=c.openSurah(1);await new Promise(r=>setImmediate(r));c.SET.reciter=7;c.AD_={sid:1,rid:7};pending[1].resolve({sid:1,rid:4});await p;assert.equal(c.AD_.rid,7);
});
test('choosing a reciter on the home screen waits for a surah before loading audio',async()=>{
  const buttons=[],messages=[],c=vm.createContext({
    RECITERS:[{id:12,n:'Husarî Muallim',s:'Muallim'}],SET:{reciter:4},curS:0,audioRequestId:0,reciterChoiceGeneration:0,splitSelIdx:0,
    document:{createElement:()=>({})},$:id=>id==='rlist'?{set innerHTML(_) {},appendChild:b=>buttons.push(b)}:{classList:{contains:()=>false}},
    elifaRecStyle:s=>s,openSheet(){},saveSet(){},closeSheets(){},updateRecStrip(){},fillAyarlar(){},stopPlan(){},updateStat(){},
    toast:s=>messages.push(s),getAudio:()=>{throw Error('No surah should be loaded from home');}
  });
  vm.runInContext(fn('selectReciter'),c);vm.runInContext(fn('openReciterSheet'),c);c.openReciterSheet();await buttons[0].onclick();
  assert.equal(c.SET.reciter,12);assert.deepEqual(messages,['Husarî Muallim seçildi']);
});
test('page and reading-progress observers keep a nonempty vertical band on wide screens',()=>{
  const instances=[],root={clientHeight:600},elements={'.pgdiv':[{}],'.am':[{}]};
  class Observer{
    constructor(callback,options){this.callback=callback;this.options=options;instances.push(this);}
    observe(){} disconnect(){this.disconnected=true;}
  }
  class Resize{constructor(callback){this.callback=callback;}observe(){}}
  const c=vm.createContext({pgIO:null,amIO:null,pageObserverResize:null,IntersectionObserver:Observer,ResizeObserver:Resize,
    $:id=>id==='rscroll'?root:{textContent:''},document:{querySelectorAll:s=>elements[s]},window:{}});
  vm.runInContext(fn('wirePageObserver'),c);c.wirePageObserver();
  assert.equal(instances[0].options.rootMargin,'-180px 0px -360px 0px');
  assert.equal(instances[1].options.rootMargin,'-240px 0px -330px 0px');
  root.clientHeight=360;c.pageObserverResize.callback();
  assert.equal(instances[2].options.rootMargin,'-108px 0px -216px 0px');
  assert.equal(instances[3].options.rootMargin,'-144px 0px -198px 0px');
  assert.ok(instances[0].disconnected&&instances[1].disconnected);
});
test('saving a reading position uses the visible verse on a wide screen',()=>{
  const written=[],markers=[{dataset:{ay:'146'},top:369},{dataset:{ay:'147'},top:460}];
  const root={clientHeight:604,getBoundingClientRect:()=>({top:115}),querySelectorAll:()=>markers.map(m=>({dataset:m.dataset,getBoundingClientRect:()=>({top:m.top})}))};
  const c=vm.createContext({curS:2,curAy:145,visAy:147,prog:null,$:()=>root,setInterval(){},store:{set:(key,value)=>written.push({key,value})}});
  vm.runInContext(fn('visibleProgressAy')+'\n'+fn('saveProgress'),c);
  c.saveProgress();assert.equal(written.at(-1).value.a,146);
  markers[0].top=275;markers[1].top=366;c.saveProgress();assert.equal(written.at(-1).value.a,147);
});
test('quota failure remains readable in memory and emits a persistent warning',()=>{
  const s=h.indexOf('const mem={};'),e=h.indexOf('let surahFavorites',s),events=[];
  const c=vm.createContext({window:{dispatchEvent:e=>events.push(e.type)},Event:class{constructor(type){this.type=type;}},localStorage:{getItem:()=>null,setItem(){throw Error('QuotaExceeded');}}});
  vm.runInContext(h.slice(s,e),c);
  assert.equal(vm.runInContext("store.set('notes',{'1:1':'new'})",c),false);
  assert.equal(vm.runInContext("store.get('notes',{})['1:1']",c),'new');assert.deepEqual(events,['elifa-storage-error']);
  assert.equal(c.window.elifaReadLocalValue('notes'),'{"1:1":"new"}');
});
test('production network failures never fall back to a fake successful local group',async()=>{
  const c=vm.createContext({location:{hostname:'mushaf.elifaplatform.com'},bkOffline:false,fetch:async()=>{throw Error('network');},AbortSignal,bkDemoApi:()=>{throw Error('must not call demo');}});
  vm.runInContext(fn('bkApi'),c);await assert.rejects(c.bkApi({action:'contribute'}),/kaydedildi sayılmadı/);assert.equal(c.bkOffline,false);
});
