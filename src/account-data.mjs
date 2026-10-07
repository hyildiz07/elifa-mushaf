export const BACKUP_KEYS=['bookmarks','errs','ezdays','ezlog','hifz','marks','notes','prog','set','surahFavorites'];
export const MAX_BACKUP_BYTES=1024*1024;
export const JOURNAL_KEY='elifa.restore.pending';
export const PREVIOUS_KEY='elifa.restore.previous';
export const SYNC_BASE_PREFIX='elifa.sync.base.';
export const SYNC_ENABLED_PREFIX='elifa.sync.enabled.';
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const bytes=v=>new TextEncoder().encode(JSON.stringify(v)).length;
function safeTree(value,depth=0){
  if(depth>12)throw Error('Veri çok iç içe.');
  if(typeof value==='number'&&!Number.isFinite(value))throw Error('Geçersiz sayı.');
  if(typeof value==='string'&&value.length>20000)throw Error('Bir kayıt çok uzun.');
  if(value&&typeof value==='object')for(const key of Object.keys(value)){
    if(['__proto__','constructor','prototype'].includes(key))throw Error('Geçersiz veri anahtarı.');
    safeTree(value[key],depth+1);
  }
}
export function validateBackup(payload){
  if(!object(payload)||payload.elifa!=='yedek'||payload.v!==1||!object(payload.veri))throw Error('Geçersiz Elifa yedeği.');
  if(bytes(payload)>MAX_BACKUP_BYTES)throw Error('Yedek 1 MB sınırını aşıyor.');
  const data={};
  for(const [key,raw] of Object.entries(payload.veri)){
    if(!BACKUP_KEYS.includes(key)||typeof raw!=='string')throw Error('Yedekte desteklenmeyen kayıt var.');
    const value=JSON.parse(raw);safeTree(value);
    if(['bookmarks','errs','ezdays','hifz','marks','surahFavorites'].includes(key)&&!Array.isArray(value))throw Error('Geçersiz kayıt listesi: '+key);
    if(['notes','ezlog','set'].includes(key)&&!object(value))throw Error('Geçersiz kayıt: '+key);
    if(key==='prog'&&value!==null&&(!object(value)||!Number.isInteger(value.s)||value.s<1||value.s>114||!Number.isInteger(value.a)||value.a<1||value.a>286))throw Error('Geçersiz okuma konumu.');
    if(key==='notes')for(const [k,v] of Object.entries(value))if(!/^\d{1,3}:\d{1,3}$/.test(k)||typeof v!=='string')throw Error('Geçersiz not.');
    if(key==='surahFavorites'&&value.some(v=>!Number.isInteger(v)||v<1||v>114))throw Error('Geçersiz favori.');
    if(['bookmarks','hifz','marks'].includes(key)&&value.some(v=>!object(v)||!Number.isInteger(v.s)||v.s<1||v.s>114))throw Error('Geçersiz sure kaydı.');
    if(['bookmarks','hifz','marks'].includes(key))for(const item of value){
      if(!Number.isFinite(item.id))throw Error('Geçersiz kayıt kimliği.');
      const fields=key==='bookmarks'?['ay']:['fa','ta'];
      for(const field of fields)if(!Number.isInteger(item[field])||item[field]<1||item[field]>286)throw Error('Geçersiz âyet aralığı.');
      if(key!=='bookmarks'&&item.ta<item.fa)throw Error('Geçersiz âyet sırası.');
      if(key==='marks'){
        if(typeof item.folder!=='string'||typeof item.txt!=='string'||!/^#[0-9a-f]{6}$/i.test(item.color||''))throw Error('Geçersiz işaret.');
        for(const field of ['fp','tp','parts'])if(item[field]!==undefined&&(!Number.isInteger(item[field])||item[field]<1||item[field]>1000))throw Error('Geçersiz kelime aralığı.');
      }
    }
    if(key==='errs'&&value.some(v=>typeof v!=='string'||!/^\d+:\d+:\d+$/.test(v)))throw Error('Geçersiz hata işareti.');
    if(key==='ezdays'&&value.some(v=>!Number.isFinite(v)||v<0))throw Error('Geçersiz çalışma günü.');
    data[key]=JSON.stringify(value);
  }
  return {elifa:'yedek',v:1,tarih:typeof payload.tarih==='string'?payload.tarih:new Date().toISOString(),veri:data};
}
export function collectBackup(storage){
  const veri={};for(const key of BACKUP_KEYS){const v=storage.getItem(key);if(v!==null)veri[key]=v;}
  return validateBackup({elifa:'yedek',v:1,tarih:new Date().toISOString(),veri});
}
function writeChecked(storage,key,value){
  if(value===null)storage.removeItem(key);else storage.setItem(key,value);
  if(storage.getItem(key)!==value)throw Error('Cihaz kaydı doğrulanamadı.');
}
function readJournal(raw){
  const previous=JSON.parse(raw);
  if(!object(previous)||Object.keys(previous).length!==BACKUP_KEYS.length||bytes(previous)>MAX_BACKUP_BYTES*2)throw Error('Kurtarma kaydı geçersiz.');
  for(const [key,value] of Object.entries(previous))if(!BACKUP_KEYS.includes(key)||(value!==null&&typeof value!=='string'))throw Error('Kurtarma kaydı geçersiz.');
  return previous;
}
export function recoverPendingRestore(storage){
  const raw=storage.getItem(JOURNAL_KEY);if(!raw)return false;
  for(const [key,value] of Object.entries(readJournal(raw)))writeChecked(storage,key,value);
  storage.removeItem(JOURNAL_KEY);return true;
}
export function restoreBackup(storage,payload){
  const clean=validateBackup(payload);
  // The journal survives a browser close/crash halfway through a multi-key restore.
  if(storage.getItem(JOURNAL_KEY))recoverPendingRestore(storage);
  const before=Object.fromEntries(BACKUP_KEYS.map(k=>[k,storage.getItem(k)]));
  const journal=JSON.stringify(before);
  readJournal(journal); // Refuse an unrecoverable journal before changing any key.
  writeChecked(storage,JOURNAL_KEY,journal);
  try{
    writeChecked(storage,PREVIOUS_KEY,journal);
    for(const key of BACKUP_KEYS)writeChecked(storage,key,clean.veri[key]??null);
    storage.removeItem(JOURNAL_KEY);
  }catch(error){
    try{recoverPendingRestore(storage);}catch{throw Error('Aktarım tamamlanamadı. Eski kayıtları kurtarmak için cihazda boş alan açıp yeniden deneyin; sayfayı kapatmayın.');}
    throw Error('Aktarım tamamlanamadı; eski kayıtlar korundu. '+error.message);
  }
}

const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const absent=Symbol('absent');
const clone=v=>v===absent?absent:structuredClone(v);
const setKeys=new Set(['errs','ezdays','surahFavorites']);
const itemKeys=new Set(['bookmarks','hifz','marks']);
function mergeValue(base,local,remote,path,conflicts,resolutions){
  if(same(local,remote))return clone(local);
  if(same(local,base))return clone(remote);
  if(same(remote,base))return clone(local);
  const root=path[0];
  if(path.length===1&&root==='prog'){
    if(resolutions?.prog==='local')return clone(local);
    if(resolutions?.prog==='remote')return clone(remote);
    conflicts.push({id:'prog',key:'prog',path:''});return clone(local);
  }
  if(path.length===1&&setKeys.has(root)&&Array.isArray(local)&&Array.isArray(remote)){
    const old=new Set(Array.isArray(base)?base:[]),left=new Set(local),right=new Set(remote);
    return [...new Set([...old,...left,...right])].filter(x=>mergeValue(old.has(x),left.has(x),right.has(x),[...path,String(x)],conflicts,resolutions)).sort();
  }
  if(path.length===1&&itemKeys.has(root)&&Array.isArray(local)&&Array.isArray(remote)){
    const mapped=arr=>new Map(arr.map(v=>[String(v.id),v]));
    const a=mapped(Array.isArray(base)?base:[]),l=mapped(local),r=mapped(remote),out=[];
    for(const id of new Set([...a.keys(),...l.keys(),...r.keys()])){
      const value=mergeValue(a.get(id)??absent,l.get(id)??absent,r.get(id)??absent,[...path,id],conflicts,resolutions);
      if(value!==absent)out.push(value);
    }
    return out;
  }
  if(local!==absent&&remote!==absent&&object(local)&&object(remote)&&(base===absent||object(base))){
    const a=object(base)?base:{},out={};
    for(const key of new Set([...Object.keys(a),...Object.keys(local),...Object.keys(remote)])){
      const value=mergeValue(Object.hasOwn(a,key)?a[key]:absent,Object.hasOwn(local,key)?local[key]:absent,Object.hasOwn(remote,key)?remote[key]:absent,[...path,key],conflicts,resolutions);
      if(value!==absent)out[key]=value;
    }
    return out;
  }
  const id=path.join('/');
  if(resolutions?.[id]==='local')return clone(local);
  if(resolutions?.[id]==='remote')return clone(remote);
  conflicts.push({id,key:root,path:path.slice(1).join(' / ')});
  return clone(local);
}
// Three-way merge avoids overwriting edits made on another device since the last sync.
// Unresolved simultaneous edits are returned to the UI and must not be uploaded.
export function mergeBackups(basePayload,localPayload,remotePayload,resolutions={}){
  const base=basePayload?validateBackup(basePayload).veri:{};
  const local=validateBackup(localPayload).veri;
  const remote=remotePayload?validateBackup(remotePayload).veri:{};
  const veri={},conflicts=[];
  for(const key of BACKUP_KEYS){
    const parse=(source)=>Object.hasOwn(source,key)?JSON.parse(source[key]):absent;
    const value=mergeValue(parse(base),parse(local),parse(remote),[key],conflicts,resolutions);
    if(value!==absent)veri[key]=JSON.stringify(value);
  }
  return {payload:validateBackup({elifa:'yedek',v:1,veri}),conflicts};
}
