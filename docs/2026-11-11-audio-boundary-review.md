# Ses sınırı incelemesi — 11 Kasım 2026

## Kullanıcı bildirimleri

- Mişârî el-Afâsî'de âyet/1+2 birleştirme sonunda sonraki âyetin başından ses duyulabiliyor. Kesin sûre ve âyet hatırlanmıyor. Uygulamada iki farklı Mişârî kaydı var: QuranCDN hoca 7 ve MP3Quran hoca 223.
- Kelime markajının sonundan sonraki kelimeye sarkma bildirildi. Kesin örnek bilinmiyor.
- Google Play'deki eski Mehtap Demir yorumu ayrı bir kullanım kolaylığı isteğidir: ezberlenen aralığı topluca işaretleme, kaldığı yere kolay dönüş ve sayfaların çalışma durumunu toplu görme. Bunu bir ses zamanlama hatası saymıyoruz. Aralık kaydı ve kaldığı yerin kaydı mevcut; sayfa özeti ve bu işlemlerin bulunabilirliği geliştirilmeli.

## Bu değişiklik

- Kısa âyet/1+2 adımları (en fazla 60 saniye) uzun sûrelerde de aynı kayıttan sınırlı PCM pencere hazırlayıp örnek sınırında duruyor. Pencere yüklenemezse zamanlayıcıyla durdurulan ses yoluna sessizce dönmüyor.
- İşaretlenen kelimenin bitişi sonraki kelimenin başlangıcından önce sınırlandırılıyor. Kaynak kelime zamanları belirgin biçimde çakışırsa yalnız o dar seçim çalınmıyor; tam âyet veya başka hoca seçilmesi isteniyor.
- Hız değiştirilmiş kısa kesimde WAV üretilemezse yine zamanlayıcılı kesime dönülmüyor. Kesintisiz ve 60 saniyeyi aşan okumalar eski akış yolunda kalıyor.
- Ses parçası hâlâ hazırlanırken hız veya ileri/geri dokunuşu eski zamanlayıcılı akışı başlatmıyor. Son âyette fiziksel dosya sonu doğrulanmışsa duraklatıp devam etme ve ileri/geri de bu sınırın dışına çıkmıyor.

## Denetim kanıtı ve sınırlar

- `node scripts/audit-afasy-split.mjs`: MP3Quran Mişârî için 114 sûre, 6.236 âyet, 12.472 biçim, 0 yapısal güvensiz kesim.
- `node scripts/verify-all-audio.mjs --candidate-dir=assets/verified-audio`: 1.254 hoca–sûre dosyası, 137.192 âyet görünümü, 0 yapısal plan hatası. Eski ham zamanlarda 70 korumasız kuyruk uyarısı görünürken uygulamada kullanılan doğrulanmış varlıklarla 11 kaynak uyarısı, 0 korumasız uyarı çıktı. Bu sayılar kulakla fonem doğrulaması değildir.
- Gerçek kaynakla aynı PCM hazırlığı Bakara 12–13 aralığında QuranCDN Mişârî 7 ve MP3Quran Mişârî 223 için çalıştı; yalnız 29 ve 35 saniyelik aralıklar indirildi/çözüldü. Bu deneme iki kaydın bütün sûrelerini doğrulamaz.
- Sekiz doğrulanmış QuranCDN hoca kataloğu ve MP3Quran Mişârî kaydında art arda gelen etiketler arasında 40 ms'den büyük kelime zamanı çakışması çıkmadı. Bu yine sesin dilsel doğruluğu anlamına gelmez.
- `npm run build`: 715 test, 709 geçti, 6 atlandı, 0 hata; web derlemesi tamamlandı.
- Kesin şikâyet örneği verilmediği için kullanıcıdaki taşmanın aynı kesitte giderildiği henüz kulakla teyit edilmedi. 60 saniyeyi aşan birleşik adımların HTMLAudio sınırı ve kaynağın yanlış zaman vermesi hâlâ ayrı risklerdir. Gerçek Android cihazda, iki Mişârî kaydında kısa/uzun sûre, 1+2, kelime seçimi, hız ve çevrimdışı akış dinlenmeden bütün seslerin hatasız olduğu söylenmemeli.
