# Südeys açık istisnaları: akustik inceleme (2026-09-28)

Bu çalışma **inceleme verisidir**; uygulamanın ses sınırlarını değiştirmez. Kesim adayları otomatik üretildi ve henüz dinleyerek doğrulanmadı.

## Aynı kayıt doğrulaması

24:35 için [QuranLab `quran-audio`](https://huggingface.co/datasets/quranlab/quran-audio) Südeys/EveryAyah kaydı ile uygulamanın QuranCDN sûre MP3'ü üç ayrık PCM penceresinde aynı performanstır: korelasyonlar **0,902 / 0,939 / 0,904**, ortak kayma yaklaşık **2493–2506 ms**. Sonraki ayrı adayın korelasyonu 0,179'dur. Bu eşleşme yalnızca bu âyet için geçerlidir; diğer sûreler için genellenmez.

24:35'te kaynak zamanları 48 kelime üretirken QuranCDN 47 satır ve yalnızca 45 farklı kelime konumu veriyor. Mevcut bölme ilk 36 kelimeyi tek parçada tutuyor. Modelin önerdiği komşu kelime aralığında, **iki PCM kanalının ikisinde de** çevredeki konuşma RMS medyanının %20'si altında kalan en uzun aralıklar:

| Sınır | Kelimeler | Öneri zamanı (sûre MP3'ü) | Düşük enerji | Durum |
| --- | --- | ---: | ---: | --- |
| 9/10 | مِصْبَاحٌ ۖ / ٱلْمِصْبَاحُ | 626835 ms | 100 ms | Dinleme gerekli |
| 19/20 | شَجَرَةٍۢ / مُّبَـٰرَكَةٍۢ | 638443 ms | 30 ms | Zayıf aday |
| 25/26 | غَرْبِيَّةٍۢ / يَكَادُ | 645190 ms | 60 ms | Zayıf aday |
| 32/33 | نَارٌۭ ۚ / نُّورٌ | 654127 ms | 410 ms | En güçlü aday; dinleme gerekli |

`test-results/review-sudais-24-35/manifest.json` her adayın mutlak zamanını, HF aralığını ve PCM eşiğini saklar. Aynı dizindeki `*-context.wav` dosyalarında kesim ortada (1,5. saniyede), `*-before.wav` ve `*-after.wav` dosyalarında iki taraf ayrı dinlenebilir. Bu dizin `.gitignore` kapsamındadır; yayın paketine girmez. Kesim yeri **kelime sınırı olarak onaylanmadı**, bu yüzden override üretilmedi.

Sekiz hedefi elle dinlemek için `node scripts/serve-sudais-review.mjs` ardından `http://127.0.0.1:4174/docs/sudais-verse-review.html` açılır. Yerel sayfa aynı sûre MP3'ünü, kanonik kelimeleri, PCM dalgasını ve 24:35'teki WAV adaylarını gösterir; dinleme notlarını tarayıcıda tutup **doğrulanmamış taslak** olarak JSON dışa aktarır. Kaynak HTML, `node scripts/generate-sudais-review.mjs` ile yeniden üretilebilir. Sunucu yalnız bu sayfa ve ilgili 12 WAV'a erişim sağlar; üretim `dist/` derlemesi `docs/` ve `test-results/` dizinlerini kopyalamaz.

39:54 için aynı performans eşleşmesi üç PCM penceresinde yaklaşık 0,428 / 0,877 / 0,742 korelasyon verdi, fakat QuranCDN 13 kelimelik âyete tek konum etiketi sağlıyor. QuranLab'in önerdiği 12 iç kelime aralığının hiçbirinde iki kanallı PCM enerji taraması konuşma medyanının %20'si altında sürekli bir kesit bulamadı. Sesi kesmeden kısa parçalara ayıracak bir nefes sınırı bu yöntemle kanıtlanamadı.

3:160, 4:134, 4:143, 5:5, 5:46 ve 5:82 için EveryAyah 64 ve 192 kbps örnekleri QuranCDN sûre MP3'ündeki aynı performansla eşleşmedi; düşük ve tutarsız korelasyonlar yüzünden bu örneklerin kelime zamanları taşınamaz.

Doğrudan uygulamanın **aynı QuranCDN MP3'ü** üzerinde `prepareWindow` akustik durak taraması da sekiz hedefin tamamında çalıştırıldı (`test-results/sudais-exceptions-acoustic.jsonl`). Sonuçların kelime etiketlerini otomatik doğru kabul etmek güvenli değil:

| Âyet | Akustik adaylar | Neden hazır düzeltme değil? |
| --- | --- | --- |
| 24:35 | 32–35, 44–46 | Kaynakta 33–35 etiketleri kayıp; algoritma 32–35 için **aynı 658495 ms** kesimini öneriyor. Bu dört ayrı kelime sınırı olamaz. Bağımsız HF+PCM incelemesindeki 32/33 adayı ayrıca dinlenmeli. |
| 3:160 | 7, 13, 15 | 15. aday (2623350 ms) sağlayıcı âyet bitişinden (2622580 ms) sonraya düşüyor; bütün âyet sonu hâlâ güvenli değil. |
| 39:54, 4:134 | Yok | Aynı kayıtta güvenli iç nefes bulunmadı. |
| 4:143 | 4, 11 | İç duraklar var, ama son kelime sağlayıcı âyet bitişinden sonra; tam âyetin oynatımı hâlâ doğrulanmadı. |
| 5:5 | 11, 23, 28, 39, 40 | 23 ve sonrası sonraki âyetin başından geç; erken biten âyet aralığı çözülmedi. |
| 5:46 | 2 | Geriye yaklaşık 24 kelimelik tek grup kalıyor. |
| 5:82 | 3 | Geriye yaklaşık 23 kelimelik tek grup kalıyor. |

Bu ölçümler hiçbir âyete otomatik zaman override'ı eklemek için yeterli değil.

## Forced-alignment araçlarının uygulanabilirliği

- [`quran-forced-align`](https://github.com/HsnSaboor/quran-forced-align) doğrudan sûre MP3'üyle CPU'da çalışmayı ve tekrar saptamayı destekliyor. Ancak gerekli yaklaşık 73 MB ONNX modeli Hugging Face üzerinde **manuel erişim onaylı**. [Model lisansı](https://huggingface.co/Muno459/zipformer_p-arabic-v2/blob/main/LICENSE) kâr, ücretli özellik ve reklam gelirini yasaklıyor; model çıktıları için de koşulları açıkça değerlendirilmeli. Bu ortamda model/ONNX/PyTorch kurulmadı. Aracın otomatik çıktısı ayrıca dinleme denetiminin yerini tutmaz.
- [`quran-timing-helper`](https://github.com/quraniio/quran-timing-helper) Whisper large-v3 ve wav2vec2 kullanıyor. [Kendi gereksinimleri](https://github.com/quraniio/quran-timing-helper#requirements) yaklaşık 10 GB model alanı ve ffmpeg istiyor. [Lisansı](https://github.com/quraniio/quran-timing-helper/blob/main/LICENSE) yazılım ve ürettiği zaman dosyalarını tamamen ücretsiz ürünlerle sınırlıyor. Bu Windows çalışma alanında Python var, fakat ffmpeg, Torch, model ağırlıkları kurulu değil. Ağır kurulum yerine aynı MP3 üzerinde dar PCM incelemesi yapıldı.

Bu iki model bir gün çalıştırılsa bile sonuçları yalnızca aday sınır olur. Özellikle 39:54 gibi nefessiz okunan âyetlerde model kelime geçişi kestirebilir, ancak sesin yarım kelimeye kaymadan kesildiğini ayrıca kanıtlamaz.
