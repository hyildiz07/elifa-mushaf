# Südeys sûre kaydı / âyet zamanı denetimi (30 Eylül 2026)

Bu denetim üretim zamanlarını değiştirmez. Uygulamadaki QuranCDN MP3 dosyasından âyet aralıkları kesildi. Aynı kesim, bir kez VBR indeksli hızlı yoldan, bir kez **dosyanın başından ardışık PCM decode** yoluyla üretildi. Uzak üçer PCM penceresi örnek düzeyinde aynıydı (RMS fark en çok yaklaşık `4×10⁻⁸`); dolayısıyla aşağıdaki eşleşme sorunları seek hatası değildir. Ardından QUD hizalayıcısının Base ve Large modelleriyle ses/metin referansı karşılaştırıldı. Model çıktısı kelime sınırı onayı değildir; kimlik denetimidir.

| Sûre | Sağlayıcı âyet aralığı | Kaynak MP3'ten tanınan içerik | Sonuç |
| --- | --- | --- | --- |
| 5 | 5:1 | 5:1 | Başta uyumlu |
| 5 | 5:5 | 5:5'in yalnız yaklaşık 3–14. kelimeleri | Âyet sonu metadata ile çelişiyor |
| 5 | 5:46 | 5:45:12–31 ve 5:46:1–8 | Yanlış âyet sınırı |
| 5 | 5:82 | 5:81 sonu ve 5:82:1–15 | Yanlış âyet sınırı |
| 5 | 5:119 | 5:117 sonu ve 5:118 başı | Kayma sûre sonunda da sürüyor |
| 27 | 27:1, 27:47 | Beklenen âyetler | Kontrol örnekleri uyumlu |
| 27 | 27:92 | 27:92; son grup 27:93:1'e uzanabilir | Sınır ayrıca dinlenmeli |
| 28 | 28:2 | 28:2 | Başta uyumlu |
| 28 | 28:44 | 28:43 sonu | Yanlış âyet sınırı |
| 28 | 28:87 | 28:86 ve 28:87 ilk üç kelime | Yanlış âyet sınırı |
| 29 | 29:2 | 29:2 | Başta uyumlu |
| 29 | 29:35 | 29:33 sonu ve 29:34 başı | Yanlış âyet sınırı |
| 29 | 29:68 | 29:67 sonu ve 29:68 ilk 10 kelime | Yanlış âyet sınırı |

29:35'te model ilk grubu `29:32` diye etiketliyor; 29:32 ve 29:33 aynı «إِلَّا ٱمْرَأَتَهُۥ كَانَتْ مِنَ ٱلْغَـٰبِرِينَ» sözleriyle bittiğinden bu referans belirsizliğidir. Komşu 29:33/34/36 kesimleri, âyetin atlanmadığını ve dizinin sıralı olduğunu gösteriyor. 28:87 için ilk PCM ölçümündeki tek yüksek fark, denetim betiğinin zamanları ayrı ayrı örneğe yuvarlamasından kaynaklandı; sabit tamsayı örnek ofsetiyle tekrar ölçümünde fark yaklaşık `1.8×10⁻⁸` oldu.

Sağlayıcının `file_size` alanı 5. sûrede 64,643,200 bayt, gerçek MP3 ise 38,326,543 bayt. 3, 4 ve 27. sûrelerde de benzer farklılıklar bulunduğundan bu alan tek başına kayıt değişimine kanıt değildir. Güvenilir sonuç, gerçek MP3 PCM'sinin sağlayıcı âyet aralıklarıyla içerik olarak uyuşmamasıdır. 5, 28 ve 29 için mevcut segmentlerle küçük parça sesi üretmek kullanıcıya yanlış âyet oynatabilir. Güvenli kısa parça için aynı MP3 üzerinde baştan sona yeni âyet ve kelime hizası, ardından işitsel doğrulama gerekir.

Tekrarlanabilir araçlar: `align-sudais-qdc-5-46-5-82.mjs` (`QDC_SURA`, `QDC_FULL_DECODE`, `QDC_MODEL` ortam değişkenleriyle), `check-sudais-qdc-5-full-pcm.mjs`. Makine çıktıları `sudais-qdc-align/` altındadır. WAV kesimleri Git dışındaki `test-results/sudais-qdc-align/` klasöründedir.
