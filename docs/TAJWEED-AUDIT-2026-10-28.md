# Tecvid renkleri: kaynak, eşleme ve görünüm denetimi

Tarih: 28 Ekim 2026. Bu rapor `codex/tajweed-glyph-safety` dalındaki
değişiklikleri kapsar. Mushaf metni, fontu, kelime düğümleri ve ses sistemi
değiştirilmedi. Canlı yayın ve dinî uzman onayı bu teknik denetimin parçası
değildir.

## Doğrulanan hata ve düzeltme

Bakara 2:283'te kaynak `فَرِهَٰنٞ مَّقۡبُوضَةٞ`, varsayılan Türk Mushafı
`فَرِهَانٌ مَقْبُوضَةٌ` yazar. Küçük elifin tam elifle yazılması yüzünden
eski aktarım ilk kelimenin tamamını atlıyor, tenvin ile sonraki mîmin ortak
işareti kayboluyordu. Artık yalnız bütün kelimede **tek ve açık** harf
karşılığı varsa küçük elif tam elife eşleniyor. Belirsiz karşılıkta renk
uygulanmıyor. Tarayıcıda 2:283 için `نٌ` ve sonraki `مَ` aynı grupta
görüldü. Farklı konulardaki renkler lâm-elifin iki parçasını ayıracaksa
birleşik şekil normal mürekkep renginde bırakılıyor.

## Kaynak ve kapsam

Kaynak: [Quran.ws Tajweed](https://quran.ws/docs/build/tajweed/),
`quran-ws/quran-tajweed` commit
`4fec00b726d32163fba72b41c2f4cfdd025fe645`, CC BY 4.0. Kaynağın
`editions/uthmani-hafs.json` metin özeti:
`b5d29736bb3ef49d9d331c4e60a59d83fe899b921e9e8dc35911bd4a18ce55f3`.
Üreticiler metin özeti, sûre/âyet sayısı, kural sürümü ve rivayeti kontrol eder.
`disputed` veya `needsReview` durumundaki kurallar gösterilmez. Kaynağın
[kapsam açıklaması](https://quran.ws/docs/reference/quran-tajweed/) yedi
konuyla sınırlıdır; renksiz bir yerin kuralsız olduğu söylenemez.

| Ölçü | Medine | Varsayılan Türk Mushafı |
| --- | ---: | ---: |
| İncelenen âyet | 6.236 | 6.236 |
| Harf dizisi tam eşleşen âyet | 6.234 | 2.113 |
| Kısmen eşleşen âyet | 0 | 4.121 |
| Hiç eşleşmeyen âyet | 2 | 2 |
| Kaynak işaret aralığı | 147.255 | 147.255 |
| İnceleme/statü nedeniyle dışlanan aralık | 4.143 | 4.144 |
| Yazı eşleşmediğinden atlanan aralık | 64 âyet düzeyinde | 10.168 |
| Başka kuralın önceliğinde kalan aralık | 41.806 | 39.833 |
| Renk uygulanan kaynak aralığı | 101.242 | 93.110 |

Bu sayılar üretilmiş JSON dosyalarının `meta.json` ve `turk-meta.json`
istatistikleridir. Üst üste binen kaynak kurallarının yalnız öncelikli olanı
göründüğü için “başka kuralın önceliğinde kalan” aralıklar yazı eşleme hatası
olarak sayılmaz. Medine'de `2:72` ve `17:7` harf dizisi tutmadığından tüm
âyet renksiz kalır. Türk Mushafı'nda 10.168 kaynak işaret aralığı güvenli
aktarılmadı; bunlar otomatik tahminle doldurulmamalıdır.

## Test ve kalan sınır

`node --test tests/tajweed-overlay.test.mjs` bütün kaynak ayetlerin konumunu,
gerçek okuyucu kelime gruplarını, tüm renkli kelimelerin görünür birleşik
harflerini ve lâm-elif çiftlerini tarar. `npm run build` sonucu 700 test geçti,
6 atlandı, hata yok. Masaüstü Chrome'da varsayılan Mushafın 49. sayfasında
veri yüklenmesi, gerçek CSS Highlight aralıkları ve 2:283 örneği kontrol
edildi. Tarayıcı tecvid renklendirmesini desteklemiyorsa seçenek pasif kalır;
test moduna girişte de eksik CSS API çağrılmaz. Ayar açıklamaları Türkçe ve
İngilizce sunulur; diğer diller İngilizce açıklama görür.

Bu teknik doğrulama **tecvid hükümlerinin tamamının dinî açıdan onaylandığı**
anlamına gelmez. Kaynağın kısmi kapsamı, Türk yazımında eşleşmeyen yerler ve
öncelik verilen çakışan işaretler bir tecvid/kıraat uzmanıyla örneklem ve
gerekirse tam tarama üzerinden incelenmelidir. Gerçek Android/iOS cihazlarda
eski WebView sürümleri, farklı ekran boyutları ve çevrimdışı kullanım ayrıca
kontrol edilmelidir.
