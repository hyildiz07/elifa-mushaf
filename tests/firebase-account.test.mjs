import {test} from 'node:test';
import assert from 'node:assert/strict';
import {firebaseServices} from '../server/firebase.mjs';
import {firestoreStoreTransaction} from '../server/database.mjs';
import {handleOrg} from '../netlify/functions/org.mjs';
import {createAccountHandler} from '../server/account-handler.mjs';
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
   for(const path of ['elifaAccounts/'+a.uid,'elifaAccounts/'+b.uid,'elifaAccounts/'+a.uid+'/sync/current'])assert.equal((await fetch(base+path,{headers:{authorization:'Bearer '+a.token}})).status,403);
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
 const claims=await Promise.all([run({action:'claim',code:'group2',no:1,name:'A'}),run({action:'claim',code:'group2',no:1,name:'B'})]);assert.deepEqual(claims.map(r=>r.status).sort(),[200,400]);
 await Promise.all([run({action:'contribute',code:'group1',amount:3,name:'A'}),run({action:'contribute',code:'group1',amount:7,name:'B'})]);assert.equal((await (await run({action:'get',code:'group1'})).json()).org.toplam,10);
 assert.equal(old.get('_poll').counts.o1,0);
 await assert.rejects(firestoreStoreTransaction(db,legacy,async store=>{await store.setJSON('_poll',{bad:true});throw Error('rollback');}),/rollback/);
 assert.equal((await (await run({action:'pollGet'})).json()).poll.total,2);
 await firestoreStoreTransaction(db,legacy,store=>store.delete('_poll'));
 assert.equal((await (await run({action:'pollGet'})).json()).poll,null);
 await db.recursiveDelete(db.collection('elifaOrgRecords'));await db.recursiveDelete(db.collection('elifaOrgMeta'));
 });
