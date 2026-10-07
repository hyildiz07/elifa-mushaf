# v229 âyet bölme incelemesi

## Sorun ve düzeltme

QuranCDN kelime zamanları bazı hocalarda art arda gelen kelimeler arasında yalnızca 0–20 ms bırakırken MP3 kaydında hoca bir saniyeden fazla duruyor. Önceki algoritma bu uzun durağın orta noktasını MP3'ün sabit zaman kayması sanabiliyor veya durak, kelime etiketinden 350 ms'den uzakta kaldığı için tüm parçaları birleştiriyordu. v229 uzun sessizliğin başlangıcını kelime bitişiyle eşleştirir. Parça sonunu sessizliğin içine, sonraki parçanın başlangıcını yeniden konuşmadan yaklaşık 100 ms önce koyar. Sabit kayma yalnızca zamanlama verisinin kendisinde de boşluk bulunan birden çok sınırdan hesaplanır.

Türk ve Medine imlâsındaki durak işaretleri farklı biçimde kodlanabiliyor. Her iki metin aynı kelime sırasındaysa bölme noktası için Medine/Uthmanî metindeki bağımsız vakıf işareti esas alınır. Yasaklanan `لا` ve eşli durak işaretleri bölme noktası yapılmaz. Kelime etiketindeki yerel yazım hatası, yalnızca iki doğru etiket arasındaki eksik kelime sayısı tam olarak zamanlama satırı sayısına eşitse düzeltilir; gerçek tekrarlar korunur.

## Doğrulama

- Gerçek Nisâ 4:12 MP3 kayıtlarının analizi: Ebû Bekir eş-Şâtırî 9, Minşâvî 10, Husarî 9 iç ses durağı. Bunlar metindeki uygun duraklarla eşleştirilir; ses doğrulaması geçmeyen adaylar birleştirilir.
- Tarayıcıda eş-Şâtırî/Nisâ 4:12 için bölme başlatıldı: 10 parça görüntülendi ve Web Audio oynatma başladı.
- 11 hoca × 114 sûre için önbellekteki 1.254 zamanlama dosyasında 137.192 âyet/yazım kombinasyonu, 305.378 oynatma adımı denetlendi; yapısal sınır ve metin kapsama hatası 0. 8.345 kombinasyonda kelime zamanları ile metin güvenle eşleşmediği için bütün âyet korundu. Bu sayı, akustik doğrulama sonucu değildir.

Bu denetim her kelimenin bir uzman tarafından dinlenerek onaylandığı anlamına gelmez. Ağ hatası, ses çözümleme süresi veya kayıtta güvenilir bir durak bulunmaması hâlinde uygulama bütün âyeti çalar. Kur’ân’ın tamamı ve tüm hocalar için “sıfır ses hatası” garantisi verilemez; kalan uyuşmazlıklar kayıt bazında incelenmelidir.
