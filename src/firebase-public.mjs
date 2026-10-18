import {app,db,isLocal,isPreview} from './firebase-client.mjs';
import {collection,query,where,getDocs,getDoc,doc} from 'firebase/firestore';
import {createUsageReporter,isMeasurementHost} from './usage-analytics.mjs';
window.__elifaFBTried=true;
const usage=isPreview?null:createUsageReporter();
const measure=!isPreview&&!isLocal&&isMeasurementHost(location.hostname,{nativeIOS:!!window.ELIFA_NATIVE_IOS});
const early=Array.isArray(window.__elifaEarlyUsage)?window.__elifaEarlyUsage:[];
window.__elifaEarlyUsage=[];
window.elifaLog=(event,params)=>{if(measure)usage.track(event,params);};
window.elifaStat=key=>{if(measure)usage.track(key);};
if(measure)for(const [event,params] of early)usage.track(event,params);
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
if(!isPreview&&!isLocal)announcements();
if(measure)import('firebase/analytics').then(async({isSupported,getAnalytics,logEvent})=>{
 if(!await isSupported())return;
 const analytics=getAnalytics(app);
 usage.ready((event,params)=>{try{logEvent(analytics,event,params);}catch{}});
 window.elifaLog('app_open');
}).catch(()=>{});
// Guest access no longer writes shared Firestore counters with anonymous credentials.
