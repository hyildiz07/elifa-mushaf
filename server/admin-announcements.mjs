import {randomBytes} from 'node:crypto';

const idPattern=/^[a-zA-Z0-9_-]{1,128}$/;
const clean=value=>typeof value==='string'?value.trim():'';
const invalidText=value=>/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value);
const fail=(error,errorCode,status=400)=>Response.json({error,errorCode},{status,headers:{'cache-control':'private, no-store'}});
const ok=data=>Response.json(data,{headers:{'cache-control':'private, no-store'}});

export async function handleAdminAnnouncements(action,p,db,{role,now=Date.now}={}){
 if(role!=='owner')return fail('Duyuruları yalnız uygulama sahibi yönetebilir.','OWNER_REQUIRED',403);
 if(!db)return fail('Duyuru hizmetine ulaşılamadı.','SERVICE_UNAVAILABLE',503);
 const collection=db.collection('duyurular');
 const legacy=db.collection('config').doc('duyuru'),legacyId='legacy-config';
 if(action==='announcements'){
  const [snapshot,old]=await Promise.all([collection.get(),legacy.get()]);
  const items=[...snapshot.docs.map(doc=>({...doc.data(),id:doc.id})),...(old.exists?[{...old.data(),id:legacyId}]:[])]
   .sort((a,b)=>(a.order??9999)-(b.order??9999)||(b.updatedAtMs||0)-(a.updatedAtMs||0))
   .slice(0,100).map(({id,baslik,mesaj,aktif,mode,startAt,endAt,order,updatedAtMs})=>({id,baslik:baslik||'',mesaj:mesaj||'',aktif:aktif!==false,mode:mode==='scheduled'?'scheduled':'once',startAt:startAt||0,endAt:endAt||0,order:order??10,updatedAtMs:updatedAtMs||0}));
  return ok({announcements:items});
 }
 if(!['saveAnnouncement','setAnnouncementActive','deleteAnnouncement'].includes(action))return fail('Duyuru işlemi geçersiz.','INVALID_ACTION');
 const id=clean(p.id);
 if(id&&!idPattern.test(id))return fail('Duyuru kimliği geçersiz.','INVALID_ANNOUNCEMENT');
 if(action==='saveAnnouncement'){
  const baslik=clean(p.baslik),mesaj=clean(p.mesaj),mode=p.mode==='scheduled'?'scheduled':'once';
  if(!baslik&&!mesaj||baslik.length>140||mesaj.length>3000||invalidText(baslik)||invalidText(mesaj))return fail('Başlık veya mesaj yaz. Başlık en çok 140, mesaj en çok 3000 karakter olabilir.','INVALID_ANNOUNCEMENT');
  if(p.mode!==undefined&&!['once','scheduled'].includes(p.mode))return fail('Zamanlama geçersiz.','INVALID_ANNOUNCEMENT');
  const startAt=mode==='scheduled'?Number(p.startAt):0,endAt=mode==='scheduled'?Number(p.endAt):0;
  if(mode==='scheduled'&&(!Number.isSafeInteger(startAt)||!Number.isSafeInteger(endAt)||endAt<=startAt))return fail('Başlangıç ve bitiş saatlerini kontrol et.','INVALID_ANNOUNCEMENT');
  const order=Number.isInteger(p.order)&&p.order>=0&&p.order<=9999?p.order:10;
  const nowMs=now(),key=id||randomBytes(12).toString('hex'),ref=key===legacyId?legacy:collection.doc(key);
  if(id&&!(await ref.get()).exists)return fail('Duyuru bulunamadı. Listeyi yenile.','ANNOUNCEMENT_NOT_FOUND',404);
  const data={id:key,baslik,mesaj,mode,startAt,endAt,order,aktif:p.aktif!==false,updatedAtMs:nowMs};
  await ref.set(data,{merge:!!id});
  return ok({ok:true,id:key});
 }
 if(!id)return fail('Önce bir duyuru seç.','INVALID_ANNOUNCEMENT');
 const ref=id===legacyId?legacy:collection.doc(id),found=await ref.get();
 if(!found.exists)return fail('Duyuru bulunamadı. Listeyi yenile.','ANNOUNCEMENT_NOT_FOUND',404);
 if(action==='setAnnouncementActive'){
  if(typeof p.active!=='boolean')return fail('Görünürlük seçimi geçersiz.','INVALID_ANNOUNCEMENT');
  await ref.update({aktif:p.active,updatedAtMs:now()});return ok({ok:true,id});
 }
 await ref.delete();return ok({ok:true,id});
}
