import {createOrgHandler} from '../netlify/functions/org.mjs';

// Development-only fixture. This module is not copied into dist and never uses
// Firestore, Netlify Blobs or production Firebase credentials, even if inherited
// environment variables happen to contain them. Restarting drops every record.
export function createLocalOrgHandler(){
 const code='test01',createdAt=Date.now();
 let records=new Map([
  ['_config',{discoverEnabled:true}],
  ['_index',[{code,publishedAt:createdAt}]],
  [code,{code,type:'hatim',title:'Yerel test hatmi · Gerçek katılım değildir',adminName:'Yerel önizleme',public:true,publishedAt:createdAt,createdAt,lastActivity:createdAt,adminToken:'d'.repeat(32),items:Array.from({length:30},(_,i)=>({no:i+1,name:'',status:'bos',ts:0}))}],
  ['a_'+'d'.repeat(32),code]
 ]);
 let queue=Promise.resolve();
 const transaction=work=>{
  const result=queue.then(async()=>{
   const pending=new Map([...records].map(([key,value])=>[key,structuredClone(value)]));
   const store={
    get:async key=>structuredClone(pending.get(key)??null),
    setJSON:async(key,value)=>pending.set(key,structuredClone(value)),
    set:async(key,value)=>pending.set(key,structuredClone(value)),
    delete:async key=>pending.delete(key),
    list:async()=>({blobs:[...pending.keys()].map(key=>({key}))})
   };
   const value=await work(store);records=pending;return value;
  });
  queue=result.catch(()=>{});return result;
 };
 // Exercise the real guest handler against this injected memory transaction,
 // independently of whichever CONTEXT the build running these tests inherited.
 const handler=createOrgHandler({environment:()=>({CONTEXT:'production'}),transaction,services(){throw Error('Local guest fixture must never initialize Firebase');}});
 return async req=>{
  if(req.headers.has('authorization'))return Response.json({error:'Bu yerel hatim önizlemesi yalnız misafir testi içindir. Hesaptan çıkıp yeniden dene.',localTest:true},{status:401,headers:{'cache-control':'no-store','x-elifa-local-test':'memory-only'}});
  const response=await handler(req),data=await response.json();
  return Response.json({...data,localTest:true,localTestNotice:'Yerel test verisi. Gerçek katılım değildir; sunucu yeniden başlayınca sıfırlanır.'},{status:response.status,headers:{...Object.fromEntries(response.headers),'x-elifa-local-test':'memory-only'}});
 };
}
