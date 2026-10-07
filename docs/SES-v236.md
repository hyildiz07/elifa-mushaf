# v236 — kısa ezber parçaları ve MPEG-2 hızlı erişim

Önceki kural metindeki durak veya en az 120 ms doğrulanmış sessizlik yoksa uzun âyeti tek kartta bırakıyordu. Bakara 2:277 buna somut örnekti: 19 kelime ve yazılı iç durak yok. Yeni kural, doğru sıralanmış hoca kelime zamanlarından önce 3–6 kelimelik grupları hemen gösterir. Dilbilgisel cümlecik başlangıçlarına ve gerçek nefeslere öncelik verir. Bakara 2:277 Afâsî ve Şâtırî verisinde 5+4+4+6 olarak test edildi. Aynı kayıt çözümlenince doğal sessizlik kesin kelime sınırlarının içinde kalıyorsa kullanılır; sessizlik yoksa iki parça aynı kelime zamanında bitip başlar. Tekrarlanan kelimenin iki farklı parçada kalacağı sınır seçilmez.

1.254 hoca/sûre zamanlama dosyası, her iki mushaf yazımıyla 137.192 âyet görünümü ve 631.966 oynatma adımı için denetlendi: metin kapsamı ve hesaplanan ses aralığı ihlali 0. Bununla birlikte 8.345 görünümde sağlayıcı verisi tüm yazılı kelimelerle eşleşmediği için tahmini kesim yerine tam âyet kullanılır; bunların 6.553'ü yedi veya daha fazla kelimelidir. Bu sayılar bütün parçaların tek tek dinlenip onaylandığı anlamına gelmez.

v235'in doğrulanmış HTTP Range yoluna MPEG-2 Layer III CBR desteği eklendi. MPEG-2 kayıtlarda çerçeve başına 576 örnek, farklı bitrate tablosu ve farklı Xing/Info başlık konumu kullanılıyor. Yanlış sürüm veya değişen bitrate saptanırsa hızlı yol kapatılıp tam akışa dönülüyor.

Halil el-Husarî murattal/Nisâ kaydının tüm MPEG çerçeveleri tarandı. Bu dosyada Xing toplam-bayt ortalaması sona doğru bir çerçeve yanılabiliyor; MPEG-2 için gerçek CBR çerçeve uzunluğuyla hesaplanan konumlar tam taramayla eşleşti. Nisâ 12 ve 176 aralıkları özgün tam dosyanın PCM çözümlemesiyle sıfır örnek kaymasıyla karşılaştırıldı. Her iki durumda da dosyaya özgü 1105 örnek başlangıç farkı ölçülüp giderildi. Kısa İhlâs kaydında da tüm çerçeve konumları eşleşti.

Husarî/Nisâ son âyetinin sağlayıcı bitiş zamanı MP3'ün gerçek sonundan yaklaşık 43 ms ileride. Sadece dosyanın son âyetinde en fazla 120 ms eksik encoder kuyruğuna izin veriliyor; oynatma sınırı eldeki son gerçek PCM örneğine kısılıyor. Diğer âyetlerde 40 ms sınırı korunuyor.

Nisâ üzerinde kontrol edilen 11 hocanın 9'u bu sürümde doğrulanmış hızlı erişimi kullanabiliyor. Abdurrahman es-Südeys'in VBR/Xing ve Yâsir ed-Dûserî'nin indekssiz MP3 kayıtları için güvenli rastgele erişim henüz yok; bu kayıtlarda uzun bir geç âyetin ilk hazırlanması sürebilir. Parça hazırlığı başarısız olursa bütün âyet parça diye çalınmaz. Bu sonuç tüm 1.254 hoca/sûre dosyasının sesli onayı değildir.
