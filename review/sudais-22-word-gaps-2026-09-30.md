# Südeys: 22 eksik kelime zamanı için kaynak denetimi

Yerel v277 verisinin `node scripts/verify-all-audio.mjs --reciter=3 --candidate-dir=assets/verified-audio` çıktısında **22 âyette 54 eksik veya sıfır uzunluklu konum** var. Denetim, uygulamanın kullandığı QuranCDN bölüm MP3 URL'lerini ve mevcut zaman verilerini esas aldı. Tüm 22 kayıtta sağlayıcı âyet bitişi sonraki âyet başlangıcıyla aynı sayısal zamana denk geliyor; bu eşitlik sessizlik ya da güvenli kelime kesimi kanıtı değil.

| Âyet | Eksik konumlar |
| --- | --- |
| 2:25 | 22 |
| 2:61 | 30–31 |
| 2:90 | 3–6 |
| 2:282 | 56 |
| 3:37 | 10 |
| 4:95 | 15 |
| 4:134 | 14 |
| 4:146 | 6 |
| 5:46 | 13–18 |
| 5:82 | 9, 18–23 |
| 5:91 | 5–6 |
| 5:103 | 1–2 |
| 7:5 | 4–5 |
| 16:35 | 9–10 |
| 16:45 | 7–8 |
| 22:23 | 20 |
| 39:54 | 2–13 |
| 39:72 | 1 |
| 41:44 | 17 |
| 42:52 | 17 |
| 45:12 | 9 |
| 73:4 | 4–5 |

## Yeni kaynak denetimi

QuranLab'ın Südeys âyet kayıtları 22 âyetin tamamında kanonik kelime pozisyonlarını dolduruyor. Bu zamanlar, farklı MP3 URL'si kullandığından doğrudan alınmadı. Her adayın sesi uygulamadaki QuranCDN sûre MP3'üne, âyetin baş/orta/sonundan üç ayrı yüksek enerjili PCM penceresinde eşlendi. Ardından sonraki âyet klibinin başlangıcı aynı kaynak üzerinde bağımsız eşlendi. Aşağıdaki on birinde üç pencere korelasyonu en az 0,70, ortak ofset yayılımı en çok 40 ms, rakip eşleşme 0,35'in altında, kelimeler eksiksiz ve sıralı, bütün zamanlar mevcut âyet aralığında ve sonraki âyet klibi başlangıcı sağlayıcı sınırına en çok 75 ms uzaklıkta. 2:90 ile 45:12'nin 192 kbps adayları ikinci kaynak turunda bu kapıyı geçti:

| Onarılan âyetler | Doldurulan konum sayısı |
| --- | ---: |
| 2:61, 2:90, 2:282, 7:5, 16:35, 16:45, 22:23, 39:72, 42:52, 45:12, 73:4 | **19** |

Bu on bir tam âyet zaman dizisi `assets/audio-timing-overrides-r3-r5.json` içine kaydedildi. Kaynak URL'leri, üç pencere korelasyonu/ofsetleri, sonraki âyet klibi ve başlangıç doğrulaması her satırın `verification` kaydındadır. Üretim MP3 URL'si, Arapça metin anahtarı, tam konum dizisi ve âyet/sonraki âyet sınırı oynatıcıdaki kabul kapısından geçti. Yerel tüm kaynak doğrulayıcısı **11 âyette 35 eksik konum** kaldığını ve sıfır yapısal oynatma planı hatası buldu. Bu akustik eşleşme, her kelime foneminin uzman dinlemesiyle sertifikalandığı anlamına gelmez.

## Kalan 11 âyet

Sabitlenmiş QUA v3.2.0 hizalı kataloğunda Südeys kaydı bulunmuyor (`test-results/qua-source-catalog.json` yerel kopyası; `review/sudais-qul-qdc-restoration-decision-2026-09-30.md`). 3 ve 4. sûrelerin sağlayıcı âyet saatleri kaymış; QUL adaylarında ayrıca bozuk kelime sırası etiketleri var. 5. sûrede QDC saatleri kaymış; 5:46 ve 5:82'nin gerçek konumları için QUD inceleme adayları var, ancak güvenli kelime kesimleri doğrulanmadı (`review/sudais-restoration-prototype-2026-09-30.md`). 39:54'te 4 ve 5. kelimeler tekrar okunuyor; kanonik metindeki tekil konumlara otomatik zaman doldurmak tekrarı yanlış sahiplenir (`review/sudais-39-54-qdc-review.md`). Diğer kalanlar 2:25 ve 41:44; QuranLab'ın 64 ve 192 kbps ayet kliplerinde üç ayrı pencerenin tümü güçlü kanıt eşiğini geçmedi. 4:134, 5:46, 5:82 ve 39:54 için ikinci kaynak denetimi `review/sudais-second-source-pass-2026-09-30.md` dosyasındadır.

Kalan âyetlere kaynak eşleşmesi, metin konumları, âyet aralığı ve sonraki âyet sınırı birlikte kanıtlanmadan üretim override'ı eklenmedi. Eksik kelime seçimi mevcut uygulamada açık uyarıyla durduruluyor; kullanıcıya eksik bir ses parçası tam seçilmiş gibi çalınmıyor. Kapıyı açmak için her özgün bölüm MP3'ünden tam çözüm, kanonik sıra/tekrar hizalaması, hedef kelimelerin iki uçlu dinleme kontrolü ve komşu âyet doğrulaması gerekiyor. Bu rapor işitsel onay yerine geçmez.
