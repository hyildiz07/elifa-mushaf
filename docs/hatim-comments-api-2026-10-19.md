# Hatim yorumları API sözleşmesi · 19 Ekim 2026

Tüm işlemler mevcut `POST /api/org` üzerinden JSON gönderir. Üye kimliği yalnız Firebase ID tokenının sunucuda doğrulanmasından alınır; `uid`, `ownerUid` veya `emailVerified` istemci alanları yetki sağlamaz. `expectedUser`, tokenın UID değeriyle eşleşmelidir. E-posta doğrulaması güncel Firebase kullanıcı kaydından okunur.

## Üyelik ve mevcut misafir kayıtları

- `discoverList`, herkese açık hatim oluşturma, `publish(public:true)` ve açık hatimden **yeni** cüz alma: giriş yapılmış, e-postası doğrulanmış hesap gerekir.
- Özel/davetli hatim oluşturma, açma ve cüz alma misafir için devam eder. Açık hatim ayrıntılarını kod/bağlantıyla görüntülemek de doğrulanmış üyelik gerektirir; mevcut kendi cüzünün kişisel anahtarı veya yönetici kurtarma yetkisi bu görüntüleme kapısından muaftır.
- Önceden açık hatimden cüz almış misafir; kendi kişisel anahtarıyla okundu, geri al, bırak ve kayıp yanıtın aynı anahtarla tekrarını kullanabilir. Yeni açık cüz alamaz.
- Yorum okuma/yazma ve bildirme doğrulanmış üyelik gerektirir. Geçerli özel yönetici anahtarı bulunan eski misafir yönetici, yorum ayarlarını ve bildirim/gizleme işlemlerini yönetebilir.
- Önizlemelerde canlı hesap tokenları önceki gibi reddedilir; bu kurallar önizleme için sahte üyelikle aşılmaz.

## İşlemler

Her istekte `code` hatim kodudur. Yorum/bildirim kimliği sunucunun ürettiği `13 basamak zaman-16 hex` biçimindedir.

| action | Ek alanlar | Başarılı yanıt |
|---|---|---|
| `commentList` | `cursor?` | `comments`, `nextCursor`, ortak metadata |
| `commentReplies` | `parentId`, `cursor?` | Son 20 cevap, aynı sayfalama |
| `commentCreate` | `operationId` (64 hex), `text`, `name`, `parentId?` | 201 `{code,comment}`; aynı işlem tekrarında 200 ve `replayed:true` |
| `commentEdit` | `id`, `text` | `{code,comment}`; yalnız yazar |
| `commentDelete` | `id` | `{code,comment}`; yalnız yazar, tekrar güvenli |
| `commentHide` | `id`, `hidden` (boolean) | `{code,comment}`; yalnız yönetici |
| `commentSettings` | `closed` (boolean) | `ok:true` ve ortak metadata; yalnız yönetici |
| `commentReport` | `id` (yorum), `reason` | `{code,ok:true}`; aynı üye/yorum bildirimi tekrarında `replayed:true` |
| `commentReports` | `cursor?` | `{code,reports,nextCursor}`; yalnız yönetici |
| `commentResolveReport` | `id` (bildirim) | `{code,ok:true,resolved:true,id}`; yalnız yönetici, tekrar güvenli |

Ortak metadata: `commentCount`, `rootCommentCount`, `commentsClosed`, `canComment`, `isAdmin`. Aynı alanlar hatmin normal `get` yanıtında da bulunur; kapalı yorum panelinin liste isteği yapması gerekmez. Sayaçlar oluşturulmuş yorum/cevap geçmişini kapsar; silinen yorumlar da geçmişe dahildir.

Yorum görünümü: `id,parentId,text,name,createdAt,updatedAt,deleted,hidden,replyCount,own,canEdit,canDelete,canHide,editedByAdmin,moderatedAt`. Normal yorum API’si UID veya erişim anahtarı döndürmez. Gizlenmiş metin kullanıcıya gösterilmez; yalnız hatim yöneticisi görünümünde `moderatedText` bulunabilir. Bildirim görünümü `id,commentId,reason,createdAt,comment` alanlarıdır; bildiren UID dönmez. Bildirimi kapatmak yorumun kendisini değiştirmez.

## Sınırlar ve davranış

- Metin 1–1500 karakter, görünen ad/takma ad 2–60, bildirim nedeni 1–500 karakterdir. İçerik düz metindir; arayüz HTML olarak çalıştırmamalıdır.
- Cevaplar yalnız kök yoruma verilir; ikinci seviyeye cevap verilemez. Silinen/gizlenen köke yeni cevap eklenmez, mevcut cevaplar korunur.
- Kök yorum ve cevap listeleri en yeniden eskiye, en fazla 20 kayıt döndürür. `nextCursor` son taranan kimliktir; boş bir bildirim sayfasında bile eski kayıtlar varsa cursor bulunabilir. Yalnız ilgili hatim/kök anahtar öneki sorgulanır; genel tarama yapılmaz.
- Hatim başına 5000 yorum/cevap; kök başına 200 cevap sınırı vardır. Ana hatim belgesine yorum metinleri eklenmez.
- Üye başına yeni yorum: en az 3 saniye ara, 10 dakikada 10, 24 saatte 50. Düzenleme/silme dakikada 30; bildirim saatte 5. Aynı işlem tekrarları ve değişmeyen düzenleme kota tüketmez.
- `operationId`, gönderimden önce istemcide oluşturulup saklanır. Ağ hatasında aynı içerik ve anahtarla yeniden denenir; aynı anahtarla farklı içerik 409 döndürür.
- Arşiv veya kapalı yorumlar yeni yazı/düzenlemeyi engeller; yazar kendi yorumunu silebilir, hatim yöneticisi moderasyonu sürdürebilir. Sıradan hatim yöneticisi başkasının sözünü düzenleyemez, yalnız gizleyebilir. Ayrı uygulama yönetim panelinin yetkili moderasyonu aşağıda açıklanmıştır.
- Silme metni ve adı temizler, `Bu yorum silindi` yer tutucusunu bırakır. Yorum geçmişi bulunan hatim silinemez; arşivlenebilir.

## Hatalar

`{error,errorCode}` döner. `AUTH_REQUIRED` 401, `EMAIL_UNVERIFIED` 403, `COMMENT_FORBIDDEN` 403, `COMMENTS_CLOSED` 409, `COMMENT_OPERATION_CONFLICT` 409, `COMMENT_PARENT_UNAVAILABLE` 409, `COMMENT_LIMIT` 409, `COMMENT_RATE_LIMIT` 429. İstemci bunları `error.errorCode` olarak alır; başarıdaki `code` alanı hatim kodu olarak kalır. Sunucu/depo başarısızlığı başarı sayılmaz ve işlem geri alınır.

## Hesap silme

`anonymizeAccountComments(uid,{transaction})`, hesap silme kilidinden sonra çağrılır. Üyenin indeksini 20 kayıtlık işlemlerle gezerek kendi yorum metni/adı/UID bilgisini temizler; başka üyelerin cevaplarını korur. Kendi bildirimleri, neden metinleri, işlem anahtarları ve hız kayıtları temizlenir. Kısmi hata kalan indeksi korur; tekrar deneme işlemi tamamlar. Kapalı hesap işareti eşzamanlı yeni yazıların hesabı silindikten sonra geri gelmesini engeller.

## Uygulama yönetim paneli

Panel, Ayarlar’da yalnız sunucudan yetki doğrulaması başarılı olan hesaplara görünür. Ayrı `POST /api/community-admin` endpoint’i aynı Bearer token ve `expectedUser` kontrolünü kullanır. Önizlemelerde bütün yönetim çağrıları Firebase başlatılmadan 403 `PREVIEW_RESTRICTED` ile kapanır. `/api/community-admin` rewrite’ı `_redirects` dosyasındaki genel `/*` kuralından önce bulunmalıdır; `netlify.toml` ve function `config.path` ile de aynı yol tanımlanır.

İlk ana sahip, güncel Firebase kullanıcı kaydında e-postası doğrulanmış `huseyinyildiz0792@gmail.com` hesabıdır. İlk doğrulamada UID, `_ca_owner` belgesine atomik olarak sabitlenir. Sonraki yetki kararları UID üzerinden verilir; istemci e-postası, tokenın eski e-posta iddiası veya aynı e-postayla sonradan açılan başka UID sahiplik sağlamaz. Ana sahip kaydı hesap silme sırasında da otomatik devredilmez.

Roller ve yetkiler:

- `owner` (Uygulama sahibi): rol atama/kaldırma ve bütün moderasyon.
- `admin` (Admin): yorum/bildirim moderasyonu, tam e-posta ile kayıtlı hesap bulma, topluluk engeli ve yorum kısıtı.
- `moderator` (Yönetici): yorum/bildirim moderasyonu ve yorum kısıtı. E-posta araması veya topluluk engeli veremez.

| action | Alanlar | Temel yanıt / yetki |
|---|---|---|
| `status` | — | `{role,owner,permissions}`; yetkisizde `role:null`, veri dönmez |
| `roles` | `cursor?` | Sonraki 20 yetki kaydı; yalnız owner |
| `grantRole` | `email`, `role:admin/moderator` | Güncel, etkin ve doğrulanmış kayıtlı hedef UID’ye rol; yalnız owner |
| `revokeRole` | `targetUid` | Rolü kaldırır; yalnız owner, owner rolü kaldırılamaz |
| `userLookup` | Tam `email` | `{user,restriction,protected,role}`; owner/admin |
| `restrictionStatus` | `targetUid` | Aynı yetki/kısıt özeti; e-posta veya özel profil dönmez |
| `setRestriction` | `targetUid`, `communityBanned?`, `commentsRestricted?` | Moderator yalnız yorum kısıtı; owner/admin ikisi |
| `comments` / `reports` | `cursor?` | Global en yeni 20 kayıt ve opak `nextCursor`; tüm yetkililer |
| `moderateComment` | `code`, `id`, `operation:edit/delete/hide/show`, `text?` | Tüm yetkililer; `edit` için en fazla 1500 karakter |
| `resolveReport` | `code`, `id` | Bildirimi kuyruktan kaldırır; tekrar yazısız `replayed:true` |

`permissions` alanları `roles,lookup,comments,communityBan,commentBan` boolean değerleridir. Yönetim yorum yanıtları, kısıt uygulanacak yazarı seçmek için `ownerUid` içerebilir; bu bilgi yalnız yetkili yönetim endpoint’inde döner. Global listeler `_hc_global_c_` ve `_hc_global_r_` önek indekslerini sınırlandırılmış sorgularla okur; bütün kayıtlar taranmaz. Cursor istemci tarafından çözülmeden sonraki isteğe aktarılır.

Ana sahip ve atanmış bütün yetkililer kısıtlanamaz. Önce owner ilgili rolü kaldırmalıdır. Rol e-posta üzerinden atanırken sunucu `getUserByEmail` ile güncel UID’yi çözümler; aynı e-postayı daha sonra kullanan farklı hesap rol devralmaz. Yetki değişikliği mevcut açık panelin sonraki isteğinde sunucuda yeniden kontrol edilir; yeni atanan kişi paneli görmek için sayfayı yenileyebilir.

Topluluk engeli yeni hatim oluşturma, yeni cüz alma ve yorum yazma/düzenleme/bildirmeyi durdurur. Mevcut cüzü okundu işaretleme, geri alma, bırakma, kişisel kurtarma ve mevcut hatim yönetimi korunur. Yorum kısıtı yalnız yorum yazma/düzenleme/bildirmeyi durdurur. Her iki durumda Kur’an okuma, bulut yedekleri ve hesabı silme değişmez; yazar kendi yorumunu silebilir. Bunlar sunucuda doğrulanan hesap UID’sine ait kısıtlardır.

Uygulama yöneticisinin düzenlemesi `editedByAdmin:true` olarak işaretlenir; arayüz “Yönetici düzenledi” gösterir. Önceki metnin ayrı kopyası tutulmaz. Yönetici silmesi metin/adı temizler, cevapları korur. Audit kayıtları yalnız işlem türü, hashlenmiş aktör/hedef ve zaman içerir; yorum metni, e-posta veya erişim sırrı içermez. Aynı yorum düzenleme/silme/gizleme durumunun ve çözülmüş bildirimi kapatmanın tekrarları yeni audit veya hız kaydı oluşturmaz; yorum moderasyonu ve bildirim kapatma dakikada 60 sınırını paylaşır.

`cleanupCommunityAccount(uid,{transaction})`, hesap silme akışında rol/kısıt/hız kayıtlarını temizler; audit kullanıcı indeksini 20’lik işlemlerle kaldırıp ilgili kimlik hashlerini anonimleştirir. Kalıcı ana sahip kilidi korunur. Özel `_ca_*` belgeleri eski Netlify Blobs deposundan içe aktarılmaz ve `/api/org` kod doğrulamasıyla okunamaz.

Doğrulamalar ayrı bellek/Firestore işlem testleri ve yalnız `demo-elifa-mushaf` emülatör testleridir; bu geliştirme kapsamında üretim verisi değiştirilmez.
