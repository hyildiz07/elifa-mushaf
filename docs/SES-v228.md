# v228 ses ve ekran doğrulaması

## Oynatma sorunu

Parça düğmesi, kısa sûrelerde bütün sûre için başlatılan `decodePromise` işlemini bekliyordu. İndirme veya çözümleme uzadığında ekranda “Ses ve duraklar hazırlanıyor” kalıyor, parça başlamıyordu. Seçilen âyetin hazırlığı artık bu işlemden bağımsız; ses bağlamı dokunma sırasında etkinleştiriliyor. Hazırlık 30 saniyeyi aşarsa veya başarısız olursa âyet, güvenli olmayan bir iç kesim yapılmadan bütün olarak çalınıyor.

QuranCDN kelime damgaları bazı MP3 kayıtlarıyla tam aynı zaman ekseninde değil. Şâtırî / Nisâ 12 kaydında üç ayrı gerçek durak üzerinden ölçülen kayma yaklaşık **+965 ms**. Eski kesimler bu yüzden kelime sonuna erken gelebiliyordu. Yeni çözüm, MP3'ü sûre başından çözümleyip aday Kur'ân duraklarının çevresindeki düşük enerjili aralıkları buluyor. Birden çok durak aynı kaymayı doğrularsa bütün parça zamanlarına uygular. Kelime damgaları bitişik olsa da son kelime bittikten sonraki güçlü akustik durak parça sınırı olabiliyor. Doğrulanamayan sınırlar birleştiriliyor.

Gerçek kayıt örnekleri:

| Kayıt / âyet | Sonuç |
|---|---|
| Şâtırî / Nisâ 12 | 49., 64. ve 82. kelimelerden sonra üç akustik kesim; dört parça, ikinci parçaya doğrudan geçiş çalıştı. |
| Afâsî / Nisâ 12 | Yedi akustik durak; sekiz parça, üçüncü parçaya doğrudan geçiş çalıştı. |
| Minşâvî ve Husarî / Nisâ 12 | Bu aday sınırlar akustik koşulları sağlamadı; kelime ortası kesilmedi. |

`node scripts/inspect-split.mjs` Şâtırî örneğinin gerçek MP3'ünü yeniden ölçer. Farklı hoca/sûre/âyet/kelime numaraları parametre olarak verilebilir.

## Kapsam ve sınırlar

Yerel test paketi 60 testi geçti; iki Firebase emülatör testi standart koşuda atlanır. Zamanlama taraması 11 hocanın 114 sûresindeki **1.254 ses metaverisi dosyasında**, Türk ve Medine metni için **137.192 âyet görünümünü** taradı; yapısal sınır hatası bulmadı. Bu tarama MP3'lerin tamamını dinleyerek doğrulamaz. Akustik yöntem de bir kelimenin doğru telaffuzunu veya bütün Kur'ân'ın kusursuz olduğunu kanıtlamaz. Uzun sûrenin geç âyetlerinde 30 saniyelik hazırlık sınırı yüzünden bazı âyetler tek parça kalabilir. Hassas kayıtlar için hoca bazında dinleme ve uzman kontrolü sürdürülmeli.

## Arayüz

Giriş/kayıt düğmesi ana ekranın üstündeki dil, duyuru, rehber ve tema simgelerinin yanındadır. Önceki düğmenin ana ekran grid'inde ayrı bir öğe olması laptop görünümünde sağ sütunu kaydırıyordu. 320 px telefon, 768/900 px dikey tablet ve 1024/1440 px laptop genişliklerinde yerleşim ve yatay taşma kontrol edildi.
