# Elifa Mushaf — kalite değerlendirmesi

Güncelleme: Bu rapor v225 bulgularının tarihsel kaydıdır. Sonraki düzeltmeler ve açık konular için [v226 raporuna](INCELEME-v226.md) bakın.

Tarih: 27 Eylül 2026. İncelenen yerel sürüm: v225 / 52ee8ac.

Genel değerlendirme: Okuma ve ezber odağı belirgin, özellik kapsamı geniş bir uygulama. Görsel kimlik ve temel kullanım akışı mevcut. Buna karşılık içerik onayı, eşzamanlı işlemler, başarısız kayıtların yönetimi ve cihaz testleri tamamlanmadan yüksek güvenilirlikte olgun ürün olarak sınıflandırılmamalı. Sayısal puan verilmedi; ölçülmüş kullanım veya saha hata oranı yok.

## Bu incelemede doğrulanan yeni hatalar

Testler gerçek kodun izole kopyalarında, sahte ağ/depolama nesneleriyle çalıştırıldı. Canlı sunucuya yazılmadı; kullanıcı kayıtları değiştirilmedi. Yeniden üretme betiği yerelde `test-results/quality-probes.mjs`, çıktı `test-results/quality-probes.json`.

| Öncelik | Bulgu | Kanıt ve kullanıcı etkisi | Gereken davranış |
|---|---|---|---|
| Çok yüksek | Sure açılışında eski istek yeni isteğin üzerine yazabiliyor | `openSurah(1)` ve `openSurah(2)` çağrılarında ilk ses isteği geç bitirildi. Son durumda seçilen sure 2 ve metin 2 iken, ekran başlığı ve ses 1 oldu. | Sure ve hoca kimliğine bağlı istek kontrolü; yalnızca son geçerli istek ekranı/sesi güncellemeli. |
| Yüksek | Kalıcı kayıt başarısızlığı sessiz | `localStorage.setItem` kota hatası verdiğinde veri yalnız belleğe kondu. `getItem` hata vermeyip boş döndüğünde uygulamanın kendi `store.get` çağrısı bile kaydı bulamadı. Sayfa yenilemesi belleği de kaybettirir. | Kaydın kalıcılığı doğrulanmalı; hata kullanıcıya açıkça gösterilmeli, mevcut veri korunmalı ve yedekleme yolu sunulmalı. |
| Yüksek | Eşzamanlı anket oyları kaybolabiliyor | İki farklı oy isteği de HTTP 200 aldı; sonuçta toplam 2 yerine 1, seçmen sayısı 2 yerine 1 kaldı. | Atomik güncelleme veya çakışma algılama ve yeniden deneme. Aynı okuma–değiştirme–yazma yapısını kullanan cüz/zikir işlemleri de incelenmeli. |

Bu hatalar bu değerlendirme sırasında düzeltilmedi. Önceki ZIP bunları içermez; bu rapor ses düzeltmesinin yeni bir sürümü değildir.

## Kod incelemesinde görülen ek konular

- **Metin ses isteğini bekliyor:** `openSurah`, gömülü metni aldıktan sonra `getAudio` tamamlanmadan `buildDOM` çağırmıyor. Ağ isteği askıda kalırsa çevrimdışı hazır metin de yükleme ekranında bekleyebilir. Metin hemen gösterilmeli; ses ayrı yüklenmeli.
- **Yedek geri yükleme başarısızlığı gizleniyor:** Yazma hataları yakalanıp yok sayılıyor; sonunda yine “Yedek geri yüklendi” deniyor. Dosyada yalnızca izin verilen anahtarlar ve beklenen veri tipleri kabul edilmeli; kısmi başarısızlık başarı sayılmamalı.
- **Veri sıfırlama:** Açılış kurtarma düğmesi doğrudan `localStorage.clear()` yapıyor. Not ve ilerleme kaybı açıkça anlatılmalı; mümkün olduğunda önce dışa aktarma sunulmalı.
- **Katılım yetkileri:** Birlikte'de katılım kodunu bilen kişi cüz bırakma/tamamlama işlemi yapabiliyor. Bireysel sahiplik doğrulaması yok. Ortak düzenleme isteniyorsa bu açıkça belirtilmeli; kişiye ait işlemler isteniyorsa sahiplik modeli eklenmeli.
- **Bakım:** Yaklaşık 6,7 MB'lık tek HTML içinde metin verisi, tasarım, ses ve çok sayıda ek özellik bulunuyor. Bu tek başına hız hatası kanıtı değil; değişikliklerin birbirini etkileme ve incelemede hata kaçırma riskini artırıyor. Ses, kayıt, sayfa dolaşımı ve sunucu işlemleri ayrı bileşenlere aşamalı olarak ayrılmalı.
- **Erişilebilirlik ve cihaz kapsamı:** Önceki tarayıcı çıktısında adsız simge düğmeleri görüldü. Ekran okuyucu, klavye, büyük yazı ve fiziksel iOS/Android testleri tamamlanmadı. 390 px görünümde taşma görülmemesi bu testlerin yerine geçmez.

## Güçlü yönler

Okuma, ezber, parça tekrarı, hoca seçimi, not/işaret, dışa aktarma ile yedekleme ve çevrimdışı ses aynı uygulamada mevcut. Yerel önizlemede mushaf teması okunaklı bir görsel kimlik sunuyor. v225 ile 32 otomatik test, metin bütünlüğü kontrolleri ve testten sonra build üretimi eklendi. Bu temel, daha güvenilir bir sürüm geliştirmek için kullanılabilir.

## Kaliteli sürümün kabul ölçütleri

1. Ekrandaki sure, âyet ve ses her hızlı seçim ve ağ gecikmesi senaryosunda aynı kalmalı.
2. Kayıt, geri yükleme ve toplu işlemler başarısızken başarı mesajı gösterilmemeli; veri kaybı önlenmeli.
3. Arapça yazım farkları kaynak ve uzman tashihiyle sonuçlandırılmalı. Mealler ve Latin gösterim için kapsamı belli içerik kontrolü yapılmalı.
4. İnternet kesilmesi, ekran kilidi, telefon araması ve uygulamaya geri dönüşte ses davranışı fiziksel cihazlarda doğrulanmalı.
5. Ana akışlar sade olmalı: oku, dinle, ezberle. Gelişmiş kesim/tekrar seçenekleri ihtiyacı olana açılmalı; yükleniyor, duraklatıldı ve indirildi durumları açıkça ayrılmalı.
6. Her yayında kritik testler çalışmalı; önce önizleme, sonra kontrollü canlı sürüm ve geri dönüş imkânı olmalı.

Önerilen sıra: sure/ses tutarlılığı → kayıt ve yedek güvenilirliği → ortak işlemlerin eşzamanlılığı → içerik tashihi ve fiziksel cihaz kabulü → bakım ve arayüz sadeleştirme. İçerik incelemesi teknik düzeltmelerle birlikte yürütülebilir.
