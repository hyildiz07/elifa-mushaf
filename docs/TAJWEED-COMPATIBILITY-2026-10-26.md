# Tecvidli gösterim: mevcut metne güvenli eşleme

> Tarihsel rapor: burada anlatılan Quran.ws renk aktarımı kaldırıldı.
> Güncel renkli tecvid görünümü Quran Foundation QCF V4 fontuyla açılır.

> Güncel kapsam ve test sonuçları: [28 Ekim 2026 tecvid denetimi](TAJWEED-AUDIT-2026-10-28.md).
> Aşağıdaki sayılar ilk uyarlamanın tarihî kaydıdır.

Tarih: 26 Ekim 2026. Çalışma `codex/tajweed-feasibility` dalındadır; canlı
siteye dağıtılmadı. Mushaf metni, fontlar, kelime elemanları ve ses zamanlaması
değiştirilmedi.

## Kaynak ve kullanım

[Quran.ws Tajweed](https://quran.ws/docs/build/tajweed/) Hafs açıklamaları,
`quran-ws/quran-tajweed` commit
`4fec00b726d32163fba72b41c2f4cfdd025fe645`, corpus `0.4.2`.
Veri [CC BY 4.0](https://quran.ws/docs/reference/licensing/) lisanslıdır.
Uygulamanın Hıfz ayarı ve Hakkında ekranı kaynak, lisans ve uyarlama bilgisini
gösterir. Önceden hesaplanmış iki renk dosyası `assets/tajweed/` altında
çevrimdışı uygulama kabuğuna eklenmiştir. Kaynak edition metni uygulamada
gösterilmez; yalnız konumlar bizim mevcut metnimize dönüştürülür.

Üretim komutları (pinned committen alınan `editions/uthmani-hafs.json`,
`packages/annotations/uthmani-hafs.json`, `packages/rules/rules.json` ile):

```sh
node scripts/build-tajweed-overlay.mjs edition.json annotations.json rules.json
node scripts/build-tajweed-turkish.mjs edition.json annotations.json rules.json
```

Üreticiler annotation edition özetini doğrular:
`b5d29736bb3ef49d9d331c4e60a59d83fe899b921e9e8dc35911bd4a18ce55f3`.

## Metin aynı, dijital yazım farklı

Kaynağın karakter konumları uygulamanın metnine doğrudan uygulanamaz. Örneğin
Fâtiha 1:1'de kaynak `بِسۡمِ`, uygulamanın Medine metni `بِسْمِ` kullanır.
Her ikisi aynı okunuştur ama farklı hareke kodları nedeniyle sonraki karakter
konumları kayar. Türk mushafında `ٱ` ile `ا`, küçük elif ile tam elif gibi
ek yazım farkları vardır.

Bu yüzden her âyetin **temel harf sırası** karşılaştırılır. Medine metninde
6.236 âyetin 6.234'ü harf harf eşleşir. `2:72` ve `17:7` bütün âyet olarak
renksiz bırakılır. Başka işaretlemede güvenle eşleşmeyen bölümler de boyanmaz.

Varsayılan Türk mushafında 2.113 âyet baştan sona eşleşir. 4.118 âyette
yalnız aynı sıradaki veya iki yönde aynı yere oturan aynı yazımlı kelimeler
eşlenir. Beş âyette hiç güvenli renk konumu elde edilemedi. Dolayısıyla
varsayılan yazımda tecvidli gösterim **çalışır, fakat kısmi kapsamalıdır**.
Kaynakta olan bir kuralı yanlış harfe aktarmak yerine bazı harfler normal
görünür. Türk mushafı için tüm renklerin tamamlandığı iddia edilmez.

| Ölçü | Medine | Varsayılan Türk |
| --- | ---: | ---: |
| Kaynak âyet sayısı | 6.236 | 6.236 |
| Tam âyet harf eşleşmesi | 6.234 | 2.113 |
| En az bir güvenli işaretleme bulunan âyet | 6.214 | 6.000'den fazla |
| Üretilen renk aralığı | 112.482 | 93.513 |

Kural çakışmalarında kaynağın başlangıcı önce, eşit başlangıçta uzun aralığı
önce alan sırası kullanılır. Kaynaktaki `disputed` işaretli kurallar aktarılmaz.
Bu teknik eşleme, uzman kıraat/tecvid incelemesinin yerini tutmaz.

## Ekran ve güvenlik sınırı

Hıfz ayarındaki **Tecvidli gösterim** anahtarı varsayılan olarak kapalıdır.
Üç hazır renk düzeni, kişisel renk düzeni ve yedi kural grubunun ayrı ayrı
aç/kapat ile renk seçimi vardır. `CSS.highlights` / `::highlight()`
metin düğümlerini ve font şekillendirmesini değiştirmeden renk uygular.
Ezber testinde renk katmanı kapanır; testten çıkınca geri gelir. Tarayıcı
desteklemiyorsa özellik kapalı kalır. Önceki/yeni verinin karışmaması
için her âyetin yeniden kurulan ekran metni üretilmiş sayısal parmak iziyle
karşılaştırılır; tutmazsa renk uygulanmaz. Ses, çalışma planı ve kelime
seçimi mekanizmasına dokunulmaz.

Yerel doğrulama: `node --test tests/tajweed-overlay.test.mjs` Medine ve Türk
mushafındaki tüm üretilmiş konumların uygulamanın gerçek kelime düzenine
sığdığını kontrol eder. `npm run build`: 694 geçti, 6 atlandı. Yerel tarayıcıda
varsayılan Türk mushafının Fâtiha görünümü, ayrı kural kapatma, kişisel renk,
testte gizleme, testten çıkınca renklerin dönüşü, font ve satırlar görsel olarak
kontrol edildi. Canlı dağıtım yapılmadı.

Yayın öncesi kalan inceleme: Bir tecvid/kıraat uzmanı, özellikle Türk mushafı
eşlemesinin örneklem renklerini ve atlanan yerleri kontrol etmeli. Android ve
iOS gerçek cihazlarda eski WebView davranışı ile çevrimdışı açılış ayrıca
denenmelidir. Bu dalı canlıya almadan önce bu kontroller gereklidir.
