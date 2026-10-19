import {firebaseServices} from '../../server/firebase.mjs';
import {createAccountHandler} from '../../server/account-handler.mjs';
import {releaseAccountHatimOwnership} from '../../server/hatim-account.mjs';
import {deploymentContext} from '../../server/deploy-context.mjs';
import {withOrgTransaction} from '../../server/database.mjs';
export function createDeployedAccountHandler({services=firebaseServices,detachMemberships,environment=()=>process.env}={}){
 return async(req,runtime)=>{
  let context;try{context=deploymentContext(environment(),runtime);}catch{return Response.json({error:'Dağıtım ortamı doğrulanamadı. Hesap hizmeti açılmadı.'},{status:503,headers:{'cache-control':'private, no-store'}});}
  if(context.kind==='preview')return Response.json({error:'Bu önizlemede canlı hesap, profil ve bulut işlemleri kapalıdır. Hesap işlemleri için canlı uygulamayı kullan.',preview:true},{status:403,headers:{'cache-control':'private, no-store','vary':'Authorization, Origin'}});
  const detach=detachMemberships||(uid=>releaseAccountHatimOwnership(uid,{transaction:work=>withOrgTransaction(work,{environment:environment(),deployment:context,services})}));
  const handler=createAccountHandler({services,detachMemberships:detach});
  return handler(req);
 };
}
export default createDeployedAccountHandler();
export const config={path:'/api/account'};
