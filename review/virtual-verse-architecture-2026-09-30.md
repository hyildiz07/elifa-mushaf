# Korumalı uzun âyetler için kaynak eşli sanal klip mimarisi

**Karar:** Ayrı bir âyet MP3'ü yüklemek veya QUL/Tarteel sesini uygulamaya kopyalamak gerekmiyor. Var olan Südeys QuranCDN/QDC sûre MP3'ünden istemci tarafında doğrulanmış bir zaman penceresi çözülebiliyor. Bu, **transport sorununu** çözer; 11 uzun/korumalı vakanın kelime ve son-hece kesimlerini kendiliğinden onaylamaz. Bu turda üretim oynatıcısı değiştirilmedi.

## Çalışan taşıma deneyi

[`probe-sudais-virtual-verse-5-82.mjs`](probe-sudais-virtual-verse-5-82.mjs), üretimin `prepareSelectedRange` ve SHA/prefix/suffix ile sabitlenmiş VBR indeksini kullanarak aynı QDC 5. sûre MP3'ünden 5:82 için **inceleme adayı** 1867803–1897033 ms penceresini çıkardı. 38326543 baytlık sûre dosyasından yalnız **561985 baytlık indeksli kaynak penceresi** okundu; ilk/son 64 KiB indeks kontrolü ayrıca yapıldı. Çevrimdışı indirilmiş Blob ile çözme yerel makinede yaklaşık 0,2 sn, canlı CDN Range ile yaklaşık 1,1 sn sürdü; bunlar tek makine/ağ gözlemidir, telefon garantisi değildir. Üç ayrı 1 sn PCM penceresi, sûrenin ilk baytından çözülmüş bağımsız referans WAV ile **0,999996–0,999998** korelasyon verdi. Ham sonuçlar [`local`](sudais-virtual-verse-5-82-local.json) ve [`remote`](sudais-virtual-verse-5-82-remote.json) dosyalarındadır.

Pencere uçları **oynatmaya onaylı değildir**. Bunlar QUD Base/Large model adaylarıdır; 5:82 son fonemi, 5:83 başlangıcı ve iç kesimler iki taraflı dinlenmedi. Bu deney, doğru kaynak MP3 içinden yalnız hedef aralığın hızlı ve örnekçe doğru çözülebildiğini kanıtlar. `prepareSelectedRange` çıktısını normal/tekrar/bölme için üretime bağlamak, bilinmeyen son sesi kesme riskini sürdürür.

## Üretim için önerilen sözleşme

Bir âyet yalnız aşağıdaki doğrulanmış alanlarla yeni `verifiedChapterVerse` manifestine girebilir:

1. `recordingUrl`, dosya uzunluğu ve sabit kaynak SHA-256; istemcinin mevcut VBR indeks doğrulaması aynı dosyayı görmezse adım açık hata ile durur.
2. Gerçek âyet başlangıcı/bitişi ve sonraki âyetin ilk ses sınırı. Son fonem, ara yankı ve sonraki ilk harf dinlenerek kaydedilir. Tek bir ASR/QUL âyet etiketi yeterli sayılmaz.
3. Kanonik kelime sayısı ile **okunma sırası** ayrı saklanır. Örneğin 5:82 için `1..23,23,24..26`, 5:46 için `1..24,24,25,26`; tekrarlı söyleniş hiçbir karttan düşmez veya yanlış karta taşınmaz.
4. Her kartın gösterdiği kelimeler, o kartın kapsadığı bütün ses söylenişleri ve başlangıç/bitiş kesimi. Her kesimin iki yanı dinlenir; sessizlik sanılan yüksek enerjili boşluklar veya sabit 30/50/200 ms veri kümesi boşlukları kabul edilmez. Sekiz kelime hedefi ancak bu kuralla mümkünse açılır; uzun güvenli kart, uydurma kısa karta tercih edilir.
5. Kip bazlı izinler: `wholeVerse`, `split`, `partialSelection`, `repeat`, `cumulative`, `offline`. Tam âyet onayı, rastgele kelime seçimini otomatik açmaz. Çevrimdışı kipte aynı indirilmiş sûre Blob'u ve aynı doğrulanmış indeks kullanılır.

Manifest kabul edilirse mevcut `sourceRanges`/`runPlan` yapısı, ayrı MP3 yerine **aynı kaynak kimliği + âyet içi aralıklar** ile çalışabilir. Böylece tekrar ve 1+2 planı her kartın aralığını yineleyebilir; ağdan tekrar 38 MB sûre çekilmez. Doğrulanmış pencere bir kez çözülüp ses tamponu kartlar arasında paylaşılır; başka sûreye/reciter'a geçiş ve Stop, bekleyen yüklemeyi iptal eder. Sağlayıcının hatalı `AD_.ay` aralıkları bu özel adımlarda kullanılmaz. Kesim doğrulaması başarısızsa uygulama yanlış âyeti çalmak yerine mevcut karantina uyarısını korur.

## Neden bugün üretime açılmıyor?

Kaynak kimliği artık dar teknik engel değil: QDC–QUL 3/4 eşleşmeleri ve doğrudan QDC 5 hizalamaları elde. **Engel, onaylı ses sınırı ve kelime/tekrar sahipliği.** 4:134 için QUL 14/14 kelimeyi, QUD de yaklaşık doğru âyeti bulsa da 7/8 sınırında bağımsız fonem onayı yok. 5:82 modelin uzun durak sandığı 9/10, 18/19 ve tekrarlanan 23 araları yüksek enerjili; ≤8 için gereken 7/14/20 araları sıfır model boşluklu. 5:46'nın dört önerilen kesiminden üçünde model boşluğu yok. 3:160, 4:143 ve 5:5'te âyet-sonu ile sonraki giriş sesle ayrılmadı. Diğer beş uzun vakanın da kendi kesim kanıtı eksik. [Altı Südeys vakanın denetimi](sudais-six-quarantine-source-followup-2026-09-30.md) ve [11 vaka envanteri](corpus-split-plan-audit-2026-09-30.md) ayrıntıları içerir.

Hak yönünden bağımsız EveryAyah veya QUL seslerini yeni klip olarak paketleme yolu doğrulanmadı. [QuranicAudio'nun kullanım açıklaması](https://quranicaudio.com/about) ücretsiz kişisel indirmeyi belirtip ticari kullanıma izin vermiyor; bu kayıtların kamuya açık uygulamada ayrıca dağıtılma izni varsayılmamalı. [QUL SSS](https://qul.tarteel.ai/faq) her kaynağın lisansına ayrıca bakılmasını istiyor. [QUD](https://github.com/QUD-Technologies/quranic-universal-audio#license) kendi zaman verisini CC BY 4.0 altında yayımlıyor, alttaki ses kayıtlarının mülkiyetini devretmiyor. Önerilen sanal klip aynı mevcut QDC URL'sinden istemcide üretildiği için yeni ses dosyası paketlemez; mevcut uygulamanın QDC kayıt kullanım iznini genişletilmiş saymaz. Üretim verisi için QUD kaynak/atıf koşulu ve kaydın kullanım koşulu ayrıca belgelenmelidir.
