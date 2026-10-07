/* ⛔ LEGACY CLEANUP ONLY — DO NOT REGISTER THIS FILE ⛔
   Aktif service worker: sw.js — bu dosya sadece v113 kalıntısını temizler. */
/* ═══════════════════════════════════════════════════════════════
   ELIFA — ESKİ SERVICE WORKER: KENDİNİ İMHA EDER

   Bu dosya v113'ten kalma bir service worker'dı. Eski cihazlarda hâlâ
   kayıtlı ve şunları yapıyordu:
     · v113'ün index.html'ini önbellekten veriyor (ağa hiç çıkmadan)
     · o eski sayfa açılınca yine kendisini kaydediyor  → kısır döngü
     · activate'te BİZİM yeni önbelleklerimizi siliyor

   Netlify'ye ne atılırsa atılsın telefonda eski sürüm kalıyordu.

   Artık bu dosya hiçbir şey önbelleğe almaz. Kurulur kurulmaz:
     1. eski uygulama önbelleklerini siler; indirilen sesleri korur
     2. kendi kaydını iptal eder
     3. açık sayfaları yeniden yükler → ağdan taze index.html iner
     4. yeni index.html doğru service worker'ı (./sw.js) kaydeder
   Döngü kırılır. Bir kez çalışır, sonra ortadan kaybolur.
   ═══════════════════════════════════════════════════════════════ */

self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil((async function () {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map(function (k) {
        return k.startsWith('elifa-mushaf-') ? caches.delete(k) : null;
      }));
    } catch (_) {}

    try { await self.registration.unregister(); } catch (_) {}

    try {
      const cs = await self.clients.matchAll({ type: 'window' });
      for (const c of cs) { try { await c.navigate(c.url); } catch (_) {} }
    } catch (_) {}
  })());
});

/* fetch dinleyicisi YOK → her istek doğrudan ağa gider, önbellek devre dışı */
