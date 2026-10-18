import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {updatePrivacyBehavior} from '../scripts/privacy-policy-behavior.mjs';
import {validateProfile} from '../src/account-profile-data.mjs';
import {handleOrg} from '../netlify/functions/org.mjs';
import {expired} from '../netlify/functions/org-cleanup.mjs';
const copies=JSON.parse(fs.readFileSync('locales/privacy-behavior-2026-10-19.json','utf8'));
const sections=['account','profile','workspace','deleteAccount','deleteEffects','visibility','keys','retention'];
const unescape=text=>text.replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/&gt;/g,'>').replace(/&lt;/g,'<').replace(/&amp;/g,'&');
const textOf=(html,key)=>unescape(html.match(new RegExp(`<p data-policy="${key}">([\\s\\S]*?)<\\/p>`))?.[1].replace(/<[^>]*>/g,'')||'');

test('every published privacy locale contains the current account and hatim notice and survives the build rewriter unchanged',()=>{
 const files=fs.readdirSync('gizlilik').filter(f=>f.endsWith('.html')).sort();
 assert.equal(files.length,21);assert.deepEqual(files,Object.keys(copies).map(l=>(l==='tr'?'index':l)+'.html').sort());
 for(const [locale,copy]of Object.entries(copies)){
  const html=fs.readFileSync('gizlilik/'+(locale==='tr'?'index':locale)+'.html','utf8');
  for(const section of sections)assert.equal(textOf(html,section),copy[section],locale+': '+section);
  assert.equal(updatePrivacyBehavior(html,copy),html,locale+': build rewriter must not duplicate or restore old notices');
  assert.match(textOf(html,'account'),/Firebase Authentication/);assert.match(textOf(html,'profile'),/Cloud Firestore/);
  assert.match(textOf(html,'retention'),/7/);assert.match(textOf(html,'retention'),/60/);
  for(const provider of ['Firebase Authentication','Cloud Firestore','QuranCDN','Google Analytics'])assert.ok(html.includes(provider),locale+': '+provider);
 }
 const tr=fs.readFileSync('gizlilik/index.html','utf8'),en=fs.readFileSync('gizlilik/en.html','utf8');
 assert.doesNotMatch(tr,/Uygulama isim istemez|Katılım kodunu bilen kişiler grubun izin verilen işlemlerine erişebilir|zamanlanmış temizliğe aday/);
 assert.doesNotMatch(en,/does not ask for your name|participation code can access the group.s permitted actions|eligible for scheduled cleanup/);
 assert.match(textOf(tr,'retention'),/silmez/);assert.match(textOf(en,'retention'),/does not delete/);
});

test('privacy migration preserves contact/deletion routes and refuses an unknown page layout',()=>{
 const legacy='<h1>Policy</h1>'+Array.from({length:14},(_,i)=>i===0?'<p>App · Developer: Company · old date · optional</p>':i===7?'<p><a href="mailto:info@elifaplatform.com">Contact</a></p>':'<p>Old '+i+'</p>').join('')+'<h2 id="account-deletion">Delete</h2>';
 const updated=updatePrivacyBehavior(legacy,copies.en);
 assert.match(updated,/id="account-deletion"/);assert.match(updated,/href="mailto:info@elifaplatform.com"/);
 assert.equal((updated.match(/data-policy="profile"/g)||[]).length,1);assert.equal((updated.match(/data-policy="retention"/g)||[]).length,1);
 assert.equal(updatePrivacyBehavior(updated,copies.en),updated);
 assert.throws(()=>updatePrivacyBehavior('<h1>Unknown</h1><p>one</p>',copies.en),/Unexpected legacy privacy layout/);
});

test('policy privacy boundaries match profile validation and actual public hatim responses',async()=>{
 const profile=validateProfile({displayName:'Takma ad',age:34,gender:'female'});assert.equal(profile.birthDate,null);
 assert.throws(()=>validateProfile({displayName:'Takma ad',age:34,birthDate:'1992-01-01'}));
 const org={code:'test01',type:'hatim',title:'Group',adminToken:'private-admin-token',ownerUid:'private-uid',age:34,email:'private@example.test',gender:'female',birthDate:'1992-01-01',items:[{no:1,name:'Takma ad',status:'alindi',claimHash:'private-hash',ownerUid:'private-uid'}]};
 const store={get:async()=>org};
 const response=await handleOrg({action:'get',code:'test01'},store),data=await response.json(),serialized=JSON.stringify(data);
 assert.equal(data.org.items[0].name,'Takma ad');assert.equal(data.org.items[0].mine,false);
 for(const key of ['age','birthDate','gender','email','ownerUid','claimHash','adminToken'])assert.equal(serialized.includes('"'+key+'"'),false,key+' must not become a public profile field');
 const denied=await handleOrg({action:'complete',code:'test01',no:1},store);assert.equal(denied.status,403,'a participation code grants no ownership');
 const now=Date.now(),day=86400000;
 assert.equal(expired({type:'hatim',items:[{status:'okundu'}],lastActivity:now-6*day},now),false);
 assert.equal(expired({type:'hatim',items:[{status:'okundu'}],lastActivity:now-8*day},now),true);
 assert.equal(expired({type:'hatim',items:[{status:'alindi'}],lastActivity:now-59*day},now),false);
 assert.equal(expired({type:'hatim',items:[{status:'alindi'}],lastActivity:now-61*day},now),true);
});
