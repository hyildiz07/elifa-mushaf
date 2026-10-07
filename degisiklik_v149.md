# ELIFA v149 — Yaylanma tamamen bitti + kulp alt bara yapıştı

## 1. Yaylanmanın ASIL kaynağı: saray'ın kendi animasyon seti
v148'de 12 animasyon kapatılmıştı ama saray'da hiçbiri işe yaramadı.
Sebep: **saray'ın ayrı bir set'i var** ve seçicileri daha güçlü:

`body.drawer-opening[data-layout="saray"] .surahViewport.expanded`  ← (0,4,0)
`body.drawer-opening .surahViewport.expanded`                        ← (0,3,0)  benim kural

Saray'ınki kazanıyordu. Susturulan saray animasyonları:
`sarayDrawerOpen` · `sarayDrawerRow` · `sarayDrawerClose` · `sarayRowRetract` ·
`sarayRailShine` · `sarayButtonLatch` · `sarayButtonGlint` ·
`surahInlineOpen` · `surahRowsDown`

Genel set (v148'de kapatılanlar) da aynen duruyor.
**Toplam 19 animasyon** birebir aynı seçiciyle, daha sonra, `!important` ile susturuldu.

Kalan tek hareket: `max-height` geçişi —
**okuma barının birebir aynı eğrisi**, `cubic-bezier(.32,.72,0,1)`, 0.34 sn.
Açılış da kapanış da aynı.

## 2. Kulp–alt bar boşluğu: ölçüm hatası
`--tabH` (alt barın yüksekliği) **hiç ölçülemiyordu**: ölçüm kodu sayfa
yüklenirken çalışıyor, o an alt bar `display:none`, `offsetHeight = 0`.
Ölçüm sessizce atlanıyor, yedek değer **70px** kullanılıyordu.
Alt barın gerçek boyu ~90px → aradaki ~20px **görünen boşluk buydu**.

Artık ölçüm:
- body'nin **her sınıf değişiminde** (yalnız okuma ekranında değil)
- yüklemeden 60 / 300 / 1000 ms sonra tekrar
- alt barın boyu değişirse **ResizeObserver** yakalar

## Kontrol
Ayarlar'ın en altında **"sürüm 149"** yazmalı. Yazmıyorsa eski sürüm
önbellekte kalmış — uygulamayı kapatıp aç.

## Test
| | |
|---|---|
| 9 script bloğu, JS hatası | **yok** |
| v149 sonrası açık kalan animasyon | **0** |
| v149 CSS'te sabit renk | **0** |
| sw.js | v148 → **v149** |
