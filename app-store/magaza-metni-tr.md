# App Store Türkçe metin taslağı

Bu metin henüz App Store Connect'e gönderilmedi. Ekran görüntüleri ve iOS cihaz testi tamamlanınca son içerikle karşılaştırılmalı.

- **Uygulama adı:** Elifa Mushaf
- **Alt başlık:** Kur’ân Ezberi ve Tekrarı
- **Birincil kategori önerisi:** Eğitim
- **Destek URL'si:** `https://mushaf.elifaplatform.com/destek/` (7 Ekim 2026'da HTTP 200 doğrulandı)
- **Gizlilik politikası URL'si:** `https://mushaf.elifaplatform.com/gizlilik/`
- **Gizlilik seçenekleri URL'si:** `https://mushaf.elifaplatform.com/gizlilik/#hesap-silme`
- **Anahtar sözcük taslağı:** Kur'an,ezber,ayet,mushaf,kıraat,hatim,tekrar,meal

## Açıklama

Elifa Mushaf, Kur’ân okumak, dinlemek ve küçük adımlarla ezber çalışmak için hazırlanmıştır. Okuma ve dinleme hesapsız kullanılabilir.

Uzun âyetlerde uygun ses zamanlaması bulunan kayıtları kısa parçalara ayırabilir; parçaları tekrar edebilir, 1+2 birleştirme çalışması yapabilir ve istediğin kelime aralığını seçebilirsin. Tekrar düğmesinden âyet aralığı seçebilir, kaldığın yeri, notlarını ve işaretlerini cihazında tutabilirsin.

İsteğe bağlı hesap, kişisel kayıtların buluta yedeklenmesi ve cihazlar arasında eşitlenmesi içindir. Bulut eşitlemesini kullanıcı açar; hesap oluşturmak cihaz kayıtlarını silmez. Sesin kullanılabilirliği seçilen hoca ve kaydın doğrulanmış zamanlamasına göre değişebilir.

Uygulama ücretsizdir. Reklam gösterilmez.

## App Review notu taslağı

Uygulama hesap açmadan açılır: sûre seçilip Kur’ân okunabilir ve dinlenebilir. Ezber görünümünde güvenilir ses zamanlaması olan bir âyette Âyeti Böl, tekrar ve 1+2 denenebilir. Hesap oluşturma/giriş isteğe bağlıdır; Ayarlar → Hesabım altında eşitleme, çıkış ve hesabı silme bulunur. İnceleme hesabı gerekiyorsa gerçek şifreyi depoya koymadan App Store Connect'in Review Information alanına girin. Arka uç Netlify, hesap Firebase Authentication/Firestore kullanır. Üçüncü taraf ses kaynakları internet bağlantısı gerektirebilir.

## Yayımlamadan önce doğrulanacak beyanlar

- App Privacy: e-posta, kullanıcı kimliği, isteğe bağlı kullanıcı içeriği (notlar/yedekler), Birlikte özelliğine girilen bilgiler, kullanım verileri/Analytics ve sağlayıcı günlükleri için gerçek veri akışını inceleyerek doğru yanıtları verin. “Veri toplamıyoruz” seçmeyin.
- Yaş derecelendirmesi, içerik hakları ve ses/meal kaynaklarının dağıtım izni doğrulanmalı.
- iPhone ve iPad ekran görüntüleri çalışan **iOS uygulamasından** alınmalı; web tarayıcısı maketi son ekran görüntüsü olarak sunulmamalı.
- Google ile giriş iOS sürümünde korunacaksa Apple kuralı 4.8'e uygun eşdeğer giriş seçeneği ve gerçek cihaz testi gerekli.
