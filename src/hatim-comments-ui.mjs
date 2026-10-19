// Hatim-local discussion: no timers, listeners or reads while collapsed.
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const idValid=id=>typeof id==='string'&&/^\d{13}-[a-f0-9]{16}$/.test(id);
export function createHatimComments({api,getUser,onLogin,makeOperationId,document=globalThis.document,storage,onCount=()=>{}}){
 const root=document.createElement('section');root.className='hc-comments';
 let context=null,scope=0,epoch=0,alive=true,opened=false,loading=false,error='',notice='',rows=[],cursor=null,count=0,closed=false,canComment=false;
 let replies=new Map(),reports=null,reportCursor=null,reportOpen=false,reportForm=null,confirm=null,busy=false;
 let draft={text:'',name:'',parentId:null,replyName:'',editId:null},pendingCreate=null;
 const userId=()=>getUser()?.uid||null,verified=()=>!!userId()&&getUser()?.emailVerified===true;
 const draftKey=()=>context&&userId()?'elifa_hatim_comment_pending_v1:'+userId()+':'+context.code:null;
 function persistPending(){try{const key=draftKey();if(key){if(pendingCreate)storage?.setItem(key,JSON.stringify(pendingCreate));else storage?.removeItem(key);}}catch{}}
 function restorePending(){try{const saved=JSON.parse(storage?.getItem(draftKey())||'null');if(saved&&/^[a-f0-9]{64}$/.test(saved.operationId)&&typeof saved.text==='string'&&saved.text.length<=1500&&typeof saved.name==='string'&&saved.name.length<=60&&(!saved.parentId||idValid(saved.parentId)))pendingCreate=saved;}catch{}if(pendingCreate)draft={text:pendingCreate.text,name:pendingCreate.name,parentId:pendingCreate.parentId||null,replyName:'',editId:null};}
 function token(){return {scope,uid:userId(),epoch};}
 function valid(t,read=false){return alive&&context&&scope===t.scope&&userId()===t.uid&&(!read||(opened&&epoch===t.epoch));}
 function action(label,command,id='',extra=''){return `<button type="button" class="hc-comment-action" data-comment-action="${command}"${id?` data-id="${escape(id)}"`:''}${busy?' disabled':''}${extra}>${label}</button>`;}
 function date(value){const d=new Date(value);return Number.isFinite(d.getTime())?d.toLocaleString(document.documentElement?.lang||'tr',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):'';}
 function row(item,reply=false){
  const removed=item.deleted||item.hidden,body=item.deleted?'Yorum silindi.':item.hidden?'Bu yorum gizlendi.':item.text;
  const parent=reply?rows.find(r=>r.id===item.parentId):null,canReply=canComment&&!removed&&(!reply||(parent&&!parent.deleted&&!parent.hidden));
  const ownActions=[item.canEdit&&canComment&&!removed?action('Düzenle','edit',item.id):'',item.canDelete&&!item.deleted?action('Sil','ask-delete',item.id):'',!item.own&&!removed?action('Bildir','report',item.id):'',item.canHide&&!item.deleted?action(item.hidden?'Yeniden göster':'Gizle','hide',item.id):''].join('');
  const thread=replies.get(item.id);
  return `<article class="hc-comment${reply?' hc-comment-reply':''}" data-comment-id="${escape(item.id)}"><header><strong>${escape(item.name||'Katılımcı')}</strong><span>${escape(date(item.createdAt))}${item.editedByAdmin?' · Yönetici düzenledi':item.updatedAt>item.createdAt?' · düzenlendi':''}</span>${ownActions?`<details class="hc-comment-menu"><summary aria-label="Yorum işlemleri">⋯</summary><div>${ownActions}</div></details>`:''}</header><p class="hc-comment-text${removed?' is-removed':''}">${escape(body)}</p>${canReply?action('Yanıtla','reply',item.id):''}${!reply&&item.replyCount? action(thread?.open?'Yanıtları gizle':item.replyCount+' yanıtı göster','replies',item.id):''}${!reply&&thread?.open?`<div class="hc-comment-replies">${thread.loading?'<p class="hc-comment-hint" role="status">Yanıtlar yükleniyor…</p>':''}${thread.error?`<p role="alert">${escape(thread.error)}</p>${action('Yeniden dene','retry-replies',item.id)}`:''}${(thread.rows||[]).map(r=>row(r,true)).join('')}${thread.cursor?action('Daha eski yanıtlar','older-replies',item.id):''}</div>`:''}</article>`;
 }
 function composer(){
  if(!verified())return `<p class="hc-comment-hint">Yorumları okumak ve yazmak için ${userId()?'e-posta adresini doğrula.':'hesabına giriş yap.'}</p>${action(userId()?'Hesabımı aç':'Giriş yap','login')}`;
  if(!canComment&&!draft.editId)return '<p class="hc-comment-hint">Bu hatimde yeni yorumlar kapalı.</p>';
  return `<form class="hc-comment-form" data-comment-form><div class="hc-comment-compose-title">${draft.editId?'Yorumunu düzenle':draft.parentId?escape(draft.replyName||'Yoruma')+' · yanıt yaz':'Yorum yaz'}${draft.editId||draft.parentId?action('Vazgeç','cancel-compose'):''}</div><label>Adın / takma ad<input data-comment-field="name" maxlength="60" autocomplete="nickname" value="${escape(draft.name||getUser()?.displayName||'')}"${draft.editId?' readonly':''}></label><label class="hc-comment-message-label">${draft.editId?'Yorumun':'Mesajın'}<textarea data-comment-field="text" rows="2" maxlength="1500"${pendingCreate||busy?' readonly':''}>${escape(draft.text)}</textarea></label><div class="hc-comment-send"><small>Yalnız metin · en fazla 1500 karakter</small><button type="submit" class="hc-button primary"${busy?' disabled':''}>${draft.editId?'Kaydet':pendingCreate?'Aynı yorumu yeniden gönder':'Gönder'}</button></div></form>`;
 }
 function reportPanel(){return reportForm?`<form class="hc-comment-report" data-report-form><label>Bildirme nedeni<textarea data-comment-field="reason" rows="2" maxlength="500">${escape(reportForm.reason)}</textarea></label><div>${action('Vazgeç','cancel-report')}<button class="hc-button" type="submit"${busy?' disabled':''}>Bildirimi gönder</button></div></form>`:'';}
 function reportsPanel(){return !reportOpen?'':`<section class="hc-comment-reports"><h3>Bildirilen yorumlar</h3>${reports===null?'<p>Bildirimler yükleniyor…</p>':!reports.length?'<p>Bildirim yok.</p>':reports.map(r=>`<article class="hc-comment"><header><strong>Yorum bildirimi</strong><span>${escape(date(r.createdAt))}</span></header><p>${escape(r.reason)}</p><blockquote>${escape(r.comment?.moderatedText||r.comment?.text||(r.comment?.deleted?'Yorum silindi.':'Yorum bulunamadı.'))}</blockquote>${r.comment?.canHide&&!r.comment.deleted?action(r.comment.hidden?'Yeniden göster':'Yorumu gizle','hide',r.commentId):''}${action('Bildirimi kapat','resolve-report',r.id)}</article>`).join('')}${reportCursor?action('Daha eski bildirimler','older-reports'):''}</section>`;}
 function render(){
  const focus=document.activeElement?.dataset?.commentField,caret=document.activeElement?.selectionStart;
  root.innerHTML=`<button type="button" class="hc-comments-toggle" data-comment-action="toggle" aria-expanded="${opened}"><span>Yorumlar <small>· ${count}</small></span><span aria-hidden="true">${opened?'⌃':'⌄'}</span></button>${opened?`<div class="hc-comments-body"><p class="hc-comment-hint">Bu hatimle ilgili kısa bir mesaj paylaş. Kişisel bilgilerini yazma.</p>${context?.isAdmin?`<div class="hc-comment-tools">${action(closed?'Yorumları aç':'Yorumları kapat','settings')}${action(reportOpen?'Bildirimleri kapat':'Bildirilen yorumlar','reports')}</div>`:''}${loading?'<p class="hc-comment-hint" role="status">Yorumlar yükleniyor…</p>':''}${error?`<p class="hc-comment-error" role="alert">${escape(error)}</p>${!busy?action('Yeniden dene','retry'):''}`:''}${notice?`<p class="hc-comment-hint" role="status">${escape(notice)}</p>`:''}${rows.map(r=>row(r)).join('')}${!loading&&!rows.length&&verified()&&!error?'<p class="hc-comment-hint">Henüz yorum yok. İlk mesajı sen yazabilirsin.</p>':''}${cursor?action('Daha eski yorumlar','older'):''}${confirm?`<div class="hc-comment-confirm" role="group" aria-label="Yorumu silme onayı"><p>Bu yorum silinsin mi? Altındaki yanıtlar korunur.</p>${action('Vazgeç','cancel-delete')}${action('Evet, sil','delete',confirm)}</div>`:''}${reportPanel()}${reportsPanel()}${composer()}</div>`:''}`;
  if(focus&&opened){const field=root.querySelector(`[data-comment-field="${focus}"]`);field?.focus?.({preventScroll:true});if(Number.isInteger(caret))try{field?.setSelectionRange?.(caret,caret);}catch{}}
 }
 async function list(older=false){
  if(!opened||!verified()||loading)return;const t=token();loading=true;error='';render();
  try{const data=await api({action:'commentList',code:context.code,...(older&&cursor?{cursor}: {})});if(!valid(t,true))return;
   if(!Array.isArray(data.comments)||data.code!==context.code)throw Error('Yorum yanıtı doğrulanamadı.');
   const next=older?[...rows,...data.comments]:data.comments;rows=[...new Map(next.map(r=>[r.id,r])).values()];cursor=data.nextCursor||null;count=Number.isSafeInteger(data.commentCount)?data.commentCount:count;closed=!!data.commentsClosed;canComment=!!data.canComment;onCount({code:context.code,commentCount:count,commentsClosed:closed,canComment});
  }catch(e){if(valid(t,true))error=e.message;}finally{if(valid(t,true)){loading=false;render();}}
 }
 async function loadReplies(parentId,older=false){
  if(!idValid(parentId)||!opened||!verified())return;const existing=replies.get(parentId)||{rows:[],cursor:null,open:true};if(existing.loading)return;
  const t=token();existing.open=true;existing.loading=true;existing.error='';replies.set(parentId,existing);render();
  try{const data=await api({action:'commentReplies',code:context.code,parentId,...(older&&existing.cursor?{cursor:existing.cursor}:{})});if(!valid(t,true)||!existing.open)return;
   if(!Array.isArray(data.comments)||data.code!==context.code)throw Error('Yanıtlar doğrulanamadı.');
   existing.rows=[...new Map((older?[...existing.rows,...data.comments]:data.comments).map(r=>[r.id,r])).values()];existing.cursor=data.nextCursor||null;
  }catch(e){if(valid(t,true)&&existing.open)existing.error=e.message;}finally{if(valid(t,true)){existing.loading=false;render();}}
 }
 async function loadReports(older=false){
  if(!opened||!context.isAdmin||!reportOpen)return;const t=token();
  try{const data=await api({action:'commentReports',code:context.code,...(older&&reportCursor?{cursor:reportCursor}:{})});if(!valid(t,true)||!reportOpen)return;if(!Array.isArray(data.reports))throw Error('Bildirimler doğrulanamadı.');reports=older?[...(reports||[]),...data.reports]:data.reports;reportCursor=data.nextCursor||null;render();}
  catch(e){if(valid(t,true)){error=e.message;render();}}
 }
 function find(id){return rows.find(r=>r.id===id)||[...replies.values()].flatMap(t=>t.rows).find(r=>r.id===id)||reports?.find(r=>r.commentId===id)?.comment;}
 async function write(payload,onSuccess){
  if(busy||!opened)return;const t=token(),replyParent=payload.parentId||find(payload.id)?.parentId;busy=true;error='';notice='';render();
  try{const data=await api({...payload,code:context.code});if(!valid(t))return;await onSuccess?.(data);if(valid(t)&&opened){await list();if(replyParent&&replies.get(replyParent)?.open)await loadReplies(replyParent);if(reportOpen)await loadReports();}}
  catch(e){if(valid(t)){error=e.message;if(payload.action==='commentCreate'&&pendingCreate&&e.status>=400&&e.status<500){pendingCreate=null;persistPending();}}}
  finally{if(valid(t)){busy=false;render();}}
 }
 async function submit(){
  if(!verified()){onLogin();return;}
  const text=draft.text.trim(),name=(draft.name||getUser()?.displayName||'').trim();
  if(!text||text.length>1500||(!draft.editId&&(name.length<2||name.length>60))){error='2–60 karakterlik ad ve 1–1500 karakterlik bir yorum yaz.';render();return;}
  if(draft.editId){const id=draft.editId;await write({action:'commentEdit',id,text},()=>{draft={text:'',name,parentId:null,replyName:'',editId:null};notice='Yorum güncellendi.';});return;}
  if(!pendingCreate){pendingCreate={operationId:makeOperationId(),text,name,...(draft.parentId?{parentId:draft.parentId}:{})};persistPending();}
  await write({action:'commentCreate',...pendingCreate},data=>{
   if(!data.comment||!idValid(data.comment.id))throw Error('Gönderim sonucu doğrulanamadı. Aynı yorumu yeniden dene.');
   const parentId=pendingCreate?.parentId;pendingCreate=null;persistPending();draft={text:'',name,parentId:null,replyName:'',editId:null};notice='Yorum gönderildi.';
   if(parentId)replies.set(parentId,{rows:[],cursor:null,open:true,loading:false});if(Number.isSafeInteger(data.commentCount))count=data.commentCount;else if(!data.replayed)count++;onCount({code:context.code,commentCount:count});
  });
 }
 async function dispatch(command,id){
  if(!alive||!context)return;
  if(command==='toggle'){opened=!opened;epoch++;loading=false;for(const thread of replies.values())thread.loading=false;error='';if(opened){render();await list();}else render();return;}
  if(command==='login'){onLogin();return;}
  if(!opened||busy)return;
  if(command==='retry'||command==='older'){await list(command==='older');return;}
  if(command==='replies'){const thread=replies.get(id);if(thread?.open){thread.open=false;render();}else await loadReplies(id);return;}
  if(command==='retry-replies'||command==='older-replies'){await loadReplies(id,command==='older-replies');return;}
  if(command==='reports'){reportOpen=!reportOpen;render();if(reportOpen)await loadReports();return;}
  if(command==='older-reports'){await loadReports(true);return;}
  if(command==='resolve-report'&&context.isAdmin&&reports?.some(r=>r.id===id)){await write({action:'commentResolveReport',id},()=>{reports=reports.filter(r=>r.id!==id);notice='Bildirim kapatıldı. Yorum değiştirilmedi.';});return;}
  if(command==='cancel-delete'){confirm=null;render();return;}
  if(command==='cancel-report'){reportForm=null;render();return;}
  if(command==='cancel-compose'){if(pendingCreate){error='Önce önceki gönderimi aynı yorumla yeniden dene.';}else draft={text:'',name:draft.name,parentId:null,replyName:'',editId:null};render();return;}
  if(command==='settings'&&context.isAdmin){const wanted=!closed;await write({action:'commentSettings',closed:wanted},data=>{closed=typeof data.commentsClosed==='boolean'?data.commentsClosed:wanted;canComment=typeof data.canComment==='boolean'?data.canComment:!closed&&!context.archived&&verified();onCount({code:context.code,commentsClosed:closed,canComment});});return;}
  const item=find(id);
  if(!item||!idValid(id))return;
  if(command==='reply'&&canComment&&!item.deleted&&!item.hidden){const parent=item.parentId&&rows.find(r=>r.id===item.parentId);if(pendingCreate||(item.parentId&&(!parent||parent.deleted||parent.hidden)))return;draft.parentId=item.parentId||item.id;draft.replyName=item.name;draft.editId=null;render();root.querySelector('[data-comment-field="text"]')?.focus();return;}
  if(command==='edit'&&item.canEdit&&canComment){if(pendingCreate||draft.text.trim()){error='Önce yazdığın mesajı gönder veya Vazgeç ile temizle.';render();return;}draft={text:item.text,name:item.name,parentId:item.parentId||null,replyName:'',editId:item.id};render();return;}
  if(command==='ask-delete'&&item.canDelete){confirm=id;render();return;}
  if(command==='delete'&&item.canDelete&&confirm===id){await write({action:'commentDelete',id},()=>{confirm=null;notice='Yorum silindi; yanıtları korunuyor.';});return;}
  if(command==='report'&&!item.own){reportForm={id,reason:''};render();return;}
  if(command==='hide'&&item.canHide&&context.isAdmin){await write({action:'commentHide',id,hidden:!item.hidden},()=>{notice=item.hidden?'Yorum yeniden gösterildi.':'Yorum gizlendi.';});}
 }
 root.addEventListener('click',event=>{const target=event.target.closest?.('[data-comment-action]');if(target&&root.contains(target)){event.preventDefault();dispatch(target.dataset.commentAction,target.dataset.id);}});
 root.addEventListener('input',event=>{const field=event.target.dataset?.commentField;if(field==='reason'&&reportForm)reportForm.reason=event.target.value;else if((field==='text'||field==='name')&&!pendingCreate)draft[field]=event.target.value;});
 root.addEventListener('submit',event=>{event.preventDefault();if(event.target.matches?.('[data-report-form]')){if(!reportForm?.reason.trim()){error='Kısaca neden bildirdiğini yaz.';render();return;}return write({action:'commentReport',id:reportForm.id,reason:reportForm.reason.trim()},()=>{reportForm=null;notice='Bildirim hatmi başlatan kişiye iletildi.';});}return submit();});
 return {
  mount(container,next){
   const identity=next.code+':'+next.generation+':'+userId();
   if(context?.identity!==identity){scope++;epoch++;opened=false;loading=false;busy=false;rows=[];cursor=null;replies=new Map();reports=null;reportCursor=null;reportOpen=false;reportForm=null;confirm=null;error='';notice='';pendingCreate=null;draft={text:'',name:'',parentId:null,replyName:'',editId:null};context={...next,identity};count=Number.isSafeInteger(next.commentCount)?next.commentCount:0;closed=!!next.commentsClosed;canComment=!!next.canComment&&verified();restorePending();}
   else{context={...context,...next};if(Number.isSafeInteger(next.commentCount))count=Math.max(count,next.commentCount);closed=!!next.commentsClosed;canComment=!!next.canComment&&verified();}
   alive=true;if(root.parentNode!==container)container.appendChild(root);render();
  },
  pause(){epoch++;opened=false;loading=false;for(const thread of replies.values())thread.loading=false;render();},
  dispose(){alive=false;scope++;epoch++;context=null;rows=[];replies.clear();draft={text:'',name:'',parentId:null,replyName:'',editId:null};pendingCreate=null;root.remove();},
  // Commands are also useful for keyboard adapters and deterministic local tests.
  dispatch,submit,element:root
 };
}
