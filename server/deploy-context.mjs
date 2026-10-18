export const PREVIEW_NOTICE='Önizleme: Buradaki hatim ve cüzler deneme içindir; canlı kayıtlarını etkilemez.';

export function deploymentContext(env=process.env){
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
