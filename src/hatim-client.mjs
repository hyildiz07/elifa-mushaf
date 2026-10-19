export function secret(crypto){return Array.from(crypto.getRandomValues(new Uint8Array(32)),v=>v.toString(16).padStart(2,'0')).join('');}
const returnKeyPattern=/^[0-9A-HJKMNP-TV-Z]{20}$/i;
const validCapability=value=>typeof value==='string'&&(/^[a-f0-9]{64}$/i.test(value)||returnKeyPattern.test(value));
const normalizeCapability=value=>returnKeyPattern.test(value)?value.toUpperCase():value.toLowerCase();
export function personalReturnCode(code,no,key){
 if(!/^[a-z0-9]{6}$/.test(code)||!Number.isInteger(no)||no<1||no>30||!returnKeyPattern.test(key))throw Error('Kişisel dönüş kodu hazırlanamadı.');
 return ['C1',code.toUpperCase(),String(no).padStart(2,'0'),...key.toUpperCase().match(/.{5}/g)].join('-');
}
export function dueText(date,now=new Date()){
 if(!date||!/^\d{4}-\d{2}-\d{2}$/.test(date))return '';
 const [y,m,d]=date.split('-').map(Number),end=Date.UTC(y,m-1,d),day=new Date(end);
 if(day.getUTCFullYear()!==y||day.getUTCMonth()!==m-1||day.getUTCDate()!==d)return '';
 const days=Math.round((end-Date.UTC(now.getFullYear(),now.getMonth(),now.getDate()))/86400000);
 return days<0?'Hedef tarih geçti':days===0?'Hedef bugün':days===1?'Hedef yarın':days+' gün kaldı';
}
export function parseHatimLink(value,base='https://mushaf.elifaplatform.com/'){
 const v=String(value||'').trim();if(/^[a-z0-9]{6}$/.test(v))return {code:v};
 const compact=v.toUpperCase().replace(/[\s\u2010-\u2015-]/g,'');
 const personal=/^C1([A-Z0-9]{6})(0[1-9]|[12][0-9]|30)([0-9A-HJKMNP-TV-Z]{20})$/.exec(compact);
 if(personal)return {code:personal[1].toLowerCase(),no:Number(personal[2]),capability:personal[3]};
 if(/^C1/i.test(v))return null;
 let u;try{u=new URL(v,base);}catch{return null;}
 if(['hatim','cuz','key','capability','token','adminToken','admin'].some(name=>u.searchParams.has(name)))return null;
 const recovery=new URLSearchParams(u.hash.slice(1));
 if((recovery.has('cuz')||recovery.has('key'))&&!recovery.has('hatim'))return null;
 if(recovery.has('hatim')){const code=recovery.get('hatim'),no=Number(recovery.get('cuz')),capability=recovery.get('key');if(/^[a-z0-9]{6}$/.test(code)&&Number.isInteger(no)&&no>=1&&no<=30&&(/^[a-f0-9]{64}$/.test(capability)||returnKeyPattern.test(capability)))return {code,no,capability:normalizeCapability(capability)};return null;}
 const admin=recovery.get('yonetim')||u.searchParams.get('y'),code=u.searchParams.get('k');
 if(admin&&/^(?:[a-z0-9]{12}|[a-z0-9]{32})$/.test(admin))return {admin};
 if(recovery.has('yonetim')||u.searchParams.has('y'))return null;
 return code&&/^[a-z0-9]{6}$/.test(code)?{code}:null;
}
export function participationUrl(base,code){const u=new URL(base);u.search='';u.hash='';u.searchParams.set('k',code);return u.href;}
export function recoveryUrl(base,code,no,key){const u=new URL(base);u.search='';u.hash=new URLSearchParams({hatim:code,cuz:String(no),key}).toString();return u.href;}
export function adminUrl(base,key){const u=new URL(base);u.search='';u.hash=new URLSearchParams({yonetim:key}).toString();return u.href;}
export function canonicalHatimUrl(value,code=null){
 const u=new URL(value);
 if(code!==null&&!/^[a-z0-9]{6}$/.test(code))throw Error('Hatim kodu geçersiz.');
 // Keep unrelated review/language parameters, but never leave organizer or
 // personal credentials in the reload address. Only the public code belongs here.
 for(const key of ['k','y','admin','adminToken','key','token','capability','hatim','cuz','yonetim'])u.searchParams.delete(key);
 u.hash='';if(code!==null)u.searchParams.set('k',code);return u.href;
}
export function loadLocal(storage,key){
 const plain=v=>v&&typeof v==='object'&&!Array.isArray(v);
 const code=v=>typeof v==='string'&&/^[a-z0-9]{6}$/.test(v);
 const cap=v=>typeof v==='string'&&/^[a-f0-9]{64}$/i.test(v);
 const maps=(value,convert)=>{const out={};if(plain(value))for(const [key,item]of Object.entries(value).slice(0,2000)){if(!code(key))continue;const clean=convert(item);if(clean!==undefined)out[key]=clean;}return out;};
 const tokenMap=value=>{if(!plain(value))return undefined;const out={};for(const [n,t]of Object.entries(value))if(/^[0-9]{1,2}$/.test(n)&&+n>=1&&+n<=30&&validCapability(t))out[n]=normalizeCapability(t);return out;};
 const operationMap=value=>{if(!plain(value))return undefined;const out={};for(const [n,item]of Object.entries(value))if(/^[0-9]{1,2}$/.test(n)&&+n>=1&&+n<=30&&plain(item)&&cap(item.token))out[n]={token:item.token.toLowerCase(),name:typeof item.name==='string'?item.name.slice(0,60):'',confirmed:item.confirmed===true,createdAt:Number.isFinite(item.createdAt)?item.createdAt:0};return out;};
 const empty=()=>({mine:[],myName:'',pending:{},claimed:{},capabilities:{},snapshots:{},pendingClaims:{},pendingRecovery:{},guestWarned:false,creation:null});
 try{
  const x=JSON.parse(storage.getItem(key)||'null');if(!plain(x))return empty();
  const mine=Array.isArray(x.mine)?x.mine.filter(m=>plain(m)&&code(m.code)).slice(0,2000).map(m=>({code:m.code,title:typeof m.title==='string'?m.title.slice(0,120):'Hatim',type:m.type==='zikir'?'zikir':'hatim',...(typeof m.adminToken==='string'&&/^(?:[a-z0-9]{12}|[a-z0-9]{32})$/.test(m.adminToken)?{adminToken:m.adminToken}:{}),pending:m.pending===true})):[];
  const creation=plain(x.creation)&&cap(x.creation.token)?{token:x.creation.token.toLowerCase(),title:typeof x.creation.title==='string'?x.creation.title.slice(0,120):'',name:typeof x.creation.name==='string'?x.creation.name.slice(0,60):'',dueDate:typeof x.creation.dueDate==='string'?x.creation.dueDate:'',public:x.creation.public===true,...(typeof x.creation.signature==='string'?{signature:x.creation.signature}:{} )}:null;
  return {mine,myName:typeof x.myName==='string'?x.myName.slice(0,60):'',pending:maps(x.pending,v=>Number.isFinite(v)&&v>=0?v:undefined),claimed:maps(x.claimed,v=>Array.isArray(v)?[...new Set(v.filter(n=>Number.isInteger(n)&&n>=1&&n<=30))]:undefined),capabilities:maps(x.capabilities,tokenMap),pendingClaims:maps(x.pendingClaims,operationMap),pendingRecovery:maps(x.pendingRecovery,operationMap),snapshots:maps(x.snapshots,v=>plain(v)?{title:typeof v.title==='string'?v.title.slice(0,120):'',type:v.type==='zikir'?'zikir':'hatim',isAdmin:v.isAdmin===true,archived:v.archived===true,updatedAt:Number.isFinite(v.updatedAt)?v.updatedAt:0,items:Array.isArray(v.items)?v.items.filter(i=>plain(i)&&Number.isInteger(i.no)&&i.no>=1&&i.no<=30&&['alindi','okundu'].includes(i.status)).slice(0,30).map(i=>({no:i.no,status:i.status,mine:true})):[]}:undefined),guestWarned:x.guestWarned===true,creation};
 }catch{return empty();}
}
export function forgetLocalHatim(state,code){
 if(typeof code!=='string'||!/^[a-z0-9]{6}$/.test(code))throw Error('Hatim kodu geçersiz.');
 const clean={...state,mine:(state.mine||[]).filter(item=>item.code!==code)};
 for(const field of ['pending','claimed','capabilities','snapshots','pendingClaims','pendingRecovery']){
  clean[field]={...state[field]};delete clean[field][code];
 }
 return clean;
}
export function createOrgClient({fetcher,session,base='',onError}){
 return async function api(payload){
  const user=session()?.getUser(),uid=user?.uid||null,headers={'Content-Type':'application/json'};
  if(uid){const token=await session().getIdToken();if(!token||session()?.getUser()?.uid!==uid)throw Error('Hesap değişti. İşlemi yeniden aç.');headers.Authorization='Bearer '+token;payload={...payload,expectedUser:uid};}
  let result,data;
  try{result=await fetcher(base+'/api/org',{method:'POST',headers,body:JSON.stringify(payload),signal:AbortSignal.timeout(20000)});data=await result.json();}
  catch{throw Error('Sunucuya ulaşılamadı. İşlem kaydedildi sayılmadı; durumunu kontrol edip yeniden dene.');}
  if((session()?.getUser()?.uid||null)!==uid)throw Error('Hesap değişti. İşlemi yeniden aç.');
  if(!result.ok){const e=Object.assign(Error(data.error||'İşlem tamamlanamadı.'),{status:result.status});onError?.(e);throw e;}
  if(!data||typeof data!=='object'||Array.isArray(data))throw Error('Sunucu yanıtı geçersiz. İşlem durumunu yenileyerek kontrol et.');
  if(data.org&&typeof data.org==='object'&&!Array.isArray(data.org)){
   const code=data.code||data.org.code;if(!/^[a-z0-9]{6}$/.test(code||''))throw Error('Hatim yanıtında geçerli kod yok.');
   data={...data,code,org:{...data.org,code}};
  }
  return data;
 };
}
