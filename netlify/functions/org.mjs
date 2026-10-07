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

const ALPHA = 'abcdefghijkmnpqrstuvwxyz23456789'; // karışan harfler yok (l,o,0,1)

function randCode(n) {
  let s = '';
  const buf = new Uint8Array(n);
  crypto.getRandomValues(buf);
  for (let i = 0; i < n; i++) s += ALPHA[buf[i] % ALPHA.length];
  return s;
}

/* Zikirde kişi başı sayı DIŞARI SIZMAZ — sadece toplam + isimler. */
function publicView(org, isAdmin) {
  const v = {
    type: org.type, title: org.title, zikirAd: org.zikirAd, hedef: org.hedef,
    dueDate: org.dueDate, adminName: org.adminName, createdAt: org.createdAt,
    items: org.items, public: !!org.public,
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
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});
const fail = (msg, status = 400) => json({ error: msg }, status);

/* Basit doğrulama — çöp veri yazılmasın */
function validOrg(o) {
  if (!o || typeof o !== 'object') return 'Geçersiz veri';
  if (o.type !== 'hatim' && o.type !== 'zikir') return 'Geçersiz tür';
  if (typeof o.title !== 'string' || !o.title.trim() || o.title.length > 120) return 'Başlık geçersiz';
  if (o.adminName && String(o.adminName).length > 60) return 'İsim çok uzun';
  if (o.type === 'hatim') {
    if (!Array.isArray(o.items) || o.items.length < 1 || o.items.length > 30)
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
async function requestHandler(req) {
  if (req.method !== 'POST') return fail('Yalnız POST', 405);
  let p;
  try { const raw=await req.text();if(raw.length>65536)return fail('İstek çok büyük',413);p=JSON.parse(raw); } catch { return fail('Gövde okunamadı'); }
  if (!p || typeof p!=='object'||Array.isArray(p)||!p.action) return fail('İşlem belirtilmedi');
  try{return await withOrgTransaction(store=>handleOrg(p,store));}
  catch{return fail('İşlem tamamlanamadı. Bağlantını kontrol edip tekrar dene.',503);}
}
export default async (req) => {
  const native=req.headers.get('origin')===NATIVE_ORIGIN;
  if(native&&req.method==='OPTIONS')return new Response(null,{status:204,headers:{
    'Access-Control-Allow-Origin':NATIVE_ORIGIN,
    'Access-Control-Allow-Methods':'POST, OPTIONS',
    'Access-Control-Allow-Headers':'Content-Type',
    'Access-Control-Max-Age':'3600',
    'Vary':'Origin'
  }});
  const response=await requestHandler(req);
  if(!native)return response;
  const headers=new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin',NATIVE_ORIGIN);
  headers.set('Vary','Origin');
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
};
export async function handleOrg(p,store){

  /* ── keşif işlemleri (org koduna bağlı değil) ── */
  if (p.action === 'discoverConfig' || p.action === 'discoverSet' || p.action === 'discoverList') {
    const r = await handleDiscover(p, store);
    if (r) return r;
  }
  if (p.action === 'pollGet' || p.action === 'pollVote' || p.action === 'pollSet' || p.action === 'pollClear') {
    const r = await handlePoll(p, store);
    if (r) return r;
  }

  /* ── CREATE ── */
  if (p.action === 'create') {
    const bad = validOrg(p.org);
    if (bad) return fail(bad);

    let code=randCode(6),adminToken=randCode(12);
    while(await store.get(code,{type:'json'}))code=randCode(6);
    while(await store.get('a_'+adminToken,{type:'text'}))adminToken=randCode(12);
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
      public: false, publishedAt: 0,
      code, adminToken, createdAt: Date.now(), lastActivity: Date.now(),
    };
    await store.setJSON(code, org);
    await store.set('a_' + adminToken, code);      // yönetici anahtarı → kod
    return json({ code, adminToken });
  }

  /* ── kod çöz ── */
  let code = p.code;
  if(code&&!/^[a-z0-9]{6}$/.test(code))return fail('Geçersiz kod');
  if(p.admin&&!/^[a-z0-9]{12}$/.test(p.admin))return fail('Geçersiz yönetici anahtarı');
  if (!code && p.admin) code = await store.get('a_' + p.admin, { type: 'text' });
  if (!code) return fail('Organizasyon bulunamadı', 404);

  const org = await store.get(code, { type: 'json' });
  if (!org) return fail('Organizasyon bulunamadı', 404);

  const isAdmin = !!p.admin && p.admin === org.adminToken;
  const save = () => { org.lastActivity = Date.now(); return store.setJSON(code, org); };

  /* ── GET ── */
  if (p.action === 'get') {
    return json({ org: publicView(org, isAdmin), code });
  }

  /* ── CLAIM (cüz al) ── */
  if (p.action === 'claim') {
    const it = (org.items || []).find(i => i.no === +p.no);
    if (!it || it.status !== 'bos')
      return fail('Bu cüz az önce başkası tarafından alındı');
    it.status = 'alindi';
    it.name = String(p.name || '').slice(0, 60);
    it.ts = Date.now();
    await save();
    return json({ org: publicView(org, isAdmin), code });
  }

  /* ── RELEASE (cüzü bırak) ── */
  if (p.action === 'release') {
    const it = (org.items || []).find(i => i.no === +p.no);
    if (!it || it.status !== 'alindi')
      return fail('Sadece alınmış (henüz okunmamış) cüz bırakılabilir');
    it.status = 'bos'; it.name = ''; it.ts = Date.now();
    await save();
    return json({ org: publicView(org, isAdmin), code });
  }

  /* ── COMPLETE (okundu işaretle) ── */
  if (p.action === 'complete') {
    const it = (org.items || []).find(i => i.no === +p.no);
    if (!it || it.status === 'bos') return fail('Bu cüz henüz alınmamış');
    it.status = 'okundu'; it.ts = Date.now();
    await save();
    return json({ org: publicView(org, isAdmin), code });
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
    return json({ org: publicView(org, isAdmin), code });
  }

  /* ── ADMINSET (yönetici düzeltme) ── */
  if (p.action === 'adminSet') {
    if (!isAdmin) return fail('Yetki yok', 403);
    if(!['bos','alindi','okundu'].includes(p.status))return fail('Geçersiz durum');
    const it = (org.items || []).find(i => i.no === +p.no);
    if (it) {
      it.status = p.status;
      if (p.status === 'bos') it.name = '';
      it.ts = Date.now();
    }
    await save();
    return json({ org: publicView(org, true), code });
  }

  /* ── PUBLISH (kurucu kendi hatmini herkese açık yapar/kaldırır) ── */
  if (p.action === 'publish') {
    if (!isAdmin) return fail('Yetki yok', 403);
    const cfg = await store.get('_config', { type: 'json' }) || {};
    if (!cfg.discoverEnabled) return fail('Herkese açık keşif şu an kapalı', 403);
    org.public = !!p.public;
    org.publishedAt = org.public ? Date.now() : 0;
    await save();
    // indeks güncelle
    const idx = (await store.get('_index', { type: 'json' })) || [];
    const rest = idx.filter(x => x.code !== code);
    if (org.public) rest.unshift({ code, publishedAt: org.publishedAt });
    await store.setJSON('_index', rest.slice(0, 200));
    return json({ org: publicView(org, true), code });
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
      if (!o || !o.public) continue;
      const base = {
        code: o.code, type: o.type, title: o.title, adminName: o.adminName || '',
        createdAt: o.createdAt, publishedAt: o.publishedAt || 0,
      };
      if (o.type === 'hatim') {
        const items = o.items || [];
        base.total = items.length || 30;
        base.done = items.filter(i => i.status === 'okundu').length;
        base.taken = items.filter(i => i.status !== 'bos').length;
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
