# Südeys tam QDC kaydında toplu güven kapısı (inceleme)

`node review/gate-sudais-exact-qdc-batch.mjs` mevcut 3. ve 4. sûre adaylarını tek geçişte sınıflandırır. Betik yerel üretim QDC MP3'lerinin SHA-256 değerlerini sabitlenen değerlerle karşılaştırır; kanonik kelime dizisi raporunu ve tam çözülmüş PCM'deki komşu âyet aralıklarının sessizlik taramasını birleştirir. Sonuç `sudais-exact-qdc-batch-gate-2026-09-30.json` dosyasındadır. Üretim koduna veya zamanlarına dokunmaz.

| Sûre | Âyet | Kaynak SHA eşleşmesi | Yapısal aday | Her iki yanda ≥120 ms sessiz kesim adayı | Üretime onay |
| --- | ---: | --- | ---: | ---: | ---: |
| Âl-i İmrân 3 | 200 | Evet | 194 | 0 | 0 |
| Nisâ 4 | 176 | Evet | 173 | 0 | 0 |

374 âyetler arası aday boşluğun hiçbiri bu katı sessizlik eşiğini geçmiyor. Bu, bütün 376 âyetin yanlış okunduğunu **göstermez**; QUL'un 200 ms aralıklarının güvenli otomatik kesim kanıtı vermediğini gösterir. Yapısal olarak geçen 367 âyet de üretime hazır değildir. Bu rapordaki sessizlik verisinin içine ayrıca MP3 SHA ve çözüm sürümü yazılmadığı için kaynak bağının audit izi eksiktir. Kelime içi sınırları için bu toplu taramada bağımsız akustik/konuşma doğrulaması bulunmuyor; otomatik onay sayısı sıfırdır.

Daha hızlı ilerlemek için yanlış pozitifleri en aza indiren sıra: (1) beş karantina sûresinin her birinin tam QDC MP3'ünü SHA ile kilitle, (2) üst üste binen pencerelerde bağımsız iki tanıma modelinin âyet/kelime sırasını topluca çıkar, (3) modelin önerdiği *geniş* sınır çevresinde gerçek sessiz aralığı PCM üzerinde ara, (4) sessizlikten geçenleri ayrı fonem ve oynatıcı kip kontrolüne ayır. Sırf QUL'un 200 ms boşluğunu denetlemekle kalmak, geniş pencere içindeki olası güvenli kesimleri kaçırır. Bu kapı dar taramanın başarısızlığını ölçer; daha geniş tarama için altyapı kararını verir.

Yanlış pozitif riski önemlidir: sessizlik olsa bile önceki âyetin son harfi kesilmiş, sonraki âyetin ilk harfi dahil edilmiş veya yankı yanlış sahiplenilmiş olabilir. Bağımsız fonetik kontrol ve gerçek uygulamada tam âyet, parça, kelime seçimi, tekrar ve 1+2 kipleri geçmeden otomatik yayın izni verilmemeli. 5, 28 ve 29. sûreler bu betiğin kapsamında değildir; mevcut dar örnekleri bunların tamamına genellenemez.
