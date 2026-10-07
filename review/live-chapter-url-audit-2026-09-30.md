# Seçilen sûre ses adresleri: erişilebilirlik denetimi

`node review/audit-live-chapter-urls.mjs` uygulamanın yerel sürümde seçtiği 909 QUA ve 345 eski katalog kaydı olmak üzere **1.254 hoca–sûre URL'sine** dört eşzamanlı işçiyle `HEAD` isteği gönderdi. 30 Eylül 2026 taramasında **1.254/1.254 adres HTTP 200 ve pozitif `Content-Length`** döndürdü; 404, boş dosya veya üç denemeden sonra kalıcı ağ hatası yoktu. Ham rapor: `review/live-chapter-url-audit-2026-09-30.json`.

Ek olarak beş farklı kaynağa (`1-1`, `3-24`, `5-1`, `10-1`, `12-2`) canlı alan adı `Origin` başlığıyla `Range: bytes=0-0` uygulandı. Beşi de **206**, `Content-Range: bytes 0-0/...`, `Access-Control-Allow-Origin: *` ve bir bayt gövde verdi. Bu örnek, tarayıcıdaki kısa aralık isteğinin en azından seçilen kaynaklarda desteklendiğini gösterir; 1.254 URL'nin her biri için aralık/CORS veya kullanıcının cihazı doğrulanmış değildir.

Eski katalogdaki `file_size` alanı fiziksel `Content-Length` ile 230 satırda uyuşmuyor (Südeys 114, Hânî 114, Şuraym 2). **Bunlar erişilemeyen dosya sayısı değildir.** Bölünmüş ses indeksleyicisi aralık yanıtının gerçek toplam uzunluğunu veya gerçek `HEAD` uzunluğunu okur; katalog boyutunu doğrulanmış byte kimliği saymamalıdır. Boyut farkı tek başına dosyanın değiştiğini veya kelimenin kesildiğini kanıtlamaz.

Sonuç: şu anda “ses yüklenemedi” raporunu **bozuk sûre URL'si** ile açıklayan kanıt bulunmadı. Geçici ağ/yanıt kesintisi, tarayıcı önbelleği, cihaz koşulu veya belirli bir âyetin ses zamanı ayrı nedenler olabilir. v285 ilk bağlantı hatası için sınırlı yeniden deneme ekler; bu URL taraması bir MP3'ün tamamının indirildiğini, içeriğinin doğru olduğunu, fonemleri veya 653 korumalı Südeys âyetinin açılabileceğini kanıtlamaz. Canlı site hâlâ v276.
