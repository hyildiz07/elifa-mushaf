# Android TWA aday doğrulaması — 20 Ekim 2026

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
