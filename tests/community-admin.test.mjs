import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createCommunityAdminHandler} from '../netlify/functions/community-admin.mjs';
import {COMMUNITY_OWNER_EMAIL,cleanupCommunityAccount} from '../server/community-admin.mjs';
import {handleOrg} from '../netlify/functions/org.mjs';
import {releaseAccountHatimOwnership} from '../server/hatim-account.mjs';
import {closedAccountKey} from '../server/hatim-access.mjs';

async function body(response,status=200){assert.equal(response.status,status,await response.clone().text());return response.json();}
test('the published administration API rewrite wins before the SPA fallback and matches the function route',()=>{
 const redirects=readFileSync(new URL('../_redirects',import.meta.url),'utf8').split(/\r?\n/).map(line=>line.trim()).filter(line=>line&&!line.startsWith('#')).map(line=>line.split(/\s+/));
 const first=redirects.find(([from])=>from==='/api/community-admin'||from==='/*');
 assert.deepEqual(first,['/api/community-admin','/.netlify/functions/community-admin','200']);
 assert.match(readFileSync(new URL('../netlify/functions/community-admin.mjs',import.meta.url),'utf8'),/path:\s*['"]\/api\/community-admin['"]/);
});
function fixture(){
 let rows=new Map(),queue=Promise.resolve();const calls=[];
 const users=new Map(['owner','admin','mod','one','two'].map(uid=>[uid,{uid,email:uid==='owner'?COMMUNITY_OWNER_EMAIL:uid+'@example.test',emailVerified:true,disabled:false,displayName:uid}]));
 const transaction=work=>{
  const job=queue.then(async()=>{
   const draft=structuredClone(rows),store={get:async key=>structuredClone(draft.get(key)??null),setJSON:async(key,value)=>draft.set(key,structuredClone(value)),set:async(key,value)=>draft.set(key,value),delete:async key=>draft.delete(key),
    query:async(prefix,{cursor=null,limit=20,reverse=false}={})=>{
     calls.push({prefix,cursor,limit,reverse});const all=[...draft].filter(([key])=>key.startsWith(prefix)&&(!cursor||(reverse?key<cursor:key>cursor))).sort(([a],[b])=>reverse?b.localeCompare(a):a.localeCompare(b));
     const page=all.slice(0,limit);return {entries:page.map(([key,value])=>({key,value:structuredClone(value)})),nextCursor:all.length>limit?page.at(-1)[0]:null};
    }};
   const result=await work(store);rows=draft;return result;
  });queue=job.catch(()=>{});return job;
 };
 const auth={verifyIdToken:async uid=>{if(!users.has(uid))throw Error('bad token');return {uid,email:COMMUNITY_OWNER_EMAIL,email_verified:true};},getUser:async uid=>{
  if(!users.has(uid))throw Object.assign(Error('missing'),{code:'auth/user-not-found'});return structuredClone(users.get(uid));},
  getUserByEmail:async email=>{const user=[...users.values()].find(u=>u.email.toLowerCase()===email.toLowerCase());if(!user)throw Object.assign(Error('missing'),{code:'auth/user-not-found'});return structuredClone(user);}};
 const handler=createCommunityAdminHandler({services:()=>({auth}),transaction,environment:()=>({CONTEXT:'production'})});
 const req=(p,uid='owner')=>new Request('https://example.test/api/community-admin',{method:'POST',headers:{origin:'https://example.test',...(uid?{authorization:'Bearer '+uid}:{})},body:JSON.stringify({expectedUser:uid,...p})});
 const admin=(p,uid='owner')=>handler(req(p,uid));
 const org=(p,uid=null)=>transaction(store=>handleOrg(p,store,uid?{uid,emailVerified:users.get(uid)?.emailVerified===true}:{}));
 const create=async(uid='one')=>body(await org({action:'create',org:{type:'hatim',title:'Private fixture',items:Array.from({length:30},(_,i)=>({no:i+1}))}},uid));
 return {admin,org,create,auth,users,transaction,calls,rows:()=>rows,handler,req,
  async bootstrap(){return body(await admin({action:'status'}));},
  async grant(uid,role){return body(await admin({action:'grantRole',email:users.get(uid).email,role}));}};
}

test('only current verified Firebase owner email bootstraps the permanent UID; client email and token claims never grant ownership',async()=>{
 const h=fixture();const fake=await body(await h.admin({action:'status',email:COMMUNITY_OWNER_EMAIL,uid:'owner',emailVerified:true},'one'));
 assert.equal(fake.role,null);assert.equal(h.rows().has('_ca_owner'),false);
 h.users.get('owner').emailVerified=false;await body(await h.admin({action:'status'}),403);assert.equal(h.rows().has('_ca_owner'),false);
 h.users.get('owner').emailVerified=true;assert.equal((await h.bootstrap()).role,'owner');assert.equal(h.rows().get('_ca_owner').uid,'owner');
 h.users.get('owner').email='new-owner-address@example.test';assert.equal((await h.bootstrap()).role,'owner');
 h.users.set('recycled',{uid:'recycled',email:COMMUNITY_OWNER_EMAIL,emailVerified:true});
 assert.equal((await body(await h.admin({action:'status'},'recycled'))).role,null);
 await body(await h.admin({action:'grantRole',email:'one@example.test',role:'admin'},'recycled'),403);
 await body(await h.handler(h.req({action:'status',expectedUser:'other'})),409);
});

test('only owner grants/revokes existing verified users by resolved UID; reused email never transfers a role',async()=>{
 const h=fixture();await h.bootstrap();await h.grant('admin','admin');await h.grant('mod','moderator');
 assert.equal((await body(await h.admin({action:'status'},'admin'))).permissions.communityBan,true);
 assert.equal((await body(await h.admin({action:'status'},'mod'))).permissions.lookup,false);
 for(const uid of ['admin','mod','one'])await body(await h.admin({action:'grantRole',email:'two@example.test',role:'admin'},uid),403);
 h.users.get('two').emailVerified=false;await body(await h.admin({action:'grantRole',email:'two@example.test',role:'admin'}),409);
 h.users.get('two').emailVerified=true;await body(await h.admin({action:'grantRole',email:' TWO@example.test ',role:'moderator',targetUid:'one'}));
 assert.equal((await body(await h.admin({action:'status'},'two'))).role,'moderator');
 await body(await h.admin({action:'roles'},'admin'),403);
 assert.equal((await body(await h.admin({action:'roles'}))).roles.length,3);
 h.users.get('admin').email='different@example.test';h.users.set('replacement',{uid:'replacement',email:'admin@example.test',emailVerified:true});
 assert.equal((await body(await h.admin({action:'status'},'replacement'))).role,null);
 await body(await h.admin({action:'revokeRole',targetUid:'owner'}),409);
 await body(await h.admin({action:'revokeRole',targetUid:'admin'}));
 assert.equal((await body(await h.admin({action:'status'},'admin'))).role,null);
});

test('all privileged accounts are protected until owner revokes their role; moderator cannot ban or search email',async()=>{
 const h=fixture();await h.bootstrap();await h.grant('admin','admin');await h.grant('mod','moderator');
 for(const targetUid of ['owner','admin','mod'])await body(await h.admin({action:'setRestriction',targetUid,communityBanned:true}),409);
 await body(await h.admin({action:'userLookup',email:'one@example.test'},'mod'),403);
 await body(await h.admin({action:'setRestriction',targetUid:'one',communityBanned:true},'mod'),403);
 const restricted=await body(await h.admin({action:'setRestriction',targetUid:'one',commentsRestricted:true},'mod'));assert.equal(restricted.restriction.commentsRestricted,true);
 const status=await body(await h.admin({action:'restrictionStatus',targetUid:'one'},'mod'));assert.equal(status.user.email,undefined);assert.equal(status.restriction.commentsRestricted,true);
 await body(await h.admin({action:'revokeRole',targetUid:'admin'}));await body(await h.admin({action:'setRestriction',targetUid:'admin',communityBanned:true}));
 const lookup=await body(await h.admin({action:'userLookup',email:'admin@example.test'}));assert.equal(lookup.protected,false);assert.equal(lookup.restriction.communityBanned,true);
});

test('community ban prevents new creation/claim/comments but preserves existing cüz, owner access and deletion of own text',async()=>{
 const h=fixture();await h.bootstrap();const g=await h.create(),claim={code:g.code,no:1,name:'Existing participant',capability:'a'.repeat(64)};
 await body(await h.org({action:'claim',...claim},'one'));
 const post={action:'commentCreate',code:g.code,operationId:'b'.repeat(64),text:'Own words',name:'Alias'};
 const comment=(await body(await h.org(post,'one'),201)).comment;
 await body(await h.admin({action:'setRestriction',targetUid:'one',communityBanned:true}));
 assert.equal((await body(await h.org({action:'create',org:{type:'hatim',title:'Blocked',items:Array.from({length:30},(_,i)=>({no:i+1}))}},'one'),403)).errorCode,'COMMUNITY_BANNED');
 await body(await h.org({action:'claim',...claim,no:2,capability:'c'.repeat(64)},'one'),403);
 for(const action of ['claim','complete','undo','release'])await body(await h.org({action,...claim},'one'));
 assert.equal((await body(await h.org({action:'get',code:g.code},'one'))).org.isAdmin,true);
 assert.equal((await body(await h.org({action:'get',code:g.code},'one'))).org.canComment,false);
 assert.equal((await body(await h.org(post,'one'))).replayed,true,'accepted operation replay never adds a new banned post');
 await body(await h.org({...post,operationId:'d'.repeat(64)},'one'),403);
 await body(await h.org({action:'commentEdit',code:g.code,id:comment.id,text:'Blocked edit'},'one'),403);
 await body(await h.org({action:'commentDelete',code:g.code,id:comment.id},'one'));
 await body(await h.admin({action:'setRestriction',targetUid:'one',communityBanned:false}));
 await h.create();
});

test('comment restriction alone preserves new cüz/hatim use and reads while blocking only comment writes',async()=>{
 const h=fixture();await h.bootstrap();const g=await h.create('two');await body(await h.admin({action:'setRestriction',targetUid:'one',commentsRestricted:true}));
 await h.create('one');await body(await h.org({action:'claim',code:g.code,no:1,name:'Allowed',capability:'e'.repeat(64)},'one'));
 await body(await h.org({action:'commentList',code:g.code},'one'));
 const response=await body(await h.org({action:'commentCreate',code:g.code,operationId:'f'.repeat(64),text:'Blocked',name:'Alias'},'one'),403);assert.equal(response.errorCode,'COMMENTS_RESTRICTED');
});

test('global comments/reports are privileged, bounded and plaintext; moderator edits are flagged and parent deletion preserves replies',async()=>{
 const h=fixture();await h.bootstrap();await h.grant('mod','moderator');const g=await h.create();
 const p={action:'commentCreate',code:g.code,operationId:'a'.repeat(64),text:'Original author text',name:'One'};
 const parent=(await body(await h.org(p,'one'),201)).comment;
 const child=(await body(await h.org({...p,operationId:'b'.repeat(64),parentId:parent.id,name:'Two',text:'Reply'},'two'),201)).comment;
 await body(await h.org({action:'commentReport',code:g.code,id:child.id,reason:'Private report'},'one'));
 await body(await h.admin({action:'comments'},'one'),403);await body(await h.admin({action:'reports'},'one'),403);
 const comments=await body(await h.admin({action:'comments'},'mod'));assert.equal(comments.comments.length,2);assert.ok(comments.comments.some(c=>c.ownerUid==='one'));
 await body(await h.admin({action:'moderateComment',code:g.code,id:parent.id,operation:'edit',text:'<b>Moderator corrected</b>'},'mod'));
 const root=(await body(await h.org({action:'commentList',code:g.code},'one'))).comments[0];assert.equal(root.editedByAdmin,true);assert.equal(root.text,'<b>Moderator corrected</b>');
 await body(await h.admin({action:'moderateComment',code:g.code,id:parent.id,operation:'delete'},'mod'));
 const reply=(await body(await h.org({action:'commentReplies',code:g.code,parentId:parent.id},'two'))).comments[0];assert.equal(reply.id,child.id);assert.equal(reply.deleted,false);
 const reports=await body(await h.admin({action:'reports'},'mod'));assert.equal(reports.reports[0].reason,'Private report');
 const resolved={action:'resolveReport',code:g.code,id:reports.reports[0].id};
 await body(await h.admin(resolved,'mod'));assert.equal((await body(await h.admin({action:'reports'},'mod'))).reports.length,0);
 const before=structuredClone([...h.rows()]);assert.equal((await body(await h.admin(resolved,'mod'))).replayed,true);assert.deepEqual([...h.rows()],before,'lost report-resolution replies must not append audit or rate writes');
 assert.ok(h.calls.every(q=>q.limit===20));
 const audit=JSON.stringify([...h.rows()].filter(([key])=>key.startsWith('_ca_audit_')));
 for(const privateText of ['Original author text','Moderator corrected','Private report',COMMUNITY_OWNER_EMAIL])assert.equal(audit.includes(privateText),false);
});

test('revoked role immediately denies next request and cleanup removes role/restriction/indexes while owner mailbox stays pinned',async()=>{
 const h=fixture();await h.bootstrap();await h.grant('admin','admin');await body(await h.admin({action:'setRestriction',targetUid:'one',communityBanned:true},'admin'));
 await body(await h.admin({action:'revokeRole',targetUid:'admin'}));await body(await h.admin({action:'comments'},'admin'),403);
 await releaseAccountHatimOwnership('one',{transaction:h.transaction});assert.ok(h.rows().get(closedAccountKey('one')));
 const serialized=JSON.stringify([...h.rows()].filter(([key])=>key.startsWith('_ca_restrict_')));assert.equal(serialized.includes('true'),false);
 await cleanupCommunityAccount('owner',{transaction:h.transaction});assert.equal(h.rows().get('_ca_owner').uid,'owner');
 h.users.set('recycled',{uid:'recycled',email:COMMUNITY_OWNER_EMAIL,emailVerified:true});assert.equal((await body(await h.admin({action:'status'},'recycled'))).role,null);
 await body(await h.admin({action:'status'}),409);
});

test('preview and malformed deployment contexts fail closed before Firebase or ownership bootstrap',async()=>{
 let calls=0;const handler=createCommunityAdminHandler({services(){calls++;throw Error('must not initialize');},environment:()=>({CONTEXT:'deploy-preview',REVIEW_ID:'31'})});
 const req=new Request('https://example.test/api/community-admin',{method:'POST',headers:{authorization:'Bearer production-secret'},body:JSON.stringify({action:'status',expectedUser:'owner'})});
 assert.equal((await body(await handler(req),403)).errorCode,'PREVIEW_RESTRICTED');assert.equal(calls,0);
 const invalid=createCommunityAdminHandler({services(){calls++;},environment:()=>({CONTEXT:'branch-deploy'})});await body(await invalid(req),503);assert.equal(calls,0);
});
