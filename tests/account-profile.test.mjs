import {test} from 'node:test';import assert from 'node:assert/strict';
import {validateProfile} from '../src/account-profile-data.mjs';
import {createAccountHandler} from '../server/account-handler.mjs';
const now=new Date('2026-10-18T12:00:00Z');
test('optional profile accepts nickname or empty name without requiring age or gender',()=>{
 assert.deepEqual(validateProfile({displayName:'  Yolcu  '},now),{displayName:'Yolcu',age:null,birthDate:null,gender:'unspecified'});
 assert.equal(validateProfile({},now).displayName,'');assert.equal(validateProfile({age:30},now).age,30);
 assert.equal(validateProfile({birthDate:'2000-02-29',gender:'female'},now).birthDate,'2000-02-29');
});
test('profile rejects impossible dates, dual age information, unbounded or injected fields',()=>{
 for(const value of [{age:0},{age:121},{age:1.5},{age:30,birthDate:'2000-01-01'},{birthDate:'2001-02-29'},{birthDate:'2027-01-01'},{birthDate:'1800-01-01'},{gender:'anything'},{displayName:'<img>'},{displayName:'a'.repeat(61)},{displayName:'x\u0000y'},{email:'public@example.test'}])assert.throws(()=>validateProfile(value,now));
});
function backend(options={}){
 const docs=new Map();const ref=path=>({path,collection:name=>ref(path+'/'+name),doc:id=>ref(path+'/'+id),orderBy(){return this},select(){return this},delete:async()=>docs.delete(path)});
 const db={collection:name=>ref(name),runTransaction:async work=>work({get:async r=>r.path.endsWith('/backups')?{docs:[],forEach(){},size:0}:{exists:docs.has(r.path),data:()=>docs.get(r.path)},set:(r,data)=>docs.set(r.path,structuredClone(data)),create:(r,data)=>docs.set(r.path,data),delete:r=>docs.delete(r.path)})};
 const auth={verifyIdToken:async token=>({uid:token,auth_time:now.getTime()/1000}),getUser:async uid=>({uid,emailVerified:uid!=='unverified'}),deleteUser:async()=>{}};
 const handle=createAccountHandler({services:()=>({auth,db}),now:()=>+now,...options});
 const req=(uid,action,extra={})=>handle(new Request('https://example.test/api/account',{method:'POST',headers:{origin:'https://example.test','content-type':'application/json',authorization:'Bearer '+uid},body:JSON.stringify({action,expectedUser:uid,...extra})}));
 return {docs,req};
}
test('private profile endpoint isolates users, validates identity, rejects stale edits and survives backup writes',async()=>{
 const {docs,req}=backend();assert.equal((await req('unverified','profileGet')).status,403);
 assert.equal((await req('A','profilePut',{expectedUser:'B',profile:{},revision:0})).status,409);
 assert.equal((await req('A','profilePut',{profile:{age:999},revision:0})).status,400);
 const save=await req('A','profilePut',{profile:{displayName:'Yolcu',birthDate:'1995-05-12',gender:'male'},revision:0});assert.equal(save.status,200);
 assert.equal((await req('A','profilePut',{profile:{displayName:'stale'},revision:0})).status,409);
 assert.equal((await (await req('B','profileGet')).json()).profile,null);
 assert.equal((await req('A','syncPut',{revision:0,payload:{elifa:'yedek',v:1,veri:{}}})).status,200);
 const data=await (await req('A','profileGet')).json();assert.equal(data.profile.displayName,'Yolcu');assert.equal(data.profile.birthDate,'1995-05-12');assert.equal(data.revision,1);
 assert.ok(docs.has('elifaAccounts/A/private/profile'));assert.equal(docs.get('elifaAccounts/A').birthDate,undefined);
 assert.equal((await req('A','deleteAccount',{confirmation:'DELETE'})).status,200);assert.equal(docs.has('elifaAccounts/A/private/profile'),false);
});
test('account deletion locks saves and retries safely when hatim ownership detachment temporarily fails',async()=>{
 let attempts=0;let store;
 const {docs,req}=backend({detachMemberships:async uid=>{assert.equal(uid,'A');assert.equal(store.get('elifaAccounts/A').deleting,true);assert.equal(store.has('elifaAccounts/A/private/profile'),false);if(++attempts===1)throw Error('temporary group service failure');}});store=docs;
 assert.equal((await req('A','profilePut',{profile:{displayName:'A'},revision:0})).status,200);
 assert.equal((await req('A','deleteAccount',{confirmation:'DELETE'})).status,503);
 assert.equal((await req('A','profilePut',{profile:{displayName:'resurrect'},revision:0})).status,409);
 assert.equal((await req('A','deleteAccount',{confirmation:'DELETE'})).status,200);assert.equal(attempts,2);
});
