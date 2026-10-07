# Südeys için hızlı toplu ses eşlemesi (yalnız inceleme)

`node review/screen-sudais-qdc-qul-verses.mjs` yerel QDC ve QUL 3/4. sûre MP3'lerini baştan sona birer kez çözer. Her âyetin QUL zamanlarında üç adet 360 ms ses penceresini özgün QDC kaydıyla karşılaştırır. ±20 ms aramadaki en iyi kaymayı ve PCM korelasyonunu kaydeder; kanonik kelime kapsamını ve geriye dönen kelime etiketlerini ayrıca tarar. Sonuç `review/sudais-qdc-qul-verse-screen-2026-09-30.json` dosyasındadır. `--surah=3`, `--surah=4`, `--max-verses=10` seçenekleri küçük tekrar çalıştırmalar içindir. İki sûreyi tam tarama bu makinede yaklaşık **12,5 saniye** sürdü; uzak hizalama servisine istek yapmadı.

Yeniden üretim komutu: `node review/screen-sudais-qdc-qul-verses.mjs`. Kaynak SHA-256 (QDC / QUL): 3. sûre `7a52d1efb56e31d8c84436aec39cbeebde8498dfa43acaf2c082c7c145153614` / `84a6c9290cfc336368e8e246dac8d18bbff33bc5d97a0fb643fe4782880942bb`; 4. sûre `60adc3638bc3cdf6dbfcf110ab1102f810794ea21e74f3764cd159b3f13d122d` / `94a128c0bbc39b5a9fad8d71284002c34b2f3a58a65555c1a2f61eca4016003b`. Her iki çiftten çözülen süreler sırasıyla **3.367.023 ms** ve **3.549.895 ms**. Bunlar yalnız bu sabit yerel dosyaların ölçümleridir.

| Ölçüm | 3. sûre | 4. sûre | Toplam |
| --- | ---: | ---: | ---: |
| Taranan âyet | 200 | 176 | **376** |
| Taranan ses penceresi | 600 | 528 | **1.128** |
| QDC/QUL korelasyonu ≥0,95 | 600 | 528 | **1.128** |
| Sıfır ms kayma bulunan pencere | 600 | 528 | **1.128** |
| Katı ses+sıra aday kapısını geçen âyet | 164 | 138 | **302** |
| Tekrar veya etiket gerilemesi nedeniyle ayrılan âyet | 36 | 38 | **74** |

En düşük pencere korelasyonu 3. sûrede **0,999198**, 4. sûrede **0,999420**. 3. sûrede **36**, 4. sûrede **38** âyette etiket sırası geriye döndü; 3:69 aynı zamanda bir kelime zamanının âyet alanı dışında olması nedeniyle iki ayrı neden taşır. Bu yüzden toplam tutulan âyet **74**, neden sayısı **75**'tir. Gerileme işareti kendi başına hata değildir: gerçek kıraat tekrarlarını ve yanlış sağlayıcı etiketlerini birlikte yakalar. Önceki ayrıntılı kanonik incelemede dokuz özgül anomali bulundu (`sudais-qul-qdc-restoration-decision-2026-09-30.md`); bu taramanın 74 ayırması daha katı ve ihtiyatlıdır.

**Bu ölçüm hiçbir âyeti üretime açmaz.** Pencere korelasyonu iki MP3'ün aynı ses ekseninde olduğunu kanıtlar, QUL zamanının son fonemi tamamladığını veya kısa kartların kelimeleri temiz ayırdığını kanıtlamaz. Önceki `audit-sudais-interverse-acoustics.mjs` çalışmasında 3/4 arasındaki 374 aday âyet geçişinin hiçbirinde 120 ms katı sessizlik saptanmadı. Bu nedenle 302 aday da gerçek kesim için ayrı fonem/iki taraflı dinleme kapısına tabidir; 74 âyette tekrar/sıra uzlaştırması da gerekir. QUL veri kullanım koşulu henüz üretim paketlemesi için doğrulanmadı.

Kalan 5/28/29. sûreler bu taramaya dahil değildir. Bunlar 277 âyettir; eski çalışmalarda QUL ile QDC'nin bazı uzak pasajlarının farklı icra/düzenleme olduğu ölçüldü (`sudais-restoration-prototype-2026-09-30.md`). Dolayısıyla 3/4'teki sıfır kayma sonucu onlara taşınamaz.

## Bağımsız hizalayıcı adayı

[quran-forced-align](https://github.com/HsnSaboor/quran-forced-align) özgün MP3'ü ve sûre numarasını alıp bütün sûre için kelime zamanları ile tekrar bayrakları üretmeyi amaçlayan bir çevrimdışı araçtır. Bu, özellikle 5/28/29'da QUL sesine bağımlılığı azaltabilir. Henüz bu projede kurulmadı veya özgün Südeys kayıtlarında ölçülmedi; önce tek bir karantina sûresinde pilot çalıştırıp bilinen 5:46/5:82 tekrarlarını ve âyet uçlarını QUD Base/Large ile karşılaştırmak gerekir. Araç varsayılan olarak erişim onaylı [v2 modelini](https://huggingface.co/Muno459/zipformer_p-arabic-v2) ister. [Ayrı v3 model sayfasının](https://huggingface.co/Saboorhsn/quran-stt-onnx) verdiği 12–15× CPU ve GPU hızları bu v2 kurulumunda doğrulanmış hızlar sayılamaz. Her iki model ailesinin kullanım ve çıktı koşulları ücretsiz/gelirsiz uygulama sınırları taşır; [Quran-Lab v3](https://huggingface.co/Quran-Lab/zipformer_p-arabic-v3) NPL-1.2 altında ayrıca kendi koşullarını bildirir. Kullanım ve çıktı hakları, model dosyası indirilmeden ve üretim verisi oluşturulmadan önce mevcut uygulama için ayrıca okunmalıdır.
