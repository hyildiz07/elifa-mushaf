import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const stripImports=source=>source.replace(/^import .*;\r?\n/gm,'');
const clientSource=stripImports(fs.readFileSync('src/firebase-client.mjs','utf8')).replace(/export const /g,'const ');
const publicSource=stripImports(fs.readFileSync('src/firebase-public.mjs','utf8')).replace("import('firebase/analytics')",'analyticsImport()');
function client({hostname='mushaf.elifaplatform.com',previewBuild=false,native=false}={}){
 const calls=[],listeners=new Map(),config={projectId:'production-fixture'},auth={},db={},app={};
 const sdk=name=>(...args)=>{calls.push({name,args});return name==='initializeApp'?app:name==='getFirestore'?db:auth;};
 const context={URL,__ELIFA_ACCOUNT_PREVIEW__:previewBuild,location:{hostname,href:'https://'+hostname+'/'},window:{ELIFA_FB:config,ELIFA_NATIVE_IOS:native,ElifaLocale:{current:()=> 'tr'},addEventListener:(name,fn)=>listeners.set(name,fn)},indexedDBLocalPersistence:'idb',initializeApp:sdk('initializeApp'),getAuth:sdk('getAuth'),initializeAuth:sdk('initializeAuth'),getFirestore:sdk('getFirestore'),connectAuthEmulator:sdk('connectAuthEmulator'),connectFirestoreEmulator:sdk('connectFirestoreEmulator')};
 vm.runInNewContext(clientSource+'\nwindow.result={app,auth,db,isPreview,isLocal};',context);
 return {calls,context,result:context.window.result,listeners,auth,db,app,config};
}
test('hosted preview never initializes Firebase SDK, including immutable build URLs and native flags',()=>{
 for(const options of [{hostname:'deploy-preview-20--elifamushaf.netlify.app'},{hostname:'abcdef0123456789--elifamushaf.netlify.app',previewBuild:true},{hostname:'mushaf.elifaplatform.com',previewBuild:true,native:true}]){
  const h=client(options);assert.equal(h.result.isPreview,true);assert.equal(h.result.app,null);assert.equal(h.result.auth,null);assert.equal(h.result.db,null);assert.deepEqual(h.calls,[]);assert.equal(h.listeners.size,0);
 }
});
test('production Firebase initialization, language changes and native persistence stay unchanged',()=>{
 const h=client();assert.equal(h.result.isPreview,false);assert.deepEqual(h.calls.map(x=>x.name),['initializeApp','getAuth','getFirestore']);assert.equal(h.calls[0].args[0],h.config);assert.equal(h.auth.languageCode,'tr');h.listeners.get('elifa:language-changed')({detail:{lang:'en'}});assert.equal(h.auth.languageCode,'en');
 const native=client({native:true,hostname:'localhost'});assert.equal(native.result.isLocal,false);assert.deepEqual(native.calls.map(x=>x.name),['initializeApp','initializeAuth','getFirestore']);assert.equal(native.calls[1].args[1].persistence,'idb');
 assert.equal(client({hostname:'deploy-preview-20--elifamushaf.netlify.app.attacker.test'}).result.isPreview,false);
});
test('localhost still initializes only the demo project and connects both emulators',()=>{
 for(const hostname of ['localhost','127.0.0.1','[::1]']){
  const h=client({hostname});assert.equal(h.result.isLocal,true);assert.equal(h.calls[0].args[0].projectId,'demo-elifa-mushaf');assert.deepEqual(h.calls.map(x=>x.name),['initializeApp','getAuth','getFirestore','connectAuthEmulator','connectFirestoreEmulator']);assert.equal(h.calls[3].args[1],'http://127.0.0.1:9099');assert.equal(h.calls[4].args[1],'127.0.0.1');
 }
});
async function publicFirebase({isPreview=false,isLocal=false}={}){
 const calls=[],window={__elifaEarlyUsage:[['queued',{}]],elifaCheckStaticDuyuru:()=>calls.push('static-fallback'),elifaSetDuyurular:()=>calls.push('announcements'),elifaShowDuyuru:()=>calls.push('unread')};
 const context={isPreview,isLocal,app:{},db:{},window,location:{hostname:'mushaf.elifaplatform.com'},localStorage:{getItem:()=>null},createUsageReporter:()=>{calls.push('usage-reporter');return {track:event=>calls.push('track:'+event),ready:()=>calls.push('usage-ready')}},isMeasurementHost:()=>true,collection:()=>{calls.push('collection');return {}},where:()=>({}),query:()=>({}),getDocs:async()=>{calls.push('getDocs');return {docs:[{id:'a',data:()=>({aktif:true,baslik:'Test'})}]}},getDoc:async()=>{calls.push('getDoc');return {exists:()=>false}},doc:()=>({}),analyticsImport:async()=>{calls.push('analytics-import');return {isSupported:async()=>true,getAnalytics:()=>{calls.push('getAnalytics');return {}},logEvent:()=>calls.push('logEvent')}}};
 vm.runInNewContext(publicSource,context);window.elifaLog('manual');window.elifaStat('stat');await new Promise(resolve=>setImmediate(resolve));return {calls,window};
}
test('preview public module never reads announcements or initializes analytics even on a measurement host',async()=>{
 const h=await publicFirebase({isPreview:true});assert.deepEqual(h.calls,[]);assert.equal(typeof h.window.elifaLog,'function');assert.equal(typeof h.window.elifaStat,'function');assert.equal(h.window.__elifaEarlyUsage.length,0);
});
test('production announcement and analytics startup remains active while local public reads stay disabled',async()=>{
 const production=await publicFirebase();for(const call of ['usage-reporter','getDocs','announcements','analytics-import','getAnalytics','track:queued','track:manual','track:app_open'])assert.ok(production.calls.includes(call),call);
 const local=await publicFirebase({isLocal:true});assert.deepEqual(local.calls,['usage-reporter']);
});
