# Südeys: kalan sekiz bölme istisnası (28 Eylül 2026)

Bu denetim yalnız inceleme içindir. `index.html`, üretim ses verisi ve yayındaki oynatma değiştirilmedi. Sekiz âyetten **hiçbiri** şu anda güvenle sekiz kelimeyi aşmayan parçalara kapatılamıyor. Ölçümlerin özeti [`review/sudais-eight-exceptions-audit.json`](../review/sudais-eight-exceptions-audit.json) dosyasındadır.

## Kaynağın aynı ses olduğunun kontrolü

[QUL Südeys sûre kaydı](https://qul.tarteel.ai/resources/recitation/407), mevcut [QuranCDN](https://quranicaudio.com/quran/7) kaydına karşı her hedefte üç ayrı birer saniyelik PCM penceresinde karşılaştırıldı. Her pencerenin en yüksek korelasyonu aşağıdadır. Tek bir yüksek değer aynı kayıt sayılmadı.

| Âyet | Üç korelasyon | Sonuç |
| --- | --- | --- |
| 24:35 | 0,866 / 0,950 / 0,499 | İlk bölümler benziyor; son bölüm kaynak aktarımını doğrulamıyor. |
| 3:160 | 0,114 / 0,176 / 0,364 | Aynı kayıt kanıtlanmadı. |
| 39:54 | **0,998 / 0,998 / 0,998** | Bu âyette aynı ses ve yaklaşık 0 ms zaman farkı doğrulandı. |
| 4:134 | 0,090 / 0,430 / 0,105 | Aynı kayıt kanıtlanmadı. |
| 4:143 | 0,241 / 0,121 / 0,225 | Aynı kayıt kanıtlanmadı. |
| 5:5 | 0,103 / 0,376 / 0,183 | Aynı kayıt kanıtlanmadı. |
| 5:46 | 0,060 / 0,520 / 0,194 | Aynı kayıt kanıtlanmadı. |
| 5:82 | 0,189 / 0,280 / 0,267 | Aynı kayıt kanıtlanmadı. |

39:54'ün QuranCDN verisinde 13 kelimeye karşı yalnız bir zaman satırı var. QUL aynı ses üzerinde **1, 2, 3, 4, 5, 4, 5, 6…13** okunma dizisini bildiriyor: 4–5 tekrar ediliyor. QuranCDN PCM'sinde 799718 ms merkezli yaklaşık 1649 ms çok düşük enerjili bir iç aralık ölçüldü. Bu aralık tekrarın arasında; ilk 4–5 grubunu hangi kartta tutacağı belirlenmeden kesim uygulamak, kullanıcıya gösterilen kelimeler ile duyulan tekrarları ayırır. Kalan akışta sekiz-kelime hedefini kesin karşılayacak ikinci sessiz sınır da doğrulanmadı. Dolayısıyla güçlü aynı-kayıt eşleşmesi bile âyeti henüz kapatmıyor.

4:134'te %20 konuşma medyanı eşiğinde 80 ms iç sessizlik yok. 5:46'da 1086141 ms çevresinde 309 ms, 5:82'de 1856072 ve 1867681 ms çevresinde 234 ve 165 ms düşük enerji var. Bu iki âyette sağlayıcı kelime konumları atlıyor ve tekrar ediyor; ses aralığı ile kelime kimliği kesin eşleşmedi. Tekil duraklar ayrıca sekiz-kelimeyi aşmayan tam bir bölümleme sağlamıyor. 24:35 için önceki [WAV aday incelemesi](SES-SUDEYS-AKUSTIK-INCELEME.md) geçerlidir; kesimler hâlâ dinleme onayı bekliyor. 3:160, 4:143 ve 5:5'te sûre kaydı âyet-sonu verisi çelişkili olduğu için iç duraklar tam âyet oynatımını güvenli yapmıyor.

Ek kapanış denetiminde 24:35 için **QUL sûre kaydından ayrı olarak** EveryAyah 64 kbps âyet kaydı, QuranCDN üretim MP3'üyle âyet boyunca on bağımsız, yüksek enerjili pencerede tekrar karşılaştırıldı. Korelasyonlar 0,875–0,944, kayma 2493–2506 ms; ayrıntılar `test-results/sudais-24-35-decile-match.json` dosyasında. Bu aynı icrayı güçlü biçimde destekliyor, fakat dört dinleme adayı 48 kelimeyi tümü sekiz kelime veya daha kısa gruplara ayırmıyor. 39:54'te tekrar sırasının kartlara dağılımı, 5:5'te âyet sonu ve 5:46'da atlanan/tekrarlanan etiketler de çözülemedi. Bu dört vakada üretime yeni kesim eklenmedi.

## Yeniden üretim ve izin sınırı

[`review/audit-sudais-source-match.mjs`](../review/audit-sudais-source-match.mjs) aynı kaynak URL'lerini tekrar çağırır; PCM eşleştirmesi için `src/split-audio.mjs` kullanır. 3, 4 ve 5. sûre QuranCDN MP3'leri önce `test-results/sudais-qdc-{3,4,5}.mp3` olarak yerel önbelleğe alınmalıdır; diğer sûreleri betik aralık isteğiyle okur. Ham durak taraması `test-results/analyze-sudais-pauses-v2.mjs`, sonuçları `test-results/sudais-pauses-v2.json` içindedir. `test-results/` sürüm kontrolü ve üretim paketi dışındadır.

[QUL kullanım kılavuzu](https://qul.tarteel.ai/docs/getting-started) kaynakları uygulamada kullanmayı örnekliyor, fakat [QUL SSS](https://qul.tarteel.ai/docs/faq) üretim kullanımı için depo ve veriye özgü lisansın ayrıca kontrol edilmesini istiyor. Deponun MIT lisansı içerik/ses haklarının açık lisansı olarak kabul edilmedi; sitenin bağlantı verdiği [Tarteel şartları](https://tarteel.ai/terms) de içerik yeniden kullanımını sınırlıyor. Bu nedenle QUL zamanları yalnız kaynak karşılaştırma ipucu olarak incelendi, üretim override'ı veya paketlenmiş QUL veri dosyası oluşturulmadı.
