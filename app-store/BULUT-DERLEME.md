# Mac olmadan iOS derleme ve App Store'a yükleme

7 Ekim 2026: Kullanıcının Mac'i yok. İlk Xcode Cloud iş akışını kurmak için Apple hâlâ Xcode kullanılmasını istiyor; bu yüzden bu proje için GitHub Actions'ın `macos-26` çalıştırıcısı hazırlandı. Apple üyeliği ve sırlar henüz sağlanmadı; bu iş akışları çalıştırılmadı, imzalı IPA üretilmedi.

GitHub'da `hyildiz07/elifa-mushaf` deposu var ve **herkese açık**. Bu yerel çalışma ağacı şu anda o depoya bağlı değil; iOS dosyaları ve diğer yerel değişiklikler GitHub'a yüklenmedi. Bulut derleme için sınanacak kodun uygun bir Git dalına gönderilmesi ve iş akışlarının orada bulunması gerekiyor. Mevcut herkese açık depoya gönderilecek her dosya önce gözden geçirilmeli; istenirse ayrı özel depo kullanılabilir.

## Hazır iş akışları

- `.github/workflows/ios-cloud-check.yml`: elle başlatılır; Node 22 ile web içeriğini hazırlar ve Xcode 26+ üzerinde imzasız iOS Simulator derlemesi yapar. Apple üyeliği olmadan derleme hatalarını bulmak içindir.
- `.github/workflows/ios-store-archive.yml`: Apple üyeliği etkinleşince elle başlatılır; otomatik Apple imzasıyla arşiv ve IPA üretmeyi dener. `upload_to_app_store` varsayılan olarak `false` olduğundan IPA'yı yalnız iş akışı artefaktı olarak bırakır. Gerçek iOS imzalama henüz denenmedi; ilk çalıştırma günlüklerine göre düzenleme gerekebilir. `true` ancak TestFlight'a yüklemek istendiğinde seçilmeli.

İki iş akışı da Firebase iOS uygulamasının `GoogleService-Info.plist` dosyasını `IOS_FIREBASE_PLIST_BASE64` adlı GitHub Actions secret olarak bekler. Firebase'de iOS Bundle ID, `capacitor.config.json` içindeki `com.elifaplatform.mushaf` ile aynı olmalı. Dosyayı Git deposuna yüklemeyin.

Mağaza arşivi ayrıca aşağıdaki **repository secrets** değerlerini bekler: `APPLE_TEAM_ID`, `APPSTORE_API_KEY_ID`, `APPSTORE_API_ISSUER_ID`, `APPSTORE_API_KEY_PRIVATE_BASE64`. Sonuncusu, App Store Connect'te oluşturulan **team** API anahtarının `.p8` dosyasının Base64 karşılığıdır; bireysel API anahtarı provisioning işlemlerini yapamaz. Anahtarın kendisini sohbet mesajına veya depoya koymayın. Apple hesabındaki App ID için Sign in with Apple yeteneğini açın ve Firebase Apple sağlayıcısını yapılandırın.

İlk sıra: Apple üyeliğini etkinleştir → Bundle ID/Firebase iOS kaydını tamamla → Git dalındaki kaynakları ve sırları hazırla → `iOS cloud compile check` çalıştır → imzalı arşiv iş akışını `upload_to_app_store=false` ile çalıştır → gerçek iPhone/iPad'de TestFlight kabulü → mağaza bilgileri ve ekran görüntüleri → yükleme seçeneğini aç.

Kaynaklar: [Apple Xcode Cloud ilk kurulumunda Xcode koşulu](https://developer.apple.com/documentation/xcode/configuring-your-first-xcode-cloud-workflow), [Apple'ın API anahtarı türleri](https://developer.apple.com/documentation/AppStoreConnectAPI/creating-api-keys-for-app-store-connect-api), [GitHub macOS 26 çalıştırıcısı](https://github.com/actions/runner-images/blob/main/images/macos/macos-26-Readme.md), [Apple bulut imzalama](https://developer.apple.com/videos/play/wwdc2021/10204/).
