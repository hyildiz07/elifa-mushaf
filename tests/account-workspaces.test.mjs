import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createAccountWorkspaces,createSafeStorage,WORKSPACE_OWNER,WORKSPACE_PREFIX} from '../src/account-workspaces.mjs';
import {PREVIOUS_KEY} from '../src/account-data.mjs';
const memory=initial=>{const map=new Map(Object.entries(initial||{}));return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k),map};};
test('guest, A and B workspaces isolate notes and undo histories without erasing archives',()=>{
 const s=memory({notes:'{"1:1":"guest"}'}),w=createAccountWorkspaces(s);
 assert.equal(w.activate('A'),true);assert.equal(s.getItem('notes'),null);assert.equal(s.getItem(PREVIOUS_KEY),null);
 s.setItem('notes','{"2:1":"A private"}');s.setItem(PREVIOUS_KEY,'A undo');
 w.activate('B');assert.equal(s.getItem('notes'),null);assert.equal(s.getItem(PREVIOUS_KEY),null);
 s.setItem('notes','{"3:1":"B private"}');w.activate('A');
 assert.equal(s.getItem('notes'),'{"2:1":"A private"}');assert.equal(s.getItem(PREVIOUS_KEY),'A undo');
 w.activate(null);assert.equal(s.getItem('notes'),'{"1:1":"guest"}');assert.equal(s.getItem(PREVIOUS_KEY),null);
 assert.ok(s.getItem(WORKSPACE_PREFIX+'A').includes('A private'));assert.ok(s.getItem(WORKSPACE_PREFIX+'B').includes('B private'));
});
test('guest migration requires explicit import and preserves the original plus independent account records',()=>{
 const s=memory({notes:'{"1:1":"guest"}'}),w=createAccountWorkspaces(s);w.activate('A');
 assert.equal(w.hasGuestData('A'),true);assert.equal(s.getItem('notes'),null);
 s.setItem('notes','{"2:1":"A"}');assert.equal(w.importGuest('A').conflicts.length,0);
 assert.deepEqual(JSON.parse(s.getItem('notes')),{'2:1':'A','1:1':'guest'});assert.equal(w.hasGuestData('A'),false);
 w.activate(null);assert.deepEqual(JSON.parse(s.getItem('notes')),{'1:1':'guest'});
});
test('conflicting guest migration cannot overwrite either version before an explicit choice',()=>{
 const s=memory({notes:'{"1:1":"guest"}'}),w=createAccountWorkspaces(s);w.activate('A');s.setItem('notes','{"1:1":"account"}');
 const result=w.importGuest('A');assert.equal(result.conflicts.length,1);assert.equal(s.getItem('notes'),'{"1:1":"account"}');
 assert.equal(w.importGuest('A',{[result.conflicts[0].id]:'local'}).conflicts.length,0);
 assert.equal(s.getItem('notes'),'{"1:1":"account"}');w.activate(null);assert.equal(s.getItem('notes'),'{"1:1":"guest"}');
});
test('quota failure while archiving refuses account switch and keeps active records intact',()=>{
 const s=memory({notes:'{"1:1":"private"}',[WORKSPACE_OWNER]:'A'}),w=createAccountWorkspaces(s),set=s.setItem;
 s.setItem=(k,v)=>{if(k.startsWith(WORKSPACE_PREFIX))throw Error('QuotaExceeded');set(k,v);};
 assert.throws(()=>w.activate('B'),/Quota/);assert.equal(s.getItem(WORKSPACE_OWNER),'A');assert.equal(s.getItem('notes'),'{"1:1":"private"}');
});
test('invalid target archive and failed active-data write never replace the previous owner',()=>{
 const s=memory({notes:'{"1:1":"A"}',[WORKSPACE_OWNER]:'A',[WORKSPACE_PREFIX+'B']:'bad'}),w=createAccountWorkspaces(s);
 assert.throws(()=>w.activate('B'));assert.equal(s.getItem('notes'),'{"1:1":"A"}');
 s.removeItem(WORKSPACE_PREFIX+'B');const remove=s.removeItem;
 s.removeItem=k=>{if(k==='notes')throw Error('blocked remove');remove(k);};
 assert.throws(()=>w.activate('B'));assert.equal(s.getItem('notes'),'{"1:1":"A"}');assert.equal(s.getItem(WORKSPACE_OWNER),'A');
});
test('blocked or full storage uses honest memory preferences and never throws during auth rendering',()=>{
 let failures=0;const s=createSafeStorage(()=>{throw Error('SecurityError');},()=>failures++);
 assert.equal(s.getItem('enabled'),null);assert.equal(s.setItem('enabled','1'),false);assert.equal(s.getItem('enabled'),'1');
 assert.equal(s.removeItem('enabled'),false);assert.equal(s.getItem('enabled'),null);assert.equal(s.failed,true);assert.ok(failures>=3);
});
test('private prayer progress is isolated locally and guest-only prayer records can be explicitly copied',()=>{
 const s=memory({duaPracticeV1:'{"opening":{"rep":3}}',duaFav:'["n1"]'}),w=createAccountWorkspaces(s);
 w.activate('A');assert.equal(s.getItem('duaPracticeV1'),null);assert.equal(w.hasGuestData('A'),true);
 w.importGuest('A');assert.equal(s.getItem('duaPracticeV1'),'{"opening":{"rep":3}}');
 s.setItem('duaFav','["n2"]');w.activate('B');assert.equal(s.getItem('duaFav'),null);w.activate('A');assert.equal(s.getItem('duaFav'),'["n2"]');
 w.activate(null);assert.equal(s.getItem('duaFav'),'["n1"]');
});
