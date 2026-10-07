# Elifa Mushaf inceleme sonucu — 27 Eylül 2026

**Durum:** Ses bölme düzeltmesi ve ek teknik düzeltmeler hazır; yerel testler geçti. Canlı siteye yüklenmedi. Bu rapor bütün kıraatlerin dinlenerek veya uzman mushaf tashihiyle onaylandığı anlamına gelmez. “Her açıdan sıfır hata” onayı verilmemiştir.

## Tespit edilen ve düzeltilen sorunlar

### 1. Nisâ 12, Ebû Bekir eş-Şâtırî: son 1,297 saniye

Nisâ'nın üçüncü sayfası, standart sayfa 79 üzerindeki 12–14. âyetlerle test edildi. 12. âyet için son kelimenin zamanlama bitişi **414.755 ms**, âyetin kaynak bitişi **416.052 ms**. Eski kod son kelime bitişini esas alıyordu; buna erken kesim ve ses azaltma da ekleniyordu. Kaydın bu son aralığında ses enerjisi bulunduğu doğrulandı.

Son parça artık kaynak âyet bitişine kadar devam eder. Otomatik bölmede eski negatif kesim ayarı son kelimeyi kısaltmaz. Birikimli 1+2 tekrar ve seçili parça aralığı da aynı bitiş hesabını kullanır. Parçalara uygulanan ses azaltma 5 ms'ye indirildi.

### 2. Kaynak kelime zamanlamalarındaki tutarsızlıklar

Aynı kayıtta bazı kelime numaraları tekrar ediyor veya yanlış konuma bağlanıyor. Yanlış etiket üzerinden her durakta bölmek sesin atlanmasına veya yanlış parçaya taşınmasına neden olabiliyordu. Bütün segment oluşumları değerlendirilerek çelişen sınırlar birleştirildi. Kelime numaraları tahmin edilip yeniden etiketlenmedi.

Nisâ 12 / Şâtırî örneğinde 18 aday parça yerine **9 parça** oluşur; ikinci parça 44 kelimedir. Ekranda birleştirme açıklaması gösterilir. Güvenilir bölme kurulamayan âyetlerde âyet bütünüyle okunur. Bu bilinçli davranış, bazı uzun âyetlerde küçük parça sayısını azaltır; başka hoca seçmek mümkün kalır.

Uzun surelerde ayrı âyet MP3'üne sure zamanlamaları uygulanması kaldırıldı: bölme, zamanlamanın ait olduğu sure kaydını kullanır. Hoca değişiminde parçalar yeniden hesaplanır. Durdurulan veya daha yeni bir seçimle geçersizleşen yükleme sonradan kendiliğinden çalmaya başlamaz. Hoca yüklenirken parça düğmelerine basılması yüklemeyi iptal etmez.

### 3. Sayfa numaraları

Quran Foundation'ın 604 sayfalık mushaf referansıyla 6.236 âyet karşılaştırıldı. **56 eski sayfa eşlemesi düzeltildi**; örneğin Mâide 77: 120 → 121, En'âm 131: 145 → 144. Düzeltmeler ayrı bir sayfa tablosundadır. Gömülü Arapça metin veri kümeleri aynı kaldı. Yeniden karşılaştırmada **6.236 / 6.236 eşleşme** var.

### 4. Çevrimdışı indirmeler

Eski uygulama ve service worker temizliği bütün Cache Storage depolarını silebiliyordu. Artık yalnızca eski `elifa-mushaf-*` uygulama önbellekleri temizlenir; `elifa-audio-v1` ses indirmeleri ve diğer depolar korunur. Tarayıcıda indirilmiş İhlâs kaydı yenilemeden sonra kaldı ve internet kapalıyken oynatıldı.

## Doğrulama kapsamı

| Kontrol | Sonuç |
|---|---|
| Yerel otomatik testler | 32 geçti, 0 başarısız |
| Build | Başarılı; `dist/` üretildi |
| Sure / âyet yapısı | 114 sure, 6.236 âyet; eksik, boş veya sıra hatası bulunmadı |
| Türk ve uluslararası Latin veri kümeleri | Her birinde 6.236 dolu kayıt; bu yapısal kontroldür, telaffuz onayı değildir |
| Ses zamanlama kaynakları | 11 hoca × 114 sure = 1.254 kayıt, 68.596 âyet kaydı |
| Türk ve Medine görünümüyle ses denetimi | 137.192 âyet/görünüm örneği |
| Tekli ve birikimli oynatma adımları | 488.642 adım; uygulanan sınır ve kapsam kurallarında 0 hata |
| Güvenli bölme bulunamayıp tam âyete dönülen örnekler | 8.818 âyet/görünüm örneği |
| Çelişen sınırları birleştirilen örnekler | 5.089 âyet/görünüm örneği |
| Sayfa referansı | 6.236 eşleşme, 0 kalan farklılık |
| Arapça metinlerin orijinal pakete göre bütünlüğü | Her iki veri kümesinin SHA-256 kontrolü geçti |
| Netlify fonksiyonları | JavaScript sözdizimi kontrolü geçti; canlı hizmet testi yapılmadı |

Zamanlama taraması; bütün kelimelerin parçalarda bulunmasını, son segmentin kesilmemesini, sonraki kelime sınırının aşılmamasını ve oynatılabilir aralıkları denetler. Kaynak zamanlamanın sesle gerçekten örtüştüğünü bütün kayıtları dinleyerek ispatlamaz. Tam âyet geri dönüşünde kaynak âyet aralığı esas alınır.

### Gerçek tarayıcı kontrolleri

Chromium tabanlı yerel önizlemede:

- Nisâ 12 son parçası 1×, 0,75× ve 1,5× hızlarda hedef bitişe ulaştı. HTMLAudio duruş farkları sırasıyla yaklaşık 7,2 / 4,4 / 19,6 ms geç gerçekleşti. Bu motor örnek düzeyinde kesinlik sağlamaz.
- İhlâs 4, Web Audio motorunda 1,5× hız, iki tekrar ve duraklat/devam akışında planlanan bitişe ulaştı.
- Hoca değişiminde İhlâs 4 parça zamanları Afâsî'den Şâtırî'ye yenilendi.
- İndirilen İhlâs kaydı yenilemeden sonra korundu; internet kapalıyken ses buffer'ı yüklendi ve oynatma başladı.
- Nisâ 12 bölme görünümünde 390 × 844 genişlik/yükseklik kontrolü yapıldı; yatay taşma bulunmadı. Bu, fiziksel telefon testi değildir.

## Metin doğruluğu: sonuçlar ve açık kalan inceleme

### Medine / Uthmanî

Quran Foundation referansıyla 6.236 âyet karşılaştırıldı. 2.635 âyet birebir aynı; boşluk, yön karakterleri, tatvil ve betikte açıkça belirtilen durak/secde/küçük mîm işaretleri normalleştirilince **6.236 âyet eşleşiyor**. Normal harekeler ve küçük vav/ye işaretleri korunmuştur. Bu sonuç, kaldırılan işaretlerin her birinin doğruluğunun ayrıca onaylandığı anlamına gelmez.

### Türk mushafı / Diyanet

Diyanet'in 0–604 API sayfa kimliklerinden 6.236 âyet alındı; eksik veya mükerrer âyet bulunmadı. Açıkça tanımlanan sınırlı Unicode ve yazım normalleştirmesinden sonra **4.895 eşleşme, 1.341 farklılık** kaldı. Örnekler durak işareti kodları, tenvin/şedde sıralaması ve hat kodlamalarını içeriyor. Bütün farklar tek tek ilmî olarak çözümlenmedi; otomatik olarak değiştirilmedi.

Hareke ve diğer işaretleri kaldıran, yalnızca teşhis amaçlı ikinci karşılaştırmada 6.234 eşleşme ve iki farklı kodlama kalır:

| Âyet | Uygulamadaki ilgili ifade | Diyanet referansı |
|---|---|---|
| A'râf 7:196 | `وَلِـِّيَ` | `وَلِيِّىَ` |
| Fetih 48:5 | `سَيِّـَٔاتِهِمْ` | `سَیِّئَاتِهِمْ` |

Bunlar yâ/hemze taşıyıcısı ve hat gösterimi bakımından ayrıca incelenmelidir. İşaretleri kaldırarak eşleşme elde etmek doğru hareke veya doğru telaffuz garantisi vermez. Ayrıntılı liste `docs/diyanet-text-differences.json` dosyasındadır. Türk mushafının “tam tashih edildiği” söylenemez.

## Diğer açık konular

- Mealler, tefsirler ve Latin okunuşların anlam/telaffuz doğruluğu baştan sona uzman incelemesinden geçirilmedi. Bunlar için sıfır hata onayı yoktur.
- 68.596 ses kaydının tamamı dinlenmedi. Kaynak servisin hatalı ama kendi içinde tutarlı zamanlaması otomatik testten geçebilir. Fiziksel iOS/Android, arka planda çalma ve zayıf bağlantı koşulları ayrıca kabul testi gerektirir.
- Eski elle kelime seçimi ve genel okuma modlarının kesim politikası otomatik âyet bölme politikasından ayrıdır; tam ses matrisi otomatik bölme için geçerlidir.
- Birlikte sunucu kodunda okuma–değiştirme–yazma akışı var. Eşzamanlı cüz alma, zikir ekleme veya anket oylamasında yarış riski bulunuyor. Bu statik inceleme bulgusudur; canlı veriye yük testi uygulanmadı ve bu pakette veri mimarisi değiştirilmedi.
- Birlikte özelliği mevcut tasarımda katılım kodunu bilen kişilerin işlem yapmasına izin veriyor; kişisel hesap/sahiplik doğrulaması yok. Yönetici işlemleri ayrı anahtarla korunuyor. Canlı yönetici, bildirim, anket ve otomatik temizlik işlemleri denenmedi.
- Netlify üretim ayarları, alan adı, mevcut Blobs verileri ve yetkilendirme bu yerel paket üzerinden doğrulanamaz. Yayın öncesi mevcut sitede önizleme doğrulaması yapılmalı.

## Teslim ve yeniden üretme

Kaynak paket `artifacts/elifa-mushaf-v225-source.zip`; kurulum ve Netlify ayarları kökteki README'dedir. Paket tüm uygulama dosyalarını, fonksiyonları, testleri, referans örneklerini ve raporu içerir. Eski deneme HTML'leri dağıtıma dahil edilmez. `npm run build` testler geçmeden çıktı üretmez.

Otomatik ses raporu: `docs/full-validation.json`. Sayfa raporu: `docs/page-audit.json`. Ham referansların tam yerel kopyaları `test-results/` altında tutulur; ZIP'e tüm ses metadatası dahil edilmemiştir. Denetim betikleri veriyi yeniden indirebilir.

Kaynaklar: [Quran Foundation Uthmanî API](https://api-docs.quran.com/docs/content_apis_versioned/4.0.0/quran-verses-uthmani/), [sure bazında âyet ve sayfa API](https://api-docs.quran.com/docs/content_apis_versioned/4.0.0/verses-by-chapter-number/), [Diyanet Nisâ 12–14](https://kuran.diyanet.gov.tr/mushaf/kuran-tefsir-1/nisa-suresi-4/ayet-12/kuran-yolu-meali-5), [QuranCDN Şâtırî/Nisâ zamanlamaları](https://api.qurancdn.com/api/qdc/audio/reciters/4/audio_files?chapter=4&segments=true).
