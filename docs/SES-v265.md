# Ses kaynağı güvenliği v265

Südeys'in üretimdeki sûre MP3'leri ile sağlayıcının kelime/âyet saatleri 3, 4, 5, 28 ve 29. sûrelerde aynı kaydı göstermiyor. Örneğin 3:160 diye verilen aralıkta gerçek kayıtta 3:157; 4:143 aralığında 4:148; 5:5 aralığında âyetin yalnız başlangıcı bulunuyor. 28 ve 29. sûrelerin orta/son örneklerinde de komşu âyet sesleri var. Kaynak dosyaların canlı QuranCDN baytlarıyla eşleşmesi, dosyanın baştan ardışık çözülmesi ve iki ayrı hizalama modeliyle metin karşılaştırması bu bulguyu destekliyor. 27. sûre kontrol örnekleri büyük ölçüde uyumlu.

Bu beş sûre için Südeys'in normal, bölünmüş, tekrar ve seçili ses istekleri tek bir yükleme kapısından engellenir. Arapça metin ve diğer hocaların sesleri kullanılabilir. Kullanıcıya bunun bağlantı hatası değil, ses zamanı doğrulaması olduğu açıklanır. Çevrimdışı kaydedilmiş eski MP3 de aynı korumaya tabidir.

Değişiklik 150 testle doğrulandı (148 geçti, Firebase gerektiren 2 test atlandı). Önceki tam Kur'an yapısal taraması sıfır planlama hatası bulmuştu; bu yeni bulgu, yapısal taramanın kaynak ses ile metnin aynı âyet olduğunu tek başına kanıtlamadığını gösterir. Karantina ancak aynı üretim MP3'ü üzerinde tam sûre âyet ve kelime hizası, kaynak kimliği, son harf/sonraki âyet sınırları ve oynatma işlevleri doğrulandıktan sonra kaldırılmalıdır. Sabit zaman kaydırması kullanılmaz; sapma sûre içinde değişir.
