# Südeys 5/28/29: hızlı tam akış kaynak taraması (yalnız araştırma)

`node review/screen-sudais-qdc-qul-5-28-29.mjs` QDC uygulama kaydı ile [QUL Südeys sûre kaydı](https://qul.tarteel.ai/resources/recitation/407) MP3'ünü her sûre için baştan sona bir kez çözer. Her âyette üç kelime merkezli 300 ms dalga penceresini kaynak zaman ekseninde karşılaştırır. Önce bilinen kaymaları milisaniye hassasiyetinde dener, sonra ±180 saniyelik ses zarfı aramasına geçer. Üç pencerenin her biri ≥0,95 korelasyon ve aralarında ≤20 ms kayma farkı verirse *aynı kayıt adayı* sayar. Ham ayrıntılar `sudais-qdc-qul-5-28-29-identity-screen.json` dosyasındadır; yerel MP3 ve QUL JSON girdileri yoksa yalnız araştırma amacıyla `test-results/` altına indirilir.

| Sûre | Taranan âyet | Üç pencerede kaynak eşleşmesi | Tutulan | Gözlenen kayma |
| --- | ---: | ---: | ---: | --- |
| Mâide 5 | 120 | **10** (5:111–120) | 110 | QDC, QUL'e göre +126.057 ms |
| Kasas 28 | 88 | **88** (28:1–88) | 0 | 0 ms |
| Ankebût 29 | 69 | **45** (29:1–45) | 24 | QDC, QUL'e göre +100 ms |
| **Toplam** | **277** | **143** | **134** | |

Eşleşen pencerelerde en düşük PCM korelasyonu sırasıyla 0,984534, 0,999681 ve 0,989636. Eşleşen bütün âyetlerde üç pencerenin kayma farkı 0 ms idi. QDC/QUL tam çözüm süreleri: 5 için 2.701.208 / 2.575.164 ms; 28 için her ikisi 1.368.766 ms; 29 için 908.655 / 931.122 ms. Farklı dosya SHA-256 değerleri ve âyet başına ölçümler JSON'a yazıldı. Tam tarama bu bilgisayarda yaklaşık 9,3 saniye sürdü; tek tek 277 uzak hizalama isteği gerektirmedi.

Bu tarama özellikle 28. sûrede aynı ses zaman ekseninin tamamının güçlü adayı olduğunu gösterir. 29:45'e kadar aynı dalga sürer; 29:46'dan itibaren üç pencerenin ortak eşleşmesi kaybolur. 5:111'den itibaren ise süre farkına çok yakın +126.057 ms sabit kaymayla aynı dalga görülür. Kalan 134 âyette *bu arama ve eşik altında* tam âyet adayı bulunmadı. Bu, sesin tamamının başka bir icra olduğunu kanıtlamaz; daha uzun kayma, montaj, kısmi tekrar ve sağlayıcı âyet etiket kaymaları ayrı olasılıklardır. Önceki kısmi `prepareWindow` aramasında 5:5/5:46 için yüksek korelasyon çıkmıştı; o yerel pencere sonucu tam akışın **mutlak** QDC zaman koordinatına güvenle taşınamıyor. Üretimde bu değerleri aktarmamak gerekir.

Üç kısa pencerenin uyuşması âyetin bütün fonemlerinin, son harfinin veya tüm kelime kesimlerinin doğru olduğunu kanıtlamaz. QUL kelime/âyet zamanlarını üretime almak için kanonik kapsam, tekrar ve iki taraflı kesim doğrulaması ayrıca gerekir. Kaydın kullanım hakkı da [QUL kaynağı](https://qul.tarteel.ai/resources/recitation/407) üzerinde açık biçimde doğrulanmadı. Bu araştırma hiçbir üretim zamanını, oynatmayı veya canlı dağıtımı değiştirmez.
