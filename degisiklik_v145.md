# ELIFA v145 — Tam ekran okuma (bardan sarkan kulp)

## Ne yapıldı
Yüzen kutu düğme **tamamen söküldü**. Yerine üst barın **sağ alt köşesinden
sarkan bir kulp** kondu — çekmece kulpu gibi, barın parçası.

- **Bas** → bar yukarı **kayar** (0.32 sn), boşluğu da kapanır → mushaf tam ekran
- Kulp barın İÇİNDE olduğu için **onunla birlikte kayar**, tepede asılı kalır
- Ok **döner** (▼ ⇄ ▲)
- **Tekrar bas** → bar geri iner
- Tercih hatırlanır (`elifa_zen`)

## Tema uyumu — sıfır sabit renk
Kulp barın kendi değişkenlerini kullanır:

| Özellik | Değer |
|---|---|
| Zemin | `var(--chrome)` — **barın zemininin aynısı** |
| Çerçeve | `var(--line)` |
| İkon | `var(--muted)` → tam ekranda `var(--gold)` |
| Gölge | `var(--shadow)` |

Kod içinde **tek bir sabit renk yok** (0 adet `#hex`, 0 adet `rgba()`).
16 temanın hepsi bu değişkenleri kendi paletinden basıyor →
kulp her temada kendiliğinden doğru renkte çıkar.
**Hiçbir temanın CSS'ine dokunulmadı.**

## Ölçüm
Kayma mesafesi barın gerçek yüksekliği (`--rtopH`).
Okuma ekranı `display:none` iken ölçülemediği için, ekran açıldığı an
(MutationObserver, body 'rd' sınıfı) yeniden ölçülür. Ekran döndürmede de.

## Kapsam
`body.rd.zen` — **yalnız okuma ekranı**. Ana ekran, Ezber, Kayıtlar,
Ayarlar, Birlikte etkilenmez.

## Test
| | |
|---|---|
| 9 script bloğu, JS hatası | **yok** |
| Kulp kodunda sabit renk | **0** |
| Eski WebView'i kıran sözdizimi (`?.` `??` `=>` `const/let`) | **yok** |
| sw.js | v144 → **v145** |
