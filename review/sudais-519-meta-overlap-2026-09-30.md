# Südeys 519 aday: QDC meta / QUL kaynak zamanı örtüşmesi

`node review/audit-sudais-519-meta-overlap.mjs` komutu aynı klasördeki JSON sayımını yeniden üretir. İnceleme, QDC sağlayıcı âyet aralığını QUL âyet aralığı ve ilk kelimesiyle QDC ses ekseninde karşılaştırır. 3 ve 4. sûreler için ofset 0 ms, 28 için 0 ms, 29'un yalnız 1–45. âyetleri için +100 ms, 5'in yalnız 111–120. âyetleri için +126057 ms uygulanır. Beş sûredeki 519 satırın her biri için üç kısa PCM çapası kaynak eşleştirme taramasında kontrol edilmiş, özgün QDC MP3 SHA-256 değeri de yeniden doğrulanmıştır. Bu çapalar bütün âyetin fonem bütünlüğünü kanıtlamaz.

| Sûre | Aday | Hedefle hiç örtüşmeyen | Meta hedef başlamadan bitiyor | Meta ilk kelimeden önce bitiyor | Meta hedef bittikten sonra başlıyor | Önceki âyetle örtüşen | Orta noktası önceki âyette | Bütünüyle önceki âyette |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 3 | 200 | 94 | 94 | 96 | 0 | 109 | 23 | 7 |
| 4 | 176 | 129 | 0 | 0 | 129 | 0 | 0 | 0 |
| 5:111–120 | 10 | 9 | 9 | 9 | 0 | 8 | 7 | 1 |
| 28 | 88 | 29 | 27 | 30 | 2 | 53 | 41 | 11 |
| 29:1–45 | 45 | 15 | 15 | 16 | 0 | 42 | 26 | 5 |
| **Toplam** | **519** | **276** | **145** | **151** | **131** | **212** | **97** | **24** |

Aralıklar yarı açık `[baş, son)` kabul edilir. “Önceki âyet” sayımı yalnız hemen önceki âyet de aynı kaynak adayı kümesindeyse yapılır (519'un 514'ünde); bu yüzden 5:111'in pilotta duyulan 5:110 içeriği bu sütuna **katılmaz**. “Örtüşen”, meta aralığının önceki âyete en az 1 ms girmesidir; tek başına yanlış âyet oynatımının kesin işitsel ölçüsü değildir. Sütunlar birbirini dışlamaz. Hedefle hiç örtüşmeyen 276 satırın 145'i erken, 131'i geçtir. 4. sûredeki 129 geç pencerenin 99'u sıradaki aday âyetle örtüşür; 71'inin orta noktası sıradaki âyettedir, 20'si bütünüyle oradadır. Bu ters yön, tek küresel ofset düzeltmesini özellikle sakıncalı kılar.

Örnekler: QDC 28:44 meta aralığı 643040–652390 ms; QUL sesle 0 ms ofsette eşleşen 28:44 ilk kelimesi 653960'ta başlar. Paylı bağımsız hizalama penceresi 653890'da, hedefin ilk kelimesinden 70 ms önce biter. QDC 29:45 meta aralığı 576920–599200; kaynakla eşleşen QUL+100 ms 29:45 aralığı 598558–622530'dur, yani meta hedefle yalnız 642 ms örtüşür. QDC 29:46 meta aralığı 599200–621670, kaynakla eşleşen 29:45'in tamamıyla içindedir; fakat 29:46'nın kendi QUL/QDC üçlü dalga eşleşmesi başarısızdır ve sonraki sınır aktarılmaz. QDC 5:111 meta aralığı 2475690–2489460; kaynakla eşleşen QUL+126057 ms 5:111 aralığı 2496497–2511277: meta, hedef başlamadan 7037 ms önce biter. 5:110 kaynak eşleştirme kapısından geçmediği için +126057 ms geriye uzatılarak 5:110 kelime sınırları kanıtlanamaz.

Bu sayım **meta ile aday zaman koordinatının ilişkisini** gösterir; QUL kelime etiketlerindeki sıra istisnalarını, tekrarları, fonem bitişlerini ve kaynak kullanım hakkını çözmez. Üç kısa PCM penceresi tüm âyetin işitsel güvenliğini kanıtlamaz. Çıktılar üretim karantinasını kaldırma veya 519 satırı topluca aktarma onayı değildir.
