import {withOrgTransaction} from './database.mjs';
import {membershipKey,closedAccountKey} from './hatim-access.mjs';

// Called only from the explicit account deletion flow AFTER its deletion lock.
// Each group is detached independently, while the index remains until all work
// succeeds. Retrying a partial failure is safe. No group/claim/admin link is lost.
export async function releaseAccountHatimOwnership(uid,{transaction=withOrgTransaction,anonymize=true}={}){
 if(typeof uid!=='string'||!uid)throw Error('Account identity required');
 const key=membershipKey(uid);
 const codes=await transaction(async store=>{
  // Every authenticated org mutation reads this marker inside its transaction.
  // It survives Auth deletion so already verified in-flight requests cannot
  // create orphan memberships after the account deletion flow has passed them.
  await store.setJSON(closedAccountKey(uid),{closedAt:Date.now()});
  const index=await store.get(key,{type:'json'});
  return Array.isArray(index?.codes)?[...new Set(index.codes)]:[];
 });
 for(const code of codes)await transaction(async store=>{
  const org=await store.get(code,{type:'json'});if(!org)return;
  let changed=false;
  if(org.ownerUid===uid){
   delete org.ownerUid;if(anonymize)org.adminName='';changed=true;
   if(org.creationKey){
    const creation=await store.get(org.creationKey,{type:'json'});
    if(creation?.ownerUid===uid){delete creation.ownerUid;await store.setJSON(org.creationKey,creation);}
   }
  }
  for(const item of org.items||[]){
   if(item.ownerUid===uid){delete item.ownerUid;if(anonymize)item.name='Katılımcı';changed=true;}
   if(item.releasedUid===uid){delete item.releasedUid;changed=true;}
  }
  if(changed)await store.setJSON(code,org);
 });
 await transaction(store=>store.delete(key));
 return {detached:true};
}
