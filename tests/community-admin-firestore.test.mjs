import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomBytes} from 'node:crypto';
import {firebaseServices} from '../server/firebase.mjs';
import {firestoreStoreTransaction} from '../server/database.mjs';
import {createOrgHandler} from '../netlify/functions/org.mjs';
import {createCommunityAdminHandler} from '../netlify/functions/community-admin.mjs';
import {COMMUNITY_OWNER_EMAIL} from '../server/community-admin.mjs';
import {createAccountHandler} from '../server/account-handler.mjs';
import {releaseAccountHatimOwnership} from '../server/hatim-account.mjs';
import {handleHatimComments} from '../server/hatim-comments.mjs';
import {closedAccountKey} from '../server/hatim-access.mjs';

const enabled=process.env.FIREBASE_PROJECT_ID==='demo-elifa-mushaf'&&
 /^127\.0\.0\.1:\d+$/.test(process.env.FIREBASE_AUTH_EMULATOR_HOST||'')&&
 /^127\.0\.0\.1:\d+$/.test(process.env.FIRESTORE_EMULATOR_HOST||'');
const hash=value=>createHash('sha256').update(value).digest('hex');
const secret=()=>randomBytes(32).toString('hex');

test('real loopback Auth + Firestore community administration enforces owner, role and privacy boundaries',{skip:!enabled},async t=>{
 const {auth,db}=firebaseServices(),users=[],suffix=Date.now()+'_'+randomBytes(4).toString('hex');
 const records=db.collection('elifaAdminAudit_'+suffix),legacy={get:async()=>null,list:async()=>({blobs:[]})};
 const transaction=work=>firestoreStoreTransaction(db,legacy,work,{records});
 const environment=()=>({CONTEXT:'production'}),admin=createCommunityAdminHandler({services:firebaseServices,transaction,environment});
 const orgHandler=createOrgHandler({services:firebaseServices,transaction,environment});
 const accountHandler=createAccountHandler({services:firebaseServices,detachMemberships:uid=>releaseAccountHatimOwnership(uid,{transaction})});
 const raw=key=>transaction(store=>store.get(key,{type:'json'}));
 const all=async()=>{const docs=await records.get();return docs.docs.map(doc=>doc.data()).filter(row=>!row.deleted);};
 async function account(verified=true,email){
  email=email||'admin-local-'+suffix+'-'+users.length+'@example.test';const password='Only-emulator-admin-9284!';
  const user=await auth.createUser({email,password,emailVerified:verified});users.push(user.uid);
  const response=await fetch('http://'+process.env.FIREBASE_AUTH_EMULATOR_HOST+'/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-key',{
   method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email,password,returnSecureToken:true})});
  const body=await response.json();assert.ok(body.idToken);return {uid:user.uid,email,token:body.idToken};
 }
 const request=(user,p,path='community-admin')=>new Request('https://example.test/api/'+path,{method:'POST',headers:{origin:'https://example.test','content-type':'application/json',...(user?{authorization:'Bearer '+user.token}:{})},body:JSON.stringify({...p,...(user?{expectedUser:user.uid}:{})})});
 const run=(user,p)=>admin(request(user,p)),org=(user,p)=>orgHandler(request(user,p,'org'));
 const read=async(response,status=200)=>{assert.equal(response.status,status,await response.clone().text());return response.json();};
 const makeOrg=(user,extra={})=>org(user,{action:'create',creationToken:secret(),org:{type:'hatim',title:'Only local admin fixture',items:Array.from({length:30},(_,i)=>({no:i+1})),...extra}}).then(response=>read(response));
 const post=(user,code,extra={})=>org(user,{action:'commentCreate',code,operationId:secret(),name:'Private nickname',text:'Only local original text',...extra});
 const grant=(owner,user,role)=>run(owner,{action:'grantRole',email:user.email,role}).then(response=>read(response));
 try{
  // This mailbox exists solely in the loopback Auth emulator, never in production.
  const owner=await account(true,COMMUNITY_OWNER_EMAIL),administrator=await account(),moderator=await account(),member=await account(),replyAuthor=await account(),unverified=await account(false);
  await transaction(store=>store.setJSON('_config',{discoverEnabled:true}));
  await t.test('real token verification plus current verified Auth metadata controls the first permanent owner UID',async()=>{
   await read(await run(null,{action:'status'}),401);
   assert.equal((await read(await run(member,{action:'status',email:COMMUNITY_OWNER_EMAIL,role:'owner',emailVerified:true}))).role,null);
   assert.equal(await raw('_ca_owner'),null);
   await auth.updateUser(owner.uid,{emailVerified:false});await read(await run(owner,{action:'status'}),403);assert.equal(await raw('_ca_owner'),null);
   await auth.updateUser(owner.uid,{emailVerified:true});assert.equal((await read(await run(owner,{action:'status'}))).role,'owner');
   assert.equal((await raw('_ca_owner')).uid,owner.uid);
  });

  await t.test('only the owner grants verified existing accounts by exact email and client-supplied target identity cannot override resolution',async()=>{
   await read(await run(owner,{action:'grantRole',email:unverified.email,role:'admin'}),409);
   await read(await run(owner,{action:'grantRole',email:'missing-'+suffix+'@example.test',role:'admin'}),404);
   await read(await run(owner,{action:'grantRole',email:administrator.email,role:'owner'}),400);
   const assigned=await read(await run(owner,{action:'grantRole',email:administrator.email,targetUid:member.uid,role:'admin'}));assert.equal(assigned.user.uid,administrator.uid);
   await grant(owner,moderator,'moderator');assert.equal(await raw('_ca_role_'+hash(member.uid)),null);
   for(const user of [administrator,moderator])for(const action of ['grantRole','revokeRole','roles'])await read(await run(user,{action,email:member.email,targetUid:member.uid,role:'admin'}),403);
   assert.equal((await read(await run(owner,{action:'roles'}))).roles.length,2);
   await read(await run(moderator,{action:'userLookup',email:member.email}),403);
   const target=await read(await run(administrator,{action:'userLookup',email:member.email}));assert.equal(target.user.uid,member.uid);
   const minimal=await read(await run(moderator,{action:'restrictionStatus',targetUid:member.uid}));assert.deepEqual(minimal.user,{uid:member.uid});assert.equal(JSON.stringify(minimal).includes(member.email),false);
  });

  const privateGroup=await makeOrg(member),personal={code:privateGroup.code,no:1,capability:secret()};
  await read(await org(member,{action:'claim',...personal,name:'Existing member claim'}));
  const root=(await read(await post(member,privateGroup.code),201)).comment;
  const child=(await read(await post(replyAuthor,privateGroup.code,{parentId:root.id,text:'Keep another author reply'}),201)).comment;
  let reportId;

  await t.test('global queues include authorized private-hatim moderation while ordinary members receive no privileged identities',async()=>{
   for(const action of ['comments','reports','userLookup','roles'])await read(await run(member,{action,email:moderator.email}),403);
   const global=await read(await run(moderator,{action:'comments'}));assert.ok(global.comments.some(comment=>comment.code===privateGroup.code&&comment.id===root.id&&comment.ownerUid===member.uid));
   await read(await org(replyAuthor,{action:'commentReport',code:privateGroup.code,id:root.id,reason:'Only local report reason'}));
   const reported=(await read(await run(moderator,{action:'reports'}))).reports.find(report=>report.code===privateGroup.code&&report.commentId===root.id);assert.ok(reported);reportId=reported.id;
   assert.equal(Object.hasOwn(reported,'ownerUid'),false);assert.equal(JSON.stringify(reported).includes(replyAuthor.email),false);
   const local=await read(await org(replyAuthor,{action:'commentList',code:privateGroup.code}));assert.equal(JSON.stringify(local).includes(member.uid),false);assert.equal(JSON.stringify(local).includes(member.email),false);
   const base='http://'+process.env.FIRESTORE_EMULATOR_HOST+'/v1/projects/demo-elifa-mushaf/databases/(default)/documents/';
   assert.equal((await fetch(base+records.id+'/'+Buffer.from('_ca_owner').toString('base64url'),{headers:{authorization:'Bearer '+member.token}})).status,403);
  });

  await t.test('moderator edits are explicitly marked, author rights remain separate, and moderation deletion preserves replies',async()=>{
   await read(await org(replyAuthor,{action:'commentEdit',code:privateGroup.code,id:root.id,text:'Foreign edit'}),403);
   await read(await run(moderator,{action:'moderateComment',code:privateGroup.code,id:root.id,operation:'edit',text:'Edited by a moderator'}));
   assert.equal((await read(await run(moderator,{action:'moderateComment',code:privateGroup.code,id:root.id,operation:'edit',text:'Edited by a moderator'}))).replayed,true);
   const visible=await read(await org(member,{action:'commentList',code:privateGroup.code}));assert.equal(visible.comments[0].editedByAdmin,true);assert.equal(visible.comments[0].text,'Edited by a moderator');
   await read(await run(moderator,{action:'moderateComment',code:privateGroup.code,id:root.id,operation:'hide'}));
   assert.equal((await read(await org(member,{action:'commentList',code:privateGroup.code}))).comments[0].hidden,true);
   await read(await run(moderator,{action:'moderateComment',code:privateGroup.code,id:root.id,operation:'show'}));
   await read(await run(moderator,{action:'moderateComment',code:privateGroup.code,id:root.id,operation:'delete'}));
   const removed=await raw('_hc_'+privateGroup.code+'_c_'+root.id);assert.equal(removed.deleted,true);assert.equal(removed.text,'');assert.equal(removed.name,'');
   assert.equal((await read(await org(member,{action:'commentReplies',code:privateGroup.code,parentId:root.id}))).comments[0].id,child.id);
   await read(await run(moderator,{action:'resolveReport',code:privateGroup.code,id:reportId}));
   const firstAudit=(await all()).filter(row=>row.key.startsWith('_ca_audit_')).length,firstRate=await raw('_ca_rate_'+hash(moderator.uid));
   assert.equal((await read(await run(moderator,{action:'resolveReport',code:privateGroup.code,id:reportId}))).replayed,true);
   assert.equal((await all()).filter(row=>row.key.startsWith('_ca_audit_')).length,firstAudit);assert.deepEqual(await raw('_ca_rate_'+hash(moderator.uid)),firstRate);
   assert.equal((await read(await run(moderator,{action:'reports'}))).reports.some(report=>report.id===reportId),false);
  });

  await t.test('revoking a role before a queued transaction prevents the already authenticated request from using stale privileges',async()=>{
   let entered,release;const ready=new Promise(resolve=>entered=resolve),gate=new Promise(resolve=>release=resolve);
   const queued=createCommunityAdminHandler({services:firebaseServices,environment,transaction:async work=>{entered();await gate;return transaction(work);}});
   const pending=queued(request(moderator,{action:'comments'}));await ready;
   await read(await run(owner,{action:'revokeRole',targetUid:moderator.uid}));release();await read(await pending,403);
   assert.equal((await read(await run(moderator,{action:'status'}))).role,null);await grant(owner,moderator,'moderator');
   await auth.updateUser(moderator.uid,{emailVerified:false});await read(await run(moderator,{action:'comments'}),403);await auth.updateUser(moderator.uid,{emailVerified:true});
  });

  await t.test('owner and role holders are protected and moderator-only restrictions cannot escalate to community bans',async()=>{
   for(const user of [owner,administrator,moderator])await read(await run(administrator,{action:'setRestriction',targetUid:user.uid,communityBanned:true}),409);
   await read(await run(moderator,{action:'setRestriction',targetUid:member.uid,communityBanned:true}),403);
   await read(await run(moderator,{action:'setRestriction',targetUid:member.uid,commentsRestricted:true}));
   const status=await read(await run(moderator,{action:'restrictionStatus',targetUid:member.uid}));assert.equal(status.restriction.commentsRestricted,true);assert.equal(status.restriction.communityBanned,false);
   await read(await post(member,privateGroup.code),403);
   await read(await run(moderator,{action:'setRestriction',targetUid:member.uid,commentsRestricted:false}));
   const closing=await account();await transaction(store=>store.setJSON(closedAccountKey(closing.uid),{closedAt:Date.now()}));
   await read(await run(owner,{action:'grantRole',email:closing.email,role:'admin'}),409);
   await read(await run(administrator,{action:'setRestriction',targetUid:closing.uid,communityBanned:true}),409);
   assert.equal(await raw('_ca_role_'+hash(closing.uid)),null);assert.equal(await raw('_ca_restrict_'+hash(closing.uid)),null);
  });

  await t.test('social bans preserve existing claims, reading, personal backups and voluntary account deletion',async()=>{
   await read(await run(administrator,{action:'setRestriction',targetUid:member.uid,communityBanned:true}));
   await read(await org(member,{action:'create',org:{type:'hatim',title:'Blocked creation',items:Array.from({length:30},(_,i)=>({no:i+1}))}}),403);
   await read(await org(member,{action:'claim',code:privateGroup.code,no:2,name:'Blocked new claim',capability:secret()}),403);
   await read(await post(member,privateGroup.code),403);
   const current=await read(await org(member,{action:'get',code:privateGroup.code}));assert.equal(current.org.items[0].mine,true);
   await read(await org(member,{action:'complete',...personal}));await read(await org(member,{action:'undo',...personal}));
   await read(await org(member,{action:'returnCode',...personal}));
   const backup={elifa:'yedek',v:1,veri:{notes:'{"1:1":"My own notes"}'}};
   const saved=await read(await accountHandler(request(member,{action:'save',payload:backup},'account')),201);
   assert.deepEqual((await read(await accountHandler(request(member,{action:'restore',id:saved.id},'account')))).payload.veri,backup.veri);
   assert.equal((await auth.getUser(member.uid)).disabled,false,'a social restriction must not disable Firebase identity');
   await read(await accountHandler(request(member,{action:'deleteAccount',confirmation:'DELETE'},'account')));
   assert.equal(await raw('_ca_restrict_'+hash(member.uid)),null);await read(await org(null,{action:'complete',...personal}));
  });

  await t.test('global comment pagination is bounded and audit metadata contains no raw email, message or bearer secret',async()=>{
   const paged=await makeOrg(owner),session={uid:owner.uid,emailVerified:true};let clock=Date.now()-100000000;
   const ids=[];for(let i=0;i<21;i++){
    const data=await read(await transaction(async store=>handleHatimComments({action:'commentCreate',code:paged.code,operationId:secret(),name:'Page author',text:'Page message '+i},store,session,await store.get(paged.code),true,{now:()=>clock+=601000})),201);ids.push(data.comment.id);
   }
   const idsFound=[];let cursor=null,pages=0;
   do{const page=await read(await run(moderator,{action:'comments',...(cursor?{cursor}:{})}));assert.ok(page.comments.length<=20);idsFound.push(...page.comments.filter(row=>row.code===paged.code).map(row=>row.id));cursor=page.nextCursor;assert.ok(++pages<6);}while(cursor);
   assert.deepEqual(idsFound,ids.toReversed());assert.ok(pages>=2);
   await read(await run(moderator,{action:'comments',cursor:'_ca_role_not-a-comment-cursor'}),400);
   const audit=(await all()).filter(row=>row.key.startsWith('_ca_audit_'));assert.ok(audit.length>=5);
   const text=JSON.stringify(audit);for(const sensitive of [COMMUNITY_OWNER_EMAIL,administrator.email,moderator.email,owner.token,'Only local original text','Edited by a moderator','Only local report reason'])assert.equal(text.includes(sensitive),false,'Audit must not contain personal content or credentials');
  });

  await t.test('role cleanup and the owner UID lock survive account deletion without granting a recycled owner email',async()=>{
   await read(await accountHandler(request(moderator,{action:'deleteAccount',confirmation:'DELETE'},'account')));assert.equal(await raw('_ca_role_'+hash(moderator.uid)),null);
   await read(await accountHandler(request(owner,{action:'deleteAccount',confirmation:'DELETE'},'account')));
   assert.equal((await raw('_ca_owner')).uid,owner.uid);assert.equal(await raw('_ca_role_'+hash(owner.uid)),null);
   const audit=(await all()).filter(row=>row.key.startsWith('_ca_audit_')).map(row=>JSON.parse(row.value));assert.equal(audit.some(row=>row.actor===hash(owner.uid)||row.target===hash(owner.uid)),false);
   const replacement=await account(true,COMMUNITY_OWNER_EMAIL);assert.notEqual(replacement.uid,owner.uid);
   assert.equal((await read(await run(replacement,{action:'status'}))).role,null);
   await read(await run(replacement,{action:'grantRole',email:administrator.email,role:'moderator'}),403);
  });
 }finally{
  await db.recursiveDelete(records);
  for(const uid of users){await db.recursiveDelete(db.collection('elifaAccounts').doc(uid));await auth.deleteUser(uid).catch(()=>{});}
 }
});
