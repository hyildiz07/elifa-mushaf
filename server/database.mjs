import {getStore} from '@netlify/blobs';
import {firebaseServices} from './firebase.mjs';
import {deploymentContext} from './deploy-context.mjs';
export async function firestoreStoreTransaction(db,legacy,work,{records:recordCollection}={}){
 return db.runTransaction(async tx=>{
  // Firestore retries conflicts on the actual records read in this transaction.
  // An application-wide write lock would needlessly make unrelated hatims,
  // polls and account membership indexes contend with one another. Reading a
  // missing record also protects simultaneous legacy imports / random codes.
  const records=recordCollection||db.collection('elifaOrgRecords'),pending=new Map(),reads=new Map();
  const ref=key=>records.doc(Buffer.from(key).toString('base64url'));
  const store={
   async get(key,options={}){
    if(pending.has(key)){const d=pending.get(key);return d.deleted?null:JSON.parse(d.value);}
    if(reads.has(key))return structuredClone(reads.get(key));
    const found=await tx.get(ref(key));let value;
    if(found.exists){const d=found.data();value=d.deleted?null:JSON.parse(d.value);}
    else{
     // These private indexes were introduced after the Firestore cutover and
     // have never lived in Blobs. Avoid a redundant legacy network lookup on
     // every signed-in poll / first membership / creation replay check.
     value=/^_(?:closed|member|create)_/.test(key)?null:await legacy.get(key,{type:options.type==='text'?'text':'json'});
     if(value!=null)pending.set(key,{key,deleted:false,value:JSON.stringify(value)});
    }
    reads.set(key,value);return structuredClone(value);
   },
   async setJSON(key,value){const serialized=JSON.stringify(value);if(Buffer.byteLength(serialized)>900*1024)throw Error('Record size limit');pending.set(key,{key,value:serialized,deleted:false});},
   async set(key,value){return this.setJSON(key,value);},
   async delete(key){pending.set(key,{key,value:'null',deleted:true});},
   async list(){
    const keys=new Set();let cursor;
    do{const old=await legacy.list({cursor});for(const b of old.blobs)keys.add(b.key);cursor=old.cursor;}while(cursor);
    const current=await tx.get(records.select('key','deleted'));
    for(const d of current.docs){const row=d.data();if(row.deleted)keys.delete(row.key);else keys.add(row.key);}
    for(const [key,row]of pending){if(row.deleted)keys.delete(key);else keys.add(key);}
    return {blobs:[...keys].map(key=>({key}))};
   }
  };
  const result=await work(store);
  if(pending.size>450)throw Error('Transaction record limit');
  // Buffer writes until all reads finish, as Firestore transactions require.
  for(const [key,value]of pending)tx.set(ref(key),value);
  return result;
 },{maxAttempts:8});
}
const noLegacy={get:async()=>null,list:async()=>({blobs:[]})};
export async function withOrgTransaction(work,{environment=process.env,services=firebaseServices,legacyStore=()=>getStore({name:'elifa-birlikte',consistency:'strong'})}={}){
 const context=deploymentContext(environment);
 if(context.kind==='preview'){
  const db=services().db;
  const records=db.collection('elifaOrgPreviewRuns').doc(context.scope).collection('records');
  return firestoreStoreTransaction(db,noLegacy,store=>work({...store,get:async(key,options)=>{
   const value=await store.get(key,options);
   return key==='_config'&&value===null?{discoverEnabled:true}:value;
  }}),{records});
 }
 if(environment.ELIFA_FIRESTORE_GROUPS!=='enabled')throw Error('Firestore group cutover has not been enabled');
 return firestoreStoreTransaction(services().db,legacyStore(),work);
}
