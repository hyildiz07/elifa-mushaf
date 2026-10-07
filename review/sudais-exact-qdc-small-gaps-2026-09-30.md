# Südeys: yedi küçük boşluk için üretim MP3 denetimi

Bu turda her ses penceresi QDC'deki üretim MP3'ünün başından çözülerek çıkarıldı. Quran University Align'ın Base ve Large modelleri aynı pencere üzerinde bağımsız çalıştırıldı; hedef kelime dizisi ve önceki/sonraki âyet sınırları karşılaştırıldı. Üretime alınan iki vakanın SHA-256, pencere, bütün model segmentleri ve kelime saatleri `review/sudais-small-gap-qdc-evidence.json` içinde saklıdır. Kaynak MP3 adresi asset satırında tam eşleşme koşuludur.

| Âyet | Sağlayıcı sınırı (ms) | Exact QDC üzerinde iki modelin hedef aralığı / sonraki âyet başlangıcı (ms) | Karar |
| --- | ---: | ---: | --- |
| 2:25 | 328200–367360 | 328337–367220 / 367360 | Eksik 22. kelime 351557–352497. 6–8 ve 19. kelimelerin gerçek tekrarları iki modelde aynı; bütün söylenişleri koruyan satır eklendi. |
| 3:37 | 615370–647470 | 615930–647980 / 648060 | 10. kelime modelde var, ancak 3. sûrenin üretim âyet saatleri topluca kaymış. Sûre karantinası sürüyor; satır eklenmedi. |
| 4:95 | 2094160–2126240 | 2062750–2093307 / 2093337 | 15. kelime modelde var; sağlayıcı 4:95 aralığı gerçek okumadan yaklaşık 31 saniye sonra. Sûre karantinası sürüyor. |
| 4:146 | 3082120–3106150 | 3007423–3030087 / 3030117 | 6. kelime modelde var, fakat 7–9 tekrar okunuyor ve sağlayıcı aralığı yaklaşık 75 saniye geç. Sûre karantinası sürüyor. |
| 5:91 | 2035190–2053790 | 2046420–2064540 / 2064620 | 5–6. kelimeler modelde var; sağlayıcı aralığı âyetin büyük bölümünü kapsamıyor. Sûre karantinası sürüyor. |
| 5:103 | 2258090–2278050 | 2264943–2284373 / 2284403 | 1–2. kelimeler modelde var; 10–11 ayrıca tekrar okunuyor ve gerçek bitiş sağlayıcı sınırını aşıyor. Sûre karantinası sürüyor. |
| 41:44 | 572070–601330 | 572163–601420 / 601540 | Eksik 17. kelime 588403–589423. İki model 1–30'un tamamında aynı; 41:45 başlangıcına kadar doğrulanmış satır eklendi. |

2:25'in üretim MP3 SHA-256 değeri `632367bdf34316591fec17b03940073ce3a712b54ee436c22a448c40a4799fe6`, 41:44'ün değeri `335d74a6d1d0c6614967879605129623c20c08334d9edaefd4956e42f4cad028`. 3, 4, 5. sûrelerdeki üretim MP3 SHA-256 değerleri sırasıyla `7a52d1efb56e31d8c84436aec39cbeebde8498dfa43acaf2c082c7c145153614`, `60adc3638bc3cdf6dbfcf110ab1102f810794ea21e74f3764cd159b3f13d122d`, `16fad03b000d69492da95e9f970f220ae097a6693815917924b43f1730ae8cdb`.

Üretim onarımlarından sonra başlangıçtaki 22 âyet / 54 eksik kelime konumundan 13 âyet / 21 konum doğrulandı; 9 âyet / 33 konum kapalı kaldı. 3, 4 ve 5. sûrelerin genel zaman karantinası bu turda değiştirilmedi. Yerel testler: `node --test tests/sudais-exact-qdc-small-gaps.test.mjs tests/sudais-gap-overrides.test.mjs` ve `npm test` (202 geçti, 2 ortam atlaması).
