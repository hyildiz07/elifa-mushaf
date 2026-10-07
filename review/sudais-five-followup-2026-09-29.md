# Südeys beş istisna: bağımsız ses denetimi (2026-09-29)

Bu kayıt yalnız inceleme kanıtıdır; üretim zamanlaması önerisi değildir. Yerel aday sesler `test-results/review-sudais-full-verses/manifest.json` içindedir. Son 100 ms zarfı `node review/audit-sudais-tail-envelope.mjs` ile yeniden üretilebilir.

| Âyet | Aday aynı icra kanıtı | 192 kbps etiket-sonu → fiziksel son | Son 100 ms RMS | Karar |
| --- | --- | ---: | ---: | --- |
| 3:160 | 64/192 kbps dört ayrı PCM penceresinde 0.9062–0.9609 korelasyon | 251 ms | 0.01620 | Son 10 ms aktif; son fonem dinleme onayı olmadan tam âyet sayılmaz. |
| 4:143 | Dört ayrı pencerede 0.9389–0.9679 | 591 ms | 0.02475 | Son 10 ms aktif; dinleme onayı gerekli. |
| 5:5 | Dört ayrı pencerede 0.8865–0.9604 | 231 ms | 0.03287 | Son 10 ms aktif; özellikle uzun âyetin sonu dinlenmeli. |
| 4:134 | QUD 192 kbps EveryAyah dosyasına 1–10 ve 11–14 segmentlerini eşliyor | QuranLab etiketiyle 1312 ms; QUD ikinci segmentinin sonu ile yalnız 11 ms | 0.01584 | QuranLab son etiketi ses bitişini göstermiyor; QUD segmenti de son harfin eksiksizliğini kanıtlamıyor. |

Ölçülen RMS, iki kanal 16-bit PCM örneklerinin kare ortalamasıdır. Son 10 ms pencereleri sırasıyla 3:160 için 0.01417, 4:143 için 0.02365, 5:5 için 0.02814 ve 4:134 için 0.01938. Enerji ölçümü son duyulan sesin seslendirme mi, uzayan yankı mı olduğunu tek başına ayıramaz. 64 ve 192 kbps sürümlerinin benzer biçimde aktif bitmesi de bağımsız tam-son kanıtı değildir; aynı kaynak kesiminden kodlanmış olabilirler.

39:54'te QUL kelime dizisi 4–5. kelimeleri ikinci kez içeriyor ve QUL sûre sesinin QuranCDN kaydıyla üç pencerede 0.9977–0.9983 korelasyonu var (`review/sudais-eight-exceptions-audit.json`). Tekrarı ilk karta bütünüyle alıp 5|6 sınırında iki kart oluşturma adayı vardır (`review/sudais-39-54-repeat-candidate.json`). O sınırda metadata aralığı yalnız 50 ms, çevre ses etkin ve yerel en düşük 10 ms RMS 0.11038 olduğundan kelime kesilmediği ya da sonraki kelimenin sızmadığı kanıtlanmadı.

Beş vakada da sağlam üretim kapatma kararı için iki taraflı kelime ve son harf dinleme denetimi, kullanılacak kayıt/zaman verisinin hak incelemesi, ardından bölünmüş oynatma ve tekrar akışı testi gerekir. Bu denetim tamamlanana kadar başka icranın kelime zamanlarını aktarmak veya sayısal etiketlerin üzerine sessizce yazmak güvenli değildir.
