# 103 öncelikli sûre sonu: aynı icra alternatif kaynak taraması

**1 Ekim 2026 — araştırma, üretim yaması yok.** [Enerji öncelik denetimindeki](final-tail-energy-priority-2026-10-01.md) 103 son âyet bir kez topluca tarandı. Bu sayı hata sayısı değil; son sesin işitsel inceleme önceliğidir. Yeniden üretim: `node review/audit-priority-alternative-tails.mjs`, ardından `node review/profile-priority-alternative-tails.mjs`. Ham sonuçlar sırasıyla Git dışında `test-results/priority-alternative-tails.json` ve `test-results/priority-alternative-tail-profiles.json`.

Bu küme önceki 650 ms güvenlik eşiği dışında tutulan Hânî 65:12 ve Südeys 4:176'yı kapsamaz. Hânî 65:12'nin eski kaynakla ayrı karşılaştırması [önceki rapordadır](legacy-final-tail-source-comparison-2026-10-01.md).

| Ölçüm | Sonuç |
| --- | ---: |
| Üretim MP3 sonu başarıyla açılan öncelikli kayıt | **103/103** |
| Denenen alternatif | **152** (49 QuranicAudio eski sûre, 103 EveryAyah son-âyet klibi) |
| Sona yakın iki pencerede güçlü aynı-icra eşleşmesi | **38** |
| Aynı icra + >50 ms dosya uzaması + ilk 250 ms RMS >0,001 | **10** |
| EveryAyah içinde bu ölçütü geçen yeni uzama | **0** |

Kaynak eşleşmesi için üretim sonundan 700 ms önceki 500 ms penceresi alternatifin son 18 saniyesinde aranır; en iyi korelasyon ≥0,95 ve 1.500 ms önceki ek kontrol ≥0,85 olmalıdır. Sonra alternatifin fiziksel sonunun hizalı üretim sonundan ne kadar ileri olduğu ve ilk 250 ms RMS ölçülür. Bu eşikler **yalnız inceleme adayı** ayırır; fonem tamlığına karar vermez. VBR/CBR çözümü aralık başlangıcında artefakt oluşturabileceğinden sadece sona yakın örtüşen pencereler kullanıldı. 103 kaydın 30 Yâsir arşiv dosyası `archive.org` yönlendirmesindeki Node bağlantı zaman aşımından sonra aynı Archive.org öğesinin `dn710809.ca.archive.org/0/items/...` CDN yolunda yeniden denendi; son turda erişim hatası kalmadı.

| Öncelik | Kayıt | Eski sûre kaynağı | Ek dosya süresi | İlk 250 ms ek RMS | Son 700 ms öncesi korelasyon | Ek kısmın enerji seyri (250 ms bloklar) |
| ---: | --- | --- | ---: | ---: | ---: | --- |
| 1 | Hânî 24:64 | [QuranicAudio 024](https://download.quranicaudio.com/quran/rifai/024.mp3) | ~7.469 ms | 0,0067 | 0,9860 | İlk 0–250/250–500/500–750 ms RMS 0,0085/0,0034/0,0011; sonra çoğunlukla sessizlik. |
| 2 | Südeys 49:18 | [QuranicAudio 049](https://download.quranicaudio.com/quran/abdurrahmaan_as-sudays/049.mp3) | ~779 ms | 0,0113 | 0,9757 | İlk dört 250 ms blok: 0,0129/0,0059/0,0038/0,0033. |
| 3 | Hânî 2:286 | [QuranicAudio 002](https://download.quranicaudio.com/quran/rifai/002.mp3) | ~531 ms | 0,0143 | 0,9965 | 0,0156/0,0091/0,0040. [Ayrıntılı A/B dinleme](../test-results/docs/local-audio-review/index.html). |
| 4 | Südeys 24:64 | [QuranicAudio 024](https://download.quranicaudio.com/quran/abdurrahmaan_as-sudays/024.mp3) | ~549 ms | 0,0109 | 0,9961 | 0,0123/0,0077/0,0055. |
| 5 | Südeys 45:37 | [QuranicAudio 045](https://download.quranicaudio.com/quran/abdurrahmaan_as-sudays/045.mp3) | ~526 ms | 0,0086 | 0,9817 | 0,0100/0,0060/0,0047. |
| 6 | Südeys 42:53 | [QuranicAudio 042](https://download.quranicaudio.com/quran/abdurrahmaan_as-sudays/042.mp3) | ~314 ms | 0,0121 | 0,9996 | 0,0166/0,0059. |
| 7 | Südeys 92:21 | [QuranicAudio 092](https://download.quranicaudio.com/quran/abdurrahmaan_as-sudays/092.mp3) | ~240 ms | 0,0049 | 0,9726 | 0,0116. |
| 8 | Südeys 36:83 | [QuranicAudio 036](https://download.quranicaudio.com/quran/abdurrahmaan_as-sudays/036.mp3) | ~209 ms | 0,0063 | 0,9980 | 0,0095. [Ayrıntılı A/B dinleme](../test-results/docs/local-audio-review/index.html). |
| 9 | Südeys 61:14 | [QuranicAudio 061](https://download.quranicaudio.com/quran/abdurrahmaan_as-sudays/061.mp3) | ~105 ms | 0,0106 | 0,9843 | 0,0115. |
| 10 | Südeys 1:7 | [QuranicAudio 001](https://download.quranicaudio.com/quran/abdurrahmaan_as-sudays/001.mp3) | ~79 ms | 0,0075 | 0,9861 | 0,0113. |

Tablodaki uzunluklar 1 ms mono PCM eşleşmesine dayanan yaklaşık değerlerdir; 250 ms profilin son bloğu daha kısa olabilir. Eski Hânî 24:64 dosyasının 7,5 saniye uzun olması, eksik 7,5 saniyelik okuma bulunduğu anlamına gelmez. İlk ~750 ms'den sonra enerji büyük ölçüde sönmüştür. Benzer biçimde diğer pozitif kuyrukların ses taşıması, bunun son kelimenin eksik harfi mi, son nefes/yankı mı, yoksa kaydın işlenmesinden doğan kuyruk mu olduğunu söylemez. Bu nedenle hiçbir yeni kaynak veya zaman üretime eklenmedi.

Sonraki kanıt kapısı: her pozitif kaydın üretim sonu ile alternatifin ilk ek 0,2–1 saniyesini kanonik son kelimeyle A/B dinleyip fonem düzeyinde işaretlemek; yalnız gerçek eksik ses bulunan vakada kaynağı, SHA kimliğini, zamanı ve kullanım hakkını birlikte doğrulamak. [QuranicAudio'nun açıklaması](https://quranicaudio.com/about) indirmeyi kişisel kullanım için ücretsiz tanımlar; bu, üçüncü taraf uygulamada yeniden paketleme izni olarak varsayılmamalıdır.
