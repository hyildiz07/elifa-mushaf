import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
function fn(name,indent='  '){
  const start=html.indexOf('function '+name+'(');assert.ok(start>=0,name);
  const lineEnd=html.indexOf('\n',start),line=html.slice(start,lineEnd);
  return line.trimEnd().endsWith('}')?line:html.slice(start,html.indexOf('\n'+indent+'}',start)+indent.length+2);
}
const texts=vm.createContext({});
for(const name of ['QTEXT','QTEXT_TR']){const start=html.indexOf('const '+name+'=');vm.runInContext(html.slice(start,html.indexOf('\n',start)),texts);}
vm.runInContext(fn('alignTurkishWords',''),texts);
const {QTEXT,QTEXT_TR,alignTurkishWords}=vm.runInContext('({QTEXT,QTEXT_TR,alignTurkishWords})',texts);
const cutLine=html.split('\n').find(x=>x.includes('var CUTS='));
function setup(s,a,script='turk',end=a){
  const c={QTEXT,QTEXT_TR,alignTurkishWords,curS:s,wordArr:[],ayGi:{},selA:null,selB:null,selMode:'ayah',_duaSelectionInfo:null,
    renderSel(){c.rendered=[c.selA,c.selB];},clearSel(){c.selA=c.selB=null;},toast(m){c.warning=m;},dt:k=>k,window:{},
    document:{querySelectorAll:()=>[]}};
  let gi=11; // selection must use global rendered offsets, not verse-relative indices
  for(let ay=a;ay<=end;ay++){
    const base=QTEXT[s][ay-1][2].filter(x=>x[1]===0).map(x=>x[0]);
    const words=script==='turk'?alignTurkishWords(base,QTEXT_TR[s][ay-1].split(/\s+/).filter(Boolean)):base;
    const start=gi;
    words.forEach((txt,i)=>{const classes=new Set();c.wordArr[gi]={txt,gi,ay,pos:i+1,el:{textContent:txt,classList:{add:k=>classes.add(k)},classes}};gi++;});
    c.ayGi[ay]=[start,gi-1];
  }
  vm.createContext(c);vm.runInContext(cutLine,c);
  for(const name of ['arNorm','duaPortionWords','duaWordRange','duaSelection','duaSelectAyah','markWordsByText'])vm.runInContext(fn(name),c);
  const at=html.indexOf('  window.elifaDuaSelection=');
  vm.runInContext(html.slice(at,html.indexOf('\n  function markWordsByText',at)),c);
  return c;
}
function selectedText(c){return c.wordArr.slice(c.selA,c.selB+1).map(w=>w.txt).join(' ');}
test('Bakara 127 marks and plays only Rabbanā taqabbal minnā in both Quran scripts',()=>{
  for(const script of ['turk','medine']){
    const c=setup(2,127,script);
    assert.equal(c.duaSelectAyah(2,127,null,'Kabul duası'),true);
    const expected=QTEXT_TR[2][126].split(/\s+/).slice(7,14).join(' ');
    assert.equal(c.arNorm(selectedText(c)),c.arNorm(expected));
    assert.equal(c.selMode,'word');assert.ok(c.selA>c.ayGi[127][0]);
    assert.deepEqual(c.rendered,[c.selA,c.selB]);
    c.markWordsByText(2,127,[7,14]);
    for(const w of c.wordArr.filter(Boolean))assert.equal(w.el.classes.has('dua-hi'),w.gi>=c.selA&&w.gi<=c.selB);
    const transfer=c.window.elifaDuaSelection();
    assert.equal(transfer.title,'Kabul duası');assert.equal(transfer.wordRange.start,c.selA);assert.equal(transfer.wordRange.end,c.selB);
    assert.equal(transfer.fromWordInclusive,c.wordArr[c.selA].pos);
    assert.equal(transfer.toWordInclusive,c.wordArr[c.selB].pos);
  }
});
test('short knowledge prayer selects its three words rather than all of Taha 114',()=>{
  for(const script of ['turk','medine']){
    const c=setup(20,114,script);assert.ok(c.duaSelectAyah(20,114,null,'İlim duası'));
    assert.equal(c.selB-c.selA+1,3);assert.equal(c.wordArr[c.selA].pos,15);
    assert.equal(c.arNorm(selectedText(c)),c.arNorm('رَبِّ زِدْنِي عِلْمًا'));
  }
});
test('every defined prayer portion maps to the same audio words in Turkish and Medina scripts',()=>{
  const cuts=vm.runInNewContext(cutLine+';CUTS');
  for(const key of Object.keys(cuts)){
    const [s,a]=key.split(':').map(Number),turkish=setup(s,a,'turk'),medina=setup(s,a,'medine');
    const first=turkish.duaSelection(s,a),second=medina.duaSelection(s,a);
    assert.ok(first,key+' Turkish');assert.ok(second,key+' Medina');
    assert.equal(second.fromWordInclusive,first.fromWordInclusive,key+' start');
    assert.equal(second.toWordInclusive,first.toWordInclusive,key+' end');
  }
});
test('a known dua that cannot be matched never falls back to selecting a whole verse',()=>{
  const c=setup(2,127);c.wordArr[c.ayGi[127][1]].txt='غير مطابق';c.selA=1;c.selB=2;
  assert.equal(c.duaSelectAyah(2,127),false);assert.equal(c.selA,null);assert.equal(c.selB,null);
  assert.equal(c.warning,'dua_selection_unavailable');assert.equal(c.window.elifaDuaSelection(),null);
});
test('whole-verse and multi-verse cards retain their intended scope',()=>{
  const c=setup(2,285,'turk',286);assert.ok(c.duaSelectAyah(2,285,286,'Âmenerresûl'));
  assert.equal(c.selA,c.ayGi[285][0]);assert.equal(c.selB,c.ayGi[286][1]);assert.equal(c.selMode,'ayah');
  assert.equal(c.window.elifaDuaSelection().toAy,286);
});
test('transfer reflects adjusted handles and is unavailable after a reader or selection change',()=>{
  const c=setup(2,127);c.duaSelectAyah(2,127,null,'Kabul duası');c.selA++;
  assert.equal(c.window.elifaDuaSelection().wordRange.start,c.selA);
  c.curS=3;assert.equal(c.window.elifaDuaSelection(),null);
  c.curS=2;c.selA=null;c.selB=null;assert.equal(c.window.elifaDuaSelection(),null);
  c.duaSelectAyah(2,127);vm.runInContext(fn('duaClearUI'),c);c.duaClearUI();
  assert.equal(c.window.elifaDuaSelection(),null);
  const open=html.slice(html.indexOf('  window.openFromDua='),html.indexOf('// normal okuyucu (dua'));
  assert.match(open,/duaSelectAyah\(s,a,aEnd,title\)/);assert.match(open,/visit!==surahRequestId/);
});
test('opening a Quran dua applies its real selection and stale loads cannot mark a later reader',async()=>{
  const c=setup(2,127),pending=[];c.surahRequestId=1;c.setTimeout=fn=>pending.push(fn);
  c.duaClearUI=()=>{c._duaSelectionInfo=null;};c.duaBuildUI=()=>{};c.duaCleanPage=()=>{c.cleaned=true;};c.scrollToAyah=()=>{};
  let resolve;c.openSurah=()=>new Promise(r=>{resolve=r;});
  const at=html.indexOf('  window.openFromDua=');
  vm.runInContext(html.slice(at,html.indexOf('\n\n  // normal okuyucu',at)),c);
  c.window.openFromDua(2,127,null,'Kabul duası');resolve();await Promise.resolve();
  assert.equal(c.selMode,'word');assert.equal(c.window.elifaDuaSelection().title,'Kabul duası');
  assert.equal(c.cleaned,true,'clean view is applied with the selection, not on a later timer');
  c.curS=3;c.surahRequestId++;for(const fn of pending)fn();
  c.curS=2;c.selA=null;c.selB=null;pending.length=0;
  c.window.openFromDua(2,127);c.surahRequestId++;c.window.readerReturn='home';resolve();await Promise.resolve();
  assert.equal(c.selA,null);assert.equal(c.window.readerReturn,'home');assert.equal(pending.length,0);
});
test('text-ready marks and cleans a dua while audio is pending, and audio completion preserves adjusted handles',async()=>{
  const c=setup(2,127);c.surahRequestId=1;c.setTimeout=()=>{throw Error('text callback must not wait for a timer');};
  let builds=0,cleans=0,resolve,ready;
  c.duaClearUI=()=>{c._duaSelectionInfo=null;};c.duaBuildUI=()=>{builds++;};c.duaCleanPage=()=>{cleans++;};c.scrollToAyah=()=>{};
  c.openSurah=(s,a,options)=>{c.surahRequestId++;ready=options.onTextReady;return new Promise(r=>{resolve=r;});};
  const at=html.indexOf('  window.openFromDua=');
  vm.runInContext(html.slice(at,html.indexOf('\n\n  // normal okuyucu',at)),c);
  c.window.openFromDua(2,127,null,'Kabul duası');
  assert.equal(builds,0);assert.equal(c.window.__duaBannerKeep,false);
  ready();assert.equal(builds,1);assert.equal(cleans,1);assert.equal(c.selMode,'word');
  const adjusted=++c.selA;ready();resolve();await Promise.resolve();
  assert.equal(builds,1);assert.equal(cleans,1);assert.equal(c.selA,adjusted,'audio loading must not reset the user’s adjusted prayer selection');
});
test('stale text-ready callbacks cannot restore a dua on a new visit to the same surah',async()=>{
  const c=setup(2,127);c.surahRequestId=7;c.duaClearUI=()=>{};
  c.duaBuildUI=()=>{throw Error('stale callback touched the reader');};let ready,resolve;
  c.openSurah=(s,a,options)=>{c.surahRequestId++;ready=options.onTextReady;return new Promise(r=>{resolve=r;});};
  const at=html.indexOf('  window.openFromDua=');
  vm.runInContext(html.slice(at,html.indexOf('\n\n  // normal okuyucu',at)),c);
  c.window.openFromDua(2,127);c.surahRequestId++;c.window.readerReturn='home';
  ready();resolve();await Promise.resolve();assert.equal(c.selA,null);assert.equal(c.window.readerReturn,'home');
});
test('synchronous text-ready and failed opens both restore the temporary banner-keep flag',async()=>{
  const c=setup(2,127);c.surahRequestId=1;c.duaClearUI=()=>{};c.duaBuildUI=()=>{};c.duaCleanPage=()=>{};c.scrollToAyah=()=>{};
  c.openSurah=(s,a,options)=>{c.surahRequestId++;options.onTextReady();assert.equal(c.window.__duaBannerKeep,true);return Promise.resolve();};
  const at=html.indexOf('  window.openFromDua=');
  vm.runInContext(html.slice(at,html.indexOf('\n\n  // normal okuyucu',at)),c);
  c.window.openFromDua(2,127);assert.equal(c.window.__duaBannerKeep,false);await Promise.resolve();
  c.openSurah=()=>{throw Error('opening failed');};
  assert.throws(()=>c.window.openFromDua(2,127),/opening failed/);assert.equal(c.window.__duaBannerKeep,false);
});
test('Quran and recorded-prayer instructions distinguish scope and favorite reopening preserves arguments',()=>{
  assert.match(html,/dua_gunluk_info:\{tr:'Kur’an’dan konuya göre seçilmiş dualar ve âyetler/);
  assert.match(html,/dua_namaz_info:\{tr:'Namazda okunan dualar ve tesbihler/);
  assert.match(html,/window\.openFromDua\(s,a,it&&it\.aEnd,title,full\)/);
  for(const script of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi))new vm.Script(script[1]);
});
function dailyCards(){
  const c=vm.createContext({lang:'tr',curLang:()=>c.lang,suraName:s=>'Sûre '+s,dt:k=>k==='dua_ayet'?'âyet':k});
  let start=html.indexOf('  var G=[');vm.runInContext(html.slice(start,html.indexOf('\n  ];',start)+6),c);
  start=html.indexOf('  var GINFO={');vm.runInContext(html.slice(start,html.indexOf('\n  };',start)+6),c);
  for(const name of ['duaCardType','duaCardDescription'])vm.runInContext(fn(name),c);
  return c;
}
test('all daily cards provide a short context summary and a deliberate Quran content type',()=>{
  const c=dailyCards();assert.equal(c.G.length,120);
  for(const item of c.G){
    const meta=c.GINFO[item.s+':'+item.a];assert.ok(meta,item.s+':'+item.a);
    assert.ok(['dua','ayet','sure','emir'].includes(meta[0]));
    for(const lang of ['tr','en']){
      c.lang=lang;const desc=c.duaCardDescription(item);
      assert.ok(desc.includes(meta[lang==='tr'?1:2]));
      assert.ok(meta[lang==='tr'?1:2].length>=30,'actual context, not a verse reference');
      assert.ok(meta[lang==='tr'?1:2].length<180,'summary remains short');
    }
  }
});
test('narratives, praise and assurances are not labelled as requests to Allah',()=>{
  const c=dailyCards(),type=key=>c.GINFO[key][0];
  for(const key of ['50:22','36:9','68:51','57:1','59:1','20:46','53:48','39:62','26:62','18:39'])assert.equal(type(key),'ayet',key);
  for(const key of ['2:127','20:114','7:23','23:118'])assert.equal(type(key),'dua',key);
  for(const key of ['113:1','55:1','56:1'])assert.equal(type(key),'sure',key);
  assert.equal(type('74:1'),'emir');
  assert.match(c.GINFO['2:127'][1],/İbrâhim ve İsmâil.*Kâbe.*kabul/);
  assert.match(c.GINFO['50:22'][1],/Âhiret/);
  assert.match(c.GINFO['36:9'][1],/İnkâr/);
  assert.match(c.GINFO['68:51'][1],/inkârcıların.*öfkeli/);
  for(const item of c.G)assert.doesNotMatch(item.tn,/Basiretin açılması|Nazardan koruma|kem göze\/nazara karşı|Unutturmama/);
  assert.doesNotMatch(html,/tr:'Gizlenme & Görünmezlik'|tr:'Koruma & Açılım Âyetleri'/);
});
test('daily descriptions and content badges use the existing card slots and full-surah navigation',()=>{
  const c=dailyCards();
  const rendered=html.slice(html.indexOf("} else if(subTab==='gunluk')"),html.indexOf('// ---- overlay kabuğu'));
  assert.match(rendered,/card\(duaCardTitle\(it\), duaCardDescription\(it\)/);
  assert.match(rendered,/openFromDua\(it\.s,it\.a,it\.aEnd,duaCardTitle\(it\),duaCardType\(it\)==='sure'\)/);
  assert.match(fn('card'),/class="dc-s"/);assert.match(fn('card'),/ayet:'dua_ty_ayet',sure:'dua_ty_sure'/);
  assert.ok(!c.duaCardDescription(c.G.find(x=>x.s===56&&x.a===1)).includes('1. âyet'));
});
