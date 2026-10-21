import test from 'node:test';
import assert from 'node:assert/strict';
import {initReaderRepeatMenu} from '../src/reader-repeat-menu.mjs';
function harness(){
 const nodes=new Map(),docEvents={};
 const document={activeElement:null,getElementById:id=>nodes.get(id),addEventListener:(name,fn)=>docEvents[name]=fn};
 for(const id of ['readerRepeatToggle','readerRepeatMenu','readerRepeatRange','readerRepeatVerse'])nodes.set(id,{id,hidden:id==='readerRepeatMenu',attrs:{},events:{},setAttribute(k,v){this.attrs[k]=v;},addEventListener(k,v){this.events[k]=v;},focus(){document.activeElement=this;},contains(el){return el===this||(id==='readerRepeatMenu'&&['readerRepeatRange','readerRepeatVerse'].includes(el?.id));}});
 let mode='range',changes=0;
 const menu=initReaderRepeatMenu({document,readMode:()=>mode,onSelect:value=>{mode=value;changes++;},translate:key=>key});
 const key=(id,key)=>nodes.get(id).events.keydown({key,preventDefault(){},stopPropagation(){}});
 return {nodes,document,docEvents,menu,key,get mode(){return mode;},get changes(){return changes;}};
}
test('repeat menu opens upward through its trigger, keyboard selects, and escape or outside focus leaves settings unchanged',()=>{
 const h=harness(),get=id=>h.nodes.get(id),toggle=get('readerRepeatToggle'),menu=get('readerRepeatMenu');
 h.key('readerRepeatToggle','ArrowUp');assert.equal(menu.hidden,false);assert.equal(h.document.activeElement.id,'readerRepeatRange');
 h.key('readerRepeatMenu','ArrowDown');assert.equal(h.document.activeElement.id,'readerRepeatVerse');
 get('readerRepeatVerse').onclick();assert.equal(h.mode,'verse');assert.equal(h.changes,1);assert.equal(menu.hidden,true);assert.equal(h.document.activeElement,toggle);
 toggle.onclick();h.key('readerRepeatMenu','Escape');assert.equal(menu.hidden,true);assert.equal(h.changes,1);
 toggle.onclick();h.docEvents.click({target:{id:'outside'}});assert.equal(menu.hidden,true);assert.equal(h.changes,1);
 toggle.onclick();h.docEvents.focusin({target:{id:'outside'}});assert.equal(menu.hidden,true);assert.equal(toggle.attrs['aria-expanded'],'false');
});
