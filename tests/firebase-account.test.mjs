import {test} from 'node:test';
import assert from 'node:assert/strict';
import {firebaseServices} from '../server/firebase.mjs';
import {firestoreStoreTransaction} from '../server/database.mjs';
import {handleOrg,createOrgHandler} from '../netlify/functions/org.mjs';
import {createAccountHandler} from '../server/account-handler.mjs';
import {releaseAccountHatimOwnership} from '../server/hatim-account.mjs';
import {deletedHatimKey,membershipKey} from '../server/hatim-access.mjs';
const enabled=process.env.FIREBASE_PROJECT_ID==='demo-elifa-mushaf'&&Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST)&&Boolean(process.env.FIRESTORE_EMULATOR_HOST);
const payload={elifa:'yedek',v:1,veri:{notes:'{"1:1":"private"}'}};
test('Firebase Auth + Firestore integration: authorization, concurrency, revocation and erasure',{skip:!enabled},async t=>{
 const {auth,db}=firebaseServices(),handler=createAccountHandler({services:firebaseServices});
 const suffix=Date.now(),users=[];
 async function account(verified=true){
  const email='test-'+suffix+'-'+users.length+'@example.test',password='Emulator-only-9284!';
  const u=await auth.createUser({email,password,emailVerified:verified});users.push(u.uid);
  const response=await fetch('http://'+process.env.FIREBASE_AUTH_EMULATOR_HOST+'/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-key',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password,returnSecureToken:true})});
  const data=await response.json();assert.ok(data.idToken);return {uid:u.uid,token:data.idToken};
 }
 function req(user,action,extra={},origin='https://example.test'){
  return new Request('https://example.test/api/account',{method:'POST',headers:{origin,'content-type':'application/json',...(user?{authorization:'Bearer '+user.token}:{})},body:JSON.stringify({action,expectedUser:user?.uid,...extra})});
 }
 const a=await account(),b=await account(),unverified=await account(false);
 try{
  await t.test('missing/invalid tokens, foreign origin, unverified email and account mismatch rejected',async()=>{
   assert.equal((await handler(req(null,'list'))).status,401);
   assert.equal((await handler(req({...a,token:'bad'},'list'))).status,401);
   assert.equal((await handler(req(a,'save',{payload},'https://evil.test'))).status,403);
   assert.equal((await handler(req(a,'list',{expectedUser:b.uid}))).status,409);
   assert.equal((await handler(req(unverified,'save',{payload}))).status,403);
  });
  await t.test('Firestore rules block direct browser access to backups and administrative writes',async()=>{
   const base='http://'+process.env.FIRESTORE_EMULATOR_HOST+'/v1/projects/demo-elifa-mushaf/databases/(default)/documents/';
   await db.collection('config').doc('rule-test').set({public:true});
   assert.equal((await fetch(base+'config/rule-test')).status,200);
   for(const path of ['elifaAccounts/'+a.uid,'elifaAccounts/'+b.uid,'elifaAccounts/'+a.uid+'/sync/current','elifaAccounts/'+a.uid+'/private/profile'])assert.equal((await fetch(base+path,{headers:{authorization:'Bearer '+a.token}})).status,403);
   assert.equal((await fetch(base+'config/rule-test',{method:'PATCH',headers:{authorization:'Bearer '+a.token,'content-type':'application/json'},body:JSON.stringify({fields:{public:{booleanValue:false}}})})).status,403);
   await db.collection('config').doc('rule-test').delete();
  });
  let id;
  await t.test('backup round trip and isolation between two real emulator users',async()=>{
   const result=await handler(req(a,'save',{payload}));assert.equal(result.status,201);id=(await result.json()).id;
   assert.deepEqual((await (await handler(req(a,'restore',{id}))).json()).payload.veri,payload.veri);
   assert.equal((await handler(req(b,'restore',{id}))).status,404);
   assert.equal((await handler(req(b,'deleteBackup',{id}))).status,200);
   assert.equal((await handler(req(a,'restore',{id}))).status,200);
  });
  await t.test('private profiles are isolated, versioned, validated and preserved through backup writes',async()=>{
   const profile={displayName:'Yolcu',birthDate:'1995-05-12',age:null,gender:'unspecified'};
   assert.equal((await handler(req(unverified,'profilePut',{profile,revision:0}))).status,403);
   assert.equal((await handler(req(a,'profilePut',{profile,revision:0}))).status,200);
   assert.equal((await handler(req(a,'profilePut',{profile,revision:0}))).status,409);
   assert.equal((await handler(req(a,'profilePut',{profile:{...profile,age:30},revision:1}))).status,400);
   assert.equal((await (await handler(req(b,'profileGet'))).json()).profile,null);
   assert.equal((await handler(req(a,'save',{payload}))).status,201);
   const saved=await (await handler(req(a,'profileGet'))).json();assert.deepEqual(saved.profile,profile);assert.equal(saved.revision,1);
   // Keep the later twenty-backup concurrency fixture's starting count stable.
   const list=await (await handler(req(a,'list'))).json();const extra=list.backups.find(v=>v.id!==id);assert.ok(extra);
   assert.equal((await handler(req(a,'deleteBackup',{id:extra.id}))).status,200);
  });
  await t.test('sync is isolated, versioned and rejects stale concurrent writes',async()=>{
   const empty=await (await handler(req(a,'syncGet'))).json();assert.equal(empty.revision,0);assert.equal(empty.payload,null);
   const first=await handler(req(a,'syncPut',{revision:0,payload}));assert.equal(first.status,200);assert.equal((await first.json()).revision,1);
   assert.equal((await handler(req(a,'syncPut',{revision:0,payload}))).status,409);
   const current=await (await handler(req(a,'syncGet'))).json();assert.equal(current.revision,1);assert.deepEqual(current.payload.veri,payload.veri);
   assert.equal((await (await handler(req(b,'syncGet'))).json()).payload,null);
   const modified={...payload,veri:{notes:'{"1:1":"new"}'}};
   assert.equal((await handler(req(a,'syncPut',{revision:1,payload:modified}))).status,200);
   assert.equal((await (await handler(req(a,'syncGet'))).json()).payload.veri.notes,modified.veri.notes);
  });
  await t.test('parallel saves retain data and cannot exceed twenty backups',async()=>{
   for(let i=0;i<17;i++)assert.equal((await handler(req(a,'save',{payload}))).status,201);
   const results=await Promise.all(Array.from({length:4},()=>handler(req(a,'save',{payload}))));
   assert.equal(results.filter(r=>r.status===201).length,2);
   assert.equal(results.filter(r=>r.status===409).length,2);
   assert.equal((await (await handler(req(a,'list'))).json()).backups.length,20);
  });
  await t.test('fresh authentication timestamp, not merely a valid JWT, is required for deletion',async()=>{
   const old=createAccountHandler({services:()=>({db,auth:{getUser:uid=>auth.getUser(uid),verifyIdToken:async token=>({...await auth.verifyIdToken(token,true),auth_time:Math.floor(Date.now()/1000)-301})}})});
   assert.equal((await old(req(a,'deleteAccount',{confirmation:'DELETE'}))).status,403);
   assert.equal((await handler(req(a,'deleteAccount',{confirmation:'NO'}))).status,403);
  });
  await t.test('failed identity deletion locks writes and can be retried without resurrection',async()=>{
   const failed=createAccountHandler({services:()=>({db,auth:{getUser:uid=>auth.getUser(uid),verifyIdToken:(...args)=>auth.verifyIdToken(...args),deleteUser:async()=>{throw Error('temporary');}}})});
   assert.equal((await failed(req(a,'deleteAccount',{confirmation:'DELETE'}))).status,503);
   assert.equal((await handler(req(a,'save',{payload}))).status,409);
   assert.equal((await db.collection('elifaAccounts').doc(a.uid).collection('backups').get()).size,0);
   assert.equal((await db.collection('elifaAccounts').doc(a.uid).collection('sync').doc('current').get()).exists,false);
   assert.equal((await db.collection('elifaAccounts').doc(a.uid).collection('private').doc('profile').get()).exists,false);
   assert.equal((await handler(req(a,'deleteAccount',{confirmation:'DELETE'}))).status,200);
   assert.equal((await handler(req(a,'list'))).status,401);
   assert.equal((await db.collection('elifaAccounts').doc(a.uid).get()).exists,false);
  });
  await t.test('disabled users cannot use previously issued tokens',async()=>{
   await auth.updateUser(b.uid,{disabled:true});
   assert.equal((await handler(req(b,'save',{payload}))).status,401);
  });
  await t.test('unverified account can erase itself without being forced to verify email',async()=>{
   assert.equal((await handler(req(unverified,'deleteAccount',{confirmation:'DELETE'}))).status,200);
  });
 }finally{
  for(const uid of users){await db.recursiveDelete(db.collection('elifaAccounts').doc(uid));await auth.deleteUser(uid).catch(()=>{});}
 }
});

 test('Firestore group transactions retain simultaneous votes and claims and never resurrect legacy data',{skip:!enabled},async()=>{
 const {db}=firebaseServices();await db.recursiveDelete(db.collection('elifaOrgRecords'));await db.recursiveDelete(db.collection('elifaOrgMeta'));
 const old=new Map([['_poll',{id:'poll-1',active:true,options:[{id:'o1',text:'A'}],counts:{o1:0},voters:{}}],['group1',{type:'zikir',hedef:100,contributions:[],items:[]}],['group2',{type:'hatim',items:[{no:1,name:'',status:'bos'}]}]]);
 const legacy={get:async key=>structuredClone(old.get(key)??null),list:async()=>({blobs:[...old.keys()].map(key=>({key}))})};
 const run=p=>firestoreStoreTransaction(db,legacy,store=>handleOrg(p,store));
 const votes=await Promise.all([run({action:'pollVote',id:'poll-1',option:'o1',voterId:'device-a'}),run({action:'pollVote',id:'poll-1',option:'o1',voterId:'device-b'})]);assert.ok(votes.every(r=>r.status===200));
 assert.equal((await (await run({action:'pollGet'})).json()).poll.total,2);
 await run({action:'pollVote',id:'poll-1',option:'o1',voterId:'device-a'});assert.equal((await (await run({action:'pollGet'})).json()).poll.total,2);
 const claimA={action:'claim',code:'group2',no:1,name:'Alice',capability:'a'.repeat(64)},claimB={action:'claim',code:'group2',no:1,name:'Bob',capability:'b'.repeat(64)};
 const claims=await Promise.all([run(claimA),run(claimB)]);assert.deepEqual(claims.map(r=>r.status).sort(),[200,409]);
 const winner=claims[0].status===200?claimA:claimB,loser=claims[0].status===200?claimB:claimA;
 assert.equal((await run(winner)).status,200,'lost claim response is retryable');
 assert.equal((await run({...loser,action:'complete'})).status,403,'public code / other capability cannot mutate the winner');
 assert.equal((await run({...winner,action:'complete'})).status,200);
 assert.equal((await run({...winner,action:'undo'})).status,200);
 await Promise.all([run({action:'contribute',code:'group1',amount:3,name:'A'}),run({action:'contribute',code:'group1',amount:7,name:'B'})]);assert.equal((await (await run({action:'get',code:'group1'})).json()).org.toplam,10);
 assert.equal(old.get('_poll').counts.o1,0);
 await assert.rejects(firestoreStoreTransaction(db,legacy,async store=>{await store.setJSON('_poll',{bad:true});throw Error('rollback');}),/rollback/);
 assert.equal((await (await run({action:'pollGet'})).json()).poll.total,2);
 await firestoreStoreTransaction(db,legacy,store=>store.delete('_poll'));
 assert.equal((await (await run({action:'pollGet'})).json()).poll,null);
 await db.recursiveDelete(db.collection('elifaOrgRecords'));await db.recursiveDelete(db.collection('elifaOrgMeta'));
 });

test('Firestore hatim creation replay, recovery rotation, account binding and explicit account detach preserve state',{skip:!enabled},async()=>{
 const {db}=firebaseServices();await db.recursiveDelete(db.collection('elifaOrgRecords'));
 const legacy={get:async()=>null,list:async()=>({blobs:[]})};
 const transaction=work=>firestoreStoreTransaction(db,legacy,work);
 const run=(p,session={})=>transaction(store=>handleOrg(p,store,session));
 const capA='a'.repeat(64),capB='b'.repeat(64),creationToken='c'.repeat(64);
 const p={action:'create',creationToken,org:{type:'hatim',title:'Emulator-only hatim',items:Array.from({length:30},(_,i)=>({no:i+1}))}};
 try{
  const [r1,r2]=await Promise.all([run(p),run(p)]);assert.equal(r1.status,200);assert.equal(r2.status,200);
  const a=await r1.json(),b=await r2.json();assert.equal(a.code,b.code);assert.equal(a.adminToken,b.adminToken);
  const claim={action:'claim',code:a.code,no:1,name:'Local guest',capability:capA};
  assert.equal((await run(claim)).status,200);assert.equal((await run(claim)).status,200);
  assert.equal((await run({action:'bind',code:a.code,no:1,capability:capB},{uid:'alice'})).status,403);
  assert.equal((await run({action:'bind',code:a.code,no:1,capability:capA},{uid:'alice'})).status,200);
  assert.equal((await run({action:'complete',code:a.code,no:1},{uid:'alice'})).status,200);
  assert.equal((await run({action:'undo',code:a.code,no:1},{uid:'bob'})).status,403);
  assert.equal((await run({action:'complete',code:a.code,no:1,capability:capA})).status,403);
  const mine=await (await run({action:'myList'},{uid:'alice'})).json();assert.equal(mine.items[0].items[0].status,'okundu');
  await releaseAccountHatimOwnership('alice',{transaction});
  assert.equal((await run({action:'undo',code:a.code,no:1},{uid:'alice'})).status,409);
  assert.equal((await run({action:'undo',code:a.code,no:1,capability:capA})).status,200);
  assert.equal((await run({action:'issueRecovery',code:a.code,admin:a.adminToken,no:1,capability:capB})).status,200);
  assert.equal((await run({action:'complete',code:a.code,no:1,capability:capA})).status,403);
  assert.equal((await run({action:'complete',code:a.code,no:1,capability:capB})).status,200);
  assert.equal((await run({action:'issueRecovery',code:a.code,admin:a.adminToken,no:1,capability:'d'.repeat(64)})).status,200);
  assert.equal((await run({action:'issueRecovery',code:a.code,admin:a.adminToken,no:1,capability:capB})).status,409,'delayed old recovery cannot resurrect its retired capability');
 }finally{await db.recursiveDelete(db.collection('elifaOrgRecords'));}
});

test('real Auth + Firestore empty-hatim deletion protects owners and participants and never resurrects old records',{skip:!enabled},async t=>{
 const {auth,db}=firebaseServices(),users=[],old=new Map();
 await db.recursiveDelete(db.collection('elifaOrgRecords'));
 const legacy={get:async key=>structuredClone(old.get(key)??null),list:async()=>({blobs:[...old.keys()].map(key=>({key}))})};
 const transaction=work=>firestoreStoreTransaction(db,legacy,work);
 const handler=createOrgHandler({services:firebaseServices,transaction,environment:()=>({CONTEXT:'production'})});
 const raw=key=>transaction(store=>store.get(key,{type:'json'}));
 async function account(){
  const email='hatim-delete-'+Date.now()+'-'+users.length+'@example.test',password='Emulator-only-delete-9284!';
  const u=await auth.createUser({email,password,emailVerified:true});users.push(u.uid);
  const response=await fetch('http://'+process.env.FIREBASE_AUTH_EMULATOR_HOST+'/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-key',{
   method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password,returnSecureToken:true})});
  const data=await response.json();assert.ok(data.idToken);return {uid:u.uid,token:data.idToken};
 }
 const run=(user,p)=>handler(new Request('https://example.test/api/org',{method:'POST',headers:{origin:'https://example.test','content-type':'application/json',...(user?{authorization:'Bearer '+user.token}:{})},body:JSON.stringify({...p,...(user?{expectedUser:user.uid}:{})})}));
 const read=async(response,status=200)=>{assert.equal(response.status,status,await response.clone().text());return response.json();};
 const org=()=>({type:'hatim',title:'Emulator-only accidental hatim',items:Array.from({length:30},(_,i)=>({no:i+1}))});
 try{
  const owner=await account(),other=await account(),creation={action:'create',creationToken:'e'.repeat(64),org:{...org(),public:true}};
  await transaction(store=>store.setJSON('_config',{discoverEnabled:true}));
  const g=await read(await run(owner,creation)),del={action:'delete',code:g.code,admin:g.adminToken,confirmed:true};
  await t.test('copied organizer links cannot bypass bound account ownership or explicit confirmation',async()=>{
   await read(await run(null,del),403);await read(await run(other,del),403);
   await read(await run(owner,{...del,confirmed:false}),400);
   assert.equal((await raw(g.code)).ownerUid,owner.uid);
   assert.ok((await read(await run(owner,{action:'myList'}))).items.some(item=>item.code===g.code));
   assert.ok((await read(await run(owner,{action:'discoverList'}))).items.some(item=>item.code===g.code));
  });
  await t.test('concurrent owner deletion is retryable and removes every current index without legacy resurrection',async()=>{
   old.set(g.code,await raw(g.code));old.set('a_'+g.adminToken,g.code);
   const results=await Promise.all([run(owner,del),run(owner,del)]),data=await Promise.all(results.map(r=>read(r)));
   assert.ok(data.every(item=>item.ok&&item.deleted&&item.code===g.code));assert.ok(data.some(item=>item.replayed));
   assert.equal(await raw(g.code),null);assert.equal(await raw('a_'+g.adminToken),null);
   assert.equal((await raw(membershipKey(owner.uid))).codes.includes(g.code),false);
   assert.equal((await raw('_index')).some(item=>item.code===g.code),false);
   assert.equal((await read(await run(owner,{action:'myList'}))).items.some(item=>item.code===g.code),false);
   assert.equal((await read(await run(owner,{action:'discoverList'}))).items.some(item=>item.code===g.code),false);
   const tombstone=await raw(deletedHatimKey(g.code));assert.equal(tombstone.ownerUid,owner.uid);
   assert.equal(JSON.stringify(tombstone).includes(g.adminToken),false);
   await read(await run(null,{action:'get',code:g.code}),404);await read(await run(null,{action:'get',admin:g.adminToken}),404);
   await read(await run(owner,creation),409);
   await read(await run(null,{action:'claim',code:g.code,no:1,capability:'a'.repeat(64),name:'Too late'}),404);
   await read(await run(null,del),403);await read(await run(other,del),403);
  });
  await t.test('active, completed and released participant history blocks deletion and remains recoverable',async()=>{
   const used=await read(await run(owner,{action:'create',org:org()})),remove={action:'delete',code:used.code,confirmed:true};
   const personal={code:used.code,no:1,capability:'b'.repeat(64)};
   await read(await run(null,{action:'claim',...personal,name:'Emulator guest'}));
   for(const action of [null,'complete','release']){
    if(action)await read(await run(null,{action,...personal}));
    const before=await raw(used.code),response=await read(await run(owner,remove),409);
    assert.match(response.error,/arşivle/);assert.deepEqual(await raw(used.code),before);
    assert.equal(await raw(deletedHatimKey(used.code)),null);
   }
  });
  await t.test('a racing claim is either accepted and protected or observes the atomic deletion',async()=>{
   const race=await read(await run(owner,{action:'create',org:org()}));
   const claim={action:'claim',code:race.code,no:1,capability:'d'.repeat(64),name:'Racing guest'};
   const [claimed,deleted]=await Promise.all([run(null,claim),run(owner,{action:'delete',code:race.code,confirmed:true})]);
   if(claimed.status===200){
    assert.equal(deleted.status,409);assert.equal((await read(await run(null,{action:'get',code:race.code,capability:claim.capability}))).org.items[0].mine,true);
   }else{assert.equal(claimed.status,404);assert.equal(deleted.status,200);assert.equal(await raw(race.code),null);}
  });
 }finally{
  await db.recursiveDelete(db.collection('elifaOrgRecords'));
  for(const uid of users)await auth.deleteUser(uid).catch(()=>{});
 }
});
