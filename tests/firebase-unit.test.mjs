import {test} from 'node:test';
import assert from 'node:assert/strict';
import {verifyRequestOrigin,createAccountHandler} from '../server/account-handler.mjs';
import {expired} from '../netlify/functions/org-cleanup.mjs';
test('account endpoint refuses foreign origin and requests without a bearer token before touching Firebase',async()=>{
  const handler=createAccountHandler({services(){throw Error('must not initialize');}});
  const req=new Request('https://example.test/api/account',{method:'POST',headers:{origin:'https://other.test'}});
  assert.throws(()=>verifyRequestOrigin(req));assert.equal((await handler(req)).status,403);
  assert.equal((await handler(new Request('https://example.test/api/account',{method:'POST'}))).status,401);
  assert.equal((await handler(new Request('https://example.test/api/account'))).status,405);
});
test('group retention uses completion and activity, without expiring active unfinished groups',()=>{
  const now=Date.now(),day=86400000;
  assert.equal(expired({type:'hatim',lastActivity:now-8*day,items:[{status:'okundu'}]},now),true);
  assert.equal(expired({type:'hatim',lastActivity:now-8*day,items:[{status:'alindi'}]},now),false);
  assert.equal(expired({type:'zikir',lastActivity:now-61*day,hedef:100,contributions:[]},now),true);
});
