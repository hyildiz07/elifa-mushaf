# Dört kârî kaynağı ve yayın durumu

15 Ekim 2026. Bu kayıtlar mevcut Elifa Mushaf kârîlerinden ayrıdır; başka bir icranın zaman verileriyle eşleştirilmez.

| Kârî / icra | 114 sûre | Ayet zamanı | Kaynak ve kullanım durumu | Uygulama durumu |
| --- | --- | --- | --- | --- |
| Mişârî Râşid el-Afâsî, MP3Quran standart Murattal (Hafs) | MP3Quran read 123, `r1` | Resmî MP3Quran `ayat_timing` API'sinde 114/114 | MP3Quran [kayıt sayfası](https://www.mp3quran.net/eng/afs) ve [kullanım açıklaması](https://www.mp3quran.net/eng/privacy) | Ayrı seçenek; kaynak MP3'ü ve ayet zamanları birlikte kullanılır |
| Şeyh Halid el-Celil, MP3Quran Murattal (Hafs) | MP3Quran read 20, `r1` | API 114/114 satır döndürüyor, fakat kayıtla aynı saat değil | MP3Quran [kayıt sayfası](https://www.mp3quran.net/eng/jleel) ve aynı kullanım açıklaması | Henüz menüde değil: Fâtiha, Kehf ve Fetih MP3'lerinin sonunda zaman çizelgesinden sonra işitilir ses var |
| İshak Danış | Hayrat ve TVQuran'da 114 sûre listeleri bulundu | Elifa'da aynı kayıtla doğrulanmış ayet/kelime zamanları yok | Kullanıcı Diyanet'ten ücretsiz kullanım izni aldığını bildirdi; mesajın metni ve kapsadığı kayıt henüz görülmedi. Hayrat/TVQuran kaydının hak sahibi ayrıca doğrulanmalı. | Tam oynatma menüsüne alınmadı |
| Fatih Çollak | SoundCloud'da 114 parçalık liste bulundu | Elifa'da aynı kayıtla doğrulanmış ayet/kelime zamanları yok | Kullanıcı Diyanet'ten ücretsiz kullanım izni aldığını bildirdi; mesajın metni ve kapsadığı kayıt henüz görülmedi. SoundCloud listesi hakları saklı işaretli; Kur'an Işığı kaydının hak sahibi kullanım talebini reddetti. | Tam oynatma menüsüne alınmadı |

Yalnız Afâsî MP3Quran kaydı uygulama içinde kaynağın CDN'inden akışla oynatılır. MP3 dosyaları depoya veya dağıtım paketine alınmaz. Ayet aralığı, tekrar ve ezber oynatması aynı kayıt serisine ait resmî zamanlarla çalışır. API kelime sınırları sağlamadığından ayeti kelimelere bölme güvenle yapılamaz; uygulama tam ayet oynatmasına döner. Diğer üç kârî için bu işlevleri başka kârînin zamanlarıyla taklit etmek yasaktır.

Zaman verisi denetimi `node scripts/audit-mp3quran-reciter.mjs` komutuyla Afâsî'nin 114 kayıt/sûre çiftinin ayet sayısı, sıra ve zaman sınırlarını doğrular. MP3 uzunluğu ile karşılaştırma Fâtiha, Kehf ve Fetih için Afâsî'de yaklaşık 0,7–3 saniye, Halid'de yaklaşık 14–29 saniye kuyruk farkı gösterdi; Halid kaydında zaman çizelgesi bittikten sonra ses sürdüğü için ayet eşleştirmesi yayına alınmadı. Özellikle Bakara 1–5 ve gerçek dinleme kontrolü sürüm öncesi ayrıca yapılmalıdır.
