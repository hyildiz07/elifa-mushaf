# Südeys 519 âyet: tam âyet için düzeltme yolu

Bu çalışma üretim varlığına dokunmaz. `node review/audit-sudais-519-whole-verse-gates.mjs` özeti yeniden üretir. Girdiler, QDC üretim MP3'lerine karşı üç PCM çapasıyla eşleştirilmiş 519 QUL âyet adayı, kaynak SHA denetimi, QUL kelime sırası denetimi ve QDC sağlayıcı meta pencereleridir. **Bunların hiçbiri tek başına güvenli fonem kesimi değildir.**

| Kapı / sınıf | 519 içindeki sayı | Anlamı |
| --- | ---: | --- |
| QDC meta penceresi aday âyetle hiç örtüşmüyor | 276 | Mevcut meta ile hedefi çalmak mümkün değil. |
| QUL kelime konumu yapısı temiz | 429 | Kelime sayısı/sırası makul; telaffuz ve kesim doğrulanmadı. |
| Tekrar veya etiket incelemesi gerekiyor | 90 | Otomatik kelime/parça aktarımı reddedilmeli. |
| Hemen sonraki âyet de aynı kaynak kapısından geçti | 514 | Komşu girişini kontrol etmek için kaynak eşleşen aday var. |
| Sonraki âyet kaynak kapısından geçmedi veya sûre sonu | 5 | Dördü sûre sonu; biri **29:45 → 29:46** geçişi. |
| Temiz yapı + kaynak eşleşen sonraki âyet | 424 | Tam âyet sınırı denetimi için öncelikli aday; onaylı kesim sayısı sıfır. |
| Yukarıdakilerden meta hedefle örtüşmeyen | 238 | Yanlış meta oynatımını düzeltme potansiyeli yüksek; yine fonem kapısı gerekli. |

519 adayın tamamında ilk ve son kelime etiketi aday âyet aralığının içindedir. Bu yalnız aynı QUL kaydının iç tutarlılığıdır: son kelime etiketi çoğu durumda âyet `time_to` değerine dayanır ve bağımsız bitiş kanıtı sayılmaz. Komşu adayların zaman aralıkları örtüşmez; aradaki boşluğun sessizlik veya tam fonem sınırı olduğu anlaşılmaz.

## Tam âyet için uygulanabilir kapı

1. Özgün QDC MP3'ünün SHA-256 değerini sabitle; QUL ile üç kısa merkez dışında, hedefin **ilk ve son sesli bölümünü** de PCM olarak eşleştir. Ofset tek ve tutarlı olmalı. Eşleşme bozulursa ilgili âyeti karantinada tut.
2. Kanonik metni hedef, önceki ve sonraki âyetle sıra içinde bağımsız ASR/hizalayıcı üzerinde denetle. Etiket tekrarını, eksik/ek kelimeyi ve âyet sınırı taşmasını açıkça işaretle. Modelin boş veya düşük güvenli etiketi onay değildir.
3. Her iki âyet geçişinin ±0,5–1 sn QDC sesini dinleyerek son fonemin eksiksiz, sonraki ilk fonemin ayrı kaldığını kaydet. Uzun âyetlerde içeride atlama/tekrar olmadığını ayrıca kontrol et. Sessizlik/RMS eşiği tek başına yeterli değildir.
4. Sadece bu kapılardan geçen **tam âyet** için `[baş, son)` QDC zamanını aday olarak yaz. Kelime seçimi ve parça bölme, ayrıca her iç kelime sınırı doğrulanana kadar kapalı kalmalı. Başarısız/eksik kanıtta mevcut koruma veya kaynağı doğrulanmış başka okuyucu devam eder; `29:45` sınırı komşu `29:46` QUL ofsetinden türetilmez.

Bu bir otomatik üretim dönüşümü değildir: 424 satır, denetlenecek iş kuyruğudur. Kesimin güvenli olduğunu belirleyen son kapı dinleme kaydı ve açık komşu âyet sahipliğidir. İncelemeyi ölçeklemek için bir betik tüm 519 sınır için aynı QDC dosyasından sınır dinleme parçalarını, spektrum/PCM özetini, iki bağımsız hizalayıcı etiketini ve onay durumunu çıkarabilir; yalnız iki taraflı kayıtları tamamlanan satır üretime aday olur.

## İki sınır örneği

**28:44:** QDC meta `643040–652390` ms, kaynakla eşleşen QUL adayı `653640–663092` ms. Meta bütünüyle 28:43 içinde; hedefin ilk kelimesi `653960` ms'de. 28:45 adayı `663292` ms'de başlar; arada 200 ms var. Bu iki kaynak eşleşmesi, 28:44 için doğru bölgeyi gösterir. 200 ms'nin fonem bakımından güvenli kesim olduğunu ispatlamaz. İlk/son ses ve 28:43→44 ile 28:44→45 geçişleri dinlenmeden açılmamalı.

**29:45:** QDC meta `576920–599200` ms, kaynakla eşleşen aday `598558–622530` ms; meta hedefle yalnız 642 ms örtüşür. İlk kelime `598860` ms'de, 29:44 adayı `598358` ms'de biter. 29:46 kendi üçlü PCM kaynak eşleştirme kapısını geçmedi. Bu nedenle 29:45'in sonunu 29:46 QUL saatinden üretmek özellikle güvensizdir; doğrudan QDC 29:45→46 fonem geçişi saptanmalı. Mevcut bağımsız model 29:45'i QUL aday bitişinden 640 ms sonra da etiketlediği için son kesim ayrıca ihtilaflıdır.

## Ayrı âyet klipleri

QUL kaynak 116, beş sûrenin 653/653 âyeti için ayrı URL verir. Bu, **aynı QDC icrası** için eksiksiz ve bağımsız klip havuzu olduğu anlamına gelmez. 87 âyetin kelime dizisi/kapsamında yapısal anomali var; örnek 3:160 klibinin ilk kelime etiketi yalnız 70 ms. Dört örnek klibin QDC PCM karşılaştırmasında güçlü kesin kaynak eşitliği kurulmadı (yakın zaman pencerelerinde en iyi korelasyonlar yaklaşık 0,28–0,64). Ayrıca özgül yeniden kullanım koşulları belgelenmedi. Bu klipler QDC zamanının yerine otomatik geçemez; ayrı ürün kaynağı olarak değerlendirilecekse aynı fonem ve hak denetimlerinden geçer.

Dayanaklar: `sudais-519-meta-overlap-2026-09-30.md`, `sudais-batch-structural-triage-2026-09-30.json`, `sudais-qdc-qul-5-28-29-identity-screen-2026-09-30.md`, `sudais-independent-qdc-pilot-2026-09-30.md`, `sudais-pilot-metadata-drift-review-2026-09-30.md`, `sudais-qul-ayah-clips-decision-2026-09-30.md`.
