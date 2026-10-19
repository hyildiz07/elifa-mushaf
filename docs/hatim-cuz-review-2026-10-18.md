# Birlikte / Hatim ve cüz incelemesi — 18 Ekim 2026

Bu inceleme yerel kaynak ve sahte veri deposuyla yapıldı. Üretim hatimlerine katılım, durum değişikliği veya silme yapılmadı. Bu belge tasarım ve geçiş önerisidir; aşağıdaki yeni yapı henüz uygulanmış sayılmaz.

## Doğrulanmış sorunlar

1. **Başkasının cüzü değiştirilebiliyor.** `netlify/functions/org.mjs` içindeki `release` ve `complete`, yalnız herkese açık organizasyon kodu ve cüz numarasıyla çalışıyor. Ad, sahiplik veya hesap doğrulanmıyor. `index.html` içindeki `bkBindOrgEvents` de bütün alınmış cüzlerde Okudum/Bırak menüsünü açıyor. İstemci düğmesini gizlemek tek başına çözüm değildir; sunucuda yetki zorunludur.
2. **Okudum geri alınamıyor; kişisel geçmiş kayboluyor.** `bkComplete` yerel `claimed[code]` dizisinden cüzü siliyor. Tamamlanmış cüze normal dokunma eylemi yok. Bu nedenle kişi yanlış işareti geri alamıyor, Benim Cüzlerim de geçmiş listesi olamıyor.
3. **Hesap girişinin cihazlar arası cüz erişimi sağladığı söylenemez.** `src/account-data.mjs` içindeki `BACKUP_KEYS`, `elifa_birlikte_v1` anahtarını taşımıyor. Bu, gizli yönetici anahtarlarının genel yedeğe sızmasını önlüyor; ancak oturum açmak tek başına cüz sahipliğini hesaba bağlamıyor. Hesaba özel sunucu üyelik kaydı gerekir.
4. **Sunucu kayıtları sessizce kalıcı silinebiliyor.** `netlify/functions/org-cleanup.mjs`, tamamlanmış organizasyonu son etkinlikten 7 gün, diğerini 60 gün sonra siliyor; günlük zamanlanmış görev çalışıyor. Yalnız cihaz verisi kaybı uyarısı bu davranışı açıklamaz. Kurtarma bağlantısı silinmiş sunucu kaydını geri getiremez.
5. **Katılım ve gizli yönetim bağlantıları birlikte kopyalanıyor.** `bkCopyLinks`, tek panoya ikisini birden koyuyor. Katılım paylaşımı yalnız `?k=` içermeli. Yönetici yedeği ayrı ve açıkça özel olmalı.
6. **A organizasyonundan geç dönen yanıt B ekranına yazılabiliyor.** `bkSilentRefresh`, isteği gönderdikten sonra `bkCurrent` kimliğini tekrar kontrol etmiyor. Aynı risk `bkOpen` yarışı ve işlem geri dönüşlerinde de vardır. İstek, ekran kodu/anahtarı ve nesil numarasıyla sınırlandırılmalı; yerel sonuç işlem yapılan organizasyona kaydedilmeli.
7. **Son gün bir gün fazla görünüyor.** `bkDue`, gün sonuna kalan saati `Math.ceil` ile yuvarlıyor. Bugün `due_left:1`, dünün geç saati ise `due_today` ve `late:false` olabiliyor. Takvim günü üzerinden karşılaştırılmalı; tarih biçimi doğrulanmalı.
8. **Kısmi cüz çalışmasına hatim tamamlandı deniliyor.** API 1–30 arası herhangi bir benzersiz cüz alt kümesini kabul ediyor; `renderOrg`, tüm mevcut satırlar okunduğunda hatim bitti diyor. Tam hatim için 1–30'un tamamı şart olmalı. Eski kısmi kayıtlar silinmeden “Cüz çalışması tamamlandı” şeklinde gösterilmeli.
9. **Keşifte boş cüz bulunmadığı halde Cüz al çıkabiliyor.** `bkDiscRender` doluluğu `done >= total` üzerinden hesaplıyor; tüm cüzler alınmış ama henüz okunmamışsa `taken` dikkate alınmıyor. Bu durumda “Boş cüz yok · Takip et” görünmeli; ayrıntıya erişim kapanmamalı.
10. **Açık/bağlantıyla katılım oluşturma anında seçilemiyor.** API her yeni kaydı `public:false` oluşturuyor; sonradan yönetici publish yapabiliyor ve keşif global ayara bağlı. İki görünürlük seçeneği hem UI hem sunucuda açık olmalı; keşif kapalıysa açık oluşturma sessizce özel yapılmamalı.

İlk 6 sorun doğrudan doğruluk/güvenilirlik önceliğidir. Kanıt komutu: `node scripts/review-birlikte-local.mjs`; sonuç: `test-results/birlikte-local-review.json`. Bu betik bazı mevcut hataları beklenen sonuç olarak kaydeder; düzeltme sonrası kalıcı regresyon testleri doğru davranışı beklemelidir.

## Sade, kullanışlı mobil yapı

Başlık **Birlikte Hatim**. Üç küçük sekme: **Açık Hatimler**, **Benim Cüzlerim**, **Oluşturduklarım**. Bir ana eylem: **Hatim oluştur**; ikincil küçük eylem: **Bağlantıyla katıl**. Toplu zikir oluşturma ve keşif menüleri kaldırılır; mevcut kayıtlar silinmez ve eski bağlantıdan açılmaya devam eder.

- Açık hatim kartı: başlık/niyet, isteğe bağlı yönetici görünen adı, hedef tarih, `12 / 30 okundu`, `4 boş cüz`, küçük ilerleme çizgisi. “Cüz seç” veya “Boş cüz yok · Görüntüle”. Ekran kartlarla doldurulmaz; mobilde sıkı satır düzeni, büyütülebilir ayrıntı.
- Ayrıntı: 30 erişilebilir cüz düğmesi. Renge ek olarak **Boş / Bende / Alındı / Okundu** metni veya simge; yalnız renk kullanımı yok. Cüz seçmeden önce son sunucu durumu doğrulanır. Aynı cüzü eşzamanlı seçen iki kişiden yalnız biri başarılı olur.
- Benim Cüzlerim: **Okunacaklar / Tamamladıklarım**. Hatim, cüz, tarih ve **Okumaya başla / Okudum / Bırak / Okudum işaretini geri al**. Reader'da ilgili cüz açılır; dinlemek veya sayfayı açmak otomatik tamamlanma sayılmaz.
- Oluşturduklarım: yöneticiye açık/bağlantıyla görünürlük, başlık/son gün düzenleme, boş cüz paylaşma ve açıkça etiketlenmiş durum düzeltme. Yönetici başkasının yerine yeni bir kişisel sahiplik üretmez; atama adını görünür olarak düzeltebilir.
- Paylaşım: sistem paylaşım sayfası, destek yoksa katılım linkini kopyala. “Yönetici erişim yedeği” ayrı yerde; katılım linkiyle asla beraber kopyalanmaz.
- Kişiler gerçek ad yerine takma ad kullanabilir. Tam isim zorunlu değil; doğum tarihi/cinsiyet bu işlev için gerekmez. Profil bilgisi açık hatim kartlarına otomatik taşınmaz.
- İlk sürümde forum yerine niyet metni, sayılar ve ortak ilerleme yeterli etkileşim sağlar. Yorumlar sonra ayrı izin, raporlama ve yönetim işi olarak ele alınmalı; hatim verisine kontrolsüz metin dizisi eklenmemeli.

## Hesapsız katılım ve kurtarma

Herkes boş cüz seçebilir; hesap açmak şart değildir. Kişiye yalnız bir görünen ad sorulur. Onaydan önce kısa bilgi:

> Hesapsız katılıyorsun. Bu cihazın verileri silinirse cüzüne erişimini kaybedebilirsin. Sana özel dönüş bağlantısını sakla. İstersen daha sonra hesabına bağlayabilirsin.

Katılımın ardından **Cüzüme dönüş bağlantısını sakla** ve **Hesabıma bağla** sunulur. Sunucu kaydı ve kişisel erişim ayrıdır: cihaz verisi kaybolunca cüz otomatik boşa düşmez; diğer katılımcı da sahiplenemez. Kurtarma bağlantısı sahibinin cüzünü yönetme yetkisi taşır; genel paylaşım değildir. Birden çok cüz tek kişisel üyeliğe bağlanabilir, fakat bırakılmış ve yeniden alınmış cüzün eski anahtarı geçersizleşir.

Teknik yaklaşım: her claim için rastgele, tahmin edilemez en az 32 bayt anahtar; sunucuda yalnız hash. Public org görünümünde anahtar veya hash çıkmaz. Oturumlu kullanıcı UID'si doğrulanmış Firebase token'ından alınır; payload'daki UID/name yetki değildir. Hesaba bağlama, o anki kişisel anahtarı VE doğrulanmış hesabı gerektirir; farklı hesabın sahipliği sessizce devralınmaz. Hesap değişince eski hesabın Benim Cüzlerim listesi yeni kullanıcıya gösterilmez.

Anahtar tercihen URL fragmentinde taşınır (sunucu erişim günlükleri/Referer'e eklenmez); açılınca kullanıcı onayıyla yerel güvenli depoya alınır ve adres çubuğundan temizlenir. Katılım `?k=` ve yönetici `?y=` rotalarıyla çakışmayan belirgin ayrı kurtarma rotası kullanılmalıdır. Native uygulama yönlendirmesi de aynı sözleşmeyi korumalıdır.

## Legacy veri ve yayın geçişi

1. Mevcut `bos/alindi/okundu`, kişi adları ve yönetici anahtarları korunur. İzin kanıtı olmayan eski `alindi/okundu` satırları “eski kayıt” olarak kalır; herkese açık koda veya ada dayanarak sessiz sahiplik verilmez.
2. Yönetici eski katılımcı için bir defalık kişisel dönüş yetkisi oluşturabilir. Kişi bu bağlantıyı alıp açıkça onaylayınca yeni sahiplik bağlanır. Doğru kişiye gönderme organizatörün işidir; uygulama kullanıcının onayı olmadan mesaj göndermez.
3. Yalnız `bkLocal.claimed` listesi güvenilir sunucu yetkisi değildir. Kullanıcıya “Eski katılımın bulundu, yöneticiden dönüş bağlantını iste” gösterebilir; otomatik yetki kazandıramaz.
4. Eski uygulama sürümlerinin yetkisiz release/complete istekleri sunucuda reddedilmelidir. Anlaşılır “Güncelle / yöneticiye başvur” mesajı gerekir. Eski istemcilere güvenliksiz uyumluluk devam ettirilmez; yeni claim yanıtı kaybolursa idempotent claim işlem anahtarıyla geri alınabilmelidir.
5. Otomatik silme, kalıcı hatim geçmişi beklentisiyle birlikte yeniden tasarlanır. Tamamlananlar salt okunur arşive taşınabilir; aktif ve kişisel erişim kayıtları 7 gün dolunca sessiz silinmez. Saklama süresi ürün kararı olarak kullanıcıya açıklanır; bu inceleme hiçbir kaydı silmez veya süresini değiştirmez.

## Test kabul listesi

- A ve B aynı cüzü aynı anda alır: tek başarı; başarısız olan kişiye yanlışlıkla sahiplik verilmez.
- Claim başarılı, yanıt kayıp: aynı mantıksal işlem yeniden gönderilince aynı kişisel erişim döner; cüz ikinci kez alınmaz.
- Herkese açık kodla başkasının complete/release/undo'su 403; benzer ad veya payload UID'si de reddedilir.
- Kendi okudum/geri al işlemi idempotent; tekrarlanan ağ isteği geçmişi veya sayacı çoğaltmaz.
- Bırakılan cüzü yeni kişi alınca eski dönüş bağlantısı hiçbir yetki vermez.
- Organizatörün explicit admin düzeltmesi, eski kişisel yetkiyi gerektiğinde iptal eder; salt başlık/tarih değişimi iptal etmez.
- A hatmi isteği sürerken B'ye gidilir: A sonucu B kartına yazılmaz. Geri gelince A sunucudan doğru okunur.
- Hesapsız cihaz verisi kaybı, özel linkle kurtarma, hesap A'dan çıkıp B'ye girme, aynı hesaba iki cihazdan erişim.
- Tam 30 cüz bitince hatim tamamlandı; 4 cüzlük legacy çalışma bitince yalnız cüz çalışması tamamlandı.
- Hepsi alındı/hiç boş yok ama bitmedi durumu ve tamamlandıktan sonra yanlış işareti geri alma.
- Bugün/dün/yarın, saat dilimi değişimi, geçersiz tarih; tarih opsiyonelken hata üretmeme.
- Keşif kapalı/açık, özel hatim hiç keşifte görünmeme, açık hatimden kaldırma, boş/ağ hatası/yükleniyor durumları.
- Katılım paylaşımında yönetici/kurtarma anahtarının asla bulunmaması; publicView'da hash veya UID sızmaması.
- Geçmişteki toplu zikir kaydı ve doğrudan linki korunurken yeni Hatim menüsünde zikir bulunmaması.

## Maliyet ve istek yükü (fiyat tahmini değildir)

Mevcut `bkOpen` açık detayda 20 saniyede bir polling başlatıyor. Görünürlük/odak olmadığında durdurmak, aynı sayfa için yinelenen isteği birleştirmek ve hareket sonrası tekrar çekmek gereksiz okumayı azaltır. `discoverList` tek çağrıda 60 organizasyon okuyabiliyor; sayfalama ve küçük özet indeks daha uygun. Ortak `elifaOrgMeta/lock` bütün yazmaları tek kilitte serileştiriyor; büyümede grup başına işlem kilidi/record yaklaşımı gerekir. Bugünkü somut limit ve fiyatlar canlı hesaptan ölçülmeden “ücretsiz kalır” sözü verilmemeli. İlk sürüm avatar yüklemesi/forum/sürekli gerçek zamanlı abonelik olmadan tutulursa depolama küçük kalır; gerçek istek sayısı izlenmelidir.
