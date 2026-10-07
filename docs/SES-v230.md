# v230: kısa ezber parçaları ve canlı sürüm

v229, kelime sonunu koruyarak basılı vakıf işaretlerinde bölüyordu. Bu yüzden iki vakıf işareti arasındaki bölüm 15 kelimeye çıkabiliyordu. v230, oynatma sırasında seçilen hocanın sûre MP3'ünü çözümleyip âyet içindeki bütün kelime sınırlarında gerçek sessizliği arar. Uzun bölümlerde ancak kayıtta doğrulanmış bir nefes arası ve metinde yeni bir cümlecik başlangıcı birlikte varsa ek sınır seçer. Kesim noktası sessizlik içinde kalır; kelime ortasına keyfî zaman bölmesi eklenmez. Hoca değişince sınırlar yeniden hesaplanır.

Nisâ 4:12 eş-Şâtırî kaydında kelime 18 ve 60 sonrasındaki duraklar da bulundu; mevcut vakıf işaretleriyle birlikte en uzun parça 15 yerine 11 kelimeye iner. Minşâvî aynı âyette farklı durak ve başlangıç zamanlarına sahiptir; sınırları kendi kaydından çıkarılır. Kayıtta güvenilir sessizlik bulunmazsa ilgili bölüm uzun kalır veya âyet bütün okunur. Bu tercih, sesin yarım kelimeden kesilmesine karşı koruma içindir.

Otomatik sınırlar tecvid veya vakıf konusunda insan uzman onayı yerine geçmez. Tüm Kur’ân ve bütün kayıtlar dinlenerek doğrulanmış değildir; bu nedenle sıfır hata garantisi verilmez. Yapısal zamanlama denetimi için `node scripts/verify-all-audio.mjs`, örnek akustik inceleme için `node scripts/inspect-split.mjs 4 4 12 ((1..87) -join ',')` kullanılabilir.
