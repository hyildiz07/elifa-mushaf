# ELIFA v147 — Kayma + yapışık kulp + okuma alt çubuğu

## 1. Sûre listesi kapanışı: yaylanma YOK, kayma VAR
Kapanışta çalışan tüm zıplama animasyonları kapatıldı:
`drawerPaperRetract` · `drawerCardRetract` · `drawerHousingClose` ·
`spring-close` · `chevSpring` · `sarayButtonGlint`

Yerine düz kayma — **okuma barının birebir aynı eğrisi**:
`cubic-bezier(.32,.72,0,1)`, 0.34 sn.

Ayrıca kapanışta **430 ms boşuna bekleniyordu** (animasyon bitsin diye).
20 ms'ye indirildi → kulba basar basmaz kaymaya başlar. Gecikme hissi gitti.

> Açılış animasyonu (kartların sırayla düşmesi) **korundu** — sadece
> kapanış istendi. İstenirse açılış da kaymaya çevrilebilir.

## 2. Kulp alt bara YAPIŞIK
Önce `.homeLibrary`'nin alt kenarına bağlıydı → sekme çubuğuyla arasında
boşluk kalıyordu. Artık `position:fixed` ve `bottom:var(--tabH)` —
**sekme çubuğunun tam üstüne oturur**, kapalıyken de açıkken de. Boşluk yok.

`--tabH` sekme çubuğunun **gerçek yüksekliğinden** ölçülür (JS), sabit sayı değil
— tema sekme çubuğunun boyunu değiştirse bile kulp yine yapışık kalır.

## 3. Okuma ekranı: alt ses çubuğu da kayıyor
`.pbar` (kıraat çubuğu, ekranın altında sabit) artık kulpla birlikte
**aşağı kayar**. Tek kulp → hem üst bar hem alt çubuk → **tam ekran mushaf**.

Aynı eğri, aynı süre. `transform` kullanıldığı için düzen bozulmaz.

> Kıraat çalarken barları gizlersen kontroller de gider — kulba bir kez
> basınca geri gelir.

## Tema
v147'de eklenen CSS'te **0 sabit renk**. Hiçbir temaya dokunulmadı.

## Test
| | |
|---|---|
| 9 script bloğu, JS hatası | **yok** |
| sw.js | v146 → **v147** |
