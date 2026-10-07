# Sûre metadata kuyruğu ile oynatılan kaynak ayrımı

`node scripts/verify-all-audio.mjs --candidate-dir=assets/verified-audio --report-file=test-results/full-validation-tail-classified.json` yeniden çalıştırıldı: 1.254 hoca–sûre dosyası, iki yazımda 137.192 âyet görünümü, **0 yapısal plan hatası**. Doğrulayıcı eski sûre metadata'sında son kelimenin âyet aralığını 300 ms'den fazla aştığı **11** satırı işaretliyor. Bu ham sayı oynatılan sesin 11 kez kesildiği anlamına gelmez.

| İşlem yolu | Adet | Âyetler |
| --- | ---: | --- |
| Doğrulanmış ayrı âyet kaydı | 8 | Hüsarî Muallim 3:127, 3:177, 4:9, 4:10, 4:11, 4:23, 43:32, 5:64 |
| Sûre zamanlaması güvenilmez diye kapalı | 3 | Südeys 3:160, 4:143, 5:5 |
| İşlem uygulanmadan açık kalan ham kuyruk bayrağı | **0** | — |

Hüsarî satırlarında `verifiedHusaryVerseKey` ile doğrulanan ayrı âyet kaynağı ve o kaynağın kendi zaman ekseni kullanılıyor; Südeys 3/4/5 sûreleri `audioTimingUnverified` kapısında duruyor. Doğrulayıcı artık her ham bayrağa `verified_alternate_verse`, `guarded_chapter` veya `none` etiketi ekliyor ve `sourceTailUnprotected` listesini ayrı yazıyor. Bu **metadata-bayrağı maruziyeti** sınıflamasıdır; sekiz ayrı kaydın her foneminin işitsel onaylandığını veya tüm Kur’an’da başka bitiş sorunu olmadığını kanıtlamaz.

Kalan uzun kart/bölme istisnaları ile son âyetin fiziksel MP3 kuyruğu ayrı inceleme konularıdır; [11 vaka kullanıcı etkisi](remaining-11-user-impact-2026-09-30.md) ve [son âyet kaynak karşılaştırması](final-verse-source-tail-comparison-2026-09-30.md) bunları açıklar. Üretim ses varlığı ve oynatma kodu bu turda değiştirilmedi; dağıtım yapılmadı.
