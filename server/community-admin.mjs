import {createHash,randomBytes} from 'node:crypto';
import {withOrgTransaction} from './database.mjs';
import {closedAccountKey} from './hatim-access.mjs';

export const COMMUNITY_OWNER_EMAIL='huseyinyildiz0792@gmail.com';
const hash=uid=>createHash('sha256').update(uid).digest('hex');
const uidValid=uid=>typeof uid==='string'&&uid.length>0&&uid.length<=128&&!/[\u0000-\u001f]/.test(uid);
const email=value=>typeof value==='string'?value.trim().toLowerCase():'';
const codeValid=code=>typeof code==='string'&&/^[a-z0-9]{6}$/.test(code);
const idValid=id=>typeof id==='string'&&/^\d{13}-[a-f0-9]{16}$/.test(id);
const roleKey=uid=>'_ca_role_'+hash(uid),restrictionKey=uid=>'_ca_restrict_'+hash(uid),userPrefix=uid=>'_ca_user_'+hash(uid)+'_';
const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'private, no-store','vary':'Authorization, Origin','x-content-type-options':'nosniff'}});
export const adminFailure=(error,status,errorCode)=>json({error,errorCode},status);
function permissions(role){return {roles:role==='owner',lookup:role==='owner'||role==='admin',comments:!!role,communityBan:role==='owner'||role==='admin',commentBan:!!role};}
export async function getCommunityAccess(store,session={}){
 if(!session.uid)return {role:null,restriction:{communityBanned:false,commentsRestricted:false}};
 const owner=await store.get('_ca_owner',{type:'json'}),assigned=await store.get(roleKey(session.uid),{type:'json'}),restriction=await store.get(restrictionKey(session.uid),{type:'json'});
 const role=owner?.uid===session.uid?'owner':['admin','moderator'].includes(assigned?.role)&&assigned.uid===session.uid?assigned.role:null;
 return {role,restriction:{communityBanned:restriction?.communityBanned===true,commentsRestricted:restriction?.commentsRestricted===true}};
}
export function communityRestrictionError(access,kind){
 if(access?.restriction.communityBanned)return adminFailure('Bu hesap yeni hatim oluşturamaz, yeni cüz alamaz veya yorum yazamaz. Mevcut cüzlerin ve Kur’an okuma/hesap işlevlerin korunur.',403,'COMMUNITY_BANNED');
 if(kind==='comments'&&access?.restriction.commentsRestricted)return adminFailure('Bu hesabın yorum yazma yetkisi kısıtlandı. Mevcut cüzlerin ve Kur’an okuma/hesap işlevlerin korunur.',403,'COMMENTS_RESTRICTED');
 return null;
}
export async function auditCommunityAction(store,action,actorUid,target,{now=Date.now}={}){
 const at=now(),id=String(at).padStart(13,'0')+'-'+randomBytes(8).toString('hex'),key='_ca_audit_'+id;
 const actor=hash(actorUid),targetHash=uidValid(target?.uid)?hash(target.uid):null;
 await store.setJSON(key,{action,actor,target:targetHash||target?.comment||null,at});
 await store.setJSON(userPrefix(actorUid)+id,{auditKey:key});
 if(targetHash&&targetHash!==actor)await store.setJSON(userPrefix(target.uid)+id,{auditKey:key});
}
async function roleStatus(store,uid){
 const result=await getCommunityAccess(store,{uid});return {...result,protected:!!result.role};
}
function normalizedUser(user){return {uid:user.uid,email:user.email||'',displayName:user.displayName||'',emailVerified:user.emailVerified===true};}
function commentView(comment,code){return {code,id:comment.id,parentId:comment.parentId||null,text:comment.deleted?'Bu yorum silindi':comment.text,name:comment.deleted?'Katılımcı':comment.name,
 ownerUid:comment.ownerUid||null,createdAt:comment.createdAt,updatedAt:comment.updatedAt,deleted:!!comment.deleted,hidden:!!comment.hidden,editedByAdmin:!!comment.editedByAdmin,moderatedAt:comment.moderatedAt||null,replyCount:comment.replyCount||0};}
async function queuePage(store,prefix,cursor){
 if(cursor!==undefined&&cursor!==null&&(typeof cursor!=='string'||!cursor.startsWith(prefix)||cursor.length>240))return null;
 return store.query(prefix,{cursor:cursor||null,limit:20,reverse:true});
}
async function privilegedRate(store,uid,now){
 const key='_ca_rate_'+hash(uid),record=await store.get(key,{type:'json'}),times=(record?.times||[]).filter(at=>now-at<60000&&at<=now);
 if(times.length>=60)return false;await store.setJSON(key,{times:[...times,now]});return true;
}
export async function handleCommunityAdmin(p,store,session,{auth,now=Date.now}={}){
 if(!session.uid)return adminFailure('Hesabına giriş yap.',401,'AUTH_REQUIRED');
 if(session.emailVerified!==true)return adminFailure('Yönetim için e-posta adresini doğrula.',403,'EMAIL_UNVERIFIED');
 if(await store.get(closedAccountKey(session.uid),{type:'json'}))return adminFailure('Hesap silme işlemi başladı.',409,'ACCOUNT_DELETING');
 let owner=await store.get('_ca_owner',{type:'json'});
 // Only trusted getUser() metadata reaches session.email. The immutable lock
 // outlives account erasure so a recycled mailbox cannot acquire ownership.
 if(!owner&&email(session.email)===COMMUNITY_OWNER_EMAIL){
  owner={uid:session.uid,createdAt:now()};await store.setJSON('_ca_owner',owner);await store.delete(restrictionKey(session.uid));
  await auditCommunityAction(store,'owner.bootstrap',session.uid,{uid:session.uid},{now});
 }
 const access=await getCommunityAccess(store,session),role=access.role,flags=permissions(role);
 if(p.action==='status')return json({role,owner:role==='owner',permissions:flags});
 if(!role)return adminFailure('Topluluk yönetimi için yetkin yok.',403,'ADMIN_REQUIRED');
 if(['roles','grantRole','revokeRole'].includes(p.action)&&role!=='owner')return adminFailure('Yetki atama/kaldırma yalnız ana sahibin işlemidir.',403,'OWNER_REQUIRED');
 if(p.action==='roles'){
  const result=await queuePage(store,'_ca_role_',p.cursor);if(!result)return adminFailure('Liste konumu geçersiz.',400,'INVALID_CURSOR');
  return json({roles:result.entries.map(({value})=>({uid:value.uid,email:value.email,role:value.role})),nextCursor:result.nextCursor});
 }
 if(p.action==='grantRole'){
  const targetEmail=email(p.email);if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)||!['admin','moderator'].includes(p.role))return adminFailure('E-posta veya yetki geçersiz.',400,'INVALID_ROLE');
  let target;try{target=await auth.getUserByEmail(targetEmail);}catch(e){if(e.code==='auth/user-not-found')return adminFailure('Bu e-posta ile kayıtlı hesap bulunamadı.',404,'USER_NOT_FOUND');throw e;}
  if(!target.emailVerified||target.disabled)return adminFailure('Hedef hesap kayıtlı, etkin ve e-postası doğrulanmış olmalı.',409,'TARGET_NOT_VERIFIED');
  if(target.uid===owner.uid)return adminFailure('Ana sahip rolü değiştirilemez.',409,'PROTECTED_USER');
  if(await store.get(closedAccountKey(target.uid),{type:'json'}))return adminFailure('Hedef hesap siliniyor.',409,'ACCOUNT_DELETING');
  if(!await privilegedRate(store,session.uid,now()))return adminFailure('Çok sık yönetim işlemi. Biraz bekle.',429,'ADMIN_RATE_LIMIT');
  await store.setJSON(roleKey(target.uid),{uid:target.uid,email:email(target.email),role:p.role,grantedAt:now()});
  await store.delete(restrictionKey(target.uid));await auditCommunityAction(store,'role.grant.'+p.role,session.uid,{uid:target.uid},{now});
  return json({ok:true,user:normalizedUser(target),role:p.role});
 }
 if(p.action==='revokeRole'){
  if(!uidValid(p.targetUid))return adminFailure('Hedef kullanıcı geçersiz.',400,'INVALID_USER');
  if(p.targetUid===owner.uid)return adminFailure('Ana sahip rolü kaldırılamaz.',409,'PROTECTED_USER');
  const old=await store.get(roleKey(p.targetUid),{type:'json'});
  if(old){await store.delete(roleKey(p.targetUid));await auditCommunityAction(store,'role.revoke',session.uid,{uid:p.targetUid},{now});}
  return json({ok:true,targetUid:p.targetUid});
 }
 if(p.action==='userLookup'){
  if(!flags.lookup)return adminFailure('E-posta ile arama bu yetkiye kapalı.',403,'ADMIN_REQUIRED');
  const targetEmail=email(p.email);if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail))return adminFailure('Tam e-posta adresi yaz.',400,'INVALID_EMAIL');
  let target;try{target=await auth.getUserByEmail(targetEmail);}catch(e){if(e.code==='auth/user-not-found')return adminFailure('Kayıtlı hesap bulunamadı.',404,'USER_NOT_FOUND');throw e;}
  return json({user:normalizedUser(target),...await roleStatus(store,target.uid)});
 }
 if(p.action==='restrictionStatus'||p.action==='setRestriction'){
  if(!uidValid(p.targetUid))return adminFailure('Hedef kullanıcı geçersiz.',400,'INVALID_USER');
  const target=await roleStatus(store,p.targetUid);
  if(p.action==='restrictionStatus')return json({user:{uid:p.targetUid},...target});
  if(p.communityBanned!==undefined&&typeof p.communityBanned!=='boolean'||p.commentsRestricted!==undefined&&typeof p.commentsRestricted!=='boolean'||p.communityBanned===undefined&&p.commentsRestricted===undefined)return adminFailure('Kısıtlama ayarı geçersiz.',400,'INVALID_RESTRICTION');
  if(p.communityBanned!==undefined&&!flags.communityBan)return adminFailure('Bu yetki yalnız yorum kısıtlaması yapabilir.',403,'ADMIN_REQUIRED');
  if(target.protected)return adminFailure('Ana sahip veya yetkili hesap kısıtlanamaz. Önce ana sahip yetkisini kaldırmalıdır.',409,'PROTECTED_USER');
  if(await store.get(closedAccountKey(p.targetUid),{type:'json'}))return adminFailure('Hedef hesap siliniyor.',409,'ACCOUNT_DELETING');
  try{await auth.getUser(p.targetUid);}catch(e){if(e.code==='auth/user-not-found')return adminFailure('Kayıtlı hesap bulunamadı.',404,'USER_NOT_FOUND');throw e;}
  const restriction={...target.restriction,...(p.communityBanned!==undefined?{communityBanned:p.communityBanned}:{}),...(p.commentsRestricted!==undefined?{commentsRestricted:p.commentsRestricted}:{})};
  if(!await privilegedRate(store,session.uid,now()))return adminFailure('Çok sık yönetim işlemi. Biraz bekle.',429,'ADMIN_RATE_LIMIT');
  if(restriction.communityBanned||restriction.commentsRestricted)await store.setJSON(restrictionKey(p.targetUid),restriction);else await store.delete(restrictionKey(p.targetUid));
  await auditCommunityAction(store,'restriction.set',session.uid,{uid:p.targetUid},{now});
  return json({ok:true,user:{uid:p.targetUid},restriction,protected:false,role:null});
 }
 if(p.action==='comments'||p.action==='reports'){
  const report=p.action==='reports',prefix=report?'_hc_global_r_':'_hc_global_c_',result=await queuePage(store,prefix,p.cursor);
  if(!result)return adminFailure('Liste konumu geçersiz.',400,'INVALID_CURSOR');
  const items=[];
  for(const {value}of result.entries){
   if(!codeValid(value.code)||!idValid(value.id))continue;
   if(report){
    const r=await store.get('_hc_'+value.code+'_reports_'+value.id,{type:'json'});if(!r)continue;
    const comment=await store.get('_hc_'+value.code+'_c_'+r.commentId,{type:'json'});
    items.push({code:value.code,id:r.id,commentId:r.commentId,reason:r.reason,createdAt:r.createdAt,comment:comment?commentView(comment,value.code):null});
   }else{
    const comment=await store.get('_hc_'+value.code+'_c_'+value.id,{type:'json'});if(comment)items.push(commentView(comment,value.code));
   }
  }
  return json({[report?'reports':'comments']:items,nextCursor:result.nextCursor});
 }
 if(p.action==='resolveReport'){
  if(!codeValid(p.code)||!idValid(p.id))return adminFailure('Bildirim geçersiz.',400,'INVALID_COMMENT');
  const report=await store.get('_hc_'+p.code+'_reports_'+p.id,{type:'json'});
  if(!report)return json({ok:true,replayed:true});
  if(!await privilegedRate(store,session.uid,now()))return adminFailure('Çok sık yönetim işlemi. Biraz bekle.',429,'ADMIN_RATE_LIMIT');
  await store.delete('_hc_'+p.code+'_reports_'+p.id);await store.delete('_hc_global_r_'+p.id+'_'+p.code);
  await auditCommunityAction(store,'report.resolve',session.uid,{comment:p.code+':'+p.id},{now});return json({ok:true});
 }
 if(p.action==='moderateComment'){
  if(!codeValid(p.code)||!idValid(p.id)||!['edit','delete','hide','show'].includes(p.operation))return adminFailure('Yorum işlemi geçersiz.',400,'INVALID_COMMENT');
  const key='_hc_'+p.code+'_c_'+p.id,comment=await store.get(key,{type:'json'});if(!comment)return adminFailure('Yorum bulunamadı.',404,'COMMENT_NOT_FOUND');
  if(comment.deleted&&p.operation!=='delete')return adminFailure('Silinmiş yorum değiştirilemez.',409,'COMMENT_DELETED');
  if(p.operation==='edit'&&(typeof p.text!=='string'||!p.text.trim()||p.text.length>1500||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(p.text)))return adminFailure('1–1500 karakterlik düz metin yaz.',400,'INVALID_TEXT');
  if(p.operation==='delete'&&comment.deleted||p.operation==='edit'&&comment.text===p.text.trim()||p.operation==='hide'&&comment.hidden||p.operation==='show'&&!comment.hidden)return json({ok:true,comment:commentView(comment,p.code),replayed:true});
  if(!await privilegedRate(store,session.uid,now()))return adminFailure('Çok sık yönetim işlemi. Biraz bekle.',429,'ADMIN_RATE_LIMIT');
  if(p.operation==='edit'){comment.text=p.text.trim();comment.editedByAdmin=true;}
  if(p.operation==='delete'){comment.deleted=true;comment.text='';comment.name='';}
  if(p.operation==='hide'||p.operation==='show')comment.hidden=p.operation==='hide';
  comment.updatedAt=now();comment.moderatedAt=now();await store.setJSON(key,comment);
  await auditCommunityAction(store,'comment.'+p.operation,session.uid,{uid:comment.ownerUid,comment:p.code+':'+p.id},{now});
  return json({ok:true,comment:commentView(comment,p.code)});
 }
 return adminFailure('Bilinmeyen yönetim işlemi.',400,'INVALID_ACTION');
}

export async function cleanupCommunityAccount(uid,{transaction=withOrgTransaction}={}){
 if(!uidValid(uid))throw Error('Account identity required');
 await transaction(async store=>{
  await store.setJSON(closedAccountKey(uid),{closedAt:Date.now()});
  await store.delete(roleKey(uid));await store.delete(restrictionKey(uid));await store.delete('_ca_rate_'+hash(uid));
 });
 let cursor=null;
 do{
  cursor=await transaction(async store=>{
   const batch=await store.query(userPrefix(uid),{cursor,limit:20});
   for(const {key,value}of batch.entries){
    if(typeof value.auditKey==='string'&&value.auditKey.startsWith('_ca_audit_')){
     const audit=await store.get(value.auditKey,{type:'json'});
     if(audit){if(audit.actor===hash(uid))audit.actor=null;if(audit.target===hash(uid))audit.target=null;await store.setJSON(value.auditKey,audit);}
    }
    await store.delete(key);
   }
   return batch.nextCursor;
  });
 }while(cursor);
 return {cleaned:true};
}
