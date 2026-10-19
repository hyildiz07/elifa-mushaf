import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
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
 const created=await run({action:'create',creationToken:'a'.repeat(64),org:{type:'hatim',title:'Preview-only',public:false,items:Array.from({length:30},(_,i)=>({no:i+1}))}});
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

test('actual default org, account and cleanup entries forward Netlify runtime deployment metadata without build variables',async()=>{
 const hook='__elifaRuntimeEntry_'+randomUUID().replaceAll('-',''),f=firestoreFixture();
 const fixture={serviceCalls:0,authCalls:0,legacyCalls:0,services(){this.serviceCalls++;return {db:f.db,auth:{verifyIdToken(){fixture.authCalls++;throw Error('Production Auth must not be contacted');},deleteUser(){fixture.authCalls++;throw Error('Production Auth deletion must not run');}}};}};
 globalThis[hook]=fixture;
 const variables=['CONTEXT','REVIEW_ID','DEPLOY_ID','DEPLOY_PRIME_URL','PULL_REQUEST','ELIFA_FIRESTORE_GROUPS'];
 const before=Object.fromEntries(variables.map(key=>[key,process.env[key]]));
 async function entry(name){
  const result=await build({entryPoints:[path.resolve('netlify/functions/'+name+'.mjs')],bundle:true,write:false,platform:'node',format:'esm',target:'node22',packages:'external',plugins:[{
   name:'only-infrastructure-is-mocked',setup(builder){
    builder.onResolve({filter:/(?:^|\/)firebase\.mjs$/},()=>({path:'firebase-services-spy',namespace:'fixture'}));
    builder.onResolve({filter:/^@netlify\/blobs$/},()=>({path:'legacy-store-bomb',namespace:'fixture'}));
    builder.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:args.path==='firebase-services-spy'
     ?`export function firebaseServices(){return globalThis[${JSON.stringify(hook)}].services();}`
     :`export function getStore(){globalThis[${JSON.stringify(hook)}].legacyCalls++;throw Error('Production Blobs must not initialize');}`,
     loader:'js'}));
   }
  }]});
  return (await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'))).default;
 }
 try{
  for(const key of variables)delete process.env[key];
  const [org,account,cleanup]=await Promise.all([entry('org'),entry('account'),entry('org-cleanup')]);
  const a={deploy:{context:'deploy-preview',id:'a'.repeat(24)}},b={deploy:{context:'deploy-preview',id:'b'.repeat(24)}};
  const config=await org(request({action:'discoverConfig'}),a);assert.equal(config.status,200);assert.equal((await config.json()).preview,true);
  const create=await org(request({action:'create',creationToken:'c'.repeat(64),org:{type:'hatim',title:'Runtime scoped',public:false,items:Array.from({length:30},(_,i)=>({no:i+1}))}}),a);
  assert.equal(create.status,200);const made=await create.json();
  const claimed=await org(request({action:'claim',code:made.code,no:1,name:'Runtime guest',capability:'d'.repeat(64)}),a);assert.equal(claimed.status,200);assert.equal((await claimed.json()).org.items[0].mine,true);
  const done=await org(request({action:'complete',code:made.code,no:1,capability:'d'.repeat(64)}),a);assert.equal(done.status,200);
  assert.equal((await org(request({action:'get',code:made.code}),b)).status,404);
  const serviceCount=fixture.serviceCalls;
  assert.equal((await account(request({action:'deleteAccount',confirmation:'DELETE'},{authorization:'Bearer production-user-token'}),a)).status,403);
  assert.equal((await org(request({action:'myList'},{authorization:'Bearer production-user-token'}),a)).status,403);
  assert.equal(fixture.serviceCalls,serviceCount,'both auth paths stop before service initialization');
  assert.equal((await cleanup(request({}),a)).status,200);
  // Runtime context remains authoritative even if a surrounding build/test
  // process advertises production. Parallel requests keep separate local scope.
  process.env.CONTEXT='production';process.env.ELIFA_FIRESTORE_GROUPS='enabled';
  const parallel=await Promise.all([org(request({action:'get',code:made.code,CONTEXT:'production'}),a),org(request({action:'get',code:made.code}),b)]);
  assert.equal(parallel[0].status,200);assert.equal(parallel[1].status,404);
  for(const context of [{deploy:{context:'deploy-preview',id:'bad'}},{deploy:{context:'branch-deploy',id:'a'.repeat(24)}},{deploy:{id:'a'.repeat(24)}}]){
   const count=fixture.serviceCalls;
   assert.equal((await org(request({action:'discoverConfig'}),context)).status,503);
   assert.equal((await account(request({action:'deleteAccount'}),context)).status,503);
   assert.equal((await cleanup(request({}),context)).status,503);
   assert.equal(fixture.serviceCalls,count);
  }
  assert.equal(fixture.authCalls,0);assert.equal(fixture.legacyCalls,0);
  const scoped=[a,b].map(context=>'elifaOrgPreviewRuns/deploy-'+context.deploy.id+'/records');
  assert.ok([...f.reads,...f.writes].every(value=>scoped.some(prefix=>value===prefix||value.startsWith(prefix+'/'))));
 }finally{
  for(const key of variables)if(before[key]===undefined)delete process.env[key];else process.env[key]=before[key];
  delete globalThis[hook];
 }
});
