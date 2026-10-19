import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomBytes} from 'node:crypto';
import {firebaseServices} from '../server/firebase.mjs';
import {firestoreStoreTransaction} from '../server/database.mjs';
import {createOrgHandler} from '../netlify/functions/org.mjs';
import {createAccountHandler} from '../server/account-handler.mjs';
import {releaseAccountHatimOwnership} from '../server/hatim-account.mjs';
import {handleHatimComments} from '../server/hatim-comments.mjs';
import {closedAccountKey,deletedHatimKey} from '../server/hatim-access.mjs';

// Never use application credentials or a non-loopback Firebase endpoint.
const enabled=process.env.FIREBASE_PROJECT_ID==='demo-elifa-mushaf'&&
 /^127\.0\.0\.1:\d+$/.test(process.env.FIREBASE_AUTH_EMULATOR_HOST||'')&&
 /^127\.0\.0\.1:\d+$/.test(process.env.FIRESTORE_EMULATOR_HOST||'');
const secret=()=>randomBytes(32).toString('hex');
const hash=value=>createHash('sha256').update(value).digest('hex');

test('real local Auth + Firestore member hatims and comments preserve permissions and transactional history',{skip:!enabled},async t=>{
 const {auth,db}=firebaseServices(),users=[],suffix=Date.now()+'_'+randomBytes(4).toString('hex');
 // Separate collection: existing Firebase tests may clear elifaOrgRecords.
 const records=db.collection('elifaCommentAudit_'+suffix),legacy={get:async()=>null,list:async()=>({blobs:[]})};
 const transaction=work=>firestoreStoreTransaction(db,legacy,work,{records});
 const handler=createOrgHandler({services:firebaseServices,transaction,environment:()=>({CONTEXT:'production'})});
 const raw=key=>transaction(store=>store.get(key,{type:'json'}));
 const all=async()=>{const snapshot=await records.get();return snapshot.docs.map(doc=>doc.data());};
 async function account(verified=true){
  const email='comments-'+suffix+'-'+users.length+'@example.test',password='Only-local-emulator-9284!';
  const user=await auth.createUser({email,password,emailVerified:verified});users.push(user.uid);
  const response=await fetch('http://'+process.env.FIREBASE_AUTH_EMULATOR_HOST+'/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-key',{
   method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email,password,returnSecureToken:true})});
  const data=await response.json();assert.ok(data.idToken);return {uid:user.uid,token:data.idToken};
 }
 const request=(user,p,url='https://example.test/api/org')=>new Request(url,{method:'POST',headers:{origin:'https://example.test','content-type':'application/json',...(user?{authorization:'Bearer '+user.token}:{})},body:JSON.stringify({...p,...(user?{expectedUser:user.uid}:{})})});
 const run=(user,p)=>handler(request(user,p));
 const read=async(response,status=200)=>{assert.equal(response.status,status,await response.clone().text());return response.json();};
 const create=(user,extra={})=>run(user,{action:'create',creationToken:secret(),org:{type:'hatim',title:'Only local comment audit',items:Array.from({length:30},(_,i)=>({no:i+1})),...extra}}).then(response=>read(response));
 const post=(user,code,extra={})=>run(user,{action:'commentCreate',code,operationId:secret(),name:'Local member',text:'Local teaching note',...extra});
 try{
  const owner=await account(),writer=await account(),other=await account(),unverified=await account(false);
  await transaction(store=>store.setJSON('_config',{discoverEnabled:true}));
  const group=await create(owner,{public:true});

  await t.test('public discovery and new public participation require the current verified account, not client flags',async()=>{
   assert.equal((await read(await run(null,{action:'discoverList'}),401)).errorCode,'AUTH_REQUIRED');
   assert.equal((await read(await run(unverified,{action:'discoverList'}),403)).errorCode,'EMAIL_UNVERIFIED');
   assert.ok((await read(await run(owner,{action:'discoverList'}))).items.some(item=>item.code===group.code));
   await read(await run(null,{action:'create',org:{type:'hatim',title:'Guest public',public:true,items:Array.from({length:30},(_,i)=>({no:i+1}))}}),401);
   await read(await run(unverified,{action:'create',org:{type:'hatim',title:'Unverified public',public:true,items:Array.from({length:30},(_,i)=>({no:i+1}))}}),403);
   assert.equal((await read(await run(null,{action:'get',code:group.code}),401)).errorCode,'AUTH_REQUIRED');
   assert.equal((await read(await run(unverified,{action:'get',code:group.code}),403)).errorCode,'EMAIL_UNVERIFIED');
   await read(await run(owner,{action:'get',code:group.code}));
   const claim={action:'claim',code:group.code,no:1,name:'Guest claim',capability:secret(),emailVerified:true};
   await read(await run(null,claim),401);await read(await run(unverified,claim),403);
   await read(await run(writer,claim));
   const staleToken=await account();await auth.updateUser(staleToken.uid,{emailVerified:false});
   await read(await run(staleToken,{action:'discoverList'}),403);
   const mismatched=request(owner,{action:'discoverList'}),body=await mismatched.json();body.expectedUser=writer.uid;
   await read(await handler(new Request(mismatched.url,{method:'POST',headers:mismatched.headers,body:JSON.stringify(body)})),409);
  });

  await t.test('a legacy guest keeps the existing personal claim but cannot take another public juz or publish a new public group',async()=>{
   const old=await create(null),capability=secret(),personal={code:old.code,no:1,capability};
   await read(await run(null,{action:'claim',...personal,name:'Earlier guest'}));
   // Existing public records predate the new member-only discovery policy.
   await transaction(async store=>{const org=await store.get(old.code);org.public=true;await store.setJSON(old.code,org);});
   await read(await run(null,{action:'get',code:old.code}),401);
   const own=await read(await run(null,{action:'get',...personal}));assert.equal(own.org.items[0].mine,true);
   await read(await run(null,{action:'get',code:old.code,no:1,capability:secret()}),401);
   const admin=await read(await run(null,{action:'get',code:old.code,admin:old.adminToken}));assert.equal(admin.org.isAdmin,true);
   await read(await run(null,{action:'claim',...personal,name:'Earlier guest'}));
   await read(await run(null,{action:'complete',...personal}));await read(await run(null,{action:'undo',...personal}));
   await read(await run(null,{action:'claim',code:old.code,no:2,name:'New guest',capability:secret()}),401);
   await read(await run(null,{action:'publish',code:old.code,admin:old.adminToken,public:true}),401);
   await read(await run(null,{action:'commentSettings',code:old.code,admin:old.adminToken,closed:true}));
   await read(await run(null,{action:'commentList',code:old.code,capability}),401);
  });

  const operationId=secret(),firstPayload={action:'commentCreate',code:group.code,operationId,name:'Writer nickname',text:'Only local root comment'};
  const [first,retry]=await Promise.all([run(writer,firstPayload),run(writer,firstPayload)]);
  const firstData=await first.json(),retryData=await retry.json();
  assert.deepEqual([first.status,retry.status].sort(),[200,201]);assert.equal(firstData.comment.id,retryData.comment.id);
  const root=firstData.comment;
  const reply=(await read(await post(other,group.code,{parentId:root.id,text:'Only local reply'}),201)).comment;

  await t.test('comments expose no private identity; replay is exact and cannot change the prior operation',async()=>{
   const listed=await read(await run(owner,{action:'commentList',code:group.code}));
   assert.equal(listed.commentCount,2);assert.equal(listed.rootCommentCount,1);assert.equal(listed.comments.length,1);
   assert.equal(JSON.stringify(listed).includes(writer.uid),false);assert.equal(JSON.stringify(listed).includes('@example.test'),false);
   assert.equal(listed.comments[0].own,false);assert.equal(listed.comments[0].canEdit,false);
   const own=await read(await run(writer,{action:'commentList',code:group.code}));assert.equal(own.comments[0].own,true);
   await read(await run(writer,{...firstPayload,text:'Changed replay'}),409);
   assert.equal((await read(await run(writer,firstPayload))).replayed,true);
   await read(await post(null,group.code),401);await read(await post(unverified,group.code),403);
   const base='http://'+process.env.FIRESTORE_EMULATOR_HOST+'/v1/projects/demo-elifa-mushaf/databases/(default)/documents/';
   const recordId=Buffer.from('_hc_'+group.code+'_c_'+root.id).toString('base64url');
   assert.equal((await fetch(base+records.id+'/'+recordId,{headers:{authorization:'Bearer '+writer.token}})).status,403);
  });

  await t.test('foreign edits/deletion and cross-hatim or nested replies are rejected without changing either record',async()=>{
   const before=await raw('_hc_'+group.code+'_c_'+root.id);
   await read(await run(other,{action:'commentEdit',code:group.code,id:root.id,text:'Foreign change'}),403);
   await read(await run(other,{action:'commentDelete',code:group.code,id:root.id}),403);
   assert.deepEqual(await raw('_hc_'+group.code+'_c_'+root.id),before);
   await read(await post(owner,group.code,{parentId:reply.id}),409);
   const second=await create(owner);
   await read(await post(owner,second.code,{parentId:root.id}),409);
   await read(await run(owner,{action:'commentReplies',code:second.code,parentId:root.id}),404);
   await read(await run(owner,{action:'commentEdit',code:second.code,id:root.id,text:'Wrong hatim'}),404);
   await read(await run(writer,{action:'commentEdit',code:group.code,id:root.id,text:'Corrected by author'}));
   await read(await run(writer,{action:'commentCreate',code:group.code,operationId:secret(),name:'X',text:'Bad short name'}),400);
  });

  await t.test('moderation hides text from ordinary members, reports replay once, and author deletion preserves replies',async()=>{
   await read(await run(writer,{action:'commentHide',code:group.code,id:root.id,hidden:true}),403);
   await read(await run(owner,{action:'commentHide',code:group.code,id:root.id,hidden:true}));
   const publicList=await read(await run(other,{action:'commentList',code:group.code}));assert.equal(publicList.comments[0].hidden,true);assert.equal(JSON.stringify(publicList).includes('Corrected by author'),false);
   const admin=await read(await run(owner,{action:'commentList',code:group.code}));assert.equal(admin.comments[0].moderatedText,'Corrected by author');
   const report={action:'commentReport',code:group.code,id:root.id,reason:'Only local report'};
   await read(await run(other,report));assert.equal((await read(await run(other,report))).replayed,true);
   await read(await run(writer,{action:'commentReports',code:group.code}),403);
   assert.equal((await read(await run(owner,{action:'commentReports',code:group.code}))).reports.length,1);
   await read(await run(writer,{action:'commentDelete',code:group.code,id:root.id}));
   const tombstone=await raw('_hc_'+group.code+'_c_'+root.id);assert.equal(tombstone.text,'');assert.equal(tombstone.name,'');assert.equal(tombstone.deleted,true);
   assert.equal((await read(await run(owner,{action:'commentReplies',code:group.code,parentId:root.id}))).comments[0].id,reply.id);
   await read(await run(writer,{action:'commentDelete',code:group.code,id:root.id}));
  });

  await t.test('Firestore prefix pagination is bounded, stable and isolated for both root comments and replies',async()=>{
   const paged=await create(owner),uid=(await auth.verifyIdToken(owner.token,true)).uid;
   const session={uid,emailVerified:(await auth.getUser(uid)).emailVerified};
   let clock=Date.now()-100000000;
   // Only the clock is injected to exercise 42 records without real waiting;
   // the real token/authorization boundary is tested through handler above.
   const engine=p=>transaction(async store=>handleHatimComments({code:paged.code,...p},store,session,await store.get(paged.code),true,{now:()=>clock+=601000}));
   const roots=[];for(let i=0;i<21;i++)roots.push((await read(await engine({action:'commentCreate',operationId:secret(),name:'Pager',text:'Root '+i}),201)).comment.id);
   const replies=[];for(let i=0;i<21;i++)replies.push((await read(await engine({action:'commentCreate',operationId:secret(),parentId:roots[0],name:'Pager',text:'Reply '+i}),201)).comment.id);
   for(const [action,expected,extra]of [['commentList',roots,{}],['commentReplies',replies,{parentId:roots[0]}]]){
    const page1=await read(await engine({action,...extra}));assert.equal(page1.comments.length,20);assert.ok(page1.nextCursor);
    const page2=await read(await engine({action,...extra,cursor:page1.nextCursor}));assert.equal(page2.comments.length,1);assert.equal(page2.nextCursor,null);
    assert.deepEqual([...page1.comments,...page2.comments].map(c=>c.id),expected.toReversed());
    await read(await engine({action,...extra,cursor:'not-a-comment'}),400);
   }
   assert.equal((await read(await run(writer,{action:'commentList',code:group.code}))).comments.some(c=>roots.includes(c.id)),false);
  });

  await t.test('closing comments and empty-hatim deletion serialize against concurrent posts without orphaning accepted history',async()=>{
   const author=await account(),closed=await create(owner);
   const [posted,closedResponse]=await Promise.all([post(author,closed.code),run(owner,{action:'commentSettings',code:closed.code,closed:true})]);
   assert.equal(closedResponse.status,200);assert.ok([201,409].includes(posted.status));
   assert.equal((await read(await run(owner,{action:'commentList',code:closed.code}))).canComment,false);
   await read(await post(author,closed.code),409);
   const raceAuthor=await account(),race=await create(owner);
   const [postedRace,deleted]=await Promise.all([post(raceAuthor,race.code),run(owner,{action:'delete',code:race.code,confirmed:true})]);
   if(postedRace.status===201){assert.equal(deleted.status,409);assert.equal((await raw(race.code)).commentCount,1);assert.equal(await raw(deletedHatimKey(race.code)),null);}
   else{assert.equal(postedRace.status,404);assert.equal(deleted.status,200);assert.equal(await raw(race.code),null);}
  });

  await t.test('explicit account deletion closes in-flight writers and erases comment identity, text, reports and retry records',async()=>{
   const erased=await account(),keep=await account(),eraseGroup=await create(owner),op=secret();
   const own=(await read(await post(erased,eraseGroup.code,{operationId:op,name:'Erase this nickname',text:'Erase this private draft'}),201)).comment;
   const child=(await read(await post(keep,eraseGroup.code,{parentId:own.id,text:'Keep this other member reply'}),201)).comment;
   await read(await run(erased,{action:'commentReport',code:eraseGroup.code,id:child.id,reason:'Erase this report'}));
   const deletion=createAccountHandler({services:firebaseServices,detachMemberships:uid=>releaseAccountHatimOwnership(uid,{transaction})});
   const result=await deletion(request(erased,{action:'deleteAccount',confirmation:'DELETE'},'https://example.test/api/account'));await read(result);
   assert.ok(await raw(closedAccountKey(erased.uid)));
   const erasedRaw=await raw('_hc_'+eraseGroup.code+'_c_'+own.id);assert.equal(erasedRaw.ownerUid,null);assert.equal(erasedRaw.text,'');assert.equal(erasedRaw.name,'');assert.equal(erasedRaw.deleted,true);
   const surviving=await read(await run(keep,{action:'commentReplies',code:eraseGroup.code,parentId:own.id}));assert.equal(surviving.comments[0].id,child.id);assert.equal(surviving.comments[0].text,'Keep this other member reply');
   const active=(await all()).filter(row=>!row.deleted);const uidHash=hash(erased.uid);
   assert.equal(active.some(row=>row.key.startsWith('_hcu_'+uidHash+'_')||row.key==='_hcu_rate_'+uidHash),false);
   assert.equal(active.some(row=>row.key.startsWith('_hc_'+eraseGroup.code+'_o_'+uidHash+'_')),false);
   assert.equal(active.some(row=>row.value.includes('Erase this nickname')||row.value.includes('Erase this private draft')||row.value.includes('Erase this report')),false);
   await read(await run(erased,{action:'commentList',code:eraseGroup.code}),401);
  });

  await t.test('an authenticated post racing account deletion is either rejected or included in erasure',async()=>{
   const racing=await account(),raceGroup=await create(owner);
   const deletion=createAccountHandler({services:firebaseServices,detachMemberships:uid=>releaseAccountHatimOwnership(uid,{transaction})});
   const [posted,deleted]=await Promise.all([
    post(racing,raceGroup.code,{name:'Race identity',text:'Race text must not survive'}),
    deletion(request(racing,{action:'deleteAccount',confirmation:'DELETE'},'https://example.test/api/account'))
   ]);
   await read(deleted);assert.ok([201,401,409].includes(posted.status),await posted.clone().text());
   assert.ok(await raw(closedAccountKey(racing.uid)));
   const active=(await all()).filter(row=>!row.deleted);
   assert.equal(active.some(row=>row.value.includes('Race identity')||row.value.includes('Race text must not survive')),false);
   assert.equal(active.some(row=>row.key.startsWith('_hcu_'+hash(racing.uid)+'_')),false);
  });

  await t.test('more than twenty comment records are erased across retryable batches after a partial cleanup failure',async()=>{
   // The pagination author owns 42 records, spanning three 20-record batches.
   const prefix='_hcu_'+hash(owner.uid)+'_';let batches=0;
   const flakyTransaction=work=>transaction(store=>work({...store,query:async(query,options)=>{
    if(query===prefix&&++batches===2)throw Error('Injected local cleanup failure');
    return store.query(query,options);
   }}));
   const failed=createAccountHandler({services:firebaseServices,detachMemberships:uid=>releaseAccountHatimOwnership(uid,{transaction:flakyTransaction})});
   await read(await failed(request(owner,{action:'deleteAccount',confirmation:'DELETE'},'https://example.test/api/account')),503);
   assert.equal((await auth.getUser(owner.uid)).uid,owner.uid,'identity survives a partial cleanup so the user can retry');
   assert.equal((await db.collection('elifaAccounts').doc(owner.uid).get()).data().deleting,true);
   const remaining=(await all()).filter(row=>!row.deleted&&row.key.startsWith(prefix));assert.equal(remaining.length,22);
   await read(await post(owner,group.code),409,'closed UID must not create new records while deletion awaits retry');
   const retry=createAccountHandler({services:firebaseServices,detachMemberships:uid=>releaseAccountHatimOwnership(uid,{transaction})});
   await read(await retry(request(owner,{action:'deleteAccount',confirmation:'DELETE'},'https://example.test/api/account')));
   const active=(await all()).filter(row=>!row.deleted);
   assert.equal(active.some(row=>row.key.startsWith(prefix)||row.key==='_hcu_rate_'+hash(owner.uid)),false);
   const authored=active.filter(row=>row.key.startsWith('_hc_')&&row.key.includes('_c_')).map(row=>JSON.parse(row.value));
   assert.equal(authored.some(comment=>comment.ownerUid===owner.uid),false);
  });
 }finally{
  await db.recursiveDelete(records);
  for(const uid of users){await db.recursiveDelete(db.collection('elifaAccounts').doc(uid));await auth.deleteUser(uid).catch(()=>{});}
 }
});
