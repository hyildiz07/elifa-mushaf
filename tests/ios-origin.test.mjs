import test from 'node:test';
import assert from 'node:assert/strict';
import {createAccountHandler} from '../server/account-handler.mjs';
import orgHandler from '../netlify/functions/org.mjs';

const account=createAccountHandler({services:()=>{throw Error('Auth should not run for preflight or missing tokens');}});
const url='https://mushaf.elifaplatform.com/api/account';

test('iOS account preflight allows only the packaged app origin',async()=>{
 const good=await account(new Request(url,{method:'OPTIONS',headers:{Origin:'capacitor://localhost','Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'Authorization, Content-Type'}}));
 assert.equal(good.status,204);
 assert.equal(good.headers.get('Access-Control-Allow-Origin'),'capacitor://localhost');
 assert.match(good.headers.get('Access-Control-Allow-Headers'),/Authorization/);
 const evil=await account(new Request(url,{method:'OPTIONS',headers:{Origin:'https://evil.example'}}));
 assert.equal(evil.headers.get('Access-Control-Allow-Origin'),null);
});

test('iOS account calls still require a Firebase token and reject foreign origins',async()=>{
 const native=await account(new Request(url,{method:'POST',headers:{Origin:'capacitor://localhost','Content-Type':'application/json'},body:'{}'}));
 assert.equal(native.status,401);
 assert.equal(native.headers.get('Access-Control-Allow-Origin'),'capacitor://localhost');
 const evil=await account(new Request(url,{method:'POST',headers:{Origin:'https://evil.example','Content-Type':'application/json'},body:'{}'}));
 assert.equal(evil.status,403);
 assert.equal(evil.headers.get('Access-Control-Allow-Origin'),null);
});

test('iOS group preflight and invalid requests are scoped to the app origin',async()=>{
 const endpoint='https://mushaf.elifaplatform.com/api/org';
 const preflight=await orgHandler(new Request(endpoint,{method:'OPTIONS',headers:{Origin:'capacitor://localhost'}}));
 assert.equal(preflight.status,204);
 assert.equal(preflight.headers.get('Access-Control-Allow-Origin'),'capacitor://localhost');
 const invalid=await orgHandler(new Request(endpoint,{method:'POST',headers:{Origin:'capacitor://localhost','Content-Type':'application/json'},body:'{}'}));
 assert.equal(invalid.headers.get('Access-Control-Allow-Origin'),'capacitor://localhost');
 assert.equal((await invalid.json()).error,'İşlem belirtilmedi');
});
