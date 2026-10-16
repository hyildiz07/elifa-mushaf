# Türk kârîler: ayet sesi hazırlığı

## İshak Danış

Diyanet Mushaf v2'nin hoca listesi İshak Danış'ı `MHafizList` ID 3 olarak
gösteriyor. Aynı oynatıcının `PlayListManager.js` kodu bu ID'yi
`ar_ishakdemir/{sûre}_{âyet}.mp3` yoluna bağlıyor. Klasör adındaki “demir”
bu eşlemeye rağmen hoca adını doğrulamak için tek başına yeterli olmazdı.
Örnek 1:1, 2:1 ve 18:1 dosyaları HTTP 200 ve `Access-Control-Allow-Origin: *`
döndürdü (15 Ekim 2026). Bu üç örnek 6.236 dosyanın tümünü doğrulamaz.

`assets/diyanet-ayah-source.js` resmî URL'yi güvenli sayısal âyet numaralarıyla
oluşturur. Çevrimiçi modda tek âyetin MP3 bağlantısını döndürür. Sûre indirme
modunda her âyeti ayrı saklar, MP3 başlangıcını ve dosya boyunu denetler,
SHA-256 özeti alır, bütün âyetler tamamlanana kadar sûreyi “indirildi”
işaretlemez. Çevrimdışı oynatma, kayıtlı dosyayı özetiyle yeniden doğrular.
Dosyalar uygulama dağıtımına gömülmez; indirme kullanıcı isteğiyle yapılacak.

Bu kaynak **henüz herkese açık hoca listesine bağlanmadı**. Mevcut oynatıcı
sûre başına tek MP3 ve tek zaman ekseni bekliyor. Diyanet kaynağı ise ayet
başına ayrı MP3 veriyor. Bu nedenle `assets/diyanet-ayah-player.js` seçilen
âyet aralığını ayrı dosyalarla çalar; tekrar, ayet geçişi ve hız ayarı bu
akışta uygulanır. Eski oynatıcının sûre saati bu kayda yapay olarak
uyarlanmaz. Kelime bazlı ayet bölme için bu kayıtla eşleşen güvenilir kelime
zamanları yok. O seçenek ancak doğrulanmış hizalama sonrası açılmalı.

Yerel kalite kontrol için `?ishak-pilot=1` adresi gizli bir deneme paneli
açar. Panel seçilen sûre ve ayet aralığını çevrimiçi veya indirilmiş MP3'lerle
oynatır; sûre indirme/silme, tekrar, hız, önceki/sonraki ayet kontrolleri
bulunur. Normal hoca seçimi değişmez. Bu pilotun varlığı kayıtların kamuya
sunulmasına onay anlamına gelmez; yayın dalına ancak aşağıdaki kapılar
tamamlanınca alınmalıdır.

Kullanıcı Diyanet'ten ücretsiz uygulamada kullanıma ilişkin özel mesajla izin
aldığını bildiriyor. Mesajın hangi kayıtları, akışla çalmayı, çevrimdışı
indirmeyi ve ayetleri tekrar ettirmeyi kapsadığı henüz belgeyle teyit
edilemedi. Genel Diyanet sayfasının kullanım koşulları tek başına üçüncü
taraf uygulamada yeniden dağıtım izni sayılmamalı. Yayın kapısı budur.

## Fatih Çollak

Drive'daki `Kuran_Indirici.bat`, Fatih Çollak için Diyanet'ten değil,
Internet Archive'daki `Fatih-Colak` öğesinden `VBR MP3` ZIP indiriyor.
Öğe `dinirehberim.com` tarafından yüklenmiş, açıklamasında 114 sûre ve
iki hatim duası var; dosyalar sûre MP3'ü, âyet MP3'ü veya sûreyle eşleşen
âyet/kelime saati değil. Bu yüklemenin kullanıcının Diyanet'ten aldığını
belirttiği izne konu kayıt olduğuna dair kanıt yok. Ayrı Fatih kaynağı
seçmeden ve kayıt kimliği/izin kapsamını doğrulamadan uygulama hoca listesine
eklenmemeli. Sadece indirilebilir olması yeniden kullanım izni vermez.

## Yayın için kalan işler

1. İzin mesajını ve işaret ettiği kayıt/bağlantıları arşivle; akış ve
   çevrimdışı indirme kapsamını doğrula.
2. İshak için 114 sûrenin tüm dosyalarını ve âyet sayılarını küçük
   kümelerle denetle; birkaç tam kayıt dinleyerek ses kimliğini kontrol et.
3. Deneme oynatıcısında Fâtiha, Bakara, Kehf ve Fetih için tam çevrimiçi ve
   çevrimdışı kabul testi, gerçek cihazda özellikle iOS/Safari medya
   davranışı ve ağ kesintisi testi yap. Ardından izin kapsamına göre normal
   hoca seçimine bağla.
4. Fatih için doğru kayıt serisi ve eşleşen ayet zamanları/kesitleri bulunursa
   aynı kabul testlerini yap.

Kaynaklar:

- https://kuran.diyanet.gov.tr/mushaf_v2/
- https://webdosya.diyanet.gov.tr/kuran/kuranikerim/Sound/ar_ishakdemir/1_1.mp3
- https://archive.org/details/Fatih-Colak
