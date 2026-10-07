# ELIFA v148 — İki ayrı kulp + yaylanma tamamen kaldırıldı

## 1. Okuma ekranı: ÜST ve ALT bağımsız

| Kulp | Nerede | Neyi kapatır | Hafıza |
|---|---|---|---|
| Üst | Üst bardan **sarkar** (sağ) | Yalnız üst bar | `elifa_zen` |
| Alt | Ses çubuğundan **yükselir** (sağ) | Yalnız ses çubuğu | `elifa_zenb` |

Artık **aynı anda değil** — istediğini kapatırsın:
sadece üstü, sadece altı, ikisini birden, ya da hiçbirini.
İkisi de kapatılırsa mushaf tam ekran olur.

Her kulp barının kendi zeminini alır (`--surface` / `--chrome`),
kendi kenarını (`--line`), kapalıyken `--gold`'a döner. **0 sabit renk.**

## 2. Sûre çekmecesi: yaylanma YOK

v147'de yalnız **kapanış** düzeltilmişti; açılış hâlâ yaylanıyordu ve takılıyordu.
Artık **açılış da kapanış da** düz kayma. Kapatılan animasyonlar:

`drawerPaperRelease` · `drawerPaperRetract` · `drawerCardDrop` ·
`drawerCardRetract` · `drawerHousingOpen` · `drawerHousingClose` ·
`drawerLatchOpen` · `drawerLatchClose` · `chevSpringOpen` ·
`sarayButtonGlint` · `surahInlineOpen` (saray)

Kartların tek tek düşmesi de kaldırıldı — 114 kartın her birine
ayrı animasyon + gecikme veriliyordu, takılmanın asıl sebebi buydu.

Tek hareket kaldı: `max-height` geçişi,
**okuma barının birebir aynı eğrisi** — `cubic-bezier(.32,.72,0,1)`, 0.34 sn.

## 3. Sûre kulbu alt bara yapışık
`position:fixed; bottom:var(--tabH)` — kapalıyken de açıkken de
sekme çubuğunun tam üstünde. `--tabH` çubuğun **gerçek yüksekliğinden** ölçülür.

## Test
| | |
|---|---|
| 9 script bloğu, JS hatası | **yok** |
| v148 CSS'te sabit renk | **0** |
| Eski WebView sözdizimi (`?.` `??` `=>` `const/let`) | **yok** |
| sw.js | v147 → **v148** |
