import {test} from 'node:test';
import assert from 'node:assert/strict';
import {collectBackup,validateBackup,restoreBackup,recoverPendingRestore,mergeBackups,BACKUP_KEYS,JOURNAL_KEY,PREVIOUS_KEY} from '../src/account-data.mjs';
function memory(initial={}){const map=new Map(Object.entries(initial));return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};}
const backup=notes=>({elifa:'yedek',v:1,veri:{notes:JSON.stringify(notes)}});
test('backup allowlist excludes credentials and group admin keys',()=>{
  const b=collectBackup(memory({notes:'{"1:1":"not"}',nf_jwt:'secret',bk_admin:'secret'}));
  assert.deepEqual(Object.keys(b.veri),['notes']);
  assert.throws(()=>validateBackup({elifa:'yedek',v:1,veri:{nf_jwt:'"secret"'}}));
});
test('invalid nested keys and shapes are rejected before storage changes',()=>{
  assert.throws(()=>validateBackup(backup({'1:1':{text:'wrong'}})));
  assert.throws(()=>validateBackup({elifa:'yedek',v:1,veri:{set:'{"custom":{"__proto__":{"admin":true}}}'}}));
  const s=memory({notes:'{"1:1":"old"}'});
  assert.throws(()=>restoreBackup(s,{elifa:'yedek',v:1,veri:{bookmarks:'{}'}}));
  assert.equal(s.getItem('notes'),'{"1:1":"old"}');assert.equal(s.getItem(JOURNAL_KEY),null);
});
test('imported marks cannot inject attributes or executable HTML through colour or verse fields',()=>{
  const mark={id:1,s:4,fa:12,ta:12,fp:1,tp:88,folder:'Ezber',txt:'Not',color:'#F5D63D'};
  const wrap=m=>({elifa:'yedek',v:1,veri:{marks:JSON.stringify([m])}});
  assert.doesNotThrow(()=>validateBackup(wrap(mark)));
  assert.throws(()=>validateBackup(wrap({...mark,color:'" onmouseover="alert(1)'})));
  assert.throws(()=>validateBackup(wrap({...mark,fa:'<img src=x onerror=alert(1)>'})));
});
test('successful restore preserves auth storage and keeps a local recovery copy',()=>{
  const s=memory({notes:'{"1:1":"old"}',nf_jwt:'session'});restoreBackup(s,backup({'1:1':'new'}));
  assert.equal(s.getItem('notes'),'{"1:1":"new"}');assert.equal(s.getItem('nf_jwt'),'session');
  assert.equal(JSON.parse(s.getItem(PREVIOUS_KEY)).notes,'{"1:1":"old"}');assert.equal(s.getItem(JOURNAL_KEY),null);
});
test('mid-restore quota failure rolls back every original key',()=>{
  const s=memory({notes:'{"1:1":"old"}',marks:'[]'}),set=s.setItem;
  s.setItem=(k,v)=>{if(k==='notes'&&v.includes('new'))throw Error('QuotaExceeded');return set(k,v);};
  assert.throws(()=>restoreBackup(s,backup({'1:1':'new'})),/eski kayıtlar korundu/);
  assert.equal(s.getItem('notes'),'{"1:1":"old"}');assert.equal(s.getItem('marks'),'[]');assert.equal(s.getItem(JOURNAL_KEY),null);
});
test('unfinished restore after a crash recovers the old complete state',()=>{
  const old=Object.fromEntries(BACKUP_KEYS.map(k=>[k,k==='notes'?'{"1:1":"old"}':null]));
  const s=memory({[JOURNAL_KEY]:JSON.stringify(old),notes:'{"1:1":"partial"}',marks:'[]'});
  assert.equal(recoverPendingRestore(s),true);assert.equal(s.getItem('notes'),old.notes);assert.equal(s.getItem('marks'),null);
});
test('a journal from before saved studies preserves newer studies during recovery',()=>{
  const legacy=Object.fromEntries(BACKUP_KEYS.filter(k=>k!=='studySessions').map(k=>[k,k==='notes'?'{"1:1":"old"}':null]));
  const study='[{"id":"12345678-1234-4234-8234-123456789abc","title":"Kehf 1–5","sid":18,"from":1,"to":5,"createdAt":"2026-10-16T00:00:00.000Z","updatedAt":"2026-10-16T00:00:00.000Z"}]';
  const s=memory({[JOURNAL_KEY]:JSON.stringify(legacy),notes:'{"1:1":"partial"}',studySessions:study});
  assert.equal(recoverPendingRestore(s),true);
  assert.equal(s.getItem('notes'),legacy.notes);
  assert.equal(s.getItem('studySessions'),study);
});
test('saved studies are validated, backed up, restored, and merged by stable id',()=>{
  const item={id:'12345678-1234-4234-8234-123456789abc',title:'Kehf 1–5',sid:18,from:1,to:5,
    createdAt:'2026-10-16T00:00:00.000Z',updatedAt:'2026-10-16T00:00:00.000Z'};
  const wrap=items=>({elifa:'yedek',v:1,veri:{studySessions:JSON.stringify(items)}});
  assert.deepEqual(JSON.parse(validateBackup(wrap([item])).veri.studySessions),[item]);
  assert.doesNotThrow(()=>validateBackup(wrap([{...item,sid:1,from:1,to:7}])));
  for(const bad of [{...item,title:'<img src=x onerror=alert(1)>',extra:'x'},
    {...item,to:0},{...item,sid:115},{...item,id:'x'},
    {...item,sid:1,from:1,to:8},{...item,sid:114,from:1,to:7},
    {...item,id:'12345678-1234-5234-8234-123456789abc'},
    {...item,id:'12345678-1234-4234-7234-123456789abc'},
    {...item,id:'------------------------------------'},
    {...item,title:' '.repeat(5)}])assert.throws(()=>validateBackup(wrap([bad])));
  assert.throws(()=>validateBackup(wrap([item,item])));
  const s=memory();restoreBackup(s,wrap([item]));
  assert.deepEqual(JSON.parse(s.getItem('studySessions')),[item]);
  const other={...item,id:'abcdefab-abcd-4bcd-8bcd-abcdefabcdef',title:'Fetih',sid:48};
  const combined=mergeBackups(null,wrap([item]),wrap([other]));
  assert.deepEqual(JSON.parse(combined.payload.veri.studySessions).map(x=>x.id),[item.id,other.id]);
  const deleted=mergeBackups(wrap([item]),wrap([]),wrap([item]));
  assert.deepEqual(JSON.parse(deleted.payload.veri.studySessions),[]);
});
test('concurrent edits to one saved study require a choice instead of mixing incompatible ranges',()=>{
  const item={id:'12345678-1234-4234-8234-123456789abc',title:'Kehf',sid:18,from:1,to:5,
    createdAt:'2026-10-16T00:00:00.000Z',updatedAt:'2026-10-16T00:00:00.000Z'};
  const wrap=items=>({elifa:'yedek',v:1,veri:{studySessions:JSON.stringify(items)}});
  const local={...item,from:7,to:7,updatedAt:'2026-10-16T01:00:00.000Z'};
  const remote={...item,to:3,updatedAt:'2026-10-16T02:00:00.000Z'};
  const merged=mergeBackups(wrap([item]),wrap([local]),wrap([remote]));
  assert.deepEqual(merged.conflicts.map(c=>c.id),[`studySessions/${item.id}`]);
  assert.deepEqual(JSON.parse(merged.payload.veri.studySessions),[local]);
  const resolved=mergeBackups(wrap([item]),wrap([local]),wrap([remote]),{[`studySessions/${item.id}`]:'remote'});
  assert.deepEqual(resolved.conflicts,[]);
  assert.deepEqual(JSON.parse(resolved.payload.veri.studySessions),[remote]);
});
test('three-way sync merges independent edits without dropping existing notes',()=>{
 const base=backup({'1:1':'old'}),local=backup({'1:1':'old','1:2':'device'}),remote=backup({'1:1':'old','1:3':'cloud'});
 const result=mergeBackups(base,local,remote);
 assert.deepEqual(result.conflicts,[]);
 assert.deepEqual(JSON.parse(result.payload.veri.notes),{'1:1':'old','1:2':'device','1:3':'cloud'});
});
test('three-way sync requires a choice for simultaneous edits to the same note',()=>{
 const base=backup({'1:1':'old'}),local=backup({'1:1':'device'}),remote=backup({'1:1':'cloud'});
 const result=mergeBackups(base,local,remote);
 assert.deepEqual(result.conflicts.map(c=>c.id),['notes/1:1']);
 assert.deepEqual(JSON.parse(mergeBackups(base,local,remote,{'notes/1:1':'remote'}).payload.veri.notes),{'1:1':'cloud'});
});
test('first-device sync combines independent lists and retains deletions',()=>{
 const wrap=veri=>({elifa:'yedek',v:1,veri:Object.fromEntries(Object.entries(veri).map(([k,v])=>[k,JSON.stringify(v)]))});
 const local=wrap({errs:['1:1:1'],surahFavorites:[2]}),remote=wrap({errs:['1:1:2'],surahFavorites:[3]});
 const merged=mergeBackups(null,local,remote);
 assert.deepEqual(merged.conflicts,[]);
 assert.deepEqual(JSON.parse(merged.payload.veri.errs),['1:1:1','1:1:2']);
 assert.deepEqual(JSON.parse(merged.payload.veri.surahFavorites),[2,3]);
 const base=wrap({surahFavorites:[2,3]});
 const deleted=mergeBackups(base,wrap({surahFavorites:[3]}),base);
 assert.deepEqual(JSON.parse(deleted.payload.veri.surahFavorites),[3]);
});
