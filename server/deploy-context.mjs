export const PREVIEW_NOTICE='Önizleme: Buradaki hatim ve cüzler deneme içindir; canlı kayıtlarını etkilemez.';

export function deploymentContext(env=process.env,runtime){
 // Netlify's second function argument is authoritative at runtime. CONTEXT and
 // REVIEW_ID are build variables and need not exist inside a deployed function.
 // Never derive this from a request URL, header, cookie or JSON field.
 if(runtime!==undefined){
  const deploy=runtime?.deploy;
  if(!deploy||typeof deploy!=='object')throw Error('Runtime deployment metadata is missing');
  if(deploy.context==='production')return {kind:'production'};
  if(deploy.context==='deploy-preview'){
   if(typeof deploy.id!=='string'||!/^[a-f0-9]{24}$/i.test(deploy.id))throw Error('Runtime preview deployment identifier is invalid');
   return {kind:'preview',scope:'deploy-'+deploy.id.toLowerCase()};
  }
  throw Error('Runtime deployment context is not permitted');
 }
 const context=env.CONTEXT||'';
 const hasReview=typeof env.REVIEW_ID==='string'&&env.REVIEW_ID.length>0;
 const previewHint=hasReview||env.PULL_REQUEST==='true'||/^https:\/\/deploy-preview-\d+--/.test(env.DEPLOY_PRIME_URL||'');
 if(context==='deploy-preview'){
  if(hasReview){
   if(!/^[1-9]\d{0,9}$/.test(env.REVIEW_ID))throw Error('Invalid preview review identifier');
   return {kind:'preview',scope:'review-'+env.REVIEW_ID};
  }
  if(typeof env.DEPLOY_ID==='string'&&/^[a-f0-9]{24}$/i.test(env.DEPLOY_ID))return {kind:'preview',scope:'deploy-'+env.DEPLOY_ID.toLowerCase()};
  throw Error('Preview isolation identifier is missing');
 }
 // Preserve the original production gate when Netlify does not inject CONTEXT,
 // but never let a contradictory PR hint fall through to the production store.
 if((context===''||context==='production')&&!previewHint)return {kind:'production'};
 throw Error('Deployment context is not permitted for production data');
}

export async function previewResponse(response,context){
 if(context.kind!=='preview')return response;
 const data=await response.json();
 return Response.json({...data,preview:true,previewNotice:PREVIEW_NOTICE},{status:response.status,headers:response.headers});
}
