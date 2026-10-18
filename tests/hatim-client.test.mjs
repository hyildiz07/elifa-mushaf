import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {webcrypto} from 'node:crypto';
import {dueText,parseHatimLink,participationUrl,recoveryUrl,adminUrl,canonicalHatimUrl,secret,loadLocal,createOrgClient} from '../src/hatim-client.mjs';

const key='ab'.repeat(32),code='abc234',base='https://mushaf.elifaplatform.com/';
test('target date treats today, yesterday and tomorrow as local calendar dates, including DST boundaries',()=>{
 const now=new Date(2026,9,18,23,59,59);
 assert.equal(dueText('2026-10-17',now),'Hedef tarih geçti');
 assert.equal(dueText('2026-10-18',now),'Hedef bugün');
 assert.equal(dueText('2026-10-19',now),'Hedef yarın');
 assert.equal(dueText('2026-10-23',now),'5 gün kaldı');
 assert.equal(dueText('2026-03-30',new Date(2026,2,29,0,30)),'Hedef yarın');
});
test('target date follows the viewer timezone rather than the UTC date',()=>{
 const moduleUrl=new URL('../src/hatim-client.mjs',import.meta.url).href;
 const script=`import {dueText} from ${JSON.stringify(moduleUrl)};console.log(dueText('2026-10-19',new Date('2026-10-18T21:30:00Z')));`;
 const run=tz=>execFileSync(process.execPath,['--input-type=module','-e',script],{encoding:'utf8',env:{...process.env,TZ:tz}}).trim();
 assert.equal(run('Europe/Istanbul'),'Hedef bugün');
 assert.equal(run('UTC'),'Hedef yarın');
 assert.equal(run('America/Los_Angeles'),'Hedef yarın');
});
test('invalid or non-existent target dates do not produce a misleading countdown',()=>{
 for(const invalid of ['',null,undefined,'2026-02-29','2026-04-31','2026-00-10','2026-13-01','2026-10-00','2026-10-32','18.10.2026','2026-1-1','garbage'])assert.equal(dueText(invalid),'',String(invalid));
 assert.equal(dueText('2028-02-29',new Date(2028,1,28)),'Hedef yarın');
});
test('public codes and current and legacy administrator links parse without exposing another credential',()=>{
 assert.deepEqual(parseHatimLink('  '+code+'  '),{code});
 assert.deepEqual(parseHatimLink('?k='+code,base),{code});
 assert.deepEqual(parseHatimLink(base+'?k='+code),{code});
 assert.deepEqual(parseHatimLink(base+'#yonetim='+key.slice(0,32)),{admin:key.slice(0,32)});
 assert.deepEqual(parseHatimLink(base+'?y=abc234abc234'),{admin:'abc234abc234'});
 assert.deepEqual(parseHatimLink(base+'?y='+key.slice(0,32)),{admin:key.slice(0,32)});
 assert.deepEqual(parseHatimLink(base+'?k='+code+'#yonetim='+key.slice(0,32)),{admin:key.slice(0,32)});
 for(const invalid of ['abc23','ABC234','abc2347',base+'?k=ABC234',base+'?y=short','http://[invalid'])assert.equal(parseHatimLink(invalid),null,invalid);
});
test('participant recovery requires a complete valid code, juz and secret; malformed recovery never degrades to a public link',()=>{
 const link=recoveryUrl(base,code,30,key);
 assert.deepEqual(parseHatimLink(link),{code,no:30,capability:key});
 for(const hash of [
  `hatim=${code}&cuz=0&key=${key}`,`hatim=${code}&cuz=31&key=${key}`,`hatim=${code}&cuz=1.5&key=${key}`,
  `hatim=${code}&cuz=1&key=short`,`hatim=${code}&cuz=1&key=${key.toUpperCase()}`,
  `hatim=bad&cuz=1&key=${key}`,`hatim=${code}&key=${key}`,`hatim=${code}&cuz=1`
 ])assert.equal(parseHatimLink(base+'?k='+code+'#'+hash),null,hash);
});
test('share links strip existing secrets while recovery and administrator credentials remain in fragments only',()=>{
 const dirty=base+'?y=abc234abc234&key=secret&token=private&k=old123#hatim=old123&key=secret';
 const publicLink=new URL(participationUrl(dirty,code));assert.equal(publicLink.search,'?k='+code);assert.equal(publicLink.hash,'');
 const recovery=new URL(recoveryUrl(dirty,code,5,key));assert.equal(recovery.search,'');assert.equal(recovery.href.includes('?'),false);assert.deepEqual(parseHatimLink(recovery.href),{code,no:5,capability:key});
 const admin=new URL(adminUrl(dirty,key.slice(0,32)));assert.equal(admin.search,'');assert.equal(admin.hash,'#yonetim='+key.slice(0,32));
 assert.deepEqual(parseHatimLink(admin.href),{admin:key.slice(0,32)});
});
test('canonical reload addresses follow the current hatim while preserving unrelated parameters and removing every known private credential',()=>{
 const dirty=base+'?k=old123&review=357&lang=tr&y='+adminUrl(base,'a'.repeat(32)).split('=').pop()+'&adminToken=private&key=private&token=private&capability=private&hatim=old123&cuz=2#hatim=old123&key=private';
 const updated=new URL(canonicalHatimUrl(dirty,code));assert.equal(updated.searchParams.get('k'),code);assert.equal(updated.searchParams.get('review'),'357');assert.equal(updated.searchParams.get('lang'),'tr');assert.equal(updated.hash,'');
 for(const name of ['y','adminToken','key','token','capability','hatim','cuz'])assert.equal(updated.searchParams.has(name),false,name);
 assert.deepEqual(parseHatimLink(updated.href),{code});
 const home=new URL(canonicalHatimUrl(updated.href));assert.equal(home.searchParams.has('k'),false);assert.equal(home.searchParams.get('review'),'357');assert.equal(parseHatimLink(home.href),null);
 assert.throws(()=>canonicalHatimUrl(base,'bad'),/kodu geçersiz/);
});
test('participant secrets use 32 cryptographic random bytes and never rely on Math.random',()=>{
 const a=secret(webcrypto),b=secret(webcrypto);assert.match(a,/^[a-f0-9]{64}$/);assert.match(b,/^[a-f0-9]{64}$/);assert.notEqual(a,b);
 let requested=0;assert.equal(secret({getRandomValues:array=>{requested=array.length;array.fill(255);return array;}}),'ff'.repeat(32));assert.equal(requested,32);
});
test('malformed or blocked local storage recovers an empty guest state without trusting arrays as records',()=>{
 const empty=()=>loadLocal({getItem:()=>null},'key');
 for(const value of ['{bad','[]','null','42','"text"'])assert.deepEqual(loadLocal({getItem:()=>value},'key'),empty());
 assert.deepEqual(loadLocal({getItem(){throw Error('SecurityError')}},'key'),empty());
 const value=loadLocal({getItem:()=>JSON.stringify({mine:'bad',myName:42,guestWarned:false})},'key');assert.deepEqual(value.mine,[]);assert.equal(value.myName,'');
});
test('local capability and claim maps reject malformed nested containers before the UI uses them',()=>{
 const state=loadLocal({getItem:()=>JSON.stringify({pending:[],claimed:'bad',capabilities:42,snapshots:[],creation:'bad'})},'key');
 for(const field of ['pending','claimed','capabilities','snapshots'])assert.deepEqual(state[field],{},field);
 assert.equal(state.creation,null);
});
test('offline, non-JSON and server-denied mutations never return fabricated success',async()=>{
 for(const fetcher of [async()=>{throw Error('offline')},async()=>({json:async()=>{throw Error('HTML error page')}})]){
  const api=createOrgClient({session:()=>null,fetcher});await assert.rejects(api({action:'claim',code,no:1}),/kaydedildi sayılmadı/);
 }
 let observed;const api=createOrgClient({session:()=>null,fetcher:async()=>Response.json({error:'Bu cüz sana ait değil'},{status:403}),onError:e=>observed=e});
 await assert.rejects(api({action:'done',code,no:1}),e=>e.status===403&&e.message==='Bu cüz sana ait değil');assert.equal(observed.status,403);
});
test('member requests send their verified proof and captured expectedUser; guest requests omit both',async()=>{
 const requests=[];const fetcher=async(url,options)=>{requests.push({url,...options});return Response.json({ok:true})};
 const api=createOrgClient({base:'https://api.example.test',session:()=>({getUser:()=>({uid:'A'}),getIdToken:async()=> 'proof-A'}),fetcher});
 assert.deepEqual(await api({action:'claim',code,no:1,expectedUser:'spoofed'}),{ok:true});
 assert.equal(requests[0].url,'https://api.example.test/api/org');assert.equal(requests[0].headers.Authorization,'Bearer proof-A');assert.equal(JSON.parse(requests[0].body).expectedUser,'A');assert.equal(requests[0].method,'POST');
 await createOrgClient({session:()=>null,fetcher})({action:'get',code});assert.equal(requests[1].headers.Authorization,undefined);assert.equal(JSON.parse(requests[1].body).expectedUser,undefined);
});
test('member identity change while retrieving a token refuses the write before fetch',async()=>{
 let uid='A',called=0;const current={getUser:()=>({uid}),getIdToken:async()=>{uid='B';return 'proof-A'}};
 const api=createOrgClient({session:()=>current,fetcher:async()=>{called++;return Response.json({ok:true})}});
 await assert.rejects(api({action:'claim',code,no:1}),/Hesap değişti/);assert.equal(called,0);
 const missing=createOrgClient({session:()=>({getUser:()=>({uid:'A'}),getIdToken:async()=>null}),fetcher:async()=>{called++}});await assert.rejects(missing({action:'create'}),/Hesap değişti/);assert.equal(called,0);
});
test('member or guest identity changes during response decoding cannot apply another session result',async()=>{
 for(const initial of ['A',null]){
  let uid=initial;const current={getUser:()=>uid?{uid}:null,getIdToken:async()=> 'proof-A'};
  const api=createOrgClient({session:()=>current,fetcher:async()=>({ok:true,json:async()=>{uid='B';return {ok:true,code}}})});
  await assert.rejects(api({action:'claim',code,no:1}),/Hesap değişti/);
 }
});
test('organization responses normalize the root code exactly once before any UI bookkeeping',async()=>{
 const api=createOrgClient({session:()=>null,fetcher:async()=>Response.json({code,org:{code:'wrong1',title:'Hatim'}})});
 const response=await api({action:'get',code});assert.equal(response.org.code,code);assert.equal(response.code,code);
 const missing=createOrgClient({session:()=>null,fetcher:async()=>Response.json({org:{title:'Hatim'}})});await assert.rejects(missing({action:'get',code}),/geçerli kod yok/);
 const malformed=createOrgClient({session:()=>null,fetcher:async()=>Response.json(null)});await assert.rejects(malformed({action:'get',code}),/yanıtı geçersiz/);
});
