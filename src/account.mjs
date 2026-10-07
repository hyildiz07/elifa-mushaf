import {GoogleAuthProvider,OAuthProvider,EmailAuthProvider,signInWithPopup,signInWithCredential,signInWithEmailAndPassword,createUserWithEmailAndPassword,signOut,onAuthStateChanged,sendPasswordResetEmail,sendEmailVerification,reauthenticateWithCredential,reauthenticateWithPopup,applyActionCode,verifyPasswordResetCode,confirmPasswordReset,reload,linkWithPopup,linkWithCredential} from 'firebase/auth';
import {auth,isLocal} from './firebase-client.mjs';
import './firebase-public.mjs';
import {collectBackup,validateBackup,restoreBackup,recoverPendingRestore,mergeBackups,PREVIOUS_KEY,BACKUP_KEYS,SYNC_BASE_PREFIX,SYNC_ENABLED_PREFIX} from './account-data.mjs';
import {accountLanguage,accountText,localizeAccountTree} from './account-i18n.mjs';
const dialog=document.getElementById('accountDialog'),$=id=>document.getElementById(id);
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
 $('accountSave').disabled=busy||!user?.emailVerified||!$('accountCloudConsent').checked;
 $('accountSyncNow').disabled=busy||syncRunning||!user?.emailVerified||!$('accountSyncEnabled').checked;
}
function setBusy(v){busy=v;dialog.setAttribute('aria-busy',String(v));dialog.querySelectorAll('button,input').forEach(n=>{if(n.id!=='accountClose')n.disabled=v;});if(!v){$('accountSyncEnabled').disabled=!user?.emailVerified;availability();}}
async function action(work){if(busy)return;setBusy(true);message('İşlem sürüyor…');try{await work();}catch(e){message(errorText(e),true);}finally{setBusy(false);}}
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
 $('accountSyncEnabled').checked=!!user&&localStorage.getItem(SYNC_ENABLED_PREFIX+user.uid)==='1';
 $('accountSyncEnabled').disabled=!user?.emailVerified;
 $('accountHomeLabel').textContent=user?'Hesabım':'Giriş / Kayıt';
 $('accountHomeCompact').textContent=user?'Hesap':'Giriş';
 $('accountHome').setAttribute('aria-label',user?'Hesabım ve bulut yedekleri':'Giriş yap veya kayıt ol');
 $('accountSettingsLabel').textContent=user?'Hesabım':'Giriş yap / Kaydol';
 $('accountSettingsSub').textContent=user?'Bulut yedekleri ve hesap ayarları':'Kayıtlarını cihazların arasında taşı';
 $('accountSettings').setAttribute('aria-label',user?'Hesabım ve bulut yedekleri':'Giriş yap veya kayıt ol');
 $('accountDeviceNote').textContent='Bu cihazdaki kayıtlar giriş ve çıkışta değişmez. Eşitlemeyi açarsan kayıtlar güvenli biçimde birleştirilir.';
 $('accountVerification').hidden=!user||user.emailVerified;
 const passwordUser=user?.providerData.some(p=>p.providerId==='password');
 $('accountDeletePassword').required=!!passwordUser;$('accountDeletePasswordRow').hidden=!passwordUser;
 $('accountResetPassword').hidden=!passwordUser;
 $('accountLinkGoogle').hidden=!user||user.providerData.some(p=>p.providerId==='google.com');
 availability();
}
function authChanged(next){if(user?.uid!==next?.uid){epoch++;pendingConflict=null;clearTimeout(syncTimer);$('accountConflict').hidden=true;$('accountBackupList').replaceChildren();$('accountBackupCount').textContent='';$('accountBackupStatus').textContent='Henüz kontrol edilmedi.';$('accountCloudConsent').checked=false;$('accountSyncStatus').textContent='Eşitleme kapalı.';$('accountLastSync').textContent='Henüz eşitlenmedi.';}user=next;authReady=true;render();if(next?.emailVerified&&localStorage.getItem(SYNC_ENABLED_PREFIX+next.uid)==='1')scheduleSync(1500);}
async function open(){if(!dialog.open)dialog.showModal();render();if(!authReady)message('Hesap hizmeti hazırlanıyor…');else if(user?.emailVerified)await action(loadBackups);else message(isLocal?'Yerel test ortamı: gerçek kullanıcı hesabı oluşturulmaz.':'Okuma ve dinleme için hesap gerekmiyor.');}
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
 try{await loadBackups();message('Giriş tamamlandı. Eşitleme yalnızca onayınla açılır.');}
 catch(e){$('accountBackupStatus').textContent='Yedek listesi alınamadı.';message('Giriş tamamlandı. Bulut yedeklerine şu an ulaşılamıyor; yeniden dene.',true);}
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
   authChanged(created);
   try{await sendEmailVerification(created,actionSettings());message('Hesabın oluşturuldu. Doğrulama e-postasını kontrol et.');}
   catch{message('Hesabın oluşturuldu; doğrulama e-postası gönderilemedi. Aşağıdan yeniden gönderebilirsin.',true);}
   return;
  }
  await signInWithEmailAndPassword(auth,email,password);await signedIn();
 }finally{$('accountPassword').value='';}
});};
$('accountVerifySend').onclick=()=>action(async()=>{await sendEmailVerification(user,actionSettings());message('Doğrulama e-postası gönderildi.');});
$('accountVerifyRefresh').onclick=()=>action(async()=>{await reload(user);await user.getIdToken(true);authChanged(auth.currentUser);if(user.emailVerified){await loadBackups();message('E-posta doğrulandı.');}else message('Doğrulama henüz tamamlanmamış. E-postadaki bağlantıyı aç.');});
async function api(actionName,extra={}){
 const owner=user?.uid,generation=epoch,current=user;if(!owner)throw Error('Önce giriş yap.');
 const token=await current.getIdToken();
 if(owner!==user?.uid||generation!==epoch)throw Error('Hesap değişti. Yeniden kontrol et.');
 const response=await fetch((window.ELIFA_API_BASE||'')+'/api/account',{method:'POST',credentials:'omit',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({action:actionName,expectedUser:owner,...extra}),signal:AbortSignal.timeout(25000)});
 if(owner!==user?.uid||generation!==epoch)throw Error('Hesap değişti. Yeniden kontrol et.');
 if(!response.headers.get('content-type')?.includes('application/json'))throw Error('Hesap hizmeti henüz yayımlanmamış veya kullanılamıyor.');
 const data=await response.json();if(!response.ok){const error=Error(data.error||'İşlem tamamlanamadı.');error.status=response.status;throw error;}return data;
}
const localSnapshot=()=>collectBackup({getItem:key=>window.elifaReadLocalValue?window.elifaReadLocalValue(key):localStorage.getItem(key)});
const sameData=(a,b)=>JSON.stringify(a?.veri||{})===JSON.stringify(b?.veri||{});
function scheduleSync(delay=1200){clearTimeout(syncTimer);if(!user?.emailVerified||localStorage.getItem(SYNC_ENABLED_PREFIX+user.uid)!=='1')return;syncTimer=setTimeout(()=>{if(!busy&&!syncRunning)syncNow().catch(e=>{$('accountSyncStatus').textContent=errorText(e);});},delay);}
function showConflicts(conflicts){
 pendingConflict=conflicts;const box=$('accountConflict'),list=$('accountConflictList');list.replaceChildren();box.hidden=false;
 for(const c of conflicts){const row=document.createElement('div'),label=document.createElement('span'),local=document.createElement('label'),remote=document.createElement('label'),name='sync-'+c.id.replace(/[^a-z0-9]/gi,'-');
  label.textContent=(c.key==='notes'?'Not':c.key==='set'?'Ayar':c.key==='prog'?'Okuma konumu':c.key)+' '+(c.path||'');
  for(const [container,value,title] of [[local,'local','Bu cihaz'],[remote,'remote','Bulut']]){const input=document.createElement('input');input.type='radio';input.name=name;input.value=value;input.dataset.conflict=c.id;container.append(input,document.createTextNode(title));}
  row.append(label,local,remote);list.append(row);
 }
 $('accountSyncStatus').textContent='Aynı kayıt iki cihazda değişmiş. Hangisi kalsın?';
}
async function syncNow(resolutions={}){
 if(syncRunning||!user?.emailVerified||!$('accountSyncEnabled').checked)return;
 if(!navigator.onLine){$('accountSyncStatus').textContent='Çevrimdışı. Kayıtlar bu cihazda; bağlantı gelince yeniden denenecek.';return;}
 const owner=user.uid,generation=epoch;syncRunning=true;availability();$('accountSyncStatus').textContent='Kayıtlar karşılaştırılıyor…';
 try{
  const before=localSnapshot(),remote=await api('syncGet'),stored=localStorage.getItem(SYNC_BASE_PREFIX+owner),previous=stored?JSON.parse(stored):null,base=remote.revision===0?null:previous;
  if(owner!==user?.uid||generation!==epoch)return;
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
  if(!sameData(before,localSnapshot()))throw Error('Bu cihazdaki kayıtlar işlem sırasında değişti. Yeniden eşitle.');
  if(!sameData(before,payload))restoreBackup(localStorage,payload);
  localStorage.setItem(SYNC_BASE_PREFIX+owner,JSON.stringify({revision,payload}));
  $('accountLastSync').textContent=updated_at?new Date(updated_at).toLocaleString(accountLanguage()):accountText('Şimdi');
  $('accountSyncStatus').textContent='Kayıtlar eşitlendi.';
  if(!sameData(before,payload))location.reload();
 }catch(e){$('accountSyncStatus').textContent=errorText(e);if(/işlem sırasında değişti/.test(e.message||''))scheduleSync(500);throw e;}
 finally{syncRunning=false;availability();}
}
$('accountSyncEnabled').onchange=()=>{
 if(!user)return;const enabled=$('accountSyncEnabled').checked;
 if(enabled){localStorage.setItem(SYNC_ENABLED_PREFIX+user.uid,'1');$('accountSyncStatus').textContent='Eşitleme açıldı. Cihaz ve bulut kayıtları karşılaştırılacak.';scheduleSync(50);}
 else{localStorage.removeItem(SYNC_ENABLED_PREFIX+user.uid);clearTimeout(syncTimer);pendingConflict=null;$('accountConflict').hidden=true;$('accountSyncStatus').textContent='Eşitleme kapalı. Cihaz kayıtları korunuyor.';}
 availability();
};
$('accountSyncNow').onclick=()=>syncNow().catch(()=>{});
$('accountResolve').onclick=()=>{
 if(!pendingConflict)return;const resolutions={};
 for(const c of pendingConflict){const selected=[...$('accountConflictList').querySelectorAll('input:checked')].find(input=>input.dataset.conflict===c.id);if(!selected){message('Her çakışma için cihaz veya bulut kaydını seç.',true);return;}resolutions[c.id]=selected.value;}
 syncNow(resolutions).catch(()=>{});
};
window.addEventListener('online',()=>scheduleSync(200));
window.addEventListener('elifa-data-changed',()=>scheduleSync());
window.addEventListener('storage',e=>{if(BACKUP_KEYS.includes(e.key))scheduleSync();});
async function loadBackups(){
 const {backups}=await api('list'),list=$('accountBackupList');list.replaceChildren();
 $('accountBackupCount').textContent=backups.length?backups.length+accountText(' / 20 yedek'):'Henüz bulut yedeğin yok.';
 $('accountBackupStatus').textContent=backups.length?backups.length+accountText(' tarihli yedek'):'Henüz tarihli yedek yok.';
 for(const backup of backups){
  const row=document.createElement('li'),label=document.createElement('span');label.textContent=new Date(backup.created_at).toLocaleString(accountLanguage());row.append(label);
  const restore=document.createElement('button');restore.type='button';restore.textContent='Bu cihaza aktar';restore.onclick=()=>action(async()=>{
   if(!confirm(accountText('Bu yedek cihazdaki not, işaret, ezber ve ayar kayıtlarının yerine geçecek. Önceki kayıtların geri alma kopyası cihazda korunacak. Devam edilsin mi?'))){message('Aktarım iptal edildi.');return;}
   const {payload}=await api('restore',{id:backup.id});restoreBackup(localStorage,payload);location.reload();
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
 const owner=user?.uid;
 try{
  let appleAuthorizationCode;
  if(user.providerData.some(p=>p.providerId==='password'))await reauthenticateWithCredential(user,EmailAuthProvider.credential(user.email,$('accountDeletePassword').value));
  else if(window.ELIFA_NATIVE_IOS){
   if(user.providerData.some(p=>p.providerId==='apple.com')){const proof=await appleProof();appleAuthorizationCode=proof.authorizationCode;await reauthenticateWithCredential(user,proof.credential);}
   else await reauthenticateWithCredential(user,await googleCredential());
  }else await reauthenticateWithPopup(user,google);
  if(user.uid!==owner)throw Error('Hesap değişti.');
  if(window.ELIFA_NATIVE_IOS&&user.providerData.some(p=>p.providerId==='apple.com')){
   if(!appleAuthorizationCode)appleAuthorizationCode=(await appleProof()).authorizationCode;
   await nativeAuth().revokeApple(appleAuthorizationCode);
  }
  await user.getIdToken(true);await api('deleteAccount',{confirmation:'DELETE'});await signOut(auth);mode='login';authChanged(null);message('Hesap ve bulut yedekleri silindi. Cihazdaki kayıtlar korundu.');
 }finally{$('accountDeletePassword').value='';}
});};
$('accountUndo').onclick=()=>action(async()=>{
 const previous=localStorage.getItem(PREVIOUS_KEY);if(!previous)throw Error('Bu cihazda geri alınabilecek aktarım yok.');
 if(!confirm(accountText('Son aktarım öncesindeki cihaz kayıtlarına dönülecek. Devam edilsin mi?'))){message('Geri alma iptal edildi.');return;}
 const raw=JSON.parse(previous),veri={};for(const k of BACKUP_KEYS)if(raw[k]!==null&&raw[k]!==undefined)veri[k]=raw[k];
 restoreBackup(localStorage,{elifa:'yedek',v:1,veri});location.reload();
});
window.elifaAccount={open};
window.elifaRestoreBackup=payload=>{restoreBackup(localStorage,validateBackup(payload));location.reload();};
window.addEventListener('elifa-storage-error',()=>{$('storageFailure').hidden=false;});
$('storageExport').onclick=()=>{
 try{
  const payload=collectBackup({getItem:key=>window.elifaReadLocalValue(key)});
  const url=URL.createObjectURL(new Blob([JSON.stringify(payload)],{type:'application/json'})),a=document.createElement('a');
  a.href=url;a.download='elifa-kurtarma-yedegi.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }catch(e){alert(accountText('Yedek alınamadı: ')+e.message);}
};
onAuthStateChanged(auth,authChanged,e=>{authReady=true;message(errorText(e),true);availability();});
try{if(recoverPendingRestore(localStorage))location.reload();}catch(e){$('storageFailure').hidden=false;message(e.message,true);}
render();if(window.elifaStorageFailed)$('storageFailure').hidden=false;
(async()=>{
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
