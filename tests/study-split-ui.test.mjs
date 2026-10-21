import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../assets/study-split.js', import.meta.url), 'utf8');
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
function partialStudyHarness(){
  const ids=new Map(),get=id=>{if(!ids.has(id))ids.set(id,element());return ids.get(id);};
  const words=Array.from({length:5},(_,i)=>({txt:'word'+(i+1),ay:1,pos:i+1,gi:i}));
  const context={window:{},document:{getElementById:get,createElement:element,
    createDocumentFragment:()=>element('fragment'),elementFromPoint:()=>null},
    MutationObserver:class{observe(){}},requestAnimationFrame:()=>1,cancelAnimationFrame(){},
    studyRange:{sid:1,from:1,to:1,wordRange:{fromAy:1,fromWord:2,toAy:1,toWord:4}},
    curS:1,ayGi:{1:[0,4]},wordArr:words,SET:{reciter:223},AD_:null,SURAHS:[{tr:'Test',n:1}],stopPlan(){}};
  for(const id of ['studySplitPanel','studySplitWizard','studySplitResults'])get(id).hidden=true;
  vm.createContext(context);
  for(const name of ['validStudyWordRange','studyWordBounds','buildStudySplitParts','studyValidateManualCut']){
    const start=html.indexOf('function '+name+'('),end=html.indexOf('\n}',start)+2;
    assert.ok(start>=0,name);vm.runInContext(html.slice(start,end),context);
  }
  vm.runInContext(source,context);
  const open=()=>{context.window.elifaOpenStudySplit();get('studySplitVerseList').children[0].fire('click');};
  return {context,get,open,words};
}

function element(tag = 'div') {
  const listeners = new Map();
  const classes = new Set();
  return {
    tag, children: [], dataset: {}, hidden: false, disabled: false, style: {},
    classList: {
      add: name => classes.add(name),
      contains: name => classes.has(name),
      toggle(name, enabled) { if (enabled) classes.add(name); else classes.delete(name); }
    },
    addEventListener(name, callback) { listeners.set(name, callback); },
    fire(name, event = {}) { return listeners.get(name)?.({ target: this, pointerId: 1,
      clientX: 10, clientY: 10, preventDefault() {}, ...event }); },
    setAttribute(name, value) { this[name] = value; },
    append(...items) { this.children.push(...items); },
    appendChild(item) { this.children.push(...(item.tag === 'fragment' ? item.children : [item])); },
    replaceChildren(...items) { this.children = [...items]; },
    querySelectorAll(selector) { return selector.startsWith('button') ? this.children.filter(child => child.tag === 'button') : []; },
    querySelector(selector) {
      if (selector === '.studySplitEndpoint') return this.children.find(child => child.classList.contains('studySplitEndpoint'));
      if (selector === 'button:not(:disabled)') return this.children.find(child => child.tag === 'button' && !child.disabled);
      return null;
    },
    closest(selector) { return selector === 'button[data-gi]' && this.tag === 'button' ? this : null; },
    contains(other) { return this.children.includes(other); },
    getBoundingClientRect() { return { top: 0, bottom: 500, left: 0, right: 400 }; },
    setPointerCapture() {}, releasePointerCapture() {}, focus() {}
  };
}

test('Study Desk starts with a marked passage, allows drag refinement, undo, and splits only on confirmation', () => {
  const ids = new Map();
  const get = id => { if (!ids.has(id)) ids.set(id, element()); return ids.get(id); };
  const words = [
    { txt: 'بِسْمِ', ay: 1, pos: 1, gi: 0 },
    { txt: 'اللَّهِ', ay: 1, pos: 2, gi: 1 },
    { txt: 'الرَّحْمَٰنِ', ay: 1, pos: 3, gi: 2 }
  ];
  let hit = null, builds = 0;
  const context = {
    window: {}, document: {
      getElementById: get, createElement: element,
      createDocumentFragment: () => element('fragment'),
      elementFromPoint: () => hit
    },
    MutationObserver: class { observe() {} },
    requestAnimationFrame: () => 1, cancelAnimationFrame() {},
    studyRange: { sid: 1, from: 1, to: 1 }, curS: 1,
    ayGi: { 1: [0, 2] }, wordArr: words,
    SET: { reciter: 'test' }, AD_: null, SURAHS: [{ tr: 'Fâtiha', n: 7 }],
    stopPlan() {}, studyValidateManualCut: () => ({ ok: true }),
    buildStudySplitParts(from, to, mode) {
      builds++;
      assert.equal(mode, 'manual');
      return { parts: [{ ay: 1, words, pendingAudio: true }] };
    }
  };
  get('studySplitPanel').hidden = true;
  get('studySplitWizard').hidden = true;
  get('studySplitResults').hidden = true;
  vm.runInNewContext(source, context);
  context.window.elifaOpenStudySplit();
  assert.equal(get('studySplitVersePicker').hidden,false);
  assert.equal(get('studySplitWizard').hidden,true);
  get('studySplitVerseList').children[0].fire('click');

  const row = get('studySplitWords');
  assert.equal(get('studySplitWizard').hidden, false);
  assert.equal(get('studySplitResults').hidden, true);
  assert.equal(builds, 0, 'opening must not create an automatic word-by-word plan');
  assert.equal(row.children.filter(button => button.classList.contains('studySplitIncluded')).length, 0);
  assert.equal(get('studySplitConfirm').disabled,true,'Böl waits for an explicit marking');

  row.fire('pointerdown', { target: row.children[0] });
  hit = row.children[1];
  row.fire('pointermove', { target: row.children[0] });
  assert.equal(row.children[1].classList.contains('studySplitEndpoint'), true);
  assert.equal(row.children[2].classList.contains('studySplitIncluded'), false);
  get('studySplitConfirm').fire('click');
  assert.equal(builds, 0);
  assert.equal(row.children[0].disabled, true);
  assert.equal(row.children[0].classList.contains('studySplitUsed'), true);
  assert.equal(row.children[2].classList.contains('studySplitIncluded'), false);

  context.window.elifaCloseStudySplit();
  context.window.elifaOpenStudySplit();
  get('studySplitVerseList').children[0].fire('click');
  assert.equal(get('studySplitWizard').hidden, false, 'an unfinished marking session should resume');
  assert.equal(row.children[0].classList.contains('studySplitUsed'), true);

  get('studySplitUndo').fire('click');
  assert.equal(row.children[0].disabled, false);
  assert.equal(row.children.filter(button => button.classList.contains('studySplitUsed')).length, 0);
  get('studySplitConfirm').fire('click');
  row.children[2].fire('click');
  get('studySplitConfirm').fire('click');
  assert.equal(builds, 1);
  assert.equal(get('studySplitResults').hidden, false);

  context.buildStudySplitParts = () => ({ parts: [], error: '1. âyetin kelime zamanları eşleşmiyor.' });
  get('studySplitRetry').fire('click');
  assert.equal(get('studySplitResults').hidden, false, 'failed timing must leave editing available');
  assert.equal(get('studySplitRevise').hidden, false);
  get('studySplitRevise').fire('click');
  assert.equal(get('studySplitWizard').hidden, false);
  assert.equal(row.children[0].classList.contains('studySplitUsed'), true);
});

test('Study Desk asks for a verse before splitting and builds only three chosen parts', () => {
  const ids=new Map(),get=id=>{if(!ids.has(id))ids.set(id,element());return ids.get(id);};
  const words=[
    {txt:'أَوَّلٌ',ay:1,pos:1},{txt:'ثَانٍ',ay:1,pos:2},{txt:'ثَالِثٌ',ay:1,pos:3},
    {txt:'رَابِعٌ',ay:2,pos:1},{txt:'خَامِسٌ',ay:2,pos:2},{txt:'سَادِسٌ',ay:2,pos:3}
  ];
  let built=null,setupCalls=0,playCalls=0,settingsOpened=0;const transitions=[],modes=[];
  const context={window:{T:{},elifaSetPracticeMode(mode){modes.push(mode);}},document:{getElementById:get,createElement:element,
    createDocumentFragment:()=>element('fragment'),elementFromPoint:()=>null},
    MutationObserver:class{observe(){}},requestAnimationFrame:()=>1,cancelAnimationFrame(){},
    studyRange:{sid:1,from:1,to:2},curS:1,ayGi:{1:[0,2],2:[3,5]},wordArr:words,
    SET:{reciter:'test',rep:5,repOn:false,cumu:false},AD_:null,SURAHS:[{tr:'Fâtiha',n:7}],stopPlan(){},
    saveSet(){},syncRep(){},syncRep2(){},syncCumu(){},syncCumu2(){},
    playActiveStudySplit(){playCalls++;return true;},
    queuePracticeModeChange(value){transitions.push(value);},
    fillGearSheet(){assert.equal(context.gearCtx,'studyParts');},
    openSheet(id){assert.equal(id,'gearSheet');settingsOpened++;},
    openStudySetup(fromSelection,fromReader){assert.equal(fromSelection,false);assert.equal(fromReader,true);setupCalls++;},
    studyValidateManualCut:()=>({ok:true}),
    buildStudySplitParts(from,to,mode,cuts){
      built={from,to,mode,cuts};
      return {parts:[0,1,2].map(i=>({ay:2,words:[words[i+3]],pendingAudio:true}))};
    }};
  get('studySplitPanel').hidden=true;get('studySplitWizard').hidden=true;
  get('studySplitResults').hidden=true;get('studySplitVersePicker').hidden=true;
  vm.runInNewContext(source,context);context.window.elifaOpenStudySplit();
  assert.ok(Object.values(context.window.T).every(labels=>labels.length===21));
  assert.equal(get('studySplitWizard').hidden,true);
  assert.equal(get('studySplitVerseList').children.length,2);
  assert.equal(context.window.elifaStudySplitSelection(),null);
  get('studySplitVerseList').children[1].fire('click');
  assert.equal(get('studySplitWords').children.length,3);
  assert.equal(get('studySplitWords').children[0].textContent,words[3].txt);
  for(let part=0;part<3;part++){
    get('studySplitWords').children[part].fire('click');
    get('studySplitConfirm').fire('click');
  }
  assert.deepEqual([built.from,built.to,built.mode],[2,2,'manual']);
  assert.equal(get('studySplitResults').hidden,false);
  assert.equal(context.window.elifaStudySplitSelection().parts.length,3);
  assert.match(get('studySplitLiveStatus').textContent,/1\/3.*tekrar kapalı.*1\+2 kapalı/);
  assert.equal(context.window.elifaStudySplitSetIndex(2),true);
  assert.equal(context.window.elifaStudySplitSelection().selectedIndex,2);
  get('studySplitRepeat').fire('click');
  assert.equal(context.SET.repOn,true);
  assert.equal(get('studySplitRepeat')['aria-pressed'],'true');
  get('studySplitCombine').fire('click');
  assert.equal(context.SET.cumu,true);
  assert.equal(get('studySplitCombine')['aria-pressed'],'true');
  assert.equal(playCalls,0,'mode/repeat controls do not start playback or rewind the parts');
  assert.deepEqual(transitions,['cumulative']);
  assert.deepEqual(modes,['cumulative'],'saved-parts controls update the reader and settings mode');
  get('studySplitSettings').fire('click');
  assert.equal(settingsOpened,1,'part-specific hifz settings remain accessible while split panel is open');
  assert.match(get('studySplitLiveStatus').textContent,/3\/3.*5× tekrar.*1\+2 açık/);
  get('studySplitCombine').fire('click');
  assert.equal(context.SET.cumu,false);
  assert.deepEqual(transitions,['cumulative','verse']);
  assert.deepEqual(modes,['cumulative','verse']);
  assert.equal(playCalls,0,'turning combine off preserves the paused selected part');
  context.remainingStepRepeats=()=>4;
  context.splitRepeatKey=()=>'combineRep';
  context.window.elifaStudySplitRefreshStatus();
  assert.equal(get('studySplitRepeat').textContent,'4× tekrar','the existing repeat button shows the live remaining count');
  assert.match(get('studySplitRepeat')['aria-label'],/1\+2.*4× tekrar/);
  context.remainingStepRepeats=()=>0;
  context.window.elifaStudySplitRefreshStatus();
  assert.equal(get('studySplitRepeat').textContent,'0× tekrar');
  assert.equal(context.SET.rep,5,'live countdown never changes the configured value');
  assert.equal(context.window.elifaStudySplitSetIndex(3),false);
  get('studySplitChangeVerse').fire('click');
  assert.equal(get('studySplitVersePicker').hidden,false);
  assert.equal(context.window.elifaStudySplitSelection(),null);
  get('studySplitVerseList').children[1].fire('click');
  assert.equal(get('studySplitResults').hidden,false);
  get('studySplitSave').fire('click');
  assert.equal(setupCalls,1);
  assert.equal(get('studySplitPanel').hidden,true);
  assert.equal(context.window.elifaStudySplitPrefs({sid:1,from:1,to:2}).selectedAy,2);
});

test('partial-word picker and manual wizard show only the selected text, retain canonical cuts and restore a final before verse end',()=>{
  const {context:c,get,open}=partialStudyHarness();
  c.window.elifaOpenStudySplit();
  assert.equal(get('studySplitVerseList').children[0].children[1].textContent,'word2 word3 word4');
  get('studySplitVerseList').children[0].fire('click');
  const row=get('studySplitWords');
  assert.deepEqual(row.children.map(x=>x.textContent),['word2','word3','word4']);
  assert.deepEqual(row.children.map(x=>x.dataset.gi),['1','2','3']);
  row.children[0].fire('click');get('studySplitConfirm').fire('click');
  assert.equal(row.children[0].classList.contains('studySplitUsed'),true);
  row.children[2].fire('click');get('studySplitConfirm').fire('click');
  let selection=c.window.elifaStudySplitSelection();
  assert.deepEqual(Array.from(selection.parts,p=>[p.fromPos,p.toPos]),[[2,2],[3,4]]);
  assert.deepEqual(Array.from(selection.cutsByAy[1]),[2],'selection end is implicit, even when the verse has later words');
  c.window.elifaCloseStudySplit();open();
  selection=c.window.elifaStudySplitSelection();assert.equal(selection.parts.length,2);
  assert.deepEqual(Array.from(selection.parts.flatMap(p=>Array.from(p.words,w=>w.pos))),[2,3,4]);
  get('studySplitRevise').fire('click');
  assert.equal(get('studySplitWizard').hidden,false);
  assert.equal(row.children.length,3);assert.equal(row.children[0].disabled,true);
  assert.equal(row.children[2].classList.contains('studySplitEndpoint'),true);
  get('studySplitUndo').fire('click');
  assert.equal(row.children[0].disabled,false);
});

test('partial split drafts cannot migrate to another word selection or restore cuts outside the selected bounds',()=>{
  const {context:c,get,open}=partialStudyHarness(),range=c.studyRange;
  c.window.elifaRememberStudySplitPrefs(range,{mode:'manual',selectedAy:1,cutsByAy:{1:[2]},cursorGi:2,selectedGi:null});
  open();assert.equal(get('studySplitWords').children[0].classList.contains('studySplitUsed'),true);
  c.window.elifaCloseStudySplit();
  const other={...range,wordRange:{...range.wordRange,fromWord:3}};
  assert.equal(c.window.elifaStudySplitPrefs(other),null,'same verses with different words are different studies');
  c.window.elifaRememberStudySplitPrefs(range,{mode:'manual',selectedAy:1,cutsByAy:{1:[2,4]},cursorGi:4,selectedGi:null});
  open();assert.equal(get('studySplitResults').hidden,true);
  assert.ok(get('studySplitWords').children.every(word=>!word.classList.contains('studySplitUsed')),'invalid final cut restarts bounded marking instead of restoring neighboring words');
  get('studySplitWords').children[2].fire('click');get('studySplitConfirm').fire('click');
  assert.equal(c.window.elifaStudySplitSelection().parts.length,1);
  range.wordRange.fromWord=3;
  assert.equal(c.window.elifaStudySplitSelection(),null,'in-place word-range change invalidates active split controls');
});
