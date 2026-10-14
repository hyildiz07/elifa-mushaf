# Dört kârî kaynağı ve yayın durumu

15 Ekim 2026. Bu kayıtlar mevcut Elifa Mushaf kârîlerinden ayrıdır; başka bir icranın zaman verileriyle eşleştirilmez.

| Kârî / icra | 114 sûre | Ayet zamanı | Kaynak ve kullanım durumu | Uygulama durumu |
| --- | --- | --- | --- | --- |
| Mişârî Râşid el-Afâsî, MP3Quran standart Murattal (Hafs) | MP3Quran read 123, `r1` | Resmî MP3Quran `ayat_timing` API'sinde 114/114 | MP3Quran [kayıt sayfası](https://www.mp3quran.net/eng/afs) ve [kullanım açıklaması](https://www.mp3quran.net/eng/privacy) | Ayrı seçenek; kaynak MP3'ü ve ayet zamanları birlikte kullanılır |
| Şeyh Halid el-Celil, MP3Quran Murattal (Hafs) | MP3Quran read 20, `r1` | Aynı API'de 114/114 | MP3Quran [kayıt sayfası](https://www.mp3quran.net/eng/jleel) ve aynı kullanım açıklaması | Ayrı seçenek; kaynak MP3'ü ve ayet zamanları birlikte kullanılır |
| İshak Danış | Hayrat ve TVQuran'da 114 sûre listeleri bulundu | Elifa'da aynı kayıtla doğrulanmış ayet/kelime zamanları yok | Hayrat/TVQuran için uygulama içi kullanım ve indirme izni yanıtı bekleniyor. Diyanet'e kaynak ve hak sahibi soruldu. | Tam oynatma menüsüne alınmadı |
| Fatih Çollak | SoundCloud'da 114 parçalık liste bulundu | Elifa'da aynı kayıtla doğrulanmış ayet/kelime zamanları yok | SoundCloud listesi hakları saklı işaretli. Kur'an Işığı kaydının hak sahibi kullanım talebini reddetti; farklı kayıt için izin bekleniyor. Diyanet'e kaynak ve hak sahibi soruldu. | Tam oynatma menüsüne alınmadı |

MP3Quran kaydı uygulama içinde kaynağın CDN'inden akışla oynatılır. MP3 dosyaları depoya veya dağıtım paketine alınmaz. Ayet aralığı, tekrar ve ezber oynatması aynı kayıt serisine ait resmî zamanlarla çalışır. API kelime sınırları sağlamadığından, bu iki yeni kayıtta ayeti kelimelere bölme güvenle yapılamaz; uygulama tam ayet oynatmasına döner. İshak Danış ve Fatih Çollak için bu işlevleri başka kârînin zamanlarıyla taklit etmek yasaktır.

Zaman verisi denetimi `node scripts/audit-mp3quran-reciter.mjs` komutuyla 228 kayıt/sûre çiftinin ayet sayısı, sıra ve zaman sınırlarını doğrular. Ses dosyası erişimi ve özellikle Bakara, Kehf, Fetih gerçek dinleme kontrolü sürüm öncesi ayrıca yapılmalıdır.
