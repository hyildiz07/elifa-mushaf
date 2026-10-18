import {withOrgTransaction} from '../../server/database.mjs';
const DAY=86400000;
export function expired(o,now){
 if(o.archivedAt)return false;
 const complete=o.type==='hatim'?(o.items?.length>0&&o.items.every(i=>i.status==='okundu')):o.type==='zikir'&&o.hedef>0&&(o.contributions||[]).reduce((n,c)=>n+(+c.amount||0),0)>=o.hedef;
 return now-(o.lastActivity||o.createdAt||0)>(complete?7:60)*DAY;
}
export function createOrgCleanup({transaction=withOrgTransaction,now=Date.now}={}){return async()=>{
 const list=await transaction(store=>store.list());
 let archived=0,kept=0,errors=0;
 for(const {key}of list.blobs){
  if(key.startsWith('_')||key.startsWith('a_'))continue;
  try{
   const result=await transaction(async store=>{
    const o=await store.get(key,{type:'json'});
    if(!o?.type||!expired(o,now()))return false;
    const index=(await store.get('_index',{type:'json'}))||[];
    // Retain the organization, participant ownership and recovery keys. This is
    // housekeeping of discovery, not deletion of people's reading history.
    await store.setJSON(key,{...o,archivedAt:now(),public:false,publishedAt:0});
    await store.setJSON('_index',index.filter(item=>item.code!==key));return true;
   });
   if(result)archived++;else kept++;
  }catch{errors++;}
 }
 const summary={ok:errors===0,silinen:0,arsivlenen:archived,korunan:kept,hata:errors};
 console.log('[ELIFA temizlik]',JSON.stringify(summary));
 return Response.json(summary,{status:errors?500:200});
};}
export default createOrgCleanup();
export const config={schedule:'15 3 * * *'};
