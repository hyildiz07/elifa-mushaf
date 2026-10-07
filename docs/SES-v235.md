# v235 — parçalı ses hazırlığı ve yeniden oynatma

## Sorun ve düzeltme

Uzun sûrelerde seçilen âyetin PCM sesi, sûre MP3'ü ilk bayttan âyete kadar indirilip çözülerek hazırlanıyordu. Geç âyetlerde 30 saniyelik süre sınırı dolabiliyor, sonraki her dokunuş aynı işi yeniden başlatıyordu. Hata halinde parça kartları ekranda kalırken bütün âyet çalınıyordu. Durgun durumdaki parça kartı ise oynatmak yerine yalnızca seçim yapıyordu.

CBR MP3 dosyalarında tam dosyanın Xing/Info çerçevesi, dosya uzunluğu ve değişmeyen bitrate denetleniyor. Sadece seçili âyetin çevresindeki özgün sûre MP3 baytları HTTP Range ile alınıyor. Dosyanın ilk 64 KiB'inde tam çözümleme ile başlık atlanmış çözümleme karşılaştırılıp hocaya özgü başlangıç örnek farkı ölçülüyor; fark kesin bulunamazsa hızlı yol kullanılmıyor. Hedef aralıktaki MPEG çerçeve zinciri, kısmi yanıt durumu ve içerik uzunluğu yeniden doğrulanıyor. Ses sunucusu `Content-Range` başlığını tarayıcıya göstermiyorsa toplam dosya boyu `HEAD` isteğiyle doğrulanıyor. Dosyanın ilk/son 10 saniyesinde yuvarlama belirsizliği nedeniyle tam akış yolu kullanılıyor. Hızlı yol yalnızca aynı özgün sûre kaydına uygulanıyor; başka bir âyet kaydı kullanılmıyor.

Bir parça kartına dokunmak artık durma ve oynama durumlarının ikisinde de o parçadan oynatmayı başlatıyor. Hazırlık hatası bütün âyet oynatmasına sessizce dönüşmüyor; açık bir yeniden deneme mesajı gösteriliyor. Hazırlanmış PCM bellekte ve uygun boyuttaysa IndexedDB'de tutuluyor; aynı âyetin tekrarında yeniden indirme/çözme gerekmiyor.

## Doğrulama ve sınırlar

- Şâtırî/Nisâ 12 ve 176 ile Sıddîk el-Minşâvî/Nisâ 12 kayıtlarının HTTP Range pencereleri özgün tam akış çözümlemesiyle karşılaştırıldı. Başlangıç örnek farkları sırasıyla 1105 ve 529 örnek ölçülüp giderildi; karşılaştırılan pencereler sıfır örnek kaymasıyla eşleşti.
- Şâtırî/Nisâ dosyasındaki tüm MPEG çerçeve konumları, kısa sûrelerde dokuz CBR kaydı ve Minşâvî/Nisâ dosyasının iç bölümü kontrol edildi. Minşâvî dosyasının uçlarındaki belirsiz konumlar tam akışa bırakıldı.
- Otomatik testler, başarısız hazırlığın bütün âyeti parça diye oynatmamasını, tekrar sayısını ve parça sınırlarını denetliyor.
- Yerel tarayıcıda Sıddîk el-Minşâvî/Nisâ 176 ilk hazırlıktan sonra altı doğrulanmış parça gösterdi. İkinci karta dokunma ve aynı karta yeniden dokunma yaklaşık 0,3 saniyede PCM oynatmayı başlattı; 2× tekrar ayarında `Parça 2 · 2/2` durumu gözlendi.
- CBR başlığı/range desteği olmayan kayıtlar hâlâ tam akış çözümlemesine döner; büyük bir geç âyette ilk hazırlık sürebilir veya zaman aşımına uğrayabilir. Bu durum açık hata olarak görünür. Tüm 1.254 hoca/sûre MP3'ü dinlenerek onaylanmış değildir; sıfır ses hatası iddiası yoktur.
