import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
function source(name){
  const start=html.search(new RegExp(`function ${name}\\(`));
  assert.ok(start>=0,`${name} exists`);
  return html.slice(start,html.indexOf('\n}',start)+2);
}

test('starting a chosen ayah range enables the requested repeats, while an invalid range stays idle',()=>{
  const inputs={fromInp:{value:'26'},toInp:{value:'28'},rscroll:{scrollTop:0}};
  const plans=[],messages=[];
  const c=vm.createContext({
    SET:{rep:6,repOn:false,reciter:223,cumu:false},curS:18,gearCtx:'ayah',
    splitParts:[],guardedRangeDraft:null,rangeSelectionDraft:null,normalChapterAudio:null,
    AD_:{ay:{26:[100,200],27:[200,300],28:[300,400]},buffer:{}},
    $:id=>inputs[id],saveSet(){},commitInputs(){},syncRep(){},syncRep2(){},
    syncCumu(){},syncCumu2(){},audioTimingUnverified:()=>false,
    clampAy:v=>Math.max(1,Math.min(110,v||1)),
    normalVerseStep:(_chapter,first,last,extra)=>({first,last,...extra}),
    normalVersePlanReady:()=>true,runPlan:p=>plans.push(p),toast:m=>messages.push(m)
  });
  for(const name of ['buildLadder','rememberRangeSelection','applyRangeProgram','stepReps'])vm.runInContext(source(name),c);
  assert.equal(c.applyRangeProgram(true),true);
  assert.equal(c.SET.repOn,true);
  assert.deepEqual({...c.rangeSelectionDraft},{sid:18,from:26,to:28});
  assert.deepEqual(Array.from(plans[0],step=>step.first),[26,27,28]);
  assert.ok(plans[0].every(step=>c.stepReps(step)===6));

  c.SET.repOn=false;delete c.AD_.ay[27];
  assert.equal(c.applyRangeProgram(true),false);
  assert.equal(c.SET.repOn,false,'missing audio must not switch repeat on');
  assert.equal(plans.length,1,'no partial range may be played');
  assert.match(messages.at(-1),/ses sınırı eksik/);

  c.SET.repOn=false;inputs.fromInp.value='28';inputs.toInp.value='26';
  assert.equal(c.applyRangeProgram(true),false);
  assert.equal(c.SET.repOn,false);
  assert.equal(plans.length,1);
  assert.match(messages.at(-1),/Bitiş âyeti/);
});

test('range inputs retain a chosen interval when settings reopen in the same surah',()=>{
  const ids=['repInp','waitInp','spdInp','startPadInp','endPadInp','cumuChk','repEcho','repEcho2',
    'progTitle','fromLbl','toLbl','fromInp','toInp','testModeBtn'];
  const nodes=Object.fromEntries(ids.map(id=>[id,{value:'',style:{},textContent:''}]));
  const c=vm.createContext({
    SET:{rep:6,wait:0,speed:1.25,startPad:0,endPad:0,cumu:false},
    gearCtx:'ayah',curS:18,curAy:30,visAy:30,splitParts:[],guardedRangeDraft:null,
    rangeSelectionDraft:{sid:18,from:26,to:28},SURAHS:Array.from({length:18},()=>({n:110})),
    $:id=>nodes[id],syncTestBtn(){}
  });
  vm.runInContext(source('fillGearSheet'),c);
  c.fillGearSheet();
  assert.equal(nodes.fromInp.value,26);
  assert.equal(nodes.toInp.value,28);

  c.guardedRangeDraft={sid:18,from:1,to:3};
  nodes.fromInp.value='24';nodes.toInp.value='29';
  vm.runInContext(source('rememberRangeSelection'),c);
  c.rememberRangeSelection();
  assert.equal(c.guardedRangeDraft,null,'manual edits replace a previously guarded draft');
  c.curAy=50;c.fillGearSheet();
  assert.equal(nodes.fromInp.value,24);
  assert.equal(nodes.toInp.value,29);
  assert.deepEqual({...c.rangeSelectionDraft},{sid:18,from:24,to:29});
  c.curS=17;c.fillGearSheet();
  assert.equal(nodes.fromInp.value,50,'another surah does not reuse the old interval');
});

test('long-press selection scrolls past the screen edge and waits for explicit Play; handles adjust both ends',()=>{
  const listeners={},frames=new Map(),handles={start:{style:{}},end:{style:{}}};
  let nextFrame=0,timer,plays=0,applied=0;
  const root={scrollTop:0,classList:{add(){},remove(){}},
    getBoundingClientRect:()=>({left:0,right:400,top:0,bottom:200,height:200}),
    contains:()=>true};
  const words=Array.from({length:200},(_,gi)=>({
    dataset:{gi:String(gi)},classList:{contains:key=>key==='w'},
    closest:key=>key.includes('.w')?words[gi]:null,
    getBoundingClientRect:()=>({left:20,right:180,top:gi*30-root.scrollTop,bottom:gi*30+28-root.scrollTop})
  }));
  const loupe={hidden:true,style:{},textContent:''};
  const c=vm.createContext({
    $:id=>id==='rscroll'?root:null,
    document:{getElementById:()=>loupe,elementFromPoint:(_x,y)=>words[Math.max(0,Math.min(199,Math.floor((Math.max(0,Math.min(199,y))+root.scrollTop)/30)))]},
    window:{innerWidth:400,innerHeight:800},navigator:{vibrate(){}},
    wordArr:words.map((el,gi)=>({el,txt:`word ${gi}`})),
    ensureSelectionHandles:()=>handles,updateSelectionHandles(){},
    selA:null,selB:null,selMode:'ayah',selectionPickMode:'note',bmPlacing:false,testing:false,
    renderSel(){},stopPlan(){},playSelection(){plays++},applyPickedSelection(){applied++},
    setTimeout:fn=>{timer=fn;return 1},clearTimeout:()=>{timer=null},
    requestAnimationFrame:fn=>{const id=++nextFrame;frames.set(id,fn);return id},
    cancelAnimationFrame:id=>frames.delete(id)
  });
  vm.runInContext(source('wirePointer'),c);
  c.wirePointer({addEventListener:(type,fn)=>{listeners[type]=fn},setPointerCapture(){}});
  const target=words[0];
  listeners.pointerdown({target,clientX:100,clientY:15,pointerId:1});
  timer();
  listeners.pointermove({clientX:100,clientY:196});
  const before=c.selB;
  for(let i=0;i<12;i++){
    const [id,frame]=frames.entries().next().value||[];
    if(!frame)break;frames.delete(id);frame();
  }
  assert.ok(root.scrollTop>0,'the reader scrolls while the finger remains at the edge');
  assert.ok(c.selB>before,'the marked range extends into newly revealed words');
  listeners.pointerup({clientY:196,pointerId:1});
  assert.equal(plays,0,'releasing a selection must not start audio');
  assert.equal(applied,0,'a note/hard/hifz action must wait while handles can still refine the range');
  assert.equal(c.selectionPickMode,'note');

  handles.start.onpointerdown({clientX:100,clientY:15,pointerId:2,preventDefault(){},stopPropagation(){}});
  handles.start.onpointermove({clientX:100,clientY:80});
  assert.ok(c.selA>0,'the start handle moves the first selected word');
  handles.start.onpointerup();
  const endBefore=c.selB;
  handles.end.onpointerdown({clientX:100,clientY:120,pointerId:3,preventDefault(){},stopPropagation(){}});
  handles.end.onpointermove({clientX:100,clientY:196});
  for(let i=0;i<8;i++){
    const [id,frame]=frames.entries().next().value||[];
    if(!frame)break;frames.delete(id);frame();
  }
  assert.ok(c.selB>endBefore,'the end handle also extends the range while scrolling');
  handles.end.onpointerup();
});

function gestureHarness(){
  const listeners={};let timer=null,plays=0,applied=0;
  const root={scrollTop:0,classList:{add(){},remove(){}},contains:()=>true,
    getBoundingClientRect:()=>({left:0,right:400,top:0,bottom:300,height:300})};
  const words=Array.from({length:12},(_,gi)=>({dataset:{gi:String(gi)},
    classList:{contains:key=>key==='w'},closest:key=>key.includes('.w')?words[gi]:null,
    getBoundingClientRect:()=>({left:20,right:150,top:gi*30,bottom:gi*30+28})}));
  const loupe={hidden:true,style:{},textContent:''};
  const c=vm.createContext({
    $:id=>id==='rscroll'?root:null,
    document:{getElementById:()=>loupe,elementFromPoint:(_x,y)=>words[Math.max(0,Math.min(11,Math.floor(y/30)))]},
    window:{innerWidth:400,innerHeight:800},navigator:{vibrate(){}},
    wordArr:words.map((el,gi)=>({el,txt:`word ${gi}`,ay:1})),
    ensureSelectionHandles:()=>({start:{style:{}},end:{style:{}}}),updateSelectionHandles(){},
    selA:null,selB:null,selMode:'ayah',selectionPickMode:'note',bmPlacing:false,testing:false,
    renderSel(){},stopPlan(){},applyPickedSelection(){applied++},playAyahProgram(){plays++},
    setTimeout:fn=>{timer=fn;return 1},clearTimeout:()=>{timer=null},
    requestAnimationFrame:()=>1,cancelAnimationFrame(){}
  });
  vm.runInContext(source('wirePointer'),c);
  c.wirePointer({addEventListener:(type,fn)=>{listeners[type]=fn},setPointerCapture(){}});
  return {c,listeners,words,get timer(){return timer},get plays(){return plays},get applied(){return applied}};
}

test('a cancelled Android pointer still finishes its long-press selection from touch events',()=>{
  const h=gestureHarness();
  h.listeners.pointerdown({target:h.words[0],clientX:80,clientY:12,pointerId:1,pointerType:'touch'});
  h.timer();
  h.listeners.pointercancel({pointerId:1,pointerType:'touch'});
  let prevented=false;
  h.listeners.touchmove({touches:[{clientX:80,clientY:75}],cancelable:true,preventDefault(){prevented=true;}});
  h.listeners.touchend({touches:[]});
  assert.equal(prevented,true,'native scrolling must yield to the active selection');
  assert.equal(h.c.selB,2);
  assert.equal(h.applied,0,'the selected action still needs explicit confirmation');
  assert.equal(h.plays,0);
});

test('both fingers of a pinch are ignored regardless of release order',()=>{
  for(const firstLift of [1,2]){
    const h=gestureHarness();
    h.listeners.pointerdown({target:h.words[0],clientX:80,clientY:12,pointerId:1,pointerType:'touch'});
    h.listeners.pointerdown({target:h.words[1],clientX:80,clientY:42,pointerId:2,pointerType:'touch'});
    h.listeners.pointerup({pointerId:firstLift,clientY:12});
    h.listeners.pointerup({pointerId:firstLift===1?2:1,clientY:12});
    assert.equal(h.plays,0,`pinch release order ${firstLift} must not play`);
    assert.equal(h.applied,0);
    assert.equal(h.c.selA,null);
  }
});

test('a refined range keeps original word colours and offers explicit action confirmation',()=>{
  const selected=new Set();
  const words=Array.from({length:3},(_,i)=>({
    el:{style:{background:`original-${i}`},classList:{add:()=>selected.add(i),remove:()=>selected.delete(i)}},
    ay:1,txt:`word-${i}`
  }));
  const info={innerHTML:''},studyAction={hidden:true};
  const buttons={selNote:{querySelector:()=>({textContent:'Not'})},selStudy:studyAction};
  const c=vm.createContext({
    wordArr:words,selA:0,selB:1,prevSel:[],prevSelBg:[],selectionToolsKey:'',selectionPickMode:'note',
    SET:{selMulti:false},MULTI:[],window:{elifaT:()=> 'âyet',tr:()=> 'Dinle'},tr:()=> 'Dinle',
    $:id=>id==='selInfo'?info:buttons[id],elifaCurLang:()=> 'tr',
    selRange:()=>c.selA==null?null:[Math.min(c.selA,c.selB),Math.max(c.selA,c.selB)],
    syncRep(){},setSelectionToolsOpen(){},updateSelectionHandles(){}
  });
  vm.runInContext('let prevSelMulti=null;'+source('renderSel'),c);
  c.renderSel();
  assert.match(info.innerHTML,/id="selConfirm"/);
  assert.equal(studyAction.hidden,false,'a passage can be moved to the study desk');
  assert.deepEqual([...selected],[0,1]);
  c.selA=1;c.selB=2;c.renderSel();
  assert.equal(words[0].el.style.background,'original-0');
  assert.deepEqual([...selected],[1,2]);
  c.selA=null;c.selB=null;c.renderSel();
  assert.equal(studyAction.hidden,true,'study action disappears when the range is cleared');
});
