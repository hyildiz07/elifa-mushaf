# ELIFA v158

## 1. Kapanış takılması — sebebi: AYNI ANDA ÜÇ ŞEY

Kulba basınca kapanışta şunlar aynı anda oluyordu:

| # | Ne oluyordu |
|---|---|
| 1 | hero + quick geri açılıyor (0.36 sn geçiş) |
| 2 | 114 kartlık liste `scrollTop=0`'a **atlıyor** → tam reflow |
| 3 | `home.scrollTo({behavior:'smooth'})` — üstelik `#home` tam o an `overflow:hidden`'a dönüyor, yumuşak kaydırma **yarıda kesiliyor** |

Üç hareket birbiriyle yarışıyordu. Takılma hissi buradan.

**Çözüm — tek animasyon kaldı:**
- `home.scrollTop = 0` → **anlık** (smooth kaldırıldı, yarışacak bir şey yok)
- Liste sıfırlaması **geçiş bittikten sonra** (380 ms)
- Geriye tek hareket kaldı: hero/quick kayması
- `will-change:max-height` → tarayıcı katmanı önceden hazırlar

## 2. Açılıştaki çift logo

Splash ekranında **hem PNG logo hem yazı** vardı; hemen ardından ana ekranın
kendi logosu geliyordu → aynı marka **iki kez** görünüyordu.

- Splash'taki `<img>` (gömülü PNG) **tamamen söküldü** → **51,9 KB** daha küçük dosya
- Splash süresi 1100 ms → **650 ms** (resim gidince o kadar beklemeye gerek yok)
- Splash'ta kalan: "Elifa Mushaf" + "Kur'ân-ı Kerîm" + altın çizgi

Artık logo bir kez, doğru yerde görünüyor.

## Boyut
index.html **51,9 KB küçüldü.**
