import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createLocalOrgHandler} from '../scripts/local-org.mjs';
const req=(body,extra={})=>new Request('http://127.0.0.1:4173/api/org',{method:'POST',headers:{'content-type':'application/json',origin:'http://127.0.0.1:4173',...extra},body:JSON.stringify(body)});
test('local /api/org uses the real guest contract but every record stays in its isolated memory fixture',async()=>{
 const handler=createLocalOrgHandler(),capability='a'.repeat(64);
 const run=async p=>{const r=await handler(req(p));assert.equal(r.headers.get('x-elifa-local-test'),'memory-only');return {status:r.status,...await r.json()};};
 const list=await run({action:'discoverList'});assert.equal(list.localTest,true);assert.equal(list.status,401);
 const fixture=await run({action:'get',code:'test01'});assert.equal(fixture.status,200);assert.equal(fixture.org.public,false);assert.match(fixture.org.title,/Yerel test/);
 const created=await run({action:'create',creationToken:'b'.repeat(64),org:{type:'hatim',title:'Only local',public:false,items:Array.from({length:30},(_,i)=>({no:i+1}))}});assert.equal(created.status,200);
 const claim={action:'claim',code:created.code,no:1,name:'Local guest',capability};
 const [first,other]=await Promise.all([run(claim),run({...claim,capability:'c'.repeat(64)})]);assert.equal(first.status,200);assert.equal(other.status,409);assert.equal(first.org.items[0].mine,true);
 for(const action of ['complete','undo','release'])assert.equal((await run({...claim,action})).status,200);
 const otherInstance=createLocalOrgHandler(),missing=await otherInstance(req({action:'get',code:created.code}));assert.equal(missing.status,404);
 const unauthorized=await handler(req({action:'myList',expectedUser:'not-production'},{authorization:'Bearer never-forward-this'}));assert.equal(unauthorized.status,401);assert.match((await unauthorized.json()).error,/yerel/);
});
