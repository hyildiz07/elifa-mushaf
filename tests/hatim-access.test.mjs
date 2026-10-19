import {test} from 'node:test';
import assert from 'node:assert/strict';
import {handleOrg,createOrgHandler} from '../netlify/functions/org.mjs';
import {capabilityHash,deriveReturnKey,returnKeyHash,returnKeyValid,membershipKey,closedAccountKey} from '../server/hatim-access.mjs';
import {releaseAccountHatimOwnership} from '../server/hatim-account.mjs';
import {firestoreStoreTransaction} from '../server/database.mjs';
import {expired,createOrgCleanup} from '../netlify/functions/org-cleanup.mjs';
const capA='a'.repeat(64),capB='b'.repeat(64),capC='c'.repeat(64);
const newHatim=(extra={})=>({type:'hatim',title:'Birlikte okuyalım',items:Array.from({length:30},(_,i)=>({no:i+1})),...extra});
function memory(initial={}){
 const rows=new Map(Object.entries(structuredClone(initial)));
 const store={get:async key=>structuredClone(rows.get(key)??null),setJSON:async(k,v)=>rows.set(k,structuredClone(v)),set:async(k,v)=>rows.set(k,v),delete:async k=>rows.delete(k),list:async()=>({blobs:[...rows.keys()].map(key=>({key}))})};
 let queue=Promise.resolve();
 const transaction=work=>{const result=queue.then(()=>work(store));queue=result.catch(()=>{});return result;};
 return {rows,store,transaction,run:(p,session={})=>transaction(s=>handleOrg(p,s,session))};
}
async function body(response,status=200){assert.equal(response.status,status,await response.clone().text());return response.json();}
async function group(h,extra={},session={}){return body(await h.run({action:'create',org:newHatim(extra)},session));}
const claim=(code,no,capability=capA,name='Takma ad')=>({action:'claim',code,no,capability,name});

test('personal short return keys are stable, context bound, private and usable beside existing full links',async()=>{
 const h=memory(),g=await group(h);await body(await h.run(claim(g.code,1)));await body(await h.run(claim(g.code,2)));
 const p={action:'returnCode',code:g.code,no:1,capability:capA};
 const first=await body(await h.run(p)),short=first.returnKey;
 assert.equal(returnKeyValid(short),true);assert.equal(short.length,20);assert.equal(first.code,g.code);assert.equal(first.no,1);
 assert.equal(short,deriveReturnKey(g.code,1,capA));assert.notEqual(short,deriveReturnKey(g.code,2,capA));
 assert.notEqual(returnKeyHash(short,g.code,1),returnKeyHash(short,g.code,2));
 const saved=structuredClone(h.rows.get(g.code));
 assert.equal((await body(await h.run(p))).returnKey,short);
 assert.equal((await body(await h.run({...p,capability:short}))).returnKey,short);
 assert.deepEqual(h.rows.get(g.code),saved,'retries do not rotate keys or alter state');
 const record=JSON.stringify(saved);assert.equal(record.includes(short),false);assert.equal(record.includes(capA),false);
 for(const capability of [capA,short]){
  const mine=await body(await h.run({action:'get',code:g.code,capabilities:{1:capability}}));assert.equal(mine.org.items[0].mine,true);assert.equal(mine.org.items[1].mine,false);
  assert.equal(JSON.stringify(mine).includes('returnHash'),false);assert.equal(JSON.stringify(mine).includes(short),false);
  await body(await h.run({action:'complete',code:g.code,no:1,capability}));
  await body(await h.run({action:'undo',code:g.code,no:1,capability}));
 }
 await body(await h.run({action:'complete',code:g.code,no:2,capability:short}),403);
 const other=await group(h);await body(await h.run(claim(other.code,1)));
 await body(await h.run({action:'complete',code:other.code,no:1,capability:short}),403);
 const publicView=await body(await h.run({action:'get',code:g.code}));assert.equal(publicView.org.items[0].mine,false);
});

test('return-code preparation requires the explicitly known current key even for an account owner or admin',async()=>{
 const h=memory(),g=await group(h);await body(await h.run(claim(g.code,1),{uid:'alice'}));
 const p={action:'returnCode',code:g.code,no:1};
 for(const session of [{},{uid:'alice'},{uid:'bob'}]){
  await body(await h.run(p,session),403);
  await body(await h.run({...p,admin:g.adminToken},session),403);
  await body(await h.run({...p,capabilities:{1:capA}},session),403);
 }
 await body(await h.run({...p,capability:capA}),403);
 await body(await h.run({...p,capability:capA},{uid:'bob'}),403);
 const short=(await body(await h.run({...p,capability:capA},{uid:'alice'}))).returnKey;
 for(const session of [{},{uid:'bob'}]){
  await body(await h.run({...p,capability:short},session),403);
  await body(await h.run({action:'complete',code:g.code,no:1,capability:short},session),403);
 }
 await body(await h.run({action:'complete',code:g.code,no:1,capability:short},{uid:'alice'}));
 await body(await h.run({...p,capability:'000000'}),400);
 await body(await h.run({...p,capability:'I'.repeat(20)}),400);
 await body(await h.run({...p,no:2,capability:capA},{uid:'alice'}),404);
});

test('short codes support explicit guest binding without bypassing the bound account gate',async()=>{
 const h=memory(),g=await group(h);await body(await h.run(claim(g.code,1)));
 const short=(await body(await h.run({action:'returnCode',code:g.code,no:1,capability:capA}))).returnKey;
 await body(await h.run({action:'bind',code:g.code,no:1,capability:short},{uid:'alice'}));
 await body(await h.run({action:'bind',code:g.code,no:1,capability:short},{uid:'bob'}),409);
 await body(await h.run({action:'complete',code:g.code,no:1,capability:short}),403);
 await body(await h.run({action:'complete',code:g.code,no:1,capability:short},{uid:'alice'}));
 assert.equal((await body(await h.run({action:'returnCode',code:g.code,no:1,capability:capA},{uid:'alice'}))).returnKey,short);
 await releaseAccountHatimOwnership('alice',{transaction:h.transaction});
 await body(await h.run({action:'undo',code:g.code,no:1,capability:short}));
 assert.equal(h.rows.get(g.code).items[0].status,'alindi','explicit account deletion retains personal recovery and reading progress');
});

test('release, recovery rotation and admin clearing revoke short codes; lost recovery and release replies stay retryable',async()=>{
 const h=memory(),g=await group(h);await body(await h.run(claim(g.code,1)));
 const key=async capability=>(await body(await h.run({action:'returnCode',code:g.code,no:1,capability}))).returnKey;
 const old=await key(capA);
 await body(await h.run({action:'release',code:g.code,no:1,capability:old}));
 await body(await h.run({action:'release',code:g.code,no:1,capability:old}));
 await body(await h.run({action:'returnCode',code:g.code,no:1,capability:old}),404);
 await body(await h.run(claim(g.code,1,capB)));
 for(const action of ['complete','undo','release','returnCode'])await body(await h.run({action,code:g.code,no:1,capability:old}),403);
 const second=await key(capB);
 const recovery={action:'issueRecovery',code:g.code,no:1,admin:g.adminToken,capability:capC};
 await body(await h.run(recovery));await body(await h.run({action:'complete',code:g.code,no:1,capability:second}),403);
 const third=await key(capC);await body(await h.run(recovery));assert.equal(await key(capC),third);
 for(const status of ['okundu','alindi']){
  await body(await h.run({action:'adminSet',code:g.code,no:1,admin:g.adminToken,status}));
  assert.equal(await key(capC),third,'display/status corrections do not reassign the participant or rotate their code');
 }
 await body(await h.run({action:'complete',code:g.code,no:1,capability:third}));
 await body(await h.run({action:'adminSet',code:g.code,no:1,admin:g.adminToken,status:'bos'}));
 assert.equal(h.rows.get(g.code).items[0].returnHash,undefined);assert.equal(h.rows.get(g.code).items[0].releaseReturnHash,undefined);
 await body(await h.run({action:'complete',code:g.code,no:1,capability:third}),403);
 await body(await h.run(claim(g.code,1,third)),409,'short return keys never become claim-generation secrets');
 await body(await h.run(claim(g.code,2,capB)));
 await body(await h.run({action:'issueRecovery',code:g.code,no:2,admin:g.adminToken,capability:third}),400);
 await body(await h.run(claim(g.code,1,'d'.repeat(64))));
 const current=await key('d'.repeat(64));
 await body(await h.run({action:'release',code:g.code,no:1,capability:current}));
 await body(await h.run({action:'release',code:g.code,no:1,capability:third}),403,'the new owner releasing does not resurrect the previous owner retry proof');
});

test('new full hatim preserves all thirty cüz; partial legacy remains readable with an honest completion label',async()=>{
 const h=memory(),g=await group(h);
 assert.equal(g.adminToken.length,32);assert.equal(g.org.fullHatim,true);assert.equal(g.org.items.length,30);
 await body(await h.run({action:'create',org:newHatim({items:[{no:1}]})}),400);
 await body(await h.run({action:'create',org:newHatim({items:Array(30).fill({no:1})})}),400);
 h.rows.set('oldgrp',{type:'hatim',title:'Eski çalışma',items:[{no:4,name:'Eski kişi',status:'okundu'}],adminToken:'legacykeyabc'});
 const old=await body(await h.run({action:'get',code:'oldgrp'}));
 assert.equal(old.org.complete,true);assert.equal(old.org.fullHatim,false);assert.equal(old.org.items[0].legacy,true);
});

test('private creates never appear in discovery; public create is explicit and reports disabled discovery',async()=>{
 const h=memory();await body(await h.run({action:'create',org:newHatim({public:true})}),403);
 assert.equal(h.rows.size,0);
 h.rows.set('_config',{discoverEnabled:true});const g=await group(h,{public:true}),p=await group(h,{public:false});
 const list=await body(await h.run({action:'discoverList'}));assert.deepEqual(list.items.map(i=>i.code),[g.code]);
 assert.equal(list.items[0].available,30);assert.equal(h.rows.get(p.code).public,false);
 await body(await h.run({action:'archive',code:g.code,admin:g.adminToken}));
 assert.equal((await body(await h.run({action:'discoverList'}))).items.length,0);
 assert.equal((await body(await h.run({action:'get',code:g.code}))).org.archived,true);
 await body(await h.run({action:'reopen',code:g.code,admin:g.adminToken}));
 assert.equal(h.rows.get(g.code).public,false,'reopen is not accidental public disclosure');
});

test('lost create replies return the same organization and private admin key instead of orphaning a first hatim',async()=>{
 const h=memory(),p={action:'create',creationToken:capC,org:newHatim()};
 const first=await body(await h.run(p)),retry=await body(await h.run(p));
 assert.equal(retry.code,first.code);assert.equal(retry.adminToken,first.adminToken);assert.equal(retry.replayed,true);
 assert.equal([...h.rows.values()].filter(x=>x?.type==='hatim').length,1);
 await body(await h.run({...p,org:newHatim({title:'Different'})}),409);
 const separate=await body(await h.run({...p,creationToken:capB}));assert.notEqual(separate.code,first.code);
 const privateCreate={action:'create',creationToken:capA,org:newHatim()};await body(await h.run(privateCreate,{uid:'alice'}));
 await body(await h.run(privateCreate,{uid:'bob'}),403);
 await body(await h.run(privateCreate),403);
});

test('claim is atomic under the transaction contract and a lost reply can be retried with its saved capability',async()=>{
 const h=memory(),g=await group(h);
 const competing=await Promise.all([h.run(claim(g.code,1)),h.run(claim(g.code,1,capB))]);
 assert.deepEqual(competing.map(r=>r.status),[200,409]);
 const retry=await body(await h.run(claim(g.code,1)));assert.equal(retry.org.items[0].mine,true);
 const afterSignIn=await body(await h.run(claim(g.code,1),{uid:'alice'}));assert.equal(afterSignIn.org.items[0].mine,true);
 assert.equal(h.rows.get(g.code).items[0].ownerUid,null,'signing in alone does not silently bind a guest claim');
 assert.equal(h.rows.get(g.code).items[0].claimHash,capabilityHash(capA));
 assert.equal(JSON.stringify(h.rows.get(g.code)).includes(capA),false);
 const publicData=await body(await h.run({action:'get',code:g.code}));
 assert.equal(publicData.org.items[0].mine,false);
 const visible=JSON.stringify(publicData);for(const key of ['claimHash','ownerUid','releaseHash','adminToken'])assert.equal(visible.includes(key),false,key);
 const mine=await body(await h.run({action:'get',code:g.code,capabilities:{1:capA}}));assert.equal(mine.org.items[0].mine,true);
});

test('public code, matching name, forged UID and admin do not grant ordinary participant ownership',async()=>{
 const h=memory(),g=await group(h);await body(await h.run(claim(g.code,1)));
 for(const action of ['complete','release','undo']){
  await body(await h.run({action,code:g.code,no:1,name:'Takma ad',uid:'victim',ownerUid:'victim'}),403);
  await body(await h.run({action,code:g.code,no:1,capability:capB}),403);
  await body(await h.run({action,code:g.code,no:1,admin:g.adminToken}),403);
 }
 assert.equal(h.rows.get(g.code).items[0].status,'alindi');
 await body(await h.run({action:'adminSet',code:g.code,no:1,status:'okundu',admin:g.adminToken}));
 assert.equal(h.rows.get(g.code).items[0].status,'okundu');
});

test('a mutation response retains ownership of all my cüz without applying one token to unrelated rows',async()=>{
 const h=memory(),g=await group(h);await body(await h.run(claim(g.code,1,capA)));await body(await h.run(claim(g.code,2,capB)));
 const response=await body(await h.run({action:'complete',code:g.code,no:1,capability:capA,capabilities:{1:capA,2:capB}}));
 assert.equal(response.org.items[0].mine,true);assert.equal(response.org.items[1].mine,true);
});

test('own complete / undo / release retries are safe and an old token cannot change the next owner',async()=>{
 const h=memory(),g=await group(h);await body(await h.run(claim(g.code,1)));
 for(const action of ['complete','complete','undo','undo','release','release'])await body(await h.run({action,code:g.code,no:1,capability:capA}));
 assert.equal(h.rows.get(g.code).items[0].status,'bos');
 await body(await h.run(claim(g.code,1,capA)),409,'an ended capability cannot become valid again');
 await body(await h.run(claim(g.code,1,capB,'Yeni kişi')));
 for(const action of ['complete','release','undo'])await body(await h.run({action,code:g.code,no:1,capability:capA}),403);
 assert.equal(h.rows.get(g.code).items[0].name,'Yeni kişi');
});

test('legacy recovery requires explicit admin; rotating it invalidates old guest rights without deleting state',async()=>{
 const h=memory({oldgrp:{type:'hatim',title:'Eski',adminToken:'legacykeyabc',items:[{no:3,name:'Korunacak',status:'okundu',ts:1}]}});
 await body(await h.run({action:'issueRecovery',code:'oldgrp',no:3,capability:capA}),403);
 const issued=await body(await h.run({action:'issueRecovery',code:'oldgrp',no:3,admin:'legacykeyabc',capability:capA}));
 assert.equal(issued.org.items[0].name,'Korunacak');assert.equal(issued.org.items[0].status,'okundu');assert.equal(issued.org.items[0].legacy,false);
 await body(await h.run({action:'undo',code:'oldgrp',no:3,capability:capA}));
 await body(await h.run({action:'issueRecovery',code:'oldgrp',no:3,admin:'legacykeyabc',capability:capB}));
 await body(await h.run({action:'complete',code:'oldgrp',no:3,capability:capA}),403);
 await body(await h.run({action:'complete',code:'oldgrp',no:3,capability:capB}));
});

test('a lost recovery reply may be retried without rotating again or undoing a later explicit account bind',async()=>{
 const h=memory(),g=await group(h);await body(await h.run(claim(g.code,1,capA),{uid:'old-owner'}));
 const recover={action:'issueRecovery',code:g.code,admin:g.adminToken,no:1,capability:capB};
 await body(await h.run(recover));const first=h.rows.get(g.code).items[0].ts;
 await body(await h.run(recover));assert.equal(h.rows.get(g.code).items[0].ts,first);
 await body(await h.run({action:'complete',code:g.code,no:1},{uid:'old-owner'}),403);
 await body(await h.run({action:'bind',code:g.code,no:1,capability:capB},{uid:'new-owner'}));
 await body(await h.run(recover));assert.equal(h.rows.get(g.code).items[0].ownerUid,'new-owner');
 await body(await h.run({action:'complete',code:g.code,no:1},{uid:'new-owner'}));
 const oldList=await body(await h.run({action:'myList'},{uid:'old-owner'}));assert.deepEqual(oldList.items,[]);
 await body(await h.run({...recover,capability:capC}));
 await body(await h.run(recover),409,'a delayed old recovery request must not revive a superseded key');
 assert.equal(h.rows.get(g.code).items[0].claimHash,capabilityHash(capC));
 await body(await h.run({action:'complete',code:g.code,no:1,capability:capB}),403);
});

test('discovery totals distinguish taken from complete and preserve usable legacy lookup codes',async()=>{
 const h=memory({_config:{discoverEnabled:true}}),g=await group(h,{public:true});
 const record=h.rows.get(g.code);record.items.forEach(i=>{i.status='alindi';i.name='Katılımcı';});delete record.code;
 const listed=await body(await h.run({action:'discoverList'})),card=listed.items[0];
 assert.equal(card.code,g.code);assert.equal(card.total,30);assert.equal(card.taken,30);assert.equal(card.done,0);assert.equal(card.available,0);assert.equal(card.fullHatim,true);
 record.items[0].status='okundu';record.items[1].status='bos';
 const updated=(await body(await h.run({action:'discoverList'}))).items[0];assert.equal(updated.done,1);assert.equal(updated.taken,29);assert.equal(updated.available,1);
});

test('myList pagination retains all ownership beyond thirty entries and filters stale or foreign index entries',async()=>{
 const h=memory(),owned=[];
 for(let n=0;n<33;n++){const g=await group(h);owned.push(g.code);await body(await h.run(claim(g.code,1,capA),{uid:'alice'}));}
 const foreign=await group(h);await body(await h.run(claim(foreign.code,1,capB),{uid:'bob'}));
 const index=h.rows.get(membershipKey('alice'));index.codes.unshift('dead00',foreign.code);
 const first=await body(await h.run({action:'myList'},{uid:'alice'}));assert.equal(first.nextCursor,30);
 const second=await body(await h.run({action:'myList',cursor:first.nextCursor},{uid:'alice'}));assert.equal(second.nextCursor,null);
 const all=[...first.items,...second.items];assert.deepEqual(all.map(x=>x.code).sort(),owned.sort());
 assert.ok(all.every(o=>o.items.length===1&&o.items[0].mine));assert.equal(JSON.stringify(all).includes('claimHash'),false);
});

test('guest bind needs proof, is idempotent and isolates account lists across devices and accounts',async()=>{
 const h=memory(),g=await group(h);await body(await h.run(claim(g.code,1)));
 await body(await h.run({action:'bind',code:g.code,no:1,capability:capA}),401);
 await body(await h.run({action:'bind',code:g.code,no:1,capability:capB},{uid:'alice'}),403);
 for(let i=0;i<2;i++)await body(await h.run({action:'bind',code:g.code,no:1,capability:capA},{uid:'alice'}));
 await body(await h.run({action:'bind',code:g.code,no:1,capability:capA},{uid:'bob'}),409);
 await body(await h.run({action:'complete',code:g.code,no:1,capability:capA}),403,'bound guest link cannot bypass sign-in');
 await body(await h.run({action:'complete',code:g.code,no:1},{uid:'alice'}));
 const alice=await body(await h.run({action:'myList'},{uid:'alice'}));assert.equal(alice.items[0].items[0].status,'okundu');
 assert.deepEqual((await body(await h.run({action:'myList'},{uid:'bob'}))).items,[]);
 await body(await h.run({action:'myList'}),401);
 assert.deepEqual(h.rows.get(membershipKey('alice')).codes,[g.code]);
 const crossDevice=await body(await h.run({action:'get',code:g.code},{uid:'alice'}));assert.equal(crossDevice.org.items[0].mine,true);
});

test('account-owned creation and claims survive without copying a guest/admin secret to another device',async()=>{
 const h=memory(),g=await group(h,{}, {uid:'alice'});
 await body(await h.run(claim(g.code,2,capA),{uid:'alice'}));
 const list=await body(await h.run({action:'myList'},{uid:'alice'}));assert.equal(list.items[0].isAdmin,true);
 const resumed=await body(await h.run({action:'get',code:g.code},{uid:'alice'}));assert.equal(resumed.org.isAdmin,true);assert.equal(resumed.org.items[1].mine,true);
 await body(await h.run({action:'update',code:g.code,title:'Yeni başlık',dueDate:'2026-10-20'},{uid:'alice'}));
 await body(await h.run({action:'update',code:g.code,title:'Çalınmış başlık'},{uid:'bob'}),403);
 await body(await h.run({action:'complete',code:g.code,no:2,capability:capA},{uid:'bob'}),403);
 await body(await h.run({action:'update',code:g.code,dueDate:'2026-02-30'},{uid:'alice'}),400);
 assert.equal(h.rows.get(g.code).title,'Yeni başlık');
});

test('verified bearer auth is optional for guests but cannot be forged or silently cross account boundaries',async()=>{
 const h=memory();let serviceCalls=0;
 const handler=createOrgHandler({environment:()=>({CONTEXT:'production'}),transaction:h.transaction,services(){serviceCalls++;return {auth:{verifyIdToken:async token=>{if(token!=='valid-alice')throw Error('invalid');return {uid:'alice'};},getUser:async()=>({disabled:false})}};}});
 const req=(p,token,origin='https://app.test')=>new Request('https://app.test/api/org',{method:'POST',headers:{'content-type':'application/json',origin,...(token?{authorization:'Bearer '+token}:{})},body:JSON.stringify(p)});
 await body(await handler(req({action:'myList',uid:'alice'})),401);assert.equal(serviceCalls,0);
 await body(await handler(req({action:'myList',expectedUser:'bob'},'valid-alice')),409);
 await body(await handler(req({action:'myList',expectedUser:'alice'},'forged')),401);
 await body(await handler(req({action:'myList',expectedUser:'alice'},'valid-alice','https://foreign.test')),403);
 assert.deepEqual((await body(await handler(req({action:'myList',expectedUser:'alice'},'valid-alice')))).items,[]);
});

test('invalid tokens and request shapes fail before any ownership is changed',async()=>{
 const h=memory(),g=await group(h);
 await body(await h.run(claim(g.code,1,'short')),400);
 await body(await h.run({action:'claim',code:g.code,no:1,name:'Valid'}),409);
 await body(await h.run({action:'get',code:g.code,capabilities:{31:capA}}),400);
 await body(await h.run({action:'get',code:g.code,capabilities:[]}),400);
 await body(await h.run(claim(g.code,1,capA,' ')),400);
 assert.equal(h.rows.get(g.code).items[0].status,'bos');
});

test('archive housekeeping eligibility never repeats archive or deletes legacy keys',()=>{
 const now=Date.now(),day=86400000;
 assert.equal(expired({type:'hatim',archivedAt:now-1,lastActivity:now-500*day,items:[{status:'okundu'}]},now),false);
 assert.equal(expired({type:'hatim',lastActivity:now-8*day,items:[{status:'okundu'}]},now),true);
});

test('explicit account deletion detaches and anonymizes memberships without deleting reading state or guest/admin recovery',async()=>{
 const h=memory(),g=await group(h,{adminName:'Private account name'}, {uid:'alice'});
 await body(await h.run(claim(g.code,1),{uid:'alice'}));await body(await h.run({action:'complete',code:g.code,no:1},{uid:'alice'}));
 await releaseAccountHatimOwnership('alice',{transaction:h.transaction});
 const retained=h.rows.get(g.code);assert.equal(retained.ownerUid,undefined);assert.equal(retained.adminName,'');
 assert.equal(retained.items[0].name,'Katılımcı');assert.equal(retained.items[0].status,'okundu');assert.equal(retained.items[0].claimHash,capabilityHash(capA));
 assert.equal(retained.adminToken,g.adminToken);assert.equal(h.rows.has(membershipKey('alice')),false);assert.equal(h.rows.has(closedAccountKey('alice')),true);
 await body(await h.run({action:'complete',code:g.code,no:1},{uid:'alice'}),409,'in-flight verified token cannot restore ownership after deletion');
 await body(await h.run({action:'undo',code:g.code,no:1,capability:capA}));
 await body(await h.run({action:'get',code:g.code,admin:g.adminToken}));
 await releaseAccountHatimOwnership('alice',{transaction:h.transaction});
 assert.equal(h.rows.get(g.code).items[0].status,'alindi');
});

test('partial account detach failure keeps its index so a retry finishes remaining organizations',async()=>{
 const h=memory(),a=await group(h,{}, {uid:'alice'}),b=await group(h,{}, {uid:'alice'});
 await body(await h.run(claim(a.code,1,capA),{uid:'alice'}));await body(await h.run(claim(b.code,1,capB),{uid:'alice'}));
 let writes=0;
 const flaky=work=>h.transaction(store=>work({...store,setJSON:async(k,v)=>{if(k===a.code&&++writes===1)throw Error('temporary');return store.setJSON(k,v);}}));
 await assert.rejects(releaseAccountHatimOwnership('alice',{transaction:flaky}),/temporary/);
 assert.ok(h.rows.has(membershipKey('alice')));assert.ok(h.rows.has(closedAccountKey('alice')));
 await releaseAccountHatimOwnership('alice',{transaction:h.transaction});
 assert.equal(h.rows.get(a.code).ownerUid,undefined);assert.equal(h.rows.get(b.code).ownerUid,undefined);
 assert.equal(h.rows.get(a.code).items[0].claimHash,capabilityHash(capA));assert.equal(h.rows.get(b.code).items[0].claimHash,capabilityHash(capB));
});

test('scheduled housekeeping archives stale hatim and legacy zikir without deleting data or access keys',async()=>{
 const now=Date.now(),day=86400000;
 const h=memory({oldgrp:{type:'hatim',createdAt:now-90*day,adminToken:'legacykeyabc',public:true,items:[{no:1,name:'Kept',status:'alindi',claimHash:capabilityHash(capA)}]},zgroup:{type:'zikir',createdAt:now-90*day,hedef:100,contributions:[{name:'Kept',amount:4}]},a_legacykeyabc:'oldgrp',_index:[{code:'oldgrp'}]});
 const cleanup=createOrgCleanup({transaction:h.transaction,now:()=>now});
 const summary=await body(await cleanup());assert.equal(summary.silinen,0);assert.equal(summary.arsivlenen,2);
 assert.equal(h.rows.get('oldgrp').items[0].claimHash,capabilityHash(capA));assert.equal(h.rows.get('a_legacykeyabc'),'oldgrp');
 assert.equal(h.rows.get('zgroup').contributions[0].amount,4);assert.deepEqual(h.rows.get('_index'),[]);
 const after=await body(await h.run({action:'get',code:'oldgrp',capability:capA}));assert.equal(after.org.items[0].mine,true);
 await body(await h.run({action:'complete',code:'oldgrp',no:1,capability:capA}));assert.equal(h.rows.get('oldgrp').archivedAt,0);
});

test('new private indexes avoid legacy network lookups while old organizations still import intact',async()=>{
 const lookups=[],writes=[];
 const db={collection:name=>({doc:id=>({name,id})}),runTransaction:async work=>work({get:async()=>({exists:false}),set:(ref,value)=>writes.push({ref,value})})};
 const legacy={get:async key=>{lookups.push(key);return key==='oldgrp'?{title:'Legacy preserved'}:null;}};
 await firestoreStoreTransaction(db,legacy,async store=>{
  for(const key of ['_closed_abc','_member_abc','_create_abc'])assert.equal(await store.get(key),null);
  assert.deepEqual(await store.get('oldgrp'),{title:'Legacy preserved'});
 });
 assert.deepEqual(lookups,['oldgrp']);assert.equal(writes.length,1);assert.equal(JSON.parse(writes[0].value.value).title,'Legacy preserved');
});
