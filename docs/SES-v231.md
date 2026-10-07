# v231: parça tekrarları ve hazırlama önbelleği

Bölme ekranı açılır açılmaz seçilen âyetin ses analizi arka planda başlar. Aynı hoca, sûre, âyet ve zaman aralığına dönüldüğünde hazırlanmış ses penceresi yeniden kullanılır; parça/önceki/sonraki düğmeleri aynı âyeti yeniden çözümlemez. Hoca veya zaman aralığı değişirse eski pencere kullanılmaz.

Oynatma çubuğu çalan parçayı ve `1/2 → 2/2` gibi tekrar ilerlemesini gösterir. Tekrar düğmesinin erişilebilir adı açık/kapalı durumunu ve sayıyı belirtir. Yerel tarayıcıda Nisâ 4:12'nin son parçası 2 kez tekrarlandı; ardından önceki parçaya geçiş analiz ekranına dönmeden başladı. 69 testin 67'si geçti; iki Firebase emülatör testi çalıştırılmadı.

İlk kez açılan uzun âyetin kaydında hâlâ ses çözümleme süresi olabilir. İlgili MP3 bölümünü bayt aralığıyla hemen alma denemesi iki hocada yaklaşık 30–40 ms zaman kaymasına yol açtı. Kelime sınırlarını tehlikeye atmamak için bu kestirme yayımlanmadı. Bu sürüm ilk oynatmada sıfır bekleme garantisi vermez; yalnızca hazırlığı daha erken başlatır ve hazırlanmış sonucu tekrar kullanır.
