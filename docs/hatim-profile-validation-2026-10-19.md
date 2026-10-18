# Hatim, hesap ve hıfz önizlemesi — v357

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
- Son izole önizleme build: 512 test, 509 başarılı, 0 başarısız; 3 emülatöre bağlı test ayrı koşuyla doğrulandı.
- Ayrı gerçek yerel Firebase Auth/Firestore emülatör koşusu: 13/13 başarılı, 0 atlanan. Eşzamanlı cüz talebi, geçersiz eski kurtarma isteği, hesap bağlama/ayırma, profil revizyonu, yedek izolasyonu, yetki kuralları ve silme tekrarları dahil.
- Bağımsız hesap denetimi: başka sekmede çalışma alanı değişirken geciken yedek geri yükleme reddedilir; diğer hesabın cihaz verisi korunur.
- Hatim UI regresyonları: eski modalın başka hatme mutation göndermesi, geç yanıt, depolama başarısızlığı, tokenın istekten önce saklanması, özel başlangıç bağlantısı/auth yarışı ve URL yenileme senaryoları.
- Tarayıcıda gerçek yerel /api/org handler ile misafir cüz alma, okudum, geri alma, Benim Cüzlerim listesi, özel hatim oluşturma, yönetim, arşiv ve yeniden açma denendi.
- 390px iframe görünümü ve masaüstü görünümü gözden geçirildi. Bu fiziksel telefon testi değildir.
- Fâtiha 3–5 Çalışma Masası açılışı: ayarlarda başlangıç 3 ve bitiş 5 kaldı; birleşik modda üç ayrı açıklama gösterildi.
- Üretim verisine test kaydı, gerçek kullanıcı hesabı veya ücretli servis eklenmedi. Yerel /api/org bellekte açıkça test verisi kullanır.
- Netlify önizleme denemeleri ayrı `elifaOrgPreviewRuns/{review}/records` alanına gider. Üretim koleksiyonuna ve eski Blobs deposuna geri dönüş yoktur; geçersiz dağıtım kimlikleri reddedilir. Önizleme hem istemcide Firebase hesap başlangıcını hem sunucuda hesap/bulut işlemlerini kapatır.
- Açık hatim listesinin gerçek sunucu hatasında yanlışlıkla “kapalı” görünmesi giderildi; yüklenme, hata ve doğrulanmış kapalı durumları ayrı gösterilir.

## Yayın sınırı

Bu paket önizleme içindir. Üretim yayını yapılmadı. Gerçek telefonda kullanıcının son kabulü ve gerçek Google/Apple girişinin üretim alan adında kontrolü bu kayıtla yapılmış sayılmaz. Yeni Hatim arayüz metinleri Türkçedir; yeni profil alanları Türkçe/İngilizce gösterilir. Diğer mevcut hesap mesajlarının 20 dil kapsamı korunmuştur. Tam forum/yorum sistemi bu sürümde yoktur.

Üretimde açık hatim listesi mevcut yönetim ayarıyla kapalıdır (`discoverConfig: enabled:false`); onaylı canlı yayında ayrıca etkinleştirilmelidir. Önizlemede liste yalnız deneme alanı için açıktır. Önizlemede gerçek hesap oluşturma, giriş ve bulut işlemleri özellikle kapalıdır; bu işlemlerin doğrulaması ayrı yerel Firebase emülatör testlerine dayanır.
