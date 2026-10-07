# Tam Kur’an bölme istisnaları: kaynak ve algoritma ayrımı

Bu rapor yalnız [`test-results/full-validation.json`](../test-results/full-validation.json) dosyasının **28 Eylül 2026 17:08** anlık sonucunu sınıflandırır. `index.html` daha sonra değiştiği için sayılar yeniden test yapılana kadar güncel üretim durumunun iddiası değildir. Yeniden üretilebilir sınıflandırma [`review/analyze-full-validation-exceptions.mjs`](../review/analyze-full-validation-exceptions.mjs), çıktı [`review/full-quran-split-exception-classification.json`](../review/full-quran-split-exception-classification.json). Üretim koduna veya zaman varlıklarına dokunulmadı.

## Sayıların anlamı

| Ölçü | Sonuç | Birim |
| --- | ---: | --- |
| Yapısal doğrulama hatası | 0 | 137.192 hoca-âyet-yazım modu üzerinde metin bölümü ve oynatma aralığı denetimi |
| Medine yazımında bölme istisnası | 488 | Âyet-hoca çifti |
| Sekiz ve üzeri kelimelik tek parça | 264 | İki yazım modu birlikte; Medine’de 132, bunun 5’i tam 8 kelime |
| Sekiz kelimeyi aşan parça | 994 | İki yazım modu birlikte; Medine’de 497 parça / 483 âyet-hoca çifti |
| Hizalanmış veride sekiz kelimeyi aşan parça | 878 | İki yazım modu birlikte; diğer 116 parça fallback kaynaklı |

Bu nedenle **994, 994 ayrı âyet demek değildir**. `errorCount=0` da sesin kelimeyi kesmediğinin kanıtı değildir; test yalnız metin kapsamı ve hesaplanmış oynatma aralıklarını doğrular.

## Nedenler

488 Medine istisnasının 428’i genel zaman doğrulamasını geçiyor, 60’ı koruyucu fallback’a düşüyor. Hizalanmış 428 vakanın hepsinde en az bir kelime konumu eksik veya ses dizisinde tekrarlı konum var: 169’unda ikisi birlikte, 67’sinde yalnız eksik konum, 192’sinde yalnız tekrar. Tekrar etiketi bazen hocanın gerçekten bir ifadeyi yeniden okuması olabilir; tek başına metadata hatası sayılmamalı.

Uygulamanın kullandığı komşu kelime zamanları çakışmayan, her kartı **2–8 kelime** tutan ve âyeti en az iki karta ayıran koşulu ayrı denedim. Hizalanmış 428 istisnanın **0’ında** mevcut sınırlarla bu mümkün. Kâğıt üstünde bölünebilir görünen 56 vakanın **tamamı fallback** durumunda; bu sınırlar üst düzey âyet/kayıt çakışması veya geçersiz veri varken doğrudan çalınamaz. Dolayısıyla bu anlık raporda `splitChunkPositions` algoritmasının geçerli, yeterli sınırı atlayarak uzun parça bıraktığına dair doğrulanmış vaka yok.

**74 hizalı istisna**, tam 1…N konumları içeren, sıralı tekrarlı zaman satırı biçimini karşılıyor (2: 19; 4: 7; 6: 22; 7: 1; 9: 12; 97: 13). Uygulamadaki çoklu ses aralığı yolu yalnız kaynak kaydı ayrıca doğrulanmış ailelere açık; bu hocaların ham QuranCDN verilerinde kapalı. Bu bir **özellik/kanıt kapısıdır**, kanıtlanmış algoritma kusuru değil. Yetmiş dört vaka aynı icranın gerçekten tekrarlı okunduğu ve tüm sınırların akustik olarak doğru olduğu gösterilirse hedefli iyileştirme adayıdır. Yalnızca düzgün metadata şekli prod açmak için yetmez.

Fallback nedenleri iki yazım modu toplamında 114 âyet çakışması, 28 konum taşması, 10 boş segment ve 4 diğer durum. 60 Medine istisnasının her birine bu toplamdan tek tek neden atanmadı; neden dökümü tüm fallback âyetleri kapsar. Uzun parça üreten veri genellikle QuranCDN sûre MP3’ünün kelime etiketlerinden gelir. Ayrı 81 `sourceTailOverruns` ve 2852 terminal metadata çakışması sayısı **ses kesilmesi kanıtı değildir**; bitişi diğer âyete taşan etiket de olabilir.

| Hoca | Medine istisnası | Fallback | Eksik konum içeren | Tekrar konumu içeren |
| --- | ---: | ---: | ---: | ---: |
| Abdülbâsıt, murattal (2) | 171 | 44 | 105 | 96 |
| Mişârî el-Afâsî (7) | 144 | 2 | 55 | 142 |
| Ebû Bekir eş-Şâtırî (4) | 92 | 2 | 56 | 75 |
| Hüsarî, murattal (6) | 22 | 0 | 0 | 22 |
| M. Sıddîk el-Minşâvî (9) | 19 | 1 | 6 | 18 |
| Yâsir ed-Devserî (97) | 18 | 0 | 3 | 18 |
| Südeys (3) | 8 | 3 | 5 | 5 |
| Abdülbâsıt, mücevved (1) | 6 | 1 | 6 | 0 |
| Şureym (10) | 5 | 4 | 2 | 0 |
| Hânî er-Rifâî (5) | 2 | 2 | 0 | 1 |
| Hüsarî Muallim (12) | 1 | 1 | 0 | 0 |

İlk üç hoca **407/488 (%83,4)** istisnayı oluşturuyor. Bu bir algoritma ayarıyla topluca kapanmaz; kayıt başına güvenilir kelime/âyet sınırı ve gerçek tekrarlara uygun ses aralığı gerekir.

## Güvenli iş sırası

1. Önce Abdülbâsıt murattal, Afâsî ve Şâtırî için **aynı sûre MP3 icrasına ait**, kullanım izni belirli kelime zamanı kaynakları aranmalı. Her aktarım ayrı baş/orta/son PCM pencerelerinde sabit kaymayla, tam kanonik kelime kapsamıyla ve sonraki âyetin sesine taşmama koşuluyla doğrulanmalı. Farklı icranın zamanı asla kopyalanmamalı.
2. Tekrarlı konumlu âyetlerde tekrarı silmek yerine ses dizisinin tamamı korunmalı; özellikle 74 tam sıralı adayda gerçek ses tekrarları ve her kartın tekrar sahipliği iki taraflı dinlenerek onaylanmalı. Kanıtlanan kaynak ailesi için çoklu aralık yolu hedefli açılabilir. Eksik konumlar veya âyet-sonu çakışması varsa tahminî kesim yayımlanmamalı.
3. Fallback grubunda önce 114 âyet çakışması ve 28 konum taşmasının kaynağı denetlenmeli. 56 görünüşte bölünebilir vakanın ancak **tam âyet kaydı ve kelime sınırı birlikte** doğrulandığında fallback’tan çıkarılması uygun olur.
4. Her veri değişikliğinden sonra tam korpus testi yeniden çalıştırılmalı; hoca, âyet ve kart seviyesinde istisna sayısı karşılaştırılmalı. Ses tamamlığı için bağımsız örnek dinleme sürdürülmeli. Kesin sınırı olmayan âyetlerde uygulamanın mevcut güvenli uyarısı korunmalı ve doğrulanmış başka hoca seçimi açık olmalı.
