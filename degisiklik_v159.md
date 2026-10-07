# ELIFA v159

## 1. Splash logosu GERİ GELDİ
Yanlış anlamışım, özür. Geri kondu.

**Ama önemli bir gerçek:** kaldırdığım splash logosu ile `pwa_icon-512.png`
**byte-byte aynı dosya** (MD5: e5d06285…). Yani "geri getir" dediğin PNG ile
"kaldır" dediğin hilal-yıldız **aynı görsel.**

Çift görünmesinin sebebi bu değil. **İKİ AYRI SPLASH var:**

| # | Kim çiziyor | İçerik | Kaldırılabilir mi |
|---|---|---|---|
| 1 | **Android / Chrome** — `manifest.json`'daki ikondan otomatik | hilal + yıldız | **HAYIR** — işletim sistemi çiziyor, HTML'den müdahale edilemez |
| 2 | **Uygulama** (`#splash`) | aynı ikon + "Elifa Mushaf" + altın çizgi | evet |

Yani aynı hilal iki kez görünüyor: biri OS'ten, biri sayfadan.

**Yaptığım:** ikisini **kusursuz üst üste bindirdim.**
`#splash` zemini artık `manifest.json`'daki `background_color` ile birebir
aynı: `#F8EFD9`. (Önceden radyal gradyandı → geçişte renk sıçraması oluyordu,
"ikinci bir ekran açıldı" hissi buradan geliyordu.)

Artık OS splash'ından uygulama splash'ına geçiş **görünmez** — tek bir
açılış ekranı gibi akar.

> Hilali gerçekten istemiyorsan tek yol: `manifest.json`'daki ikonu
> değiştirmek. Yeni ikon ver, hem OS splash'ı hem uygulama simgesi değişir.

## 2. Kapanış takılması — ASIL SEBEP BULUNDU
Tahmin değil, ölçüm: listede **114 kart** var ve her kartta
`box-shadow` + gradyan + `filter` + yuvarlatma — **24 ayrı CSS kuralı.**

hero/quick yüksekliği değişince flex kabı yeniden düzenleniyor ve
**114 kartın hepsi baştan çiziliyor.** Telefon yetişemiyor.

Önceki denemelerim (animasyon susturma, tek animasyona indirme, will-change)
doğruydu ama **yetersizdi** — asıl yük buradaydı.

**Çözüm:**
```css
.surahViewport .card{
  content-visibility:auto;
  contain-intrinsic-size:auto 56px;
}
```
Ekranda görünmeyen kartlar **hiç çizilmiyor**: 7 kart çizilir, 107'si atlanır.
`contain-intrinsic-size` sayesinde kaydırma ve yükseklik doğru kalır.
