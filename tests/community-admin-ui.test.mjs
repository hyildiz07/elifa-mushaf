import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createCommunityAdmin} from '../src/community-admin-ui.mjs';
const code='aaaaaa',id='1792400000000-aaaaaaaaaaaaaaaa';
const permissions=role=>({roles:role==='owner',announcements:role==='owner',lookup:['owner','admin'].includes(role),comments:!!role,communityBan:['owner','admin'].includes(role),commentBan:!!role});
class Element{
 constructor(){this.innerHTML='';this.hidden=false;this.disabled=false;this.open=false;this.handlers={};this.classList={add(){}};}
 addEventListener(type,fn){this.handlers[type]=fn;}
 setAttribute(name,value){this[name]=value;}
 querySelector(){return null;}
 contains(){return true;}
 showModal(){this.open=true;}
 close(){this.open=false;this.handlers.close?.();}
}
const settle=async()=>{await new Promise(r=>setImmediate(r));await new Promise(r=>setImmediate(r));};
function fixture(handler,{role='owner',uid='alice',verified=true,late=false,preview=false,hostname='localhost',token,now}={}){
 let user=uid?{uid,emailVerified:verified}:null,bridgeReady=!late;const listeners=new Set(),events=new Set(),calls=[];
 const entry=new Element(),host=new Element(),bridge={getUser:()=>user,getIdToken:async()=>token?token():user?'token-'+user.uid:null,onChange(fn){listeners.add(fn);fn(user);return ()=>listeners.delete(fn);}};
 const controller=createCommunityAdmin({entry,host,session:()=>bridgeReady?bridge:null,preview:()=>preview,location:{hostname},...(now?{now}:{}),eventTarget:{addEventListener(_event,fn){events.add(fn);},removeEventListener(_event,fn){events.delete(fn);}},fetcher:async(url,options)=>{
  const p=JSON.parse(options.body);calls.push({url,...p});
  if(handler){const result=await handler(p,{calls});if(result instanceof Response)return result;if(result)return Response.json(result);}
  if(p.action==='status')return Response.json({role,owner:role==='owner',permissions:permissions(role)});
  if(p.action==='comments')return Response.json({comments:[{code,id,text:'Yerel yorum',name:'Takma ad',ownerUid:'target',createdAt:1792400000000}],nextCursor:null});
  if(p.action==='reports')return Response.json({reports:[],nextCursor:null});
  if(p.action==='roles')return Response.json({roles:[{uid:'alice',email:'owner@example.test',role:'owner'},{uid:'target',email:'target@example.test',role:'moderator'}],nextCursor:null});
  if(p.action==='announcements')return Response.json({announcements:[]});
  return Response.json({ok:true});
 }});
 const input=(name,value)=>host.handlers.input({target:{dataset:{adminField:name},value}});
 const account=value=>{user=value;for(const fn of listeners)fn(user);for(const fn of events)fn({detail:{user}});};
 return {controller,entry,host,calls,input,account,initialize:async()=>{controller.initialize();await settle();},lateBridge(){bridgeReady=true;for(const fn of events)fn({detail:{user}});},emit(){for(const fn of listeners)fn(user);for(const fn of events)fn({detail:{user}});}};
}
test('a late account bridge makes one status request per identity; entry visibility never opens the panel automatically',async()=>{
 const f=fixture(null,{late:true});await f.initialize();assert.equal(f.calls.length,0);assert.equal(f.entry.hidden,true);
 f.lateBridge();await settle();assert.equal(f.calls.filter(p=>p.action==='status').length,1);assert.equal(f.entry.hidden,false);assert.equal(f.host.open,false);
 f.emit();await settle();assert.equal(f.calls.length,1);
 await f.controller.open();assert.equal(f.calls.filter(p=>p.action==='status').length,1);assert.equal(f.host.open,true);assert.match(f.host.innerHTML,/Yönetim paneli/);assert.match(f.host.innerHTML,/data-tab="roles"/);
 f.account({uid:'bob',emailVerified:true});await settle();assert.equal(f.calls.filter(p=>p.action==='status').length,2);assert.equal(f.host.open,false);assert.equal(f.host.innerHTML,'');
});

test('only owner sees announcements and publishing uses the verified management endpoint',async()=>{
 const owner=fixture(p=>p.action==='announcements'?{announcements:[]}:
  p.action==='saveAnnouncement'?{ok:true,id:'new'}:undefined);
 await owner.initialize();await owner.controller.open();assert.match(owner.host.innerHTML,/data-tab="announcements"/);
 await owner.controller.dispatch('tab',{tab:'announcements'});
 owner.input('announcementTitle','Yeni sürüm');owner.input('announcementMessage','Hoş geldiniz');
 await owner.controller.submit('announcement');
 const save=owner.calls.find(p=>p.action==='saveAnnouncement');
 assert.equal(save.baslik,'Yeni sürüm');assert.equal(save.mesaj,'Hoş geldiniz');assert.equal(save.expectedUser,'alice');
 assert.match(owner.host.innerHTML,/Duyuru yayınlandı/);
 const moderator=fixture(null,{role:'moderator'});await moderator.initialize();await moderator.controller.open();
 assert.doesNotMatch(moderator.host.innerHTML,/data-tab="announcements"/);
 const before=moderator.calls.length;await moderator.controller.dispatch('tab',{tab:'announcements'});
 assert.equal(moderator.calls.length,before);
});
test('opening while the initial role request is pending shares one status request and then loads the queue once',async()=>{
 let resolve;
 const f=fixture(p=>p.action==='status'?new Promise(r=>resolve=()=>r({role:'owner',owner:true,permissions:permissions('owner')})):undefined);
 f.controller.initialize();await settle();const opening=f.controller.open();await settle();
 assert.equal(f.calls.filter(p=>p.action==='status').length,1);assert.equal(f.calls.filter(p=>p.action==='comments').length,0);
 resolve();await opening;assert.equal(f.host.open,true);assert.equal(f.calls.filter(p=>p.action==='comments').length,1);
});
test('a recent server role avoids a sequential status waterfall, expires after fifteen seconds and can be explicitly refreshed',async()=>{
 let clock=1000;const f=fixture(null,{now:()=>clock});await f.initialize();await f.controller.open();
 assert.equal(f.calls.filter(p=>p.action==='status').length,1);
 f.controller.close();clock+=14999;await f.controller.open();assert.equal(f.calls.filter(p=>p.action==='status').length,1);
 f.controller.close();clock++;await f.controller.open();assert.equal(f.calls.filter(p=>p.action==='status').length,2);
 await f.controller.refreshStatus();assert.equal(f.calls.filter(p=>p.action==='status').length,3);
});
test('cached entry visibility never authorizes data after server revocation',async()=>{
 let revoked=false;const f=fixture(p=>p.action==='comments'&&revoked?Response.json({error:'Yetki kaldırıldı',errorCode:'ADMIN_REQUIRED'},{status:403}):undefined);
 await f.initialize();revoked=true;await f.controller.open();
 assert.equal(f.calls.filter(p=>p.action==='status').length,1);assert.equal(f.calls.filter(p=>p.action==='comments').length,1);
 assert.equal(f.entry.hidden,true);assert.equal(f.host.open,false);assert.equal(f.host.innerHTML,'');
});

test('queue authorization rejection clears cached access and any previously loaded private rows',async()=>{
 for(const errorCode of ['AUTH_REQUIRED','EMAIL_UNVERIFIED','PREVIEW_RESTRICTED']){
  for(const alreadyOpen of [false,true]){
   let rejected=false;const f=fixture(p=>p.action==='comments'&&rejected?Response.json({error:'Erişim kapalı',errorCode},{status:errorCode==='AUTH_REQUIRED'?401:403}):undefined);
   await f.initialize();
   if(alreadyOpen){await f.controller.open();assert.match(f.host.innerHTML,/Yerel yorum/);}
   rejected=true;
   if(alreadyOpen)await f.controller.dispatch('reload');else await f.controller.open();
   assert.equal(f.calls.filter(p=>p.action==='status').length,1,errorCode);
   assert.equal(f.entry.hidden,true,errorCode);assert.equal(f.host.open,false,errorCode);assert.equal(f.host.innerHTML,'',errorCode);
   rejected=false;await f.controller.open();
   assert.equal(f.calls.filter(p=>p.action==='status').length,2,'denial invalidates cached role');
  }
 }
});
test('owner-only role controls and lookup are absent for lower roles and cannot be activated through commands',async()=>{
 for(const role of ['owner','admin','moderator']){const f=fixture(null,{role});await f.initialize();await f.controller.open();
  assert.equal(f.host.innerHTML.includes('data-tab="roles"'),role==='owner');const before=f.calls.length;
  if(role!=='owner'){await f.controller.dispatch('tab',{tab:'roles'});f.input('grantEmail','other@example.test');await f.controller.submit('grant');assert.equal(f.calls.length,before);}
  await f.controller.dispatch('tab',{tab:'people'});assert.equal(f.host.innerHTML.includes('data-admin-form="lookup"'),role!=='moderator');
 }
 const absent=fixture(null,{role:null});await absent.initialize();assert.equal(absent.entry.hidden,true);await absent.controller.open();assert.equal(absent.host.open,false);
});
test('preview, anonymous and unverified contexts never contact cloud administration',async()=>{
 for(const options of [{preview:true},{hostname:'deploy-preview-23--example.netlify.app'},{uid:null},{verified:false}]){const f=fixture(null,options);await f.initialize();await f.controller.open();assert.equal(f.calls.length,0);assert.equal(f.entry.hidden,true);assert.equal(f.host.open,false);}
});
test('global comment moderation and reported-item resolution use explicit selected records and confirmations',async()=>{
 let text='Yerel yorum',hidden=false,deleted=false,edited=false,resolved=false;
 const row=()=>({code,id,text,name:'<img src=x>',ownerUid:'target',createdAt:1792400000000,hidden,deleted,editedByAdmin:edited});
 const f=fixture(p=>{
  if(p.action==='comments')return {comments:[row()],nextCursor:p.cursor?null:'opaque-page'};
  if(p.action==='reports')return {reports:resolved?[]:[{code,id:'report01',commentId:id,reason:'Kontrol',comment:row()}],nextCursor:null};
  if(p.action==='moderateComment'){if(p.operation==='edit'){text=p.text;edited=true;}if(p.operation==='hide')hidden=true;if(p.operation==='delete')deleted=true;return {comment:row()};}
  if(p.action==='resolveReport'){resolved=true;return {ok:true};}
 });await f.initialize();await f.controller.open();assert.doesNotMatch(f.host.innerHTML,/<img/);assert.match(f.host.innerHTML,/&lt;img/);
 await f.controller.dispatch('older');assert.equal(f.calls.at(-1).cursor,'opaque-page');
 await f.controller.dispatch('edit',{code,id});f.input('editText','Düzeltilen metin');await f.controller.submit('edit');assert.equal(f.calls.find(p=>p.action==='moderateComment').operation,'edit');assert.match(f.host.innerHTML,/Yönetici düzenledi/);
 await f.controller.dispatch('hide',{code,id});assert.equal(hidden,true);
 await f.controller.dispatch('ask-delete',{code,id});assert.equal(deleted,false);await f.controller.dispatch('confirm');assert.equal(deleted,true);
 await f.controller.dispatch('queue',{queue:'reports'});await f.controller.dispatch('ask-resolve',{code,id:'report01'});assert.equal(resolved,false);await f.controller.dispatch('confirm');assert.equal(resolved,true);
});
test('exact-email account lookup exposes separate confirmed restrictions and never affects reading or account operations',async()=>{
 const f=fixture(p=>p.action==='userLookup'?{user:{uid:'target',email:p.email,displayName:'Seçilen kişi'},restriction:{communityBanned:false,commentsRestricted:true},protected:false}:undefined,{role:'admin'});
 await f.initialize();await f.controller.open();await f.controller.dispatch('tab',{tab:'people'});f.input('email','  Person@example.test ');await f.controller.submit('lookup');assert.equal(f.calls.at(-1).email,'Person@example.test');
 assert.match(f.host.innerHTML,/Topluluktan engelle/);assert.match(f.host.innerHTML,/Yorum yasağını kaldır/);assert.match(f.host.innerHTML,/Kur’an okuma, yedekleme ve hesabı silme açık kalır/);
 await f.controller.dispatch('ask-community-ban');assert.equal(f.calls.some(p=>p.action==='setRestriction'),false);await f.controller.dispatch('confirm');
 const sent=f.calls.find(p=>p.action==='setRestriction');assert.equal(sent.targetUid,'target');assert.equal(sent.communityBanned,true);assert.equal(sent.commentsRestricted,undefined);assert.match(f.host.innerHTML,/Yorum yasağını kaldır/);
 await f.controller.dispatch('ask-comment-unban');await f.controller.dispatch('confirm');assert.equal(f.calls.at(-1).commentsRestricted,false);assert.equal(f.calls.at(-1).communityBanned,undefined);
});
test('moderators select restriction state from a comment without exact-email lookup and protected people cannot be restricted',async()=>{
 for(const protectedPerson of [false,true]){const f=fixture(p=>p.action==='restrictionStatus'?{user:{uid:'target'},restriction:{communityBanned:false,commentsRestricted:true},protected:protectedPerson,role:protectedPerson?'owner':null}:undefined,{role:'moderator'});
  await f.initialize();await f.controller.open();await f.controller.dispatch('person',{target:'target',name:'Yorumdaki ad'});assert.equal(f.calls.at(-1).action,'restrictionStatus');assert.match(f.host.innerHTML,/Yorumdaki ad/);assert.doesNotMatch(f.host.innerHTML,/Topluluktan engelle|data-admin-form="lookup"/);
  const before=f.calls.length;await f.controller.dispatch('ask-community-ban');assert.equal(f.calls.length,before);
  await f.controller.dispatch('ask-comment-unban');await f.controller.dispatch('confirm');assert.equal(f.calls.some(p=>p.action==='setRestriction'),!protectedPerson);
 }
});
test('only the owner grants or revokes roles, after confirmation, and its own role cannot be removed',async()=>{
 const f=fixture();await f.initialize();await f.controller.open();await f.controller.dispatch('tab',{tab:'roles'});
 assert.doesNotMatch(f.host.innerHTML,/<select/);assert.match(f.host.innerHTML,/data-role="moderator" aria-pressed="true"/);await f.controller.dispatch('choose-role',{role:'admin'});assert.match(f.host.innerHTML,/data-role="admin" aria-pressed="true"/);f.input('grantEmail','new@example.test');await f.controller.submit('grant');assert.equal(f.calls.some(p=>p.action==='grantRole'),false);await f.controller.dispatch('confirm');
 assert.deepEqual(Object.fromEntries(Object.entries(f.calls.find(p=>p.action==='grantRole')).filter(([k])=>['email','role'].includes(k))),{email:'new@example.test',role:'admin'});
 const before=f.calls.length;await f.controller.dispatch('ask-revoke',{target:'alice',email:'owner@example.test'});await f.controller.dispatch('confirm');assert.equal(f.calls.length,before);
 await f.controller.dispatch('ask-revoke',{target:'target',email:'target@example.test'});await f.controller.dispatch('confirm');assert.equal(f.calls.find(p=>p.action==='revokeRole').targetUid,'target');
});
test('late status, comments and mutation results never leak into another identity or reopen a closed panel',async()=>{
 let resolve;const f=fixture(p=>p.action==='status'&&p.expectedUser==='alice'?new Promise(r=>resolve=()=>r({role:'owner',owner:true,permissions:permissions('owner')})):p.action==='status'?{role:null,owner:false,permissions:{}}:undefined);
 f.controller.initialize();await settle();f.account({uid:'bob',emailVerified:true});await settle();resolve();await settle();assert.equal(f.entry.hidden,true);assert.equal(f.host.open,false);
 let read;const g=fixture(p=>p.action==='comments'?new Promise(r=>read=()=>r({comments:[{code,id,text:'Private administrative text',ownerUid:'target'}]})):undefined);
 await g.initialize();const pending=g.controller.open();await settle();g.account(null);read();await pending;assert.equal(g.host.innerHTML,'');assert.equal(g.host.open,false);assert.equal(g.entry.hidden,true);
});
test('permission rejection closes sensitive UI and clearing the panel does not fabricate success',async()=>{
 const f=fixture(p=>p.action==='moderateComment'?Response.json({error:'Yetki kaldırıldı',errorCode:'ADMIN_REQUIRED'},{status:403}):undefined);await f.initialize();await f.controller.open();await f.controller.dispatch('hide',{code,id});assert.equal(f.entry.hidden,true);assert.equal(f.host.open,false);assert.equal(f.host.innerHTML,'');
});


test('rapid pagination has one request and a tab change rejects the late older page',async()=>{
 let resolve;const f=fixture(p=>p.action==='comments'?p.cursor?new Promise(r=>resolve=r):{comments:[{code,id,text:'First page'}],nextCursor:'opaque-next'}:undefined);
 await f.initialize();await f.controller.open();const older=f.controller.dispatch('older');await settle();await f.controller.dispatch('older');assert.equal(f.calls.filter(p=>p.cursor==='opaque-next').length,1);
 assert.doesNotMatch(f.host.innerHTML,/data-admin-action="close" disabled/);await f.controller.dispatch('tab',{tab:'people'});resolve({comments:[{code,id:'older',text:'Old administrative page'}],nextCursor:null});await older;assert.doesNotMatch(f.host.innerHTML,/Old administrative page/);assert.match(f.host.innerHTML,/Hesabın tam e-posta/);
});

test('an administrative mutation completing after account change cannot show old content or success',async()=>{
 let resolve;const f=fixture(p=>p.action==='moderateComment'?new Promise(r=>resolve=r):p.action==='status'&&p.expectedUser==='bob'?{role:null,permissions:{}}:undefined);
 await f.initialize();await f.controller.open();const pending=f.controller.dispatch('hide',{code,id});await settle();f.account({uid:'bob',emailVerified:true});await settle();resolve({comment:{code,id,text:'Old account content'}});await pending;assert.equal(f.host.innerHTML,'');assert.equal(f.host.open,false);assert.equal(f.entry.hidden,true);assert.equal(f.calls.filter(p=>p.action==='comments').length,1);
});
