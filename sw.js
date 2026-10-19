/* ═══════════════════════════════════════════════════════════════
   ELIFA MUSHAF — SERVICE WORKER  (v355)
   App-shell'i önbelleğe alır, offline açılır; dış API'lere
   (Kur'an metni/ses/tefsir) DOKUNMAZ. Güncellemede VERSION'u artır.

   v224 düzeltmeleri:
   · Sadece 200/ok/basic yanıtlar önbelleğe alınır (bozuk yanıt kaydı yok).
   · Netlify'nin SPA kuralı (/* → /index.html 200) yüzünden eksik bir dosya
     istendiğinde HTML dönüyordu; bu HTML artık JSON/PNG/JS adreslerine
     ÖNBELLEĞE YAZILMAZ (JSON.parse hatalarının ve açılmama sorununun sebebi).
   · version.json / duyuru.json / manual-*.json → her zaman ağ öncelikli.
   · Yönlendirilmiş (redirected) navigasyon yanıtı önbelleğe yazılmaz.
   ═══════════════════════════════════════════════════════════════ */
const VERSION = 'elifa-mushaf-v362-member-hatim-comments';
const CACHE   = VERSION;

/* Fontlar index.html içinde base64 gömülü → ayrıca cache'lenmez. */
const CORE = [
  './', './index.html', './manifest.json', './version.json',
  './pwa_icon-192.png', './pwa_icon-512.png',
  './pwa_icon-maskable.png', './pwa_apple-180.png',
  './top_logo_hilal.svg', './assets/account.js?v=362', './assets/account.css?v=362',
  './assets/hatim-community.js?v=362', './assets/hatim-community.css?v=362',
  './assets/community-admin.js?v=362', './assets/community-admin.css?v=362',
  './assets/locale.js?v=2', './assets/reader-help.js?v=2', './assets/reader-help-drafts.js?v=1', './assets/reader-help.css?v=1',
  './assets/ui-extra-drafts.js?v=2', './assets/ui-extra.js?v=1',
  './assets/dua-practice.js?v=351', './assets/dua-practice.css?v=351',
  './assets/gear-sheet.css?v=358', './assets/workflow-i18n.js?v=358', './assets/study-workflow.js?v=360', './assets/study-workflow.css?v=355',
  './assets/study-split.js?v=360', './assets/study-sessions.js?v=360',
  './assets/study-surah-picker.js?v=330', './assets/home-study-polish.css?v=360',
  './assets/split-audio.js?v=294', './assets/split-cache.js?v=291',
  './assets/mp3quran-reciter.js?v=2',
  './assets/afasy-mp3quran-word-timings.json?v=324',
  './assets/sudais-vbr-index.json?v=263',
  './assets/audio-timing-overrides-v3.json',
  './assets/audio-timing-overrides-r3-r5.json?v=289',
  './assets/audio-timing-overrides-r10.json',
  './assets/verified-verse-audio.js?v=267',
  './assets/verified-verse-audio-r12.json'
];
for(const language of ['en','de','ru','ar','fr','es','el','zh','ja','ko','hi','ur','it','id','nl','pt','fa','bn','ms','sw']){
  CORE.push(`./gizlilik/${language}.html`,`./destek/${language}.html`);
}
CORE.push('./gizlilik/index.html','./destek/index.html','./assets/guide-drafts.js?v=3');
// A missing help page or optional timing index must not block an update, but
// the complete executable shell must exist before we replace the old worker.
const REQUIRED = CORE.filter(u=>u==='./index.html'||u==='./manifest.json'||/\.(js|css)(\?|$)/.test(u));
async function installFile(cache,path){
  const req=new Request(new URL(path,self.location.href),{cache:'reload'});
  const res=await fetch(req);
  if(!cacheable(req,res))throw Error('Invalid offline asset: '+path);
  await cache.put(req,res);
}

/* Bayat kalmaması gereken dosyalar → ağ önce */
function netFirstPath(p) {
  return /\/(version|duyuru)\.json$/.test(p) || /\/manual-[a-z-]+\.json$/.test(p);
}

function isHtml(res) {
  try { return (res.headers.get('content-type') || '').indexOf('text/html') >= 0; }
  catch (_) { return false; }
}

/* SPA fallback koruması: HTML olmayan bir adrese HTML gelmişse kaydetme */
function cacheable(req, res) {
  if (!res || !res.ok || res.status !== 200) return false;
  if (res.type !== 'basic') return false;
  if (res.redirected) return false;
  const p = new URL(req.url).pathname;
  const wantsHtml = req.mode === 'navigate' || /(\/|\.html)$/.test(p);
  if (!wantsHtml && isHtml(res)) return false;   /* eksik dosya → index.html geldi */
  return true;
}

self.addEventListener('install', function (e) {
  e.waitUntil((async function () {
    const c = await caches.open(CACHE);
    const results=await Promise.allSettled(REQUIRED.map(u=>installFile(c,u)));
    if(results.some(result=>result.status==='rejected')){
      await caches.delete(CACHE);
      throw Error('Offline shell incomplete; keeping the previous worker');
    }
    await Promise.allSettled(CORE.filter(u=>!REQUIRED.includes(u)).map(u=>installFile(c,u)));
  })());
});

self.addEventListener('activate', function (e) {
  e.waitUntil((async function () {
    const current=await caches.open(CACHE);
    for(const path of REQUIRED){
      const req=new Request(new URL(path,self.location.href));
      if(!cacheable(req,await current.match(req)))throw Error('Offline shell incomplete');
    }
    const keys = await caches.keys();
    await Promise.all(keys.map(function (k) {
      return k.startsWith('elifa-mushaf-') && k !== CACHE ? caches.delete(k) : null;
    }));
    await self.clients.claim();
  })());
});

self.addEventListener('message', function (e) {
  if (e.data === 'skipWaiting') { self.skipWaiting(); }
});

self.addEventListener('fetch', function (e) {
  const req = e.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch (_) { return; }
  if (url.origin !== self.location.origin) return;   /* dış API/CDN'e karışma */
  if (url.pathname.indexOf('/.netlify/') === 0) return;
  if (url.pathname.indexOf('/api/') === 0) return;
  // Prayer MP3s are large, optional downloads managed by the prayer player.
  if (url.pathname.startsWith('/assets/dua-audio/')) return;

  /* 1) Navigasyon → ağ önce, offline'da index.html */
  if (req.mode === 'navigate') {
    e.respondWith((async function () {
      try {
        const net = await fetch(req);
        // Keep the installed shell pinned to this worker. A navigation can
        // return a newer release before its own required assets finish
        // installing; it must not overwrite this worker's offline fallback.
        return net;
      } catch (_) {
        return (await (await caches.open(CACHE)).match('./index.html')) || Response.error();
      }
    })());
    return;
  }

  /* 2) Taze kalması gerekenler → ağ önce, offline'da önbellek */
  if (netFirstPath(url.pathname)) {
    e.respondWith((async function () {
      try {
        const net = await fetch(req);
        if (cacheable(req, net)) {
          const c = await caches.open(CACHE);
          c.put(req, net.clone()).catch(function () {});
        }
        return net;
      } catch (_) {
        return (await caches.match(req)) || Response.error();
      }
    })());
    return;
  }

  /* 3) Geri kalan her şey → önbellek önce, arkada tazele */
  e.respondWith((async function () {
    const cached = await caches.match(req);
    const net = fetch(req).then(function (res) {
      if (cacheable(req, res)) {
        caches.open(CACHE).then(function (c) { c.put(req, res.clone()).catch(function () {}); });
      }
      return res;
    }).catch(function () { return cached; });
    return cached || net;
  })());
});
