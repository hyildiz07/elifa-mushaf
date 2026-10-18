import {test} from 'node:test';
import assert from 'node:assert/strict';
import {deploymentContext,PREVIEW_NOTICE} from '../server/deploy-context.mjs';
import {withOrgTransaction} from '../server/database.mjs';
import {createOrgHandler} from '../netlify/functions/org.mjs';
import {createDeployedAccountHandler} from '../netlify/functions/account.mjs';
const preview={CONTEXT:'deploy-preview',REVIEW_ID:'20'};
const encoded=key=>Buffer.from(key).toString('base64url');
function firestoreFixture(){
 let rows=new Map(),queue=Promise.resolve();const reads=[],writes=[];
 const collection=path=>({path,doc:id=>({path:path+'/'+id,collection:name=>collection(path+'/'+id+'/'+name)}),select:()=>({path,query:true})});
 const db={collection,runTransaction(work){const job=queue.then(async()=>{
  const pending=new Map([...rows].map(([k,v])=>[k,structuredClone(v)]));
  const result=await work({get:async ref=>{
   reads.push(ref.path);
   if(ref.query)return {docs:[...pending].filter(([k])=>k.startsWith(ref.path+'/')&&k.split('/').length===ref.path.split('/').length+1).map(([,v])=>({data:()=>structuredClone(v)}))};
   return {exists:pending.has(ref.path),data:()=>structuredClone(pending.get(ref.path))};
  },set:(ref,value)=>{writes.push(ref.path);pending.set(ref.path,structuredClone(value));}});
  rows=pending;return result;
 });queue=job.catch(()=>{});return job;}};
 return {db,reads,writes,seed:(path,value)=>rows.set(path,structuredClone(value)),snapshot:()=>structuredClone([...rows])};
}
const request=(payload,headers={})=>new Request('https://deploy-preview-20--example.netlify.app/api/org',{method:'POST',headers:{'content-type':'application/json',...headers},body:JSON.stringify(payload)});

test('preview context is explicit, validated and never falls through malformed or contradictory settings to production',()=>{
 assert.deepEqual(deploymentContext(preview),{kind:'preview',scope:'review-20'});
 assert.deepEqual(deploymentContext({CONTEXT:'deploy-preview',DEPLOY_ID:'a'.repeat(24)}),{kind:'preview',scope:'deploy-'+'a'.repeat(24)});
 assert.deepEqual(deploymentContext({CONTEXT:'production'}),{kind:'production'});
 assert.deepEqual(deploymentContext({}),{kind:'production'},'legacy production still uses its separate cutover gate');
 for(const environment of [{CONTEXT:'deploy-preview'},{CONTEXT:'deploy-preview',REVIEW_ID:'../production',DEPLOY_ID:'a'.repeat(24)},{CONTEXT:'deploy-preview',REVIEW_ID:'0'},{CONTEXT:'branch-deploy'},{REVIEW_ID:'20'},{CONTEXT:'production',REVIEW_ID:'20'},{DEPLOY_PRIME_URL:'https://deploy-preview-20--example.netlify.app'}])assert.throws(()=>deploymentContext(environment));
});

test('preview guest create and claim use only the review-scoped collection with no production or Blobs fallback',async()=>{
 const f=firestoreFixture();let legacyCalls=0,authCalls=0;
 const prodPath='elifaOrgRecords/'+encoded('_config'),prod={key:'_config',deleted:false,value:JSON.stringify({discoverEnabled:false})};f.seed(prodPath,prod);
 const services=()=>({db:f.db,auth:{verifyIdToken(){authCalls++;throw Error('Production Auth must not run');}}});
 const legacyStore=()=>{legacyCalls++;throw Error('Production Blobs must not initialize');};
 const handler=environment=>createOrgHandler({services,environment:()=>environment,transaction:work=>withOrgTransaction(work,{environment,services,legacyStore})});
 const run=async(payload,env=preview)=>{const r=await handler(env)(request(payload));assert.equal(r.status,200,await r.clone().text());return r.json();};
 const config=await run({action:'discoverConfig'});assert.equal(config.enabled,true);assert.equal(config.preview,true);assert.equal(config.previewNotice,PREVIEW_NOTICE);
 const created=await run({action:'create',creationToken:'a'.repeat(64),org:{type:'hatim',title:'Preview-only',public:true,items:Array.from({length:30},(_,i)=>({no:i+1}))}});
 const claimed=await run({action:'claim',code:created.code,no:1,name:'Preview guest',capability:'b'.repeat(64)});assert.equal(claimed.org.items[0].mine,true);
 const again=await run({action:'get',code:created.code,capability:'b'.repeat(64)});assert.equal(again.org.items[0].mine,true);
 const another=await handler({...preview,REVIEW_ID:'21'})(request({action:'get',code:created.code}));assert.equal(another.status,404);
 assert.equal(legacyCalls,0);assert.equal(authCalls,0);
 assert.ok([...f.reads,...f.writes].every(path=>path.startsWith('elifaOrgPreviewRuns/review-20/records/')||path.startsWith('elifaOrgPreviewRuns/review-21/records/')));
 assert.deepEqual(f.snapshot().find(([path])=>path===prodPath)?.[1],prod);
});

test('preview rejects account tokens before Auth verification or an org transaction',async()=>{
 let services=0,transactions=0;
 const handler=createOrgHandler({environment:()=>preview,services(){services++;throw Error('must not initialize');},transaction(){transactions++;throw Error('must not write');}});
 for(const authorization of ['Bearer real-account-token','']){
  const r=await handler(request({action:'claim',code:'test01',no:1},{authorization}));assert.equal(r.status,403);assert.equal((await r.json()).preview,true);
 }
 assert.equal(services,0);assert.equal(transactions,0);
});

test('preview blocks every account cloud action before production Auth, profile or deletion services initialize',async()=>{
 let serviceCalls=0,detachCalls=0;
 const handler=createDeployedAccountHandler({environment:()=>preview,services(){serviceCalls++;throw Error('including Auth.deleteUser must not run');},detachMemberships(){detachCalls++;throw Error('must not touch memberships');}});
 for(const action of ['list','profileGet','profilePut','syncPut','save','deleteAccount']){
  const r=await handler(request({action,expectedUser:'real-user',confirmation:'DELETE'},{authorization:'Bearer real-token'}));assert.equal(r.status,403);assert.equal((await r.json()).preview,true);
 }
 assert.equal(serviceCalls,0);assert.equal(detachCalls,0);
});

test('invalid deployment contexts fail before any account or org database service can be used',async()=>{
 let calls=0;const services=()=>{calls++;throw Error('must not initialize');};
 for(const environment of [{CONTEXT:'deploy-preview'},{CONTEXT:'production',REVIEW_ID:'20'},{CONTEXT:'branch-deploy'}]){
  const account=createDeployedAccountHandler({environment:()=>environment,services});assert.equal((await account(request({action:'deleteAccount'}))).status,503);
  const org=createOrgHandler({environment:()=>environment,services});assert.equal((await org(request({action:'create'}))).status,503);
  await assert.rejects(withOrgTransaction(()=>{}, {environment,services}));
 }
 assert.equal(calls,0);
});

test('production still requires cutover and uses the original collection and legacy adapter only after it is enabled',async()=>{
 const f=firestoreFixture();let serviceCalls=0,legacyCalls=0;
 const services=()=>{serviceCalls++;return {db:f.db};},legacyStore=()=>{legacyCalls++;return {get:async()=>null,list:async()=>({blobs:[]})};};
 await assert.rejects(withOrgTransaction(()=>{}, {environment:{CONTEXT:'production'},services,legacyStore}),/cutover/);
 assert.equal(serviceCalls,0);assert.equal(legacyCalls,0);
 await withOrgTransaction(store=>store.setJSON('test01',{type:'hatim'}), {environment:{CONTEXT:'production',ELIFA_FIRESTORE_GROUPS:'enabled'},services,legacyStore});
 assert.equal(serviceCalls,1);assert.equal(legacyCalls,1);assert.deepEqual(f.writes,['elifaOrgRecords/'+encoded('test01')]);
 const handler=createDeployedAccountHandler({environment:()=>({CONTEXT:'production'}),services(){throw Error('GET must reject without Firebase');}});
 assert.equal((await handler(new Request('https://example.test/api/account'))).status,405);
});
