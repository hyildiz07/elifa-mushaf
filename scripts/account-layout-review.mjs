// Local UI fixture: the production Firebase SDK and API are never imported.
if(!/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname))throw Error('This fixture runs only on loopback.');
const html=await (await fetch('/index.html')).text();
document.body.insertAdjacentHTML('beforeend',html.slice(html.indexOf('<dialog id="accountDialog"'),html.indexOf('</dialog>',html.indexOf('<dialog id="accountDialog"'))+9));
const [data,workspace,profile,i18n]=await Promise.all([import('/src/account-data.mjs'),import('/src/account-workspaces.mjs'),import('/src/account-profile.mjs'),import('/src/account-i18n.mjs')]);
const memory=new Map([[workspace.WORKSPACE_OWNER,'local-review']]);
const localStorage={getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,String(value)),removeItem:key=>memory.delete(key)};
let revision=1,savedProfile={displayName:'Hüseyin',age:null,birthDate:null,gender:'unspecified'};
const user={uid:'local-review',displayName:'Hüseyin',email:'deneme@example.test',emailVerified:true,providerData:[{providerId:'password'}],getIdToken:async()=> 'local-fixture-only'};
const auth={currentUser:user,authStateReady:async()=>{}};
class Provider{setCustomParameters(){}}
const reject=async()=>{throw Error('Bu yerel görünümde gerçek hesap işlemi yapılmaz.');};
const dependencies={...data,...workspace,...profile,...i18n,auth,isLocal:true,__ELIFA_ACCOUNT_PREVIEW__:false,localStorage,
 GoogleAuthProvider:Provider,OAuthProvider:Provider,EmailAuthProvider:{credential:()=>({})},
 onAuthStateChanged:(_auth,callback)=>queueMicrotask(()=>callback(user)),
 signInWithPopup:reject,signInWithCredential:reject,signInWithEmailAndPassword:reject,createUserWithEmailAndPassword:reject,signOut:reject,sendPasswordResetEmail:reject,sendEmailVerification:reject,reauthenticateWithCredential:reject,reauthenticateWithPopup:reject,applyActionCode:reject,verifyPasswordResetCode:reject,confirmPasswordReset:reject,reload:reject,linkWithPopup:reject,linkWithCredential:reject,
 fetch:async(_url,{body})=>{const request=JSON.parse(body);let result={};
  if(request.action==='profileGet')result={profile:savedProfile,revision};
  else if(request.action==='profilePut'){savedProfile=request.profile;result={profile:savedProfile,revision:++revision};}
  else if(request.action==='list')result={backups:[{id:'local-backup',created_at:'2026-10-19T09:30:00Z'}]};
  else if(request.action==='save'||request.action==='deleteBackup')result={ok:true};
  else if(request.action==='syncGet')result={revision:0,payload:null};
  else throw Error('Bu işlem yerel görünümde kapalı.');
  return Response.json(result);
 }};
window.elifaReadLocalValue=key=>localStorage.getItem(key);
const source=(await (await fetch('/src/account.mjs')).text()).replace(/^import .*;\r?\n/gm,'');
new Function(...Object.keys(dependencies),source+'\nwindow.fixtureAccount={showConflicts};')(...Object.values(dependencies));
document.getElementById('fixtureOpen').onclick=()=>window.elifaAccount.open();
document.getElementById('fixtureDark').onclick=()=>document.body.dataset.dark=document.body.dataset.dark==='1'?'0':'1';
document.getElementById('fixtureConflict').onclick=()=>window.fixtureAccount.showConflicts([{key:'notes',path:'2:127',id:'notes-2-127'}]);
// Opening here is deliberate fixture behavior; the app itself does not auto-open.
await Promise.resolve();await window.elifaAccount.open();

// Fixture-only observable measurements; no application diagnostics are installed.
const fixtureDialog=document.getElementById('accountDialog'),fixtureBody=fixtureDialog.querySelector('.account-body'),sizeOutput=document.getElementById('fixtureSize');
const measureFixture=()=>{
 const dimensions={viewport:[innerWidth,innerHeight],panel:fixtureDialog.dataset.accountPanel,body:[fixtureBody.clientHeight,fixtureBody.scrollHeight],horizontalOverflow:fixtureDialog.scrollWidth>fixtureDialog.clientWidth+1,verticalOverflow:fixtureBody.scrollHeight>fixtureBody.clientHeight+1};
 sizeOutput.value=innerWidth+'×'+innerHeight+' · '+dimensions.panel+' · kaydırma '+(dimensions.verticalOverflow?'var':'yok');sizeOutput.textContent=sizeOutput.value;sizeOutput.dataset.measurements=JSON.stringify(dimensions);
};
new ResizeObserver(measureFixture).observe(fixtureBody);new MutationObserver(measureFixture).observe(fixtureDialog,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['hidden','data-account-panel']});window.addEventListener('resize',measureFixture);measureFixture();
