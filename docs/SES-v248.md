# v248: doğrulanamayan bölünmüş ses sınırları

Südeys 3:160, 4:143 ve 5:5 için sağlayıcının son kelime zamanı âyet bitişini 300 ms'den fazla aşıyor. Bölünmüş oynatma ekranı bu üç kayıtta artık âyeti eksik sesle tamammış gibi çalmaz; sınırın doğrulanamadığını söyler ve başka hoca seçmeye yönlendirir. Normal sûre dinleme akışı değişmedi. Gerçek kaynak satırlarını kullanan regresyon testi eklendi.

[v247 ses denetimi](SES-v247.md) hâlâ geçerlidir. Kalan Hânî 34:46 ve 6:139 ölçümleri [ayrı denetim notunda](SES-HANI-34-46-6-139-DENETIMI.md) yer alır. Husary Muallim 2:145 için alternatif 118,07 saniyelik kayıt, yayımlanmış kelime hizasındaki 60,75 saniyelik bitişle uyuşmuyor; tekrar edilmiş pasajın kelimeleri güvenle atanamadı. Bu noktalara tahmini sınır uygulanmadı.

`npm run build` sonucu: 106 test geçti, 0 başarısız, Firebase ortamına bağlı 2 test atlandı. Tam külliyat taraması 1.254 hoca–sûre dosyasında 137.192 kipi taradı: **0 yapısal hata**, iki yazı biçimi sayıldığında **6 bilinçli engellenmiş kip**, Medine yazısında **11 bölme istisnası**. Sonuçlar [v248 istisna listesinde](split-exceptions-v248.json) tutulur. Yapısal denetim, dinleyerek doğrulanmış sıfır ses hatası anlamına gelmez.
