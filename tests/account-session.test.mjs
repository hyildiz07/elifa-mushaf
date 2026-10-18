import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import * as data from '../src/account-data.mjs';
import {createSafeStorage,createAccountWorkspaces,WORKSPACE_OWNER} from '../src/account-workspaces.mjs';
const source=fs.readFileSync('src/account.mjs','utf8').replace(/^import .*;\r?\n/gm,'');
function harness(initial={},options={}){
 const map=new Map(Object.entries(initial)),nodes=new Map(),timers=new Map(),events=[],calls=[];let timerId=0;
 const el=id=>{if(!nodes.has(id))nodes.set(id,{id,value:'',checked:false,hidden:false,disabled:false,textContent:'',style:{},classList:{toggle(){}},setAttribute(){},replaceChildren(){},addEventListener(){},querySelectorAll(selector){return id==='accountDialog'&&selector==='button,input,select,textarea'?[...nodes.values()]:[]},prepend(){},closest(){return el("deletePanel")},querySelector(){return el("deleteNote")},before(){},append(){},showModal(){this.open=true},close(){this.open=false}});return nodes.get(id);};
 class Provider{setCustomParameters(){}};
 const storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)};
 const auth={currentUser:null,authStateReady:async()=>{}};
 const c={__ELIFA_ACCOUNT_PREVIEW__:!!options.preview,...data,createSafeStorage,createAccountWorkspaces,WORKSPACE_OWNER,console,URL,URLSearchParams,AbortSignal,TextEncoder,structuredClone,
  CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail}},MutationObserver:class{observe(){}},
  setTimeout:fn=>{timers.set(++timerId,fn);return timerId},clearTimeout:id=>timers.delete(id),
  document:{getElementById:el,createElement:el,querySelectorAll:()=>[]},window:{addEventListener(){},dispatchEvent:event=>events.push(event.type)},navigator:{onLine:true},
  location:{origin:'https://example.test',search:options.search||'',href:options.url||'https://example.test/',reload:()=>events.push('reload')},history:{replaceState(){}},localStorage:storage,
  GoogleAuthProvider:Provider,OAuthProvider:Provider,EmailAuthProvider:{credential:()=>({})},auth,isLocal:true,
  accountLanguage:()=> 'tr',accountText:s=>s,localizeAccountTree(){},onAuthStateChanged(instance,_changed,failed){instance.initialFailure=failed;},
  mountAccountProfile:()=>({ready:()=>false,hasGuestChoice:()=>false,load:async()=>{},changed(){}}),
  confirm:()=>true,reauthenticateWithCredential:async()=>calls.push('reauth'),signOut:async()=>{auth.currentUser=null},sendPasswordResetEmail:async()=>calls.push('password-reset'),confirmPasswordReset:async()=>calls.push('password-confirm'),
  createUserWithEmailAndPassword:async()=>{const u={uid:'new',emailVerified:false,providerData:[{providerId:'password'}],getIdToken:async()=> 'new-token'};auth.currentUser=u;calls.push('signup');return {user:u}},
  sendEmailVerification:async()=>calls.push('verify-email'),signInWithEmailAndPassword:async()=>{calls.push('login');},
  fetch:async(_url,options)=>{const body=JSON.parse(options.body);calls.push(body);return Response.json(body.action==='list'?{backups:[]}:body.action==='syncGet'?{revision:0,payload:null}:{revision:1});}
 };
 vm.createContext(c);vm.runInContext(source+'\nwindow.review={authChanged:next=>{auth.currentUser=next;authChanged(next)},scheduleSync,syncNow,setBusy,api,setMode:v=>mode=v,state:()=>({busy,syncPending,workspaceReady,workspaceTransition})};',c);
 return {c,map,nodes,timers,events,calls,auth,storage,fire:async()=>{const [id,fn]=[...timers][0]||[];assert.ok(fn,'scheduled work');timers.delete(id);await fn();await new Promise(r=>setImmediate(r));}};
}
const member=uid=>({uid,emailVerified:true,email:uid+'@example.test',providerData:[],getIdToken:async()=>uid+'-token'});
test('session readiness waits for the initial auth result before notifying a guest deep-link subscriber',()=>{
 const h=harness(),bridge=h.c.window.elifaAccountSession,seen=[];
 assert.equal(bridge.isReady(),false);bridge.onChange(u=>seen.push(u));assert.deepEqual(seen,[]);
 h.c.window.review.authChanged(null);assert.equal(bridge.isReady(),true);assert.deepEqual(seen,[null]);
 let immediate=false;bridge.onChange(()=>immediate=true);assert.equal(immediate,true);
});
test('initial authentication failure publishes the ready guest fallback so private-link startup cannot hang',()=>{
 const h=harness(),bridge=h.c.window.elifaAccountSession,seen=[];bridge.onChange(u=>seen.push(u));
 h.auth.initialFailure(Error('Auth temporarily unavailable'));
 assert.equal(bridge.isReady(),true);assert.deepEqual(seen,[null]);assert.ok(h.events.includes('elifa:account-changed'));
 assert.equal(h.calls.length,0,'fallback never sends a private account request');
});
test('returning B cannot upload A local notes, even if B sync was previously enabled',async()=>{
 const h=harness({[WORKSPACE_OWNER]:'A',notes:'{"1:1":"A private"}',[data.SYNC_ENABLED_PREFIX+'B']:'1',[data.SYNC_BASE_PREFIX+'B']:'{"revision":3,"payload":{"elifa":"yedek","v":1,"veri":{}}}'});
 h.c.window.review.authChanged(member('B'));await h.c.window.review.syncNow();
 assert.equal(h.map.get('notes'),undefined);assert.equal(h.map.get(data.SYNC_BASE_PREFIX+'B'),undefined);assert.ok(h.events.includes('reload'));assert.equal(h.calls.length,0);
 assert.ok(h.map.get('elifa.workspace.v1.A').includes('A private'));
});
test('busy sign-in retains pending sync and runs after controls are released',async()=>{
 const h=harness({[WORKSPACE_OWNER]:'B',[data.SYNC_ENABLED_PREFIX+'B']:'1'});h.c.window.review.authChanged(member('B'));
 h.c.window.review.setBusy(true);await h.fire();assert.equal(h.calls.length,0);assert.equal(h.c.window.review.state().syncPending,true);assert.ok(h.timers.size);
 h.c.window.review.setBusy(false);await h.fire();assert.equal(h.calls[0].action,'syncGet');assert.equal(h.c.window.review.state().syncPending,false);
});
test('token bridge refuses stale proof after account change and never exposes email or private profile data',async()=>{
 const h=harness({[WORKSPACE_OWNER]:'A'});let release;
 const a=member('A');a.getIdToken=()=>new Promise(resolve=>release=resolve);h.c.window.review.authChanged(a);
 const token=h.c.window.elifaAccountSession.getIdToken();await new Promise(r=>setImmediate(r));h.c.window.review.authChanged(member('B'));release('A-token');await assert.rejects(token,/Hesap değişti/);
 assert.equal(h.c.window.elifaAccountSession.getUser().email,undefined);assert.equal(h.c.window.elifaAccountSession.getUser().uid,'B');
});
test('account switch during response JSON decode cannot return old private backup data',async()=>{
 const h=harness({[WORKSPACE_OWNER]:'A'});h.c.window.review.authChanged(member('A'));let release;
 h.c.fetch=async()=>({ok:true,headers:new Headers({'content-type':'application/json'}),json:()=>new Promise(resolve=>release=resolve)});
 const pending=h.c.window.review.api('list');await new Promise(r=>setImmediate(r));h.c.window.review.authChanged(member('B'));release({backups:[{id:'A-private'}]});await assert.rejects(pending,/Hesap değişti/);
});
test('another tab changing only the active workspace blocks a pending cloud restore before local writes',async()=>{
 const h=harness({[WORKSPACE_OWNER]:'A'});h.c.window.review.authChanged(member('A'));let release;
 h.c.fetch=async()=>({ok:true,headers:new Headers({'content-type':'application/json'}),json:()=>new Promise(resolve=>release=resolve)});
 const pending=h.c.window.review.api('restore',{id:'old-A'});await new Promise(r=>setImmediate(r));
 h.map.set(WORKSPACE_OWNER,'B');h.map.set('notes','{"1:1":"B private"}');release({payload:{elifa:'yedek',v:1,veri:{notes:'{"1:1":"A restored"}'}}});
 await assert.rejects(pending,/Hesap kayıtları/);assert.equal(h.map.get('notes'),'{"1:1":"B private"}');
});
test('blocked storage leaves sign-in usable but refuses data migration and cloud uploads without a reload loop',async()=>{
 const h=harness();h.c.localStorage.getItem=()=>{throw Error('SecurityError')};assert.doesNotThrow(()=>h.c.window.review.authChanged(member('A')));
 assert.equal(h.nodes.get('accountSave').disabled,true);assert.equal(h.c.window.review.state().workspaceReady,false);assert.equal(h.events.includes('reload'),false);
 await assert.rejects(h.c.window.review.api('save',{payload:{}}),/Hesap kayıtları/);
});
test('signup still sends verification before deferred workspace reload; forgotten/reset password paths remain usable',async()=>{
 const h=harness();h.c.window.review.setMode('signup');h.nodes.get('accountTerms').checked=true;h.nodes.get('accountEmailInput').value='a@example.test';h.nodes.get('accountPassword').value='Valid-password-123';
 h.nodes.get('accountForm').onsubmit({preventDefault(){}});await new Promise(r=>setImmediate(r));assert.deepEqual(h.calls,['signup','verify-email']);assert.ok(h.events.includes('reload'));assert.equal(h.nodes.get('accountPassword').value,'');
 const forgot=harness();forgot.c.window.review.setMode('forgot');forgot.nodes.get('accountEmailInput').value='a@example.test';forgot.nodes.get('accountForm').onsubmit({preventDefault(){}});await new Promise(r=>setImmediate(r));assert.deepEqual(forgot.calls,['password-reset']);
 forgot.c.window.review.setMode('reset');forgot.nodes.get('accountPassword').value='New-password-123';forgot.nodes.get('accountForm').onsubmit({preventDefault(){}});await new Promise(r=>setImmediate(r));assert.deepEqual(forgot.calls,['password-reset','password-confirm']);
});
test('switching accounts while delete reauthentication completes cannot delete the new account',async()=>{
 const h=harness({[WORKSPACE_OWNER]:'A'});let release;
 const a=member('A');a.providerData=[{providerId:'password'}];a.getIdToken=()=>new Promise(resolve=>release=resolve);h.c.window.review.authChanged(a);
 h.nodes.get('accountDeleteForm').onsubmit({preventDefault(){}});await new Promise(r=>setImmediate(r));assert.equal(typeof release,'function');
 h.c.window.review.authChanged(member('B'));release('A-token');await new Promise(r=>setImmediate(r));
 assert.equal(h.calls.some(v=>v?.action==='deleteAccount'),false);assert.equal(h.auth.currentUser.uid,'B');
});
test('signing out restores guest records and keeps member notes in their own private device archive',async()=>{
 const h=harness({[WORKSPACE_OWNER]:'A',notes:'{"1:1":"A private"}','elifa.workspace.v1.guest':JSON.stringify({payload:{elifa:'yedek',v:1,veri:{notes:'{"2:1":"guest"}'}}})});
 h.c.window.review.authChanged(member('A'));h.nodes.get('accountLogout').onclick();await new Promise(r=>setImmediate(r));
 assert.equal(h.map.get('notes'),'{"2:1":"guest"}');assert.ok(h.map.get('elifa.workspace.v1.A').includes('A private'));assert.equal(h.c.window.elifaAccountSession.getUser(),null);
});
test('queued cross-tab workspace preparation ignores an obsolete identity and preserves the original guest copy',async()=>{
 const h=harness({notes:'{"1:1":"guest original"}'}),queue=[];
 h.c.navigator.locks={request:(_name,fn)=>new Promise(resolve=>queue.push(()=>resolve(fn())))};
 h.c.window.review.authChanged(member('A'));h.c.window.review.authChanged(member('B'));
 assert.equal(h.c.window.elifaWorkspaceWritable(),false);assert.equal(queue.length,2);
 queue.shift()();await new Promise(r=>setImmediate(r));assert.equal(h.map.get(WORKSPACE_OWNER),undefined);
 queue.shift()();await new Promise(r=>setImmediate(r));assert.equal(h.map.get(WORKSPACE_OWNER),'B');
 assert.ok(h.map.get('elifa.workspace.v1.guest').includes('guest original'));assert.equal(h.map.get('elifa.workspace.v1.A'),undefined);
});


test('preview build metadata blocks real auth, cloud APIs, private tokens and recovery startup even on immutable deployment URLs',async()=>{
 const h=harness({}, {preview:true,url:'https://0123456789abcdef--elifamushaf.netlify.app/?mode=verifyEmail&oobCode=real-code',search:'?mode=verifyEmail&oobCode=real-code'});
 assert.equal(h.auth.initialFailure,undefined,'preview never subscribes to the persisted production session');
 assert.equal(h.c.window.elifaAccountSession.isReady(),true);assert.equal(h.c.window.elifaAccountSession.getUser(),null);
 assert.equal(await h.c.window.elifaAccountSession.getIdToken(),null);assert.equal(h.nodes.get('accountSubmit').disabled,true);
 assert.match(h.nodes.get('p').textContent,/Önizlemede hesap.bulut işlemleri kapalı/);
 await h.c.window.elifaAccount.open();assert.match(h.nodes.get('accountStatus').textContent,/Gerçek hesabını burada oluşturma/);
 for(const mode of ['signup','login','forgot','reset']){h.c.window.review.setMode(mode);h.nodes.get('accountForm').onsubmit({preventDefault(){}});}
 await h.nodes.get('accountDeleteForm').onsubmit({preventDefault(){}});
 for(const id of ['accountGoogle','accountApple','accountLinkGoogle','accountVerifySend','accountResetPassword','accountSave','accountRefresh','accountRetry'])await h.nodes.get(id).onclick();
 h.c.window.review.authChanged(member('A'));await h.c.window.review.syncNow();h.c.window.review.scheduleSync();
 assert.equal(h.c.window.elifaAccountSession.getUser(),null);await assert.rejects(h.c.window.review.api('profilePut',{profile:{displayName:'Preview'}}),/Önizlemede/);
 assert.throws(()=>h.c.window.elifaRestoreBackup({elifa:'yedek',v:1,veri:{}}),/Önizlemede/);
 await new Promise(r=>setImmediate(r));assert.deepEqual(h.calls,[]);assert.equal(h.timers.size,0);
});

test('canonical deploy-preview hostname also blocks account actions without trusting query parameters or similar production names',async()=>{
 const preview=harness({}, {url:'https://deploy-preview-20--elifamushaf.netlify.app/'});assert.equal(preview.nodes.get('accountSubmit').disabled,true);
 preview.c.window.review.setMode('forgot');preview.nodes.get('accountForm').onsubmit({preventDefault(){}});await new Promise(r=>setImmediate(r));assert.deepEqual(preview.calls,[]);
 const production=harness({}, {url:'https://mushaf.elifaplatform.com/?preview=true',search:'?preview=true'});assert.equal(typeof production.auth.initialFailure,'function');
 production.c.window.review.setMode('forgot');production.nodes.get('accountEmailInput').value='real@example.test';production.nodes.get('accountForm').onsubmit({preventDefault(){}});await new Promise(r=>setImmediate(r));assert.deepEqual(production.calls,['password-reset']);
});
