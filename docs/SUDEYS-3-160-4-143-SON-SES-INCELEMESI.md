# Südeys 3:160 ve 4:143 kayıt sonu incelemesi

Bu denetim yalnız inceleme içindir; ses kaynağı, zaman asset'i ve üretim oynatımı değiştirilmedi. Tekrar üretim betiği [`review/analyze-sudais-two-verse-tails.mjs`](../review/analyze-sudais-two-verse-tails.mjs), ölçüm çıktısı [`review/sudais-two-verse-tail-analysis.json`](../review/sudais-two-verse-tail-analysis.json). Girdi WAV'ları `test-results/review-sudais-full-verses/` içindedir.

| Âyet | 192 kbps son 40 ms RMS / periyodiklik | 64 kbps son 40 ms RMS / periyodiklik | Karar |
| --- | --- | --- | --- |
| 3:160 | 0,01450 / 0,874; baskın periyot yaklaşık 207 Hz | 0,02091 / 0,968; yaklaşık 206 Hz | Son ses kademeli azalıyor ancak bitişte hâlâ periyodik insan sesi var. Tam fonem kanıtlanmadı. |
| 4:143 | 0,01952 / 0,925; yaklaşık 208 Hz | 0,02862 / 0,879; yaklaşık 208 Hz | Son 300 ms'de belirgin enerji sürüyor. Tam fonem kanıtlanmadı. |

QuranLab'ın [Südeys kelime zamanı](https://huggingface.co/datasets/quranlab/quran-audio) 3:160 son sözü 18583 ms, 4:143 son sözü 15082 ms'de bitiriyor; 192 kbps dosyalar sırasıyla 18834 ve 15673 ms'ye dek sürüyor. 64/192 sesleri dört ayrı pencerede aynı icra. Sonraki âyet başıyla güçlü PCM korelasyonu yok. Bu veriler son kayıt parçasının yalnız yankı olduğunu **kanıtlamıyor**: perde sürekliliği, devam eden son sesli harfle de uyumlu. İki âyet için 64 ve 192 kbps son 1,5 saniye ile sonraki âyetin ilk 1,5 saniye WAV'ları dinlenerek son harfin tam duyulduğu ayrıca onaylanmalı.

Yerel Qur’anic Universal Audio v3.2.0 kaynak kataloğunda Südeys icrası bulunamadı; bu nedenle aynı icraya ait farklı, açık lisanslı bir tam âyet kaynağı bu turda doğrulanmadı. QuranLab kelime zamanları CC BY 4.0 olsa da ses dosyalarının lisansı ayrı konudur. **Üretim için doğrulanmış yeni kaynak/zaman asset'i yoktur.**
