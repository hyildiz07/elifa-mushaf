# Hatim API sözleşmesi — 18 Ekim 2026

`POST /api/org`, JSON. Üyelik zorunlu değil. Oturum varsa `Authorization: Bearer <Firebase ID token>` ve JSON içinde `expectedUser:<uid>` birlikte gönderilir. Sunucu tokenı ve güncel hesabı doğrular; payload içindeki `uid`, `ownerUid`, ad veya takma ad yetki değildir. Native CORS Authorization başlığını destekler.

## Kişisel yetki

Her cüz alınmadan **önce** istemci `crypto.getRandomValues(new Uint8Array(32))` ile **64 hex** `capability` oluşturur ve cihazda kaydeder. İstek aynı anahtarla yinelenir; yanıt kaybolunca yeni anahtar üretmek başarıyla alınmış cüzde çakışma yaratır. Anahtar yalnız gönderici cihazda/dönüş bağlantısındadır; sunucu yalnız hash tutar. Anahtarları genel paylaşım linkine koyma.

Bitmiş/bırakılmış katılımın veya yenilenmiş dönüş bağlantısının eski anahtarı yeni bir katılımda tekrar kullanılamaz. Yeni gerçek katılım yeni anahtar; mevcut işlemin kayıp yanıt tekrarı aynı anahtardır. Sunucu satırda kullanılan anahtarların hash geçmişini korur: gecikmiş eski yönetici kurtarma isteği, daha sonra hazırlanmış güncel bağlantıyı iptal edip eski anahtarı yeniden etkinleştiremez; 409 döner.

Yeni hatim oluşturmada da ayrı bir `creationToken:64hex` istek alanı kullanılmalıdır. İstemci bunu ilk istekten önce saklar, aynı formun ağ tekrarında aynısını kullanır. Aynı token ve içerik tek hatmi ve aynı özel yönetim anahtarını geri verir; içerik değişmişse yeni oluşturma anahtarı gerekir. Eski istemci uyumluluğu için alan opsiyoneldir; yeni arayüz atlamamalıdır.

Sunucu görünümü:

```
{code,org:{type,title,adminName,dueDate,createdAt,public,archived,
  isAdmin,fullHatim,complete,
  items:[{no,name,status,ts,mine,legacy}]}}
```

`status`: `bos | alindi | okundu`. `mine`, o isteğin hesap/yetki bağlamında hesaplanır. UID, hash, kişisel/yönetici anahtarı org görünümünde çıkmaz. Tamamlanmış eski kısmi çalışmada `complete:true,fullHatim:false`; “Hatim tamamlandı” yerine “Cüz çalışması tamamlandı” denmelidir.

## İşlemler

| action | Alanlar | Sonuç / kural |
|---|---|---|
| `create` | `org:{type:'hatim',title,adminName?,dueDate?,public:boolean,items:[{no:1},...,{no:30}]}` | `{code,adminToken,org}`. Yeni yönetici anahtarı 32 karakter; eski 12 karakter anahtarlar geçerli. Oturum varsa kurucunun hesabına da bağlanır. |
| `get` | `code` veya `admin`; isteğe bağlı `capabilities:{'1':<token>,...}` | Kişiselleştirilmiş org; tek token için `capability` de kullanılabilir. |
| `claim` | `code,no,name,capability` | `{code,org,claimedNo}`. 2–60 karakter görünen ad/takma ad. Aynı token tekrarı başarı; başkasının dolu cüzü 409. Oturum varsa cüz hesaba bağlanır. |
| `complete` | `code,no,capability?` | Yalnız sahibi; `okundu`. Hesap sahibi token olmadan işlem yapabilir. |
| `undo` | aynı | Yalnız sahibi; `okundu → alindi`. Tekrarı zararsız. |
| `release` | aynı | Yalnız sahibi; `bos`. Son aynı sahibin bırakma isteği tekrarlanabilir; yeni kişi alınca eski anahtar geçersizdir. |
| `issueRecovery` | `code,admin?,no,capability:<yeni token>` | **Açık yönetici işlemi**. Mevcut ad/durum korunur; önceki kişisel yetki ve hesap bağlantısı kaldırılır. `{code,org,recoveryNo}`. Yönetici, dönüş bağlantısını doğru kişiye kendisi verir. |
| `bind` | `code,no,capability` + doğrulanmış oturum | Misafir sahipliği kanıtıyla hesaba bağla. Aynı hesap tekrarı güvenli; başka hesaba bağlıysa 409. Bağlandıktan sonra misafir linki tek başına işlem yaptıramaz; o hesapla giriş gerekir. |
| `bindAdmin` | `code,admin` + oturum | Özel yönetici anahtarıyla yönetimi hesaba bağla; farklı hesap zaten bağlıysa 409. |
| `myList` | oturum, `cursor?` | `{items:[{code,title,type,dueDate,createdAt,isAdmin,archived,items:[owned item]}],nextCursor:null|number}`. En fazla 30 indeks kaydı tarar; `nextCursor` varsa devamı istenir. |
| `adminSet` | `code,admin?,no,status` | Yöneticiye özel açık durum düzeltme. `bos` yapılınca kişisel yetki kaldırılır. Yönetici normal owner eyleminde ayrıcalık kullanmaz. |
| `update` | `code,admin?,title?,dueDate?` | Yönetici başlık/tarih değiştirir. Geçersiz gün (`2026-02-30`) reddedilir. |
| `publish` | `code,admin?,public:boolean` | Yönetici açık/özel değiştirir. Keşif kapalı olsa da açık listeden kaldırmak serbesttir. |
| `archive` / `reopen` | `code,admin?` | Yönetici arşivler/yeniden açar. Arşivleme açık listeden çıkarır, veriyi ve linkleri silmez. Yeniden açma kendiliğinden herkese açık yapmaz. |

Yönetici hesabı `org.isAdmin:true` olduğunda `admin` anahtarı gerekmez; `code` + doğrulanmış oturum yeterlidir. Katılım, yönetici ve cüze dönüş bağlantıları üç ayrı anlam taşır.

`create public:true`, keşif global ayarı kapalıysa 403 döner; sessizce özel oluşturulmaz. `discoverList` yalnız açık, arşivlenmemiş hatimleri verir. Her özetin `available,taken,done,total,fullHatim,dueDate` alanları vardır. `available:0` ise “Boş cüz yok · Görüntüle”; `done===total` ise tamamlanma etiketi, ayrıntıya erişim yine açık olmalıdır.

## Korunan legacy davranış ve arşiv

Eski toplu zikir linkleri, verileri ve katkı API'si korunur; yeni Hatim arayüzü onları listelemez/oluşturmaz. Sahipliği doğrulanamayan eski cüzler isim eşleşmesiyle otomatik sahiplenilmez; yönetici `issueRecovery` verir.

Günlük bakım artık kayıt/admin anahtarı **silmez**. Önceki 7 gün tamamlanmış / 60 gün hareketsiz eşikleri yalnız arşivleme ve açık listeden kaldırma içindir. Kişisel “Okudum/geri al/bırak” erişimi korunur; kişinin işlemi organizasyonu yeniden etkin kılar, fakat kendiliğinden herkese açık yapmaz.

`server/hatim-account.mjs` içindeki `releaseAccountHatimOwnership(uid)` yalnız açık hesap silme akışında, profilin silme kilidinden sonra ve Auth hesabı silinmeden önce çağrılır. Katılım ilerlemesi, hash ve özel yönetim linki kalır; hesap bağı kaldırılır, bağlı cüzde görünen ad “Katılımcı”, yönetici görünen adı boş olur. Özel dönüş linki hesap silinmeden saklanmalıdır. Kalıcı silme-işlemi işareti, önceden doğrulanmış eski oturumun arkadan yeni cüz sahipliği yazmasını da engeller. Kısmi ağ hatasında dizin korunur; yeniden deneme kalan işi tamamlar.

## Test durumu

`node --test tests/hatim-access.test.mjs tests/firebase-unit.test.mjs tests/lambda-runtime.test.mjs` hedefli testleri; sahte depo/gerçek API handler ile yetki, kayıp cevap, geri alma, stale token, kurtarma, hesap ayrımı, açık/özel ve silmeden arşivleme çalıştırılır. `tests/firebase-account.test.mjs` eşzamanlı claim için gerçek Firestore emülatör testi de güncellenmiştir; emülatör olmadan bu iki test atlanır. Bu çalışma üretim verisine yazmaz.
