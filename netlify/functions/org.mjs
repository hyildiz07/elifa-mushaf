/* ══════════════════════════════════════════════════════════════════
   ELIFA — /api/org   (Netlify Function)

   Birlikte özelliğinin sunucu tarafı. Uygulamadaki bkDemoApi ile
   BİREBİR aynı mantık — ama veri sunucuda durur, böylece link
   BAŞKA CİHAZLARDA da açılır.

   Depo: Firestore işlemleri; mevcut Netlify Blobs verisi ilk erişimde taşınır.

   Üyelik YOK. Kimlik doğrulama yok. İki anahtar var:
     · code       → katılım linki (herkese verilir)
     · adminToken → yönetici linki (yalnız kurucuda kalır)
   ══════════════════════════════════════════════════════════════════ */

import { withOrgTransaction } from '../../server/database.mjs';
import {firebaseServices} from '../../server/firebase.mjs';
import {deploymentContext,previewResponse} from '../../server/deploy-context.mjs';
import {capabilityValid,capabilityHash,returnKeyValid,accessKeyValid,deriveReturnKey,returnKeyHash,matchesItemKey,membershipKey,closedAccountKey,creationFingerprint,usedCapability,rememberCapability,fullHatim,ownsItem,itemView,rememberMembership,validDate} from '../../server/hatim-access.mjs';

const ALPHA = 'abcdefghijkmnpqrstuvwxyz23456789'; // karışan harfler yok (l,o,0,1)

function randCode(n) {
  let s = '';
  const buf = new Uint8Array(n);
  crypto.getRandomValues(buf);
  for (let i = 0; i < n; i++) s += ALPHA[buf[i] % ALPHA.length];
  return s;
}

/* Zikirde kişi başı sayı DIŞARI SIZMAZ — sadece toplam + isimler. */
function publicView(org, isAdmin, p={}, session={},code=org.code||p.code) {
  const v = {
    type: org.type, title: org.title, zikirAd: org.zikirAd, hedef: org.hedef,
    dueDate: org.dueDate, adminName: org.adminName, createdAt: org.createdAt,
    items: (org.items||[]).map(item=>itemView(item,p,session,code)), public: !!org.public,
    archived: !!org.archivedAt,
    fullHatim: org.type==='hatim'&&fullHatim(org.items),
    complete: org.type==='hatim'&&!!org.items?.length&&org.items.every(i=>i.status==='okundu'),
  };
  if (org.type === 'zikir') {
    const c = org.contributions || [];
    v.toplam = c.reduce((s, x) => s + (+x.amount || 0), 0);
    v.katilanlar = [...new Set(c.map(x => x.name).filter(Boolean))];
  }
  v.isAdmin = !!isAdmin;
  return v;
}

const json = (obj, status = 200) => new Response(JSON.stringify(obj), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'private, no-store', 'vary':'Authorization, Origin', 'x-content-type-options':'nosniff' },
});
const fail = (msg, status = 400) => json({ error: msg }, status);

/* Basit doğrulama — çöp veri yazılmasın */
function validOrg(o) {
  if (!o || typeof o !== 'object') return 'Geçersiz veri';
  if (o.type !== 'hatim' && o.type !== 'zikir') return 'Geçersiz tür';
  if (typeof o.title !== 'string' || !o.title.trim() || o.title.length > 120) return 'Başlık geçersiz';
  if (o.adminName && String(o.adminName).length > 60) return 'İsim çok uzun';
  if(!validDate(o.dueDate))return 'Geçersiz son tarih';
  if(o.public!==undefined&&typeof o.public!=='boolean')return 'Görünürlük geçersiz';
  if (o.type === 'hatim') {
    if (!Array.isArray(o.items) || o.items.length !== 30)
      return 'Cüz listesi geçersiz';
    if(o.items.some(i=>!Number.isInteger(+i.no)||+i.no<1||+i.no>30)||new Set(o.items.map(i=>+i.no)).size!==o.items.length)return 'Cüz numaraları geçersiz';
  } else {
    if (!Number.isSafeInteger(+o.hedef) || !(+o.hedef > 0) || +o.hedef > 100000000) return 'Hedef geçersiz';
    if (!o.zikirAd || String(o.zikirAd).length > 80) return 'Zikir adı geçersiz';
  }
  return null;
}

/* ── Anket (duyuru yanında) — org koduna bağlı değil ── */
function pollPublic(poll, voterId) {
  if (!poll || !poll.active) return { poll: null };
  const counts = poll.counts || {};
  const total = Object.values(counts).reduce((s, x) => s + (+x || 0), 0);
  const mine = voterId && poll.voters ? (poll.voters[voterId] || null) : null;
  return {
    poll: {
      id: poll.id, question: poll.question,
      options: poll.options, counts, total,
      voted: !!mine, myOption: mine, createdAt: poll.createdAt,
    },
  };
}
async function handlePoll(p, store) {
  const KEY = '_poll';

  /* admin: anket oluştur/güncelle (ELIFA_ADMIN_SECRET) */
  if (p.action === 'pollSet') {
    const secret = (globalThis.Netlify && Netlify.env.get('ELIFA_ADMIN_SECRET')) || process.env.ELIFA_ADMIN_SECRET;
    if (!secret || p.secret !== secret) return fail('Yetki yok', 403);
    const q = String((p.poll && p.poll.question) || '').slice(0, 300);
    const rawOpts = (p.poll && p.poll.options) || [];
    if (!q) return fail('Soru boş');
    if (!Array.isArray(rawOpts) || rawOpts.length < 2 || rawOpts.length > 8) return fail('2–8 şık gerekli');
    const options = rawOpts.map((t, i) => ({ id: 'o' + (i + 1), text: String(t || '').slice(0, 160) }))
      .filter(o => o.text);
    if (options.length < 2) return fail('En az 2 dolu şık gerekli');
    const poll = {
      id: 'p_' + Date.now().toString(36),
      active: p.poll.active !== false,
      question: q, options,
      counts: Object.fromEntries(options.map(o => [o.id, 0])),
      voters: {},
      createdAt: Date.now(), updatedAt: Date.now(),
    };
    await store.setJSON(KEY, poll);
    return json({ ok: true, poll: pollPublic(poll).poll });
  }

  /* admin: anketi kaldır */
  if (p.action === 'pollClear') {
    const secret = (globalThis.Netlify && Netlify.env.get('ELIFA_ADMIN_SECRET')) || process.env.ELIFA_ADMIN_SECRET;
    if (!secret || p.secret !== secret) return fail('Yetki yok', 403);
    await store.delete(KEY);
    return json({ ok: true });
  }

  /* herkes: aktif anketi getir */
  if (p.action === 'pollGet') {
    const poll = await store.get(KEY, { type: 'json' });
    return json(pollPublic(poll, p.voterId));
  }

  /* herkes: oy ver (kişi başı tek oy — voterId ile) */
  if (p.action === 'pollVote') {
    const poll = await store.get(KEY, { type: 'json' });
    if (!poll || !poll.active) return fail('Aktif anket yok', 404);
    if (poll.id !== p.id) return fail('Anket güncellendi, sayfayı yenileyin', 409);
    const opt = (poll.options || []).find(o => o.id === p.option);
    if (!opt) return fail('Geçersiz şık');
    const vid = String(p.voterId || '').slice(0, 40);
    if (!/^[a-zA-Z0-9_-]{8,40}$/.test(vid)) return fail('Oy kimliği geçersiz');
    poll.voters = poll.voters || {};
    if (poll.voters[vid]) return json(pollPublic(poll, vid));  // zaten oy vermiş → sessiz, sonucu döndür
    if (Object.keys(poll.voters).length > 200000) return fail('Anket kapasitesi doldu');
    poll.voters[vid] = opt.id;
    poll.counts = poll.counts || {};
    poll.counts[opt.id] = (+poll.counts[opt.id] || 0) + 1;
    poll.updatedAt = Date.now();
    await store.setJSON(KEY, poll);
    return json(pollPublic(poll, vid));
  }

  return null;
}

const NATIVE_ORIGIN='capacitor://localhost';
export function createOrgHandler({services=firebaseServices,transaction,environment=()=>process.env}={}){
 const requestHandler=async(req,deployment)=>{
  if (req.method !== 'POST') return fail('Yalnız POST', 405);
  const origin=req.headers.get('origin');
  if(origin&&origin!==new URL(req.url).origin&&origin!==NATIVE_ORIGIN)return fail('Bu kaynaktan işlem yapılamıyor.',403);
  let p;
  try { const raw=await req.text();if(Buffer.byteLength(raw)>65536)return fail('İstek çok büyük',413);p=JSON.parse(raw); } catch { return fail('Gövde okunamadı'); }
  if (!p || typeof p!=='object'||Array.isArray(p)||!p.action) return fail('İşlem belirtilmedi');
  let session={};
  const authorization=req.headers.get('authorization');
  if(authorization){
    const token=authorization.match(/^Bearer (\S+)$/)?.[1];
    if(!token)return fail('Oturum geçersiz. Yeniden giriş yap.',401);
    try{
      const {auth}=services(),verified=await auth.verifyIdToken(token,true);
      const user=await auth.getUser(verified.uid);
      if(user.disabled)return fail('Oturum geçersiz.',401);
      if(p.expectedUser!==verified.uid)return fail('Hesap değişti. Yeniden kontrol et.',409);
      session={uid:verified.uid};
    }catch{return fail('Oturum doğrulanamadı. Yeniden giriş yap.',401);}
  }
  try{
    const work=store=>handleOrg(p,store,session);
    return await (transaction?transaction(work):withOrgTransaction(work,{environment:environment(),deployment,services}));
  }
  catch{return fail('İşlem tamamlanamadı. Bağlantını kontrol edip tekrar dene.',503);}
 };
 return async(req,runtime)=>{
  let context;try{context=deploymentContext(environment(),runtime);}catch{return fail('Önizleme veri alanı doğrulanamadı. Canlı kayıtlara erişim açılmadı.',503);}
  if(context.kind==='preview'&&req.headers.has('authorization'))return previewResponse(fail('Bu önizleme yalnız misafir hatim denemesi içindir. Canlı hesap oturumunu burada kullanma.',403),context);
  return previewResponse(await requestHandler(req,context),context);
 };
}
const requestHandler=createOrgHandler();
export default async (req,context) => {
  const native=req.headers.get('origin')===NATIVE_ORIGIN;
  if(native&&req.method==='OPTIONS')return new Response(null,{status:204,headers:{
    'Access-Control-Allow-Origin':NATIVE_ORIGIN,
    'Access-Control-Allow-Methods':'POST, OPTIONS',
    'Access-Control-Allow-Headers':'Content-Type, Authorization',
    'Access-Control-Max-Age':'3600',
    'Vary':'Origin'
  }});
  const response=await requestHandler(req,context);
  if(!native)return response;
  const headers=new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin',NATIVE_ORIGIN);
  headers.set('Vary','Authorization, Origin');
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
};
export async function handleOrg(p,store,session={}){
  if(session.uid&&await store.get(closedAccountKey(session.uid),{type:'json'}))return fail('Bu hesabın silme işlemi başladı. Çıkış yapıp kişisel dönüş bağlantını kullanabilirsin.',409);

  /* ── keşif işlemleri (org koduna bağlı değil) ── */
  if (p.action === 'discoverConfig' || p.action === 'discoverSet' || p.action === 'discoverList') {
    const r = await handleDiscover(p, store);
    if (r) return r;
  }
  if (p.action === 'pollGet' || p.action === 'pollVote' || p.action === 'pollSet' || p.action === 'pollClear') {
    const r = await handlePoll(p, store);
    if (r) return r;
  }

  if(p.capability!==undefined&&!accessKeyValid(p.capability))return fail('Kişisel erişim anahtarı geçersiz');
  if(p.capabilities!==undefined){
    if(!p.capabilities||typeof p.capabilities!=='object'||Array.isArray(p.capabilities)||Object.keys(p.capabilities).length>30||Object.entries(p.capabilities).some(([n,t])=>!/^([1-9]|[12][0-9]|30)$/.test(n)||!accessKeyValid(t)))return fail('Kişisel erişim anahtarları geçersiz');
  }
  if(p.action==='myList'){
    if(!session.uid)return fail('Cüzlerini hesabından görmek için giriş yap.',401);
    const index=await store.get(membershipKey(session.uid),{type:'json'});
    const codes=Array.isArray(index?.codes)?index.codes:[];
    const cursor=p.cursor===undefined?0:Number(p.cursor);
    if(!Number.isSafeInteger(cursor)||cursor<0)return fail('Geçersiz liste konumu');
    const items=[];
    for(const code of codes.slice(cursor,cursor+30)){
      const org=await store.get(code,{type:'json'});if(!org)continue;
      const isAdmin=org.ownerUid===session.uid;
      const mine=(org.items||[]).filter(i=>ownsItem(i,{},session)).map(i=>itemView(i,{},session));
      if(!isAdmin&&!mine.length)continue;
      items.push({code,title:org.title,type:org.type,dueDate:org.dueDate||null,createdAt:org.createdAt,isAdmin,archived:!!org.archivedAt,items:mine});
    }
    return json({items,nextCursor:cursor+30<codes.length?cursor+30:null});
  }

  /* ── CREATE ── */
  if (p.action === 'create') {
    const bad = validOrg(p.org);
    if (bad) return fail(bad);

    if(p.creationToken!==undefined&&!capabilityValid(p.creationToken))return fail('Oluşturma işlem anahtarı geçersiz');
    const creationKey=p.creationToken?'_create_'+capabilityHash(p.creationToken):null;
    const fingerprint=creationFingerprint(p.org);
    if(creationKey){
      const prior=await store.get(creationKey,{type:'json'});
      if(prior){
        if(prior.fingerprint!==fingerprint)return fail('Bu işlem anahtarı başka bir hatim için kullanılmış. Yeni oluşturma başlat.',409);
        if(prior.ownerUid&&prior.ownerUid!==session.uid)return fail('Oluşturma işlemi başka bir hesaba ait.',403);
        const existing=await store.get(prior.code,{type:'json'});
        if(!existing)return fail('Önceki oluşturma kaydı bulunamadı. Yeni işlem başlat.',409);
        return json({code:prior.code,adminToken:existing.adminToken,org:publicView(existing,true,p,session),replayed:true});
      }
    }

    if(p.org.public){
      const cfg=await store.get('_config',{type:'json'})||{};
      if(!cfg.discoverEnabled)return fail('Açık hatim listesi şu an kapalı. Bağlantıyla katılımı seçebilirsin.',403);
    }
    let code=randCode(6),adminToken=randCode(32);
    while(await store.get(code,{type:'json'}))code=randCode(6);
    while(await store.get('a_'+adminToken,{type:'text'}))adminToken=randCode(32);
    const org = {
      type: p.org.type,
      title: String(p.org.title || '').slice(0, 120),
      adminName: String(p.org.adminName || '').slice(0, 60),
      dueDate: p.org.dueDate || null,
      zikirAd: p.org.zikirAd ? String(p.org.zikirAd).slice(0, 80) : undefined,
      hedef: p.org.hedef ? +p.org.hedef : undefined,
      items: (p.org.items || []).map(i => ({
        no: +i.no, name: '', status: 'bos', ts: 0,
      })),
      contributions: [],
      public: !!p.org.public, publishedAt: p.org.public?Date.now():0,
      ownerUid:session.uid||null, archivedAt:0, creationKey,
      code, adminToken, createdAt: Date.now(), lastActivity: Date.now(),
    };
    await store.setJSON(code, org);
    await store.set('a_' + adminToken, code);      // yönetici anahtarı → kod
    if(creationKey)await store.setJSON(creationKey,{code,fingerprint,ownerUid:session.uid||null});
    await rememberMembership(store,session.uid,code);
    if(org.public){const idx=await store.get('_index',{type:'json'})||[];await store.setJSON('_index',[{code,publishedAt:org.publishedAt},...idx.filter(x=>x.code!==code)].slice(0,200));}
    return json({ code, adminToken,org:publicView(org,true,p,session) });
  }

  /* ── kod çöz ── */
  let code = p.code;
  if(code&&!/^[a-z0-9]{6}$/.test(code))return fail('Geçersiz kod');
  if(p.admin&&!/^(?:[a-z0-9]{12}|[a-z0-9]{32})$/.test(p.admin))return fail('Geçersiz yönetici anahtarı');
  if (!code && p.admin) code = await store.get('a_' + p.admin, { type: 'text' });
  if (!code) return fail('Organizasyon bulunamadı', 404);

  const org = await store.get(code, { type: 'json' });
  if (!org) return fail('Organizasyon bulunamadı', 404);

  const isAdmin = (!!p.admin && p.admin === org.adminToken)||(!!session.uid&&org.ownerUid===session.uid);
  const save = () => { org.lastActivity = Date.now(); return store.setJSON(code, org); };
  const view=()=>publicView(org,isAdmin,p,session,code);
  const ownerItem=()=>{
    if(org.type!=='hatim')return null;
    return (org.items||[]).find(i=>i.no===+p.no);
  };

  /* ── GET ── */
  if (p.action === 'get') {
    return json({ org: view(), code });
  }

  /* Claim capabilities are generated and persisted by the client BEFORE the
     request. Retrying a lost reply with that exact capability is idempotent. */
  if(p.action==='claim'){
    const it=ownerItem();
    if(!it)return fail('Cüz bulunamadı');
    if(!capabilityValid(p.capability))return fail('Uygulamayı yenileyip cüzünü yeniden seç. Kişisel erişim anahtarı gerekli.',409);
    if(it.status!=='bos'){
      const sameHash=capabilityHash(p.capability)===it.claimHash;
      if(sameHash&&(!it.ownerUid||it.ownerUid===session.uid))return json({org:view(),code,claimedNo:it.no});
      return fail('Bu cüz az önce başka biri tarafından alındı.',409);
    }
    if(org.archivedAt)return fail('Bu hatim arşivde. Yeniden açılması için yöneticisine başvur.',409);
    if(usedCapability(it,capabilityHash(p.capability)))return fail('Bu kişisel anahtarın önceki katılımı sona ermiş. Cüzü yeni bir anahtarla yeniden seç.',409);
    const name=String(p.name||'').trim();
    if(name.length<2||name.length>60)return fail('2–60 karakterlik ad veya takma ad yaz.');
    rememberCapability(it,capabilityHash(p.capability));
    Object.assign(it,{status:'alindi',name,ts:Date.now(),claimHash:capabilityHash(p.capability),ownerUid:session.uid||null});
    delete it.returnHash;delete it.releaseReturnHash;delete it.releaseHash;delete it.releasedUid;
    await rememberMembership(store,session.uid,code);await save();
    return json({org:view(),code,claimedNo:it.no});
  }
  if(p.action==='returnCode'){
    const it=ownerItem();
    if(!it||it.status==='bos')return fail('Etkin cüz katılımı bulunamadı.',404);
    // A signed-in owner or administrator alone cannot mint a new bearer key.
    // The caller must explicitly possess the current full or prepared short key.
    if(!matchesItemKey(it,p.capability,code)||(it.ownerUid&&it.ownerUid!==session.uid))return fail('Kişisel dönüş kodu için güncel kişisel anahtarın gerekli.',403);
    const returnKey=returnKeyValid(p.capability)?p.capability:deriveReturnKey(code,it.no,p.capability);
    const digest=returnKeyHash(returnKey,code,it.no);
    if(it.returnHash!==digest){it.returnHash=digest;await save();}
    return json({code,no:it.no,returnKey});
  }
  if(['release','complete','undo'].includes(p.action)){
    const it=ownerItem();
    if(!it)return fail('Cüz bulunamadı');
    if(p.action==='release'&&it.status==='bos'&&((session.uid&&it.releasedUid===session.uid)||(!it.releasedUid&&((capabilityHash(p.capability)&&capabilityHash(p.capability)===it.releaseHash)||(returnKeyHash(p.capability,code,it.no)&&returnKeyHash(p.capability,code,it.no)===it.releaseReturnHash)))))return json({org:view(),code});
    if(!ownsItem(it,p,session,code))return fail('Yalnız kendi cüzünü değiştirebilirsin. Eski katılımsa yöneticiden sana özel dönüş bağlantısı iste.',403);
    const target=p.action==='release'?'bos':p.action==='complete'?'okundu':'alindi';
    if(it.status===target)return json({org:view(),code});
    if(p.action==='undo'&&it.status!=='okundu')return fail('Yalnız okundu işareti geri alınabilir.',409);
    it.status=target;it.ts=Date.now();
    if(target==='bos'){rememberCapability(it,it.claimHash);it.name='';it.releaseHash=it.claimHash||null;it.releaseReturnHash=it.returnHash||null;it.releasedUid=it.ownerUid||null;delete it.claimHash;delete it.returnHash;delete it.ownerUid;}
    org.archivedAt=0;await save();
    return json({org:view(),code});
  }
  if(p.action==='issueRecovery'){
    if(!isAdmin)return fail('Yalnız yönetici kişisel dönüş bağlantısı hazırlayabilir.',403);
    const it=ownerItem();
    if(!it||it.status==='bos')return fail('Bu cüz henüz alınmamış.',409);
    if(!capabilityValid(p.capability))return fail('Yeni kişisel erişim anahtarı gerekli.');
    if(it.claimHash===capabilityHash(p.capability))return json({org:view(),code,recoveryNo:it.no});
    if(usedCapability(it,capabilityHash(p.capability)))return fail('Bu dönüş bağlantısı daha sonra yenilenmiş. Güncel bağlantıyı kullan veya yeni bir bağlantı oluştur.',409);
    rememberCapability(it,capabilityHash(p.capability));
    it.claimHash=capabilityHash(p.capability);delete it.returnHash;delete it.releaseReturnHash;delete it.ownerUid;it.ts=Date.now();await save();
    return json({org:view(),code,recoveryNo:it.no});
  }
  if(p.action==='bind'){
    if(!session.uid)return fail('Katılımını hesabına bağlamak için giriş yap.',401);
    const it=ownerItem();
    if(!it||it.status==='bos')return fail('Katılım bulunamadı.',404);
    if(it.ownerUid&&it.ownerUid!==session.uid)return fail('Bu katılım başka bir hesaba bağlı.',409);
    if(it.ownerUid!==session.uid&&!ownsItem(it,p,{},code))return fail('Katılımı bağlamak için kişisel dönüş anahtarı gerekli.',403);
    it.ownerUid=session.uid;it.ts=Date.now();await rememberMembership(store,session.uid,code);await save();
    return json({org:view(),code});
  }
  if(p.action==='bindAdmin'){
    if(!session.uid)return fail('Yönetimi hesabına bağlamak için giriş yap.',401);
    if(!p.admin||p.admin!==org.adminToken)return fail('Özel yönetici bağlantısı gerekli.',403);
    if(org.ownerUid&&org.ownerUid!==session.uid)return fail('Bu hatim başka bir yönetici hesabına bağlı.',409);
    org.ownerUid=session.uid;await rememberMembership(store,session.uid,code);await save();
    return json({org:view(),code});
  }
  if(p.action==='update'||p.action==='archive'||p.action==='reopen'){
    if(!isAdmin)return fail('Yetki yok',403);
    if(p.action==='update'){
      if(p.title!==undefined){if(typeof p.title!=='string'||!p.title.trim()||p.title.length>120)return fail('Başlık geçersiz');org.title=p.title.trim();}
      if(p.dueDate!==undefined){if(!validDate(p.dueDate))return fail('Geçersiz son tarih');org.dueDate=p.dueDate||null;}
    }else{
      org.archivedAt=p.action==='archive'?Date.now():0;
      if(org.archivedAt){org.public=false;org.publishedAt=0;const idx=await store.get('_index',{type:'json'})||[];await store.setJSON('_index',idx.filter(x=>x.code!==code));}
    }
    await save();return json({org:view(),code});
  }

  /* ── CONTRIBUTE (zikir payı ekle) ── */
  if (p.action === 'contribute') {
    if(org.type!=='zikir')return fail('Bu işlem zikir için geçerli');
    const n = +p.amount;
    if (!Number.isSafeInteger(n) || !(n > 0) || n > 10000000) return fail('Geçersiz sayı');
    org.contributions = org.contributions || [];
    if (org.contributions.length > 5000) return fail('Bu niyet çok kalabalık');
    org.contributions.push({
      name: String(p.name || '').slice(0, 60), amount: n, ts: Date.now(),
    });
    await save();
    return json({ org: view(), code });
  }

  /* ── ADMINSET (yönetici düzeltme) ── */
  if (p.action === 'adminSet') {
    if (!isAdmin) return fail('Yetki yok', 403);
    if(!['bos','alindi','okundu'].includes(p.status))return fail('Geçersiz durum');
    const it = ownerItem();
    if(!it)return fail('Cüz bulunamadı');
    if(p.name!==undefined&&(typeof p.name!=='string'||p.name.trim().length<2||p.name.length>60))return fail('2–60 karakterlik ad veya takma ad yaz.');
    {
      it.status = p.status;
      if (p.status === 'bos') {rememberCapability(it,it.claimHash);it.name='';delete it.claimHash;delete it.returnHash;delete it.releaseReturnHash;delete it.ownerUid;delete it.releaseHash;delete it.releasedUid;}
      else if(p.name!==undefined)it.name=p.name.trim();
      it.ts = Date.now();
    }
    await save();
    return json({ org: publicView(org,true,p,session), code });
  }

  /* ── PUBLISH (kurucu kendi hatmini herkese açık yapar/kaldırır) ── */
  if (p.action === 'publish') {
    if (!isAdmin) return fail('Yetki yok', 403);
    if(typeof p.public!=='boolean')return fail('Görünürlük geçersiz');
    const cfg = await store.get('_config', { type: 'json' }) || {};
    if (p.public&&!cfg.discoverEnabled) return fail('Herkese açık keşif şu an kapalı', 403);
    if(org.archivedAt&&p.public)return fail('Arşivdeki hatim açık listeye eklenemez.',409);
    org.public = !!p.public;
    org.publishedAt = org.public ? Date.now() : 0;
    await save();
    // indeks güncelle
    const idx = (await store.get('_index', { type: 'json' })) || [];
    const rest = idx.filter(x => x.code !== code);
    if (org.public) rest.unshift({ code, publishedAt: org.publishedAt });
    await store.setJSON('_index', rest.slice(0, 200));
    return json({ org: publicView(org,true,p,session), code });
  }

  return fail('Bilinmeyen işlem');
}

/* ── keşif ayarı + liste — org koduna bağlı DEĞİL, ana handler'dan önce döner ── */
async function handleDiscover(p, store) {
  /* durum: herkese açık mı? (uygulama bunu okuyup kutuyu gösterir) */
  if (p.action === 'discoverConfig') {
    const cfg = (await store.get('_config', { type: 'json' })) || {};
    return json({ enabled: !!cfg.discoverEnabled });
  }
  /* admin: özelliği aç/kapat (ELIFA_ADMIN_SECRET ile korunur) */
  if (p.action === 'discoverSet') {
    const secret = (globalThis.Netlify && Netlify.env.get('ELIFA_ADMIN_SECRET')) || process.env.ELIFA_ADMIN_SECRET;
    if (!secret || p.secret !== secret) return fail('Yetki yok', 403);
    const cfg = (await store.get('_config', { type: 'json' })) || {};
    cfg.discoverEnabled = !!p.enabled;
    await store.setJSON('_config', cfg);
    return json({ enabled: cfg.discoverEnabled });
  }
  /* herkese açık canlı liste */
  if (p.action === 'discoverList') {
    const cfg = (await store.get('_config', { type: 'json' })) || {};
    if (!cfg.discoverEnabled) return json({ enabled: false, items: [] });
    const idx = (await store.get('_index', { type: 'json' })) || [];
    const out = [];
    for (const ent of idx.slice(0, 60)) {
      const o = await store.get(ent.code, { type: 'json' });
      if (!o || !o.public || o.archivedAt || o.type!=='hatim') continue;
      const base = {
        code: ent.code, type: o.type, title: o.title, adminName: o.adminName || '',
        createdAt: o.createdAt, publishedAt: o.publishedAt || 0,
      };
      if (o.type === 'hatim') {
        const items = o.items || [];
        base.total = items.length || 30;
        base.done = items.filter(i => i.status === 'okundu').length;
        base.taken = items.filter(i => i.status !== 'bos').length;
        base.available = items.filter(i => i.status === 'bos').length;
        base.fullHatim = fullHatim(items);
        base.dueDate = o.dueDate||null;
      } else {
        const c = o.contributions || [];
        base.hedef = o.hedef || 0; base.zikirAd = o.zikirAd || '';
        base.toplam = c.reduce((s, x) => s + (+x.amount || 0), 0);
      }
      out.push(base);
    }
    return json({ enabled: true, items: out });
  }
  return null;
}


export const config = { path: '/api/org' };
