# v290 sûre sonu oynatma denetimi — 1 Ekim 2026

Bu denetim `test-results/final-verse-corpus-index.json` içindeki üretim kaynak eşleşmelerini taradı. 1.253 indeksli kaydın 223'ünde sağlayıcı son âyet bitişi ham MP3 sonundan ileride. Fark dağılımı: 155 kayıt ≤25 ms, 48 kayıt 25–100 ms, 12 kayıt 100–200 ms, 6 kayıt 200–650 ms, 2 kayıt >650 ms. İndekslenemeyen Yâsir 1:7 bu sınıflandırmaya dahil değil.

650 ms üstündeki Südeys 4:176 ve Hânî 65:12 v290'da zaten güvenlik engelinde. Kalan en büyük altı fark için aynı üretim MP3/metadata çiftiyle `prepareWindow` ve `prepareSelectedRange` çalıştırıldı.

İlk çalışmada **Südeys 27:93** gerçek bir VBR EOF kontrol hatasını ortaya çıkardı: `prepareWindow` 1.032.112 ms'ye kadar PCM hazırladı; hesaplanan fiziksel dosya sonu 1.032.138 ms, sağlayıcı bitişi 1.032.450 ms. Fark yaklaşık 312 ms ve genel 650 ms eşiğinin içindeydi. Buna rağmen `finalTailRequestedEnd` boş kaldı ve `prepareSelectedRange` `Selected audio range incomplete` verdi. Nedeni `completeAtIndexedFileEnd` kontrolünün `index.size` gerektirmesiydi; doğrulanmış VBR indeksi `fileSize` taşıyor. Üretim kodunda aynı oturumda `fileSize` kabulü eklendi. **Tekrar taramasında altı örneğin tamamında hem bölme hem seçili aralık penceresi hazırlandı**; Südeys 27:93'ün `finalTailRequestedEnd` değeri 1.032.450 ms oldu.

İlk prototip probda görülen `Audio ends before the requested verse (338 ms)` ayrı bir Node betiği artefaktıydı: betik VBR indeksini sağlamayınca tarayıcıya göreli katalog adresi Node'da açılamadı ve tam dosya decode'u metadata sonunu aradı. Betik artık üretimdeki doğrulanmış VBR indeksini önceden yüklüyor. Bu ilk hata gerçek tarayıcıdaki indeksli yola ait değildi.

Tekrar üretim: `node review/audit-v290-final-eof-playback.mjs`. Ham sonuç: `test-results/v290-final-eof-playback.json`. Betik üretim dosyalarını değiştirmez. Bu test teknik pencere hazırlanmasını denetler; son fonemin işitsel doğruluğunu kanıtlamaz.
