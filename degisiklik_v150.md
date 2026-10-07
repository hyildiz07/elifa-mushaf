# ELIFA v150 — Açılış belli oluyor + kulp alt bara yapıştı

## 1. "Açıldığı anlaşılmıyor" — sebep ve çözüm

### Sebep
Saray teması şunu yazmış:
```
body[data-layout="saray"] .surahViewport{ max-height:none; }
```
`max-height:none` → **açık ve kapalı yükseklik BİREBİR aynı.**
Liste zaten hep tam boy, içinde kayıyor. Görünen tek fark o yaylanma
animasyonuydu; onu kaldırınca geriye hiçbir şey kalmadı.
Yani düğme hiçbir zaman gerçek bir çekmece açmıyordu — sadece animasyon oynatıyordu.

### Çözüm
Açılınca **sayfa kendiliğinden aşağı kayar** (yumuşak), liste ekranı doldurur.
Kapanışta zaten tersi yapılıyordu — açılışta eksikti, simetri kuruldu.

Üstteki bloklar (besmele, Birlikte, Kaldığın Yer) **toplanmıyor** — kapalıyken
birkaç sûre görünsün istediğin düzen bozulmuyor. Sadece görüş alanı kayıyor.

## 2. Alt bar boşluğu — üçüncü ve son deneme
`offsetHeight` güvenilmezmiş:
- `display:none` iken **0** döner (ölçüm sessizce atlanır → yedek 70px)
- safe-area dolgusunu bazen kaçırır

Artık yükseklik değil, sekme çubuğunun **ekrandaki gerçek üst kenarı** ölçülüyor:
```
gap = innerHeight − tabbar.getBoundingClientRect().top
```
Bu, çubuk ne kadar uzun olursa olsun, safe-area ne olursa olsun **tam oturur**.
Değer akıl dışıysa (0 veya ekranın yarısından büyük) yazılmaz — bozulma olmaz.

## Test
| | |
|---|---|
| 9 script bloğu, JS hatası | **yok** |
| sw.js | v149 → **v150** |

Ayarlar'ın altında **"sürüm 150"** yazmalı.
