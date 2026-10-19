import {createOrgHandler} from '../netlify/functions/org.mjs';
import {createCommunityAdminHandler} from '../netlify/functions/community-admin.mjs';
import {COMMUNITY_OWNER_EMAIL} from '../server/community-admin.mjs';

// Development-only fixture. This module is not copied into dist and never uses
// Firestore, Netlify Blobs or production Firebase credentials, even if inherited
// environment variables happen to contain them. Restarting drops every record.
export function createLocalOrgHandler({memberReview=false}={}){
 const code='test01',createdAt=Date.now();
 let records=new Map([
  ['_config',{discoverEnabled:true}],
  ['_index',[]],
  [code,{code,type:'hatim',title:'Yerel test hatmi · Gerçek katılım değildir',adminName:'Yerel önizleme',public:false,createdAt,lastActivity:createdAt,adminToken:'d'.repeat(32),items:Array.from({length:30},(_,i)=>({no:i+1,name:'',status:'bos',ts:0}))}],
  ['a_'+'d'.repeat(32),code]
 ]);
 if(memberReview){
  records.set('_index',[{code:'memb01',publishedAt:createdAt}]);
  records.set('memb01',{...structuredClone(records.get(code)),code:'memb01',title:'Birlikte okuyalım · Yerel deneme',public:true,publishedAt:createdAt,ownerUid:'review-organizer',adminToken:'e'.repeat(32)});
 }
 let queue=Promise.resolve();
 const transaction=work=>{
  const result=queue.then(async()=>{
   const pending=new Map([...records].map(([key,value])=>[key,structuredClone(value)]));
   const store={
    get:async key=>structuredClone(pending.get(key)??null),
    setJSON:async(key,value)=>pending.set(key,structuredClone(value)),
    set:async(key,value)=>pending.set(key,structuredClone(value)),
    delete:async key=>pending.delete(key),
    list:async()=>({blobs:[...pending.keys()].map(key=>({key}))}),
    query:async(prefix,{cursor=null,limit=20,reverse=false}={})=>{
     const keys=[...pending.keys()].filter(k=>k.startsWith(prefix)&&(!cursor||(reverse?k<cursor:k>cursor))).sort();
     if(reverse)keys.reverse();const selected=keys.slice(0,limit);
     return {entries:selected.map(key=>({key,value:structuredClone(pending.get(key))})),nextCursor:keys.length>limit?selected.at(-1):null};
    }
   };
   const value=await work(store);records=pending;return value;
  });
  queue=result.catch(()=>{});return result;
 };
 // Exercise the real guest handler against this injected memory transaction,
 // independently of whichever CONTEXT the build running these tests inherited.
 const fixtureUsers=new Set(['review-organizer','review-member','review-unverified']);
 const services=()=>{
  if(!memberReview)throw Error('Local guest fixture must never initialize Firebase');
  const user=uid=>({uid,email:uid==='review-organizer'?COMMUNITY_OWNER_EMAIL:uid+'@example.test',displayName:uid==='review-organizer'?'Ayşe':'Mehmet',disabled:false,emailVerified:uid!=='review-unverified'});
  return {auth:{verifyIdToken:async token=>{const uid=token.replace(/^local-fixture-only:/,'');if(!token.startsWith('local-fixture-only:')||!fixtureUsers.has(uid))throw Error('Invalid local fixture');return {uid};},getUser:async uid=>{if(!fixtureUsers.has(uid))throw Error('No local user');return user(uid);},getUserByEmail:async email=>{const uid=[...fixtureUsers].find(id=>user(id).email===email);if(!uid)throw Object.assign(Error('No local user'),{code:'auth/user-not-found'});return user(uid);}}};
 };
 const options={environment:()=>({CONTEXT:'production'}),transaction,services};
 const handler=createOrgHandler(options),adminHandler=createCommunityAdminHandler(options);
 return async req=>{
  if(!memberReview&&req.headers.has('authorization'))return Response.json({error:'Bu yerel hatim önizlemesi yalnız misafir testi içindir. Hesaptan çıkıp yeniden dene.',localTest:true},{status:401,headers:{'cache-control':'no-store','x-elifa-local-test':'memory-only'}});
  const response=await (new URL(req.url).pathname.endsWith('/community-admin')?adminHandler:handler)(req),data=await response.json();
  return Response.json({...data,localTest:true,localTestNotice:'Yerel test verisi. Gerçek katılım değildir; sunucu yeniden başlayınca sıfırlanır.'},{status:response.status,headers:{...Object.fromEntries(response.headers),'x-elifa-local-test':'memory-only'}});
 };
}
