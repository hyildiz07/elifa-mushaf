# v232 ses önbelleği ve kapsam denetimi

Hazırlanan âyetin orijinal sûre kaydından çözülmüş PCM ses penceresi ve onunla
birlikte hesaplanan akustik durakları artık tarayıcı IndexedDB'sinde tutulur.
Aynı hoca, kaynak dosya, dosya kimliği/boyutu, âyet ve kelime zamanlamasına
dönüldüğünde tarayıcı yenilense bile bu pencere kullanılabilir. Önbellek azami
96 MiB, tek kayıt azami 48 MiB ve yedi gün geçerlidir. Önbellek dolu/kapalı
olduğunda ses hazırlığı eski güvenli yoldan sürer. Yeni ya da büyük bir âyetin
ilk açılışı hâlâ uzun sürebilir; bu sürüm sıfır bekleme sağlamaz.

2026-09-27 denetimindeki kaynaklar ve sonuçlar:

| Denetim | Sonuç | Sınır |
| --- | ---: | --- |
| Hoca × sûre zamanlama dosyaları | 1.254 / 1.254 erişilebilir | Kaynak verisinin doğruluğu dinlenerek onaylanmadı. |
| Arapça sûre/âyet ve sayfa yapısı | 114 sûre, 6.236 âyet, 604 sayfa; yapısal hata 0 | Türk imlâsı referans Uthmanî imlâdan farklı olabilir. |
| Bölme planı kapsam denetimi | 137.192 hoca/yazım/âyet örneği; eksik kelime kapsaması ve geçersiz sınır 0 | Denetim metaveri temellidir, akustik doğrulama değildir. |
| Güvensiz kelime zamanlaması | 7.619 hoca/yazım/âyet örneği | Sayım, aynı âyeti iki yazımda ayrı sayar. |
| Bütün âyet güvenli yolu | 8.345 / 137.192 örnek; bunların 6.553'ü en az 8 kelime | Bu örneklerde kısa parçalara bölünme henüz sağlanmaz. |

Zamanlama uyuşmazlıkları: Türk yazımında 5.725 kelime sayısı, 148 sıra, 79
eksik/geçersiz segment; Medine yazımında sırasıyla 1.415, 177, 75 örnek.
Bu satırlar sessizce tahmin edilmez. Sesin 11 hoca × 114 sûre boyunca insan
tarafından dinlenmesi ve belirsiz kelime/durakların uzman incelemesi henüz
tamamlanmadı. Bu nedenle bütün Kur'an'da sıfır ses hatası veya her âyetin kısa
parçalara ayrıldığı iddia edilemez.

Gerçek tarayıcı denemesinde İhlâs 112:1 için PCM/durak kaydı oluşturuldu,
IndexedDB'de görüldü ve sayfa yenilendikten sonra aynı âyet açıldı. Birim
testleri önbelleğin PCM örneklerini ve durakları değiştirmeden geri yüklediğini
doğrular.
