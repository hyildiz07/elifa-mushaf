import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createCommunityAdminHandler} from '../netlify/functions/community-admin.mjs';
import {COMMUNITY_OWNER_EMAIL} from '../server/community-admin.mjs';

const hash=value=>createHash('sha256').update(value).digest('hex');
function fixture(){
 const records=new Map(),users=new Map(),tokens=new Map();let servicesCalls=0,beforeTransaction=null;
 const store={get:async key=>structuredClone(records.get(key)??null),setJSON:async(key,value)=>records.set(key,structuredClone(value)),delete:async key=>records.delete(key),
  query:async(prefix,{cursor=null,limit=20,reverse=false}={})=>{const keys=[...records.keys()].filter(key=>key.startsWith(prefix)&&(!cursor||(reverse?key<cursor:key>cursor))).sort();if(reverse)keys.reverse();return {entries:keys.slice(0,limit).map(key=>({key,value:structuredClone(records.get(key))})),nextCursor:keys.length>limit?keys[limit-1]:null};}};
 const auth={verifyIdToken:async token=>{const value=tokens.get(token);if(!value)throw Error('invalid JWT');return value;},getUser:async uid=>{const value=users.get(uid);if(!value)throw Object.assign(Error('missing'),{code:'auth/user-not-found'});return structuredClone(value);},getUserByEmail:async email=>{const value=[...users.values()].find(user=>user.email.toLowerCase()===email);if(!value)throw Object.assign(Error('missing'),{code:'auth/user-not-found'});return structuredClone(value);}};
 const services=()=>{servicesCalls++;return {auth};};
 const transaction=async work=>{if(beforeTransaction){const callback=beforeTransaction;beforeTransaction=null;await callback();}return work(store);};
 const handler=createCommunityAdminHandler({services,transaction,environment:()=>({CONTEXT:'production'})});
 function user(uid,email=uid+'@example.test',emailVerified=true){users.set(uid,{uid,email,emailVerified,disabled:false});tokens.set(uid,{uid,email,email_verified:emailVerified});return uid;}
 const req=(uid,p={action:'status'})=>new Request('https://example.test/api/community-admin',{method:'POST',headers:{origin:'https://example.test','content-type':'application/json',...(uid?{authorization:'Bearer '+uid}:{})},body:JSON.stringify({expectedUser:uid,...p})});
 return {records,users,tokens,store,auth,user,req,handler,services,transaction,run:(uid,p)=>handler(req(uid,p)),before:callback=>beforeTransaction=callback,calls:()=>servicesCalls};
}
const read=async(response,status=200)=>{assert.equal(response.status,status,await response.clone().text());return response.json();};

test('owner bootstrap trusts current Auth metadata rather than request fields or stale JWT email claims',async()=>{
 const f=fixture();f.user('ordinary');f.tokens.set('ordinary',{uid:'ordinary',email:COMMUNITY_OWNER_EMAIL,email_verified:true});
 const ordinary=await read(await f.run('ordinary',{action:'status',email:COMMUNITY_OWNER_EMAIL,role:'owner',emailVerified:true}));
 assert.equal(ordinary.role,null);assert.equal(f.records.has('_ca_owner'),false);
 f.user('unverified',COMMUNITY_OWNER_EMAIL,false);f.tokens.set('unverified',{uid:'unverified',email:COMMUNITY_OWNER_EMAIL,email_verified:true});
 await read(await f.run('unverified'),403);assert.equal(f.records.has('_ca_owner'),false);
 f.users.get('unverified').emailVerified=true;assert.equal((await read(await f.run('unverified'))).role,'owner');
 assert.equal(f.records.get('_ca_owner').uid,'unverified');
});

test('the immutable owner UID is not inherited when a verified mailbox is recycled',async()=>{
 const f=fixture();f.user('first-owner',COMMUNITY_OWNER_EMAIL);await read(await f.run('first-owner'));
 f.users.delete('first-owner');f.user('replacement',COMMUNITY_OWNER_EMAIL);
 assert.equal((await read(await f.run('replacement'))).role,null);assert.equal(f.records.get('_ca_owner').uid,'first-owner');
 await read(await f.run('replacement',{action:'grantRole',email:'other@example.test',role:'admin'}),403);
});

test('only the locked owner resolves current verified target email to a UID and grants non-owner roles',async()=>{
 const f=fixture();f.user('owner',COMMUNITY_OWNER_EMAIL);f.user('target');f.user('unverified','unverified@example.test',false);f.user('victim');
 await read(await f.run('owner'));
 await read(await f.run('owner',{action:'grantRole',email:'unverified@example.test',role:'admin'}),409);
 await read(await f.run('owner',{action:'grantRole',email:'target@example.test',role:'owner'}),400);
 const assigned=await read(await f.run('owner',{action:'grantRole',email:'target@example.test',targetUid:'victim',role:'moderator'}));
 assert.equal(assigned.user.uid,'target');assert.equal(f.records.get('_ca_role_'+hash('target')).role,'moderator');assert.equal(f.records.has('_ca_role_'+hash('victim')),false);
 assert.equal((await read(await f.run('target'))).role,'moderator');
 for(const action of ['roles','grantRole','revokeRole'])await read(await f.run('target',{action,email:'victim@example.test',targetUid:'victim',role:'admin'}),403);
 await read(await f.run('target',{action:'userLookup',email:'victim@example.test'}),403);
 const limited=await read(await f.run('target',{action:'restrictionStatus',targetUid:'victim'}));assert.deepEqual(limited.user,{uid:'victim'});assert.equal(JSON.stringify(limited).includes('@'),false);
});

test('a role revoked after token verification but before the transaction cannot authorize the queued action',async()=>{
 const f=fixture();f.user('owner',COMMUNITY_OWNER_EMAIL);f.user('moderator');await read(await f.run('owner'));
 await read(await f.run('owner',{action:'grantRole',email:'moderator@example.test',role:'moderator'}));
 f.before(()=>f.records.delete('_ca_role_'+hash('moderator')));
 await read(await f.run('moderator',{action:'comments'}),403);
 assert.equal((await read(await f.run('moderator'))).role,null);
});

test('anonymous, disabled and mismatched identities cannot reach privileged records; preview stops before Firebase initialization',async()=>{
 const f=fixture();await read(await f.run(null),401);f.user('member');f.users.get('member').disabled=true;await read(await f.run('member'),401);
 f.users.get('member').disabled=false;await read(await f.run('member',{action:'status',expectedUser:'someone-else'}),409);
 for(const action of ['comments','reports','roles','userLookup']){const data=await read(await f.run('member',{action,email:COMMUNITY_OWNER_EMAIL}),403);assert.equal(JSON.stringify(data).includes(COMMUNITY_OWNER_EMAIL),false);}
 const preview=createCommunityAdminHandler({services:f.services,transaction:f.transaction,environment:()=>({CONTEXT:'deploy-preview',REVIEW_ID:'20'})}),before=f.calls();
 assert.equal((await read(await preview(f.req('member')),403)).errorCode,'PREVIEW_RESTRICTED');assert.equal(f.calls(),before);
});

test('resolving the same global report twice is an idempotent replay without duplicate audit or rate writes',async()=>{
 const f=fixture();f.user('owner',COMMUNITY_OWNER_EMAIL);f.user('moderator');await read(await f.run('owner'));
 await read(await f.run('owner',{action:'grantRole',email:'moderator@example.test',role:'moderator'}));
 const code='abc123',id='1770000000000-0123456789abcdef';
 f.records.set('_hc_'+code+'_reports_'+id,{id,commentId:id,reason:'Do not copy this report into audit',ownerUid:'reporter'});f.records.set('_hc_global_r_'+id+'_'+code,{code,id});
 await read(await f.run('moderator',{action:'resolveReport',code,id}));const afterFirst=structuredClone([...f.records.entries()]);
 assert.equal(f.records.has('_hc_'+code+'_reports_'+id),false);assert.equal(f.records.has('_hc_global_r_'+id+'_'+code),false);
 await read(await f.run('moderator',{action:'resolveReport',code,id}));assert.deepEqual([...f.records.entries()],afterFirst);
});
