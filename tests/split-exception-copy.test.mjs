import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
function extract(name){
  const at=html.search(new RegExp(`(?:async )?function ${name}\\(`));
  assert.ok(at>=0,`${name} exists`);
  return html.slice(at,html.indexOf('\n}',at)+2);
}

test('reciter chooser does not promise universal word sync in any locale',()=>{
  assert.match(html,/<p class="sub" data-i18n="rec_sub">Bazı kayıtlarda kelime eşlemesi sınırlıdır\.<\/p>/);
  const line=html.match(/^\s*rec_sub:(\[[^\n]+\]),$/m);
  assert.ok(line,'rec_sub translations exist');
  const translations=vm.runInNewContext(line[1]);
  assert.equal(translations.length,21);
  assert.ok(translations.every(text=>typeof text==='string'&&text.trim().length>10));
  assert.ok(!translations.some(text=>/^all support|^tümü |^alle mit /i.test(text)));
});

test('long cards are described honestly before and after audio preparation',()=>{
  const intro={textContent:'',_html:'',
    set innerHTML(html){this._html=html;this.textContent=html.replace(/<[^>]*>/g,'');},
    get innerHTML(){return this._html;},
    append(text){this.textContent+=text;}};
  const fallback={hidden:true,dataset:{},textContent:''};
  const c=vm.createContext({
    splitParts:[],splitAy:54,AD_:{splitBuf:null},SET:{reciter:3,repOn:true,rep:4,cumu:false},curS:39,
    $:id=>id==='splitFallbackReciter'?fallback:intro,
    showUnsafeSplitTiming(){intro.textContent='Engelli';},
  });
  vm.runInContext(extract('printedWordCount')+extract('offerSplitReciterChoice')+extract('updateSplitIntro'),c);
  const part=count=>({words:Array.from({length:count},()=>({txt:'كلمة',joinNext:false}))});

  c.splitParts=[part(13)];
  c.updateSplitIntro();
  assert.match(intro.textContent,/tek parça/);
  assert.match(intro.textContent,/başka bir hoca/);
  assert.doesNotMatch(intro.textContent,/kısa ezber parçası/);
  assert.equal(fallback.hidden,false);
  assert.equal(fallback.textContent,'Başka hoca seç');
  assert.equal(fallback.dataset.action,'choose');

  c.splitParts=[part(5),part(9),part(4)];
  intro.textContent='';
  c.updateSplitIntro();
  assert.match(intro.textContent,/8 kelimeden uzun/);
  c.AD_.splitBuf={ay:54};
  intro.textContent='';
  c.updateSplitIntro();
  assert.match(intro.textContent,/8 kelimeden uzun/);

  c.splitParts=[{...part(22),unsafeTiming:true}];
  intro.textContent='';
  c.updateSplitIntro();
  assert.equal(intro.textContent,'Engelli');

  c.splitParts=[];
  intro.textContent='Ses sınırı doğrulanamadı';
  fallback.hidden=false;
  c.updateSplitIntro();
  assert.equal(intro.textContent,'Ses sınırı doğrulanamadı');
  assert.equal(fallback.hidden,false);
});

test('choosing a quarantined recording keeps the current working reciter',async()=>{
  const buttons=[],messages=[],list={innerHTML:'',appendChild(button){buttons.push(button);}};
  const c=vm.createContext({
    RECITERS:[{id:3,n:'Südeys',s:'Murattal'}],SET:{reciter:4},curS:3,
    document:{createElement:()=>({})},$:()=>list,elifaRecStyle:s=>s,
    audioTimingUnverified:(rid,sid)=>rid===3&&sid===3,
    toast:message=>messages.push(message),openSheet(){},
    saveSet(){throw Error('A blocked choice must not be saved');},
    getAudio(){throw Error('A blocked choice must not load');},
  });
  vm.runInContext(extract('selectReciter'),c);
  vm.runInContext(extract('openReciterSheet'),c);
  c.openReciterSheet();
  await buttons[0].onclick();
  assert.equal(c.SET.reciter,4);
  assert.match(messages[0],/Çalışan hocayı koruduk/);
});

test('guarded split audio offers an explicit reciter switch and keeps the selected verse',async()=>{
  const elements={
    splitFallbackReciter:{hidden:true,dataset:{},textContent:''},
    splitIntro:{textContent:''},
    splitPlayStatus:{textContent:'',classList:{add(){}}},
    split:{classList:{contains:()=>true}},
    reader:{classList:{contains:()=>false}},
  };
  const c=vm.createContext({pendingSplitPlay:null,SET:{reciter:3},curS:3,splitAy:160,
    splitParts:[{old:true}],splitSelIdx:0,reciterChoiceGeneration:0,
    audioRequestId:0,AD_:null,splitChapterAudio:null,splitVerseLoading:null,
    $:id=>elements[id],audioTimingUnverified:()=>false,toast(){},saveSet(){},closeSheets(){},
    updateRecStrip(){},fillAyarlar(){},updateStat(){},renderSplit(){},
    stopPlan(){c.audioRequestId++;},getAudio:async()=>({sourceUrl:'verified',verseRanges:{160:[1,2]}}),
    rewireTimings(){},openSplit(ay,continuing){c.reopened={ay,continuing};},
  });
  vm.runInContext(extract('offerSplitReciterChoice')+extract('showSplitError'),c);
  vm.runInContext(extract('selectReciter'),c);
  c.showSplitError(Error('RECITER_CHAPTER_TIMING_UNVERIFIED'));
  assert.equal(elements.splitFallbackReciter.hidden,false);
  assert.equal(elements.splitFallbackReciter.dataset.action,'shatri');
  await c.selectReciter({id:4,n:'Ebû Bekir eş-Şâtırî',s:'Murattal'});
  assert.equal(c.SET.reciter,4);
  assert.equal(elements.splitFallbackReciter.hidden,true);
  assert.deepEqual({...c.reopened},{ay:160,continuing:true});
});

test('reader Play exposes reciter chooser for a guarded chapter instead of doing nothing',()=>{
  let opened=0;
  const messages=[];
  const playButton={};
  const c=vm.createContext({
    SET:{reciter:3},curS:3,AD_:{ay:{}},playing:false,
    audioTimingUnverified:(reciter,surah)=>reciter===3&&surah===3,
    toast:message=>messages.push(message),openReciterSheet:()=>opened++,
    $:()=>playButton,
  });
  const start=html.indexOf("$('playBtn').onclick=()=>{");
  const end=html.indexOf('/* SEÇİMİ ÇAL:',start);
  assert.ok(start>=0&&end>start);
  vm.runInContext(html.slice(start,end),c);
  c.$('playBtn').onclick();
  assert.equal(opened,1);
  assert.match(messages[0],/başka bir hoca seç/);
});

test('guarded word selection keeps its range and explains the reciter choice',async()=>{
  for(const surah of [3,4,5,28,29]){
    const messages=[];
    let opened=0;
    const c=vm.createContext({
      selA:12,selB:14,SET:{reciter:3},curS:surah,
      audioTimingUnverified:(reciter,sid)=>reciter===3&&[3,4,5,28,29].includes(sid),
      toast:message=>messages.push(message),openReciterSheet:()=>opened++,
      getAudio(){throw Error('Guarded selection must not request chapter audio');},
    });
    vm.runInContext(extract('playSelection'),c);
    await c.playSelection();
    assert.equal(opened,1);
    assert.deepEqual([c.selA,c.selB],[12,14]);
    assert.match(messages[0],/sınırları güvenilir değil/);
    assert.match(messages[0],/Seçimin korundu/);
    assert.doesNotMatch(messages[0],/Bağlantı/);
  }
});

test('guarded repeat range survives a reciter switch and waits for a new start',()=>{
  const elements=new Proxy({fromInp:{value:'143'},toInp:{value:'160'}},
    {get(target,key){return target[key]??(target[key]={value:'',style:{}});}});
  const messages=[];
  let opened=0,closed=0,played=0;
  const c=vm.createContext({
    SET:{reciter:3},curS:3,gearCtx:'ayah',splitParts:[],curAy:1,visAy:1,
    SURAHS:[{n:7},{n:286},{n:200}],guardedRangeDraft:null,
    $:id=>elements[id],saveSet(){},syncCumu(){},syncCumu2(){},
    clampAy:value=>Math.max(1,Math.min(200,value||1)),
    audioTimingUnverified:(reciter,sid)=>reciter===3&&sid===3,
    toast:message=>messages.push(message),closeSheets:()=>closed++,openReciterSheet:()=>opened++,
    buildLadder(){throw Error('Guarded range must not use chapter timing');},
    runPlan:()=>played++,syncTestBtn(){},
  });
  vm.runInContext(extract('applyRangeProgram'),c);
  assert.equal(c.applyRangeProgram(),false);
  assert.equal(opened,0,'editing a range must leave the inputs available');
  assert.equal(closed,0);
  assert.equal(messages.length,0,'plus/minus edits must not show repeated warnings');
  assert.equal(c.applyRangeProgram(true),false);
  assert.equal(opened,1);
  assert.equal(closed,1);
  assert.equal(played,0);
  assert.deepEqual({...c.guardedRangeDraft},{sid:3,from:143,to:160});
  assert.match(messages[0],/aralık korundu/);
  assert.match(messages[0],/yeniden başlatabilirsin/);

  c.SET.reciter=4;
  vm.runInContext(extract('fillGearSheet'),c);
  c.fillGearSheet();
  assert.equal(elements.fromInp.value,143);
  assert.equal(elements.toInp.value,160);
  assert.equal(played,0,'switching the reciter must not autoplay');
});

test('limited split timing offers reciter choice without silently changing reciter',()=>{
  const elements={
    splitFallbackReciter:{hidden:true,dataset:{},textContent:''},
    splitIntro:{textContent:''},
    splitPlayStatus:{textContent:'',classList:{add(){}}},
  };
  let opened=0;
  const c=vm.createContext({
    SET:{reciter:5},curS:6,splitAy:139,splitParts:[{unsafeTiming:true}],
    $:id=>elements[id],openReciterSheet:()=>opened++,
    RECITERS:[{id:4,n:'Ebû Bekir eş-Şâtırî'}],
    selectReciter(){throw Error('Generic choice must not silently switch reciters');},
  });
  vm.runInContext(extract('offerSplitReciterChoice')+extract('showUnsafeSplitTiming'),c);
  const start=html.indexOf("$('splitFallbackReciter').onclick=()=>{");
  const end=html.indexOf('function openReciterSheet()',start);
  assert.ok(start>=0&&end>start);
  vm.runInContext(html.slice(start,end),c);
  c.showUnsafeSplitTiming();
  assert.equal(elements.splitFallbackReciter.hidden,false);
  assert.equal(elements.splitFallbackReciter.textContent,'Başka hoca seç');
  elements.splitFallbackReciter.onclick();
  assert.equal(opened,1);
  assert.equal(c.SET.reciter,5);
});
