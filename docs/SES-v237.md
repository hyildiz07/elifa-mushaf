# v237 — Türk mushafı kelime-ses eşleştirmesi

Türk ve Uthmanî mushaf yazımları aynı âyeti bazen farklı sayıda görsel kelimeye ayırıyor. Örneğin Uthmanî “يَـٰٓأَيُّهَا” Türk imlâsında “يَٓا اَيُّهَا”. Eski uygulama görsel kelime sayısını doğrudan hoca zamanlamasına uyguladığından sonraki kelimeler yanlış zamanlanabiliyor ve otomatik bölme tek parçaya düşebiliyordu.

Bu sürüm, yalnızca sırası ve harf benzerliği doğrulanabilen komşu Türk kelimelerini sesin tek kelime birimi olarak gruplar. Görünen Arapça harfler ve boşluklar aynen kalır. Eşleme başarısızsa söz konusu âyette yanlış kelime vurgusu yerine zamanlamasız tam âyet kullanılır.

6.236 Türk âyetinin 376'sında farklı kelime sayısı güvenilir biçimde gruplanabildi. Elimizdeki 1.254 hoca/sûre zamanlama dosyası üzerinde iki yazımın 137.192 görünümü ve 659.116 oynatma adımı tekrar denetlendi; metin kapsamı veya hesaplanan ses aralığı ihlali yok. Sağlayıcının eksik/çelişkili kelime zamanları nedeniyle 4.361 görünüm hâlâ tam âyete düşüyor; bunların 2.884'ü altı kelimeden uzun. Bu yapısal denetim, bütün kayıtların dinlenerek uzman onayından geçtiği anlamına gelmez.
