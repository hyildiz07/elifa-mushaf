import {withOrgTransaction} from '../../server/database.mjs';
const DAY=86400000;
export function expired(o,now){
 const complete=o.type==='hatim'?(o.items?.length>0&&o.items.every(i=>i.status==='okundu')):o.type==='zikir'&&o.hedef>0&&(o.contributions||[]).reduce((n,c)=>n+(+c.amount||0),0)>=o.hedef;
 return now-(o.lastActivity||o.createdAt||0)>(complete?7:60)*DAY;
}
export default async()=>{
 const list=await withOrgTransaction(store=>store.list());
 let removed=0,kept=0,errors=0;
 for(const {key}of list.blobs){
  if(key.startsWith('_')||key.startsWith('a_'))continue;
  try{
   const result=await withOrgTransaction(async store=>{
    const o=await store.get(key,{type:'json'});
    if(!o?.type||!expired(o,Date.now()))return false;
    const index=(await store.get('_index',{type:'json'}))||[];
    await store.delete(key);if(o.adminToken)await store.delete('a_'+o.adminToken);
    await store.setJSON('_index',index.filter(item=>item.code!==key));return true;
   });
   if(result)removed++;else kept++;
  }catch{errors++;}
 }
 const summary={ok:errors===0,silinen:removed,korunan:kept,hata:errors};
 console.log('[ELIFA temizlik]',JSON.stringify(summary));
 return Response.json(summary,{status:errors?500:200});
};
export const config={schedule:'15 3 * * *'};
