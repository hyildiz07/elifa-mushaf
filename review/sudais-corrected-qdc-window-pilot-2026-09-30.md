# Südeys QDC düzeltilmiş pencere pilotu (28:44 ve 5:111)

**Karar:** Eski pilotun bu iki âyette “hedef âyet bulunmadı” bulgusu, yanlış sağlayıcı zaman penceresi için geçerlidir; hedef âyetlerin özgün QDC sesinde bulunmadığı anlamına gelmez. Kaynakla eşleştirilmiş QUL adayının çevresinde QUD Base ve Large modelleri hedefleri ve komşularını aynı sırada tanıdı. Bu yalnızca inceleme kanıtıdır; hiçbir sınır otomatik kesim onayı taşımaz.

| Âyet | Eski sağlayıcı meta aralığı (ms) | QUL/QDC kaynak eşleşmesi adayı (ms) | İki QUD modelinin QDC sesindeki hedefi (ms) | Komşu etiketleri |
| --- | ---: | ---: | ---: | --- |
| 28:44 | 643040–652390 | 653640–663092 | **653780–663460**, 1–13 kelime tek öbek | 28:43:16, 651500–653680; 28:45:1–2, 663520–666000 |
| 5:111 | 2475690–2489460 | 2496497–2511277 (QUL +126057 ms) | **2496560–2511493**, 1–8 ve 9–13 iki öbek | 5:110:62–63, 2494000–2496520; 5:112:1–3, 2511523–2514000 |

28:44'ün QUL adayından QUD başlangıcı 140 ms sonra, bitişi 368 ms sonra. 28:45'in ilk model etiketi hedefin bitişinden yalnız 60 ms sonra başlıyor. 5:111'in QUD başlangıcı QUL adayından 63 ms sonra, bitişi 216 ms sonra; 5:112 ilk etiketi yalnız 30 ms sonra başlıyor. Bu farklar, QUL uçlarının veya QUD etiket uçlarının son fonemi koruyan oynatma kesimleri olarak doğrudan alınamayacağını gösterir.

`node review/recheck-sudais-28-44-qdc.mjs` 28. sûre için 651500–666000 ms, `node review/recheck-sudais-5-111-qdc.mjs` 5. sûre için 2494000–2514000 ms penceresini özgün yerel QDC MP3'ünden bayt sıfırdan çözer. Her betik aynı WAV baytlarını QUD Base ve Large'a `hafs`/GPU ile ayrı isteklerde verir. Ham öbek etiketleri, zamanlar, model güvenleri, MP3 ve WAV SHA-256 kimlikleri sırasıyla [28:44 JSON](sudais-28-44-corrected-window-align.json) ve [5:111 JSON](sudais-5-111-corrected-window-align.json) içindedir. QDC MP3 SHA-256 değerleri 28 için `f8e5291cf10a3a29230fd443b5ddabc4297cf5b16c70250dda3bfe6314917576`, 5 için `16fad03b000d69492da95e9f970f220ae097a6693815917924b43f1730ae8cdb` idi.

Eski pilotun 28:44 penceresi aslında 28:43 kuyruğuna; 5:111 penceresi 5:110 devamına bakmıştı. Bu nedenle [eski pilot](sudais-independent-qdc-pilot-2026-09-30.md) sonuç tablosunun bu iki satırı, kaynakla eşleştirilmiş gerçek hedef konumunun değerlendirmesi olarak kullanılmamalıdır. Yeni inceleme eski sağlayıcı aralıklarının yanlış yerde olduğunu güçlendirir. 5:111'deki `5:110:1` etiket gerilemesi de bu doğru pencere tekrarında görülmedi; eski dar penceredeki model davranışı olarak kalır.

**Sınır:** Modeller aynı WAV üzerinde çalışır ve aynı zamanları vermeleri bağımsız işitsel doğrulama değildir. Pencere başındaki 28:43 ve 5:110 ile pencere sonundaki 28:45 ve 5:112 etiketleri kırpılmıştır; bu satırlarda `has_missing_words=true` beklenir ve tam komşu âyet doğrulaması sayılmaz. QUD güven sayıları fonem bütünlüğü veya sessiz aralık ölçümü değildir. Hedef son harf, yankı, sonraki âyet girişi ve iç parça sınırları iki taraflı dinlenmeden mevcut koruma kaldırılmamalı; üretim zamanları değiştirilmemelidir.

Kısa iki taraflı dinleme dosyaları gerektiğinde `node review/export-sudais-boundary-audio.mjs 28 652900 654900 test-results/review-sudais-boundaries/28-43-44.wav` komutu özgün MP3'ü baştan çözüp kaynak SHA'sı ile 16 kHz WAV SHA'sını yazdırır. Bu dosya üretim varlığı değildir; WAV üretmek de işitsel onay anlamına gelmez.
