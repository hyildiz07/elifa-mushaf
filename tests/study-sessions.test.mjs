import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

class Element {
  constructor(){this.children=[];this.handlers={};this.value='';this.hidden=false;this.textContent='';}
  append(...children){for(const child of children){child.parent=this;this.children.push(child);}}
  appendChild(child){this.append(child);}
  replaceChildren(...children){for(const child of this.children)child.parent=null;this.children=[];this.append(...children);}
  remove(){if(!this.parent)return;this.parent.children.splice(this.parent.children.indexOf(this),1);this.parent=null;}
  querySelector(selector){return selector==='button'?this.children.find(child=>child.type==='button')||
    this.children.map(child=>child.querySelector(selector)).find(Boolean):null;}
  addEventListener(type,handler){this.handlers[type]=handler;}
  setAttribute(name,value){this[name]=value;}
  click(){this.handlers.click?.();}
  focus(){Element.focused=this;}
}
test('renaming B after opening A keeps B cuts and its saved settings for the same verse range',()=>{
 const ids=new Map(),get=id=>{if(!ids.has(id))ids.set(id,new Element());return ids.get(id);};
 const base={sid:18,from:1,to:5,createdAt:'2026-10-17T00:00:00Z',updatedAt:'2026-10-17T00:00:00Z',splitMode:'manual'};
 const a={...base,id:'12345678-1234-4234-8234-123456789abc',title:'A',manualCuts:{1:[2]},settings:{reciter:223,rep:3}};
 const b={...base,id:'abcdefab-abcd-4bcd-8bcd-abcdefabcdef',title:'B',manualCuts:{1:[4,7]},settings:{reciter:7,rep:5}};
 let items=[a,b],loaded=null;
 const window={T:{},tr:k=>k,addEventListener(){},elifaStudySplitPrefs:()=>({mode:'manual',cutsByAy:a.manualCuts}),
  elifaRememberStudySplitPrefs(){},elifaStudySettings:{load:item=>{loaded=item.settings;},capture:()=>loaded}};
 const c=vm.createContext({window,document:{getElementById:get,createElement:()=>new Element(),querySelectorAll:()=>[]},
  SURAHS:Array.from({length:114},()=>({tr:'Kehf'})),store:{get:()=>items,set:(_k,v)=>{items=JSON.parse(JSON.stringify(v));return true;}},
  validStudyRange:()=>true,readStudyDraft:()=>({sid:18,from:1,to:5}),updateStudySetup(){},toast(){}});
 vm.runInContext(fs.readFileSync('assets/study-sessions.js','utf8'),c);
 get('studySavedList').children[0].children[1].children[0].click();
 get('studySavedList').children[1].children[1].children[1].click();
 get('studySessionTitle').value='B renamed';get('studySessionSave').click();
 const result=items.find(x=>x.id===b.id);assert.equal(result.title,'B renamed');assert.deepEqual(result.manualCuts,{1:[4,7]});assert.deepEqual(result.settings,b.settings);
});
test('saved Study Desk ranges can be reopened, edited, and deleted with manual cuts',()=>{
  const ids=new Map(),get=id=>{if(!ids.has(id))ids.set(id,new Element());return ids.get(id);};
  const storage=new Map(),messages=[],opened=[];
  let range={sid:18,from:1,to:5},remembered=null;
  const window={T:{},tr:key=>key,addEventListener(){},
    elifaStudySplitPrefs:()=>({mode:'manual',cutsByAy:{1:[2]},selectedAy:1}),
    elifaRememberStudySplitPrefs:(entry,prefs)=>{remembered={entry,prefs};}};
  const context=vm.createContext({window,document:{getElementById:get,
    createElement:()=>new Element(),querySelectorAll:()=>[]},
    SURAHS:Array.from({length:114},(_,i)=>({tr:i===17?'Kehf':'S'+(i+1)})),
    store:{get:(key,fallback)=>storage.get(key)||fallback,set:(key,value)=>{storage.set(key,JSON.parse(JSON.stringify(value)));return true;}},
    validStudyRange:(sid,from,to)=>sid===18&&from>0&&to>=from&&to<=110,
    readStudyDraft:()=>range,updateStudySetup(){},toast:text=>messages.push(text),
    crypto:{randomUUID:()=> '12345678-1234-4234-8234-123456789abc'},
    Date,Number,Object,Array,JSON,Map,Set});
  get('studyOpen').addEventListener('click',()=>opened.push({...range}));
  vm.runInContext(fs.readFileSync(new URL('../assets/study-sessions.js',import.meta.url),'utf8'),context);
  assert.ok(Object.values(window.T).every(value=>value.length===21),'new session labels cover every supported language');
  window.elifaStudySessions.onOpen({fromReader:true});
  get('studySessionTitle').value='Kehf ezberi';get('studySessionSave').click();
  assert.equal(storage.get('studySessions').length,1);
  assert.deepEqual(storage.get('studySessions')[0].manualCuts,{1:[2]});
  assert.equal(storage.get('studySessions')[0].selectedAy,1);
  const row=get('studySavedList').children[0],actions=row.children[1];
  actions.children[0].click();assert.deepEqual(opened,[{sid:18,from:1,to:5}]);
  assert.deepEqual(JSON.parse(JSON.stringify(remembered.prefs)),{mode:'manual',cutsByAy:{1:[2]},selectedAy:1});
  window.elifaStudySessions.onOpen({fromReader:true});
  assert.equal(get('studySessionTitle').value,'Kehf ezberi');
  actions.children[1].click();
  get('studySessionTitle').value='Kehf tekrar';range={sid:18,from:1,to:7};get('studySessionSave').click();
  assert.equal(storage.get('studySessions').length,1);
  assert.equal(storage.get('studySessions')[0].title,'Kehf tekrar');
  assert.deepEqual([storage.get('studySessions')[0].from,storage.get('studySessions')[0].to],[1,7]);
  const validEntry=storage.get('studySessions')[0];
  const deleteButton=get('studySavedList').children[0].children[1].children[2];
  deleteButton.click();
  assert.equal(storage.get('studySessions').length,1,'first tap must not delete');
  let confirmation=get('studySavedList').children[0].children[2];
  assert.equal(confirmation.role,'group');
  assert.equal(Element.focused,confirmation.children[1].children[0],'focus starts on Cancel');
  confirmation.children[1].children[0].click();
  assert.equal(storage.get('studySessions').length,1,'Cancel keeps the study');
  assert.equal(Element.focused,deleteButton,'focus returns to the Delete trigger');
  deleteButton.click();confirmation=get('studySavedList').children[0].children[2];
  confirmation.handlers.keydown({key:'Escape',preventDefault(){}});
  assert.equal(storage.get('studySessions').length,1,'Escape keeps the study');
  deleteButton.click();confirmation=get('studySavedList').children[0].children[2];
  confirmation.children[1].children[1].click();
  assert.deepEqual(storage.get('studySessions'),[]);
  assert.equal(get('studySavedEmpty').hidden,false);
  assert.equal(Element.focused,get('studySavedHeading'),'focus returns to the saved list after deletion');
  storage.set('studySessions',[{...validEntry,id:'12345678-1234-1234-8234-123456789abc'}]);
  window.elifaStudySessions.render();
  assert.equal(get('studySavedList').children.length,0,'non-v4 identifiers are ignored locally');
  storage.set('studySessions',[{...validEntry,id:'12345678-1234-4234-1234-123456789abc'}]);
  window.elifaStudySessions.render();
  assert.equal(get('studySavedList').children.length,0,'non-RFC4122 variant identifiers are ignored locally');
  assert.ok(messages.length>=3);
});

function deskFixture(initial=[]){
 const clone=x=>JSON.parse(JSON.stringify(x)),ids=new Map(),get=id=>{if(!ids.has(id))ids.set(id,new Element());return ids.get(id);};
 let items=clone(initial),metadata={},prefs=null,settings={mode:'range',rep:1,reciter:223},sequence=0,writable=true;
 const messages=[],opened=[];
 for(const [id,value]of Object.entries({studySurah:18,studyFrom:1,studyTo:5}))get(id).value=value;
 const draft=()=>({sid:+get('studySurah').value,from:+get('studyFrom').value,to:+get('studyTo').value,...clone(metadata)});
 const window={T:{},tr:key=>key,addEventListener(){},
  elifaStudySplitPrefs:()=>clone(prefs),elifaCloseStudySplit(){},
  elifaRememberStudySplitPrefs:(_range,value)=>{prefs=clone(value);},
  elifaStudySelection:{load(item){metadata=item?{...(item.wordRange?{wordRange:clone(item.wordRange)}:{}),...(item.selectionTitle?{selectionTitle:item.selectionTitle}:{})}:{};},capture:()=>clone(metadata),clear(){metadata={};}},
  elifaStudySettings:{load:item=>{settings=clone(item.settings||{mode:'range',rep:1,reciter:223});},capture:()=>clone(settings),onSetup(){},validProgress:p=>Number.isInteger(p.ay)&&typeof p.completed==='boolean'}};
 const context=vm.createContext({window,document:{getElementById:get,createElement:()=>new Element(),querySelectorAll:()=>[]},
  SURAHS:Array.from({length:114},(_,i)=>({tr:i===17?'Kehf':'S'+(i+1)})),
  store:{get:()=>clone(items),set:(_key,value)=>{if(!writable)return false;items=clone(value);return true;}},
  validStudyRange:(sid,from,to)=>sid===18&&Number.isInteger(from)&&Number.isInteger(to)&&from>=1&&to>=from&&to<=110,
  readStudyDraft:draft,updateStudySetup(){},toast:message=>messages.push(message),
  crypto:{randomUUID:()=> (++sequence).toString(16).padStart(8,'0')+'-1234-4234-8234-123456789abc'}});
 get('studyOpen').addEventListener('click',()=>{window.elifaStudySessions.activateDraft();opened.push(draft());});
 vm.runInContext(fs.readFileSync('assets/study-sessions.js','utf8'),context);
 return {get,window,context,messages,opened,items:()=>clone(items),selection:()=>clone(metadata),prefs:()=>clone(prefs),settings:()=>clone(settings),
  configure(value){if('metadata'in value)metadata=clone(value.metadata);if('prefs'in value)prefs=clone(value.prefs);if('settings'in value)settings=clone(value.settings);if('writable'in value)writable=value.writable;if('items'in value)items=clone(value.items);},
  action(title,index){const row=get('studySavedList').children.find(r=>r.children[0].children[1].children[0].textContent===title);assert.ok(row,'saved row '+title+' exists');return row.children[1].children[index];}};
}

test('explicit New Study saves two independent records of the same verses and restores their own selections, cuts and settings',()=>{
 const f=deskFixture(),aSelection={wordRange:{fromAy:1,fromWord:2,toAy:5,toWord:3},selectionTitle:'A selection'},bSelection={wordRange:{fromAy:1,fromWord:4,toAy:5,toWord:9},selectionTitle:'B selection'};
 const aSettings={mode:'verse',rep:3,reciter:223},bSettings={mode:'cumulative',rep:5,reciter:7};
 f.configure({metadata:aSelection,prefs:{mode:'manual',cutsByAy:{1:[2,5]},selectedAy:1},settings:aSettings});
 f.window.elifaStudySessions.onOpen({fromReader:true});f.get('studySessionTitle').value='A';f.get('studySessionSave').click();
 const a=f.items()[0];assert.deepEqual(a.wordRange,aSelection.wordRange);assert.deepEqual(a.manualCuts,{1:[2,5]});
 f.get('studySessionNew').click();assert.equal(f.window.elifaStudySessions.active(),null);assert.equal(f.get('studySessionTitle').value,'');
 assert.deepEqual(f.selection(),{});assert.equal(f.prefs(),null);assert.equal(f.get('studySessionSave').textContent,'study_save');
 f.configure({metadata:bSelection,prefs:{mode:'manual',cutsByAy:{3:[4]},selectedAy:3},settings:bSettings});
 f.window.elifaStudySessions.onOpen({fromReader:true});f.get('studySessionTitle').value='B';f.get('studySessionSave').click();
 assert.equal(f.items().length,2);assert.notEqual(f.items()[0].id,f.items()[1].id);assert.deepEqual(f.items()[0],a,'creating B never updates A');
 for(const [name,selection,cuts,settings]of [['A',aSelection,{1:[2,5]},aSettings],['B',bSelection,{3:[4]},bSettings],['A',aSelection,{1:[2,5]},aSettings]]){
  f.action(name,0).click();assert.deepEqual(f.selection(),selection);assert.deepEqual(f.prefs().cutsByAy,cuts);assert.deepEqual(f.settings(),settings);assert.equal(f.window.elifaStudySessions.active().title,name);
 }
 f.action('B',1).click();f.get('studySessionTitle').value='B renamed';f.get('studySessionSave').click();
 assert.equal(f.items().length,2);assert.deepEqual(f.items().find(x=>x.id===a.id),a);
 const b=f.items().find(x=>x.title==='B renamed');assert.deepEqual(b.wordRange,bSelection.wordRange);assert.deepEqual(b.manualCuts,{3:[4]});assert.deepEqual(b.settings,bSettings);
});

test('selection import preserves the marked passage but normal New Study cannot borrow a previous range manual split',()=>{
 const f=deskFixture(),selected={wordRange:{fromAy:1,fromWord:2,toAy:5,toWord:6},selectionTitle:'Marked passage'};
 f.configure({metadata:selected,prefs:{mode:'manual',cutsByAy:{1:[8]}}});
 f.window.elifaStudySessions.onOpen({fromSelection:true});assert.deepEqual(f.selection(),selected);assert.equal(f.prefs(),null);
 f.get('studySessionTitle').value='Marked';f.get('studySessionSave').click();
 assert.deepEqual(f.items()[0].wordRange,selected.wordRange);assert.equal(f.items()[0].manualCuts,undefined);
 f.get('studySessionNew').click();f.get('studySessionTitle').value='Whole passage';f.get('studySessionSave').click();
 const whole=f.items().find(x=>x.title==='Whole passage');assert.equal(whole.wordRange,undefined);assert.equal(whole.selectionTitle,undefined);assert.equal(whole.manualCuts,undefined);
});

test('word ranges use valid inclusive verse and word positions, reject malformed data and preserve old records without selection metadata',()=>{
 const base={id:'12345678-1234-4234-8234-123456789abc',title:'Old',sid:18,from:1,to:5,createdAt:'2026-10-17T00:00:00Z',updatedAt:'2026-10-17T00:00:00Z'};
 const invalid=[{fromAy:0,fromWord:1,toAy:2,toWord:1},{fromAy:2,fromWord:1,toAy:6,toWord:1},{fromAy:3,fromWord:1,toAy:2,toWord:1},{fromAy:2,fromWord:4,toAy:2,toWord:3},{fromAy:2,fromWord:0,toAy:2,toWord:4},{fromAy:2,fromWord:1.5,toAy:2,toWord:4}];
 for(const wordRange of invalid){const f=deskFixture([{...base,wordRange}]);assert.equal(f.get('studySavedList').children.length,0);f.configure({metadata:{wordRange}});f.get('studySessionSave').click();assert.equal(f.items().length,1,'invalid draft never adds or overwrites persisted rows');assert.equal(f.messages.at(-1),'study_invalid');}
 const old=deskFixture([base]);old.action('Old',0).click();assert.deepEqual(old.selection(),{});assert.equal(old.prefs(),null);
 const long=deskFixture();long.configure({metadata:{selectionTitle:'x'.repeat(161)}});long.get('studySessionSave').click();assert.deepEqual(long.items(),[]);
});

test('failed storage and deleted edit targets cannot overwrite or fabricate another saved study',()=>{
 const f=deskFixture();f.get('studySessionTitle').value='First';f.get('studySessionSave').click();const first=f.items()[0];
 f.get('studySessionNew').click();f.configure({writable:false});f.get('studySessionTitle').value='Second';f.get('studySessionSave').click();assert.deepEqual(f.items(),[first]);assert.equal(f.window.elifaStudySessions.active(),null);
 f.configure({writable:true});f.get('studySessionSave').click();assert.equal(f.items().length,2);assert.deepEqual(f.items()[0],first);
 f.action('First',1).click();const second=f.items()[1];f.configure({items:[second]});
 f.get('studySessionTitle').value='Deleted elsewhere';f.get('studySessionSave').click();
 assert.deepEqual(f.items(),[second]);assert.equal(f.messages.at(-1),'study_save_failed');
});

test('marking a new selection in the same saved range always creates a new draft and never overwrites the active record',()=>{
 const f=deskFixture(),firstSelection={wordRange:{fromAy:1,fromWord:1,toAy:5,toWord:2}};
 f.configure({metadata:firstSelection});f.get('studySessionTitle').value='First';f.get('studySessionSave').click();
 const first=f.items()[0];f.action('First',0).click();
 f.configure({metadata:{wordRange:{fromAy:1,fromWord:3,toAy:5,toWord:4},selectionTitle:'New marked section'}});
 f.window.elifaStudySessions.onOpen({fromReader:true,fromSelection:true});
 assert.equal(f.window.elifaStudySessions.active(),null);assert.equal(f.get('studySessionSave').textContent,'study_save');
 f.get('studySessionTitle').value='Second';f.get('studySessionSave').click();
 assert.equal(f.items().length,2);assert.deepEqual(f.items()[0],first);assert.equal(f.items()[1].wordRange.fromWord,3);
});

test('delayed progress from another saved record with identical verses cannot change the active record',()=>{
 const f=deskFixture();for(const title of ['First','Second']){f.get('studySessionNew').click();f.get('studySessionTitle').value=title;f.get('studySessionSave').click();}
 const [first,second]=f.items();f.action('First',0).click();
 assert.equal(f.window.elifaStudySessions.activateDraft(),first.id);
 f.context.studyRange={sid:18,from:1,to:5,sessionId:second.id};
 f.window.elifaStudySessions.rememberProgress({ay:3,completed:false});assert.equal(f.items()[0].progress,undefined);
 f.context.studyRange.sessionId=first.id;f.window.elifaStudySessions.rememberProgress({ay:3,completed:false});
 assert.deepEqual(f.items()[0].progress,{ay:3,completed:false});assert.equal(f.items()[1].progress,undefined);
});
