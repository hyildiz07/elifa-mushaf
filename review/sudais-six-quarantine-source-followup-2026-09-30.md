# Südeys altı uzun âyet: aynı kayıt kanıtı ve bölme durumu

**İnceleme sonucu:** 3:160, 4:134, 4:143, 5:5, 5:46 ve 5:82 için mevcut üretim kaydına denk gelen inceleme kaynakları bulundu. Bu, hiçbirinin kısa parça oynatımını henüz onaylamaz. Kaynak eşitliği, kelime konumu ve güvenli fonem kesimi ayrı kapılardır. Üretim varlıkları değiştirilmedi.

| Âyet | Aynı kaynak kanıtı | Kelime kapsamı | Açık engel |
| --- | --- | --- | --- |
| 3:160 | QDC/QUL tam çözülen PCM'de üç pencerede 0 ms ofset, 0,9996–0,9999 korelasyon; ayrıca aynı QDC'de QUD Base/Large | 18/18 QUD adayı | Son ses / sonraki âyet geçişi dinlenmedi; iç kesimler onaylanmadı. |
| 4:134 | Bu turdaki üç 1 sn QDC/QUL penceresinde 0 ms ofset, **0,999831 / 0,999820 / 0,999855** | QUL 14/14 | QUL her kelime arasına sabit 50 ms koyuyor; gerçek sessizlik değil. 7/8 gibi gereken sınır dinlenmedi. |
| 4:143 | QDC/QUL tam çözülen PCM'de üç pencerede 0 ms ofset, 0,9996–0,9999; aynı QDC'de QUD Base/Large | 16/16 QUD adayı | Son harf/yankı ve sonraki giriş ayrılmadı. |
| 5:5 | QDC tam MP3 kaynağından QUD Base/Large adayı | 24–25 tekrarları dahil | Sonraki âyetle yalnız yaklaşık 56 ms model aralığı; gerçek kesim doğrulanmadı. |
| 5:46 | QDC tam MP3 kaynağından QUD Base/Large, yaklaşık 20 ms model uzlaşması | 1–26 ve 24 tekrarı | Dört önerilen iç kesimin üçünde model boşluğu yok; iki taraflı dinleme gerekli. |
| 5:82 | Bu turdaki tam QDC 5:82–84 PCM penceresinde QUD Base/Large aynı diziyi ve kelime zamanlarını döndürdü; kaynak SHA-256 `16fad03b000d69492da95e9f970f220ae097a6693815917924b43f1730ae8cdb` | 1–23, 23 tekrar, 24–26 = 27 okunuş / 26 kanonik kelime | Modelin ilk iki öbeği 9'ar kelime; ≤8 için gerekli 7/14/20 kesimleri sıfır boşluk ve yüksek enerji taşıyor. Son ses ve 5:83 girişi de dinlenmedi. |

5:82'nin eski sağlayıcı aralığı **1852870–1883090 ms**. Aynı MP3'ün baştan çözülen daha geniş penceresinde iki QUD modeli âyeti yaklaşık **1867803 ms**'de başlatıp son kelimeyi **1897033 ms**'de bitiriyor; 5:83 başlangıcı **1897510 ms**. Eski aralık önceki âyetin sesini alıyor ve 5:82'nin sonunu atlıyor. Yerel 38326543 baytlık MP3'ün ilk, orta ve son 4096 baytı canlı QDC CDN aralık yanıtlarıyla birebir eşleşti; yerel SHA-256 yukarıdaki değerdir. QUD 9/10, 18/19 ve tekrarlanan 23'ün iki okunuşu arasında sırasıyla 727, 567 ve 436 ms model boşluğu buldu. Bu aralıkların en düşük 20 ms RMS ölçümleri sırasıyla 0,07782, 0,10819 ve 0,09740; sessizlik olarak kabul edilemez. Model sınırları otomatik üretim kesimine çevrilmedi.

5:82 kanıtları [`build-sudais-qdc-5-82-prototype.mjs`](build-sudais-qdc-5-82-prototype.mjs) ve [`5-82-prototype.json`](sudais-qdc-align/5-82-prototype.json) içinde; ham Base/Large yanıtları `sudais-qdc-align/5-82-to-84-full{,-base}-{align,words}.json` dosyalarında. 4:134 kaynak karşılaştırması [`compare-sudais-qul-qdc-4-134.mjs`](compare-sudais-qul-qdc-4-134.mjs) ve [`sudais-qul-qdc-4-134-pcm.json`](sudais-qul-qdc-4-134-pcm.json) içinde. Önceki üç âyetin ayrıntısı [`sudais-exact-qdc-restoration-gate-2026-09-30.md`](sudais-exact-qdc-restoration-gate-2026-09-30.md), 5:46 ayrıntısı [`sudais-restoration-prototype-2026-09-30.md`](sudais-restoration-prototype-2026-09-30.md) içindedir.

QUL 3/4 zamanlarının yeniden kullanım izni henüz doğrulanmadı. QUD'nin CC BY 4.0 zaman/veri lisansı, ses kaydının yeniden dağıtım izni değildir. Seste son harf ve önerilen her iç sınır iki taraflı dinlenmeden hiçbir karantina kaldırılmamalı.
