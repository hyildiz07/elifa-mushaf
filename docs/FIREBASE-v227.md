# Firebase geçişi — v227
27 Eylül 2026

## Durum
Firebase canlı bağlantısı kuruldu; Google ve e-posta/şifre sağlayıcıları etkin. Kaynak ZIP yalnızca kaynak pakettir; statik Netlify Drop yüklemesi sunucu fonksiyonlarını dağıtmaz. Dağıtım sonuçları aşağıda kaydedilir.

Mevcut proje konsolda doğrulandı: `elifa-mushaf`, Spark, Firestore `(default)` / `eur3`. E-posta/şifre ve Google etkin. mushaf.elifaplatform.com yetkili alanlara eklendi. Varsayılan e-posta şablonu dili Türkçe; doğrulama ve şifre sıfırlama Firebase varsayılan eylem sayfasına gider. Aynı e-postalı hesapların bağlanması seçili. Var olan duyuru ve istatistik koleksiyonları korunur. Gerçek kullanıcılara test e-postası gönderilmedi, gerçek hesap oluşturulmadı veya silinmedi.

## Uygulama
- Hesapsız okuma/dinleme; Firebase Authentication ile Google veya e-posta/şifre.
- E-posta doğrulama, yeniden gönderme/kontrol, şifre yenileme, çıkış, yeniden doğrulayarak hesap silme.
- Hesap başlığı yalnızca “Hesap”; ad/takma ad alanı ve isim gösterimi yok.
- Mevcut e-posta hesabına Google bağlama. Başka hesaba bağlı Google kimliği hatası yedekleri birleştirmez.
- Kullanıcı onaylı 20 sürümlü kişisel yedek, listeleme, geri yükleme, tek yedek silme; otomatik eşitleme yok.
- Notlar dahil yedekler uçtan uca şifreli değildir. Yedek başına bulut sınırı 900 KiB, yerel dosya sınırı 1 MiB.
- Sunucu her istekte Firebase ID token, iptal durumu, güncel kullanıcı durumu ve beklenen kullanıcıyı doğrular. Yedekler yalnızca doğrulanmış e-postayla kullanılabilir. Hesap silmek için son 5 dakikada yeniden kimlik doğrulama gerekir.
- Silme işareti aynı anda gelen kayıt isteklerini engeller; kimlik silme başarısızsa tekrar denenebilir.
- Tarayıcıdan özel Firestore koleksiyonlarına doğrudan erişim kapalıdır; sadece Netlify sunucusu erişir.
- Anonim giriş kaldırıldı. Genel duyurular kimlik gerektirmeden okunur. Firebase Analytics devam eder; eski tarayıcı kaynaklı Firestore sayaç yazımı durduruldu. Eski admin istatistik ekranındaki sayaçlar bu nedenle yeni sürüm kullanımını saymaz; kullanım raporu Analytics'ten izlenir.
- Yönetici kuralı e-posta eşleşmesi yerine mevcut yöneticinin sabit UID'sini kullanır; yeni kullanıcılar duyuruları/istatistikleri değiştiremez.

## Veri yapısı
`elifaAccounts/{uid}/backups/{uuid}`: zaman damgası ve doğrulanmış JSON.
`elifaAccounts/{uid}`: güncelleme/silinme durumu; e-posta ve parola kopyalanmaz.
`elifaOrgRecords/{base64url(key)}`: Birlikte verisi, silinme işareti.
`elifaOrgMeta/lock`: aynı anda gelen oy/katkı/cüz alma işlemlerini seri hale getirir.
Mevcut Netlify Blobs kayıtları ilk erişimde işlem içinde taşınır; eski kopya silinmez. Silinme işaretleri eski verinin yeniden görünmesini engeller. Eski Blobs kopyalarının erişimi ve saklama süresi ayrıca yönetilmelidir. Firestore üzerinde yeni yazılar başladıktan sonra eski sürüme doğrudan dönmek yeni katkıları kaybettirir; geri dönüş önce güncel Firestore verisini dışa aktarma/uyumlu sunucu dağıtımı gerektirir.

## Canlı etkinleştirme
1. Google sağlayıcısını etkinleştir; destek e-postasını ve uygulama adını belirle. Firebase Auth yetkili alanlarına gerçek site `mushaf.elifaplatform.com` ekli olmalı. Kontrol edilecek önizleme alanı da tam adıyla eklenmeli; joker alan kullanma.
2. E-posta şablonlarının dili/göndereni ve doğrulama/şifre sıfırlama bağlantılarını gerçek alan üzerinde kontrol et. Uygulama kendi `mode/oobCode` eylem bağlantılarını da işler; Firebase varsayılan barındırılan eylem sayfası desteklenir.
3. Netlify Functions için ayrı sunucu kimliği sağla: Firebase kullanıcı okuma/silme (`firebaseauth.users.get`, `firebaseauth.users.delete`) ve Firestore veri işlemleri. Owner/Editor verme. Tercih yönetilen kimlik; JSON anahtarı gerekirse sadece Netlify gizli Functions ortamına `FIREBASE_SERVICE_ACCOUNT` olarak konur, kaynakta/sohbette gösterilmez. `FIREBASE_PROJECT_ID=elifa-mushaf`.
4. `firestore.rules` ve alan indeks istisnalarını inceleyip yayımla. Mevcut rules sürümü konsolda geri dönüş için mevcut; öneri admin UID'sini değiştirmez. Yeni özel koleksiyonları hiçbir istemciye açma.
5. Mevcut Netlify projesini ve `ELIFA_ADMIN_SECRET` değerini koru. `npm run build`, publish `dist`, functions `netlify/functions`; Node 22.12+ / 24.
6. Önizlemede hesap girişini, kullanıcıya ait test yedeğini ve mobil Google popup davranışını kontrol et. Google gerçek sağlayıcı uçtan uca testi kullanıcı katılımı gerektirir; emülatör testi bunun yerine geçmez.
7. **Birlikte geçişi:** İlk canlı dağıtımda `ELIFA_FIRESTORE_GROUPS` kapalıdır; Birlikte istekleri geçici olarak hata verir. Eski sürümde çalışan yazma isteklerinin bitmesini bekle; Blobs kopyasını koru. Sonra aynı sitede `ELIFA_FIRESTORE_GROUPS=enabled` ile etkinleştir. Böylece önizleme veya eski sürüm yazıcıları açıkken erken kopyalanmış veri oluşmaz.
8. Fonksiyonlara ve canlı hesaba son kontrol; iki cihazda kontrollü yedek aktarımı. v227 bu adımlar tamamlanmadan canlıya hazır sayılmaz.

## Testler
- Standart testler: 54 geçti; emülatör gerektiren iki ana test standart koşuda açıkça atlanır.
- Emülatör entegrasyonu: 10 test geçti; token/origin, kullanıcı ayrımı, doğrudan Firestore erişimi, 20 yedek sınırı, eşzamanlı yazma, silme hatası ve tekrar deneme, devre dışı kullanıcı, Birlikte oy/cüz/katkı çakışması ve geri alma.
- Tarayıcı: yerel test hesabıyla giriş, yedek oluşturma/liste, çıkış doğrulandı.
- Önceki ses testleri ve 6.236 âyet/metin bütünlüğü testleri geçti; bu değişiklik Arapça metinleri değiştirmez.
- Bağımlılık denetimi: üretim bağımlılıklarında bilinen açık yok. Geliştirme amaçlı Firebase CLI zincirinde OpenTelemetry kaynaklı 3 orta önem dereceli uyarı var; otomatik düzeltme eski CLI ana sürümüne dönüş istiyor. Üretim fonksiyonlarına bu CLI paketi alınmaz.
- Üretim sunucu kimliğiyle mevcut kullanıcı ve Firestore duyuru belgesi salt okunur olarak doğrulandı. Canlı Google girişi kullanıcı tarafından başarılı doğrulandı; Android/iOS fiziksel cihaz kapsamı ve iki cihazlı yedek aktarımı ayrıca doğrulanmalıdır. Sıfır hata veya bütün kayıtların uzman dinleme onayı iddiası yok.

## Yerel test
Java 21 ve Firebase CLI gerekir. Windows:
`powershell -File scripts/start-emulators.ps1`
Ayrı terminalde `npm run dev`, sonra `npm run test:firebase`.
Yerel uygulama her zaman `demo-elifa-mushaf` emülatörünü kullanır; gerçek Firebase'e kayıt yazmaz.

Kaynaklar: [Firebase Google girişi](https://firebase.google.com/docs/auth/web/google-signin), [hesap bağlama](https://firebase.google.com/docs/auth/web/account-linking), [Admin SDK](https://firebase.google.com/docs/admin/setup), [emülatör kurulumu](https://firebase.google.com/docs/emulator-suite/install_and_configure).

## Uygulanan altyapı
- Sunucu kimliği: `elifa-netlify-server@elifa-mushaf.iam.gserviceaccount.com`. Özel rol yalnızca kullanıcı okuma/silme; ayrıca Cloud Datastore User. Owner/Editor verilmedi.
- Firestore kuralları canlıda yayımlandı; yönetici mevcut UID, özel yedek/grup koleksiyonları istemciye kapalı. `backups.payload` ve `elifaOrgRecords.value` alanlarının indeksleri kapalı.
- `FIREBASE_PROJECT_ID` ve gizli `FIREBASE_SERVICE_ACCOUNT`, yalnızca Functions kapsamında production ve deploy-preview ortamlarında doğrulandı.
- Kullanılmayan ilk anahtar kullanıcı onayıyla silindi. Kullanılan yüklenmiş anahtar **27 Eylül 2027 tarihinde sona erer; bu tarihten önce yenilenmelidir**.
- Google destek adresi kullanıcının açık onayıyla mevcut Gmail adresidir; Google girişinde görünebilir.
- Önizleme dağıtımı `6ab90fd210b8d63d99d93ce0`: Netlify API durumu ready. Bu ağda netlify.app adresi bağlantı sıfırlaması verdiği için tarayıcı kontrolü asıl alan üzerinden yapılır.

## Netlify çalışma ortamı uyumluluğu
Firebase Admin 14.5.0 → jwks-rsa 4 → jose 6 zinciri, Lambda tarafından kapatılan require(ESM) desteğine dayanıyordu; canlı ilk kontrolde ERR_REQUIRE_ESM ile yakalandı. Sunucu Firebase Admin 13.10.0 sürümüne sabitlendi. Google istemci bağımlılıklarındaki uuid paketleri CommonJS uyumlu düzeltilmiş 11.1.1+ sürümüne yükseltildi; üretim denetimi sıfır bilinen açık verdi. Deneysel çalışma özellikleri açılmadı. Yeni test üç fonksiyonu Lambda ile aynı --no-experimental-require-module ve --no-experimental-detect-module bayraklarıyla yükler. 54 genel ve 10 emülatör testi bu bağımlılıklarla tekrar geçti.
[Lambda modül davranışı](https://docs.aws.amazon.com/lambda/latest/dg/lambda-nodejs.html), [Firebase sürüm notları](https://firebase.google.com/support/release-notes/admin/node).

## Son canlı doğrulama
27 Eylül 2026: üretim dağıtımı `6ab912150b89b535785626a3`, https://mushaf.elifaplatform.com/. Sürüm uç noktası v227 döndü. Hesap API’si oturumsuz ve bozuk token isteklerine 401 döndü; Birlikte pollGet 200 döndü. Eski yazıcılar durduktan sonra ELIFA_FIRESTORE_GROUPS yalnızca production ortamında enabled yapıldı. discoverConfig/discoverList kontrolleri: discoverConfig 200, discoverList 200.
Canlı tarayıcıda Hesap başlığı, Google/e-posta seçenekleri ve ad alanı olmaması doğrulandı. Codex iç tarayıcı Google açılır penceresini tamamlayamadı. Kullanıcı kendi tarayıcında canlı Google girişini denedi ve “Google ile giriş başarılı” olarak doğruladı. Gerçek kişiye e-posta gönderimi, hesap silme ve iki fiziksel cihaz testi yapılmadı.
Netlify Functions ortamında mevcut ELIFA_ADMIN_SECRET bulunmadı; anket/yayın keşif yönetiminde eski paylaşılan gizli anahtar akışı yapılandırılmamış durumdadır. Bu çalışma yeni bir yönetici şifresi üretmedi. Mevcut Firebase duyuru yöneticisi UID yetkisi korunur.
