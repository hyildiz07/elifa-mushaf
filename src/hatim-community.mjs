import {secret,dueText,parseHatimLink,participationUrl,recoveryUrl,personalReturnCode,adminUrl,canonicalHatimUrl,loadLocal,createOrgClient} from './hatim-client.mjs';
import {downloadHatimReport} from './hatim-report.mjs';

const $=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const base=()=>window.ELIFA_PUBLIC_BASE||location.origin+'/',session=()=>window.elifaAccountSession,user=()=>session()?.getUser()||null;
const legacyKey='elifa_birlikte_v1',guestKey='elifa_hatim_guest_v2';
let storage;try{storage=window.localStorage;}catch{storage={getItem(){return null;},setItem(){throw Error('Depolama kullanılamıyor');}};}
let owner=user()?.uid||null,key=owner?'elifa_hatim_user_'+owner:guestKey;
let local=loadLocal(storage,key),generation=0,listGeneration=0,tab='open',discover=[],accountItems=[],discoverEnabled=null,loading=false,error='',refreshing=false;
let current=null,createDraft=null,pendingAction=false,dialogIdentity=0,activeAction=null;
const pendingConnectionKey='elifa_hatim_pending_connection_v1';
let pendingConnection=null,pendingConnectionPersisted=false,connectionAttempt=0;
function connectionStore(){return window.sessionStorage;}
function stageConnection(parsed){
 pendingConnection=parsed;pendingConnectionPersisted=false;
 try{const target=connectionStore(),raw=JSON.stringify(parsed);target.setItem(pendingConnectionKey,raw);pendingConnectionPersisted=target.getItem(pendingConnectionKey)===raw;}catch{}
}
function readPendingConnection(){
 try{const value=JSON.parse(connectionStore().getItem(pendingConnectionKey)||'null');if(!value||typeof value!=='object')return null;
  return value.admin?parseHatimLink(adminUrl(base(),value.admin)):value.capability?parseHatimLink(recoveryUrl(base(),value.code,value.no,value.capability)):parseHatimLink(value.code);
 }catch{return null;}
}
function completeConnection(parsed){
 if(!pendingConnection||JSON.stringify(pendingConnection)!==JSON.stringify(parsed))return;
 pendingConnection=null;pendingConnectionPersisted=false;try{connectionStore().removeItem(pendingConnectionKey);}catch{}
}
function sessionReady(){
 if(session()?.isReady?.())return Promise.resolve();
 return new Promise(resolve=>{
  let done=false,unsubscribe;
  const finish=()=>{if(done)return;done=true;unsubscribe?.();window.removeEventListener?.('elifa:account-changed',finish);resolve();};
  window.addEventListener('elifa:account-changed',finish,{once:true});
  if(session()?.onChange){unsubscribe=session().onChange(finish);if(done)unsubscribe?.();}
 });
}
async function resumeConnection(){
 if(!pendingConnection)return;const attempt=++connectionAttempt,p=pendingConnection;
 await sessionReady();if(attempt!==connectionAttempt||pendingConnection!==p)return;
 openTogetherScreen();await openParsed(p);
}
let previewMode=false;
const requestApi=createOrgClient({fetcher:(...a)=>fetch(...a),session,base:window.ELIFA_API_BASE||''});
const previewNotice='Önizleme: Buradaki hatim ve cüzler deneme içindir; canlı kayıtlarını etkilemez.';
function renderPreviewNotice(){for(const id of ['hcHomePreview','hcOrgPreview','hcDialogPreview']){const node=$(id);if(node){node.hidden=!previewMode;node.textContent=previewMode?previewNotice:'';}}}
function previewNote(id){return `<p id="${id}" class="hc-note" role="note" ${previewMode?'':'hidden'}>${previewMode?previewNotice:''}</p>`;}
async function api(payload){const result=await requestApi(payload);if(result.preview===true){previewMode=true;renderPreviewNotice();}return result;}
function save(required=false){try{const raw=JSON.stringify(local);storage.setItem(key,raw);if(storage.getItem(key)!==raw)throw Error('Kayıt doğrulanamadı');return true;}catch{if(required)throw Error('Bu tarayıcı kayıt saklayamıyor. Katılım anahtarını korumak için depolamaya izin verip yeniden dene.');return false;}}
// Copy old guest records once. The old copy remains available and is never
// treated as proof that a visitor owns an existing server-side cüz.
if(!owner){try{if(!storage.getItem(guestKey)){local=loadLocal(storage,legacyKey);save();}}catch{}}
function capabilities(code){const out={...local.capabilities[code]};for(const [no,item]of Object.entries(local.pendingClaims[code]||{}))out[no]=item.token;return out;}
function assertActionContext(){
 if((user()?.uid||null)!==owner)throw Error('Hesap hazırlanıyor. İşlemi güncel hesapla yeniden aç.');
 if(activeAction&&(activeAction.owner!==owner||activeAction.generation!==generation||activeAction.current!==current||activeAction.dialog!==dialogIdentity||!$('hatimDialog').open))throw Error('Ekran veya hesap değişti. İşlemin güncel durumunu yenileyerek kontrol et.');
}
function retainPending(code){if(!local.mine.some(m=>m.code===code))local.mine.unshift({code,title:current?.code===code?current.org.title:'Katılım doğrulanıyor',type:'hatim',pending:true});}
function adminToken(code){return local.mine.find(x=>x.code===code)?.adminToken||null;}
function payload(action,code,extra={}){if((user()?.uid||null)!==owner)throw Error('Hesap hazırlanıyor. İşlemi güncel hesapla yeniden aç.');return {action,code,capabilities:capabilities(code),...(adminToken(code)?{admin:adminToken(code)}:{}),...extra};}
function remember(org,token){
 if(!org||!/^[a-z0-9]{6}$/.test(org.code||''))throw Error('Hatim kaydının kodu doğrulanamadı.');
 const existing=local.mine.find(x=>x.code===org.code),mine=(org.items||[]).filter(x=>x.mine);
 if(!existing&&!org.isAdmin&&!mine.length&&!Object.keys(local.pendingClaims[org.code]||{}).length)return;
 const record={...existing,code:org.code,title:org.title,type:org.type,pending:false};
 if(org.isAdmin&&token)record.adminToken=token;else if(!org.isAdmin)delete record.adminToken;
 for(const [no,item]of Object.entries(local.pendingClaims[org.code]||{})){
  const actual=(org.items||[]).find(i=>i.no===+no);
  if(actual?.mine){local.capabilities[org.code]={...local.capabilities[org.code],[no]:item.token};delete local.pendingClaims[org.code][no];}
  else if(actual&&actual.status!=='bos')delete local.pendingClaims[org.code][no];
 }
 for(const no of Object.keys(local.capabilities[org.code]||{}))if(!(org.items||[]).some(i=>i.no===+no&&i.mine))delete local.capabilities[org.code][no];
 record.pending=Object.keys(local.pendingClaims[org.code]||{}).length>0;
 local.mine=[record,...local.mine.filter(x=>x.code!==org.code)];
 local.snapshots[org.code]={title:org.title,type:org.type,isAdmin:org.isAdmin,archived:org.archived,items:mine,updatedAt:Date.now()};
 local.claimed[org.code]=mine.filter(x=>x.status==='alindi').map(x=>x.no);save();payButton();
}
function payButton(){const b=$('mainPayBtn');if(b)b.style.display=Object.values(local.claimed).some(v=>Array.isArray(v)&&v.length)?'flex':'none';}
function flash(message){if(typeof window.toast==='function')window.toast(message);else $('hatimStatus').textContent=message;}
function on(el,event,handler){el?.addEventListener(event,handler);}
function button(label,action,cls=''){return `<button type="button" class="hc-button ${cls}" data-hc="${action}">${label}</button>`;}
function dialog(title,body,actions=[]){
 const d=$('hatimDialog');if(d.open)d.close();const identity=++dialogIdentity,context={owner,generation,current,dialog:identity};
 d.innerHTML=`<form method="dialog"><header><h2>${esc(title)}</h2><button class="hc-close" value="cancel" aria-label="Kapat">×</button></header></form><div class="hc-dialog-body">${previewNote('hcDialogPreview')}${body}<p id="hcError" class="hc-error" role="alert"></p></div><footer>${actions.map(a=>button(a.label,a.id,a.primary?'primary':'')).join('')}</footer>`;
 for(const a of actions)on(d.querySelector('[data-hc="'+a.id+'"]'),'click',async e=>{
  const b=e.currentTarget;if(pendingAction)return;pendingAction=true;activeAction=context;b.disabled=true;
  try{assertActionContext();$('hcError').textContent='';await a.run();}
  catch(err){if(identity===dialogIdentity&&d.open)$('hcError').textContent=err.message;}
  finally{if(activeAction===context)activeAction=null;pendingAction=false;b.disabled=false;}
 });
 d.showModal();return d;
}
function closeDialog(){if($('hatimDialog').open)$('hatimDialog').close();}
function updateAddress(code=null){if(pendingConnection&&!pendingConnectionPersisted)return;const url=canonicalHatimUrl(location.href,code);if(url!==location.href)history.replaceState(history.state,'',url);}
function leaveHatimDetail(screen){
 if(screen!=='home'&&screen!=='birlikte')return;
 closeDialog();dialogIdentity++;generation++;listGeneration++;clearInterval(window.bkRefreshTimer);current=null;window.bkCurrent=null;updateAddress();
}
async function copy(value,label='Bağlantı'){const scope={owner,generation,dialog:dialogIdentity};const valid=()=>scope.owner===owner&&scope.generation===generation&&scope.dialog===dialogIdentity;try{await navigator.clipboard.writeText(value);if(valid())flash(label+' kopyalandı.');}catch{if(valid())dialog(label+' · seçip kopyala',`<textarea readonly class="hc-link" aria-label="${esc(label)}">${esc(value)}</textarea><p>Yukarıdaki bilgiyi seçip kopyalayabilirsin.</p>`);}}
async function share(code,title){const url=participationUrl(base(),code);if(navigator.share){try{await navigator.share({title:'Birlikte Hatim',text:title,url});return;}catch(e){if(e.name==='AbortError')return;}}await copy(url);}
function accountOpen(){if(window.elifaAccount?.open){window.elifaAccount.open();return;}document.querySelector('[data-account-open]')?.click();const d=$('accountDialog');if(d&&!d.open)d.showModal();}
function home(){
 const holder=$('birlikte');if(!holder)return;
 holder.innerHTML=`<div class="hc-home"><button type="button" class="hc-button hc-home-back" data-hc="home-back">‹ Elifa</button><header class="hc-top"><div><small>BİRLİKTE</small><h1>Hatimde buluşalım</h1><p>Bir cüz seç, ortak niyete katıl.</p></div><span aria-hidden="true" class="hc-emblem">ا</span></header>${previewNote('hcHomePreview')}<div class="hc-main-actions">${button('＋ Hatim oluştur','create','primary')}${button('Bağlantıyla katıl','join')}</div><div class="hc-return-entry"><button type="button" class="hc-text" data-hc="return-entry">↩ Cüzüme geri dön</button><span>Aynı cihazda Benim Cüzlerim; başka cihazda özel kodun.</span></div><nav class="hc-tabs" aria-label="Hatim bölümleri">${[['open','Açık Hatimler'],['mine','Benim Cüzlerim'],['created','Oluşturduklarım']].map(([id,name])=>`<button type="button" data-tab="${id}" aria-pressed="${id===tab}">${name}</button>`).join('')}</nav><div id="hatimStatus" role="status" aria-live="polite"></div><div id="hatimList"></div></div>`;
 on(holder.querySelector('[data-hc=home-back]'),'click',()=>{closeDialog();clearInterval(window.bkRefreshTimer);backFromTogether();});on(holder.querySelector('[data-hc=create]'),'click',showCreate);on(holder.querySelector('[data-hc=join]'),'click',showJoin);on(holder.querySelector('[data-hc=return-entry]'),'click',showReturnEntry);
 holder.querySelectorAll('[data-tab]').forEach(b=>on(b,'click',()=>{tab=b.dataset.tab;renderBirlikte();}));renderList();
}
function card(o){const total=o.total||30,done=o.done??o.items?.filter(x=>x.status==='okundu').length??0,available=o.available??Math.max(0,total-(o.taken||0));return `<article class="hc-card"><div><h2>${esc(o.title)}</h2><p>${done}/${total} cüz okundu · ${available} boş cüz</p>${dueText(o.dueDate)?`<small>${esc(dueText(o.dueDate))}</small>`:''}<progress value="${done}" max="${total}" aria-label="${done}/${total} cüz okundu"></progress></div><button class="hc-button" data-open="${esc(o.code)}">${available?'Cüz seç':'Görüntüle'}</button></article>`;}
function renderList(){
 const list=$('hatimList');if(!list)return;
 renderPreviewNotice();
 $('hatimStatus').textContent=loading?'Güncel bilgiler alınıyor…':error;
 if(tab==='open'){
  if(loading)list.innerHTML='<div class="hc-empty"><h2>Açık hatimler yükleniyor</h2><p>Güncel liste kontrol ediliyor…</p></div>';
  else if(error)list.innerHTML='<div class="hc-empty"><h2>Açık hatimler şu an alınamadı</h2><p>Bu, listenin kapalı olduğu anlamına gelmez. Yeniden deneyebilir veya sana gönderilen bağlantıyla katılabilirsin.</p>'+button('Yeniden dene','discover-retry')+'</div>';
  else if(discoverEnabled===null)list.innerHTML='<div class="hc-empty"><h2>Açık hatim durumu henüz doğrulanmadı</h2><p>Güncel listeyi kontrol etmek için yeniden dene.</p>'+button('Yeniden dene','discover-retry')+'</div>';
  else list.innerHTML=discoverEnabled&&discover.length?discover.map(card).join(''):`<div class="hc-empty"><h2>${discoverEnabled?'Henüz açık hatim yok':'Bir bağlantıyla da katılabilirsin'}</h2><p>${discoverEnabled?'İlk hatmi sen başlatabilirsin.':'Açık hatim listesi şu an kapalı. Sana gönderilen bağlantıyla katılabilir veya özel bir hatim oluşturabilirsin.'}</p></div>`;
 }else{
  const records=new Map(local.mine.filter(x=>x.type==='hatim').map(m=>[m.code,{...m,...local.snapshots[m.code],localOnly:true}]));
  for(const m of accountItems)if(m.type==='hatim')records.set(m.code,{...records.get(m.code),...m,localOnly:false});
  const rows=[...records.values()].filter(m=>tab==='created'?(m.isAdmin||m.adminToken):((m.items||[]).length||local.claimed[m.code]?.length||Object.keys(capabilities(m.code)).length));
  list.innerHTML=(tab==='mine'?'<div class="hc-return-row"><p>Aynı cihazda cüzünü aşağıdan aç. Kayıt görünmüyorsa özel dönüş kodunu kullan.</p>'+button('Cüzüme geri dön','return-entry')+'</div>':'')+(!user()?'<p class="hc-note">Misafir kayıtları bu cihazda tutulur. Cihaz verileri silinirse özel dönüş bağlantın gerekir. <button class="hc-text" data-hc="account">Hesaba giriş yap</button></p>':'')+rows.map(m=>`<article class="hc-card"><div><h2>${esc(m.title)}</h2><p>${tab==='created'?(m.archived?'Arşivde':'Yönetici sensin'):(m.items||[]).map(i=>i.no+'. cüz · '+(i.status==='okundu'?'Okudum ✓':'Okunacak')).join(' / ')||(m.pending?'Katılım sonucu doğrulanmadı · açıp kontrol et':'Eski katılım · yönetici dönüş bağlantısı gerekli')}</p>${m.localOnly?'<small>Cihaz kaydı · açınca güncellenir</small>':''}</div><button class="hc-button" data-open="${esc(m.code)}">Aç</button></article>`).join('')+(!rows.length?'<div class="hc-empty"><h2>'+ (tab==='created'?'Henüz hatim oluşturmadın':'Henüz cüz seçmedin')+'</h2><p>Açık hatimlerden veya sana gönderilen bağlantıdan başlayabilirsin.</p></div>':'');
  if(user()){let guest;try{guest=loadLocal(storage,guestKey);}catch{}if(guest&&(Object.values(guest.capabilities).some(x=>Object.keys(x).length)||Object.values(guest.pendingClaims).some(x=>Object.keys(x).length)||guest.mine.some(x=>x.adminToken)))list.innerHTML+='<div class="hc-note"><b>Bu cihazda misafir katılımları var.</b><p>Sana ait olanları seçerek hesabına bağlayabilirsin.</p>'+button('Misafir katılımlarımı göster','bind-list')+'</div>';}
 }
 list.querySelectorAll('[data-open]').forEach(b=>on(b,'click',()=>bkOpen(b.dataset.open)));
 on(list.querySelector('[data-hc=return-entry]'),'click',showReturnEntry);on(list.querySelector('[data-hc=discover-retry]'),'click',renderBirlikte);on(list.querySelector('[data-hc=account]'),'click',accountOpen);on(list.querySelector('[data-hc=bind-list]'),'click',showGuestBindings);
}
async function renderBirlikte(){
 const ticket=++listGeneration;home();loading=true;error='';renderList();
 try{
  if(tab==='open'){const d=await api({action:'discoverList'});if(ticket!==listGeneration)return;if(typeof d.enabled!=='boolean'||(d.enabled&&!Array.isArray(d.items)))throw Error('Açık hatim listesi yanıtı doğrulanamadı. Yeniden dene.');discoverEnabled=d.enabled;discover=(d.items||[]).filter(x=>x.type==='hatim');}
  else if(user()){let items=[],cursor;const seen=new Set();do{if(seen.has(cursor))throw Error('Katılım listesi tamamlanamadı. Yeniden dene.');seen.add(cursor);const d=await api({action:'myList',...(cursor==null?{}:{cursor})});if(ticket!==listGeneration)return;if(!Array.isArray(d.items))throw Error('Katılım listesi yanıtı geçersiz.');items.push(...d.items);cursor=d.nextCursor;}while(cursor!=null);accountItems=items;}
 }catch(e){if(ticket===listGeneration)error=e.message;}
 finally{if(ticket===listGeneration){loading=false;renderList();}}
}
function showJoin(){dialog('Bağlantıyla katıl','<p class="hc-note">Yeni bir hatme katılmak içindir. Daha önce aldığın cüze dönmek için “Cüzüme geri dön”ü kullan.</p><label class="hc-field">Katılım bağlantısı veya 6 haneli hatim kodu<input id="hcJoin" autocomplete="off" placeholder="Bağlantıyı yapıştır veya 6 haneli kodu yaz"></label>',[{id:'join',label:'Hatmi aç',primary:true,run:async()=>{const parsed=parseHatimLink($('hcJoin').value,base());if(!parsed)throw Error('Geçerli bir hatim bağlantısı veya kodu yaz.');stageConnection(parsed);closeDialog();await resumeConnection();}}]);}
function showReturnEntry(){
 dialog('Cüzüme geri dön','<ol class="hc-return-steps"><li><b>Aynı cihaz:</b> Benim Cüzlerim sekmesinden cüzünü aç.</li><li><b>Başka cihaz / uygulama:</b> Özel dönüş kodunu yaz veya kişisel bağlantını yapıştır.</li><li><b>Hesaba bağlıysa:</b> Önce cüzü aldığın hesapla giriş yap. Kod tek başına hesabın yerine geçmez.</li></ol><label class="hc-field">Özel dönüş kodu veya kişisel bağlantı<textarea id="hcReturnInput" class="hc-return-input" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="C1-… veya kişisel dönüş bağlantın"></textarea></label><p class="hc-note">Bu bilgi sana özeldir. Genel hatim kodu yalnız yeni katılım içindir; cüzünü geri açmaz.</p>',[
  {id:'return-open',label:'Cüzümü aç',primary:true,run:async()=>{
   const parsed=parseHatimLink($('hcReturnInput').value,base());
   if(!parsed)throw Error('Özel dönüş kodunu veya kişisel bağlantını eksiksiz gir.');
   if(!parsed.capability)throw Error('Bu genel katılım veya yönetici bilgisi. Cüzüne dönmek için sana özel C1 dönüş kodunu ya da kişisel bağlantını kullan.');
   stageConnection(parsed);closeDialog();await resumeConnection();
  }},
  {id:'my-juz',label:'Benim Cüzlerim',run:async()=>{closeDialog();tab='mine';openTogetherScreen();await renderBirlikte();}}
 ]);
}

async function openParsed(p){
 if(p.capability){
  dialog('Kişisel cüz bağlantısı',`<p>${p.no}. cüzün kişisel dönüş bağlantısı açılıyor. Bu bağlantı cüzü yönetme yetkisi verir; başkalarıyla paylaşma.</p>`,[{id:'recover',label:'Cüzümü aç',primary:true,run:async()=>{const d=await api({action:'get',code:p.code,capabilities:{[p.no]:p.capability}});assertActionContext();const it=d.org.items.find(x=>x.no===p.no);if(!it?.mine)throw Error('Bu bağlantı artık geçerli değil veya katılım bir hesaba bağlanmış. Hesabına giriş yap ya da yöneticiye başvur.');local.capabilities[p.code]={...capabilities(p.code),[p.no]:p.capability};save(true);remember(d.org);save(true);completeConnection(p);closeDialog();await bkOpen(p.code);}}]);return;
 }
 await bkOpen(p.code,p.admin);
}
async function bkOpen(code,admin,navOpts={}){
 closeDialog();dialogIdentity++;const ticket=++generation;clearInterval(window.bkRefreshTimer);current=null;window.bkCurrent=null;
 show('org');if(!navOpts.fromHistory&&typeof setElifaRoute==='function')setElifaRoute('org',navOpts.replace?'replace':'push');
 $('orgView').innerHTML='<p class="hc-empty" role="status">Hatim açılıyor…</p>';
 try{
  const d=await api(payload('get',code,{...(admin?{admin}:{})}));if(ticket!==generation)return;
  if(admin&&!d.org.isAdmin)throw Error('Yönetici bağlantısı doğrulanamadı. Özel bağlantını kontrol et.');
  current={org:d.org,code:d.code,adminToken:admin||adminToken(d.code),ticket};window.bkCurrent=current;
  remember(d.org,admin);
  const pending=pendingConnection;
  if(pending&&!pending.capability&&((pending.admin&&pending.admin===admin&&d.org.isAdmin)||(!pending.admin&&pending.code===d.code))){
   let retained=!pending.admin;try{if(pending.admin)retained=save(true);}catch{}
   if(retained)completeConnection(pending);
  }
  updateAddress(d.code);
  renderOrg();window.bkRefreshTimer=setInterval(bkSilentRefresh,60000);return true;
 }catch(e){if(ticket===generation){$('orgView').innerHTML=`${previewNote('hcOrgPreview')}<div class="hc-empty" role="alert"><p>${esc(e.message)}</p>${button('Yeniden dene','retry')}</div>`;on($('orgView').querySelector('[data-hc=retry]'),'click',()=>bkOpen(code,admin,{fromHistory:true}));}}
}
async function bkSilentRefresh(){
 const c=current;if(!c||refreshing||document.hidden||!$('org').classList.contains('on')||$('hatimDialog').open||pendingAction)return;
 refreshing=true;try{const d=await api(payload('get',c.code,{...(c.adminToken?{admin:c.adminToken}:{})}));if(current===c&&c.ticket===generation){current.org=d.org;remember(d.org,c.adminToken);renderOrg();}}
 catch(e){if(current===c){const hint=$('hcRefreshState');if(hint)hint.textContent='Bilgiler yenilenemedi. '+e.message;}}finally{refreshing=false;}
}
async function mutate(action,no,extra={}){
 assertActionContext();const c=current,requestOwner=owner;if(!c)throw Error('Önce hatmi aç.');
 const d=await api(payload(action,c.code,{...(c.adminToken?{admin:c.adminToken}:{}),...(no?{no,capability:capabilities(c.code)[no]}:{}),...extra}));
 assertActionContext();if(owner!==requestOwner||current!==c||generation!==c.ticket)throw Error('Hatim değişti. Güncel durumunu yenileyerek kontrol et.');remember(d.org,c.adminToken);if(current===c&&generation===c.ticket){current.org=d.org;renderOrg();}return d;
}
function renderOrg(){
 const c=current;if(!c)return;const o=c.org,items=o.items||[],done=items.filter(x=>x.status==='okundu').length,available=items.filter(x=>x.status==='bos').length;
 if(o.type!=='hatim'){renderLegacy(o);return;}
 $('orgView').innerHTML=`<div class="hc-detail">${previewNote('hcOrgPreview')}<header class="hc-detail-head"><small>${o.fullHatim?'BİRLİKTE HATİM':'CÜZ ÇALIŞMASI'}${o.archived?' · ARŞİV':''}</small><h1>${esc(o.title)}</h1><p>${esc(o.adminName||'')}${o.dueDate?' · '+esc(dueText(o.dueDate)):''}</p></header><div class="hc-summary"><b>${done}<span> / ${items.length} okundu</span></b><span>${available} boş cüz</span><progress value="${done}" max="${items.length}" aria-label="Okunan cüzler"></progress></div>${o.complete?'<p class="hc-success">'+(o.fullHatim?'Hatim tamamlandı.':'Cüz çalışması tamamlandı.')+' Allah kabul etsin.</p>':''}${o.archived?'<p class="hc-note">Bu çalışma arşivde. Kayıtlar korunur; yeni cüz almak için yönetici yeniden açabilir.</p>':''}<div class="hc-detail-actions">${button('Katılım bağlantısını paylaş','share')}${button('Yenile','refresh')}${o.isAdmin?button('Yönet','manage'):''}</div><p class="hc-note">Boş bir cüz seçebilirsin. Okumak veya dinlemek, cüzü kendiliğinden “Okudum” yapmaz.</p><div class="hc-grid">${items.map(i=>`<button type="button" class="hc-juz ${i.mine?'mine ':''}${i.status}" data-cuz="${i.no}" aria-label="${i.no}. cüz, ${i.mine?'Bende, ':''}${i.status==='bos'?'Boş':i.status==='okundu'?'Okundu':'Alındı'}${i.name?', '+esc(i.name):''}"><b>${i.no}</b><span>${i.status==='bos'?'Boş':i.status==='okundu'?'Okundu ✓':i.mine?'Bende':'Alındı'}</span>${i.name?`<small>${esc(i.name)}</small>`:''}</button>`).join('')}</div><p id="hcRefreshState" class="hc-note" role="status">${user()?'Hesabına bağlı katılımlar diğer cihazlarda da görünür.':'Misafirsen kişisel dönüş bağlantını sakla.'}</p></div>`;
 on($('orgView').querySelector('[data-hc=share]'),'click',()=>share(c.code,o.title));on($('orgView').querySelector('[data-hc=refresh]'),'click',bkSilentRefresh);on($('orgView').querySelector('[data-hc=manage]'),'click',showManage);
 $('orgView').querySelectorAll('[data-cuz]').forEach(b=>on(b,'click',()=>showJuz(Number(b.dataset.cuz))));
}
function showJuz(no){
 const c=current,i=c?.org.items.find(x=>x.no===no);if(!i)return;
 if(i.status==='bos'){if(c.org.archived)return flash('Bu çalışma arşivde.');showClaim(no);return;}
 const actions=[{id:'read',label:'Okumaya başla',primary:true,run:async()=>{closeDialog();await gotoPage(JUZ_PAGE[no-1],{returnTo:'org'});}}];
 if(i.mine){
  actions.push({id:'done',label:i.status==='okundu'?'Okudum işaretini geri al':'Okudum ✓',run:async()=>{await mutate(i.status==='okundu'?'undo':'complete',no);closeDialog();}});
  actions.push({id:'release',label:'Cüzü bırak',run:()=>confirmRelease(no)});
  if(capabilities(c.code)[no])actions.push({id:'return',label:'Özel dönüş kodum / bağlantım',run:()=>showRecovery(c.code,no,capabilities(c.code)[no],!!user())});
 }else actions.push({id:'close',label:'Kapat',run:closeDialog});
 dialog(no+'. cüz',`<p>${esc(i.name||'Katılımcı')} · ${i.status==='okundu'?'Okundu':'Alındı'}</p>${!i.mine?'<p>Bu cüzü yalnız sahibi yönetebilir.'+(i.legacy?' Eski katılımınsa yöneticiden kişisel dönüş bağlantısı iste.':'')+'</p>':''}`,actions);
}
function confirmRelease(no){const c=current;dialog('Cüzü bırak',`<p>${no}. cüz yeniden seçilebilir olacak. Mevcut kişisel dönüş bağlantısının yetkisi sona erecek.</p>`,[{id:'release',label:'Evet, cüzü bırak',primary:true,run:async()=>{await mutate('release',no);delete local.capabilities[c.code]?.[no];delete local.pendingClaims[c.code]?.[no];save();closeDialog();}},{id:'cancel',label:'Vazgeç',run:closeDialog}]);}
function showClaim(no){
 const c=current,guest=!user();
 dialog(no+'. cüzü al',`<label class="hc-field">Görünen ad veya takma ad<input id="hcName" minlength="2" maxlength="60" value="${esc(user()?.displayName||local.myName)}" autocomplete="nickname"></label><p class="hc-note">Bu ad hatimde cüzünün altında görünür. Gerçek ad kullanmak zorunda değilsin.</p>${guest?'<div class="hc-warning">Hesapsız katılıyorsun. Bu cihazın verileri silinirse erişimini kaybedebilirsin. Katılımdan sonra kişisel dönüş bağlantını sakla; daha sonra hesabına da bağlayabilirsin.</div>':''}`,[{id:'claim',label:'Bu cüzü al',primary:true,run:async()=>{
  const name=$('hcName').value.trim();if(name.length<2||name.length>60)throw Error('2–60 karakterlik ad veya takma ad yaz.');if(current!==c)throw Error('Hatim değişti. Cüzü yeniden seç.');
  const token=local.pendingClaims[c.code]?.[no]?.token||secret(crypto);local.pendingClaims[c.code]={...local.pendingClaims[c.code],[no]:{token,name,createdAt:Date.now()}};local.myName=name;retainPending(c.code);save(true);
  try{await mutate('claim',no,{name,capability:token});closeDialog();showRecovery(c.code,no,token,!!user());}catch(e){if(e.status===409){delete local.pendingClaims[c.code]?.[no];save();}throw e;}
 }},{id:'cancel',label:'Vazgeç',run:closeDialog}]);
}
function showRecovery(code,no,token,accountBound=false,forParticipant=false){
 const link=recoveryUrl(base(),code,no,token);let returnCode=null,preparing=false;
 dialog(forParticipant?'Katılımcıya özel dönüş bilgisi':no+'. cüz sende',
  '<p class="hc-warning">'+(forParticipant?'Bu kod ve bağlantıyı yalnız cüzün gerçek sahibine ilet. Genel hatim grubuna gönderme.':accountBound?'Bu cüz hesabına bağlı. Diğer cihazda aynı hesapla giriş yap; özel kod tek başına hesabının yerine geçmez.':'Bu kod ve bağlantı cüzünü yönetir. Yalnız kendin için sakla; katılım bağlantısı olarak paylaşma.')+'</p><ol class="hc-return-steps"><li><b>Aynı cihazda</b> Birlikte → Benim Cüzlerim.</li><li><b>Uygulamada</b> Birlikte → Cüzüme geri dön → özel kodu gir.</li><li><b>Web’de</b> kişisel bağlantını aç; ardından Cüzümü aç’a dokun.</li></ol><div class="hc-return-code"><label for="hcPersonalCode">Özel dönüş kodu</label><textarea id="hcPersonalCode" readonly rows="2" aria-describedby="hcReturnStatus" placeholder="Kod hazırlanıyor…"></textarea><small id="hcReturnStatus" role="status" aria-live="polite">Özel kod hazırlanıyor. Bağlantını hemen kopyalayabilirsin.</small></div><details class="hc-private-link"><summary>Kişisel web bağlantısını göster</summary><textarea readonly class="hc-link" aria-label="Kişisel dönüş bağlantısı">'+esc(link)+'</textarea></details>',[
   {id:'copy-code',label:'Özel kodu kopyala',primary:true,run:()=>{if(!returnCode)throw Error('Özel kod henüz hazır değil. Kodu yeniden hazırla veya kişisel bağlantını kopyala.');return copy(returnCode,'Özel dönüş kodu');}},
   {id:'copy',label:'Kişisel bağlantıyı kopyala',run:()=>copy(link,'Kişisel bağlantı')},
   {id:'return-retry',label:'Kodu yeniden hazırla',run:()=>prepareCode()},
   {id:'ok',label:'Tamam',run:closeDialog}
  ]);
 const scope={owner,generation,dialog:dialogIdentity},stillHere=()=>scope.owner===owner&&scope.generation===generation&&scope.dialog===dialogIdentity&&$('hatimDialog').open;
 const prepareCode=async()=>{
  if(preparing||!stillHere())return;preparing=true;
  const copyButton=$('hatimDialog').querySelector('[data-hc="copy-code"]'),retry=$('hatimDialog').querySelector('[data-hc="return-retry"]');
  if(copyButton)copyButton.disabled=true;if(retry)retry.hidden=true;
  $('hcReturnStatus').textContent='Özel kod hazırlanıyor. Bağlantını hemen kopyalayabilirsin.';
  try{const data=await api(payload('returnCode',code,{no,capability:token}));if(!stillHere())return;
   returnCode=personalReturnCode(code,no,data.returnKey);$('hcPersonalCode').value=returnCode;$('hcReturnStatus').textContent='Kodu güvenli bir yere kaydet. Boşlukları ve çizgileri yazmadan da girebilirsin.';if(copyButton)copyButton.disabled=false;
  }catch(e){if(stillHere()){$('hcReturnStatus').textContent='Özel kod hazırlanamadı. Yeniden deneyebilir veya kişisel bağlantını kullanabilirsin.';if(retry)retry.hidden=false;}}
  finally{preparing=false;}
 };
 prepareCode();
}

function showCreate(){
 let visibilityStatus='loading',visibilityEnabled=null;
 createDraft=local.creation||{token:secret(crypto),title:'',name:user()?.displayName||local.myName,dueDate:'',public:false};
 dialog('Hatim oluştur',`<p class="hc-note">30 cüzlük bir hatim başlat. Katılımcılar hesap açmadan da cüz seçebilir.</p>${!user()?'<p class="hc-warning">Hesapsız oluşturuyorsun. Cihaz verileri silinirse yönetici erişimini kaybedebilirsin. Oluşturma sonunda özel yönetici bağlantını sakla.</p>':''}<label class="hc-field">Hatmin adı / niyeti<input id="hcTitle" maxlength="120" value="${esc(createDraft.title)}" placeholder="Örn. Ailemizin haftalık hatmi"></label><label class="hc-field">Yönetici görünen adı<input id="hcAdminName" maxlength="60" value="${esc(createDraft.name)}" placeholder="Ad veya takma ad"></label><label class="hc-field">Hedef tarih · isteğe bağlı<input type="date" id="hcDue" value="${esc(createDraft.dueDate)}"></label><fieldset class="hc-visibility"><legend>Kimler katılabilsin?</legend><div id="hcVisibilityOptions" aria-live="polite"><p>Katılım seçenekleri kontrol ediliyor…</p></div></fieldset>`,[{id:'create',label:'Hatmi oluştur',primary:true,run:async()=>{
  if(createDraft.public&&visibilityEnabled!==true)throw Error('Önceki açık hatim isteğini güvenle sürdürmek için katılım seçeneklerinin doğrulanmasını bekle veya yeniden dene.');
  const form={title:$('hcTitle').value.trim(),name:$('hcAdminName').value.trim(),dueDate:$('hcDue').value,public:!!document.querySelector('input[name=hcVisibility][value=public]:checked')};if(!form.title)throw Error('Hatme bir ad ver.');
  const signature=JSON.stringify(form);if(createDraft.signature&&createDraft.signature!==signature)createDraft.token=secret(crypto);
  createDraft={...createDraft,...form,signature};local.creation=createDraft;save(true);
  const d=await api({action:'create',creationToken:createDraft.token,org:{type:'hatim',title:form.title,adminName:form.name,dueDate:form.dueDate||null,public:form.public,items:Array.from({length:30},(_,i)=>({no:i+1}))}});
  assertActionContext();remember(d.org,d.adminToken);local.creation=null;save();closeDialog();await bkOpen(d.code,d.adminToken);showAdminBackup(d.code,d.adminToken);
 }},{id:'cancel',label:'Vazgeç',run:closeDialog}]);
 const scope={owner,generation,dialog:dialogIdentity};
 const visibilityCurrent=()=>scope.owner===owner&&scope.generation===generation&&scope.dialog===dialogIdentity&&$('hatimDialog').open;
 const renderVisibility=()=>{
  if(!visibilityCurrent())return;
  $('hcVisibilityOptions').innerHTML='<label><input type="radio" name="hcVisibility" value="private" '+(!createDraft.public?'checked':'')+'> Bağlantıya sahip olanlar</label>'+(visibilityStatus==='ready'&&visibilityEnabled?'<label><input type="radio" name="hcVisibility" value="public" '+(createDraft.public?'checked':'')+'> Uygulamadaki herkes</label>':'')+(visibilityStatus==='loading'?'<small>Uygulamadaki herkese açma seçeneği kontrol ediliyor…</small>':visibilityStatus==='error'?'<small>Açık katılım durumu doğrulanamadı. Bağlantıyla katılım seçeneği kullanılabilir.</small><button type="button" class="hc-text" id="hcVisibilityRetry">Yeniden dene</button>':visibilityEnabled?'':'<small>Açık hatim listesi şu an kapalı.</small>');
  on($('hcVisibilityRetry'),'click',loadVisibility);
 };
 const loadVisibility=async()=>{
  visibilityStatus='loading';visibilityEnabled=null;renderVisibility();
  try{const d=await api({action:'discoverConfig'});if(!visibilityCurrent())return;if(typeof d.enabled!=='boolean')throw Error('Katılım seçenekleri doğrulanamadı.');visibilityEnabled=d.enabled;discoverEnabled=d.enabled;visibilityStatus='ready';}
  catch{if(!visibilityCurrent())return;visibilityStatus='error';}
  renderVisibility();
 };
 loadVisibility();
}
function showAdminBackup(code,token){const link=adminUrl(base(),token);dialog('Hatmin hazır',`<p>Katılım bağlantısını istediğin kişilerle paylaşabilirsin. Aşağıdaki <b>yönetici bağlantısı sana özeldir</b>; ayrı sakla.</p><textarea readonly class="hc-link" aria-label="Özel yönetici bağlantısı">${esc(link)}</textarea>`,[{id:'admin-copy',label:'Yönetici bağlantısını sakla',run:()=>copy(link)},{id:'share',label:'Katılım bağlantısını paylaş',primary:true,run:()=>share(code,local.mine.find(m=>m.code===code)?.title||'Hatim')},{id:'ok',label:'Tamam',run:closeDialog}]);}
function showManage(){
 const c=current,o=c.org;
 dialog('Hatmi yönet',`<label class="hc-field">Hatmin adı<input id="hcEditTitle" maxlength="120" value="${esc(o.title)}"></label><label class="hc-field">Hedef tarih<input id="hcEditDue" type="date" value="${esc(o.dueDate||'')}"></label><p class="hc-note">${o.public?'Açık hatimler listesinde.':'Yalnız bağlantıyla katılım.'}</p>`,[
 {id:'save',label:'Değişiklikleri kaydet',primary:true,run:async()=>{await mutate('update',null,{title:$('hcEditTitle').value.trim(),dueDate:$('hcEditDue').value||null});closeDialog();}},
 {id:'visibility',label:o.public?'Açık listeden kaldır':'Açık hatimlerde göster',run:async()=>{await mutate('publish',null,{public:!o.public});closeDialog();}},
 {id:'fix',label:'Cüz durumunu düzelt / erişim ver',run:showAdminCuz},
 {id:'report-png',label:'PNG raporu indir',run:()=>exportReport('png')},
 {id:'report-pdf',label:'PDF / yazdırma görünümü',run:()=>exportReport('pdf')},
 ...(c.adminToken?[{id:'backup',label:'Özel yönetici bağlantım',run:()=>showAdminBackup(c.code,c.adminToken)}]:[]),
 {id:'archive',label:o.archived?'Arşivden çıkar':'Arşive al',run:()=>dialog(o.archived?'Hatmi yeniden aç':'Hatmi arşivle','<p>Okuma kayıtları ve kişisel bağlantılar korunur. Arşivdeyken yeni cüz alınamaz; çalışma açık listeden çıkar.</p>',[{id:'confirm',label:o.archived?'Yeniden aç':'Arşive al',primary:true,run:async()=>{await mutate(o.archived?'reopen':'archive');closeDialog();}}])}
 ]);
}
async function exportReport(format){
 assertActionContext();const c=current,requestOwner=owner;if(!c)throw Error('Önce hatmi aç.');
 const d=await api(payload('get',c.code,{...(c.adminToken?{admin:c.adminToken}:{})}));assertActionContext();
 if(current!==c||owner!==requestOwner||generation!==c.ticket)throw Error('Hatim değişti. Raporu yeniden aç.');
 if(!d.org.isAdmin)throw Error('Rapor için güncel yönetici yetkisi gerekiyor.');
 await downloadHatimReport({...d.org,code:d.code},{format});
}
function showAdminCuz(){
 const c=current;
 dialog('Cüz yönetimi',`<label class="hc-field">Cüz<select id="hcAdminJuz">${c.org.items.map(i=>`<option value="${i.no}">${i.no}. cüz · ${esc(i.name||'Boş')}</option>`).join('')}</select></label><p class="hc-note">Durum düzeltme katılımcıyı değiştirmez. Kişisel dönüş bağlantısı üretmek önceki erişimi iptal eder; yalnız doğru kişiye ilet.</p>`,[
 {id:'done',label:'Okundu işaretle',run:async()=>{await mutate('adminSet',Number($('hcAdminJuz').value),{status:'okundu'});closeDialog();}},
 {id:'undo',label:'Okunacak olarak düzelt',run:async()=>{await mutate('adminSet',Number($('hcAdminJuz').value),{status:'alindi'});closeDialog();}},
 {id:'free',label:'Boşa çıkar',run:()=>{const no=Number($('hcAdminJuz').value);dialog('Cüzü boşa çıkar',`<p>${no}. cüzün mevcut kişisel erişimi iptal edilecek ve yeniden seçilebilecek.</p>`,[{id:'confirm',label:'Boşa çıkar',run:async()=>{await mutate('adminSet',no,{status:'bos'});closeDialog();}}]);}},
 {id:'recovery',label:'Kişisel dönüş bağlantısı hazırla',run:()=>{const no=Number($('hcAdminJuz').value);dialog('Katılımcı erişimini yenile',`<p>${no}. cüzün önceki hesap ve bağlantı erişimi iptal edilir. Yeni bağlantıyı yalnız bu cüzün gerçek sahibine ilet.</p>`,[{id:'confirm',label:'Yeni bağlantı oluştur',primary:true,run:async()=>{const pending=local.pendingRecovery[c.code]?.[no],token=pending&&!pending.confirmed?pending.token:secret(crypto);local.pendingRecovery[c.code]={...local.pendingRecovery[c.code],[no]:{token,confirmed:false,createdAt:Date.now()}};save(true);await mutate('issueRecovery',no,{capability:token});local.pendingRecovery[c.code][no].confirmed=true;save();showRecovery(c.code,no,token,false,true);}}]);}}
 ]);
}
function showGuestBindings(){
 const guest=loadLocal(storage,guestKey),entries=[];
 for(const m of guest.mine){const proof={...guest.capabilities[m.code]};for(const [no,item]of Object.entries(guest.pendingClaims[m.code]||{}))proof[no]=item.token;for(const [n,t]of Object.entries(proof))entries.push({code:m.code,no:Number(n),token:t,title:m.title});if(m.adminToken)entries.push({code:m.code,admin:m.adminToken,title:m.title});}
 dialog('Sana ait katılımları seç',`<p>Yalnız sana ait olanları hesabına bağla. Başka kişinin bu cihazdaki katılımını seçme.</p><div class="hc-bind-list">${entries.map((x,i)=>`<label><input type="checkbox" value="${i}"> ${esc(x.title)} · ${x.admin?'Yönetici erişimi':x.no+'. cüz'}</label>`).join('')}</div>`,[{id:'bind',label:'Seçtiklerimi hesabıma bağla',primary:true,run:async()=>{
  const selected=[...$('hatimDialog').querySelectorAll('input:checked')].map(x=>entries[Number(x.value)]);if(!selected.length)throw Error('En az bir katılım seç.');
  for(const e of selected){assertActionContext();const d=await api({action:e.admin?'bindAdmin':'bind',code:e.code,...(e.admin?{admin:e.admin}:{no:e.no,capability:e.token})});assertActionContext();if(e.token)local.capabilities[e.code]={...capabilities(e.code),[e.no]:e.token};remember(d.org,e.admin);save(true);if(e.token){delete guest.capabilities[e.code]?.[e.no];delete guest.pendingClaims[e.code]?.[e.no];}if(e.admin){const m=guest.mine.find(x=>x.code===e.code);if(m)delete m.adminToken;}storage.setItem(guestKey,JSON.stringify(guest));save(true);}
  closeDialog();await renderBirlikte();
 }}]);
}
function renderLegacy(o){
 const c=current,pend=local.pending[c.code]||0;
 $('orgView').innerHTML=`<div class="hc-detail">${previewNote('hcOrgPreview')}<small>ÖNCEKİ ORTAK NİYET KAYDI</small><h1>${esc(o.title)}</h1><p>${esc(o.zikirAd||'')} · ${o.toplam||0} / ${o.hedef||0}</p><p class="hc-note">Bu eski bağlantı ve kayıtları korunuyor.</p><div class="hc-main-actions">${button('＋ Okudum ('+pend+')','tap')}${button('Payımı ekle','send','primary')}</div><p id="hcLegacyStatus" role="status"></p></div>`;
 on($('orgView').querySelector('[data-hc=tap]'),'click',()=>{local.pending[c.code]=(local.pending[c.code]||0)+1;save();renderLegacy(o);});
 on($('orgView').querySelector('[data-hc=send]'),'click',()=>{if(!local.pending[c.code])return;dialog('Payını ekle',`<label class="hc-field">Ad veya takma ad<input id="hcLegacyName" maxlength="60" value="${esc(local.myName)}"></label>`,[{id:'send',label:'Gönder',primary:true,run:async()=>{const amount=local.pending[c.code],name=$('hcLegacyName').value.trim();if(name.length<2)throw Error('Ad veya takma ad yaz.');const d=await api(payload('contribute',c.code,{name,amount}));assertActionContext();local.pending[c.code]=Math.max(0,(local.pending[c.code]||0)-amount);save();if(current===c){current.org=d.org;renderOrg();}closeDialog();}}]);});
}
window.bkOpen=bkOpen;window.bkCurrent=null;window.bkRefreshTimer=null;window.renderBirlikte=renderBirlikte;window.renderOrg=renderOrg;window.renderMainPayBtn=payButton;
window.bkOpenDiscover=()=>{tab='open';openTogetherScreen();};window.bkDiscoverInit=async()=>{};
window.bkApi=api;window.bkDue=o=>({late:dueText(o.dueDate)==='Hedef tarih geçti',txt:dueText(o.dueDate)});
window.elifaHatimNavigation=leaveHatimDetail;
on($('orgBack'),'click',()=>{closeDialog();dialogIdentity++;++generation;clearInterval(window.bkRefreshTimer);current=null;window.bkCurrent=null;openTogetherScreen();});
on(document,'visibilitychange',()=>{if(!document.hidden)bkSilentRefresh();});on(window,'focus',bkSilentRefresh);
on(window,'elifa:account-changed',e=>{
 const uid=e.detail?.user?.uid||null;
 if(uid===owner){if(pendingConnection&&!current)resumeConnection().catch(err=>flash(err.message));return;}
 save();owner=uid;key=uid?'elifa_hatim_user_'+uid:guestKey;local=loadLocal(storage,key);accountItems=[];dialogIdentity++;++generation;++listGeneration;clearInterval(window.bkRefreshTimer);
 const code=current?.code;current=null;window.bkCurrent=null;closeDialog();payButton();
 if(pendingConnection)resumeConnection().catch(err=>flash(err.message));
 else if(code)bkOpen(code,null,{fromHistory:true});else if($('birlikte')?.classList.contains('on'))renderBirlikte();
});
payButton();
const initial=parseHatimLink(location.href,base())||readPendingConnection();
if(initial){
 stageConnection(initial);
 if(pendingConnectionPersisted)updateAddress();
 openTogetherScreen();
 const hint=$('hatimStatus');if(hint)hint.textContent='Bağlantın korunuyor. Hesap durumu hazırlanıyor…';
 resumeConnection().catch(err=>flash(err.message));
}
