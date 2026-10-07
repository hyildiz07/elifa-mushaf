# v247 ses doğrulaması ve sınırlar

Bu sürüm, bölünmüş âyetleri tekrar ederken PCM kesitinin kaymasını ve sessizce kırpılmasını giderir. Ayrı ses pencerelerinin başlangıç kayması bütün tekrar kesitlerine uygulanır. Gerekli son örnekler indirilememişse oynatma eksik kesitle başlamaz; açık hata verir.

Hânî er-Rifâî (hoca 5) için, aynı sûre MP3 URL'sini kullanan [Qur’anic Universal Audio v3.2.0](https://github.com/QUD-Technologies/quranic-universal-audio/releases/tag/v3.2.0) verilerinden 342 kaynak-kuyruk çakışması için kelime zamanı yeniden doğrulandı. Önceki istisnalar ve komşu âyetler dahil 729 satır `assets/audio-timing-overrides-v3.json` içinde yer alır. 6:139 için kaynak satırı yoktur; 34:46 için önerilen sınır sonraki âyetle çakışır. Bu iki kayıtta zaman uydurulmadı.

Südeys (hoca 3) için aynı ses performansı üç PCM penceresiyle eşleşen yedi âyette yalnızca hatalı kelime numarası etiketleri düzeltildi. Sûre kaydı ve özgün zamanlar korundu. Ölçümler ve dışarıda bırakılan kayıtlar [kaynak denetiminde](SES-R3-R5-KAYNAK-DENETIMI.md) belgelenmiştir.

Husary Muallim (hoca 12) sûre MP3'ü sekiz uzun âyetin sonunu fiziksel olarak içermiyor. Bölünmüş oynatma için, [QuranLab âyet zamanları](https://huggingface.co/datasets/quranlab/quran-audio) ile eşleşen [EveryAyah](https://everyayah.com) tam âyet MP3'leri on doğrulanmış âyette ayrı kaynak olarak kullanılır. Kaynak/kayıt eşleşmesi, dosya kimliği, kelime sırası ve süre doğrulanmadan devreye girmez. Çevrimdışı bu özel kayıtlar açılamaz; kullanıcıya açık uyarı gösterilir. 2:145'in alternatif kelime zamanları sesin sonunu kapsamıyor, bu yüzden eklenmedi. Normal kesintisiz sûre dinlemesi hâlâ özgün MP3'ü kullanır; fiziksel eksiklik bu kipte devam eder.

`node scripts/verify-all-audio.mjs --candidate-dir=assets/verified-audio` tam taramada 1.254 hoca–sûre dosyası ve iki yazı biçimi için 137.192 âyet kipini denetledi: **0 yapısal hata**. Alternatif âyet kaynağı her iki yazı biçiminde 20 kipte kullanıldı. Medine yazısında **11 bölme istisnası** kaldı; liste [split-exceptions-v247.json](split-exceptions-v247.json) dosyasındadır. Ayrıca 11 özgün sûre kaydı kelime segmentinin âyet sınırını taşır. Bu sayılar akustik bakımdan bütün Kur’an’ın sıfır hatalı olduğunu göstermez; kalan âyetlerde kayıt eşleme veya elle dinleme doğrulaması gerekir.

`npm run build` sonucu: 105 test geçti, 0 başarısız, Firebase ortamına bağlı 2 test atlandı. Tarayıcıda 4:11/Husary Muallim 15 parçaya ayrıldı, son parça çaldı ve bölme ekranından çıkınca sûre kaynağı geri yüklendi.
