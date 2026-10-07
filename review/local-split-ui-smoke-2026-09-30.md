# Yerel bölünmüş oynatma kontrolü

`http://127.0.0.1:4173/?verify=264` arayüzünde Südeys seçiliyken Bakara 2:286 ve 2:282 denendi. 2:286 hazır olduğunda 10 parça gösterdi. 128 kelimelik 2:282, ses hazır olduğunda 30 parçaya ayrıldı; DOM'da 128 kelime konumunun her biri tam bir kez yer aldı ve en uzun parça 6 kelimeydi. Son karta tek dokunuş oynatmayı başlattı, durum `Parça 30 · 1/5` oldu ve tekrar 5/5'e kadar ilerledi. Son planın sayısal aralığı 5.829.382,98–5.833.033,98 ms, hazırlanmış PCM penceresi 5.713.119,98–5.835.410 ms içindeydi.

İlk incelemede kartı seçtikten hemen sonra ▶ düğmesine de basıldığı için duraklatma, başarısız ilk oynatma olarak yorumlanmıştı. Tek kart dokunuşuyla temiz tekrarında geçici uyarı oluşmadı. Kartın davranışı korunup ekrandaki yönerge buna uygun düzeltildi: kart dokunuşu o parçadan çalar, ▶ oynatır veya duraklatır. Uyarının gerçek bir cihaz/ağ koşulunda oluşmayacağını bu deneme kanıtlamaz.

`node scripts/audit-split-coverage.mjs` mevcut katalogda 49.674 âyeti taradı. En az 8 kelimelik 31.738 âyetin hepsi metin olarak birden çok parçaya ayrıldı; eksik/tekrarlı kelime konumu ve tek parçalık uzun âyet çıkmadı. Bu sayılar sesin son fonemlerinin doğruluğunu, karantinadaki hocaların sesini veya her cihazdaki yükleme süresini doğrulamaz. Üretime yeni ses kesimi açılmadı.
