import {firebaseServices} from '../../server/firebase.mjs';
import {withOrgTransaction} from '../../server/database.mjs';
import {deploymentContext} from '../../server/deploy-context.mjs';
import {handleCommunityAdmin,adminFailure} from '../../server/community-admin.mjs';
import {handleAdminAnnouncements} from '../../server/admin-announcements.mjs';
const NATIVE='capacitor://localhost';
export function createCommunityAdminHandler({services=firebaseServices,transaction,environment=()=>process.env}={}){
 return async(req,runtime)=>{
  let deployment;try{deployment=deploymentContext(environment(),runtime);}catch{return adminFailure('Dağıtım ortamı doğrulanamadı.',503,'ENVIRONMENT_INVALID');}
  if(deployment.kind!=='production')return adminFailure('Önizlemede canlı topluluk yönetimi kapalıdır.',403,'PREVIEW_RESTRICTED');
  if(req.method!=='POST')return adminFailure('Yalnız POST.',405,'METHOD_NOT_ALLOWED');
  const origin=req.headers.get('origin');if(origin&&origin!==new URL(req.url).origin&&origin!==NATIVE)return adminFailure('Bu kaynaktan işlem yapılamıyor.',403,'ORIGIN_INVALID');
  const token=req.headers.get('authorization')?.match(/^Bearer (\S+)$/)?.[1];if(!token)return adminFailure('Hesabına giriş yap.',401,'AUTH_REQUIRED');
  let p;try{const text=await req.text();if(Buffer.byteLength(text)>16384)return adminFailure('İstek çok büyük.',413,'REQUEST_TOO_LARGE');p=JSON.parse(text);}catch{return adminFailure('İstek geçersiz.',400,'REQUEST_INVALID');}
  if(!p||typeof p!=='object'||Array.isArray(p)||typeof p.action!=='string')return adminFailure('İşlem gerekli.',400,'REQUEST_INVALID');
  let auth,user;
  try{auth=services().auth;const verified=await auth.verifyIdToken(token,true);user=await auth.getUser(verified.uid);if(user.disabled)return adminFailure('Oturum geçersiz.',401,'AUTH_REQUIRED');if(p.expectedUser!==user.uid)return adminFailure('Hesap değişti.',409,'ACCOUNT_CHANGED');}
  catch{return adminFailure('Oturum doğrulanamadı.',401,'AUTH_REQUIRED');}
  try{
   const session={uid:user.uid,email:user.email,emailVerified:user.emailVerified===true};
   const run=work=>transaction?transaction(work):withOrgTransaction(work,{environment:environment(),deployment,services});
   if(['announcements','saveAnnouncement','setAnnouncementActive','deleteAnnouncement'].includes(p.action)){
    const status=await run(store=>handleCommunityAdmin({action:'status'},store,session,{auth}));
    if(!status.ok)return status;
    const access=await status.json();
    return await handleAdminAnnouncements(p.action,p,services().db,{role:access.role});
   }
   return await run(store=>handleCommunityAdmin(p,store,session,{auth}));
  }catch{return adminFailure('Yönetim hizmetine ulaşılamadı. İşlemi yeniden kontrol et.',503,'SERVICE_UNAVAILABLE');}
 };
}
const handler=createCommunityAdminHandler();
export default async(req,context)=>{
 const native=req.headers.get('origin')===NATIVE;
 if(native&&req.method==='OPTIONS')return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':NATIVE,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, Authorization','Vary':'Origin'}});
 const result=await handler(req,context);if(!native)return result;
 const headers=new Headers(result.headers);headers.set('Access-Control-Allow-Origin',NATIVE);return new Response(result.body,{status:result.status,headers});
};
export const config={path:'/api/community-admin'};
