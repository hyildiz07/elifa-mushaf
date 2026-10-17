import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../assets/study-split.js', import.meta.url), 'utf8');

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
  let built=null,setupCalls=0,playCalls=0,settingsOpened=0;
  const context={window:{T:{}},document:{getElementById:get,createElement:element,
    createDocumentFragment:()=>element('fragment'),elementFromPoint:()=>null},
    MutationObserver:class{observe(){}},requestAnimationFrame:()=>1,cancelAnimationFrame(){},
    studyRange:{sid:1,from:1,to:2},curS:1,ayGi:{1:[0,2],2:[3,5]},wordArr:words,
    SET:{reciter:'test',rep:5,repOn:false,cumu:false},AD_:null,SURAHS:[{tr:'Fâtiha',n:7}],stopPlan(){},
    saveSet(){},syncRep(){},syncRep2(){},syncCumu(){},syncCumu2(){},
    playActiveStudySplit(){playCalls++;return true;},
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
  assert.equal(playCalls,2,'in-panel controls start the selected split method');
  get('studySplitSettings').fire('click');
  assert.equal(settingsOpened,1,'part-specific hifz settings remain accessible while split panel is open');
  assert.match(get('studySplitLiveStatus').textContent,/3\/3.*5× tekrar.*1\+2 açık/);
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
