import {app,db,isLocal} from './firebase-client.mjs';
import {collection,query,where,getDocs,getDoc,doc} from 'firebase/firestore';
window.__elifaFBTried=true;
window.__elifaStat=window.__elifaStat||{};
window.elifaStat=k=>{window.__elifaStat[k]=(window.__elifaStat[k]||0)+1;};
window.elifaLog=()=>{};
// Public announcements do not require, create, or change the reader's account.
async function announcements(){
 try{
  const result=await getDocs(query(collection(db,'duyurular'),where('aktif','==',true)));
  let items=result.docs.map(d=>({...d.data(),id:String(d.data().id||d.id)}));
  const now=Date.now();
  const active=d=>d.aktif!==false&&(d.baslik||d.mesaj)&&(d.mode!=='scheduled'||((!d.startAt||now>=d.startAt)&&(!d.endAt||now<=d.endAt)));
  items=items.filter(active).sort((a,b)=>(a.order??9999)-(b.order??9999)||(b.updatedAtMs||0)-(a.updatedAtMs||0));
  if(!items.length){const old=await getDoc(doc(db,'config','duyuru'));if(old.exists()&&active(old.data()))items=[old.data()];}
  if(!items.length){window.elifaCheckStaticDuyuru?.();return;}
  window.elifaSetDuyurular?.(items);
  let seen=[];try{seen=JSON.parse(localStorage.getItem('elifaDuyuruSeenV2')||'[]');if(!Array.isArray(seen))seen=[];seen.push(localStorage.getItem('elifaDuyuruSeen'));}catch{}
  const unread=items.filter(d=>!seen.includes(String(d.id||d.baslik||''))).slice(0,3);
  if(unread.length)window.elifaShowDuyuru?.(unread);
  window.__elifaDuyuruHandled=true;
 }catch{window.elifaCheckStaticDuyuru?.();}
}
if(!isLocal)announcements();
if(!isLocal)import('firebase/analytics').then(async({isSupported,getAnalytics,logEvent})=>{
 if(!await isSupported())return;
 const analytics=getAnalytics(app);
 window.elifaLog=(event,params={})=>{try{logEvent(analytics,event,params);}catch{}};
 window.elifaStat=key=>{if(/^[a-z][a-z0-9_]{0,35}$/.test(key))window.elifaLog(key);};
 window.elifaLog('app_open');
}).catch(()=>{});
// Guest access no longer writes shared Firestore counters with anonymous credentials.
