# ELIFA v151 — GÜNCELLEME MEKANİZMASI BOZUKMUŞ

## Neden hiçbir değişiklik görünmüyordu

Kodda hata yoktu. **Uygulama yeni sürümü hiç almıyordu.**

`sw.js` şunu yapıyor:
```js
const v = await fetch('./version.json', {cache:'no-store'});
if (!v.ok) return;
const d = await v.json();               // ← BURADA PATLIYOR
if (d.version === VERSION) return;
```

**`version.json` diye bir dosya YOK.** Hiç olmamış.

`_redirects` içindeki `/* → /index.html 200` catch-all'ı bu isteği yakalıyor
ve **index.html'i döndürüyor** — HTTP 200, `text/html`.
`v.ok` doğru çıkıyor, sonra `v.json()` HTML'i parse edemeyip **hata atıyor**,
`catch{}` bloğu hatayı **sessizce yutuyor**.

Sonuç: **güncelleme kontrolü hiçbir zaman çalışmadı.**
Sayfa her açılışta önbellekten geliyordu. Netlify'ye ne atarsak atalım,
telefondaki uygulama eski kalıyordu.

Üstelik kontrol **6 saatte bir**e kısıtlıydı — çalışsa bile geç kalırdı.

## Düzeltme

| | |
|---|---|
| `version.json` | **oluşturuldu** (~35 bayt) |
| `_headers` | `/version.json` → `Content-Type: application/json`, `Cache-Control: no-store` |
| Kontrol sıklığı | 6 saat → **1 dakika** |
| `sw.js` | v150 → **v151** |

Artık uygulama her açılışta `version.json`'a bakar (35 bayt), sürüm
farklıysa yeni `index.html`'i arka planda indirir ve haber verir.

## BU SEFER NASIL YÜKLEYECEKSİN

Eski service worker hâlâ önbelleği tutuyor. Bir kez elle kırmak gerekiyor:

1. Netlify'ye at
2. Telefonda uygulamayı **tamamen kapat** (son uygulamalardan kaydır)
3. **Aç → kapat → tekrar aç** (ilk açılışta yeni SW kurulur, ikincide devreye girer)
4. Ayarlar'ın altında **"sürüm 151"** yazmalı

Hâlâ eski sürüm yazıyorsa:
**Ayarlar → Uygulamalar → Elifa Mushaf → Depolama → Önbelleği temizle**

Bundan sonraki güncellemeler kendiliğinden gelecek — bu son elle müdahale.
