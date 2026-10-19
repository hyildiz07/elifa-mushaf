import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import {webcrypto} from 'node:crypto';
import * as client from '../src/hatim-client.mjs';
const source=fs.readFileSync('src/hatim-community.mjs','utf8').replace(/^import .*;\r?\n/gm,'');
const codeA='aaaaaa',codeB='bbbbbb',capA='aa'.repeat(32),capB='bb'.repeat(32),admin='a'.repeat(32);
const org=(code,items=[],isAdmin=true)=>({type:'hatim',title:code,items,isAdmin,adminName:'Owner',archived:false});
const current=(code,items=[],ticket=1)=>({code,ticket,adminToken:admin,org:org(code,items)});
function harness(fetcher,options={}){
 const nodes=new Map(),map=options.localMap||new Map(),sessionMap=options.sessionMap||new Map(),events=new Map(),windowEvents=new Map(),sessionListeners=new Set(),calls=[],reports=[],navigation=[];let currentUser=options.uid?{uid:options.uid,emailVerified:options.emailVerified!==false}:null,ready=options.ready!==false;
 const get=id=>{if(!nodes.has(id))nodes.set(id,{id,value:'',innerHTML:'',textContent:'',style:{},open:false,disabled:false,handlers:{},classList:{contains:()=>true},addEventListener(type,fn){this.handlers[type]=fn},querySelector(sel){return get(this.id+':'+sel)},querySelectorAll(){return []},showModal(){this.open=true},close(){this.open=false}});return nodes.get(id);};
 const storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};
 const c={...client,createHatimComments:()=>({mount(){},pause(){},dispose(){},dispatch:async()=>{}}),downloadHatimReport:async(o,options)=>reports.push({org:o,...options}),console,URL,URLSearchParams,AbortSignal,Uint8Array,Map,Set,Object,Number,JSON,Date,crypto:webcrypto,
  document:{getElementById:get,querySelector:()=>null,addEventListener(type,fn){events.set(type,fn)},hidden:false},
  window:{localStorage:storage,sessionStorage:options.blockSession?{getItem(){throw Error('blocked')},setItem(){throw Error('blocked')},removeItem(){throw Error('blocked')}}:{getItem:k=>sessionMap.get(k)||null,setItem:(k,v)=>sessionMap.set(k,v),removeItem:k=>sessionMap.delete(k)},elifaAccountSession:{getUser:()=>currentUser,isReady:()=>ready,getIdToken:async()=>currentUser?'proof-'+currentUser.uid:null,onChange(fn){sessionListeners.add(fn);if(ready)fn(currentUser);return ()=>sessionListeners.delete(fn)}},addEventListener(type,fn){if(!windowEvents.has(type))windowEvents.set(type,[]);windowEvents.get(type).push(fn)},removeEventListener(type,fn){windowEvents.set(type,(windowEvents.get(type)||[]).filter(x=>x!==fn))}},
  location:{origin:'https://example.test',href:options.url||'https://example.test/'},history:{state:{elifaTrap:true,custom:'preserve'},replaceState(state,title,url){navigation.push({state,title,url});c.location.href=String(url)}},navigator:{},setInterval:()=>1,clearInterval(){},show(){},openTogetherScreen(){},setElifaRoute(){},gotoPage(){},JUZ_PAGE:[],readerReturn:null,
  fetch:async(_url,options)=>{const p=JSON.parse(options.body);calls.push(p);return fetcher?fetcher(p,{map,calls}):Response.json({org:org(p.code),code:p.code});}
 };
 vm.createContext(c);vm.runInContext(source+`\nwindow.review={showReturnEntry,showManage,showAdminCuz,showJuz,showCreate,confirmRelease,confirmDeleteHatim,showClaim,showRecovery,bkOpen,bkSilentRefresh,renderBirlikte,setTab:t=>{tab=t;},setCurrent:c=>{current=c;generation=c.ticket;},setLocal:l=>local=loadLocal({getItem:()=>JSON.stringify(l)},'fixture'),state:()=>({local,current})};`,c);
 const click=async id=>{const button=get('hatimDialog:[data-hc="'+id+'"]');assert.ok(button.handlers.click,'button '+id);await button.handlers.click({currentTarget:button});};
 return {c,get,map,sessionMap,calls,reports,navigation,events,storage,click,review:c.window.review,account:uid=>{currentUser=uid?{uid,emailVerified:true}:null;ready=true;for(const fn of [...sessionListeners])fn(currentUser);for(const fn of [...windowEvents.get('elifa:account-changed')||[]])fn({detail:{user:currentUser}});}};
}
test('an administrator dialog from hatim A cannot apply its title or status to hatim B',async()=>{
 const h=harness();h.review.setCurrent(current(codeA));h.review.showManage();h.get('hcEditTitle').value='A title edit';h.get('hcEditDue').value='';h.review.setCurrent(current(codeB,[],2));await h.click('save');
 assert.equal(h.calls.length,0);assert.match(h.get('hcError').textContent,/değişti/);
});
test('navigating while an A release response is pending cannot delete B recovery capability',async()=>{
 let resolve;const h=harness(p=>new Promise(r=>resolve=()=>r(Response.json({org:org(p.code),code:p.code}))));
 h.review.setLocal({mine:[{code:codeA,type:'hatim'},{code:codeB,type:'hatim'}],capabilities:{[codeA]:{1:capA},[codeB]:{1:capB}}});
 h.review.setCurrent(current(codeA));h.review.confirmRelease(1);const pending=h.click('release');await new Promise(r=>setImmediate(r));
 h.review.setCurrent(current(codeB,[],2));resolve();await pending;
 assert.equal(h.calls[0].code,codeA);assert.equal(h.review.state().local.capabilities[codeB][1],capB);
});
test('ambiguous claim failure keeps a discoverable pending record and retries the same persisted capability',async()=>{
 let fail=true;const tokens=[];const h=harness((p,{map})=>{
  if(p.action==='claim'){tokens.push(p.capability);const stored=JSON.parse(map.get('elifa_hatim_guest_v2'));assert.equal(stored.pendingClaims[codeA][1].token,p.capability);if(fail){fail=false;throw Error('lost response');}}
  return Response.json({code:p.code,org:org(p.code,[{no:1,status:'alindi',mine:true,name:'Guest'}],false)});
 });
 h.review.setCurrent(current(codeA,[{no:1,status:'bos'}]));h.review.showClaim(1);h.get('hcName').value='Guest';await h.click('claim');
 assert.match(h.get('hcError').textContent,/kaydedildi sayılmadı/);assert.equal(h.review.state().local.mine[0].code,codeA);assert.ok(h.review.state().local.pendingClaims[codeA][1]);
 await h.click('claim');assert.equal(tokens.length,2);assert.equal(tokens[0],tokens[1]);assert.equal(h.review.state().local.capabilities[codeA][1],tokens[0]);assert.equal(h.review.state().local.pendingClaims[codeA][1],undefined);
});
test('claiming a newly free juz never reuses an old confirmed/revoked capability',async()=>{
 const h=harness(p=>Response.json({code:p.code,org:org(p.code,[{no:1,status:'alindi',mine:true}],false)}));
 h.review.setLocal({mine:[{code:codeA,type:'hatim'}],capabilities:{[codeA]:{1:capA}}});h.review.setCurrent(current(codeA,[{no:1,status:'bos'}]));h.review.showClaim(1);h.get('hcName').value='Guest';await h.click('claim');
 assert.notEqual(h.calls[0].capability,capA);assert.match(h.calls[0].capability,/^[a-f0-9]{64}$/);
});
test('storage that silently refuses writes cannot create a server-side guest claim',async()=>{
 const h=harness();h.storage.setItem=()=>{};h.review.setCurrent(current(codeA,[{no:1,status:'bos'}]));h.review.showClaim(1);h.get('hcName').value='Guest';await h.click('claim');
 assert.equal(h.calls.length,0);assert.match(h.get('hcError').textContent,/kayıt saklayamıyor/);
});
test('fresh server ownership loss clears stale my-juz snapshots and confirmed guest proof',async()=>{
 const h=harness(p=>Response.json({code:p.code,org:org(p.code,[{no:1,status:'alindi',mine:false,name:'Other'}],false)}));
 h.review.setLocal({mine:[{code:codeA,type:'hatim',title:'Old'}],claimed:{[codeA]:[1]},capabilities:{[codeA]:{1:capA}},snapshots:{[codeA]:{items:[{no:1,status:'alindi',mine:true}]}}});
 await h.review.bkOpen(codeA);const state=h.review.state().local;assert.deepEqual([...state.claimed[codeA]],[]);assert.equal(state.capabilities[codeA][1],undefined);assert.deepEqual([...state.snapshots[codeA].items],[]);assert.equal(state.mine[0].code,codeA);
});
test('administrator recovery issuance persists before the request and reuses its key after an ambiguous failure',async()=>{
 let failed=false;const tokens=[];const h=harness((p,{map})=>{
  if(p.action==='issueRecovery'){tokens.push(p.capability);const stored=JSON.parse(map.get('elifa_hatim_guest_v2'));assert.equal(stored.pendingRecovery[codeA][1].token,p.capability);if(!failed){failed=true;throw Error('lost response');}}
  return Response.json({code:p.code,org:org(p.code,[{no:1,status:'alindi',mine:false,name:'Guest'}])});
 });
 h.review.setCurrent(current(codeA,[{no:1,status:'alindi',mine:false}]));h.review.showAdminCuz();h.get('hcAdminJuz').value='1';await h.click('recovery');await h.click('confirm');assert.match(h.get('hcError').textContent,/kaydedildi sayılmadı/);
 await h.click('confirm');assert.equal(tokens.length,2);assert.equal(tokens[0],tokens[1]);assert.equal(h.review.state().local.pendingRecovery[codeA][1].confirmed,true);
});
test('report export fetches the current server snapshot and refuses a late response from another hatim',async()=>{
 let resolve;const h=harness(p=>new Promise(r=>resolve=()=>r(Response.json({code:p.code,org:{...org(p.code),title:'Fresh server title'}}))));
 h.review.setCurrent(current(codeA));h.review.showManage();const pending=h.click('report-png');await new Promise(r=>setImmediate(r));h.review.setCurrent(current(codeB,[],2));resolve();await pending;assert.equal(h.reports.length,0);
 h.review.showManage();const valid=h.click('report-pdf');await new Promise(r=>setImmediate(r));resolve();await valid;assert.equal(h.reports.length,1);assert.equal(h.reports[0].org.title,'Fresh server title');assert.equal(h.reports[0].org.code,codeB);assert.equal(h.reports[0].format,'pdf');
});
test('guest hatim creation stores its operation secret before POST and retries without creating another operation',async()=>{
 let fail=true;const tokens=[];const h=harness((p,{map})=>{
  if(p.action==='discoverConfig')return Response.json({enabled:true});
  if(p.action==='create'){tokens.push(p.creationToken);assert.equal(JSON.parse(map.get('elifa_hatim_guest_v2')).creation.token,p.creationToken);if(fail){fail=false;throw Error('lost response');}return Response.json({code:codeA,adminToken:admin,org:org(codeA)});}
  return Response.json({code:p.code,org:org(p.code)});
 });
 h.c.location.href='https://example.test/?k=test01&create-review=357';h.review.showCreate();h.get('hcTitle').value='Aile hatmi';h.get('hcAdminName').value='Misafir';h.get('hcDue').value='';await h.click('create');assert.match(h.get('hcError').textContent,/kaydedildi sayılmadı/);
 await h.click('create');assert.equal(tokens.length,2);assert.equal(tokens[0],tokens[1]);assert.equal(h.review.state().local.creation,null);assert.equal(h.review.state().local.mine[0].adminToken,admin);assert.equal(new URL(h.c.location.href).searchParams.get('k'),codeA);assert.equal(new URL(h.c.location.href).searchParams.get('create-review'),'357');
});
test('a late group-open reply cannot replace a different group that is already visible',async()=>{
 let resolveA;const h=harness(p=>p.code===codeA?new Promise(r=>resolveA=()=>r(Response.json({code:codeA,org:org(codeA)}))):Response.json({code:codeB,org:org(codeB)}));
 const a=h.review.bkOpen(codeA);await new Promise(r=>setImmediate(r));await h.review.bkOpen(codeB);resolveA();await a;
 assert.equal(h.review.state().current.code,codeB);assert.equal(h.review.state().local.mine.some(x=>x.code===codeA),false);
});
test('opening a different hatim replaces the reload code without pushing history or retaining private credentials',async()=>{
 const h=harness();h.c.location.href='https://example.test/?k=test01&method-review=357&y='+admin+'#yonetim='+admin;
 const originalState=h.c.history.state;await h.review.bkOpen(codeB);
 assert.equal(new URL(h.c.location.href).searchParams.get('k'),codeB);assert.equal(new URL(h.c.location.href).searchParams.get('method-review'),'357');assert.equal(new URL(h.c.location.href).searchParams.has('y'),false);assert.equal(new URL(h.c.location.href).hash,'');
 assert.equal(h.navigation.length,1);assert.equal(h.navigation[0].state,originalState);
 h.c.window.elifaHatimNavigation('reader');assert.equal(h.review.state().current.code,codeB);assert.equal(new URL(h.c.location.href).searchParams.get('k'),codeB);
 h.c.window.elifaHatimNavigation('birlikte');assert.equal(h.review.state().current,null);assert.equal(new URL(h.c.location.href).searchParams.has('k'),false);assert.equal(new URL(h.c.location.href).searchParams.get('method-review'),'357');assert.equal(h.navigation.at(-1).state,originalState);
});
test('failed hatim navigation leaves the previous verified reload code in place',async()=>{
 const h=harness(()=>Response.json({error:'Not found'},{status:404}));h.c.location.href='https://example.test/?k='+codeA+'&review=357';await h.review.bkOpen(codeB);
 assert.equal(new URL(h.c.location.href).searchParams.get('k'),codeA);assert.equal(h.navigation.length,0);
});
test('an initial private administrator link waits for auth and keeps its secret until verified durable success',async()=>{
 const h=harness(p=>Response.json({code:codeA,org:org(codeA)}),{ready:false,url:'https://example.test/?review=357#yonetim='+admin});
 assert.equal(h.calls.length,0);assert.equal(new URL(h.c.location.href).hash,'');assert.equal(JSON.parse(h.sessionMap.get('elifa_hatim_pending_connection_v1')).admin,admin);
 h.account('owner');await new Promise(r=>setImmediate(r));await new Promise(r=>setImmediate(r));
 assert.equal(h.calls.length,1);assert.equal(h.calls[0].admin,admin);assert.equal(h.calls[0].expectedUser,'owner');assert.equal(h.review.state().current.code,codeA);
 assert.equal(h.review.state().local.mine[0].adminToken,admin);assert.equal(h.sessionMap.has('elifa_hatim_pending_connection_v1'),false);assert.equal(new URL(h.c.location.href).searchParams.get('k'),codeA);
});
test('a private link whose first request failed survives a reload with its cleaned public address',async()=>{
 const sessions=new Map();const first=harness(()=>{throw Error('offline')},{sessionMap:sessions,url:'https://example.test/#yonetim='+admin});
 await new Promise(r=>setImmediate(r));assert.equal(new URL(first.c.location.href).hash,'');assert.equal(JSON.parse(sessions.get('elifa_hatim_pending_connection_v1')).admin,admin);
 const second=harness(p=>{assert.equal(p.admin,admin);return Response.json({code:codeA,org:org(codeA)});},{sessionMap:sessions,url:first.c.location.href});await new Promise(r=>setImmediate(r));
 assert.equal(second.review.state().current.code,codeA);assert.equal(second.review.state().local.mine[0].adminToken,admin);assert.equal(sessions.has('elifa_hatim_pending_connection_v1'),false);
});
test('initial participant recovery is replayed after auth and remains an explicit read-only confirmation',async()=>{
 const h=harness(p=>Response.json({code:codeA,org:org(codeA,[{no:1,status:'alindi',mine:true,name:'Participant'}],false)}),{ready:false,url:'https://example.test/#hatim='+codeA+'&cuz=1&key='+capA});
 assert.equal(h.get('hatimDialog').open,false);h.account('member');await new Promise(r=>setImmediate(r));assert.equal(h.get('hatimDialog').open,true);assert.equal(h.calls.length,0);
 await h.click('recover');assert.ok(h.calls.every(p=>p.action==='get'));assert.equal(h.review.state().local.capabilities[codeA][1],capA);assert.equal(h.sessionMap.has('elifa_hatim_pending_connection_v1'),false);
});
test('if private session storage is blocked the original credential URL stays until another durable copy succeeds',async()=>{
 const h=harness(p=>Response.json({code:codeA,org:org(codeA)}),{blockSession:true,ready:false,url:'https://example.test/#yonetim='+admin});assert.equal(new URL(h.c.location.href).hash,'#yonetim='+admin);
 h.account(null);await new Promise(r=>setImmediate(r));assert.equal(h.review.state().local.mine[0].adminToken,admin);assert.equal(new URL(h.c.location.href).hash,'');assert.equal(new URL(h.c.location.href).searchParams.get('k'),codeA);
});
test('auth restoration during an in-flight private administrator fetch replays the preserved link and ignores the old response',async()=>{
 let resolveOld;const h=harness(p=>!p.expectedUser?new Promise(resolve=>resolveOld=()=>resolve(Response.json({code:codeA,org:org(codeA)}))):Response.json({code:codeA,org:org(codeA)}),{url:'https://example.test/#yonetim='+admin});
 await new Promise(r=>setImmediate(r));assert.equal(typeof resolveOld,'function');h.account('restored-member');await new Promise(r=>setImmediate(r));await new Promise(r=>setImmediate(r));resolveOld();await new Promise(r=>setImmediate(r));
 assert.equal(h.calls.length,2);assert.equal(h.calls[1].expectedUser,'restored-member');assert.equal(h.calls[1].admin,admin);assert.equal(h.review.state().current.code,codeA);assert.equal(h.review.state().local.mine[0].adminToken,admin);
 assert.equal(h.sessionMap.has('elifa_hatim_pending_connection_v1'),false);assert.equal(h.get('orgView').innerHTML.includes('Yeniden dene'),false);
});
test('reading a juz uses the reader return contract instead of mutating a global fallback destination',async()=>{
 const h=harness(),opened=[];h.c.JUZ_PAGE=[1];h.c.gotoPage=async(page,options)=>opened.push({page,options});
 h.review.setCurrent(current(codeA,[{no:1,status:'alindi',mine:true,name:'Me'}]));h.review.showJuz(1);await h.click('read');
 assert.equal(opened.length,1);assert.equal(opened[0].page,1);assert.equal(opened[0].options.returnTo,'org');assert.equal(h.c.readerReturn,null);
});


test('open-list loading and transport failure never claim that discovery is administratively closed; retry uses authoritative state',async()=>{
 let resolve;const h=harness(()=>new Promise(r=>resolve=r));
 const pending=h.review.renderBirlikte();assert.match(h.get('hatimList').innerHTML,/yükleniyor/);assert.doesNotMatch(h.get('hatimList').innerHTML,/şu an kapalı/);
 await new Promise(r=>setImmediate(r));resolve(Response.json({error:'Service unavailable'},{status:503}));await pending;
 assert.match(h.get('hatimList').innerHTML,/şu an alınamadı/);assert.doesNotMatch(h.get('hatimList').innerHTML,/şu an kapalı/);assert.match(h.get('hatimList').innerHTML,/discover-retry/);
 const retry=h.get('hatimList:[data-hc=discover-retry]').handlers.click();await new Promise(r=>setImmediate(r));resolve(Response.json({enabled:false}));await retry;
 assert.match(h.get('hatimList').innerHTML,/şu an kapalı/);assert.doesNotMatch(h.get('hatimList').innerHTML,/alınamadı/);
});

test('an unvalidated discovery response cannot masquerade as disabled configuration',async()=>{
 const h=harness(()=>Response.json({items:[]}));await h.review.renderBirlikte();assert.match(h.get('hatimStatus').textContent,/doğrulanamadı/);assert.doesNotMatch(h.get('hatimList').innerHTML,/şu an kapalı/);
});

test('create visibility distinguishes pending, failed, enabled and explicitly disabled configuration without a misleading disabled radio',async()=>{
 let resolve;const h=harness(()=>new Promise(r=>resolve=r));h.review.showCreate();
 assert.match(h.get('hatimDialog').innerHTML,/Adın \/ takma ad/);assert.match(h.get('hatimDialog').innerHTML,/Bu cihazdaki bilgiler silinirse hatmine geri dönemeyebilirsin/);assert.doesNotMatch(h.get('hatimDialog').innerHTML,/Yönetici görünen adı|yönetici erişimini/);
 assert.match(h.get('hcVisibilityOptions').innerHTML,/kontrol ediliyor/);assert.doesNotMatch(h.get('hcVisibilityOptions').innerHTML,/value="public"|şu an kapalı|disabled/);
 await new Promise(r=>setImmediate(r));resolve(Response.json({error:'Service unavailable'},{status:503}));await new Promise(r=>setImmediate(r));
 assert.match(h.get('hcVisibilityOptions').innerHTML,/durumu doğrulanamadı/);assert.doesNotMatch(h.get('hcVisibilityOptions').innerHTML,/value="public"|şu an kapalı|disabled/);
 const retry=h.get('hcVisibilityRetry').handlers.click();await new Promise(r=>setImmediate(r));resolve(Response.json({enabled:true}));await retry;
 assert.match(h.get('hcVisibilityOptions').innerHTML,/value="public"/);assert.doesNotMatch(h.get('hcVisibilityOptions').innerHTML,/disabled|şu an kapalı/);
 h.review.showCreate();await new Promise(r=>setImmediate(r));resolve(Response.json({enabled:false}));await new Promise(r=>setImmediate(r));
 assert.match(h.get('hcVisibilityOptions').innerHTML,/şu an kapalı/);assert.doesNotMatch(h.get('hcVisibilityOptions').innerHTML,/value="public"/);
});

test('late discovery configuration cannot rewrite a replacement dialog',async()=>{
 let resolve;const h=harness(()=>new Promise(r=>resolve=r));h.review.showCreate();await new Promise(r=>setImmediate(r));
 h.review.setCurrent(current(codeA));h.review.showManage();h.get('hcVisibilityOptions').innerHTML='replacement stays';resolve(Response.json({enabled:true}));await new Promise(r=>setImmediate(r));
 assert.equal(h.get('hcVisibilityOptions').innerHTML,'replacement stays');
});

test('an ambiguous public creation is never silently retried as a new private operation while configuration is unavailable',async()=>{
 const h=harness(()=>Response.json({error:'Unavailable'},{status:503}));h.review.setLocal({creation:{token:capA,title:'Aile',name:'Guest',dueDate:'',public:true,signature:'prior public request'}});h.review.showCreate();
 h.get('hcTitle').value='Aile';h.get('hcAdminName').value='Guest';h.get('hcDue').value='';await h.click('create');
 assert.equal(h.calls.some(p=>p.action==='create'),false);assert.equal(h.review.state().local.creation.token,capA);assert.match(h.get('hcError').textContent,/Önceki açık hatim isteğini/);
});


test('server preview metadata keeps a compact test-data notice across the list, detail and dialogs; production has none',async()=>{
 const h=harness(p=>Response.json(p.action==='discoverList'?{enabled:true,items:[],preview:true}:{code:p.code,org:org(p.code),preview:true}));
 await h.review.renderBirlikte();assert.equal(h.get('hcHomePreview').hidden,false);assert.match(h.get('hcHomePreview').textContent,/deneme içindir; canlı kayıtlarını etkilemez/);
 await h.review.bkOpen(codeA);assert.match(h.get('orgView').innerHTML,/hcOrgPreview[^>]*>Önizleme:/);
 h.review.showManage();assert.match(h.get('hatimDialog').innerHTML,/hcDialogPreview[^>]*>Önizleme:/);
 await h.review.renderBirlikte();assert.equal(h.get('hcHomePreview').hidden,false);
 const live=harness(p=>Response.json({enabled:true,items:[],preview:false}));await live.review.renderBirlikte();assert.equal(live.get('hcHomePreview').hidden,true);assert.equal(live.get('hcHomePreview').textContent,'');
});


test('personal recovery instructions provide distinct link and code copies only after an authorized code response',async()=>{
 const alias='0123456789ABCDEFGHJK';let resolve;const copied=[];const h=harness(p=>p.action==='returnCode'?new Promise(r=>resolve=r):Response.json({code:p.code,org:org(p.code)}));h.c.navigator.clipboard={writeText:async value=>copied.push(value)};
 h.review.setCurrent(current(codeA,[{no:1,status:'alindi',mine:true}]));h.review.showRecovery(codeA,1,capA);
 assert.match(h.get('hatimDialog').innerHTML,/Benim Cüzlerim/);assert.match(h.get('hatimDialog').innerHTML,/Cüzüme geri dön/);assert.match(h.get('hatimDialog').innerHTML,/katılım bağlantısı olarak paylaşma/);assert.equal(h.get('hcPersonalCode').value,'');
 await h.click('copy');assert.equal(copied[0],client.recoveryUrl('https://example.test/',codeA,1,capA));assert.match(h.get('hatimStatus').textContent,/Kişisel bağlantı kopyalandı/);
 await new Promise(r=>setImmediate(r));assert.equal(h.calls[0].action,'returnCode');assert.equal(h.calls[0].code,codeA);assert.equal(h.calls[0].capability,capA);resolve(Response.json({returnKey:alias}));await new Promise(r=>setImmediate(r));
 const expected=client.personalReturnCode(codeA,1,alias);assert.equal(h.get('hcPersonalCode').value,expected);await h.click('copy-code');assert.equal(copied[1],expected);assert.match(h.get('hatimStatus').textContent,/Özel dönüş kodu kopyalandı/);
 assert.equal(h.calls.some(p=>/bind|claim|issueRecovery/.test(p.action)),false);
});

test('a failed return-code preparation preserves the full recovery link and retries the same authorized key',async()=>{
 let failed=true;const h=harness(p=>{if(failed){failed=false;throw Error('offline')}return Response.json({returnKey:'0123456789ABCDEFGHJK'})});h.review.setCurrent(current(codeA));h.review.showRecovery(codeA,1,capA);await new Promise(r=>setImmediate(r));
 assert.match(h.get('hcReturnStatus').textContent,/hazırlanamadı/);assert.match(h.get('hatimDialog').innerHTML,new RegExp(capA));assert.equal(h.get('hcPersonalCode').value,'');
 await h.click('return-retry');assert.equal(h.calls.length,2);assert.equal(h.calls[0].capability,h.calls[1].capability);assert.equal(h.get('hcPersonalCode').value,client.personalReturnCode(codeA,1,'0123456789ABCDEFGHJK'));
});

test('late private-code preparation cannot overwrite another dialog or another account',async()=>{
 let resolve;const h=harness(()=>new Promise(r=>resolve=r));h.review.setCurrent(current(codeA));h.review.showRecovery(codeA,1,capA);await new Promise(r=>setImmediate(r));
 h.review.setCurrent(current(codeB,[],2));h.review.showManage();h.get('hcPersonalCode').value='replacement';resolve(Response.json({returnKey:'0123456789ABCDEFGHJK'}));await new Promise(r=>setImmediate(r));assert.equal(h.get('hcPersonalCode').value,'replacement');
});

test('private recovery entry rejects public participation and administrator codes without network access',async()=>{
 const h=harness();h.review.showReturnEntry();h.get('hcReturnInput').value=codeA;await h.click('return-open');assert.equal(h.calls.length,0);assert.match(h.get('hcError').textContent,/genel katılım veya yönetici/);
 h.get('hcReturnInput').value=client.adminUrl('https://example.test/',admin);await h.click('return-open');assert.equal(h.calls.length,0);assert.match(h.get('hcError').textContent,/sana özel C1/);
 assert.match(h.get('hatimDialog').innerHTML,/cüzü aldığın hesapla giriş yap/);assert.match(h.get('hatimDialog').innerHTML,/Genel hatim kodu yalnız yeni katılım/);
});

test('typed short personal codes reopen only after explicit confirmation and retain recoverable local proof without automatic binding',async()=>{
 const alias='0123456789ABCDEFGHJK',h=harness(p=>Response.json({code:p.code,org:org(p.code,[{no:1,status:'alindi',mine:true}],false)}));h.review.showReturnEntry();h.get('hcReturnInput').value=client.personalReturnCode(codeA,1,alias).toLowerCase().replaceAll('-',' ');await h.click('return-open');
 assert.equal(h.calls.length,0);assert.match(h.get('hatimDialog').innerHTML,/Kişisel cüz bağlantısı/);await h.click('recover');assert.ok(h.calls.every(p=>p.action==='get'));assert.equal(h.calls[0].capabilities[1],alias);assert.equal(h.review.state().local.capabilities[codeA][1],alias);
});

test('clipboard denial offers the private code with the correct label and never labels it as a public link',async()=>{
 const h=harness(()=>Response.json({returnKey:'0123456789ABCDEFGHJK'}));h.review.setCurrent(current(codeA));h.review.showRecovery(codeA,1,capA,true);await new Promise(r=>setImmediate(r));assert.match(h.get('hatimDialog').innerHTML,/aynı hesapla giriş yap; özel kod tek başına/);
 await h.click('copy-code');assert.match(h.get('hatimDialog').innerHTML,/Özel dönüş kodu · seçip kopyala/);assert.match(h.get('hatimDialog').innerHTML,/C1-/);assert.doesNotMatch(h.get('hatimDialog').innerHTML,/Katılım bağlantısı/);
});


test('a private code arriving after an account switch cannot leak into the new account or its dialog',async()=>{
 let resolve;const h=harness(()=>new Promise(r=>resolve=r),{uid:'A'});h.review.setCurrent(current(codeA));h.review.showRecovery(codeA,1,capA,true);await new Promise(r=>setImmediate(r));
 h.account('B');h.review.showReturnEntry();h.get('hcPersonalCode').value='B untouched';resolve(Response.json({returnKey:'0123456789ABCDEFGHJK'}));await new Promise(r=>setImmediate(r));
 assert.equal(h.get('hcPersonalCode').value,'B untouched');assert.deepEqual(Object.keys(h.review.state().local.capabilities),[]);assert.match(h.get('hatimDialog').innerHTML,/Cüzüme geri dön/);
});

test('same-device return opens My Juz without requesting a secret or exposing it in list markup',async()=>{
 const h=harness();h.review.setLocal({mine:[{code:codeA,type:'hatim',title:'My khatm'}],capabilities:{[codeA]:{1:capA}},snapshots:{[codeA]:{items:[{no:1,status:'alindi',mine:true}]}}});
 h.review.showReturnEntry();await h.click('my-juz');assert.equal(h.calls.length,0);assert.match(h.get('birlikte').innerHTML,/data-hc="return-entry"/);assert.match(h.get('hatimList').innerHTML,/data-open="aaaaaa"/);assert.doesNotMatch(h.get('hatimList').innerHTML,new RegExp(capA));
});


test('compact public hatim rows preserve occupancy, due dates and accessible actions with safe full titles',async()=>{
 const malicious='Uzun hatim niyeti "><img src=x onerror="alert(1)"> '+ 'çok uzun '.repeat(8);
 const entries=[{code:codeA,type:'hatim',title:malicious,total:30,done:7,available:12,dueDate:'2099-01-01'},{code:codeB,type:'hatim',title:'Dolu hatim',total:30,done:28,available:0}];
 const h=harness(p=>Response.json(p.action==='discoverList'?{enabled:true,items:entries}:{code:p.code,org:org(p.code)}));
 const list=h.get('hatimList');let controls=[];list.querySelectorAll=selector=>{if(selector!=='[data-open]')return [];controls=[...list.innerHTML.matchAll(/data-open="([a-z0-9]+)"/g)].map((m,i)=>{const button=h.get('public-open-'+i);button.dataset={open:m[1]};return button});return controls;};
 await h.review.renderBirlikte();const html=list.innerHTML;
 assert.equal((html.match(/class="hc-card hc-list-row"/g)||[]).length,2);assert.ok(html.includes('hc-row-number" aria-hidden="true">1</span>'));assert.ok(html.includes('hc-row-number" aria-hidden="true">2</span>'));
 assert.ok(html.includes('7/30 cüz okundu'));assert.match(html,/12 boş cüz/);assert.match(html,/hc-row-due/);assert.ok(html.includes('progress value="7" max="30" aria-label="7/30 cüz okundu"'));
 assert.match(html,/aria-label="Dolu hatim · Görüntüle"/);assert.match(html,/&lt;img/);assert.doesNotMatch(html,/<img/);assert.equal(controls.length,2);
 await controls[1].handlers.click();assert.equal(h.review.state().current.code,codeB);assert.equal(h.calls.at(-1).code,codeB);
});

test('all owned and personal lists use compact numbered rows, preserve state and keep private proofs out of markup',async()=>{
 const h=harness();h.review.setLocal({mine:[{code:codeA,type:'hatim',title:'Deneme',adminToken:admin},{code:codeB,type:'hatim',title:'Diğer <hatim>',adminToken:'b'.repeat(32)}],capabilities:{[codeA]:{1:capA}},snapshots:{[codeA]:{isAdmin:true,items:[{no:1,status:'alindi',mine:true},{no:2,status:'okundu',mine:true}]},[codeB]:{isAdmin:true,archived:true,items:[]}}});
 h.review.setTab('created');await h.review.renderBirlikte();let html=h.get('hatimList').innerHTML;
 assert.equal((html.match(/hc-owned-row/g)||[]).length,2);assert.match(html,/Sen başlattın/);assert.match(html,/Arşivde/);assert.match(html,/Diğer &lt;hatim&gt;/);
 assert.doesNotMatch(html,new RegExp(admin+'|'+capA));assert.match(h.get('birlikte').innerHTML,/Birlikte Hatim/);assert.match(h.get('birlikte').innerHTML,/Ana sayfaya dön/);assert.match(h.get('birlikte').innerHTML,/data-tab="created" aria-pressed="true"/);
 assert.doesNotMatch(h.get('birlikte').innerHTML,/hc-emblem/);assert.match(h.get('birlikte').innerHTML,/data-tab="mine"[^>]*>Cüzlerim<\/button>/);
 h.review.setTab('mine');await h.review.renderBirlikte();html=h.get('hatimList').innerHTML;
 assert.equal((html.match(/hc-owned-row/g)||[]).length,1);assert.match(html,/1, 2. cüz/);assert.match(html,/1 okunacak · 1 okundu/);assert.match(html,/<details class="hc-help">/);
 const css=fs.readFileSync('assets/hatim-community.css','utf8');
 assert.match(css,/#bkwrap \.hc-home,#bkwrap \.hc-detail\{[^}]*margin:0 auto/,'a short list stays top-aligned instead of using vertical auto margins');
 assert.match(css,/\.hc-tabs button\{[^}]*min-height:44px/);assert.match(css,/\.hc-list-row \.hc-row-open\{[^}]*min-height:44px/);
});

const unusedJuz=()=>Array.from({length:30},(_,i)=>({no:i+1,status:'bos',name:'',ts:0}));
test('only an owner can open deletion, and an unused hatim needs a separate explicit confirmation before any request',async()=>{
 const h=harness(p=>p.action==='delete'?Response.json({ok:true,deleted:true,code:p.code}):Response.json({enabled:true,items:[]}));
 h.review.setLocal({mine:[{code:codeA,type:'hatim',title:'Delete me',adminToken:admin},{code:codeB,type:'hatim',title:'Keep me',adminToken:'b'.repeat(32)}],capabilities:{[codeA]:{1:capA},[codeB]:{1:capB}}});
 const notOwner=current(codeA,unusedJuz());notOwner.org.isAdmin=false;h.review.setCurrent(notOwner);h.review.showManage();assert.equal(h.get('hatimDialog').open,false);
 h.review.setCurrent(current(codeA,unusedJuz()));h.review.showManage();assert.match(h.get('hatimDialog').innerHTML,/Hatmi sil/);await h.click('delete-hatim');
 assert.equal(h.calls.length,0);assert.match(h.get('hatimDialog').innerHTML,/geri alınamaz/);assert.match(h.get('hatimDialog').innerHTML,/Evet, hatmi sil/);
 await h.click('delete-cancel');assert.equal(h.calls.length,0);assert.equal(h.review.state().local.mine.length,2);
 h.review.showManage();await h.click('delete-hatim');await h.click('delete-confirm');
 assert.equal(h.calls[0].action,'delete');assert.equal(h.calls[0].confirmed,true);assert.equal(h.calls[0].code,codeA);assert.equal(h.calls[0].admin,admin);
 assert.deepEqual(h.review.state().local.mine.map(m=>m.code),[codeB]);assert.equal(h.review.state().local.capabilities[codeB][1],capB);assert.equal(h.review.state().current,null);assert.match(h.get('hatimStatus').textContent,/Hatim silindi/);
});

test('participated hatims offer archive instead of permanent deletion without discarding any local ownership',async()=>{
 const h=harness(p=>Response.json({code:p.code,org:{...org(p.code,[{no:1,status:'alindi',mine:true}]),archived:true}}));
 h.review.setCurrent(current(codeA,[{no:1,status:'alindi',name:'Katılımcı',mine:true}]));h.review.confirmDeleteHatim();
 assert.match(h.get('hatimDialog').innerHTML,/kalıcı olarak silinemez/);assert.doesNotMatch(h.get('hatimDialog').innerHTML,/data-hc="delete-confirm"/);assert.equal(h.calls.length,0);
 await h.click('delete-archive');assert.equal(h.calls[0].action,'archive');assert.equal(h.calls.some(p=>p.action==='delete'),false);assert.equal(h.review.state().current.org.archived,true);
});

test('ambiguous or denied deletion retains the local record and can be retried; stale dialogs never delete another hatim',async()=>{
 let first=true;const h=harness(p=>{if(first){first=false;throw Error('lost response')}return Response.json({ok:true,deleted:true,code:p.code})});
 h.review.setLocal({mine:[{code:codeA,type:'hatim',title:'A',adminToken:admin}]});h.review.setCurrent(current(codeA,unusedJuz()));h.review.confirmDeleteHatim();await h.click('delete-confirm');
 assert.equal(h.review.state().local.mine[0].code,codeA);assert.match(h.get('hcError').textContent,/kaydedildi sayılmadı/);
 await h.click('delete-confirm');assert.equal(h.calls.filter(p=>p.action==='delete').length,2);assert.equal(h.review.state().local.mine.length,0);
 const stale=harness();stale.review.setCurrent(current(codeA,unusedJuz()));stale.review.confirmDeleteHatim();stale.review.setCurrent(current(codeB,unusedJuz(),2));await stale.click('delete-confirm');
 assert.equal(stale.calls.length,0);assert.match(stale.get('hcError').textContent,/değişti/);
 const denied=harness(()=>Response.json({error:'Katılım geçmişi var. Silmek yerine arşivle.'},{status:409}));denied.review.setLocal({mine:[{code:codeA,type:'hatim',title:'A',adminToken:admin}]});denied.review.setCurrent(current(codeA,unusedJuz()));denied.review.confirmDeleteHatim();await denied.click('delete-confirm');
 assert.equal(denied.review.state().local.mine.length,1);assert.match(denied.get('hcError').textContent,/arşivle/);assert.match(denied.get('hatimDialog').innerHTML,/delete-archive/);
});

test('member-only discovery offers login and resumes the same list after authentication without any mutation',async()=>{
 const h=harness(p=>p.expectedUser?Response.json({enabled:true,items:[]}):Response.json({error:'Üye girişi gerekiyor.',errorCode:'AUTH_REQUIRED'},{status:401}));
 let opens=0;h.c.window.elifaAccount={open(){opens++;}};await h.review.renderBirlikte();
 assert.match(h.get('hatimList').innerHTML,/Tüm üyelere açık/);assert.match(h.get('hatimList').innerHTML,/list-login/);
 h.get('hatimList:[data-hc=list-login]').handlers.click();assert.equal(opens,1);assert.equal(JSON.parse(h.sessionMap.get('elifa_hatim_login_intent_v1')).kind,'list');
 h.account('member');await new Promise(r=>setImmediate(r));await new Promise(r=>setImmediate(r));
 assert.equal(h.calls.at(-1).expectedUser,'member');assert.ok(h.calls.every(p=>p.action==='discoverList'));assert.equal(h.sessionMap.has('elifa_hatim_login_intent_v1'),false);
});

test('public claim resumes its exact juz form after login or same-user verification, but never automatically claims',async()=>{
 for(const options of [{},{uid:'member',emailVerified:false}]){
  const h=harness(p=>Response.json({code:p.code,org:{...org(p.code,[{no:4,status:'bos'}],false),public:true}}),options);
  h.c.window.elifaAccount={open(){}};const c=current(codeA,[{no:4,status:'bos'}]);c.org.public=true;h.review.setCurrent(c);h.review.showClaim(4);
  assert.equal(h.calls.length,0);assert.match(h.get('hatimDialog').innerHTML,/Giriş yaparak devam/);await h.click('member-login');
  h.account('member');await new Promise(r=>setImmediate(r));await new Promise(r=>setImmediate(r));
  assert.match(h.get('hatimDialog').innerHTML,/4. cüzü al/);assert.equal(h.calls.some(p=>p.action==='claim'),false);assert.ok(h.calls.every(p=>p.action==='get'));
 }
});

test('public creation requests login with its form retained and comes back to an explicit create button',async()=>{
 const h=harness(p=>Response.json({enabled:true}));h.c.window.elifaAccount={open(){}};h.review.showCreate();await new Promise(r=>setImmediate(r));
 h.get('hcTitle').value='Üye aile hatmi';h.get('hcAdminName').value='Takma ad';h.get('hcDue').value='2099-01-01';h.c.document.querySelector=selector=>selector.includes('value=public')?{}:null;
 await h.click('create');assert.equal(h.calls.some(p=>p.action==='create'),false);await h.click('member-login');
 h.account('member');await new Promise(r=>setImmediate(r));await new Promise(r=>setImmediate(r));
 assert.match(h.get('hatimDialog').innerHTML,/value="Üye aile hatmi"/);assert.match(h.get('hatimDialog').innerHTML,/value="Takma ad"/);assert.match(h.get('hcVisibilityOptions').innerHTML,/Tüm üyelere açık/);assert.match(h.get('hcVisibilityOptions').innerHTML,/Davetle katılım/);
 assert.equal(h.calls.some(p=>p.action==='create'),false);assert.match(h.get('hatimDialog').innerHTML,/Hatmi oluştur/);
});

test('a silent hatim read started before a comment mutation cannot undo the newer discussion metadata',async()=>{
 let resolve;const h=harness(p=>p.action==='get'?new Promise(r=>resolve=()=>r(Response.json({code:p.code,org:{...org(p.code),commentsClosed:false}}))):Response.json({code:p.code,commentsClosed:true}));
 const selected=current(codeA);selected.org.commentsClosed=true;h.review.setCurrent(selected);const refreshing=h.review.bkSilentRefresh();await new Promise(r=>setImmediate(r));
 await h.c.window.bkApi({action:'commentSettings',code:codeA,closed:true});resolve();await refreshing;
 assert.equal(h.review.state().current.org.commentsClosed,true);
});
