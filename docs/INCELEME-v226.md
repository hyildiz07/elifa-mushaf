# v226 çalışma sürümü — ses, bölme ve isteğe bağlı hesap

27 Eylül 2026. Bu bir önizleme kaynak paketidir; canlı sitede yayımlanmadı. Canlı sitede son doğrulanan sürüm v225'tir. “Sıfır hata” veya bütün kayıtların dinlenerek onaylandığı iddia edilmez.

## Son bildirimin sonucu

Kullanıcının tarif ettiği hata: parça bittikten sonra sonraki parçadan yarım kelime duyulması ve tekrar başa dönülmesi. v225'teki son sesi koruma düzeltmesi bu sorunun tamamını çözmemiştir.

- Bölme algoritması, duraklardan sonra 7 kelime sınırına göre tekrar bölüyordu. Bu kuralın Arapça anlam veya vakıf–ibtidâ uygunluğu dayanağı yoktu; kaldırıldı.
- U+06D6–U+06DC aralığındaki bütün işaretler aynı sayılıyordu. Lâ ve eşli üç nokta bağımsız otomatik kesimden çıkarıldı. Türk metnindeki U+06DC, kullanılan fontun farklı gösterimi nedeniyle tek başına yorumlanmıyor; aynı konumdaki Uthmanî referans kelimesinde uygun işaret aranıyor. Metinlerin kelime sayısı eşleşmezse iç durak üretilmiyor.
- Kelime numaralarının tekrarı, yanlış etiket, eksik zamanlama ve çakışma kontrolleri korunuyor. Bağlı okunan sözcükler sıfır boşlukta kesilmiyor.
- Otomatik parçalarda kullanıcı başlangıç/bitiş payı uygulanmıyor. Böylece ek pay sonraki kelimeye uzanamıyor.
- Uzun sûrelerde otomatik parça oynatma artık `setTimeout + HTMLAudio.pause()` kullanmıyor. Orijinal sûre MP3'ü Web Worker içinde akış halinde çözülüyor; yalnız ilgili âyetin PCM sesi tutuluyor. Parça Web Audio'nun süreli ses kaynağıyla çalınıyor. Başka bir âyet kaydına varsayımsal zaman farkı uygulanmıyor.
- Her iç durak için metindeki işarete ek olarak zamanlama boşluğu ve her ses kanalında en az 120 ms düşük enerji aralığı aranıyor. Bu bir tutucu teknik kontrol; telaffuz/anlam doğrulaması değildir. Aday doğrulanmazsa komşu parçalar birleşiyor. Hiçbiri doğrulanmazsa âyet bütün kalıyor. İndirme/çözümleme başarısızsa hassas olmayan parçalı oynatmaya sessizce geçilmiyor.

Bu politika daha az ve daha uzun parçalar üretir. Özellikle Nisâ 12 / Şâtırî örneğinde 4 metin/zamanlama adayı ses kontrolünden geçmedi; bütün âyet kullanıldı. Bu, bu kayıtta hiç durak olmadığı iddiası değildir. Mevcut zaman etiketleriyle güvenilir otomatik kesim doğrulanamadığı anlamına gelir. Kısa, öğretici parçalar için dinlenerek onaylanmış hoca/kayıt bazlı sınır verisi hâlâ gereklidir.

## Doğrulama

- `npm run build`: 54 test geçti; statik çıktı üretildi.
- 11 hoca × 114 sûre: 1.254 zamanlama dosyası, iki metin modunda 137.192 âyet incelemesi; 151.270 program adımında sıra, kapsam ve metadata sınırı kontrolleri geçti. Bu test gerçek sesin dilsel doğruluğunu kanıtlamaz. Sonuç: `full-validation-v226.json`.
- Gerçek MP3 örneklemesi: 11 hocada Nisâ 12–14. 106 zamanlama boşluğu adayından 9'u tutucu ses kontrolünü geçti. Sonuç: `split-acoustic-samples-v226.json`. Bunlar metin işareti süzgecinden önceki akustik adaylardır, son parça sayısı değildir.
- Yerel Chromium: Şâtırî Nisâ 12 bütüne dönüş; Abdülbâsıt (id 1) Nisâ 12 dört parça, Web Audio etkin, HTMLAudio duraklatılmış. Sadece ilgili âyetin yaklaşık 218 saniyelik PCM aralığı tutuldu.
- `mpg123-decoder` 1.0.3 ile tarayıcının yerel MP3 çözümlemesi, Şâtırî İhlâs ve Nisâ'nın 10. ve 369. saniye çevresinde karşılaştırıldı: en iyi korelasyonda örnek kayması 0. Ön denemede eski 0.4.8 sürümündeki 1.105 örnek farkı nedeniyle o sürüm kullanılmadı.
- 0,75×, 1×, 1,5× hızlarında kaynak başlangıç çağrıları kontrol edildi: sınama parçası tam 240 ms kaynak verisi ile sınırlandırıldı; HTMLAudio devreye girmedi. Ana iş parçacığı gecikmesi, ses kaynağının içine sonraki PCM verisini ekleyemez. Fiziksel telefon/ekran kilidi testinin yerine geçmez.
- Arapça gömülü metinlerin önceki SHA-256 bütünlük testleri ve 6.236 âyetin sayfa referans karşılaştırması geçiyor. Arapça metin değiştirilmedi.

## Hesap ve diğer düzeltmeler

Okuma/dinleme hesapsız açık. E-posta ile kayıt/giriş, doğrulama, şifre yenileme, çıkış, hesap silme; kullanıcının açık eylemiyle en fazla 20 bulut yedeği; cihazlara aktarım ve aktarımı geri alma arayüzü eklendi. Giriş yapmak cihazdaki veriyi otomatik olarak buluta yüklemiyor veya başka hesabın verisiyle birleştirmiyor. Hesap silmek cihaz verisini silmiyor. Yeni hesap ekranı şimdilik Türkçe.

Yedekler kullanıcı kimliğine göre ayrılıyor; sunucu oturumu ve güncel Identity kullanıcısını doğruluyor. Silme için yakın zamanda yeniden giriş gerekiyor. Geri yüklemede izinli anahtarlar, veri tipleri ve işaret alanları doğrulanıyor; yarım kalırsa günlükten geri alma uygulanıyor. Oturum/katılım yönetici anahtarları yedeğe konmuyor. Hesap silme Identity adımında başarısız olursa bulut yedekleri daha önce silinmiş olabilir; işlem tekrar tamamlanmalı.

Eski sûre isteğinin yeni ekranı/sesi ezmesi, metnin ses ağ isteğini beklemesi, depolama hatasının gizlenmesi, üretimde ağ hatasının başarılı yerel demo sonucuna dönüşmesi düzeltildi. Birlikte oy/cüz/zikir değişiklikleri PostgreSQL işlemi ve ortak kilit altında çalışıyor. Eski Blobs kayıtları ilk erişimde aktarılıyor, silinmiyor. Gerçek eşzamanlı Netlify yük testi yapılmadı; yerel SQL testleri geçti.

## Canlıya çıkmadan gerekenler

Bu paketi Netlify Drop'a sürüklemek hesap/veritabanı kurulumunun yerine geçmez. Mevcut sitede Identity ve Netlify Database kurulumu, SQL migration ve önizleme testi gerekir. Bağlayıcı yeniden kimlik doğrulama istediği için bu hesap işlemleri bu çalışmada yapılamadı. `ELIFA_ADMIN_SECRET`, alan adı ve eski Blobs korunmalı.

Veritabanı geçişinde eski Blobs yazan dağıtımlar durdurulmalı; eski açık sayfaların API çağrıları yeni fonksiyonlara gitmeli. Eski dağıtım URL'leri veya geri alınmış v225 fonksiyonları Blobs'a yazmaya devam ederse iki farklı veri kaynağı oluşur. Geçiş öncesi Blobs dışa aktarımı, geçiş sonrası SQL yedeği ve kontrollü geri dönüş planı gerekir. SQL yazıları başladıktan sonra yalnız eski deploy'a dönmek veri geri dönüşü değildir.

Önizlemede gerçek e-posta doğrulama/şifre kurtarma, iki ayrı kullanıcı ve cihazda yedek ayrımı, iptal/bağlantı kesintisi, silme tekrarı ve mevcut Birlikte kayıtlarının geçişi doğrulanmalıdır. Bu testler için gerçek e-posta gönderimi yapılmadı.

İçerik açısından v225 Diyanet karşılaştırmasında kalan 1.341 normalleştirilmiş farkın uzman incelemesi sürüyor; bu farkların tümünün hata olduğu söylenemez. Vakıf–ibtidâ, meal/Latin gösterim, tüm kayıtların kulakla kontrolü ve fiziksel iOS/Android kabul testleri tamamlanmadı. Genel okuyucu ve elle kelime seçimi eski oynatma yolunu koruyor; bu sürümdeki hassas ses değişikliği otomatik bölünmüş âyet akışına aittir.

## Dayanaklar

- [Diyanet: Secâvend](https://kuran.diyanet.gov.tr/kuran-sozlugu/detay/49-secavend)
- [Diyanet: Kur'an kıraatinde ve kitabetinde Türkiye'nin durumu, vakf işaretleri bölümü](https://mushaflariinceleme.diyanet.gov.tr/Documents/KUR%E2%80%99AN%20KIRAAT%C4%B0NDE%20ve%20K%C4%B0T%C3%82BET%C4%B0NDE%20T%C3%9CRK%C4%B0YE%E2%80%99N%C4%B0N%20DURUMU%20%28Do%C3%A7.%20Dr.%20M.%20Emin%20MA%C5%9EALI%29.pdf)
- [Unicode Arapça işaretleri](https://unicode.org/charts/nameslist/n_0600.html)
- [WASM ses çözümleyicisi](https://github.com/eshaz/wasm-audio-decoders)
- [Netlify Identity](https://docs.netlify.com/manage/security/secure-access-to-sites/identity/get-started/)
- [Netlify Database migrations](https://docs.netlify.com/build/data-and-storage/netlify-database/migrations/)
