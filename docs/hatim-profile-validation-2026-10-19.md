# Hatim, hesap ve çalışma akışları — v360

## Kapsam

- UID bazında cihaz çalışma alanları; misafir verisini otomatik taşımayan, çakışmaları seçtirerek birleştiren aktarım.
- Özel profil: görünen ad/takma ad, isteğe bağlı yaş veya doğum tarihi, isteğe bağlı cinsiyet. Hatimde yalnız kullanıcının katılım için seçtiği ad görünür.
- Hatim ana ekranı: Açık Hatimler, Benim Cüzlerim, Oluşturduklarım. Yeni toplu zikir oluşturma kaldırıldı; eski doğrudan bağlantılar ve kayıtlar korunur.
- Cüz sahipliği sunucuda doğrulanır; misafir anahtarı veya doğrulanmış hesap gerekir. Al, okudum, geri al, bırak; yönetici için açık durum düzeltme, erişim yenileme, rapor ve arşivleme.
- Katılım bağlantısı, özel yönetici bağlantısı ve kişisel cüz bağlantısı ayrıdır. Gizli bağlantı açılışında oturum geri yüklenmesi ve kayıp yanıtlar ele alınır.
- Cüz okuyucusundan geri dönüş aynı hatme döner. Hıfz ayarları mevcut çalışma aralığını korur; üç tekrar kontrolünün açıklaması ve uygulanabilirliği netleşti.
- Gizlilik açıklamaları gerçek profil, sahiplik ve arşivleme davranışıyla güncellendi; mevcut çeviri taslak statüsü korundu.

## Doğrulama

- Üretim build: 493 test, 490 başarılı, 0 başarısız; 3 emülatöre bağlı test normal koşuda atlandı.
- Son izole önizleme build (v359): 527 test, 524 başarılı, 0 başarısız; 3 emülatöre bağlı test önceki ayrı koşuyla doğrulandı.
- Ayrı gerçek yerel Firebase Auth/Firestore emülatör koşusu: 13/13 başarılı, 0 atlanan. Eşzamanlı cüz talebi, geçersiz eski kurtarma isteği, hesap bağlama/ayırma, profil revizyonu, yedek izolasyonu, yetki kuralları ve silme tekrarları dahil.
- Bağımsız hesap denetimi: başka sekmede çalışma alanı değişirken geciken yedek geri yükleme reddedilir; diğer hesabın cihaz verisi korunur.
- Hatim UI regresyonları: eski modalın başka hatme mutation göndermesi, geç yanıt, depolama başarısızlığı, tokenın istekten önce saklanması, özel başlangıç bağlantısı/auth yarışı ve URL yenileme senaryoları.
- Tarayıcıda gerçek yerel /api/org handler ile misafir cüz alma, okudum, geri alma, Benim Cüzlerim listesi, özel hatim oluşturma, yönetim, arşiv ve yeniden açma denendi.
- 390px iframe görünümü ve masaüstü görünümü gözden geçirildi. Bu fiziksel telefon testi değildir.
- Fâtiha 3–5 Çalışma Masası açılışı: ayarlarda başlangıç 3 ve bitiş 5 kaldı; birleşik modda üç ayrı açıklama gösterildi.
- Üretim verisine test kaydı, gerçek kullanıcı hesabı veya ücretli servis eklenmedi. Yerel /api/org bellekte açıkça test verisi kullanır.
- Netlify önizleme denemeleri ayrı `elifaOrgPreviewRuns/{deploy}/records` alanına gider. Her yeni önizleme dağıtımı ayrı deneme alanı kullanır. Üretim koleksiyonuna ve eski Blobs deposuna geri dönüş yoktur; geçersiz dağıtım kimlikleri reddedilir. Önizleme hem istemcide Firebase hesap başlangıcını hem sunucuda hesap/bulut işlemlerini kapatır.
- Çalışma ortamı Netlify'ın gerçek ikinci handler argümanındaki `context.deploy.context/id` üzerinden seçilir; build değişkenlerinin fonksiyon çalışma anında bulunacağı varsayılmaz. Gerçek default org/account/cleanup girişleri aynı altyapı spy testiyle doğrulandı. Kaynak: [Netlify Functions deploy context](https://docs.netlify.com/build/functions/api/#deploy).
- Açık hatim listesinin gerçek sunucu hatasında yanlışlıkla “kapalı” görünmesi giderildi; yüklenme, hata ve doğrulanmış kapalı durumları ayrı gösterilir.
- Kişisel dönüş: aynı cihazda Benim Cüzlerim, web bağlantısı ve uygulama içinden C1 kodu yolları ayrı açıklanır. Kişisel kod, genel katılım kodundan ayrıdır; eski tam bağlantılar geçerlidir. 100 bitlik özel bölüm yalnız geçerli mevcut kişisel anahtarla hazırlanır; sunucu bağlamlı hash saklar. Hesap bağı atlanmaz; cüz bırakma/erişim yenileme eski kodu iptal eder.
- v359 tarayıcı kontrolünde yerel gerçek handler ile cüz alındı; 127.0.0.1 ve localhost'un ayrı cihaz kayıtları arasında küçük harf/boşluklu kod girilerek aynı cüzün sahipliği geri alındı. Kod hazırlama hatası, geciken cevap, hesap değişimi, clipboard engeli, yanlış özel kodun genel katılıma düşmemesi ve eski kod iptali regresyonlarla kapsanır.

## v360 son kontroller

- Son üretim build: 572 test, 569 başarılı, 0 başarısız; normal koşuda atlanan 3 Firebase test grubu ayrı gerçek emülatör koşusunda 13/13 doğrulandı.

- Günlük dua kartlarının mevcut yerleşimi korundu; açıklamalar bağlama göre sadeleştirildi. Dua seçimi yalnız ilgili sözcükleri işaretler. Bakara 127 için kanonik 8–14. kelimeler (7 kelime), ses yüklemesi gecikse de hemen seçilir.
- Seçim masaya aktarılıp kaydedildiğinde, yeniden açıldığında ve elle bölündüğünde aynı sözcük sınırları korunur. Tam âyet ve kısmi dua aynı aralıkta ayrı kayıtlar olarak açıldı. Yeni çalışma ve isim düzenleme eski kaydı ezmez.
- Kaydedilen çalışmalar ve açık hatimler dar ekranlara uyumlu kompakt satırlara dönüştürüldü. Günlük dua listesinin tasarımı değiştirilmedi.
- Üst çalışma durum satırı kısa süre görünür; ilerleme güncellemeleri kalıcı olarak yeniden açmaz. Kalan tekrar sayısı ayarlanan toplamı değiştirmeden azalır.
- Bağımsız son incelemede ayar değiştirmenin yanlışlıkla oynatma başlatması ve kayıtlı sözcük sınırlarının dışına markaj genişletilmesi giderildi; 14/14 ilgili regresyon testi geçti.
- Son gerçek Firebase Auth/Firestore emülatör koşusu: 13/13 başarılı, 0 başarısız, 0 atlanan (study-v360-firebase.log).

## Yayın sınırı

Kullanıcı bütün çalışmaların son kontrollerinden sonra üretime yayınlanmasını açıkça onayladı. Yayın GitHub PR #20 üzerinden Netlify sürekli dağıtımıyla yapılır; tamamlanma kanıtı üretim sürümü ve dağıtım SHA kontrolüdür. Gerçek telefonda kullanıcının son kabulü ve gerçek Google/Apple girişinin üretim alan adında kontrolü bu kayıtla yapılmış sayılmaz. Yeni Hatim arayüz metinleri Türkçedir; yeni profil alanları Türkçe/İngilizce gösterilir. Diğer mevcut hesap mesajlarının 20 dil kapsamı korunmuştur. Tam forum/yorum sistemi bu sürümde yoktur.

Açık hatim listesinin mevcut yönetim ayarı onaylı canlı yayında etkinleştirilir. Yalnız kurucusunun açık olarak seçtiği, arşivlenmemiş hatimler listelenir; özel katılım ve kişisel dönüş anahtarları yayımlanmaz. Önizlemede liste yalnız deneme alanı için açıktır. Önizlemede gerçek hesap oluşturma, giriş ve bulut işlemleri özellikle kapalıdır; bu işlemlerin doğrulaması ayrı yerel Firebase emülatör testlerine dayanır.
