const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const roles={owner:'Uygulama sahibi',admin:'Admin',moderator:'Yönetici'};
const socialNote='Topluluk engeli yalnız hatim, katılım ve yorum alanları içindir. Kur’an okuma, yedekleme ve hesabı silme açık kalır.';
export function createCommunityAdmin({entry,host,session,apiBase='',fetcher=globalThis.fetch,preview=()=>false,eventTarget=globalThis.window,location=globalThis.location}){
 let initialized=false,disposed=false,boundBridge=null,unsubscribe=null,identity='',epoch=0,statusTicket=0;
 let access=null,opened=false,tab='comments',queue='comments',rows=[],cursor=null,people=null,roleRows=[],roleCursor=null,busy=false,loading=false,error='',notice='',confirmation=null,edit=null;
 const fields={email:'',grantEmail:'',grantRole:'moderator'};
 const user=()=>session?.()?.getUser?.()||null;
 const uid=()=>user()?.uid||null;
 const blockedPreview=()=>{try{return !!preview()||/^deploy-preview-\d+--/.test(location?.hostname||'');}catch{return true;}};
 const allowed=permission=>!!access?.permissions?.[permission];
 const current=(stamp,person)=>!disposed&&epoch===stamp&&uid()===person;
 const snapshot=()=>({stamp:epoch,person:uid()});
 function hideEntry(){entry.hidden=true;entry.disabled=false;entry.setAttribute?.('aria-busy','false');}
 function resetContent(){rows=[];cursor=null;people=null;roleRows=[];roleCursor=null;confirmation=null;edit=null;error='';notice='';loading=false;busy=false;fields.email='';fields.grantEmail='';fields.grantRole='moderator';}
 function close(){if(!opened)return;opened=false;epoch++;resetContent();if(host.open)host.close();host.innerHTML='';}
 function deny(){access=null;hideEntry();close();host.innerHTML='';}
 async function request(action,payload={}){
  if(blockedPreview())throw Object.assign(Error('Önizlemede yönetim paneli kapalı.'),{errorCode:'PREVIEW_RESTRICTED'});
  const {stamp,person}=snapshot(),bridge=session?.();
  if(!person||user()?.emailVerified!==true)throw Object.assign(Error('Giriş yapıp e-posta adresini doğrula.'),{errorCode:'AUTH_REQUIRED'});
  const token=await bridge?.getIdToken?.();
  if(!token||!current(stamp,person))throw Error('Hesap değişti. Paneli yeniden aç.');
  let response,data;try{response=await fetcher(apiBase+'/api/community-admin',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({...payload,action,expectedUser:person}),signal:AbortSignal.timeout(20000)});data=await response.json();}catch{throw Error('Sunucuya ulaşılamadı. Sonucu kontrol edip yeniden dene.');}
  if(!current(stamp,person))throw Error('Hesap veya ekran değişti. Paneli yeniden aç.');
  if(!response.ok)throw Object.assign(Error(data?.error||'İşlem tamamlanamadı.'),{status:response.status,errorCode:data?.errorCode});
  if(!data||typeof data!=='object'||Array.isArray(data))throw Error('Sunucu yanıtı doğrulanamadı.');
  return data;
 }
 async function refreshStatus(){
  const ticket=++statusTicket,{stamp,person}=snapshot();hideEntry();
  if(!person||user()?.emailVerified!==true||blockedPreview()){deny();return null;}
  entry.disabled=true;entry.setAttribute?.('aria-busy','true');
  try{const data=await request('status');if(!current(stamp,person)||ticket!==statusTicket)return null;
   if(!Object.hasOwn(roles,data.role)){deny();return null;}
   access={role:data.role,owner:data.role==='owner'&&data.owner===true,permissions:{}};
   for(const name of ['roles','lookup','comments','communityBan','commentBan'])access.permissions[name]=data.permissions?.[name]===true&&(name!=='roles'||access.owner);
   entry.hidden=false;return access;
  }catch{if(current(stamp,person)&&ticket===statusTicket)deny();return null;}
  finally{if(current(stamp,person)&&ticket===statusTicket){entry.disabled=false;entry.setAttribute?.('aria-busy','false');}}
 }
 function connect(){
  const bridge=session?.();if(bridge&&bridge!==boundBridge){unsubscribe?.();boundBridge=bridge;unsubscribe=bridge.onChange?.(changed);}
 }
 function changed(){
  connect();const next=(uid()||'')+':'+(user()?.emailVerified===true?'verified':'unverified');
  if(next===identity)return;identity=next;epoch++;access=null;hideEntry();close();resetContent();host.innerHTML='';refreshStatus();
 }
 function button(label,action,attrs=''){return `<button type="button" data-admin-action="${action}"${(busy||loading)&&action!=='close'?' disabled':''}${attrs}>${label}</button>`;}
 function date(value){const d=new Date(value);return Number.isFinite(d.getTime())?d.toLocaleString('tr',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):'';}
 function personResult(result,alias=''){return {...result,user:{...result.user,displayName:result.user?.displayName||alias,role:result.user?.role||result.role||null}};}
 function row(item,reported=false){
  const c=reported?item.comment:item,code=reported?item.code:c?.code,id=reported?item.commentId:c?.id;
  const reference=` data-code="${esc(code)}" data-id="${esc(id)}"`;
  return `<article class="ca-row"><header><strong>${esc(c?.name||'Katılımcı')}</strong><small>Hatim ${esc(code)} · ${esc(date(c?.createdAt))}</small>${c?.editedByAdmin?'<span class="ca-badge">Yönetici düzenledi</span>':''}${c?.hidden?'<span class="ca-badge">Gizli</span>':''}</header>${reported?`<p class="ca-report-reason">Bildirim: ${esc(item.reason)}</p>`:''}<p class="ca-message">${esc(c?.deleted?'Yorum silinmiş.':c?.moderatedText||c?.text||'Yorum bulunamadı.')}</p><div class="ca-row-actions">${c&&!c.deleted&&allowed('comments')?`<details class="ca-menu"><summary aria-label="Yorum işlemleri">⋯</summary><div>${button('Düzenle','edit',reference)}${button(c.hidden?'Yeniden göster':'Gizle',c.hidden?'show':'hide',reference)}${button('Sil','ask-delete',reference)}</div></details>`:''}${c?.ownerUid&&allowed('commentBan')?button('Kişiyi aç','person',` data-target="${esc(c.ownerUid)}" data-name="${esc(c.name)}"`):''}${reported?button('Bildirimi kapat','ask-resolve',` data-code="${esc(item.code)}" data-id="${esc(item.id)}"`):''}</div></article>`;
 }
 function peopleView(){
  const search=allowed('lookup')?'<form data-admin-form="lookup" class="ca-search"><label>Hesabın tam e-posta adresi<input type="email" required maxlength="254" data-admin-field="email" autocomplete="off" value="'+esc(fields.email)+'"></label><button type="submit"'+(busy?' disabled':'')+'>Kişiyi bul</button></form>':'<p class="ca-note">Kişiyi yorumunun yanındaki “Kişiyi aç” düğmesinden seç. E-posta ile arama yetkin yok.</p>';
  if(!people)return search+`<p class="ca-note">${socialNote}</p>`;
  const person=people.user||{},restriction=people.restriction||{},protectedPerson=people.protected===true||person.uid===uid()||person.role==='owner';
  return search+`<article class="ca-person"><h3>${esc(person.displayName||person.email||'Seçilen kişi')}</h3>${person.email?'<p>'+esc(person.email)+'</p>':''}${person.role?'<span class="ca-badge">'+esc(roles[person.role]||person.role)+'</span>':''}<p class="ca-note">Topluluk: ${restriction.communityBanned?'engelli':'açık'} · Yorum yazma: ${restriction.commentsRestricted?'kapalı':'açık'}</p>${protectedPerson?'<p class="ca-note">Bu hesabın kısıtları buradan değiştirilemez. Kendi hesabın ve aynı ya da daha yüksek yetkiler korunur.</p>':`<div class="ca-person-actions">${allowed('communityBan')?button(restriction.communityBanned?'Topluluk engelini kaldır':'Topluluktan engelle',restriction.communityBanned?'ask-community-unban':'ask-community-ban'):''}${allowed('commentBan')?button(restriction.commentsRestricted?'Yorum yasağını kaldır':'Yorum yazmasını durdur',restriction.commentsRestricted?'ask-comment-unban':'ask-comment-ban'):''}</div>`}</article><p class="ca-note">${socialNote}</p>`;
 }
 function rolesView(){
  if(!allowed('roles'))return '';
  return `<p class="ca-note">Admin: topluluk ve yorum yönetimi. Yönetici: yorum yönetimi ve yorum yasağı. Yalnız kayıtlı bir hesaba yetki verilebilir.</p><form data-admin-form="grant" class="ca-role-form"><label>Tam e-posta adresi<input type="email" required maxlength="254" data-admin-field="grantEmail" value="${esc(fields.grantEmail)}" autocomplete="off"></label><div class="ca-role-choice" role="group" aria-label="Verilecek yetki"><span>Yetki</span><div>${[['moderator','Yönetici'],['admin','Admin']].map(([value,label])=>button(label,'choose-role',' data-role="'+value+'" aria-pressed="'+(fields.grantRole===value)+'"')).join('')}</div></div><button type="submit"${busy?' disabled':''}>Yetkiyi ver</button></form><div class="ca-roles">${roleRows.map(r=>`<article class="ca-role-row"><div><strong>${esc(r.email)}</strong><small>${esc(roles[r.role]||r.role)}</small></div>${r.uid!==uid()&&r.role!=='owner'?button('Yetkiyi kaldır','ask-revoke',` data-target="${esc(r.uid)}" data-email="${esc(r.email)}"`):'<span class="ca-badge">Korunan</span>'}</article>`).join('')}</div>${roleCursor?button('Daha eski yetkiler','older-roles'):''}`;
 }
 function render(){
  if(!opened||!access)return;
  const focus=host.querySelector?.(':focus')?.dataset?.adminField;
  host.innerHTML=`<header class="ca-header"><div><h2>Yönetim paneli</h2><small>${roles[access.role]}</small></div>${button('×','close',' aria-label="Kapat" class="ca-close"')}</header><nav class="ca-tabs" aria-label="Yönetim bölümleri">${[['comments','Yorumlar'],['people','Kişiler'],...(allowed('roles')?[['roles','Yetkiler']]:[])].map(([id,label])=>`<button type="button" data-admin-action="tab" data-tab="${id}" aria-pressed="${tab===id}">${label}</button>`).join('')}</nav><div class="ca-content">${error?`<p class="ca-error" role="alert">${esc(error)}</p>`:''}${notice?`<p class="ca-note" role="status">${esc(notice)}</p>`:''}${loading?'<p class="ca-note" role="status">Bilgiler alınıyor…</p>':''}${confirmation?`<section class="ca-confirm" role="group" aria-label="İşlem onayı"><p>${esc(confirmation.text)}</p><div>${button('Vazgeç','cancel-confirm')}${button('Onayla','confirm')}</div></section>`:''}${edit?`<form class="ca-edit" data-admin-form="edit"><label>Yorumu düzenle<textarea data-admin-field="editText" maxlength="1500" rows="3">${esc(edit.text)}</textarea></label><small>Herkese “Yönetici düzenledi” bilgisi gösterilir.</small><div>${button('Vazgeç','cancel-edit')}<button type="submit"${busy?' disabled':''}>Kaydet</button></div></form>`:''}${tab==='comments'?`<div class="ca-queue">${button('Yorumlar','queue',' data-queue="comments" aria-pressed="'+(queue==='comments')+'"')}${button('Bildirimler','queue',' data-queue="reports" aria-pressed="'+(queue==='reports')+'"')}${button('Yenile','reload')}</div>${!loading&&!rows.length?'<p class="ca-note">Gösterilecek kayıt yok.</p>':''}<div>${rows.map(r=>row(r,queue==='reports')).join('')}</div>${cursor?button('Daha eski kayıtlar','older'):''}`:tab==='people'?peopleView():rolesView()}</div>`;
  if(focus)host.querySelector?.(`[data-admin-field="${focus}"]`)?.focus?.({preventScroll:true});
 }
 async function task(action,done){
  if(busy||!opened)return;const {stamp,person}=snapshot();busy=true;error='';notice='';render();
  try{const result=await action();if(current(stamp,person)&&opened)await done?.(result);}
  catch(e){if(current(stamp,person)&&opened){error=e.message;if(['ADMIN_REQUIRED','OWNER_REQUIRED','AUTH_REQUIRED','EMAIL_UNVERIFIED','PREVIEW_RESTRICTED'].includes(e.errorCode))deny();}}
  finally{if(current(stamp,person)&&opened){busy=false;render();}}
 }
 async function load(older=false){
  if(!opened||loading)return;const {stamp,person}=snapshot();loading=true;error='';render();
  try{if(tab==='comments'){
    const data=await request(queue,older&&cursor?{cursor}:{});if(!current(stamp,person)||!opened||tab!=='comments')return;
    const result=data[queue];if(!Array.isArray(result))throw Error('Liste doğrulanamadı.');rows=older?[...rows,...result]:result;cursor=data.nextCursor||null;
   }else if(tab==='roles'&&allowed('roles')){const data=await request('roles',older&&roleCursor?{cursor:roleCursor}:{});if(!current(stamp,person)||!opened||tab!=='roles')return;if(!Array.isArray(data.roles))throw Error('Yetkiler doğrulanamadı.');roleRows=older?[...roleRows,...data.roles]:data.roles;roleCursor=data.nextCursor||null;}
  }catch(e){if(current(stamp,person)&&opened){error=e.message;if(['ADMIN_REQUIRED','OWNER_REQUIRED'].includes(e.errorCode))deny();}}
  finally{if(current(stamp,person)&&opened){loading=false;render();}}
 }
 async function open(){
  if(disposed)return;const {stamp,person}=snapshot(),status=await refreshStatus();if(!status||!current(stamp,person))return;
  opened=true;tab='comments';queue='comments';resetContent();host.classList?.add('community-admin-dialog');render();if(!host.open)host.showModal();await load();
 }
 function confirm(text,action){confirmation={text,action};render();}
 function targetAllowed(){return people?.user?.uid&&people.user.uid!==uid()&&!people.protected&&people.user.role!=='owner';}
 async function dispatch(action,data={}){
  if(action==='close'){close();return;}
  if(!opened||busy||!access)return;
  if(action==='tab'){
   if(!['comments','people','roles'].includes(data.tab)||(data.tab==='roles'&&!allowed('roles')))return;epoch++;tab=data.tab;rows=[];cursor=null;edit=null;confirmation=null;loading=false;error='';render();if(tab!=='people')await load();return;
  }
  if(action==='queue'){if(!['comments','reports'].includes(data.queue))return;epoch++;queue=data.queue;rows=[];cursor=null;loading=false;await load();return;}
  if(loading)return;
  if(action==='choose-role'&&allowed('roles')&&['admin','moderator'].includes(data.role)){fields.grantRole=data.role;render();return;}
  if(action==='reload'||action==='older'){await load(action==='older');return;}
  if(action==='older-roles'){await load(true);return;}
  if(action==='cancel-confirm'){confirmation=null;render();return;}
  if(action==='cancel-edit'){edit=null;render();return;}
  if(action==='confirm'&&confirmation){const selected=confirmation;await task(selected.action,()=>{confirmation=null;notice='İşlem tamamlandı.';});return;}
  if(action==='ask-revoke'&&allowed('roles')&&data.target!==uid()){confirm(`${data.email||'Bu hesabın'} yetkisi kaldırılsın mı?`,async()=>{await request('revokeRole',{targetUid:data.target});await load();});return;}
  if(action==='person'&&allowed('commentBan')){await task(()=>request('restrictionStatus',{targetUid:data.target}),result=>{people=personResult(result,data.name);tab='people';});return;}
  const restrictions={'ask-community-ban':{communityBanned:true},'ask-community-unban':{communityBanned:false},'ask-comment-ban':{commentsRestricted:true},'ask-comment-unban':{commentsRestricted:false}};
  if(restrictions[action]&&targetAllowed()){
   const update=restrictions[action];if(('communityBanned'in update&&!allowed('communityBan'))||('commentsRestricted'in update&&!allowed('commentBan')))return;
   const targetUid=people.user.uid;confirm(action.includes('community')?`Topluluk erişimi değişsin mi? ${socialNote}`:'Bu kişinin yorum yazma izni değişsin mi? Kur’an okuması ve hesap işlemleri etkilenmez.',async()=>{await request('setRestriction',{targetUid,...update});people={...people,restriction:{...people.restriction,...update}};});return;
  }
  const found=queue==='reports'?rows.find(r=>r.code===data.code&&r.commentId===data.id)?.comment:rows.find(r=>r.code===data.code&&r.id===data.id);
  if(action==='ask-resolve'&&allowed('comments')){confirm('Bu bildirim incelendi olarak kapatılsın mı? Yorum değiştirilmez.',async()=>{await request('resolveReport',{code:data.code,id:data.id});await load();});return;}
  if(!found||found.deleted||!allowed('comments'))return;
  if(action==='edit'){edit={code:data.code,id:data.id,text:found.moderatedText||found.text||''};render();return;}
  if(action==='hide'||action==='show'){await task(()=>request('moderateComment',{code:data.code,id:data.id,operation:action}),()=>load());return;}
  if(action==='ask-delete')confirm('Bu yorum silinsin mi? Altındaki yanıtlar korunur.',async()=>{await request('moderateComment',{code:data.code,id:data.id,operation:'delete'});await load();});
 }
 async function submit(kind){
  if(busy||loading||!opened)return;
  if(kind==='lookup'&&allowed('lookup')){const email=fields.email.trim();if(!email||!email.includes('@')){error='Hesabın tam e-posta adresini yaz.';render();return;}await task(()=>request('userLookup',{email}),result=>{people=personResult(result);});}
  if(kind==='grant'&&allowed('roles')){const email=fields.grantEmail.trim(),role=fields.grantRole;if(!email||!email.includes('@')||!['admin','moderator'].includes(role)){error='Tam e-posta adresini ve yetkiyi seç.';render();return;}confirm(`${email} hesabına ${roles[role]} yetkisi verilsin mi?`,async()=>{await request('grantRole',{email,role});fields.grantEmail='';await load();});}
  if(kind==='edit'&&edit&&allowed('comments')){const selected={...edit},text=selected.text.trim();if(!text||text.length>1500){error='1–1500 karakterlik bir yorum yaz.';render();return;}await task(()=>request('moderateComment',{code:selected.code,id:selected.id,operation:'edit',text}),async()=>{edit=null;notice='Yorum güncellendi; yönetici düzenlemesi olarak işaretlendi.';await load();});}
 }
 const authEvent=()=>changed();
 return {
  initialize(){if(initialized||disposed)return;initialized=true;hideEntry();entry.addEventListener('click',()=>open());host.addEventListener('cancel',close);host.addEventListener('close',close);
   host.addEventListener('click',event=>{const node=event.target.closest?.('[data-admin-action]');if(node&&host.contains(node)){event.preventDefault();dispatch(node.dataset.adminAction,node.dataset);}});
   host.addEventListener('input',event=>{const field=event.target.dataset?.adminField;if(field==='editText'&&edit)edit.text=event.target.value;else if(Object.hasOwn(fields,field))fields[field]=event.target.value;});
   host.addEventListener('change',event=>{const field=event.target.dataset?.adminField;if(Object.hasOwn(fields,field))fields[field]=event.target.value;});
   host.addEventListener('submit',event=>{const kind=event.target.dataset?.adminForm;if(kind){event.preventDefault();submit(kind);}});
   eventTarget?.addEventListener?.('elifa:account-changed',authEvent);connect();changed();
  },open,close,refreshStatus,dispatch,submit,
  dispose(){disposed=true;epoch++;unsubscribe?.();eventTarget?.removeEventListener?.('elifa:account-changed',authEvent);deny();host.innerHTML='';}
 };
}
