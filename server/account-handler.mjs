import {randomUUID} from 'node:crypto';
import {validateBackup,MAX_BACKUP_BYTES} from '../src/account-data.mjs';
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store','Vary':'Authorization','X-Content-Type-Options':'nosniff'}});
const fail=(error,status)=>json({error},status);
const NATIVE_ORIGIN='capacitor://localhost';
function nativeCors(response){
  const headers=new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin',NATIVE_ORIGIN);
  headers.set('Vary','Authorization, Origin');
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}
export function verifyRequestOrigin(req){
  const origin=req.headers.get('origin');
  if(origin&&origin!==new URL(req.url).origin&&origin!==NATIVE_ORIGIN)throw Object.assign(Error('origin'),{status:403});
}
export function createAccountHandler({services,now=Date.now}){
  const handle=async req=>{
    try{
      if(req.method!=='POST')return fail('Yöntem desteklenmiyor.',405);
      verifyRequestOrigin(req);
      const token=req.headers.get('authorization')?.match(/^Bearer (\S+)$/)?.[1];
      if(!token)return fail('Önce giriş yapın.',401);
      const {auth,db}=services();
      const session=await auth.verifyIdToken(token,true);
      const user=await auth.getUser(session.uid);
      if(user.disabled)return fail('Oturum geçersiz.',401);
      if(!req.headers.get('content-type')?.startsWith('application/json'))return fail('JSON gerekli.',415);
      const text=await req.text();
      if(Buffer.byteLength(text)>MAX_BACKUP_BYTES+4096)return fail('İstek çok büyük.',413);
      let p;try{p=JSON.parse(text);}catch{return fail('Geçersiz istek.',400);}
      if(!p||typeof p!=='object'||Array.isArray(p))return fail('Geçersiz istek.',400);
      const uid=session.uid;
      if(p.expectedUser!==uid)return fail('Hesap değişti. Yeniden kontrol edin.',409);
      const profile=db.collection('elifaAccounts').doc(uid),backups=profile.collection('backups'),sync=profile.collection('sync').doc('current');
      if(p.action==='deleteAccount'){
        const age=now()/1000-session.auth_time;
        if(p.confirmation!=='DELETE'||!Number.isFinite(age)||age<0||age>300)return fail('Hesabı silmek için yeniden giriş yapın.',403);
        // The marker blocks concurrent saves; failed Auth deletions can be retried.
        await db.runTransaction(async tx=>{
          const docs=await tx.get(backups);
          await tx.get(sync);
          tx.set(profile,{deleting:true});
          docs.forEach(d=>tx.delete(d.ref));
          tx.delete(sync);
        });
        await auth.deleteUser(uid);
        await profile.delete();
        return json({ok:true});
      }
      if(!user.emailVerified)return fail('Bulut yedekleri için e-posta adresinizi doğrulayın.',403);
      return await db.runTransaction(async tx=>{
        const state=await tx.get(profile);
        if(state.data()?.deleting)return fail('Hesap silme işlemi tamamlanmalı. Silmeyi yeniden deneyin.',409);
        if(p.action==='list'){
          const result=await tx.get(backups.orderBy('created_at','desc'));
          return json({backups:result.docs.map(d=>({id:d.id,created_at:d.data().created_at}))});
        }
        if(p.action==='syncGet'){
          const current=await tx.get(sync),data=current.data();
          return json({revision:data?.revision||0,updated_at:data?.updated_at||null,payload:data?validateBackup(JSON.parse(data.payload)):null});
        }
        if(p.action==='syncPut'){
          if(!Number.isSafeInteger(p.revision)||p.revision<0)return fail('Geçersiz eşitleme sürümü.',400);
          let payload;try{payload=validateBackup(p.payload);}catch(e){return fail(e.message,400);}
          const serialized=JSON.stringify(payload);
          if(Buffer.byteLength(serialized)>900*1024)return fail('Bulut verisi 900 KB sınırını aşıyor. Dosya olarak cihazınıza aktarın.',413);
          const current=await tx.get(sync),revision=current.data()?.revision||0;
          if(revision!==p.revision)return fail('Başka cihazdaki değişiklikler önce birleştirilmeli.',409);
          const updated_at=new Date(now()).toISOString();
          tx.set(profile,{deleting:false,updated_at});
          tx.set(sync,{revision:revision+1,updated_at,payload:serialized});
          return json({revision:revision+1,updated_at});
        }
        if(p.action==='save'){
          let payload;try{payload=validateBackup(p.payload);}catch(e){return fail(e.message,400);}
          const serialized=JSON.stringify(payload);
          if(Buffer.byteLength(serialized)>900*1024)return fail('Bulut yedeği 900 KB sınırını aşıyor. Dosya olarak cihazınıza aktarın.',413);
          const current=await tx.get(backups.select());
          if(current.size>=20)return fail('20 yedek sınırına ulaştınız. Önce eski bir yedeği silin.',409);
          const id=randomUUID();
          tx.set(profile,{deleting:false,updated_at:new Date(now()).toISOString()});
          tx.create(backups.doc(id),{created_at:new Date(now()).toISOString(),payload:serialized});
          return json({ok:true,id},201);
        }
        if(!['restore','deleteBackup'].includes(p.action)||! /^[0-9a-f-]{36}$/i.test(p.id||''))return fail('Geçersiz işlem.',400);
        const ref=backups.doc(p.id),found=await tx.get(ref);
        if(p.action==='restore')return found.exists?json({payload:validateBackup(JSON.parse(found.data().payload))}):fail('Yedek bulunamadı.',404);
        tx.delete(ref);return json({ok:true});
      });
    }catch(error){
      if(error.status===403)return fail('Bu işlem için yetki doğrulanamadı.',403);
      if(/^auth\/(id-token|argument-error|invalid-id-token|user-not-found|user-disabled)/.test(error.code||''))return fail('Oturum geçersiz. Yeniden giriş yapın.',401);
      return fail('Hesap hizmetine ulaşılamadı. İşlem tamamlandı sayılmadı; tekrar deneyin.',503);
    }
  };
  return async req=>{
    const native=req.headers.get('origin')===NATIVE_ORIGIN;
    if(native&&req.method==='OPTIONS')return new Response(null,{status:204,headers:{
      'Access-Control-Allow-Origin':NATIVE_ORIGIN,
      'Access-Control-Allow-Methods':'POST, OPTIONS',
      'Access-Control-Allow-Headers':'Authorization, Content-Type',
      'Access-Control-Max-Age':'3600',
      'Vary':'Origin'
    }});
    const response=await handle(req);
    return native?nativeCors(response):response;
  };
}
