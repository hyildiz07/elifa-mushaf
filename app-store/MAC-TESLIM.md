# Mac / App Store teslim adımları

Bu proje 7 Ekim 2026'da Windows'ta `npm run ios:sync` ile kaynak düzeyinde hazırlandı. İmzalı `.ipa` ancak etkin Apple Developer Program üyeliği ve Xcode 26+ bulunan Mac ortamında üretilebilir. Kullanıcının Mac'i olmadığı için öncelikli yol [bulut derleme](BULUT-DERLEME.md) iş akışlarıdır. Aşağıdaki adımlar Mac erişimi olursa geçerlidir.

1. Apple Developer hesabında `com.elifaplatform.mushaf` Bundle ID'sini doğrulayın. Xcode'da App hedefi için kendi Team'inizi seçin; Sign in with Apple yeteneğini etkinleştirin. App Store Connect'te aynı Bundle ID ile Elifa Mushaf kaydını açın.
2. Firebase `elifa-mushaf` projesinde aynı Bundle ID ile iOS uygulaması kaydedin. `GoogleService-Info.plist` dosyasını indirin. Apple ve Google giriş sağlayıcılarını iOS için tamamlayın; Apple özel anahtarını depoya eklemeyin.
3. Mac'te proje kökünde `npm ci`, ardından `npm run ios:firebase -- /tam/yol/GoogleService-Info.plist`, `npm run ios:sync` ve `npm run ios:check` çalıştırın. Son komut yeşil olmadan arşiv almayın. Firebase dosyası kaynak arşivine bilerek konulmadı.
4. `ios/App/App.xcodeproj` dosyasını Xcode 26 veya yenisiyle açın. Signing & Capabilities altında Team ve Automatic signing'i kontrol edin. Gerçek iPhone'da ilk açılış, okuma, çevrimdışı okuma, ses/tekrar/âyet bölme, hesap ve Apple/Google giriş, hesap silme, URL dönüşü ve yedek eşitlemeyi deneyin. iPad hedefi açık olduğundan iPad yerleşimini de sınayın.
5. Xcode'da Product → Archive, ardından Validate App ve Distribute App → App Store Connect ile önce TestFlight'a yükleyin. TestFlight kabulünden sonra çalışan iOS uygulamasından iPhone/iPad ekran görüntülerini alın. Mağaza metni `magaza-metni-tr.md` içindedir.
6. App Store Connect'te destek ve gizlilik URL'lerini, App Privacy veri beyanını, yaş derecelendirmesini, içerik hakları beyanını ve inceleme notunu gerçek uygulama davranışına göre doldurun. Ses ve meal kaynaklarının iOS dağıtım hakları belgelenmeden incelemeye göndermeyin.

Kaynak: [Apple'ın derleme yükleme koşulları](https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds/), [ekran görüntüsü koşulları](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/), [uygulama gizliliği](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy).
