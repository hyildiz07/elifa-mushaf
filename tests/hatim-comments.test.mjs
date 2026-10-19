import {test} from 'node:test';
import assert from 'node:assert/strict';
import {handleOrg,createOrgHandler} from '../netlify/functions/org.mjs';
import {handleHatimComments,anonymizeAccountComments} from '../server/hatim-comments.mjs';
import {closedAccountKey} from '../server/hatim-access.mjs';

const alice={uid:'alice',emailVerified:true},bob={uid:'bob',emailVerified:true};
const orgInput=()=>({type:'hatim',title:'Fixture hatim',items:Array.from({length:30},(_,i)=>({no:i+1}))});
const nonce=n=>n.toString(16).padStart(64,'0');
async function data(response,status=200){assert.equal(response.status,status,await response.clone().text());return response.json();}
function fixture(){
 let rows=new Map([['_config',{discoverEnabled:true}]]),queue=Promise.resolve(),time=1792400000000,sequence=0;
 const queries=[];
 const transaction=work=>{
  const result=queue.then(async()=>{
   const draft=structuredClone(rows),store={
    get:async key=>structuredClone(draft.get(key)??null),setJSON:async(key,value)=>draft.set(key,structuredClone(value)),
    set:async(key,value)=>draft.set(key,value),delete:async key=>draft.delete(key),
    query:async(prefix,{cursor=null,limit=20,reverse=false}={})=>{
     queries.push({prefix,cursor,limit,reverse});
     const all=[...draft].filter(([key])=>key.startsWith(prefix)&&(!cursor||(reverse?key<cursor:key>cursor))).sort(([a],[b])=>reverse?b.localeCompare(a):a.localeCompare(b));
     const page=all.slice(0,limit);return {entries:page.map(([key,value])=>({key,value:structuredClone(value)})),nextCursor:all.length>limit?page.at(-1)[0]:null};
    }};
   const result=await work(store);rows=draft;return result;
  });queue=result.catch(()=>{});return result;
 };
 const run=(p,session={})=>transaction(store=>handleOrg(p,store,session));
 const comment=(p,session=alice)=>transaction(async store=>{
  if(session.uid&&await store.get(closedAccountKey(session.uid)))return Response.json({error:'Account closed'},{status:409});
  const org=await store.get(p.code);if(!org)return Response.json({error:'Missing'},{status:404});
  const isAdmin=org.ownerUid===session.uid||p.admin===org.adminToken;
  return handleHatimComments(p,store,session,org,isAdmin,{now:()=>time,makeId:()=> (++sequence).toString(16).padStart(16,'0')});
 });
 return {run,comment,transaction,queries,rows:()=>rows,tick:(ms=601000)=>{time+=ms;},
  async group(session=alice,extra={}){return data(await run({action:'create',org:{...orgInput(),...extra}},session));},
  async post(code,n,extra={},session=alice){return data(await comment({action:'commentCreate',code,operationId:nonce(n),text:'Yorum '+n,name:'Takma ad',...extra},session),201);}};
}

test('public discovery, creation, publication and new claims require verified server membership while legacy guest rights survive',async()=>{
 const h=fixture(),pub={action:'create',org:{...orgInput(),public:true}};
 for(const p of [pub,{action:'discoverList'}]){
  assert.equal((await data(await h.run(p),401)).errorCode,'AUTH_REQUIRED');
  assert.equal((await data(await h.run(p,{uid:'unverified',emailVerified:false}),403)).errorCode,'EMAIL_UNVERIFIED');
 }
 const g=await h.group({},{}),personal={code:g.code,no:1,name:'Legacy guest',capability:'a'.repeat(64)};
 await data(await h.run({action:'claim',...personal}));
 await data(await h.run({action:'publish',code:g.code,admin:g.adminToken,public:true}),401);
 await data(await h.run({action:'publish',code:g.code,admin:g.adminToken,public:true},alice));
 assert.equal((await data(await h.run({action:'get',code:g.code}),401)).errorCode,'AUTH_REQUIRED');
 assert.equal((await data(await h.run({action:'get',code:g.code},{uid:'unverified',emailVerified:false}),403)).errorCode,'EMAIL_UNVERIFIED');
 assert.equal((await data(await h.run({action:'get',code:g.code,capability:personal.capability}))).org.items[0].mine,true);
 assert.equal((await data(await h.run({action:'get',code:g.code,capabilities:{1:personal.capability}}))).org.items[0].mine,true);
 assert.equal((await data(await h.run({action:'get',admin:g.adminToken}))).org.isAdmin,true);
 await data(await h.run({action:'claim',...personal})); // Lost old reply remains retryable.
 for(const action of ['complete','undo'])await data(await h.run({action,...personal}));
 await data(await h.run({action:'claim',...personal,no:2,capability:'b'.repeat(64)}),401);
 await data(await h.run({action:'claim',...personal,no:2,capability:'b'.repeat(64)},bob));
 await data(await h.run({action:'release',...personal}));
 await data(await h.run({action:'claim',...personal,capability:'c'.repeat(64)}),401);
 await data(await h.run({action:'get',code:g.code}),401);
 assert.equal((await data(await h.run({action:'get',code:g.code},alice))).org.isAdmin,false);
 assert.equal((await data(await h.run({action:'get',code:g.code},{...bob,emailVerified:false}))).org.items[1].mine,true,'an existing account participant retains recovery even if email verification changes');
 assert.equal((await data(await h.run({action:'discoverList'},alice))).items[0].code,g.code);
 await data(await h.run({action:'publish',code:g.code,admin:g.adminToken,public:false}));
 const invited=await h.group();await data(await h.run({action:'get',code:invited.code}));await data(await h.run({action:'claim',...personal,code:invited.code}));
});

test('Firebase user record, not request fields or a stale token claim, supplies verified membership',async()=>{
 const h=fixture();let verified=false;
 const handler=createOrgHandler({environment:()=>({CONTEXT:'production'}),transaction:h.transaction,
  services:()=>({auth:{verifyIdToken:async()=>({uid:'alice',email_verified:true}),getUser:async()=>({uid:'alice',emailVerified:verified,disabled:false})}})});
 const req=extra=>new Request('https://example.test/api/org',{method:'POST',headers:{authorization:'Bearer fixture'},body:JSON.stringify({action:'create',org:{...orgInput(),public:true},expectedUser:'alice',uid:'bob',emailVerified:true,...extra})});
 assert.equal((await data(await handler(req()),403)).errorCode,'EMAIL_UNVERIFIED');
 verified=true;const g=await data(await handler(req()));assert.equal(h.rows().get(g.code).ownerUid,'alice');
 await data(await handler(req({expectedUser:'bob'})),409);
 const revoked=createOrgHandler({environment:()=>({CONTEXT:'production'}),transaction:h.transaction,services:()=>({auth:{verifyIdToken:async()=>{throw Error('revoked');}}})});
 assert.equal((await data(await revoked(req()),401)).errorCode,'AUTH_REQUIRED');
});

test('comments use plaintext separate records, no public UID, strict input and authenticated authorship',async()=>{
 const h=fixture(),g=await h.group(),p={action:'commentCreate',code:g.code,operationId:nonce(1),text:'<img src=x onerror=alert(1)>',name:'<b>Ali</b>',ownerUid:'bob'};
 await data(await h.comment(p,{}),401);await data(await h.comment(p,{uid:'alice'}),403);
 const created=await data(await h.comment(p),201);assert.equal(created.comment.text,p.text);assert.equal(created.comment.name,p.name);
 assert.equal(created.comment.own,true);assert.equal(JSON.stringify(created).includes('ownerUid'),false);
 const publicCopy=await data(await h.comment({action:'commentList',code:g.code},bob));assert.equal(publicCopy.comments[0].own,false);
 assert.equal(publicCopy.commentCount,1);assert.equal(publicCopy.rootCommentCount,1);assert.equal(publicCopy.canComment,true);
 assert.equal(h.rows().get(g.code).comments,undefined);assert.equal(JSON.stringify(h.rows().get(g.code)).includes(p.text),false);
 for(const extra of [{text:''},{text:'x'.repeat(1501)},{name:'A'},{text:'bad\u0000text'},{operationId:'forged'}])await data(await h.comment({...p,...extra}),400);
 const viaGet=await data(await h.run({action:'get',code:g.code},alice));assert.equal(viaGet.org.commentCount,1);assert.equal(viaGet.org.canComment,true);
});

test('newest roots and replies page twenty at a time using only bounded prefix queries; replies stay one level',async()=>{
 const h=fixture(),g=await h.group(),ids=[];
 for(let n=1;n<=22;n++){h.tick();ids.push((await h.post(g.code,n)).comment.id);}
 const a=await data(await h.comment({action:'commentList',code:g.code})),b=await data(await h.comment({action:'commentList',code:g.code,cursor:a.nextCursor}));
 assert.deepEqual(a.comments.map(c=>c.id),ids.slice(2).reverse());assert.deepEqual(b.comments.map(c=>c.id),ids.slice(0,2).reverse());assert.equal(b.nextCursor,null);
 const parentId=ids[0],children=[];
 for(let n=23;n<=44;n++){h.tick();children.push((await h.post(g.code,n,{parentId})).comment.id);}
 const replies=await data(await h.comment({action:'commentReplies',code:g.code,parentId}));
 assert.deepEqual(replies.comments.map(c=>c.id),children.slice(2).reverse());assert.equal(replies.commentCount,44);assert.equal(replies.rootCommentCount,22);
 h.tick();await data(await h.comment({action:'commentCreate',code:g.code,operationId:nonce(45),name:'Ali',text:'Nested',parentId:children[0]}),409);
 await data(await h.comment({action:'commentList',code:g.code,cursor:'../private'}),400);
 assert.ok(h.queries.every(q=>q.limit===20&&q.prefix.startsWith('_hc_'+g.code+'_')));
});

test('create nonce retries never duplicate comments or consume quota and cannot be reused for changed content',async()=>{
 const h=fixture(),g=await h.group(),p={action:'commentCreate',code:g.code,operationId:nonce(1),text:'İlk yorum',name:'Ali'};
 const first=await data(await h.comment(p),201),second=await data(await h.comment(p));assert.equal(second.replayed,true);assert.equal(first.comment.id,second.comment.id);
 assert.equal(first.commentCount,1);assert.equal(second.commentCount,1);assert.equal(second.rootCommentCount,1);
 await data(await h.comment({...p,text:'Changed'}),409);
 const throttled=await data(await h.comment({...p,operationId:nonce(2)}),429);assert.equal(throttled.errorCode,'COMMENT_RATE_LIMIT');
 await data(await h.comment({action:'commentSettings',code:g.code,closed:true}));
 assert.equal((await data(await h.comment(p))).replayed,true,'a lost response is recoverable even after closing comments');
 h.tick();assert.equal((await data(await h.comment({...p,operationId:nonce(3)}),409)).errorCode,'COMMENTS_CLOSED');
 assert.equal(h.rows().get(g.code).commentCount,1);
});

test('only authors edit/delete; organizer hides without rewriting; parent tombstones retain readable replies',async()=>{
 const h=fixture(),g=await h.group(),parent=(await h.post(g.code,1,{},bob)).comment;h.tick();
 const child=(await h.post(g.code,2,{parentId:parent.id})).comment;
 await data(await h.comment({action:'commentEdit',code:g.code,id:parent.id,text:'Organizer rewrite'}),403);
 await data(await h.comment({action:'commentDelete',code:g.code,id:parent.id}),403);
 await data(await h.comment({action:'commentHide',code:g.code,id:parent.id,hidden:true},bob),403);
 await data(await h.comment({action:'commentHide',code:g.code,id:parent.id,hidden:true}));
 const hidden=await data(await h.comment({action:'commentList',code:g.code},bob));assert.equal(hidden.comments[0].text,'Bu yorum gizlendi');assert.equal(hidden.comments[0].moderatedText,undefined);
 const admin=await data(await h.comment({action:'commentList',code:g.code}));assert.equal(admin.comments[0].moderatedText,parent.text);
 await data(await h.comment({action:'commentHide',code:g.code,id:parent.id,hidden:false}));
 await data(await h.comment({action:'commentEdit',code:g.code,id:parent.id,text:'Yazar düzeltti'},bob));
 await data(await h.comment({action:'commentDelete',code:g.code,id:parent.id},bob));
 await data(await h.comment({action:'commentDelete',code:g.code,id:parent.id},bob));
 const roots=await data(await h.comment({action:'commentList',code:g.code}));assert.equal(roots.comments[0].text,'Bu yorum silindi');assert.equal(roots.comments[0].replyCount,1);
 const replies=await data(await h.comment({action:'commentReplies',code:g.code,parentId:parent.id}));assert.equal(replies.comments[0].id,child.id);assert.equal(replies.comments[0].deleted,false);
 assert.match((await data(await h.run({action:'delete',code:g.code,confirmed:true},alice),409)).error,/yorum.*arşivle/);
});

test('closed or archived hatim blocks new posts/edits but allows own deletion and organizer moderation',async()=>{
 const h=fixture(),g=await h.group(),c=(await h.post(g.code,1)).comment;h.tick();
 await data(await h.run({action:'archive',code:g.code},alice));
 const p={action:'commentCreate',code:g.code,operationId:nonce(2),text:'No',name:'Ali'};
 assert.equal((await data(await h.comment(p),409)).errorCode,'COMMENTS_CLOSED');
 await data(await h.comment({action:'commentEdit',code:g.code,id:c.id,text:'No'}),409);
 await data(await h.comment({action:'commentDelete',code:g.code,id:c.id}));
});

test('reports are deduplicated, private to organizers, resolvable and never leak reporter IDs',async()=>{
 const h=fixture(),g=await h.group(),c=(await h.post(g.code,1)).comment;
 const p={action:'commentReport',code:g.code,id:c.id,reason:'İncelensin'};
 await data(await h.comment(p,bob));assert.equal((await data(await h.comment(p,bob))).replayed,true);
 await data(await h.comment({action:'commentReports',code:g.code},bob),403);
 const reports=await data(await h.comment({action:'commentReports',code:g.code}));assert.equal(reports.reports.length,1);assert.equal(reports.reports[0].reason,p.reason);
 assert.equal(JSON.stringify(reports).includes('ownerUid'),false);assert.equal(JSON.stringify(reports).includes('bob'),false);
 const resolve={action:'commentResolveReport',code:g.code,id:reports.reports[0].id};
 await data(await h.comment(resolve,bob),403);await data(await h.comment(resolve));await data(await h.comment(resolve));
 assert.equal((await data(await h.comment({action:'commentReports',code:g.code}))).reports.length,0);
 assert.equal((await data(await h.comment({action:'commentList',code:g.code}))).comments[0].text,c.text);
});

test('account cleanup erases every own text, alias, UID, nonce and report reason while preserving other replies',async()=>{
 const h=fixture(),g=await h.group(),parent=(await h.post(g.code,1,{text:'Alice identity in text',name:'Alice name'})).comment;h.tick();
 const reply=(await h.post(g.code,2,{parentId:parent.id},bob)).comment;
 await data(await h.comment({action:'commentReport',code:g.code,id:reply.id,reason:'Alice private reason'}));
 // Force batching over twenty records without relaxing production rate limits.
 for(let n=3;n<=24;n++){h.tick();await h.post(g.code,n);}
 const cleaned=await anonymizeAccountComments(alice.uid,{transaction:h.transaction});assert.equal(cleaned.removed,24);
 assert.equal(h.rows().get(closedAccountKey('alice')).closedAt>0,true);
 const serialized=JSON.stringify([...h.rows()].filter(([k])=>k.startsWith('_hc_')||k.startsWith('_hcu_')));
 for(const secret of ['Alice identity in text','Alice name','Alice private reason','"ownerUid":"alice"'])assert.equal(serialized.includes(secret),false);
 const replies=await data(await h.comment({action:'commentReplies',code:g.code,parentId:parent.id},bob));assert.equal(replies.comments[0].id,reply.id);assert.equal(replies.comments[0].deleted,false);
 const roots=await data(await h.comment({action:'commentList',code:g.code},bob));assert.ok(roots.comments.every(c=>c.deleted&&c.text==='Bu yorum silindi'));
 assert.equal((await anonymizeAccountComments(alice.uid,{transaction:h.transaction})).removed,0);
 await data(await h.run({action:'commentCreate',code:g.code,operationId:nonce(99),name:'Alice',text:'No resurrection'},alice),409);
});

test('storage failures abort comment transactions instead of committing a partial post or rate charge',async()=>{
 const h=fixture(),g=await h.group(),before=structuredClone([...h.rows()]);
 await assert.rejects(h.transaction(async store=>{
  const org=await store.get(g.code),failing={...store,setJSON:async(k,v)=>{if(k.includes('_r_'))throw Error('storage unavailable');return store.setJSON(k,v);}};
  return handleHatimComments({action:'commentCreate',code:g.code,operationId:nonce(1),text:'No partial post',name:'Ali'},failing,alice,org,true);
 }),/storage unavailable/);
 assert.deepEqual([...h.rows()],before);
});

test('posting daily quota and reporting hourly quota reset only after their own server-time windows',async()=>{
 const h=fixture(),g=await h.group();let first;
 for(let n=1;n<=50;n++){h.tick();const created=await h.post(g.code,n);first??=created.comment;}
 h.tick();await data(await h.comment({action:'commentCreate',code:g.code,operationId:nonce(51),name:'Ali',text:'Quota exceeded'}),429);
 h.tick(86400001);await h.post(g.code,52);
 const roots=(await data(await h.comment({action:'commentList',code:g.code},bob))).comments.slice(0,6);
 for(const c of roots.slice(0,5))await data(await h.comment({action:'commentReport',code:g.code,id:c.id,reason:'Check'},bob));
 await data(await h.comment({action:'commentReport',code:g.code,id:roots[5].id,reason:'Check'},bob),429);
 h.tick(3600001);await data(await h.comment({action:'commentReport',code:g.code,id:roots[5].id,reason:'Check'},bob));
});

test('partially failed account comment cleanup retains remaining indexes for a retry and keeps the write lock',async()=>{
 const h=fixture(),g=await h.group();
 for(let n=1;n<=23;n++){h.tick();await h.post(g.code,n);}
 let pages=0;
 const interrupted=work=>h.transaction(store=>work({...store,query:async(...args)=>{if(++pages===2)throw Error('temporary cleanup outage');return store.query(...args);}}));
 await assert.rejects(anonymizeAccountComments('alice',{transaction:interrupted}),/temporary cleanup outage/);
 assert.ok(h.rows().get(closedAccountKey('alice')));
 assert.equal((await anonymizeAccountComments('alice',{transaction:h.transaction})).removed,3);
 const roots=await data(await h.comment({action:'commentList',code:g.code},bob));assert.ok(roots.comments.every(c=>c.deleted));
 await data(await h.run({action:'commentCreate',code:g.code,operationId:nonce(99),name:'Ali',text:'Blocked'},alice),409);
});
