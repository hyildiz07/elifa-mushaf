# Hüsarî Muallim 2:145 — yerel dinleme kararları

**Geçersiz kalan eski inceleme planı:** Bağımsız QUD³ hizalaması ve birebir MP3/PCM eşlemesi, kaydın 61. saniyeden sonrasının 2:145 tekrarı değil, dosyaya eklenmiş 2:146 ve 2:147 sesi olduğunu gösterdi. Aşağıdaki eski soru ve klip açıklamaları artık 2:145 kelime hizalaması için kullanılmamalı. Güncel kanıt: [husary-2145-resolution.md](./husary-2145-resolution.md).

Dokuz WAV yalnız `test-results/husary-2145-clips/` içinde bulunur ve Git tarafından yok sayılır. [QuranLab kaynak kaydı](https://huggingface.co/datasets/quranlab/quran-audio) EveryAyah sesini yalnız bağlantı olarak sunar; kendi CC BY lisansının ses dosyalarını kapsamadığını belirtir. Kayıt sahibinin yeniden dağıtım izni teyit edilmedi; klipleri depoya, Netlify'ye veya dış bir hizmete yüklemeyin. Kaynak: [EveryAyah 002145.mp3](https://everyayah.com/data/Husary_Muallim_128kbps/002145.mp3), SHA-256 `cc4640fa78a211b598a6e5f47880a5ff39112d3f8279d5260f860f1e1a1cad28`.

Klipler otomatik *inceleme penceresidir*, kelime kesimi değildir. Komşu pencereler yaklaşık bir saniye örtüşür. Atlanan 26–28 ve 98–101 saniye aralıkları PCM ölçümünde sessiz çıktı; üretimdeki ses aralığını eksiltme kararı olarak kullanılmamalı.

| Klip | Mutlak ses zamanı | Dinlemede gereken karar |
| --- | --- | --- |
| [01](../test-results/husary-2145-clips/01_000000-014000.wav) | 0–14,00 sn | Açılıştaki tam kelime dizisi, hoca/öğrenci sırası ve ilk tekrarın başladığı yer. |
| [02](../test-results/husary-2145-clips/02_013000-026000.wav) | 13–26,00 sn | Tekrarlanan ifadenin kanonik 1–32 aralığı ve bittiği tam ses. |
| [03](../test-results/husary-2145-clips/03_028000-043000.wav) | 28–43,00 sn | Sessizlik sonrası başlayan ifade ve sonraki tekrar/cevap. |
| [04](../test-results/husary-2145-clips/04_042000-058000.wav) | 42–58,00 sn | Duyulan her ifadeyi ayrı hoca/öğrenci ve kelime aralığıyla kaydet. |
| [05](../test-results/husary-2145-clips/05_057000-073000.wav) | 57–73,00 sn | Orta bölümde hangi kelimelerin gerçekten okunduğu ve tekrar başlangıçları. |
| [06](../test-results/husary-2145-clips/06_072000-087000.wav) | 72–87,00 sn | Öğretici tekrarların tam kanonik aralığı ve her tekrarın bitişi. |
| [07](../test-results/husary-2145-clips/07_086000-098000.wav) | 86–98,00 sn | Son büyük tekrarın ardından yeni ifadeye geçiş. |
| [08](../test-results/husary-2145-clips/08_101000-116000.wav) | 101–116,00 sn | Son ifadede 23–32. kelimelerin bütün duyulan oluşumları. |
| [09](../test-results/husary-2145-clips/09_115000-118073.wav) | 115–118,073 sn | Âyetin son kelimesi gerçekten tamamlanıyor mu ve son hece hangi milisaniyede bitiyor? |

En küçük işe yarar insan çıktısı: her **kesintisiz söylenmiş ifade** için `başlangıç_ms`, `bitiş_ms`, `ilk_kelime`, `son_kelime`, `konuşmacı`, `tekrar_sırası`, `emin_mi` alanları. Tek tek her kelimeyi işaretlemek şart değil; ancak 6 kelimeyi aşan bir ifadeyi ezber parçasına böleceksek o ifadede ayrıca duyularak onaylanmış iç sınırlar gerekir. Belirsiz ifade veya son hece varsa `emin_mi=false` kalmalı. Bütün 118,073 saniyelik kaydı bu ifadeler ve sessizliklerle kapsayan, her kanonik kelimeyi en az bir kez eksiksiz duyuran plan çıkmadan doğrulanmış bölme varlığı oluşturulamaz.

Klipler `node review/generate-husary-2145-clips.mjs` komutuyla aynı SHA-256'lı kayıttan yeniden üretilir. Betik kaynak hash'ini, süreyi ve pencereler arasında dışarıda kalan aralıkların sessizliğini denetler.
