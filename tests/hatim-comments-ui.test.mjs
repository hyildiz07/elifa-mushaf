import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHatimComments} from '../src/hatim-comments-ui.mjs';
import {handleOrg} from '../netlify/functions/org.mjs';
const code='aaaaaa',other='bbbbbb',first='1792400000000-aaaaaaaaaaaaaaaa',second='1792400000001-bbbbbbbbbbbbbbbb',reply='1792400000002-cccccccccccccccc';
const comment=(id=first,extra={})=>({id,parentId:null,text:'Allah kabul etsin.',name:'Okuyucu',createdAt:1792400000000,updatedAt:1792400000000,own:true,canEdit:true,canDelete:true,canHide:false,deleted:false,hidden:false,replyCount:0,...extra});
class Element{
 constructor(){this.innerHTML='';this.handlers={};this.parentNode=null;this.dataset={};this.children=[];}
 addEventListener(type,fn){this.handlers[type]=fn;}
 appendChild(node){node.parentNode?.children.splice(node.parentNode.children.indexOf(node),1);node.parentNode=this;this.children.push(node);}
 remove(){if(this.parentNode)this.parentNode.children.splice(this.parentNode.children.indexOf(this),1);this.parentNode=null;}
 querySelector(){return {focus(){},setSelectionRange(){}};}
 contains(){return true;}
}
function fixture(handler,{uid='alice',emailVerified=true,storage=new Map(),admin=false}={}){
 let user=uid?{uid,emailVerified,displayName:'Katılımcı'}:null,seq=0;const calls=[],counts=[],login=[],document={createElement:()=>new Element(),activeElement:null,documentElement:{lang:'tr'}};
 const api=async p=>{calls.push(structuredClone(p));return handler?handler(p,{calls,storage}):{code,comments:[],nextCursor:null,commentCount:0,canComment:true,commentsClosed:false};};
 const controller=createHatimComments({api,getUser:()=>user,onLogin:()=>login.push(true),makeOperationId:()=> (++seq).toString(16).padStart(64,'0'),document,storage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)},onCount:value=>counts.push(value)});
 const mount=(overrides={})=>controller.mount(new Element(),{code,generation:1,isAdmin:admin,commentCount:4,canComment:true,commentsClosed:false,...overrides});mount();
 const input=(field,value)=>controller.element.handlers.input({target:{dataset:{commentField:field},value}});
 return {controller,calls,counts,login,storage,mount,input,html:()=>controller.element.innerHTML,user:value=>user=value,report:()=>controller.element.handlers.submit({preventDefault(){},target:{matches:()=>true}})};
}
test('collapsed comments never read; opening paginates and escapes text without automatically loading replies',async()=>{
 const x=fixture(p=>({code,comments:[comment(p.cursor?second:first,{text:'<img src=x onerror=alert(1)>',replyCount:3})],commentCount:4,nextCursor:p.cursor?null:first,canComment:true}));
 assert.equal(x.calls.length,0);assert.match(x.html(),/Yorumlar <small>· 4/);
 await x.controller.dispatch('toggle');assert.equal(x.calls.length,1);assert.equal(x.calls[0].action,'commentList');assert.doesNotMatch(x.html(),/<img/);assert.match(x.html(),/&lt;img/);assert.match(x.html(),/3 yanıtı göster/);
 await x.controller.dispatch('older');assert.equal(x.calls[1].cursor,first);assert.match(x.html(),new RegExp(second));
 await x.controller.dispatch('toggle');const before=x.calls.length;x.mount();assert.equal(x.calls.length,before);assert.doesNotMatch(x.html(),/hc-comments-body/);
});
test('closing or switching org/user rejects late reads and never displays another account pending draft',async()=>{
 let resolve;const x=fixture(()=>new Promise(r=>resolve=r));const pending=x.controller.dispatch('toggle');await x.controller.dispatch('toggle');resolve({code,comments:[comment()],commentCount:1});await pending;assert.doesNotMatch(x.html(),/Allah kabul/);
 const secondPending=x.controller.dispatch('toggle');x.user({uid:'bob',emailVerified:true});x.mount({code:other,generation:2});resolve({code,comments:[comment()],commentCount:1});await secondPending;assert.doesNotMatch(x.html(),/Allah kabul/);assert.match(x.html(),/· 4/);
});
test('reply fetch is explicit and a response to a response creates only one level with the original root parent',async()=>{
 const x=fixture(p=>p.action==='commentReplies'?{code,comments:[comment(reply,{parentId:first,own:false,canEdit:false,canDelete:false})],nextCursor:null}:p.action==='commentCreate'?{code,comment:comment(second,{parentId:p.parentId})}:{code,comments:[comment(first,{replyCount:1})],commentCount:2,canComment:true});
 await x.controller.dispatch('toggle');assert.equal(x.calls.some(p=>p.action==='commentReplies'),false);
 await x.controller.dispatch('replies',first);assert.equal(x.calls[1].parentId,first);await x.controller.dispatch('reply',reply);x.input('text','Yanıtım');await x.controller.submit();
 const sent=x.calls.find(p=>p.action==='commentCreate');assert.equal(sent.parentId,first);assert.equal(sent.text,'Yanıtım');assert.ok(x.calls.filter(p=>p.action==='commentReplies').length>=2);
});
test('ambiguous sends persist the operation before POST and retries or reloads reuse the exact text/key',async()=>{
 const storage=new Map();let lost=true;const handler=(p,{storage})=>{
  if(p.action==='commentCreate'){const saved=JSON.parse([...storage.values()][0]);assert.equal(saved.operationId,p.operationId);if(lost){lost=false;throw Error('Yanıt kayboldu.');}return {code,comment:comment()};}
  return {code,comments:[],commentCount:0,canComment:true};
 };
 const x=fixture(handler,{storage});await x.controller.dispatch('toggle');x.input('text','Aynı mesaj');await x.controller.submit();assert.match(x.html(),/Yanıt kayboldu/);assert.match(x.html(),/readonly/);
 const old=x.calls.find(p=>p.action==='commentCreate');x.controller.dispose();const reloaded=fixture(handler,{storage});await reloaded.controller.dispatch('toggle');await reloaded.controller.submit();
 const again=reloaded.calls.find(p=>p.action==='commentCreate');assert.deepEqual(again,old);assert.equal(storage.size,0);
});
test('a response arriving after account switch cannot clear that account draft or append another user comment',async()=>{
 let resolve;const x=fixture(p=>p.action==='commentCreate'?new Promise(r=>resolve=r):{code:p.code,comments:[],commentCount:0,canComment:true});
 await x.controller.dispatch('toggle');x.input('text','Alice özel taslağı');const pending=x.controller.submit();x.user({uid:'bob',emailVerified:true});x.mount({generation:2});await x.controller.dispatch('toggle');x.input('text','Bob taslağı');resolve({code,comment:comment()});await pending;
 x.mount({generation:2});assert.match(x.html(),/Bob taslağı/);assert.doesNotMatch(x.html(),/Alice özel/);assert.equal(x.storage.size,1,'Alice pending proof stays scoped to Alice until verified');
});
test('delete requires explicit confirmation and retains the parent placeholder and replies; own edit uses server rights',async()=>{
 let item=comment(first,{replyCount:1});const x=fixture(p=>{
  if(p.action==='commentEdit'){item={...item,text:p.text,updatedAt:item.createdAt+10};return {code,comment:item};}
  if(p.action==='commentDelete'){item={...item,text:'',deleted:true,canEdit:false,canDelete:false};return {code,comment:item};}
  if(p.action==='commentReplies')return {code,comments:[comment(reply,{parentId:first})]};
  return {code,comments:[item],commentCount:2,canComment:true};
 });
 await x.controller.dispatch('toggle');await x.controller.dispatch('edit',first);x.input('text','Düzeltilen');await x.controller.submit();assert.match(x.html(),/Düzeltilen/);assert.match(x.html(),/düzenlendi/);
 await x.controller.dispatch('ask-delete',first);assert.equal(x.calls.some(p=>p.action==='commentDelete'),false);await x.controller.dispatch('delete',first);assert.match(x.html(),/Yorum silindi/);assert.match(x.html(),/1 yanıtı göster/);
 await x.controller.dispatch('replies',first);assert.match(x.html(),new RegExp(reply));
 assert.doesNotMatch(x.html(),new RegExp('data-comment-action="reply" data-id="'+reply+'"'),'a reply under a deleted root cannot create a new answer that the server would reject');
});
test('unverified or signed-out users are offered login without a comment query; closed discussions do not expose a new composer',async()=>{
 for(const opts of [{uid:null},{uid:'alice',emailVerified:false}]){const x=fixture(null,opts);await x.controller.dispatch('toggle');assert.equal(x.calls.length,0);assert.match(x.html(),/Giriş yap|Hesabımı aç/);await x.controller.dispatch('login');assert.equal(x.login.length,1);}
 const closed=fixture(()=>({code,comments:[comment()],commentCount:1,canComment:false,commentsClosed:true}));await closed.controller.dispatch('toggle');assert.doesNotMatch(closed.html(),/data-comment-form/);assert.match(closed.html(),/yeni yorumlar kapalı/);
 await closed.controller.dispatch('ask-delete',first);assert.match(closed.html(),/Evet, sil/,'own existing comments can still be deleted');
});
test('report, organizer hiding, report resolution and closure remain distinct explicit actions',async()=>{
 let hidden=false,closed=false,resolved=false;const reported=()=>comment(first,{own:false,canEdit:false,canDelete:false,canHide:true,hidden});
 const x=fixture(p=>{
  if(p.action==='commentReports')return {code,reports:resolved?[]:[{id:second,commentId:first,reason:'Uygunsuz',createdAt:1792400000000,comment:{...reported(),moderatedText:hidden?'Gizlenen metin':undefined}}],nextCursor:null};
  if(p.action==='commentHide')hidden=p.hidden;
  if(p.action==='commentSettings')closed=p.closed;
  if(p.action==='commentResolveReport')resolved=true;
  return {code,comments:[reported()],commentCount:1,canComment:!closed,commentsClosed:closed};
 },{admin:true});
 await x.controller.dispatch('toggle');await x.controller.dispatch('report',first);x.input('reason','Kontrol eder misiniz?');await x.report();assert.equal(x.calls.find(p=>p.action==='commentReport').reason,'Kontrol eder misiniz?');
 await x.controller.dispatch('reports');assert.match(x.html(),/Uygunsuz/);await x.controller.dispatch('hide',first);assert.match(x.html(),/Gizlenen metin/);
 await x.controller.dispatch('resolve-report',second);assert.match(x.html(),/Bildirim yok/);assert.equal(hidden,true);
 await x.controller.dispatch('settings');assert.match(x.html(),/Yorumları aç/);assert.doesNotMatch(x.html(),/data-comment-form/);
});

test('the actual organization backend contract drives the comment UI through create, edit and deletion',async()=>{
 const records=new Map([[code,{code,type:'hatim',title:'Yerel sözleşme',ownerUid:'alice',adminToken:'a'.repeat(32),items:Array.from({length:30},(_,i)=>({no:i+1,status:'bos',name:'',ts:0}))}]]);
 const store={get:async key=>structuredClone(records.get(key)??null),setJSON:async(key,value)=>records.set(key,structuredClone(value)),delete:async key=>records.delete(key),query:async(prefix,{cursor=null,limit=20,reverse=false}={})=>{
  const all=[...records].filter(([key])=>key.startsWith(prefix)&&(!cursor||(reverse?key<cursor:key>cursor))).sort(([a],[b])=>reverse?b.localeCompare(a):a.localeCompare(b));
  return {entries:all.slice(0,limit).map(([key,value])=>({key,value:structuredClone(value)})),nextCursor:all.length>limit?all[limit-1][0]:null};
 }};
 const x=fixture(async payload=>{const response=await handleOrg(payload,store,{uid:'alice',emailVerified:true});const data=await response.json();if(!response.ok)throw Object.assign(Error(data.error),{status:response.status,errorCode:data.errorCode});return data;},{admin:true});
 await x.controller.dispatch('toggle');x.input('text','Gerçek handler ile mesaj');await x.controller.submit();assert.match(x.html(),/Gerçek handler ile mesaj/);
 const created=x.calls.find(p=>p.action==='commentCreate');assert.equal(created.operationId.length,64);
 const id=[...records.values()].find(r=>r?.text==='Gerçek handler ile mesaj')?.id;assert.ok(id);
 await x.controller.dispatch('edit',id);x.input('text','Güncel mesaj');await x.controller.submit();assert.match(x.html(),/Güncel mesaj/);
 await x.controller.dispatch('ask-delete',id);await x.controller.dispatch('delete',id);assert.match(x.html(),/Yorum silindi/);assert.equal(records.get(code).commentCount,1,'the deletion placeholder is retained in the real count');
 assert.equal([...records.values()].some(r=>r?.text==='Güncel mesaj'),false);
});

test('a replay finishing after collapse uses authoritative counts without extra reads or duplicated increments',async()=>{
 const storage=new Map([['elifa_hatim_comment_pending_v1:alice:'+code,JSON.stringify({operationId:'a'.repeat(64),text:'Önceki gönderim',name:'Alice'})]]);let resolve;
 const x=fixture(p=>p.action==='commentCreate'?new Promise(r=>resolve=r):{code,comments:[comment()],commentCount:5,canComment:true},{storage});
 await x.controller.dispatch('toggle');const sending=x.controller.submit();await x.controller.dispatch('toggle');resolve({code,comment:comment(),commentCount:5,replayed:true});await sending;
 assert.match(x.html(),/· 5/);assert.doesNotMatch(x.html(),/hc-comments-body/);assert.equal(x.calls.filter(p=>p.action==='commentList').length,1);
 x.mount({commentCount:4});assert.match(x.html(),/· 5/,'a stale silent get cannot decrease the monotonic total');
});

test('organizer settings use the returned state instead of flipping an in-flight silent update twice',async()=>{
 let resolve;const x=fixture(p=>p.action==='commentSettings'?new Promise(r=>resolve=r):{code,comments:[],commentCount:0,canComment:true,commentsClosed:false},{uid:null,admin:true});
 await x.controller.dispatch('toggle');const request=x.controller.dispatch('settings');x.mount({commentsClosed:true,canComment:false});resolve({code,commentsClosed:true,canComment:false});await request;
 assert.match(x.html(),/Yorumları aç/);assert.doesNotMatch(x.html(),/Yorumları kapat/);
});


test('administrator edits are visibly identified to ordinary members',async()=>{
 const x=fixture(()=>({code,comments:[comment(first,{editedByAdmin:true,moderatedAt:1792400000010,updatedAt:1792400000010})],commentCount:1,canComment:true}));await x.controller.dispatch('toggle');assert.match(x.html(),/Yönetici düzenledi/);
});
