# Südeys QDC kaynak âyet uçları — 2026-09-30

Bu rapor üretim değişikliği değildir. Yerel `test-results/sudais-qdc-{3,4,5}.mp3` dosyalarının başlangıç/orta/son 64 KiB aralıkları 2026-09-30 tarihinde gerçek QuranCDN URL'leriyle bayt bayt eşleşti (`node review/verify-sudais-qdc-source-bytes.mjs`). PCM, her MP3'ün **ilk baytından itibaren ardışık decode** edilerek alındı (`node review/verify-sudais-qdc-full-decode.mjs` ve `node review/find-sudais-qdc-real-verses.mjs`); VBR seek veya varsayımsal ofset kullanılmadı. Aynı WAV'lar QUD Tibyan Large ve Base modelleriyle bağımsız olarak eşleştirildi. Her iki model aşağıdaki âyet kimliğinde ve yaklaşık 20 ms içinde aynı uçlarda birleşti.

| Âyet | Sağlayıcı metadata aralığı (ms) | Kaynak PCM'deki model aralığı (ms) | Sonraki âyetin model başlangıcı (ms) | Sonuç |
| --- | ---: | ---: | ---: | --- |
| 3:160 | 2610330–2622580 | **2658483–2677407** | 3:161 → 2677437 | Metadata bu konumda 3:156 sonu / 3:157 / 3:158 başını gösteriyor; aynı âyet değil. |
| 4:143 | 3041450–3054380 | **2966063–2980867** | 4:144 → 2980897 | Metadata bu konumda 4:147 sonu / 4:148 / 4:149 başını gösteriyor; aynı âyet değil. |
| 5:5 | 156770–166230 | **155137–192853** | 5:6 → 192883 | Metadata aralığı âyetin yaklaşık dörtte birinde bitiyor; son kelime etiketi 195385'e giderek 5:6 ile çakışıyor. |

Large ve Base ile ardışık ayetler de doğrulandı: 3:158 → 3:159 → 3:160 → 3:161, 4:140 → 4:141 → 4:142 → 4:143 → 4:144 → 4:145 → 4:146 → 4:147 → 4:148 ve 5:4 → 5:5 → 5:6. Tanınan Arapça ifadeler Mushaf referansındaki ilgili âyetlerle uyuşuyor. Ayrıntılı model yanıtları `test-results/review-sudais-qdc-verse-ends/*-real-search.json`, `*-real-base.json` ve `5-5-sequential.json` içindedir.

QUD oturumunun ayrı kelime zamanlama hizmetiyle inceleme adayı çıkarıldı (`review/sudais-qdc-word-candidates-2026-09-30.json`). 3:160 için 18/18, 4:143 için 16/16 konum birer kez sıralı; 5:5 için 43 benzersiz konumda 45 okuma satırı var, 24–25. kelimeler tekrarlanıyor. Bu otomatik zamanlar kaynak QDC PCM'sine aittir fakat henüz iki taraflı dinleme ile onaylanmamıştır.

**Uç güvenliği:** Model çıktısındaki 30 ms'lik âyet aralığı gerçek sessizlik anlamına gelmez. Aynı PCM'de 10 ms RMS taraması (`node review/audit-sudais-qdc-verse-boundaries.mjs`) üç uçta da güçlü sessiz aralık bulmadı: 3:160 sınırı yakınında en düşük 0.01394, 4:143'te 0.02686, 5:5'te 0.01046. Bunlar son kelime/yankı ile sonraki âyet girişini ayırmaya yetmez. Dolayısıyla tabloda verilen değerler **kaynakla eşleşen güçlü inceleme adaylarıdır**, otomatik üretim kesimi değildir. Her son kelime ve sonraki başlangıç iki taraflı dinlenerek doğrulanmalı; sınırdaki yankı ya da ses kaybı kaydedilmelidir.

Bu bulgu yalnız üç istisnayı değil, özellikle sûre 3 ve 4'ün komşu âyetlerinin metadata uyumunu da yeniden denetleme gereğini gösterir. Yanlış âyet sesini çalma riskine karşı bu sûrelerde sağlayıcı saatlerini topluca kaydırmak güvenli değildir; sapma sabit değildir ve ayrı doğrulama gerekir.
