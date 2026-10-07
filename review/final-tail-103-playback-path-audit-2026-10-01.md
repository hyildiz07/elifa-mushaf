# 103 öncelikli son âyetin oynatma yolu — 2026-10-01

`test-results/final-tail-energy.json` içindeki 103 akustik öncelikli kayıt,
üretim metadata'sındaki son kelime/âyet ve MP3 fiziksel sonuyla karşılaştırıldı.
Normal âyet, tekrar ve kelime seçimi son segment bitişinde durur; parçalı
okumanın son kartı `splitBounds` içinde sağlayıcı `verseEnds` zamanına kadar
uzatılır. Son âyet için doğrulanmış PCM fiziksel sona yaklaştığında sınır
oraya kısılır. Bu modlar arası fark, sırf RMS yüksek diye bütün kayıtlarda
birlikte genişletilemez.

| Ayrık grup | Adet | Oynatma sonucu |
|---|---:|---|
| Üretim segment sonu fiziksel MP3'ten ileride | 4 | MP3'te olmayan ses süre ekleyerek üretilemez; doğrulanmış fiziksel son kullanılır. |
| Hüsarî Muallim'in 1,9–4,1 sn etiketsiz son kuyruğu | 13 | Son kart sağlayıcı saatine kadar uzadığı için tekrarda birkaç saniye boşluk oynatıyordu. |
| Diğer, üretim bitişi fiziksel sondan önce | 86 | 29'unda >500 ms, 4'ünde >1.000 ms ek PCM var; kelime mi, yankı mı, tekrar mı olduğu otomatik ayırt edilemedi. |

13 Hüsarî Muallim kaydının tamamı özgün sûre MP3'ünden tekrar çözüldü:
`node review/audit-husary-terminal-silence.mjs`; ham 100 ms RMS dizileri
`test-results/husary-terminal-silence.json` dosyasında. Son segmentten
**400 ms sonrasında** ölçülen en yüksek 100 ms RMS **0,00184**; ilk 100 ms
ise etkin ses içeriyor. Bu, son 400 ms'yi koruyup sonraki uzun düşük
enerjili kuyruğu tekrar döngüsünden çıkarmak için dar bir teknik dayanak.
Fonem kimliği veya dinî doğruluğu yine kanıtlamaz.

Yerel düzeltme yalnız yukarıdaki **ölçülmüş 13**
`khalil_al_husary/muallim` kaydına, sûre son âyetine ve sağlayıcı bitişi
segment bitişinden en az 1.500 ms ilerideyse uygulanır. Diğer Muallim
kayıtları da bu biçimde bitse bile ayrı ölçülmeden değiştirilmez.
Bölünmüş son kartın bitişi en çok **son segment +400 ms** olur;
1+2 birleşik kartı ve tam âyet fallback'i aynı sınırı kullanır. Diğer
kârilerin, sûrenin iç âyetlerinin ve normal/kelime seçimi yollarının
zamanları değişmedi. Birim testi kaynak/âyet kapılarını ve üç parça tipini
doğruladı (`node --test tests/audio.test.mjs`: 86/86 geçti).

103 kayıt bir hata sayısı değildir. Bu inceleme 13 Muallim kartındaki
uzun sessiz beklemeyi çözer; kalan 86 kayıtta son fonemin tamlığı ve 4
fiziksel-son taşmasında bağımsız devam sesi için işitsel inceleme gerekir.
Canlı siteye dağıtım yapılmadı.
