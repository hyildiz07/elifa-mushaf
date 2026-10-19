import {createHash,randomBytes} from 'node:crypto';
import {closedAccountKey} from './hatim-access.mjs';
import {withOrgTransaction} from './database.mjs';
import {getCommunityAccess,communityRestrictionError} from './community-admin.mjs';

const hash=value=>createHash('sha256').update(value).digest('hex');
const idValid=id=>typeof id==='string'&&/^\d{13}-[a-f0-9]{16}$/.test(id);
const codeValid=code=>typeof code==='string'&&/^[a-z0-9]{6}$/.test(code);
const key=(code,id)=>'_hc_'+code+'_c_'+id;
const rootPrefix=code=>'_hc_'+code+'_r_';
const replyPrefix=(code,id)=>'_hc_'+code+'_p_'+id+'_';
const userPrefix=uid=>'_hcu_'+hash(uid)+'_';
const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'private, no-store','vary':'Authorization, Origin','x-content-type-options':'nosniff'}});
const fail=(error,status=400,errorCode='COMMENT_INVALID')=>json({error,errorCode},status);
class CommentInputError extends Error{}
export const COMMENT_ACTIONS=new Set(['commentList','commentReplies','commentCreate','commentEdit','commentDelete','commentHide','commentReport','commentReports','commentResolveReport','commentSettings']);
export function verifiedMemberError(session){
 if(!session.uid)return fail('Bu özellik için hesabına giriş yap.',401,'AUTH_REQUIRED');
 if(session.emailVerified!==true)return fail('Bu özellik için e-posta adresini doğrula.',403,'EMAIL_UNVERIFIED');
 return null;
}
function cleanText(value,max,label){
 if(typeof value!=='string'||!value.trim()||value.length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value))throw new CommentInputError(label+' geçersiz.');
 return value.trim();
}
function view(comment,session,isAdmin){
 const own=!!session.uid&&comment.ownerUid===session.uid;
 const visible=!comment.deleted&&!comment.hidden;
 return {id:comment.id,parentId:comment.parentId||null,text:comment.deleted?'Bu yorum silindi':comment.hidden?'Bu yorum gizlendi':comment.text,
  name:visible?comment.name:'Katılımcı',createdAt:comment.createdAt,updatedAt:comment.updatedAt,
  deleted:!!comment.deleted,hidden:!!comment.hidden,replyCount:comment.replyCount||0,own,editedByAdmin:!!comment.editedByAdmin,moderatedAt:comment.moderatedAt||null,
  canEdit:own&&visible,canDelete:own&&!comment.deleted,canHide:!!isAdmin&&!comment.deleted,
  ...(isAdmin&&comment.hidden&&!comment.deleted?{moderatedText:comment.text}:{} )};
}
async function rateLimit(store,uid,kind,now){
 const rateKey='_hcu_rate_'+hash(uid),old=await store.get(rateKey,{type:'json'})||{};
 const windows={posts:86400000,mutations:60000,reports:3600000},limits={posts:50,mutations:30,reports:5};
 const times=(Array.isArray(old[kind])?old[kind]:[]).filter(at=>Number.isFinite(at)&&now-at<windows[kind]&&at<=now);
 if(times.length>=limits[kind]||(kind==='posts'&&(times.some(at=>now-at<3000)||times.filter(at=>now-at<600000).length>=10)))return false;
 await store.setJSON(rateKey,{...old,[kind]:[...times,now]});return true;
}
async function page(store,prefix,cursor){
 if(cursor!==undefined&&cursor!==null&&!idValid(cursor))throw new CommentInputError('Liste konumu geçersiz.');
 const result=await store.query(prefix,{cursor:cursor?prefix+cursor:null,limit:20,reverse:true});
 return {entries:result.entries,nextCursor:result.nextCursor?result.nextCursor.slice(prefix.length):null};
}
export async function handleHatimComments(p,store,session,org,isAdmin,{now=Date.now,makeId=()=>randomBytes(8).toString('hex')}={}){
 if(!COMMENT_ACTIONS.has(p.action))return null;
 if(org.type!=='hatim')return fail('Yorumlar yalnız hatim içindir.');
 const moderator=['commentHide','commentReports','commentResolveReport','commentSettings'].includes(p.action);
 if(moderator&&!isAdmin)return fail('Yalnız hatim yöneticisi bu işlemi yapabilir.',403,'COMMENT_FORBIDDEN');
 if(!moderator){const gate=verifiedMemberError(session);if(gate)return gate;}
 const communityAccess=await getCommunityAccess(store,session);
 if(['commentEdit','commentReport'].includes(p.action)){
  const restriction=communityRestrictionError(communityAccess,'comments');if(restriction)return restriction;
 }
 const code=p.code||org.code,timestamp=now();
 if(!codeValid(code))return fail('Hatim kodu geçersiz.');
 const meta=()=>({code,commentCount:org.commentCount||0,rootCommentCount:org.rootCommentCount||0,
  commentsClosed:!!org.commentsClosed,canComment:!!session.uid&&session.emailVerified===true&&!communityAccess.restriction.communityBanned&&!communityAccess.restriction.commentsRestricted&&!org.commentsClosed&&!org.archivedAt,isAdmin:!!isAdmin});
 const closed=()=>!!org.commentsClosed||!!org.archivedAt;
 const saveOrg=()=>store.setJSON(code,org);
 try{
  if(p.action==='commentSettings'){
   if(typeof p.closed!=='boolean')return fail('Yorum ayarı geçersiz.');
   org.commentsClosed=p.closed;await saveOrg();return json({...meta(),ok:true});
  }
  if(p.action==='commentList'||p.action==='commentReplies'){
   let prefix=rootPrefix(code);
   if(p.action==='commentReplies'){
    if(!idValid(p.parentId))return fail('Üst yorum geçersiz.');
    const parent=await store.get(key(code,p.parentId),{type:'json'});
    if(!parent||parent.parentId)return fail('Üst yorum bulunamadı.',404,'COMMENT_NOT_FOUND');
    prefix=replyPrefix(code,p.parentId);
   }
   const result=await page(store,prefix,p.cursor),comments=[];
   for(const entry of result.entries){const comment=await store.get(key(code,entry.value.id),{type:'json'});if(comment)comments.push(view(comment,session,isAdmin));}
   return json({...meta(),comments,nextCursor:result.nextCursor});
  }
  if(p.action==='commentReports'){
   const result=await page(store,'_hc_'+code+'_reports_',p.cursor),reports=[];
   for(const {value:r}of result.entries){
    const comment=await store.get(key(code,r.commentId),{type:'json'});
    reports.push({id:r.id,commentId:r.commentId,reason:r.reason,createdAt:r.createdAt,comment:comment?view(comment,session,true):null});
   }
   return json({code,reports,nextCursor:result.nextCursor});
  }
  if(p.action==='commentResolveReport'){
   if(!idValid(p.id))return fail('Bildirim kimliği geçersiz.');
   await store.delete('_hc_'+code+'_reports_'+p.id);
   await store.delete('_hc_global_r_'+p.id+'_'+code);
   return json({code,ok:true,resolved:true,id:p.id});
  }
  if(p.action==='commentCreate'){
   if(typeof p.operationId!=='string'||!/^[a-f0-9]{64}$/i.test(p.operationId))return fail('Yorum işlem anahtarı gerekli.');
   const text=cleanText(p.text,1500,'Yorum'),name=cleanText(p.name,60,'Ad');
   if(name.length<2||/[\r\n\t]/.test(name))return fail('2–60 karakterlik ad veya takma ad yaz.');
   const parentId=p.parentId??null;if(parentId!==null&&!idValid(parentId))return fail('Üst yorum geçersiz.');
   const operationKey='_hc_'+code+'_o_'+hash(session.uid)+'_'+hash(p.operationId.toLowerCase());
   const signature=hash(JSON.stringify({text,name,parentId})),previous=await store.get(operationKey,{type:'json'});
   if(previous){
    if(previous.signature!==signature)return fail('Bu işlem anahtarı başka yorumda kullanılmış. Yeni yorum başlat.',409,'COMMENT_OPERATION_CONFLICT');
    const comment=await store.get(key(code,previous.id),{type:'json'});
    return comment?json({...meta(),comment:view(comment,session,isAdmin),replayed:true}):fail('Önceki yorum artık bulunamadı.',409,'COMMENT_NOT_FOUND');
   }
   const restriction=communityRestrictionError(communityAccess,'comments');if(restriction)return restriction;
   if(closed())return fail('Bu hatimde yeni yorumlar kapalı.',409,'COMMENTS_CLOSED');
   if((org.commentCount||0)>=5000)return fail('Bu hatimin yorum sınırına ulaşıldı.',409,'COMMENT_LIMIT');
   let parent=null;
   if(parentId){
    parent=await store.get(key(code,parentId),{type:'json'});
    if(!parent||parent.parentId||parent.deleted||parent.hidden)return fail('Bu yoruma yeni yanıt eklenemez.',409,'COMMENT_PARENT_UNAVAILABLE');
    if((parent.replyCount||0)>=200)return fail('Bu yorumun yanıt sınırına ulaşıldı.',409,'COMMENT_LIMIT');
   }
   if(!await rateLimit(store,session.uid,'posts',timestamp))return fail('Çok sık yorum yazıyorsun. Biraz bekleyip yeniden dene.',429,'COMMENT_RATE_LIMIT');
   const id=String(timestamp).padStart(13,'0')+'-'+makeId();if(!idValid(id))throw Error('Yorum kimliği hazırlanamadı.');
   if(await store.get(key(code,id),{type:'json'}))throw Error('Yorum kimliği çakıştı.');
   const comment={id,parentId,text,name,createdAt:timestamp,updatedAt:timestamp,ownerUid:session.uid,deleted:false,hidden:false,replyCount:0};
   await store.setJSON(key(code,id),comment);
   await store.setJSON('_hc_global_c_'+id+'_'+code,{code,id});
   await store.setJSON(parentId?replyPrefix(code,parentId)+id:rootPrefix(code)+id,{id});
   await store.setJSON(operationKey,{id,signature});
   await store.setJSON(userPrefix(session.uid)+id+'_'+code,{kind:'comment',code,id,operationKey});
   if(parent){parent.replyCount=(parent.replyCount||0)+1;await store.setJSON(key(code,parentId),parent);}
   org.commentCount=(org.commentCount||0)+1;if(!parentId)org.rootCommentCount=(org.rootCommentCount||0)+1;
   org.lastActivity=timestamp;await saveOrg();return json({...meta(),comment:view(comment,session,isAdmin)},201);
  }
  if(!idValid(p.id))return fail('Yorum kimliği geçersiz.');
  const comment=await store.get(key(code,p.id),{type:'json'});
  if(!comment)return fail('Yorum bulunamadı.',404,'COMMENT_NOT_FOUND');
  if(p.action==='commentHide'){
   if(typeof p.hidden!=='boolean')return fail('Gizleme ayarı geçersiz.');
   if(comment.deleted)return fail('Silinmiş yorum değiştirilemez.',409,'COMMENT_DELETED');
   if(comment.hidden!==p.hidden){comment.hidden=p.hidden;comment.updatedAt=timestamp;await store.setJSON(key(code,p.id),comment);}
   return json({code,comment:view(comment,session,isAdmin)});
  }
  if(p.action==='commentReport'){
   if(comment.deleted)return fail('Silinmiş yorum bildirilemez.',409,'COMMENT_DELETED');
   const reason=cleanText(p.reason,500,'Bildirim nedeni'),lookupKey='_hc_'+code+'_reported_'+p.id+'_'+hash(session.uid);
   const prior=await store.get(lookupKey,{type:'json'});if(prior)return json({code,ok:true,replayed:true});
   if(!await rateLimit(store,session.uid,'reports',timestamp))return fail('Bildirim sınırına ulaştın. Daha sonra yeniden dene.',429,'COMMENT_RATE_LIMIT');
   const id=String(timestamp).padStart(13,'0')+'-'+makeId(),reportKey='_hc_'+code+'_reports_'+id;
   if(!idValid(id))throw Error('Bildirim kimliği hazırlanamadı.');
   await store.setJSON(reportKey,{id,commentId:p.id,reason,createdAt:timestamp,ownerUid:session.uid});
   const globalKey='_hc_global_r_'+id+'_'+code;await store.setJSON(globalKey,{code,id});
   await store.setJSON(lookupKey,{id});
   await store.setJSON(userPrefix(session.uid)+id+'_'+code,{kind:'report',key:reportKey,lookupKey,globalKey});
   return json({code,ok:true});
  }
  if(comment.ownerUid!==session.uid)return fail('Yalnız kendi yorumunu değiştirebilirsin.',403,'COMMENT_FORBIDDEN');
  if(p.action==='commentDelete'){
   if(!comment.deleted){
    if(!await rateLimit(store,session.uid,'mutations',timestamp))return fail('Çok sık işlem yapıyorsun. Biraz bekle.',429,'COMMENT_RATE_LIMIT');
    comment.deleted=true;comment.text='';comment.name='';comment.updatedAt=timestamp;await store.setJSON(key(code,p.id),comment);
   }
   return json({code,comment:view(comment,session,isAdmin)});
  }
  if(p.action==='commentEdit'){
   if(closed())return fail('Bu hatimde yorum düzenleme kapalı.',409,'COMMENTS_CLOSED');
   if(comment.deleted||comment.hidden)return fail('Bu yorum düzenlenemez.',409,'COMMENT_DELETED');
   const text=cleanText(p.text,1500,'Yorum');
   if(comment.text!==text){
    if(!await rateLimit(store,session.uid,'mutations',timestamp))return fail('Çok sık işlem yapıyorsun. Biraz bekle.',429,'COMMENT_RATE_LIMIT');
    comment.text=text;comment.updatedAt=timestamp;await store.setJSON(key(code,p.id),comment);
   }
   return json({code,comment:view(comment,session,isAdmin)});
  }
  return fail('Yorum işlemi geçersiz.');
 }catch(error){if(error instanceof CommentInputError)return fail(error.message);throw error;}
}

// The account deletion lock is read by every authenticated org request. Each
// bounded batch is retryable; a partial failure leaves its unprocessed index.
export async function anonymizeAccountComments(uid,{transaction=withOrgTransaction}={}){
 if(typeof uid!=='string'||!uid)throw Error('Account identity required');
 await transaction(store=>store.setJSON(closedAccountKey(uid),{closedAt:Date.now()}));
 let cursor=null,removed=0;
 do{
  const result=await transaction(async store=>{
   const batch=await store.query(userPrefix(uid),{cursor,limit:20});
   for(const {key:indexKey,value:entry}of batch.entries){
    if(entry.kind==='comment'&&codeValid(entry.code)&&idValid(entry.id)){
     const recordKey=key(entry.code,entry.id),comment=await store.get(recordKey,{type:'json'});
     if(comment?.ownerUid===uid){
      comment.ownerUid=null;comment.deleted=true;comment.text='';comment.name='';comment.updatedAt=Date.now();
      await store.setJSON(recordKey,comment);
     }
     if(typeof entry.operationKey==='string'&&entry.operationKey.startsWith('_hc_'+entry.code+'_o_'+hash(uid)+'_'))await store.delete(entry.operationKey);
    }else if(entry.kind==='report'){
     if(typeof entry.key==='string'&&entry.key.startsWith('_hc_')){
      const report=await store.get(entry.key,{type:'json'});if(report?.ownerUid===uid)await store.delete(entry.key);
     }
     if(typeof entry.lookupKey==='string'&&entry.lookupKey.endsWith('_'+hash(uid)))await store.delete(entry.lookupKey);
     if(typeof entry.globalKey==='string'&&entry.globalKey.startsWith('_hc_global_r_'))await store.delete(entry.globalKey);
    }
    await store.delete(indexKey);
   }
   return {nextCursor:batch.nextCursor,count:batch.entries.length};
  });
  removed+=result.count;cursor=result.nextCursor;
 }while(cursor);
 await transaction(store=>store.delete('_hcu_rate_'+hash(uid)));
 return {anonymized:true,removed};
}
