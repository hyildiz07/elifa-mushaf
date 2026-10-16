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
test('saved Study Desk ranges can be reopened, edited, and deleted with manual cuts',()=>{
  const ids=new Map(),get=id=>{if(!ids.has(id))ids.set(id,new Element());return ids.get(id);};
  const storage=new Map(),messages=[],opened=[];
  let range={sid:18,from:1,to:5},remembered=null;
  const window={T:{},tr:key=>key,addEventListener(){},
    elifaStudySplitPrefs:()=>({mode:'manual',cutsByAy:{1:[2]}}),
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
  get('studySessionTitle').value='Kehf ezberi';get('studySessionSave').click();
  assert.equal(storage.get('studySessions').length,1);
  assert.deepEqual(storage.get('studySessions')[0].manualCuts,{1:[2]});
  const row=get('studySavedList').children[0],actions=row.children[1];
  actions.children[0].click();assert.deepEqual(opened,[{sid:18,from:1,to:5}]);
  assert.deepEqual(JSON.parse(JSON.stringify(remembered.prefs)),{mode:'manual',cutsByAy:{1:[2]}});
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
