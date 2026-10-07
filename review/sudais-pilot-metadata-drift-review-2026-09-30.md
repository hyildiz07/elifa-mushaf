# Südeys pilot pencereleri: âyet etiketi kayması çapraz kontrolü

Bu inceleme yalnız mevcut araştırma çıktılarının çapraz kontrolüdür; üretim zamanlarını değiştirmez. QDC sağlayıcı aralıkları `test-results/timings/3-{5,28,29}.json`, bağımsız QUD Large yanıtları `review/sudais-independent-pilot/`, QUL kelime zamanları `test-results/sudais-qul-timings-{5,28,29}.json` ve kaynak PCM eşleşmeleri `review/sudais-qdc-qul-5-28-29-identity-screen.json` içinden okundu.

| Pilot hedefi | QDC meta penceresi (ms) | Kaynakla eşleşen QUL zamanı, QDC ekseninde (ms) | Pilot çıktısıyla ilişkisi |
| --- | ---: | ---: | --- |
| 28:44 | 643040–652390 | 28:43 = 635492–653440; 28:44 ilk kelimesi 653960'ta | 1500 ms paylı pilotun sonu 653890: hedefin ilk kelimesinden **70 ms önce**. Yalnız 28:43 duyulması beklenir. |
| 29:45 | 576920–599200 | 29:43 = 579432–588197; 29:44 = 588397–598358; 29:45 = 598558–622530 | Pilot sırayla 29:42 kuyruğu, tam 43 ve 44, 45'in ilk sözlerini buldu. Meta penceresi hedefin yalnız yaklaşık ilk **642 ms** bölümüne erişir. |
| 29:46 | 599200–621670 | 29:45 = 598558–622530 | Meta penceresinin **tamamı** kaynakla eşleşen 29:45 aralığının içindedir. Pilotun 29:45 bulması doğrudan açıklanır. |
| 5:111 | 2475690–2489460 | 5:111 = 2496497–2511277 (QUL +126057) | Hedef âyetin kaynakla eşleşen başlangıcı meta bitişinden **7037 ms sonra**. Pilot 5:110 devamını buldu. |

28. sûrede QUL ile QDC üç kelime merkezli dalga penceresi her 88 âyette aynı zaman ekseninde eşleşti. 28:44 için üç PCM korelasyonu 0,999972 / 0,999943 / 0,999920, ofset 0 ms idi. 29:45 için korelasyonlar 0,995087 / 0,995055 / 0,997151, üçünde de QDC +100 ms bulundu. 5:111 için değerler 0,986058 / 0,991081 / 0,988624 ve her üçünde QDC +126057 ms idi. Bu, söz konusu hedef içeriklerinin pilotun önerdiği meta pencerelerinin **sonrasında** bulunduğuna, tek hizalayıcı etiket hatası varsayımından bağımsız kanıt sağlar.

Sınırlar: 29:46'nın kendisi üç pencereli kaynak eşleştirme kapısını geçmedi; QUL 29:46 zamanı QDC'ye aktarılmış bir gerçek sınır olarak kullanılamaz. Pilotun 29:45'i 623170'e kadar etiketlemesi, eşleşen QUL 29:45 bitişinden 640 ms ileridedir; son harf sınırını bu model çıktısından belirlememek gerekir. 5:110 da kaynak eşleştirme kapısını geçmedi; +126057 ms ofsetini geriye taşıyarak 5:110'un tam kelime zamanlarını kanıtlamak mümkün değildir. Pilotun tek `5:110:1` gerilemesi 0,78 güven ve `missing=true` ile işaretlidir; bu, hizalayıcı etiket kusuru olarak ayrıca incelenmelidir. Bu yerel kusur 5:111 için üç bağımsız dalga eşleşmesini ortadan kaldırmaz. Kaynak eşleşmesi yalnız kısa pencereler üzerinden yapıldı; kesimlerin ilk/son fonem güvenliği ve diğer âyetler için genelleme doğrulanmış değildir.

Sonuç: Bu dört pilot, QDC sağlayıcı âyet indeksinde erken yerleştirilmiş pencereler bulunduğunu güçlü biçimde gösterir. Sıra korunuyor olabilir; bütün sûrelere tek bir sabit zaman veya âyet numarası ofseti uygulamak için kanıt yoktur. 429 kaynak+sıra adayını topluca açma gerekçesi oluşmaz.
