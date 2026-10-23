# Elifa Mushaf Android TWA

Mevcut `com.elifaplatform.mushaf` uygulamasının küçük, tarayıcı tabanlı TWA kabuğudur. Capacitor Android veya ayrı WebView değildir. Kur’an metni, ses ve hesap ekranları aynı `https://mushaf.elifaplatform.com/` origininden gelir; burada web uygulaması paketlenmez.

## Durum ve aday

**23 Ekim 2026, v1.1.2 adayı:** Üretimdeki v1.1.1'in üzerine versionCode 6 hazırlanmıştır. Android Browser Helper 2.7.4, Android 15+ kenar yerleşimi için güncel `WindowCompat.enableEdgeToEdge` yolunu kullanır. Türkçe Android uygulama ve ana ekran adı `Kur’an-ı Kerim Hafız` olarak değişti; Google Play mağaza başlığı değiştirilmedi. Aynı ad, tarayıcıdan ana ekrana yeni eklenen sürüm için kök `manifest.json` dosyasında da bulunur. İmzalı AAB Play dahili testinde kabul edildi; üretim durumu ve cihaz kabulü `VALIDATION.md` içinde izlenir. Aşağıdaki v1.1.1 açıklaması tarihsel kaynak hazırlığıdır.

**23 Ekim güncellemesi:** Kullanıcının seçtiği yeni simge mağaza için hazırlandı ve Play incelemesine gönderildi. Aynı simgeli versionCode 5 / 1.1.1 AAB mevcut etkin upload anahtarıyla imzalandı; sertifika Play Console ile karşılaştırıldı. İlk Play yüklemesi, otomatik korumanın minSdk 24 şartı nedeniyle reddedildi. Bu yüzden güncel adayın minSdk değeri 24'e yükseltildi; Android 6.0/6.0.1 cihazları yeni güncellemeyi alamayacak. Dahili test ve gerçek cihaz kabulü tamamlanmadan telefon simgesi herkese ulaşmış sayılmaz. Aşağıdaki ilk aday açıklamaları 20 Ekim'deki tarihsel hazırlığı anlatır.

Kaynak, kullanıcı tarafından sağlanan `4.aab` (versionCode 4, 1.1.0) incelenerek yeniden oluşturuldu. Bu, kayıp orijinal Gradle projesinin birebir kopyası değildir. Üç uygulama sınıfı resmi jadx 1.5.6 ile çözüldü: Application ve DelegationService yalnız superclass çağırır; LauncherActivity superclass URL/intent işleyişini ve unspecified orientation davranışını korur. API koşulunun her iki kolu da aynı -1 değerini kullandığından temiz kaynakta tek çağrı vardır.

Aday: versionCode **5**, versionName **1.1.1**. Bu değer, Play Console'daki bütün yükleme kanalları kontrol edilmeden yayına hazır kabul edilmez.

| Ayar | Değer |
| --- | --- |
| applicationId / namespace | com.elifaplatform.mushaf |
| Açılış ve App Links | https://mushaf.elifaplatform.com/ |
| compileSdk / targetSdk | 36 / 36 |
| minSdk | 24 (Android 7.0; Google Play otomatik koruma gereği) |
| Browser Helper | 2.7.3, sabit sürüm |
| Android Gradle Plugin | 9.0.1 |
| Gradle / JDK | 9.1.0 / 17 |
| Build Tools | 36.0.0 |
| Varsayılan çıktı | İmzasız release AAB |

**Uyumluluk değişikliği:** eski paket minSdk 21 idi. Browser Helper 2.7.3 en az 23 ister; Play otomatik koruma en az 24 ister. Bu nedenle Android 5 ve 6 (API 21–23) cihazları yeni güncellemeyi alamaz. Aynı packageId/domain ve browser storage kullanılır; kurulu uygulamayı silme, tarayıcı verisini temizleme veya yeni applicationId oluşturma adımı yoktur.

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

## Korunan davranış ve güncellenen görseller

Açılış URL, host, HTTPS autoVerify App Links, intent URL delegation, splash renk/süre, status/navigation renkleri, any orientation, customtabs fallback, bildirim delegation kapalı, FileProvider ve alan yönetimi girişi korunur. Transitive AndroidX manifest bileşenleri yeni bağımlılıklar tarafından merge edilir. `androix.browser.trusted.NAVIGATION_BAR_DIVIDER_COLOR` anahtarındaki tarihsel yazım Browser Helper 2.7.3'te de aynıdır; bilerek korunmuştur.

İlk yeniden oluşturma sırasında 15 PNG ve gömülü web manifesti AAB'den byte-for-byte alındı. 20 Ekim 2026'da kullanıcının onayladığı `store-assets/google-play/play-icon-512.png`, beş yoğunluk için native launcher simgesine aktarıldı. Eski lacivert hilal/yıldız kaynaklarının 10 PNG'si değiştirildi; beş splash PNG ve tarihsel web manifesti korunur. Güncel dosya hash'leri, yeni sanat kaynağının hash'i ve değişen dosyaların eski AAB entry/hash kayıtları (`originalExtraction`) `resource-provenance.json` içindedir.

Legacy simge 48dp kare görseldir. Adaptive simgede 108dp şeffaf foreground içine 56dp boyutunda onaylı kare yerleştirilir; arka plan koyu yeşildir (`#063D2E`). Bu boşluk farklı launcher maskelerinde metnin kesilmesini önler; daire maskesi yalnız dekoratif köşe piksellerine dokunabilir. Kaynak sanat yeniden çizilmedi, metni değiştirilmedi; Lanczos3 küçültme ve merkezleme yapıldı. `scripts/generate-launcher-icons.mjs` (sharp 0.34.x gerekir) kaynakları ve `artifacts/android-branding-2026-10-20/launcher-preview.png` önizlemesini üretir. Önizleme daire, yuvarlatılmış kare, squircle ve 48px örnekler içerir. Bu simgeler yeni Android sürümünün parçasıdır; mağaza simgesi güncellemesinden bağımsızdır.

Görsel hakları mevcut uygulama sahibine aittir; üçüncü taraf implementation kaynakları kopyalanmaz. Maven bağımlılıkları kendi lisanslarına tabidir; Android Browser Helper Apache 2.0'dır.

## Dil bazında uygulama adı

Uygulama adı ve kısa ana ekran adı, web uygulamasının 21 dili için yerelleştirilmiştir. Varsayılan İngilizce adlar `Easy Quran Memorization` / `Easy Quran`; Türkçe adlar `Kolay Hafızlık: Kuran Ezberle` / `Kolay Hafızlık` biçimindedir. `app-labels.json` tüm adları ve kaynak klasörlerini listeler. Android cihaz/uygulama dili uygun kaynağı seçer; Play ülke hedeflemesi launcher adını belirlemez.

20 dil klasörü İngilizce varsayılan kaynağı tamamlar. Ek olarak Brezilya Portekizcesi, Tayvan Çincesi ve Geleneksel Çince yazı sistemi için kaynaklar vardır: toplam 24 konfigürasyon. Endonezce Android'in `values-in` kodunu kullanır; apostroflar Android string kurallarına uygun kaçırılır. URL, host ve diğer bağlantı ayarları yalnız varsayılan kaynakta, `translatable="false"` olarak korunur. `node scripts/sync-app-labels.mjs`, iki mağaza yerelleştirme JSON'undan adları yeniden üretir.

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
- [Android adaptive icon katmanları ve güvenli alan](https://developer.android.com/develop/ui/compose/system/icon_design_adaptive)
- [TWA ve Digital Asset Links](https://developer.chrome.com/docs/android/trusted-web-activity/android-for-web-devs)
