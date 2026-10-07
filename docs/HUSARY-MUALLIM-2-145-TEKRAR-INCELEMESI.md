# Hüsarî Muallim 2:145 — tekrarların inceleme durumu

Bu belge **üretim zamanlaması değildir**. Tam 118,073 saniyelik EveryAyah âyet MP3'ünün QF sûre MP3'ünde bulunduğu bayt düzeyinde doğrulandı. 28 Eylül 2026'da indirilen âyet dosyası 1.890.314 bayttı ve SHA-256 değeri `cc4640fa78a211b598a6e5f47880a5ff39112d3f8279d5260f860f1e1a1cad28` idi. İnceleme yalnız bu dosya/içerik için geçerlidir. Aynı hocanın başka icrasına zaman aktarılmamalı.

Kaynaklar: [EveryAyah âyet sesi](https://everyayah.com/data/Husary_Muallim_128kbps/002145.mp3), [Quran Foundation sûre zamanı](https://api.quran.com/api/v4/chapter_recitations/12/2?segments=true), [cpfair quran-align ham yayını](https://github.com/cpfair/quran-align/releases/tag/release-2016-11-24). Yerel dinleme sayfası: [husary-muallim-2-145-review.html](husary-muallim-2-145-review.html). Sayısal karşılaştırma: [husary-2145-source-map.json](../review/husary-2145-source-map.json); `status: unverified-review-only` kasıtlıdır.

| Kaynak | Gözlenen sonuç | Neden parça sınırı olamaz |
| --- | --- | --- |
| QF | 1–9, sonra 5–14, sonra 7–20, ardından 20–22 iki kez ve 28–29 etiketleri. 23–27 ve 30–32 hiç yok. Son etiket 115,405 sn. | Büyük tekrar aralıkları birkaç kelimeye yüklenmiş; son 2,668 sn etiketsiz. |
| cpfair | 32 kelimeyi 60,750 sn'de bitiriyor; `insertions=36`, `transpositions=1`. | Kalan 57,323 sn konuşma/tekrar kelimeye bağlanmıyor. |
| Akustik sessizlik taraması | Kaydı 20 ms RMS pencerelerinde sessiz aralık adaylarına ayırıyor. | Sessizlik kelimenin veya tekrarın nerede başladığını söylemez; sözcük kimliği ve konuşmacı ayrıca dinlenmeli. |

QF'nin otomatik sıra değişimleri özellikle şu pencerelerde incelenmeli: **11,970–35,700 sn (5–14), 35,721–60,370 sn (7–20), 60,391–80,890 ve 80,911–97,350 sn (20–22 olarak etiketlenen iki geniş aralık), 97,370–118,073 sn (28–29 ve etiketsiz son)**. Bu aralıklardaki duyulan sözler, tablodaki etiketler doğru varsayılmadan yazılmalı. 23–27 ve 30–32. kelimelerin gerçek tüm oluşumları özellikle bulunmalı.

[quran-timing-helper](https://github.com/quraniio/quran-timing-helper) tekrar tespiti ve CTC zorunlu hizalama içeriyor; aynı MP3 üzerinde yeni adaylar önerebilir. Ancak zorunlu hizalama, verilen metni sesin içine yerleştirir: tekrar sayısının, öğrenci sesinin ve her son hecenin gerçekten doğrulandığı anlamına gelmez. Bu nedenle böyle bir çıktı da doğrudan oynatıcı verisi olamaz.

Güvenli bölme için bir insan incelemecinin, tercihen ikinci bir incelemeciyle karşılıklı kontrol ederek, aynı MP3 üzerinde şunları işaretlemesi gerekiyor:

1. **118 saniyenin tamamı** için her duyulan kelimenin Kur’ân'daki 1–32 konumu, tekrar sıra numarası, başlangıç/bitiş milisaniyesi ve hoca/öğrenci sesi. Söz olmayan aralıklar ayrıca sessizlik olarak işaretlenmeli. Atlanan, belirsiz veya birbiriyle çelişen aralıklar `unverified` kalmalı.
2. Her aday bölme sınırının yaklaşık bir saniye öncesi ve sonrası normal ve yavaş hızda dinlenmeli. Önceki kelimenin son sesi ile sonraki kelimenin ilk sesi eksiksiz ayrılabiliyor mu kaydedilmeli. Nefes/sessizlik tek başına güvenli sınır kanıtı sayılmamalı.
3. Tekrarlar parça sınırını aşıyorsa, aynı parçada bütün oluşumların hangi ses aralıklarında bulunduğu ayrı ayrı işaretlenmeli; bu mümkün değilse parçalar birleştirilmeli. Ses aralıklarını birleştirerek çalmak, dosyanın duyulan içeriğini kaybetmemeli ve başka kelimeden yarım hece taşımamalı.
4. Son önerilen planın tüm parçaları art arda dinlenerek tam 118 saniyelik kayda karşı denetlenmeli. 32 kanonik kelimenin her biri en az bir kez eksiksiz duyulmalı; öğretici tekrarların korunup korunmayacağı açıkça kararlaştırılmalı. Aynı kayıt özeti, süre ve kaynak kimliği testte sabitlenmeli.

İnceleme sayfası `unverified` JSON dışa aktarır. Bu dosya ancak yukarıdaki konuşma dizisi ve sınırlar dinlenerek doğrulandığında ayrı bir üretim verisine dönüştürülebilir. Şimdiki uygulamada 2:145 tam âyet sesi çalınır; doğrulanmamış küçük parça veya kısmi kelime seçimi oynatılmaz.
