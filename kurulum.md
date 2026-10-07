# ELIFA Mushaf v140 — KURULUM

## Bu sürümde ne var

### 1. BİRLİKTE / CÜZ PAYLAŞIMI — GERÇEKTEN ÇALIŞIYOR

Artık link **başka cihazlarda da açılıyor.** Test edildi:

| Adım | Sonuç |
|---|---|
| Hüseyin hatim oluşturur | ✓ "Çevrimdışı önizleme" uyarısı **kaybolur** |
| Başka biri linke basar (bomboş cihaz) | ✓ **Organizasyon açılır** |
| O kişi 1. cüzü alır | ✓ |
| Hüseyin yönetici linkiyle açar | ✓ **"Ayşe" ve "Mehmet" görünür** |

### 2. Düzeltilen buglar

| Bug | Sebep |
|---|---|
| Birlikte açılmıyordu | `escapeHtml` **hiç tanımlanmamış** (8 çağrı) |
| Liste çizilemiyordu | `shortName` **hiç tanımlanmamış** (4 çağrı) |
| "Organizasyona git" geri atıyordu | `closeElifaModal()` → `history.back()` **asenkron**; org push edilip hemen geri itiliyordu |

### 3. Service worker — uçak modunda açılıyor

---

## NETLIFY'YE NASIL YÜKLENİR

Bu sefer **sadece dosya atmak yetmiyor** — Netlify Function var.

### Yol A — Netlify arayüzünden (en kolay)

1. `dist` klasörünün **içindekileri** zip'le
2. Netlify → Site → **Deploys** → zip'i sürükle-bırak
3. Netlify `netlify.toml`'u okur, `npm install` yapar, fonksiyonu kurar

### Yol B — Git ile (önerilen)

```bash
git add .
git commit -m "v140 — birlikte backend"
git push
```

Netlify otomatik derler.

### İlk yüklemeden sonra kontrol

Tarayıcıda aç:
```
https://mushaf.elifaplatform.com/api/org
```
**"Yalnız POST"** yazmalı. Bunu görüyorsan fonksiyon çalışıyor.

404 görüyorsan → fonksiyon kurulmamış.

---

## DOSYA YAPISI (aynen korunmalı)

```
index.html
sw.js
manifest.json
netlify.toml          ← fonksiyon ayarı
package.json          ← @netlify/blobs bağımlılığı
_headers
_redirects
netlify/
  functions/
    org.mjs           ← BİRLİKTE BACKEND
pwa_icon-*.png
```

---

## Netlify Blobs hakkında

- **Ücretsiz** (cömert kota)
- **Kurulum yok** — veritabanı açmana gerek yok
- Netlify sitene otomatik bağlı

E�er "Blobs not enabled" hatası alırsan: Netlify → Site settings → Blobs → **Enable**.

---

## Güvenlik notu

Üyelik yok, kimlik doğrulama yok — tasarım böyle. İki anahtar var:

| Anahtar | Kim görür |
|---|---|
| `?k=kod` (6 hane) | **Herkes** — gruba atılır |
| `?y=token` (12 hane) | **Sadece kurucu** — kimseyle paylaşılmaz |

Yönetici linki 12 haneli rastgele koddur (32^12 ≈ 10^18 ihtimal). Tahmin edilemez.

Fonksiyonda giriş doğrulaması var: başlık 120, isim 60 karakter sınırı;
zikir hedefi ve katkı sayısı sınırlı; 5000'den fazla katkı reddedilir.

---

## Güncelleme yaparken

`sw.js` içindeki `VERSION` değerini **her seferinde artır**:

```js
const VERSION = 'elifa-mushaf-v140';   // → v141, v142...
```

Artırmazsan kullanıcı eski sürümü görmeye devam eder.
