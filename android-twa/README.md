# Elifa Mushaf Android TWA

Mevcut `com.elifaplatform.mushaf` uygulamasının küçük, tarayıcı tabanlı TWA kabuğudur. Capacitor Android veya ayrı WebView değildir. Kur’an metni, ses ve hesap ekranları aynı `https://mushaf.elifaplatform.com/` origininden gelir; burada web uygulaması paketlenmez.

## Durum ve aday

Kaynak, kullanıcı tarafından sağlanan `4.aab` (versionCode 4, 1.1.0) incelenerek yeniden oluşturuldu. Bu, kayıp orijinal Gradle projesinin birebir kopyası değildir. Üç uygulama sınıfı resmi jadx 1.5.6 ile çözüldü: Application ve DelegationService yalnız superclass çağırır; LauncherActivity superclass URL/intent işleyişini ve unspecified orientation davranışını korur. API koşulunun her iki kolu da aynı -1 değerini kullandığından temiz kaynakta tek çağrı vardır.

Aday: versionCode **5**, versionName **1.1.1**. Bu değer, Play Console'daki bütün yükleme kanalları kontrol edilmeden yayına hazır kabul edilmez.

| Ayar | Değer |
| --- | --- |
| applicationId / namespace | com.elifaplatform.mushaf |
| Açılış ve App Links | https://mushaf.elifaplatform.com/ |
| compileSdk / targetSdk | 36 / 36 |
| minSdk | 23 (Android 6.0) |
| Browser Helper | 2.7.3, sabit sürüm |
| Android Gradle Plugin | 9.0.1 |
| Gradle / JDK | 9.1.0 / 17 |
| Build Tools | 36.0.0 |
| Varsayılan çıktı | İmzasız release AAB |

**Uyumluluk değişikliği:** eski paket minSdk 21 idi. Browser Helper 2.7.3 minSdk 23 gerektirir; Android 5.0/5.1 (API 21/22) bu yeni adayı yükleyemez. Aynı packageId/domain ve browser storage kullanılır; kurulu uygulamayı silme, tarayıcı verisini temizleme veya yeni applicationId oluşturma adımı yoktur.

## Derleme

JDK 17 ve lisansı kullanıcı tarafından kabul edilmiş Android SDK gereklidir. Yalnız geliştirme makinesinde `JAVA_HOME`, `ANDROID_HOME` (veya ignored `local.properties`) ayarla. Araçlar ve anahtarlar repoya konulmaz.

Windows: `.\gradlew.bat :app:bundleRelease`. macOS/Linux: `./gradlew :app:bundleRelease`. Kaynak/görsel kontrolü: `node scripts/verify-source.mjs`.

Hiçbir ELIFA_UPLOAD_* değişkeni yokken release **imzasızdır**; bu çıktı Play'e yüklenmez. Debug yapılandırması da otomatik debug anahtarı kullanmaz. Android güncellemesi ve Play gönderimi kullanıcı tarafından yetkilendirilmiştir; mevcut engel imzalama parolasının bulunmaması ve aşağıdaki teknik doğrulama kapılarıdır. Bu kaynak hazırlığında imzalama veya Play yükleme yapılmadı. Anahtar/parola sıfırlama ya da imzalama kimliğini değiştirme mevcut yayın talebinden ayrı bir işlemdir.

Mevcut imzalama bilgileri sağlandığında dört değer **yalnız ortam değişkenlerinden** okunur:

- `ELIFA_UPLOAD_STORE_FILE`: mevcut upload keystore dosyasının yolu.
- `ELIFA_UPLOAD_STORE_PASSWORD`: keystore parolası.
- `ELIFA_UPLOAD_KEY_ALIAS`: mevcut anahtar takma adı.
- `ELIFA_UPLOAD_KEY_PASSWORD`: anahtar parolası.

Kısmi yapılandırma hata verir; debug key'e veya yeni anahtara fallback yapılmaz. Parola/keystore yolu Gradle property, kaynak dosya veya rapora yazılmaz. Bu depoda özel anahtar ve parola yoktur.

## Korunan davranış ve görseller

Açılış URL, host, HTTPS autoVerify App Links, intent URL delegation, label, ikonlar, splash renk/süre, status/navigation renkleri, any orientation, customtabs fallback, bildirim delegation kapalı, FileProvider ve alan yönetimi girişi korunur. Transitive AndroidX manifest bileşenleri yeni bağımlılıklar tarafından merge edilir. `androix.browser.trusted.NAVIGATION_BAR_DIVIDER_COLOR` anahtarındaki tarihsel yazım Browser Helper 2.7.3'te de aynıdır; bilerek korunmuştur.

15 PNG ve gömülü web manifesti AAB'den byte-for-byte alındı. Adaptive icon XML aynı beyaz arka plan, 8.5dp inset maskable görsel ve şeffaf foreground ile yeniden yazıldı. Dosya SHA256 ve kaynak entry adları `resource-provenance.json` içindedir. Görsel hakları mevcut uygulama sahibine aittir; üçüncü taraf implementation kaynakları kopyalanmaz. Maven bağımlılıkları kendi lisanslarına tabidir; Android Browser Helper Apache 2.0'dır.

AGP 9 artık `proguard-android.txt` desteklemez; `proguard-android-optimize.txt` ve AGP 9'un R8 full mode/resource shrinking yolu kullanılır. Eski AAB'de kapalı olan kod optimizasyonu bu adayda açılır; kaynak küçültme de aktiftir. Manifest bileşenlerini AGP'nin ürettiği kurallar korur, gereksiz geniş keep veya `-dontoptimize` kuralı yoktur. Gerçek cihazda performans kazancı ölçülmeden varsayılmaz.

Bağımlılık yükseltmesi bütün eski API referanslarının yok olduğu anlamına gelmez: AndroidX'in sürüm uyumluluğu yollarında `Window.setStatusBarColor`, `setNavigationBarColor` ve `setDecorFitsSystemWindows` referansları aday DEX'te hâlâ bulunabilir. Play'in son paket analizi ve Android 15/16 cihaz kabulü tamamlanmadan mağaza uyarısının tamamen kalktığı söylenmez.

## Yayından önce

1. Build/lint ve bundletool doğrulaması; merged manifestte kimlik/URL/izinlerin karşılaştırılması.
2. Mevcut upload key ve Play App Signing sertifikasının doğrulanması. AAB public sertifikası özel anahtarı kurtarmaz; Play dağıtım sertifikasıyla aynı olduğu varsayılmaz.
3. `/.well-known/assetlinks.json` içinde gerçek Play app-signing fingerprint eşleşmesi; Google giriş/Custom Tab fallback kontrolü.
4. Dahili Play testinde mevcut sürümün üzerine güncelleme: hesap/yerel not/çalışma korunması, App Links, ses/parça sınırı/arka plan, geri hareketi ve Android 15/16 kenar yerleşimi.
5. Bu teknik kapılar tamamlandığında mevcut yayın talebi kapsamında imzalı aday hazırlanıp Play gönderimine devam edilir; aynı yayın için tekrar genel izin istenmez. Mevcut anahtara erişilemiyorsa anahtar kurtarma/sıfırlama adımı ayrıca ele alınır.

## Resmi kaynaklar

- [AGP 9.0 uyumluluk ve kaldırılan ayarlar](https://developer.android.com/build/releases/agp-9-0-0-release-notes)
- [Browser Helper 2.7.3 kaynak etiketi](https://github.com/GoogleChrome/android-browser-helper/tree/android-browser-helper-2.7.3)
- [jadx 1.5.6 resmi sürümü](https://github.com/skylot/jadx/releases/tag/v1.5.6)
- [Android imzalama](https://developer.android.com/studio/publish/app-signing)
- [TWA ve Digital Asset Links](https://developer.chrome.com/docs/android/trusted-web-activity/android-for-web-devs)
