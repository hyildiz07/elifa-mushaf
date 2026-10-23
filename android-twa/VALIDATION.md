# Android TWA aday doğrulaması — 20 Ekim 2026

## 23 Ekim 2026 — v1.1.2, Android 15+ ve telefon adı

- Kaynak: versionCode **6**, versionName **1.1.2**, minSdk **24**, targetSdk **36**; Android Browser Helper **2.7.4**. Türkçe `appName` ve `launcherName` **Kur’an-ı Kerim Hafız**; Play mağaza başlığı aynı.
- Resmî JDK 17 ve Android SDK 36 ile release bundle/lint başarılı. Kaynak/simge/yerelleştirme kontrolü geçti; lint **0 hata, 9 uyarı** (önceki sürümle aynı sınıflar).
- İmzalı AAB'nin JAR imzası doğrulandı. Yükleme sertifikası SHA-256 **AC:5D:03:E1:ED:F1:E7:28:F8:C0:4E:1F:F5:CF:0C:75:5D:2B:6F:D4:EC:AA:2A:F7:EF:A9:D7:D7:DE:D3:9D:9C** Play'deki etkin yükleme sertifikasıyla eşleşiyor. `bundletool validate` başarılı; derlenmiş manifest versionCode 6 / 1.1.2 / API 24–36.
- Play **dahili test** bu AAB'yi kabul etti ve sürümü test kullanıcılarına açtı. Yeni sürüm karşılaştırması telefon ve tablette **0 destek kaybı** gösterdi. Play lansman öncesi raporu Android 16 sanal telefonda bir test yaptı; kararlılık, performans ve erişilebilirlik için **0 sorun** bildirdi. Bu, Android 15 fiziksel telefon veya tablet kabulünün yerini tutmaz.
- Google Play'in uçtan uca ekran ve eski Window API uyarıları hâlâ üretimdeki **v1.1.1** için gösteriliyor. v1.1.2'nin üretim analizi tamamlanmadan kalktıkları iddia edilmez.

## 23 Ekim 2026 — kullanıcı onaylı yeni simge

Kullanıcının 23 Ekim'de sağladığı Kur’an görseli Google Play için 512 × 512 PNG'ye dönüştürüldü; aynı görselin 10 Android launcher yoğunluğu/maskesi üretildi. `node scripts/verify-source.mjs`, `:app:bundleRelease` ve `:app:lintRelease` başarılıdır. İmzalı AAB içindeki 10 simgenin açılmış pikselleri kaynak PNG'lerle birebir eşleşir.

- Paket: `com.elifaplatform.mushaf`, versionCode **5**, versionName **1.1.1**, minSdk **24**. İlk minSdk 23 paketi Play otomatik korumasının Android 7.0 (API 24) alt sınırına takıldı; koruma korunarak yeniden derlendi. Android 6 cihazları bu güncellemeyi alamaz.
- İmzalı AAB: ignored `artifacts/android-branding-2026-10-23/elifa-mushaf-v5-new-icon-signed.aab`; SHA256 `870E2C9478A1249A9F6D43A14315A335FB11FC8B761BB33BB5D3509A6F1BD020`.
- `jarsigner -verify` başarılı; sertifika SHA256 `AC:5D:03:E1:ED:F1:E7:28:F8:C0:4E:1F:F5:CF:0C:75:5D:2B:6F:D4:EC:AA:2A:F7:EF:A9:D7:D7:DE:D3:9D:9C` Play Console'daki etkin upload sertifikasıyla eşleşti.
- Mağaza simgesi 25 yerel mağaza girişi için Play incelemesine gönderildi; bu **canlı yayında göründüğü anlamına gelmez**. Telefon simgesi, versionCode 5 uygulama güncellemesi test ve yayın aşamalarını geçince cihazlara ulaşır.
- Play paketi **5 (1.1.1), Android 7.0+** olarak kabul etti. Dahili test kanalı **etkin** ve “Dahili test kullanıcıları tarafından kullanılabilir” durumunu gösteriyor. Test hesabı mevcut listede kayıtlı; katılım bağlantısı `https://play.google.com/apps/internaltest/4701555052609236260`.
- Play bu alt sınır nedeniyle eski sürümün desteklediği **1.144 cihaz modelinin** yeni paketi alamayacağını uyardı (995 telefon, 148 tablet, 1 TV). Bu gerçek kullanıcı sayısı değildir; herkese açık yayından önce uyumluluk kararında dikkate alınmalıdır.
- Fiziksel cihazda mevcut uygulamanın üzerine güncelleme, hesap/veri korunması, ses tekrarı ve Android 15/16 güvenli alanlarının kabulü hâlâ gereklidir. Bu bilgisayara ADB cihazı bağlı değildi.

Aşağıdaki 20 Ekim bölümü tarihsel adayın o günkü durumudur; anahtar/parola engeli artık geçerli değildir.

Bu rapor imzasız yerel aday içindir. Play gönderimi kullanıcı tarafından yetkilendirilmiştir; mevcut engel upload anahtarının parolasına erişilememesi ve cihaz güncelleme kabulüdür. Anahtar sıfırlama veya imzalama kimliğini değiştirme yapılmadı.

- `:app:bundleRelease :app:lintRelease` başarılı. Görsel/yerelleştirme sonrası kontrol 42 saniye, 44 task (24 up-to-date).
- Lint **0 hata, 9 uyarı**, baseline/suppression yok. Uyarılar: yeni Gradle sürümü önerisi (1), kare legacy launcher ikonları (5), monochrome ikon eksikliği (1), korunan aynı 1px splash görselinin yoğunluk/tekrar bilgisi (2).
- Kaynak/provenance kontrolü: korunan **6 orijinal kaynak**, onaylı mağaza görselinden üretilen **10 yeni ikon** ve kaynak sanat SHA256'ları doğrulandı. Eski ikon hash'leri `originalExtraction` altında tarihsel kanıt olarak korunur. Resmi Gradle wrapper JAR/dist checksum doğrulandı.
- Uygulama adı ve kısa launcher adı **21 dil / 24 kaynak konfigürasyonu** için gerçek AAB'den geri okundu ve `app-labels.json` ile eşleşti. İngilizce varsayılan, Türkçe, Endonezce `in`, pt-BR, zh-TW ve zh-Hant eşleşmeleri dahil; Endonezce apostrofları derlenmiş değerde doğrudur.
- AAB'deki **10 ikon PNG'sinin** açılmış piksel verisi güncel native kaynaklarıyla birebir eşleşir. Daire, yuvarlatılmış kare, squircle ve 48px önizlemeleri incelendi; metin maskelerde görünür. Fiziksel launcher kabulü henüz yapılmadı.
- Paket `com.elifaplatform.mushaf`, sürüm **5 / 1.1.1**, minSdk **23**, target/compileSdk **36**.
- Android Browser Helper **2.7.3**, AndroidX Browser **1.10.0**; eski **1.9.0-alpha04** yerine sabit sürüm.
- AGP **9.0.1**, Gradle **9.1.0**, JDK **17**, Build Tools **36.0.0**.
- AAB içindeki gerçek R8 **9.0.32** metadata'sı: optimization=true, shrinking=true, obfuscation=true, debug=false, minApi=23.
- `bundletool 1.18.3 validate` çıkış **0**.
- Üretilen AAB **748.517 bayt**; SHA256 `8813d90fca1b79fd89ba40e4b661c200a9978f34cb89ee8fbf4e155caf1436cc`.
- AAB ZIP içinde `META-INF/*.RSA`, `*.DSA`, `*.EC`, `*.SF` sayısı **0**. Gradle task adındaki `signReleaseBundle` imzalama yapıldığı anlamına gelmez: signing config null ve çıktı imzasızdır. Upload/debug key kullanılmadı.
- İlk aday kontrolünde kısmi imzalama ayarı gerçek Gradle configuration testinde paketleme başlamadan reddedilmişti. Bu ikon/ad güncellemesinde imzalama kodu değişmedi; hiçbir upload ortam değişkeni bulunmadığı doğrulanarak derlendi.
- Kullanıcının önceki v4 AAB'si 1.035.131 bayttı; ilk v5 aday 355.008 bayttı. Yeni görsel kaynakları paketi büyütür. Bu yalnız AAB dosya boyutu karşılaştırmasıdır; telefonda kurulum boyutu veya açılış hızı ölçümü değildir.
- Son AAB manifesti, ilk v5 adayın derlenmiş manifestiyle birebir aynıdır. **18 URL/renk/ayar değeri** derlenmiş kaynaklardan karşılaştırılarak aynı bulundu. Package ID, izinler, AppLinks, TWA origin, FileProvider, tema ve devre dışı notification delegation korunuyor; yalnız ad ve launcher görselleri güncellendi.
- Üç uygulama sınıfının override'ları ilk adayda decompile edilip karşılaştırılmıştı. Bu ad/görsel güncellemesinde Java, bağımlılık veya imzalama yapılandırması değişmedi.

Yerel Windows çalışma klasörünün Unicode adı için yalnız derleme komutuna `-Pandroid.overridePathCheck=true` verildi; kaynakta bu korumayı kapatan ayar yoktur. Bu makinedeki Java AF_UNIX/loopback sorunu da yalnız process ortamında JDK'nin TCP fallback yoluyla aşıldı. Sistem PATH/registry değiştirilmedi.

Güncel aday ve kanıtlar ignored `artifacts/android-branding-2026-10-20/` altındadır: `elifa-mushaf-v5-branding-unsigned.aab`, `validation.json`, `build-lint.log`, `bundletool-validate.log`, `compiled-appName.txt`, `compiled-launcherName.txt`, `compiled-manifest.xml`, `compiled-resources.txt`, `launcher-preview.png`. İlk adayın tarihsel kanıtları `test-results/android-review/` altında tutulur.

## Kapanmayan kapılar

1. Mevcut upload anahtarı/parolası ve Play App Signing sertifikasının doğrulanması; imzasız aday mağazaya yüklenemez.
2. Fiziksel cihaz/dahili Play kanalında mevcut uygulamanın üzerine güncelleme, veri/oturum korunması, ses ve geri hareketi, Android 15/16 edge-to-edge kabulü.
3. Play Console'un bu son AAB için yeni analizi. AndroidX uyumluluk kodundaki bazı eski Window API referansları hâlâ bulunur; deprecated API mağaza uyarılarının tamamının kalktığı iddia edilmez.
4. Android 5.0/5.1 desteği minSdk 23 gereksinimi nedeniyle yeni adayda yoktur. VersionCode 5'in tüm Play kanallarından yüksek olduğu yüklemeden önce kontrol edilmelidir.

Kaynaklar: [AGP 9.0 uyumluluk](https://developer.android.com/build/releases/agp-9-0-0-release-notes), [Android imzalama](https://developer.android.com/studio/publish/app-signing), [Browser Helper 2.7.3](https://github.com/GoogleChrome/android-browser-helper/tree/android-browser-helper-2.7.3).
