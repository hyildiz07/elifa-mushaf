# Dua sesleri: gerçek cihaz doğrulaması

Bu protokol masaüstü otomasyonunu fiziksel telefon kanıtı saymaz. Android Chrome/PWA ve iPhone Safari/ana ekrana eklenmiş uygulama ayrı ayrı denenmelidir. Testte cihaz modeli, işletim sistemi, tarayıcı sürümü ve uygulama sürümü kaydedilir.

## Beklenen davranış

- Dua sesi HTMLAudio ile çalar. WebAudio yalnızca seçilmiş parçaların PCM sesini hazırlamak için kullanılır; çözümleme tamamlanınca bağlam kapatılır.
- Ekranın kararması veya sekmenin gizlenmesi kendiliğinden durdurma ya da yeniden başlatma nedeni değildir. Sistem arka plan sesini sınırlayabilir; kesintisiz kilit ekranı oynatımı henüz cihazda doğrulanmış sayılmaz.
- Sistem duraklatması ve kilit ekranındaki Duraklat/Durdur, bekleyen tekrarları da iptal eder. Telefon görüşmesi bittikten veya sayfaya dönüldükten sonra otomatik ses başlamaz.
- Yeniden Başlat/medya Play, kullanıcının son seçtiği duayı veya parça programını **baştan** başlatır. Kesildiği saniyeden devam ettiği iddia edilmez.
- Dua ekranı kapanınca dua sesi ve hazırlık işleri iptal olur; kilit ekranı kontrolleri mevcut Kur’an oynatıcısına geri verilir. Dua için ekranı zorla açık tutan bir wake lock istenmez.

## Her cihazda uygulanacak testler

1. Sübhâneke tam kaydı: tekrar 3, hız 1, bekleme 2 saniye. Kilitle; üç tam okuma ve bekleme aralıklarını dinle. Sonunda kendiliğinden başka dua başlamamalı.
2. Aynı testte ilk okumanın ortasında kilit ekranından Duraklat; 15 saniye bekle. Ses dönmemeli. Play’e açıkça basınca program baştan başlamalı.
3. İlk okuma sonundaki 5 saniyelik bekleme içinde kilit ekranından Duraklat/Durdur. Bekleme bitince ses başlamamalı.
4. Üç elle ayarlanmış parçayla hıfz: parça 1, birleştirme 1, tüm çalışma 2. Sıra `1, 2, 1+2, 3, 1+2+3` olmalı; ikinci tur da aynı sırayı izlemeli. Seçilmeyen boşluk veya sonraki kelime duyulmamalı.
5. Hıfz çalışırken çağrı/alarm/kulaklık çıkarma gibi ses oturumu kesintisi oluştur. Görüşme/uyarı sonrası otomatik başlama veya iki ses olmamalı. Başlat ile yeniden dene.
6. Parça hazırlanırken Kapat; hemen başka dua açıp çalıştır. Eski dua geç gelip çalmamalı. Hızla tam kayıt/parça arasında üç kez geçiş yap; tek ses kalmalı.
7. Tam ve parçalı sesi indirdikten sonra çevrimdışı aç. Kaydedilmiş parçayı tam kaydı önce çalmadan başlat; sınırlar ve hız doğru kalmalı. Uygulamayı yeniden açınca kayıtlar korunmalı.
8. Dua kapanınca Kur’an oynat; kilit ekranı başlığı ve Önceki/Sonraki yeniden Kur’an’a ait olmalı. Dua açıkken bu tuşlar arkadaki Kur’an’ı başlatmamalı.
9. Bozuk/ulaşılamayan kayıt veya başarısız çözümlemede hata görünmeli, döngüye girmemeli. Başka sağlam kayıt çalışabilmeli.

## Sonuç kaydı

| Cihaz / işletim sistemi / tarayıcı | Tam tekrar | Kilit ekranı | Beklemede durdurma | Hıfz | Kesinti | Çevrimdışı | Oturum geri verme |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Android fiziksel cihaz | Bekliyor | Bekliyor | Bekliyor | Bekliyor | Bekliyor | Bekliyor | Bekliyor |
| iPhone fiziksel cihaz | Bekliyor | Bekliyor | Bekliyor | Bekliyor | Bekliyor | Bekliyor | Bekliyor |

Masaüstü birim testleri: iptal, eski olay/iş koruması, media-session sahipliği ve decoder temizliği. Bu sonuçlar yukarıdaki fiziksel cihaz satırlarını doldurmaz.
