# Elifa Mushaf — iOS / App Store hazırlık durumu

7 Ekim 2026. Bu klasör bir mağaza teslim hazırlığıdır; imzalı `.ipa` veya Apple onayı değildir. Mevcut Google Play paketi web tabanlı TWA/PWA'dır ve iOS ikili paketi yerine geçmez. Bu çalışmada canlı Netlify sitesi değiştirilmedi.

## Hazır olanlar

- [icon-1024.png](icon-1024.png): mevcut PWA ikonundan 1024×1024, opak PNG mağaza ikonu taslağı. Yeni logo tasarlanmadı.
- [magaza-metni-tr.md](magaza-metni-tr.md): Türkçe ad, alt başlık, açıklama ve inceleme notu taslağı.
- `https://mushaf.elifaplatform.com/destek/` canlıda HTTP 200 dönüyor. Mevcut `/gizlilik/` sayfasında veri ve hesap silme açıklamaları var.
- Hesapsız okuma/dinleme, isteğe bağlı Firebase hesap, hesap içinden silme ve cihaz kayıtları mevcut web uygulamasında bulunuyor.
- `ios/App/App.xcodeproj` içinde Capacitor tabanlı iPhone/iPad projesi oluşturuldu. Web varlıkları `npm run ios:sync` ile pakete kopyalanıyor; uygulama uzak web sayfasını açan bir kabuk değil.
- Google ve Apple için yerel giriş köprüsü eklendi. Apple ile açılmış hesabın silinmesinde yeniden Apple yetkisi alınıp authorization code Firebase üzerinden iptal ediliyor. Bu yol gerçek Apple hesabıyla henüz sınanmadı.
- `capacitor://localhost` kaynağından hesap ve Birlikte API istekleri için dar kapsamlı CORS, yerel paket için canlı API adresi, uygulama ikonu, açılış ekranı ve Sign in with Apple entitlement taslağı hazırlandı.
- `npm run ios:sync` 7 Ekim'de 251 geçen, 2 atlanan test ile tamamlandı. Canlı `/api/account` ve `/api/org` iOS origin OPTIONS istekleri HTTP 204 ve `Access-Control-Allow-Origin: capacitor://localhost` döndürüyor. Firebase iOS dosyası eksik olduğundan `npm run ios:check` bilinçli olarak kırmızı.
- Google giriş URL dönüşü AppDelegate'e eklendi; yalnız Google SPM trait'i açık, kullanılmayan Facebook SDK'sı dışarıda. Xcode projesi Firebase plist dosyasını Resources'a ekleyecek şekilde ayarlandı.

## Göndermeyi engelleyen işler

1. **Apple Developer Program üyeliği ve App Store Connect yetkisi.** Sıradan Apple hesabı tek başına uygulama yayımlamaya yetmez. Kullanıcı üyeliğinden emin değil. [Apple geliştirici hesabında](https://developer.apple.com/account/) Membership ve App Store Connect erişimini kontrol etmek gerekir. `com.elifaplatform.mushaf` şu an **geçici** Bundle ID'dir; Apple hesabında kullanılabilirliği teyit edilmeden kesinleştirilmemeli.
2. **İmzalı macOS derlemesi.** Xcode projesi hazır, ama Windows'ta Xcode çalıştırılamaz ve `.ipa` üretilemez. Kullanıcının Mac'i yok; Xcode Cloud'un ilk kurulumu Xcode gerektirdiğinden GitHub Actions `macos-26` iş akışları hazırlandı. Bunlar henüz GitHub'a gönderilmedi veya Apple imzasıyla sınanmadı. Yerel depoda `git remote` yok; erişilebilir `hyildiz07/elifa-mushaf` deposu herkese açık. Ayrıntı: [BULUT-DERLEME.md](BULUT-DERLEME.md).
3. **Firebase/Apple yapılandırması.** Firebase `elifa-mushaf` projesine iOS uygulaması aynı Bundle ID ile kaydedilip `GoogleService-Info.plist` alınmalı. Dosya `npm run ios:firebase -- <indirilen-dosya>` ile Xcode hedefi ve Google URL scheme'e bağlanır. Apple Developer'da App ID + Sign in with Apple, Firebase Authentication'da Apple sağlayıcısı/Service ID/Team ID/key tanımlanmalı. Apple private email relay için Firebase gönderici adresi kayıt edilmeli. Firebase CLI oturumu bu makinede geçerli olmadığı için bu ayarlar doğrulanamadı. Gerçek kullanıcı hesabında giriş, eski UID ile yedek eşitleme ve Apple hesap silme/yetki iptali sınanmalı.
4. **Yerel paket ve sunucu sınırı.** Paket içi kaynak ve canlı API CORS ön uç yanıtı doğrulandı; bu henüz gerçek iOS isteğinin başarılı olduğu anlamına gelmez. Ses indirmeleri, yerel depolama, çevrimdışı kullanım, dış bağlantılar ve App Store 4.2 kapsamında yerel deneyim gerçek cihazda doğrulanmalı.
5. **Gizlilik ve haklar.** App Store Connect App Privacy yanıtları Firebase Analytics, Authentication, Firestore, Netlify ve ses kaynakları dahil gerçek veri akışı üzerinden hazırlanmalı. Kodda QuranCDN/Quran.com, EveryAyah ve QuranicAudio kaynakları görülüyor; uygulamanın Hakkında ekranı da bazı ses haklarının icracı ve yapımcıda olduğunu belirtiyor. Her kaydın, mealin, fontun ve görselin iOS dağıtım hakkı belgelenmeli; webde erişilebilir olması tek başına sınırsız dağıtım izni değildir.
6. **Gerçek cihaz kabul testi.** iPhone ve iPad'de ilk açılış, çevrimdışı okuma, ses/âyet bölme/tekrar, ekran kilidi ve arka plan, Google/Apple/e-posta giriş, e-posta doğrulama, hesap silme, yedek eşitleme, farklı ağ ve büyük yazı test edilmeli. Ardından TestFlight ve App Store ekran görüntüleri üretilmeli.

## Önerilen teslim sırası

1. Apple Developer Program üyeliğini, App Store Connect rolünü ve uygulama sahipliğini doğrula. Geçici Bundle ID'yi hesapta teyit et.
2. Firebase iOS uygulaması ve Apple/Google sağlayıcılarını kur; `GoogleService-Info.plist` dosyasını indirip `npm run ios:firebase -- <dosya-yolu>` çalıştır. Gizli Apple anahtarını depoya koyma.
3. Kaynakları gözden geçirilmiş bir Git dalına bağla; [BULUT-DERLEME.md](BULUT-DERLEME.md) içindeki sırları ayarla. Önce `iOS cloud compile check`, sonra `iOS App Store archive` iş akışını yükleme kapalıyken çalıştır. Web/Android canlı akışından ayrı iOS dalında geliştir. Release arşivini ve imzayı doğrula.
4. Gizlilik beyanını gerçek iOS davranışına göre güncelle. İçerik haklarını kanıtla. Gerçek cihazdan canlı API ve ses kaynaklarını sınamadan gönderme.
5. Gerçek cihaz ve TestFlight kabulünden sonra App Store Connect metadata, App Privacy ve ekran görüntülerini girip incelemeye gönder.

## Resmî kaynaklar

- [App Review Guidelines 4.2, 4.8, 5.1.1](https://developer.apple.com/app-store/review/guidelines/)
- [App Store Connect uygulama kaydı](https://developer.apple.com/help/app-store-connect/create-an-app-record/add-a-new-app/)
- [Hesap silme](https://developer.apple.com/support/offering-account-deletion-in-your-app/)
- [App Privacy](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy)
- [Xcode Cloud kaynak deposu](https://developer.apple.com/documentation/xcode/setting-up-your-project-to-use-xcode-cloud)
- [Firebase Apple girişi](https://firebase.google.com/docs/auth/web/apple)
- [Google OAuth WebView uyarısı](https://support.google.com/faqs/answer/12284343)
