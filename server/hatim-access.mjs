import {createHash} from 'node:crypto';

export const capabilityValid=value=>typeof value==='string'&&/^[a-f0-9]{64}$/i.test(value);
export const capabilityHash=value=>capabilityValid(value)?createHash('sha256').update(value.toLowerCase()).digest('hex'):null;
export const returnKeyValid=value=>typeof value==='string'&&/^[0-9A-HJKMNP-TV-Z]{20}$/.test(value);
export const accessKeyValid=value=>capabilityValid(value)||returnKeyValid(value);
export function deriveReturnKey(code,no,capability){
 if(!capabilityValid(capability)||!/^[a-z0-9]{6}$/.test(code)||!Number.isInteger(no)||no<1||no>30)throw Error('Invalid return code context');
 const digest=createHash('sha256').update('elifa-hatim-return-key-v1\0'+code+'\0'+no+'\0'+capability.toLowerCase()).digest();
 const alphabet='0123456789ABCDEFGHJKMNPQRSTVWXYZ';let value=BigInt('0x'+digest.toString('hex')),out='';
 // Take exactly 100 uniformly distributed bits; no modulo-biased alphabet.
 for(let n=0;n<20;n++)out+=alphabet[Number((value>>BigInt(251-5*n))&31n)];
 return out;
}
export const returnKeyHash=(value,code,no)=>returnKeyValid(value)&&/^[a-z0-9]{6}$/.test(code||'')&&Number.isInteger(no)&&no>=1&&no<=30
 ?createHash('sha256').update('elifa-hatim-return-hash-v1\0'+code+'\0'+no+'\0'+value).digest('hex'):null;
export function matchesItemKey(item,key,code){
 const full=capabilityHash(key),short=returnKeyHash(key,code,item?.no);
 return !!item&&((!!full&&!!item.claimHash&&full===item.claimHash)||(!!short&&!!item.returnHash&&short===item.returnHash));
}
export const membershipKey=uid=>'_member_'+createHash('sha256').update(uid).digest('hex');
export const closedAccountKey=uid=>'_closed_'+createHash('sha256').update(uid).digest('hex');
export const creationFingerprint=org=>createHash('sha256').update(JSON.stringify({
  type:org.type,title:org.title.trim(),adminName:org.adminName||'',dueDate:org.dueDate||null,
  public:!!org.public,zikirAd:org.zikirAd||null,hedef:org.hedef?+org.hedef:null,
  items:(org.items||[]).map(i=>+i.no).sort((a,b)=>a-b)
})).digest('hex');
export const usedCapability=(item,hash)=>!!hash&&(item.usedCapabilities?.includes(hash)||item.releaseHash===hash);
export function rememberCapability(item,hash){
 item.usedCapabilities=[...new Set([...(Array.isArray(item.usedCapabilities)?item.usedCapabilities:[]),item.claimHash,item.releaseHash,hash].filter(Boolean))];
}
export const fullHatim=items=>Array.isArray(items)&&items.length===30&&new Set(items.map(i=>i.no)).size===30&&items.every(i=>Number.isInteger(i.no)&&i.no>=1&&i.no<=30);
export function ownsItem(item,p={},session={},code=p.code){
  if(!item||item.status==='bos')return false;
  if(session.uid&&item.ownerUid===session.uid)return true;
  // A bound claim belongs to that account. A previously copied guest link must
  // not bypass an account switch after the guest explicitly bound ownership.
  if(item.ownerUid)return false;
  const token=p.capabilities&&Object.hasOwn(p.capabilities,String(item.no))
    ?p.capabilities[String(item.no)]:(!p.no||+p.no===item.no?p.capability:null);
  return matchesItemKey(item,token,code);
}
export function itemView(item,p={},session={},code=p.code){
  return {no:item.no,name:item.name||'',status:item.status,ts:item.ts||0,
    mine:ownsItem(item,p,session,code),legacy:item.status!=='bos'&&!item.claimHash&&!item.ownerUid};
}
export async function rememberMembership(store,uid,code){
  if(!uid)return;
  const key=membershipKey(uid),old=await store.get(key,{type:'json'});
  const codes=Array.isArray(old?.codes)?old.codes.filter(c=>typeof c==='string'&&c!==code):[];
  // It is an index, not proof of ownership. Every list result is checked again
  // against the actual current organization and owner fields.
  await store.setJSON(key,{version:1,codes:[code,...codes]});
}
export function validDate(value){
  if(value===null||value===undefined||value==='')return true;
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
  const date=new Date(value+'T00:00:00Z');
  return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value;
}
