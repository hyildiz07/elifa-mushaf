import {GoogleAuthProvider,OAuthProvider,EmailAuthProvider,signInWithPopup,signInWithCredential,signInWithEmailAndPassword,createUserWithEmailAndPassword,signOut,onAuthStateChanged,sendPasswordResetEmail,sendEmailVerification,reauthenticateWithCredential,reauthenticateWithPopup,applyActionCode,verifyPasswordResetCode,confirmPasswordReset,reload,linkWithPopup,linkWithCredential} from 'firebase/auth';
import {auth,isLocal} from './firebase-client.mjs';
import './firebase-public.mjs';
import {collectBackup,validateBackup,restoreBackup,recoverPendingRestore,mergeBackups,PREVIOUS_KEY,BACKUP_KEYS,SYNC_BASE_PREFIX,SYNC_ENABLED_PREFIX} from './account-data.mjs';
import {accountLanguage,accountText,localizeAccountTree} from './account-i18n.mjs';
import {createSafeStorage,createAccountWorkspaces,WORKSPACE_OWNER} from './account-workspaces.mjs';
import {mountAccountProfile} from './account-profile.mjs';
const dialog=document.getElementById('accountDialog'),$=id=>document.getElementById(id);
// Build metadata also covers immutable Netlify preview URLs. Host detection is
// only an accidental-action safeguard; the server enforces its own isolation.
const previewAccount=(typeof __ELIFA_ACCOUNT_PREVIEW__!=='undefined'&&__ELIFA_ACCOUNT_PREVIEW__)||/^deploy-preview-\d+--[a-z0-9-]+\.netlify\.app$/i.test(location.hostname||new URL(location.href).hostname);
const previewAccountMessage='Önizlemede hesap/bulut işlemleri kapalı. Gerçek hesabını burada oluşturma veya değiştirme.';
if(previewAccount){const notice=document.createElement('p');notice.id='accountPreviewNotice';notice.className='account-card';notice.setAttribute('role','note');notice.textContent=previewAccountMessage;notice.style.cssText='font-size:13px;line-height:1.45;padding:10px 12px;margin:8px 0';dialog.prepend(notice);}
for(const root of [dialog,$('accountHome'),$('accountSettings'),$('storageFailure')].filter(Boolean)){
 localizeAccountTree(root);
 new MutationObserver(()=>localizeAccountTree(root)).observe(root,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label']});
}
window.addEventListener('elifa:language-changed',()=>{
 for(const root of [dialog,$('accountHome'),$('accountSettings'),$('storageFailure')].filter(Boolean))localizeAccountTree(root);
 render();
});
const google=new GoogleAuthProvider();google.setCustomParameters({prompt:'select_account'});
let user=null,mode='login',busy=false,epoch=0,resetCode=null,authReady=false,syncRunning=false,syncTimer=null,pendingConflict=null;
let workspaceReady=true,workspaceTransition=false,syncPending=false,profileName=null;
const accountStorage=createSafeStorage(()=>localStorage,()=>{window.elifaStorageFailed=true;$('storageFailure').hidden=false;});
const strictStorage={getItem:key=>localStorage.getItem(key),setItem:(key,value)=>localStorage.setItem(key,value),removeItem:key=>localStorage.removeItem(key)};
const workspaces=createAccountWorkspaces(strictStorage,key=>window.elifaReadLocalValue?window.elifaReadLocalValue(key):strictStorage.getItem(key));
window.elifaWorkspaceWritable=()=>{try{return authReady&&workspaceReady&&!workspaceTransition&&workspaces.isActive(user?.uid);}catch{return false;}};
const sessionListeners=new Set();
const sessionUser=()=>user?{uid:user.uid,emailVerified:!!user.emailVerified,displayName:profileName||null}:null;
function publishSession(){const current=sessionUser();for(const listener of sessionListeners)try{listener(current);}catch{}window.dispatchEvent(new CustomEvent('elifa:account-changed',{detail:{user:current}}));}
window.elifaAccountSession={
 getUser:sessionUser,
 isReady:()=>authReady,
 async getIdToken(forceRefresh=false){if(previewAccount)return null;await auth.authStateReady();const current=user,generation=epoch;if(!current)return null;const token=await current.getIdToken(forceRefresh);if(user?.uid!==current.uid||auth.currentUser?.uid!==current.uid||generation!==epoch)throw Error('Hesap değişti. Yeniden dene.');return token;},
 onChange(listener){sessionListeners.add(listener);if(authReady)listener(sessionUser());return ()=>sessionListeners.delete(listener);}
};
function assertWorkspace(){if(!workspaceReady||workspaceTransition||!workspaces.isActive(user?.uid))throw Error('Hesap kayıtları hazırlanıyor. Cihazda yer açıp yeniden dene.');}
function reloadWorkspace(){if(workspaceTransition&&workspaceReady&&!busy){window.dispatchEvent(new CustomEvent('elifa:workspace-changing'));location.reload();}}
const profileUI=mountAccountProfile({api,getUser:()=>user,workspaces,action,language:accountLanguage,onProfile:value=>{profileName=value?.displayName||null;render();publishSession();}});
const deletePanel=$('accountDeleteForm').closest('details');
deletePanel.querySelector('p').textContent=accountLanguage()==='tr'?'Hesabın, özel profilin ve bulut yedeklerin silinir. Yorumlarının metni ve yaptığın bildirimler kaldırılır; başkalarının yanıtları kalır. Hatim ilerlemelerin korunur; adın ve hesabınla bağlantısı kaldırılır. Özel katılım ve yönetici bağlantılarını önce sakla. Cihazdaki kayıtların ayrı kopyada kalır; çıkışta hesapsız kayıtların açılır. Önce cihaz yedeğini indirmen önerilir.':'Your account, private profile and cloud backups are deleted. Your comment text and reports are removed; replies by others remain. Khatm progress remains, with your name and account link removed. Keep private participant and organizer links first. Device records remain in a separate copy; signing out opens guest records. Download a device backup first.';
const exportBeforeDelete=document.createElement('button');exportBeforeDelete.type='button';exportBeforeDelete.textContent=accountLanguage()==='tr'?'Önce cihaz yedeğini indir':'Download device backup first';exportBeforeDelete.onclick=()=>action(async()=>{assertWorkspace();$('storageExport').click();});$('accountDeleteForm').before(exportBeforeDelete);
const actionSettings=()=>({url:(window.ELIFA_NATIVE_IOS?'https://mushaf.elifaplatform.com/':location.origin+'/'),handleCodeInApp:false});
const nativeAuth=()=>window.ELIFA_NATIVE_IOS?window.elifaNativeAuth:null;
async function googleCredential(){return GoogleAuthProvider.credential(await nativeAuth().google());}
async function appleProof(){const {idToken,nonce,authorizationCode}=await nativeAuth().apple();return {credential:new OAuthProvider('apple.com').credential({idToken,rawNonce:nonce}),authorizationCode};}
const errors={
 'auth/invalid-credential':'E-posta veya şifre doğrulanamadı.',
 'auth/email-already-in-use':'Bu e-posta ile bir hesap var. Giriş yap veya Şifremi unuttum seçeneğini kullan.',
 'auth/weak-password':'Daha güçlü, en az 10 karakterli bir şifre kullan.',
 'auth/invalid-email':'Geçerli bir e-posta adresi gir.',
 'auth/too-many-requests':'Çok fazla deneme yapıldı. Biraz sonra tekrar dene.',
 'auth/popup-closed-by-user':'Google ile giriş iptal edildi.',
 'auth/cancelled-popup-request':'Giriş penceresi kapatıldı. Yeniden dene.',
 'auth/popup-blocked':'Tarayıcı giriş penceresini engelledi. Bu site için açılır pencerelere izin verip yeniden dene.',
 'auth/unauthorized-domain':'Bu site adresi henüz hesap hizmetine tanıtılmamış.',
 'auth/operation-not-allowed':'Bu giriş yöntemi henüz etkinleştirilmemiş.',
 'auth/account-exists-with-different-credential':'Bu e-posta başka bir yöntemle kayıtlı. Önce mevcut yönteminle giriş yap.',
 'auth/credential-already-in-use':'Bu Google hesabı başka bir hesaba bağlı. Çıkış yapıp o hesapla giriş yapabilirsin; yedekler birleştirilmedi.',
 'auth/requires-recent-login':'İşlem için yeniden giriş yapman gerekiyor.',
 'auth/invalid-action-code':'Bağlantı geçersiz veya daha önce kullanılmış.',
 'auth/expired-action-code':'Bağlantının süresi dolmuş. Yeni bir bağlantı iste.',
 'auth/network-request-failed':'Hesap hizmetine bağlanılamadı. İnternetini kontrol edip tekrar dene.'
};
function message(text,error=false){$('accountStatus').textContent=accountText(text);$('accountStatus').setAttribute('role',error?'alert':'status');$('accountStatus').classList.toggle('error',error);}
function errorText(e){return !navigator.onLine?'İnternet bağlantısı yok. Cihazdaki kayıtların korunuyor.':errors[e.code]||(e.code?'İşlem tamamlanamadı. Yeniden dene.':e.message)||'İşlem tamamlanamadı.';}
function availability(){
 $('accountSubmit').disabled=busy||!authReady;
 $('accountGoogle').disabled=busy||!authReady||(window.ELIFA_NATIVE_IOS&&!nativeAuth());
 $('accountApple').disabled=busy||!authReady||!nativeAuth();
 $('accountSave').disabled=busy||!workspaceReady||workspaceTransition||!user?.emailVerified||!$('accountCloudConsent').checked;
 $('accountSyncNow').disabled=busy||syncRunning||!workspaceReady||workspaceTransition||!user?.emailVerified||!$('accountSyncEnabled').checked;
 $('profileSave').disabled=busy||!user?.emailVerified||!profileUI.ready();
 if(previewAccount)dialog.querySelectorAll('button,input,select,textarea').forEach(n=>{if(n.id!=='accountClose')n.disabled=true;});
}
function setBusy(v){busy=v;dialog.setAttribute('aria-busy',String(v));dialog.querySelectorAll('button,input').forEach(n=>{if(n.id!=='accountClose')n.disabled=v;});if(!v){$('accountSyncEnabled').disabled=!user?.emailVerified||!workspaceReady||workspaceTransition;availability();if(syncPending)scheduleSync(50);reloadWorkspace();}}
async function action(work){if(previewAccount){message(previewAccountMessage);return;}if(busy)return;setBusy(true);message('İşlem sürüyor…');try{await work();}catch(e){message(errorText(e),true);}finally{if($('accountStatus').textContent===accountText('İşlem sürüyor…'))message('');setBusy(false);}}
function render(){
 const account=!!user&&mode!=='reset';
 $('accountGuest').hidden=account;$('accountMember').hidden=!account;
 $('accountEmail').textContent=user?.email||'';
 $('accountEmailRow').hidden=mode==='reset';
 $('accountPasswordRow').hidden=mode==='forgot';$('accountTermsRow').hidden=mode!=='signup';
 $('accountEmailInput').required=mode!=='reset';$('accountPassword').required=mode!=='forgot';
 $('accountPassword').minLength=mode==='login'?1:10;
 $('accountPassword').autocomplete=mode==='login'?'current-password':'new-password';
 $('accountPasswordHelp').hidden=['login','forgot'].includes(mode);$('accountTerms').required=mode==='signup';
 $('accountSubmit').textContent=({login:'Giriş yap',signup:'Hesap oluştur',forgot:'Yenileme bağlantısı gönder',reset:'Yeni şifreyi kaydet'})[mode];
 $('accountFormTitle').textContent=({login:'Tekrar hoş geldin',signup:'Kayıtlarını yanında taşı',forgot:'Şifreni yenile',reset:'Yeni şifreni belirle'})[mode];
 for(const [id,m]of [['accountLoginTab','login'],['accountSignupTab','signup']])$(id).setAttribute('aria-pressed',String(mode===m));
 $('accountTabs').hidden=mode==='reset';$('accountGoogle').hidden=['forgot','reset'].includes(mode);$('accountApple').hidden=!nativeAuth()||['forgot','reset'].includes(mode);
 $('accountProvider').textContent=user?.providerData.map(p=>p.providerId==='google.com'?'Google':p.providerId==='apple.com'?'Apple':p.providerId==='password'?'E-posta / şifre':p.providerId).join(' + ')||'—';
 $('accountSyncEnabled').checked=!!user&&accountStorage.getItem(SYNC_ENABLED_PREFIX+user.uid)==='1';
 $('accountSyncEnabled').disabled=!user?.emailVerified||!workspaceReady||workspaceTransition;
 $('accountHomeLabel').textContent=user?'Hesabım':'Giriş / Kayıt';
 $('accountHomeCompact').textContent=user?'Hesap':'Giriş';
 $('accountHome').setAttribute('aria-label',user?'Hesabım ve bulut yedekleri':'Giriş yap veya kayıt ol');
 $('accountSettingsLabel').textContent=user?'Hesabım':'Giriş yap / Kaydol';
 $('accountSettingsSub').textContent=user?'Bulut yedekleri ve hesap ayarları':'Kayıtlarını cihazların arasında taşı';
 $('accountSettings').setAttribute('aria-label',user?'Hesabım ve bulut yedekleri':'Giriş yap veya kayıt ol');
 $('accountDeviceNote').textContent=accountLanguage()==='tr'?'Her hesabın kayıtları bu cihazda ayrı tutulur. Hesapsız kayıtlarını yalnızca istersen kendi hesabına kopyalarsın.':'Each account has separate records on this device. Guest records are copied to your account only if you choose.';
 $('accountVerification').hidden=!user||user.emailVerified;
 const passwordUser=user?.providerData.some(p=>p.providerId==='password');
 $('accountDeletePassword').required=!!passwordUser;$('accountDeletePasswordRow').hidden=!passwordUser;
 $('accountResetPassword').hidden=!passwordUser;
 $('accountLinkGoogle').hidden=!user||user.providerData.some(p=>p.providerId==='google.com');
 accountNav?.render();availability();
}
function authChanged(next){
 if(previewAccount)next=null;
 const changed=user?.uid!==next?.uid;
 if(changed){epoch++;pendingConflict=null;syncPending=false;profileName=null;clearTimeout(syncTimer);$('accountConflict').hidden=true;$('accountBackupList').replaceChildren();$('accountBackupCount').textContent='';$('accountBackupStatus').textContent='Henüz kontrol edilmedi.';$('accountCloudConsent').checked=false;$('accountSyncStatus').textContent='Güncelleme kapalı.';$('accountLastSync').textContent='Henüz güncellenmedi.';}
 user=next;authReady=true;const generation=epoch;
 const fail=e=>{if(generation!==epoch)return;workspaceReady=false;message(e.message,true);$('storageFailure').hidden=false;render();publishSession();};
 const prepare=()=>{if(generation!==epoch)return;workspaceReady=true;if(!workspaces.isActive(next?.uid)){workspaceTransition=true;window.stopPlan?.(true);document.querySelectorAll('audio').forEach(audio=>audio.pause());if(workspaces.activate(next?.uid))clearTimeout(syncTimer);}};
 const finish=()=>{
  if(generation!==epoch)return;
  if(changed){profileUI.changed();accountNav?.reset();}render();publishSession();
  if(!workspaceTransition&&workspaceReady&&next?.emailVerified&&accountStorage.getItem(SYNC_ENABLED_PREFIX+next.uid)==='1')scheduleSync(1500);
  reloadWorkspace();
 };
 try{
  if(navigator.locks?.request&&!workspaces.isActive(next?.uid)){
   // Two tabs may restore Firebase sessions at once. The browser-wide lock
   // keeps one tab from archiving a half-applied local workspace from another tab.
   workspaceReady=false;workspaceTransition=true;render();
   navigator.locks.request('elifa-account-workspace',()=>prepare()).then(finish,fail);return;
  }
  prepare();finish();
 }catch(e){fail(e);}
}
async function open(panel='home'){
 if(!dialog.open)dialog.showModal();render();
 if(typeof panel!=='string')panel='home';
 accountNav?.show(user?panel:'home');
 if(previewAccount){message(previewAccountMessage);return;}
 if(!authReady)message('Hesap hizmeti hazırlanıyor…');
 else if(!user)message(isLocal?'Yerel test ortamı: gerçek kullanıcı hesabı oluşturulmaz.':'Okuma ve dinleme için hesap gerekmiyor.');
 else if(!busy)message('');
}

$('accountClose').onclick=()=>dialog.close();
dialog.addEventListener('close',()=>{$('accountPassword').value='';$('accountDeletePassword').value='';});
$('accountHome').onclick=open;
$('accountSettings').onclick=open;
$('accountRetry').onclick=()=>action(async()=>{await auth.authStateReady();authChanged(auth.currentUser);if(user){await reload(user);authChanged(auth.currentUser);if(user.emailVerified)await loadBackups();}message('Hesap durumu güncellendi.');});
for(const [id,m]of [['accountLoginTab','login'],['accountSignupTab','signup'],['accountForgot','forgot']])$(id).onclick=()=>{mode=m;render();message(m==='forgot'?'E-posta adresine şifre yenileme bağlantısı gönderilecek.':'');};
$('accountCloudConsent').onchange=availability;
async function signedIn(){
 mode='login';authChanged(auth.currentUser);
 if(!user?.emailVerified){message('Bulut yedeklerini kullanmak için e-posta adresini doğrula.');return;}
 message('Giriş tamamlandı. Kayıtlarını yedeklemek istersen Yedeklerim bölümünü aç.');
}

$('accountGoogle').onclick=()=>action(async()=>{if(window.ELIFA_NATIVE_IOS)await signInWithCredential(auth,await googleCredential());else await signInWithPopup(auth,google);await signedIn();});
$('accountApple').onclick=()=>action(async()=>{const {credential}=await appleProof();await signInWithCredential(auth,credential);await signedIn();});
$('accountLinkGoogle').onclick=()=>action(async()=>{if(window.ELIFA_NATIVE_IOS)await linkWithCredential(user,await googleCredential());else await linkWithPopup(user,google);await reload(user);authChanged(auth.currentUser);message('Google hesabın bağlandı. Aynı yedeklerine iki giriş yöntemiyle de ulaşabilirsin.');});
$('accountForm').onsubmit=e=>{e.preventDefault();action(async()=>{
 const email=$('accountEmailInput').value.trim(),password=$('accountPassword').value;
 try{
  if(mode==='forgot'){await sendPasswordResetEmail(auth,email,actionSettings());message('Adres kayıtlıysa yenileme e-postası gönderildi. İstenmeyen postaları da kontrol et.');return;}
  if(mode==='reset'){await confirmPasswordReset(auth,resetCode,password);resetCode=null;mode='login';render();message('Şifren yenilendi. Yeni şifrenle giriş yapabilirsin.');return;}
  if(mode==='signup'){
   if(!$('accountTerms').checked)throw Error('Gizlilik bilgilendirmesini onayla.');
   const {user:created}=await createUserWithEmailAndPassword(auth,email,password);
   if(auth.currentUser?.uid!==created.uid)throw Error('Hesap değişti. Yeniden dene.');
   authChanged(created);
   try{await sendEmailVerification(created,actionSettings());message('Hesabın oluşturuldu. Doğrulama e-postasını kontrol et.');}
   catch{message('Hesabın oluşturuldu; doğrulama e-postası gönderilemedi. Aşağıdan yeniden gönderebilirsin.',true);}
   return;
  }
  await signInWithEmailAndPassword(auth,email,password);await signedIn();
 }finally{$('accountPassword').value='';}
});};
$('accountVerifySend').onclick=()=>action(async()=>{await sendEmailVerification(user,actionSettings());message('Doğrulama e-postası gönderildi.');});
$('accountVerifyRefresh').onclick=()=>action(async()=>{await reload(user);await user.getIdToken(true);authChanged(auth.currentUser);if(user.emailVerified){await Promise.all([loadBackups(),profileUI.load()]);message('E-posta doğrulandı.');}else message('Doğrulama henüz tamamlanmamış. E-postadaki bağlantıyı aç.');});
async function api(actionName,extra={}){
 if(previewAccount)throw Error(previewAccountMessage);
 const owner=user?.uid,generation=epoch,current=user;if(!owner)throw Error('Önce giriş yap.');
 const needsWorkspace=['save','syncGet','syncPut','restore'].includes(actionName);if(needsWorkspace)assertWorkspace();
 const token=await current.getIdToken();
 if(owner!==user?.uid||auth.currentUser?.uid!==owner||generation!==epoch)throw Error('Hesap değişti. Yeniden kontrol et.');if(needsWorkspace)assertWorkspace();
 const response=await fetch((window.ELIFA_API_BASE||'')+'/api/account',{method:'POST',credentials:'omit',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({action:actionName,expectedUser:owner,...extra}),signal:AbortSignal.timeout(25000)});
 if(owner!==user?.uid||auth.currentUser?.uid!==owner||generation!==epoch)throw Error('Hesap değişti. Yeniden kontrol et.');if(needsWorkspace)assertWorkspace();
 if(!response.headers.get('content-type')?.includes('application/json'))throw Error('Hesap hizmeti henüz yayımlanmamış veya kullanılamıyor.');
 const data=await response.json();if(owner!==user?.uid||auth.currentUser?.uid!==owner||generation!==epoch)throw Error('Hesap değişti. Yeniden kontrol et.');if(needsWorkspace)assertWorkspace();if(!response.ok){const error=Error(data.error||'İşlem tamamlanamadı.');error.status=response.status;throw error;}return data;
}
const localSnapshot=()=>collectBackup({getItem:key=>window.elifaReadLocalValue?window.elifaReadLocalValue(key):localStorage.getItem(key)});
const sameData=(a,b)=>JSON.stringify(a?.veri||{})===JSON.stringify(b?.veri||{});
function scheduleSync(delay=1200){
 clearTimeout(syncTimer);
 if(previewAccount){syncPending=false;return;}
 if(!workspaceReady||workspaceTransition||!user?.emailVerified||accountStorage.getItem(SYNC_ENABLED_PREFIX+user.uid)!=='1'){syncPending=false;return;}
 syncPending=true;const generation=epoch;
 syncTimer=setTimeout(()=>{if(generation!==epoch)return;if(busy||syncRunning){scheduleSync(500);return;}syncPending=false;syncNow().catch(e=>{$('accountSyncStatus').textContent=errorText(e);});},delay);
}
function showConflicts(conflicts){
 pendingConflict=conflicts;accountNav?.render();const box=$('accountConflict'),list=$('accountConflictList');list.replaceChildren();box.hidden=false;
 for(const c of conflicts){const row=document.createElement('div'),label=document.createElement('span'),local=document.createElement('label'),remote=document.createElement('label'),name='sync-'+c.id.replace(/[^a-z0-9]/gi,'-');
  label.textContent=(c.key==='notes'?'Not':c.key==='set'?'Ayar':c.key==='prog'?'Okuma konumu':c.key==='studySessions'?(window.tr?.('study_title')||'Study'):c.key)+' '+(c.path||'');
  for(const [container,value,title] of [[local,'local','Bu cihaz'],[remote,'remote','Hesabımdaki']]){const input=document.createElement('input');input.type='radio';input.name=name;input.value=value;input.dataset.conflict=c.id;container.append(input,document.createTextNode(title));}
  row.append(label,local,remote);list.append(row);
 }
 $('accountSyncStatus').textContent='Aynı kayıt iki cihazda değişmiş. Hangisi kalsın?';
}
async function syncNow(resolutions={}){
 if(previewAccount){message(previewAccountMessage);return;}
 if(syncRunning||!workspaceReady||workspaceTransition||!user?.emailVerified||!$('accountSyncEnabled').checked)return;
 if(!navigator.onLine){$('accountSyncStatus').textContent='Çevrimdışı. Kayıtlar bu cihazda; bağlantı gelince yeniden denenecek.';return;}
 if(window.elifaActivityBusy?.()){$('accountSyncStatus').textContent=window.tr?.('sync_deferred')||'Sync will continue after your study.';scheduleSync(5000);return;}
 const owner=user.uid,generation=epoch;syncRunning=true;availability();$('accountSyncStatus').textContent='Kayıtlar karşılaştırılıyor…';
 try{
  const before=localSnapshot(),remote=await api('syncGet'),stored=accountStorage.getItem(SYNC_BASE_PREFIX+owner),previous=stored?JSON.parse(stored):null,base=remote.revision===0?null:previous;
  if(owner!==user?.uid||generation!==epoch)return;
  if(window.elifaActivityBusy?.()){scheduleSync(5000);return;}
  const {payload,conflicts}=mergeBackups(base?.payload||null,before,remote.payload,resolutions);
  if(conflicts.length){showConflicts(conflicts);return;}
  if(!sameData(before,localSnapshot()))throw Error('Bu cihazdaki kayıtlar işlem sırasında değişti. Yeniden eşitle.');
  pendingConflict=null;$('accountConflict').hidden=true;
  let revision=remote.revision,updated_at=remote.updated_at;
  if(!sameData(payload,remote.payload)){
   try{const saved=await api('syncPut',{revision,payload});revision=saved.revision;updated_at=saved.updated_at;}
   catch(e){if(e.status===409){scheduleSync(500);$('accountSyncStatus').textContent='Başka cihazdaki değişiklikler alınıyor…';return;}throw e;}
  }
  if(owner!==user?.uid||generation!==epoch)return;
  if(window.elifaActivityBusy?.()){scheduleSync(5000);return;}
  if(!sameData(before,localSnapshot()))throw Error('Bu cihazdaki kayıtlar işlem sırasında değişti. Yeniden eşitle.');
  if(!sameData(before,payload)){assertWorkspace();restoreBackup(localStorage,payload);}
  accountStorage.setItem(SYNC_BASE_PREFIX+owner,JSON.stringify({revision,payload}));
  $('accountLastSync').textContent=updated_at?new Date(updated_at).toLocaleString(accountLanguage()):accountText('Şimdi');
  $('accountSyncStatus').textContent='Kayıtlar güncellendi.';
  if(!sameData(before,payload))location.reload();
 }catch(e){if(owner!==user?.uid||generation!==epoch)return;$('accountSyncStatus').textContent=errorText(e);if(/işlem sırasında değişti/.test(e.message||''))scheduleSync(500);throw e;}
 finally{syncRunning=false;availability();if(syncPending)scheduleSync(50);}
}
$('accountSyncEnabled').onchange=()=>{
 if(previewAccount){$('accountSyncEnabled').checked=false;message(previewAccountMessage);return;}
 if(!user)return;const enabled=$('accountSyncEnabled').checked;
 if(enabled){assertWorkspace();if(!accountStorage.setItem(SYNC_ENABLED_PREFIX+user.uid,'1')){accountStorage.removeItem(SYNC_ENABLED_PREFIX+user.uid);$('accountSyncEnabled').checked=false;message('Eşitleme tercihi bu cihazda saklanamadı. Cihazında yer açıp tekrar dene.',true);return;}$('accountSyncStatus').textContent='Güncelleme açık. Bu cihaz ve hesabındaki kayıtlar karşılaştırılacak.';scheduleSync(50);}
 else{accountStorage.removeItem(SYNC_ENABLED_PREFIX+user.uid);syncPending=false;clearTimeout(syncTimer);pendingConflict=null;$('accountConflict').hidden=true;$('accountSyncStatus').textContent='Güncelleme kapalı. Bu cihazdaki kayıtlar korunuyor.';}
 availability();
};
$('accountSyncNow').onclick=()=>syncNow().catch(()=>{});
$('accountResolve').onclick=()=>{
 if(!pendingConflict)return;const resolutions={};
 for(const c of pendingConflict){const selected=[...$('accountConflictList').querySelectorAll('input:checked')].find(input=>input.dataset.conflict===c.id);if(!selected){message('Her kayıt için saklamak istediğin sürümü seç.',true);return;}resolutions[c.id]=selected.value;}
 syncNow(resolutions).catch(()=>{});
};
window.addEventListener('online',()=>scheduleSync(200));
window.addEventListener('elifa-data-changed',()=>scheduleSync());
window.addEventListener('storage',e=>{if(e.key===WORKSPACE_OWNER){workspaceTransition=true;syncPending=false;clearTimeout(syncTimer);reloadWorkspace();return;}if(BACKUP_KEYS.includes(e.key))scheduleSync();});
async function loadBackups(){
 const {backups}=await api('list'),list=$('accountBackupList');list.replaceChildren();
 $('accountBackupCount').textContent=backups.length?backups.length+accountText(' / 20 yedek'):'Henüz bulut yedeğin yok.';
 $('accountBackupStatus').textContent=backups.length?backups.length+accountText(' tarihli yedek'):'Henüz tarihli yedek yok.';
 for(const backup of backups){
  const row=document.createElement('li'),label=document.createElement('span');label.textContent=new Date(backup.created_at).toLocaleString(accountLanguage());row.append(label);
  const restore=document.createElement('button');restore.type='button';restore.textContent=accountText('Geri yükle');restore.onclick=()=>action(async()=>{
   if(!confirm(accountText('Bu yedek cihazdaki not, işaret, ezber ve ayar kayıtlarının yerine geçecek. Önceki kayıtların geri alma kopyası cihazda korunacak. Devam edilsin mi?'))){message('Aktarım iptal edildi.');return;}
   const {payload}=await api('restore',{id:backup.id});assertWorkspace();restoreBackup(localStorage,payload);location.reload();
  });
  const remove=document.createElement('button');remove.type='button';remove.className='account-link danger';remove.textContent=accountText('Sil');remove.setAttribute('aria-label',accountLanguage()==='tr'?label.textContent+' tarihli bulut yedeğini sil':accountText('tarihli bulut yedeğini sil')+' '+label.textContent);remove.onclick=()=>action(async()=>{
   if(!confirm(accountText('Bu bulut yedeği kalıcı olarak silinecek. Devam edilsin mi?'))){message('Silme iptal edildi.');return;}
   await api('deleteBackup',{id:backup.id});await loadBackups();message('Bulut yedeği silindi.');
  });row.append(restore,remove);list.append(row);
 }
}
$('accountSave').onclick=()=>action(async()=>{
 if(!$('accountCloudConsent').checked)throw Error('Hangi kayıtların gönderileceğini onayla.');
 const payload=collectBackup({getItem:key=>window.elifaReadLocalValue?window.elifaReadLocalValue(key):localStorage.getItem(key)});
 await api('save',{payload});await loadBackups();message('Yeni yedek hesabına kaydedildi. Önceki yedeklerin korundu.');
});
$('accountRefresh').onclick=()=>action(async()=>{await loadBackups();message('Yedekler güncellendi.');});
$('accountLogout').onclick=()=>action(async()=>{await signOut(auth);mode='login';authChanged(null);message('Çıkış yapıldı. Bu cihazdaki not ve ilerleme kayıtları kaldı.');});
$('accountResetPassword').onclick=()=>action(async()=>{await sendPasswordResetEmail(auth,user.email,actionSettings());message('Şifreni yenilemek için e-posta gönderildi.');});
$('accountDeleteForm').onsubmit=e=>{e.preventDefault();action(async()=>{
 if(!confirm(accountText('Hesabın ve bütün bulut yedeklerin kalıcı olarak silinecek. Cihaz kayıtların ve Birlikte katılımların kalır. Emin misin?'))){message('Silme iptal edildi.');return;}
 const owner=user?.uid,generation=epoch,current=user;
 try{
  let appleAuthorizationCode;
  if(user.providerData.some(p=>p.providerId==='password'))await reauthenticateWithCredential(user,EmailAuthProvider.credential(user.email,$('accountDeletePassword').value));
  else if(window.ELIFA_NATIVE_IOS){
   if(user.providerData.some(p=>p.providerId==='apple.com')){const proof=await appleProof();appleAuthorizationCode=proof.authorizationCode;await reauthenticateWithCredential(user,proof.credential);}
   else await reauthenticateWithCredential(user,await googleCredential());
  }else await reauthenticateWithPopup(user,google);
  if(user?.uid!==owner||generation!==epoch)throw Error('Hesap değişti.');
  if(window.ELIFA_NATIVE_IOS&&user.providerData.some(p=>p.providerId==='apple.com')){
   if(!appleAuthorizationCode)appleAuthorizationCode=(await appleProof()).authorizationCode;
   await nativeAuth().revokeApple(appleAuthorizationCode);
  }
  await current.getIdToken(true);if(user?.uid!==owner||generation!==epoch)throw Error('Hesap değişti.');await api('deleteAccount',{confirmation:'DELETE',expectedUser:owner});
  try{const pending=window.sessionStorage,prefix='elifa_hatim_comment_pending_v1:'+owner+':';for(let i=pending.length-1;i>=0;i--){const key=pending.key(i);if(key?.startsWith(prefix))pending.removeItem(key);}}catch{}
  await signOut(auth);mode='login';authChanged(null);message('Hesap ve bulut yedekleri silindi. Cihazdaki kayıtlar korundu.');
 }finally{$('accountDeletePassword').value='';}
});};
$('accountUndo').onclick=()=>action(async()=>{
 assertWorkspace();const previous=accountStorage.getItem(PREVIOUS_KEY);if(!previous)throw Error('Bu cihazda geri alınabilecek aktarım yok.');
 if(!confirm(accountText('Son aktarım öncesindeki cihaz kayıtlarına dönülecek. Devam edilsin mi?'))){message('Geri alma iptal edildi.');return;}
 const raw=JSON.parse(previous),veri={};for(const k of BACKUP_KEYS)if(raw[k]!==null&&raw[k]!==undefined)veri[k]=raw[k];
 // A pre-Study-Desk recovery copy never captured this newer key. Keep the
 // studies created after that older copy instead of erasing them on undo.
 if(!Object.hasOwn(raw,'studySessions')){
  const current=accountStorage.getItem('studySessions');if(current!==null)veri.studySessions=current;
 }
 restoreBackup(localStorage,{elifa:'yedek',v:1,veri});location.reload();
});
window.elifaAccount={open};
window.elifaRestoreBackup=payload=>{if(previewAccount)throw Error(previewAccountMessage);assertWorkspace();restoreBackup(localStorage,validateBackup(payload));location.reload();};
window.addEventListener('elifa-storage-error',()=>{$('storageFailure').hidden=false;});
$('storageExport').onclick=()=>{
 try{
  const payload=collectBackup({getItem:key=>window.elifaReadLocalValue(key)});
  const url=URL.createObjectURL(new Blob([JSON.stringify(payload)],{type:'application/json'})),a=document.createElement('a');
  a.href=url;a.download='elifa-kurtarma-yedegi.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }catch(e){alert(accountText('Yedek alınamadı: ')+e.message);}
};
const accountNav=mountAccountNavigation();
if(previewAccount)authChanged(null);else onAuthStateChanged(auth,authChanged,e=>{authReady=true;message(errorText(e),true);availability();publishSession();});
try{if(recoverPendingRestore(localStorage))location.reload();}catch(e){$('storageFailure').hidden=false;message(e.message,true);}
render();if(window.elifaStorageFailed)$('storageFailure').hidden=false;
(async()=>{
 if(previewAccount)return;
 const params=new URLSearchParams(location.search),code=params.get('oobCode'),operation=params.get('mode');
 if(!code||!['verifyEmail','resetPassword'].includes(operation))return;
 const clean=new URL(location.href);for(const key of ['oobCode','mode','apiKey','continueUrl','lang'])clean.searchParams.delete(key);
 history.replaceState(null,'',clean);
 await auth.authStateReady();if(!dialog.open)dialog.showModal();
 await action(async()=>{
  if(operation==='resetPassword'){await verifyPasswordResetCode(auth,code);resetCode=code;mode='reset';render();message('Yeni şifreni belirle.');}
  else{await applyActionCode(auth,code);if(auth.currentUser){await reload(auth.currentUser);await auth.currentUser.getIdToken(true);authChanged(auth.currentUser);}message('E-posta doğrulandı. Hesabına giriş yapabilirsin.');}
 });
})();

function mountAccountNavigation(){
 const member=$('accountMember'),guest=$('accountGuest');
 if(!member?.children?.length)return null;
 let current='home',panelRequest=0;const views=new Map(),navButtons=[];
 const make=(tag,id,cls,text)=>{const node=document.createElement(tag);if(id)node.id=id;if(cls)node.className=cls;if(text)node.textContent=accountText(text);return node;};
 const view=(id)=>{const node=make('section','accountView-'+id,'account-view');node.hidden=id!=='home';views.set(id,node);return node;};
 const home=view('home'),profile=view('profile'),sync=view('sync'),backups=view('backups'),security=view('security'),device=view('device');
 // Keep destination panels connected while moving existing controls: a
 // document ID lookup cannot find a node in a detached section.
 member.append(...views.values());
 const profileCard=$('accountProfileCard'),guestCard=$('accountGuestImport'),verification=$('accountVerification');
 const email=$('accountEmail'),provider=$('accountProvider').closest('p'),lastSync=$('accountLastSync').closest('p'),syncStatus=$('accountSyncStatus').closest('p'),backupStatus=$('accountBackupStatus').closest('p');
 const syncCard=$('accountSyncEnabled').closest('.account-card'),saveCard=$('accountCloudConsent').closest('.account-card'),deleteCard=$('accountDeleteForm').closest('details');
 const backupCount=$('accountBackupCount'),backupHeading=backupCount.previousElementSibling,undo=$('accountUndo').closest('details'),retry=$('accountRetry');
 const summary=make('div',null,'account-profile-summary'),avatar=make('span','accountAvatar','account-avatar','ا'),identity=make('div',null,'account-identity');avatar.setAttribute('aria-hidden','true');
 const name=make('strong','accountDisplayName',null,'Hesabım'),emailLine=make('p'),verified=make('span','accountVerifiedLabel','account-verified');emailLine.append(email);identity.append(name,emailLine,verified);summary.append(avatar,identity);
 const menu=make('nav',null,'account-menu');menu.setAttribute('aria-label',accountText('Hesap bölümleri'));
 const addMenu=(id,title,description,icon)=>{const button=make('button','accountNav-'+id,'account-menu-row');button.type='button';button.setAttribute('aria-controls','accountView-'+id);const mark=make('span',null,'account-menu-icon',icon);mark.setAttribute('aria-hidden','true');const copy=make('span',null,'account-menu-copy');const heading=make('strong',null,null,title),caption=make('small',null,null,description);copy.append(heading,caption);const arrow=make('span',null,'account-menu-arrow','›');arrow.setAttribute('aria-hidden','true');button.append(mark,copy,arrow);button.onclick=()=>show(id);menu.append(button);navButtons.push({heading,caption,title,description});return button;};
 addMenu('profile','Bilgilerim','Ad veya takma ad; diğer bilgiler isteğe bağlı.','✎');
 addMenu('backups','Yedeklerim','Kayıtlarını sakla veya eski yedeğini geri getir.','▣');
 addMenu('sync','Diğer cihazlarım','Aynı hesapla notlarına ve çalışmalarına ulaş.','⇄');
 addMenu('security','Hesap seçenekleri','Şifre, giriş yöntemleri ve çıkış.','⚙');
 const deviceButton=addMenu('device','Bu cihazdaki eski kayıtlar','Hesapsız kayıtlarını istersen hesabına kopyala.','↳');
 home.append(summary,menu);
 const attention=make('div','accountAttention','account-attention');attention.hidden=true;attention.setAttribute('role','status');attention.append(make('span',null,null,'Kayıtların için bir seçim gerekiyor.'));const review=make('button',null,null,'Seçimleri aç');review.type='button';review.onclick=()=>show('sync');attention.append(review);
 if(profileCard)profile.append(profileCard);
 if(verification)profile.prepend(verification);
 sync.append(syncCard);if(lastSync)sync.append(lastSync);if(syncStatus)sync.append(syncStatus);
 const syncLabel=$('accountSyncEnabled').closest('label')?.querySelector('span');if(syncLabel)syncLabel.textContent=accountText('Kayıtlarımı diğer cihazlarımda da kullanmak istiyorum.');
 syncCard.querySelector('strong').textContent=accountText('Cihazlarımda aynı kayıtlar');$('accountSyncNow').textContent=accountText('Şimdi güncelle');
 saveCard.querySelector('strong').textContent=accountText('Bir yedek sakla');const consent=$('accountCloudConsent').closest('label')?.querySelector('span');if(consent)consent.textContent=accountText('Bu cihazdaki kayıtlar bana ait. Hesabımda bir kopyasını sakla. Ses dosyaları gönderilmez.');
 $('accountSave').textContent=accountText('Yedek oluştur');backups.append(saveCard);if(backupHeading)backups.append(backupHeading);backups.append(backupCount,$('accountRefresh'),$('accountBackupList'));if(backupStatus){backupStatus.hidden=true;backups.append(backupStatus);}
 if(backupHeading)backupHeading.textContent=accountText('Sakladığım yedekler');
 if(lastSync?.firstChild)lastSync.firstChild.textContent=accountText('Son güncelleme:')+' ';if(syncStatus?.firstChild)syncStatus.firstChild.textContent=accountText('Durum:')+' ';
 if(undo){const title=undo.querySelector('summary'),description=undo.querySelector('p');if(title)title.textContent=accountText('Son yüklemeyi geri al');if(description)description.textContent=accountText('Son yüklemeden önceki kayıtlarına dönebilirsin.');$('accountUndo').textContent=accountText('Son yüklemeyi geri al');backups.append(undo);}
 if(provider)security.append(provider);security.append($('accountLinkGoogle'),$('accountResetPassword'),$('accountLogout'),deleteCard,retry);
 if(guestCard)device.append(guestCard);device.append($('accountDeviceNote'));
 member.replaceChildren(attention,...views.values());
 const back=make('button','accountPanelBack','account-panel-back','‹ Geri');back.type='button';back.hidden=true;back.onclick=()=>show('home');dialog.querySelector('.account-head').prepend(back);
 const guestHelp=make('details','accountGuestHelp','account-guest-help');guestHelp.append(make('summary',null,null,'Hesap neden gerekli?'));for(const p of guest.querySelectorAll(':scope > p.account-muted'))guestHelp.append(p);guest.append(guestHelp);
 const titles={home:'Hesabım',profile:'Bilgilerim',sync:'Diğer cihazlarım',backups:'Yedeklerim',security:'Hesap seçenekleri',device:'Bu cihazdaki eski kayıtlar'};
 function show(id){
  if(!views.has(id))id='home';current=id;const request=++panelRequest,owner=user?.uid;const visible=()=>request===panelRequest&&owner===user?.uid&&current===id;
  for(const [key,node]of views)node.hidden=key!==id;
  back.hidden=id==='home'||!user;$('accountTitle').textContent=accountText(user?titles[id]:'Hesap');
  dialog.dataset.accountPanel=user?id:'guest';dialog.scrollTop=0;const scroller=dialog.querySelector('.account-body');if(scroller)scroller.scrollTop=0;
  if(user&&id==='profile')profileUI.load().catch(e=>{if(visible())message(errorText(e),true);});
  if(user&&id==='backups'){message('Yedekler yükleniyor…');loadBackups().then(()=>{if(visible()&&$('accountStatus').textContent===accountText('Yedekler yükleniyor…'))message('');}).catch(e=>{if(visible())message(errorText(e),true);});}
  if(id!=='home')back.focus({preventScroll:true});renderNav();
 }
 function renderNav(){
  for(const item of navButtons){item.heading.textContent=accountText(item.title);item.caption.textContent=accountText(item.description);}
  $('accountTitle').textContent=accountText(user?titles[current]:'Hesap');back.textContent=accountText('‹ Geri');
  name.textContent=profileName||user?.displayName||accountText('Hesabım');avatar.textContent=(profileName||user?.displayName||'ا').trim().slice(0,1).toLocaleUpperCase(accountLanguage());
  verified.textContent=accountText(user?.emailVerified?'E-posta doğrulandı':'E-posta doğrulanmadı');verified.classList.toggle('pending',!user?.emailVerified);
  deviceButton.hidden=!profileUI.hasGuestChoice();attention.hidden=!pendingConflict?.length;$('accountHome').dataset.attention=String(!!pendingConflict?.length);
  if(user){if(undo&&undo.parentElement!==backups)backups.append(undo);if(retry.parentElement!==security)security.append(retry);}else{if(undo)guest.append(undo);guest.append(retry);back.hidden=true;}
  dialog.dataset.accountPanel=user?current:'guest';
 }
 return {show,render:renderNav,reset(){panelRequest++;current='home';for(const [id,node]of views)node.hidden=id!=='home';back.hidden=true;$('accountTitle').textContent=accountText(user?'Hesabım':'Hesap');const scroller=dialog.querySelector('.account-body');if(scroller)scroller.scrollTop=0;message('');renderNav();},panel:()=>current};
}
