import {BACKUP_KEYS,PREVIOUS_KEY,JOURNAL_KEY,SYNC_BASE_PREFIX,collectBackup,validateBackup,restoreBackup,mergeBackups} from './account-data.mjs';

export const WORKSPACE_OWNER='elifa.workspace.owner.v1';
export const WORKSPACE_PREFIX='elifa.workspace.v1.';
const guest='guest';
const deviceKeys=['duaPracticeV1','duaFav','duaFavT'];
const keyFor=owner=>WORKSPACE_PREFIX+encodeURIComponent(owner);
const empty=()=>({elifa:'yedek',v:1,veri:{}});

// Preference failures must not break sign-in. Cloud operations separately require
// a durable, verified workspace; this memory fallback never claims persistence.
export function createSafeStorage(getStorage,onFailure=()=>{}){
 const memory=new Map();let failed=false;
 const fail=error=>{failed=true;onFailure(error);};
 return {
  get failed(){return failed;},
  getItem(key){if(memory.has(key))return memory.get(key);try{return getStorage().getItem(key);}catch(e){fail(e);return null;}},
  setItem(key,value){value=String(value);memory.set(key,value);try{getStorage().setItem(key,value);if(getStorage().getItem(key)!==value)throw Error('Kayıt doğrulanamadı.');memory.delete(key);return true;}catch(e){fail(e);return false;}},
  removeItem(key){memory.set(key,null);try{getStorage().removeItem(key);if(getStorage().getItem(key)!==null)throw Error('Kayıt silinemedi.');memory.delete(key);return true;}catch(e){fail(e);return false;}}
 };
}

export function createAccountWorkspaces(storage,readActive=key=>storage.getItem(key)){
 const checked=(key,value)=>{
  if(value===null)storage.removeItem(key);else storage.setItem(key,value);
  if(storage.getItem(key)!==value)throw Error('Cihazdaki hesap kayıtları güvenle ayrılamadı.');
 };
 const activeOwner=()=>storage.getItem(WORKSPACE_OWNER)||guest;
 const snapshot=()=>({payload:collectBackup({getItem:readActive}),previous:storage.getItem(PREVIOUS_KEY),device:Object.fromEntries(deviceKeys.map(k=>[k,readActive(k)]))});
 function unpack(raw){
  if(!raw)return {payload:empty(),previous:null,device:{}};
  const v=JSON.parse(raw),device={};
  for(const key of deviceKeys){const item=v.device?.[key];if(item!==null&&item!==undefined){if(typeof item!=='string'||item.length>1024*1024)throw Error('Cihazdaki dua kaydı geçersiz.');JSON.parse(item);device[key]=item;}}
  return {payload:validateBackup(v.payload),previous:typeof v.previous==='string'?v.previous:null,device};
 }
 function apply(value){
  restoreBackup(storage,value.payload);
  for(const key of deviceKeys)checked(key,value.device?.[key]??null);
  checked(PREVIOUS_KEY,value.previous);checked(JOURNAL_KEY,null);
 }
 function activate(uid){
  const next=uid||guest,previousOwner=activeOwner();
  if(next===previousOwner)return false;
  const before=snapshot(),targetRaw=storage.getItem(keyFor(next)),target=unpack(targetRaw),oldBase=storage.getItem(SYNC_BASE_PREFIX+next);
  // Save the complete old workspace before changing any active data. If quota
  // prevents this, refuse the switch instead of losing the previous reader.
  checked(keyFor(previousOwner),JSON.stringify(before));
  try{apply(target);if(!targetRaw)checked(SYNC_BASE_PREFIX+next,null);checked(WORKSPACE_OWNER,next);}
  catch(error){try{apply(before);checked(SYNC_BASE_PREFIX+next,oldBase);checked(WORKSPACE_OWNER,previousOwner);}catch{throw Error('Hesap değişimi tamamlanamadı. Sayfayı kapatmadan cihazında yer açıp yeniden dene.');}throw error;}
  return true;
 }
 function guestImport(uid,resolutions={}){
  if(!uid||activeOwner()!==uid)throw Error('Önce kendi hesabına giriş yap.');
  const archived=unpack(storage.getItem(keyFor(guest))),current=snapshot();
  const result=mergeBackups(null,current.payload,archived.payload,resolutions);result.device={};
  for(const key of deviceKeys){const local=current.device[key]??null,remote=archived.device[key]??null,id='device/'+key;
   if(local===remote||remote===null)result.device[key]=local;
   else if(local===null)result.device[key]=remote;
   else if(resolutions[id])result.device[key]=resolutions[id]==='remote'?remote:local;
   else{result.conflicts.push({id,key,path:''});result.device[key]=local;}
  }
  return result;
 }
 return {
  activeOwner,activate,
  isActive:uid=>activeOwner()===(uid||guest),
  checkpoint(){checked(keyFor(activeOwner()),JSON.stringify(snapshot()));},
  hasGuestData(uid){if(!uid||storage.getItem('elifa.guest.imported.'+uid)==='1')return false;const value=unpack(storage.getItem(keyFor(guest))),data=value.payload.veri;return Object.entries({...data,...value.device}).some(([k,v])=>k!=='set'&&v!=null&&!['[]','{}','null'].includes(v));},
  prepareGuestImport:guestImport,
  importGuest(uid,resolutions={}){
   const result=guestImport(uid,resolutions);if(result.conflicts.length)return result;
   const before=snapshot();
   try{apply({payload:result.payload,device:result.device,previous:before.previous});checked('elifa.guest.imported.'+uid,'1');}
   catch(error){apply(before);throw error;}
   checked(keyFor(uid),JSON.stringify(snapshot()));return result;
  },
  keepGuestSeparate(uid){checked('elifa.guest.imported.'+uid,'1');},
  // Account deletion retains a private device archive. It never transfers that
  // user's data into the next guest or account workspace.
  retainedKeys:[...BACKUP_KEYS]
 };
}
