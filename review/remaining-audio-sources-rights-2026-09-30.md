# Kalan ses istisnaları: kaynak kimliği ve kullanım hakkı

30 Eylül 2026 incelemesi. Bu belge araştırmadır; hiçbir ses veya zaman varlığını üretime almaz.

## Teknik sonuç

Südeys 3, 4, 5, 28 ve 29. sûrelerde özgün QDC sûre MP3'ü elde. QUL'un 3/4/28/29 sûre kayıtları aynı icraya yakın veya PCM düzeyinde eşleşen bir zaman kaynağı sunuyor; 3:160 ve 4:143 dahil karşılaştırmalarda kayma 0 ms ve korelasyon yaklaşık 0,9996–0,9999. Ancak QUL 3/4'te dokuz âyetin kelime etiketi sıra dışı, QUL âyetler arası sabit 200 ms aralık gerçek durak kanıtı değil. 28/29 ve 5 için de daha önceki sınır denetimleri, doğrudan toplu aktarım yerine âyet bazında sınır doğrulaması gerektiriyor. İlgili ham kanıtlar `sudais-qul-qdc-restoration-decision-2026-09-30.md`, `sudais-six-quarantine-source-followup-2026-09-30.md`, `sudais-qul-28-29-structure.json` ve `sudais-qdc-align/` içindedir.

QUD v3.2.0 yayımlanmış hizalı katalogda bu Südeys QDC kaydı yok. Canlı ses kataloğunun QDC Südeys MP3'ünü tanıması, o kayıt için yayımlanmış kelime/fonem zamanları bulunduğu anlamına gelmiyor. Yerel QUD Base/Large adayları altı zor âyette kelime konumlarını üretebiliyor, fakat 3:160, 4:143, 5:5, 5:46 ve 5:82'nin son/ara sınırlarında gerçek sessizlik ve son fonem güvenliği henüz doğrulanmadı. 5:82'de önceki sağlayıcı aralığı âyetin başını erken alıp sonunu kesiyor; doğrudan kullanılmamalı.

Hânî 1:1 için özgün QDC MP3 ile EveryAyah 192/64 kbps âyet klipleri aynı icra (192 kbps'de yüksek enerjili pencerelerde 0,99984–0,99989 korelasyon) fakat yeni kelime saati sağlamıyor. QDC yalnız 2. kelime segmentini veriyor; QUD v3.2.0 hizalı kaydı bu âyeti dışarıda bırakıyor; cpfair 2016 ilk iki kelimeyi birleştiriyor. Dolayısıyla dört kelimelik sınır dizisini bu üç kaynaktan güvenilir biçimde çıkarmak mümkün değil. Kanıt: `hani-1-1-source-audit.json` ve `probe-hani-1-1-sources.mjs`.

## Hak ve atıf kapısı

* [QUD'nin kendi bildirimi](https://github.com/QUD-Technologies/quranic-universal-audio/blob/main/NOTICE.md) CC BY 4.0'ın kendi zaman/segmentasyon/katalog katkılarına uygulandığını, kıraat kayıtlarını yeniden lisanslamadığını açıkça söylüyor. QUD zamanları kullanılacaksa sürüm ve kaynak atfı gerekir; sesin hakkı ayrıca ele alınır.
* [QUL SSS](https://qul.tarteel.ai/faq) kaynakların hak durumunun ayrı ayrı değiştiğini ve her kaynağın lisansını incelemeyi söylüyor. Burada incelenen Südeys kayıt/zaman kaynağı için özgül yeniden kullanım ve paketleme şartı doğrulanmadı. Sitenin iç `api/v1` yanıtının erişilebilir olması genel lisans sayılmaz.
* [QuranicAudio açıklaması](https://quranicaudio.com/about) MP3 indirmelerini kişisel kullanım için ücretsiz tanımlıyor ve ticari kullanımı sınırlandırıyor. Bu, QDC üzerinden erişilen aynı dosyanın üçüncü taraf uygulamada dağıtımı için otomatik izin olarak yorumlanamaz.
* [Quran Foundation geliştirici şartları](https://api-docs.quran.com/legal/developer-terms/) API içeriklerinin uygulama içinde gösterimini koşullu olarak ayırıyor; ham ses/veri yeniden dağıtımı ve uzun süreli saklama için ayrı şartlar var. [Connected Apps rehberi](https://api-docs.quran.com/docs/connected-apps/) Quran Foundation içeriğinde onaylı uç nokta veya yazılı lisans, dış içerikte doğrulanabilir hak ve doğru atıf istiyor. Bu yeni API şartlarının mevcut eski QDC CDN URL'sine hukuken otomatik uygulandığını varsaymıyorum; hak sahibinden veya sağlayıcıdan mevcut kullanım biçimine özgü yazılı açıklık alınmalı.

## Üretime alınabilir yol

Şu anda **yeni bir kaynak/timing topluca üretime alınmaya hazır değil**. QUL zamanlarını yalnız araştırma adayı olarak tutun. Her karantina âyetinde özgün QDC MP3 SHA'sını sabitleyip tam çözülmüş PCM üzerinde hedef ve komşu âyetleri, tekrarlanan kelimeleri, önerilen her iç kesimin iki tarafını ve tam âyet sonunu ayrı doğrulayın. Sessizlik ve iki taraflı işitsel sınır kanıtı olmayan yerde küçük parça/kelime seçimi açılmasın; tam âyet veya doğrulanmış başka hoca gösterilsin. Hânî 1:1 için tam âyet oynatma korunabilir; kelime seçimi güvenilir dört kelime zamanı elde edilene kadar kapalı kalmalı. Ayrıca veri ve ses sahibinin ilgili kullanım/atıf koşulu yazılı biçimde netleşmeden QUL veya yeni ses varlığını paketlemeyin. Bu bir lisans ihlali tespiti değil; mevcut kanıtın izin vermediği çıkarımı belirtir.

## 30 Eylül kaynak yeniden kontrolü

[QUL Südeys sûre kaynağı 407](https://qul.tarteel.ai/resources/recitation/407) sayfası yine iç `data-recitation=3` kaydına; [âyet klibi kaynağı 116](https://qul.tarteel.ai/resources/recitation/116) ise `data-recitation=16` kaydına işaret ediyor. Bu ayrı kaynakların özgül ses/timing lisansı sayfalarda belirtilmiyor; [QUL SSS](https://qul.tarteel.ai/faq) her kaynağın koşullarını ayrıca incelemeyi söylüyor ve resmî API bulunmadığını belirtiyor. [QUD v3.2.0](https://github.com/QUD-Technologies/quranic-universal-audio/releases/tag/v3.2.0) yayımlanmış varlık adlarında Südeys hizalı paketi yok. Bu yeniden kontrol, korumayı kaldıracak yeni sürüm sabitli ve kullanım koşulu açık kaynak bulmadı. Yerel test sunucusu yeniden açıldı; `127.0.0.1:4173/version.json` v288, canlı alan adı v276 döndürüyor. Açık tarayıcı sekmesinin yenilenmesi yerel testi günceller; Netlify'ya dağıtım yapılmadı.
