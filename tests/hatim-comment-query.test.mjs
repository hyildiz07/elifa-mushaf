import {test} from 'node:test';
import assert from 'node:assert/strict';
import {firestoreStoreTransaction} from '../server/database.mjs';

function fixture(keys){
 const rows=new Map(keys.map(key=>[key,{key,value:JSON.stringify({id:key}),deleted:false}])),calls=[];
 const query=(options={})=>({options,doc:id=>({id}),where(field,operator,value){assert.equal(field,'key');return query({...options,[operator]:value});},orderBy(field,direction){assert.equal(field,'key');return query({...options,direction});},startAfter(cursor){return query({...options,cursor});},limit(limit){return query({...options,limit});}});
 const db={collection:()=>query(),runTransaction:work=>work({
  get:async ref=>{
   if(ref.id){const row=[...rows.values()].find(row=>Buffer.from(row.key).toString('base64url')===ref.id);return {exists:!!row,data:()=>row};}
   calls.push(ref.options);const q=ref.options;
   const selected=[...rows.values()].filter(row=>row.key>=q['>=']&&row.key<q['<']&&(!q.cursor||(q.direction==='desc'?row.key<q.cursor:row.key>q.cursor)))
    .sort((a,b)=>q.direction==='desc'?b.key.localeCompare(a.key):a.key.localeCompare(b.key)).slice(0,q.limit);
   return {docs:selected.map(row=>({data:()=>row}))};
  },set:(_ref,row)=>rows.set(row.key,row)
 })};
 return {rows,calls,run:work=>firestoreStoreTransaction(db,{get(){throw Error('Private comments must never read legacy data');}},work)};
}

test('prefix queries use a bounded single-field range and cursor with no global or legacy scan',async()=>{
 const f=fixture(['_hc_group1_r_001','_hc_group1_r_002','_hc_group1_r_003','_hc_other1_r_999']);
 const first=await f.run(store=>store.query('_hc_group1_r_',{limit:2,reverse:true}));
 assert.deepEqual(first.entries.map(e=>e.key),['_hc_group1_r_003','_hc_group1_r_002']);assert.equal(first.nextCursor,'_hc_group1_r_002');
 const next=await f.run(store=>store.query('_hc_group1_r_',{limit:2,reverse:true,cursor:first.nextCursor}));
 assert.deepEqual(next.entries.map(e=>e.key),['_hc_group1_r_001']);assert.equal(next.nextCursor,null);
 assert.ok(f.calls.every(q=>q.limit===3&&q['>=']==='_hc_group1_r_'&&q['<']==='_hc_group1_r_\uf8ff'&&q.direction==='desc'));
 for(const options of [{limit:10000},{cursor:'_hcu_foreign'},{limit:0}])await assert.rejects(f.run(store=>store.query('_hc_group1_r_',options)),/Invalid record query/);
});

test('pending writes merge in order but never exceed the requested page limit; deleted pages retain a forward cursor',async()=>{
 const f=fixture(['_hc_group1_r_010','_hc_group1_r_020','_hc_group1_r_030']);
 const result=await f.run(async store=>{
  for(const number of ['001','002','003','004'])await store.setJSON('_hc_group1_r_'+number,{id:number});
  return store.query('_hc_group1_r_',{limit:2});
 });
 assert.deepEqual(result.entries.map(e=>e.key),['_hc_group1_r_001','_hc_group1_r_002']);assert.equal(result.nextCursor,'_hc_group1_r_002');
 for(const key of ['_hc_group1_r_001','_hc_group1_r_002'])f.rows.get(key).deleted=true;
 const deleted=await f.run(store=>store.query('_hc_group1_r_',{limit:2}));assert.deepEqual(deleted.entries,[]);assert.equal(deleted.nextCursor,'_hc_group1_r_002');
 const after=await f.run(store=>store.query('_hc_group1_r_',{limit:2,cursor:deleted.nextCursor}));assert.deepEqual(after.entries.map(e=>e.key),['_hc_group1_r_003','_hc_group1_r_004']);
});
