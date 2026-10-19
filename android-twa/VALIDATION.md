# Android TWA aday doğrulaması — 20 Ekim 2026

Bu rapor imzasız yerel aday içindir. Play gönderimi kullanıcı tarafından yetkilendirilmiştir; mevcut engel upload anahtarının parolasına erişilememesi ve cihaz güncelleme kabulüdür. Anahtar sıfırlama veya imzalama kimliğini değiştirme yapılmadı.

- `:app:bundleRelease :app:lintRelease` başarılı. Son kontrol 33 saniye, 44 task (38 up-to-date).
- Lint **0 hata, 9 uyarı**, baseline/suppression yok. Uyarılar: yeni Gradle sürümü önerisi (1), korunan kare launcher ikonları (5), monochrome ikon eksikliği (1), korunan aynı 1px splash görselinin yoğunluk/tekrar bilgisi (2).
- Kaynak/provenance kontrolü: 16 orijinal kaynak entry'sinin SHA256'sı ve resmi Gradle wrapper JAR/dist checksum doğrulandı.
- Paket `com.elifaplatform.mushaf`, sürüm **5 / 1.1.1**, minSdk **23**, target/compileSdk **36**.
- Android Browser Helper **2.7.3**, AndroidX Browser **1.10.0**; eski **1.9.0-alpha04** yerine sabit sürüm.
- AGP **9.0.1**, Gradle **9.1.0**, JDK **17**, Build Tools **36.0.0**.
- AAB içindeki gerçek R8 **9.0.32** metadata'sı: optimization=true, shrinking=true, obfuscation=true, debug=false, minApi=23.
- `bundletool 1.18.3 validate` çıkış **0**.
- Üretilen AAB **355.008 bayt**; SHA256 `1ad9d0dd28d49cb11818176b110d60d79fd8eef6e5da13c0113a57006340e93f`.
- AAB ZIP içinde `META-INF/*.RSA`, `*.DSA`, `*.EC`, `*.SF` sayısı **0**. Gradle task adındaki `signReleaseBundle` imzalama yapıldığı anlamına gelmez: signing config null ve çıktı imzasızdır. Upload/debug key kullanılmadı.
- Kısmi imzalama ayarı gerçek Gradle configuration testinde paketleme başlamadan reddedildi. Test yalnız sahte bir alias kullandı; anahtar/parola okunmadı, imzalama yapılmadı.
- Önceki AAB 1.035.131 bayttı. Bu yalnız AAB dosya boyutu karşılaştırmasıdır; telefonda kurulum boyutu veya açılış hızı ölçümü değildir.
- Eski/yeni AAB karşılaştırması: **23 metadata entry**, **19 URL/renk/ayar değeri**, izin listesi aynı. AppLinks, TWA origin, FileProvider, tema ve devre dışı notification delegation korunuyor.
- Üç uygulama sınıfının override'ları decompile edilip karşılaştırıldı. Launcher URL/intent delegation ve orientation davranışı korunuyor; yalnız identical API branch'leri sadeleştirildi.

Yerel Windows çalışma klasörünün Unicode adı için yalnız derleme komutuna `-Pandroid.overridePathCheck=true` verildi; kaynakta bu korumayı kapatan ayar yoktur. Bu makinedeki Java AF_UNIX/loopback sorunu da yalnız process ortamında JDK'nin TCP fallback yoluyla aşıldı. Sistem PATH/registry değiştirilmedi. Ayrıntılı komut ve günlükler ignored `test-results/android-review/` altındadır.

## Kapanmayan kapılar

1. Mevcut upload anahtarı/parolası ve Play App Signing sertifikasının doğrulanması; imzasız aday mağazaya yüklenemez.
2. Fiziksel cihaz/dahili Play kanalında mevcut uygulamanın üzerine güncelleme, veri/oturum korunması, ses ve geri hareketi, Android 15/16 edge-to-edge kabulü.
3. Play Console'un bu son AAB için yeni analizi. AndroidX uyumluluk kodundaki bazı eski Window API referansları hâlâ bulunur; deprecated API mağaza uyarılarının tamamının kalktığı iddia edilmez.
4. Android 5.0/5.1 desteği minSdk 23 gereksinimi nedeniyle yeni adayda yoktur. VersionCode 5'in tüm Play kanallarından yüksek olduğu yüklemeden önce kontrol edilmelidir.

Kaynaklar: [AGP 9.0 uyumluluk](https://developer.android.com/build/releases/agp-9-0-0-release-notes), [Android imzalama](https://developer.android.com/studio/publish/app-signing), [Browser Helper 2.7.3](https://github.com/GoogleChrome/android-browser-helper/tree/android-browser-helper-2.7.3).
