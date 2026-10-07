# Südeys 5/28/29: sınırsız konumda tam PCM kaynak araması

`node review/search-sudais-qdc-qul-full-offsets.mjs` önceki ±180 saniye taramasında tutulmuş 134 âyeti, QDC sûresinin **tamamında** yeniden aradı. QDC ve QUL MP3'leri dosyanın başından sırayla çözülerek 1 ms PCM dizilerine dönüştürüldü. Kaynağın her 1 ms konumundan 12 bitlik dalga işareti parmak izi indekslendi; QUL âyetinin üç kelime merkezli penceresi için 0–3 bit farkı olan bütün konumlar 300 ms PCM korelasyonuyla sınandı. Kabul eşiği her pencere için ≥0,95 ve üç pencerenin kaynak kayması için ≤20 ms idi. Betik MP3'lerin SHA-256 değerlerini her çalıştırmada yeniden hesaplar ve önceki taramadaki değerlerle karşılaştırır; doğrulanan değerler ham JSON'a yazılır.

| Sûre | Yeniden aranan | Herhangi bir pencerede ≥0,95 | Üç pencerede ortak kayma |
| --- | ---: | ---: | ---: |
| 5 | 110 | 0 | 0 |
| 28 | 0 | — | — |
| 29 | 24 | 0 | 0 |
| **Toplam** | **134** | **0** | **0** |

Yöntem aynı akışı gerçekten bulabiliyor: 5:111 için +126.057 ms ve en düşük korelasyon 0,986058; 28:44 için 0 ms ve 0,999920; 29:45 için +100 ms ve 0,995055. Üç kontrol âyetinde her üç pencere bulundu. Ayrıca önceki taramadaki 143 pozitif âyetin 429 penceresinin parmak izleri ölçüldü: en büyük fark 3 bit, dolayısıyla bu pozitiflerin hiçbirini parmak izi elemedi. Tam arama 36,2 saniye sürdü. Ayrıntılar `sudais-qdc-qul-full-offset-search-2026-09-30.json` dosyasındadır.

Sonuç, önceki 134 olumsuz sonucun yalnızca ±180 saniyelik arama yarıçapından kaynaklanmadığını gösterir. Bu âyetlerde QUL'deki seçilen üç kısa ses penceresinin QDC sûre MP3'ünde, bu parmak izi toleransı ve ≥0,95 eşik altında, hiçbir konumda aynı dalga olduğunu doğrulayamadık. Farklı kayıt/icra veya montaj gibi kaynak ayrımı olasılığı güçlenir; bu tarama tek başına sebebi belirlemez. Parmak izi üç bitten fazla değişmiş bir eşleşmeyi kaçırabilir ve seçili üç kısa pencere tüm âyeti temsil etmez. Bu nedenle tutulmuş 134 âyet için QUL zamanlarını QDC sesine aktarmak hâlâ gerekçesizdir.

Yalnız `review/` altında araştırma betiği ve kanıt dosyaları eklendi; üretim zamanları, oynatma ve dağıtım değiştirilmedi.
