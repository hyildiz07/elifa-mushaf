# Südeys özgün QDC sesinde bağımsız hizalama pilotu

`node review/pilot-sudais-independent-qdc-align.mjs` dört örnek penceresini uygulamanın kullandığı özgün QDC sûre MP3'ünden **bayt sıfırdan çözerek** çıkarır. Pencere, mevcut `test-results/timings/3-*.json` âyet zamanının iki yanında 1,5 saniye içerir. PCM parçaları QUD hizalayıcısının `Large` modeline gönderilir. SHA-256, pencere zamanı, model çıktısı ve süreler `review/sudais-independent-pilot/*.json` içinde tutulur. Bunlar araştırma çıktılarıdır; üretim zamanlamasına yazılmaz.

| Hedef ve meta zaman (ms) | Modelin duyduğu başvuru | Durum |
| --- | --- | --- |
| 28:44, 643040–652390 | Yalnız 28:43:9–16 | Hedef âyet hiç çıkmadı; önceki `28-44-full-align.json` denemesi de 28:43 kuyruğunu göstermişti. |
| 29:45, 576920–599200 | 29:42:9–12; 29:43; 29:44; 29:45'in ilk 3 kelimesi | Hedef âyetin büyük bölümü zaman penceresinin dışında. |
| 29:46, 599200–621670 | 29:45:1–21; 29:46 yok | 29:45, bir sonraki âyetin meta penceresine taşmış görünüyor. |
| 5:111, 2475690–2489460 | 5:110:39–56; 5:111 yok | Model, önceki uzun âyetin devamını buluyor. Aradaki `5:110:1` etiketi gerilemesi ayrıca incelenmeli. |

Kaynak SHA-256: 28 `f8e5291cf10a3a29230fd443b5ddabc4297cf5b16c70250dda3bfe6314917576`, 29 `525bcfbaaa6fbeece6c93e0e25d7d36393aaddd406366284ded5bd141107af67`, 5 `16fad03b000d69492da95e9f970f220ae097a6693815917924b43f1730ae8cdb`. Dört çözüm toplam **4,674 saniye**, dört hizalayıcı HTTP isteği toplam **39,805 saniye** sürdü; 29:45 isteğinin tek başına süresi 20,636 saniye idi. Sunucu model işlem süresi raporu, her istek için yaklaşık 1,79–2,36 saniyedir; duvar saati ile bu sayı aynı ölçü değildir.

Bu, modelin tek başına kesin âyet sınırı verdiği anlamına gelmez. Fakat 28:44 ve 29:46'da hedef âyetin hiç görünmemesi, 29:45'te ardışık birden çok önceki âyetin tanınması ve 5:111'de önceki âyetin sürmesi, mevcut meta pencerelerini güvenli parça kesimi olarak kullanmayı reddetmek için güçlü sebeplerdir. QUL/QDC dalga eşleşmesi ile kanonik kelime sırası kapısını geçen **429 aday otomatik olarak açılmamalı**; bu örnekler, sesin aynı kayıt olması ile âyet etiketinin doğru zaman yerinde olmasının farklı koşullar olduğunu gösteriyor. Açma kararı için bağımsız ikinci hizalama, komşu âyet sınırı, tekrar/etiket uzlaştırması ve iki taraflı fonem dinlemesi gerekir.

Kısıt: Pilot dört pencereyle sınırlı; 653 âyetin kaçının kaydığı çıkarılamaz. Harici hizalayıcı özellikle tekrar ve kısa alıntılarda hata yapabilir. Bu rapor sesin fiilî son harf sınırını doğrulamaz ve canlı uygulamada değişiklik yapmaz.
