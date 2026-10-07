# Südeys 24:35, 5:46, 5:82 — kalan sınırların denetimi

Bu kayıt yalnız inceleme kanıtıdır; üretim zamanlarına aktarım onayı değildir.

## 24:35

`sudais-24-35-transfer-candidate.json` içindeki EveryAyah 64 kbps kelime zamanları, uygulamanın QuranCDN sûre kaydıyla 10 ayrı yüksek enerjili PCM penceresinde aynı icra olarak eşleşiyor (korelasyonlar 0,8752–0,9443; ortak ofset yayılımı 13 ms). Aday 48 kelimenin tümünü kapsıyor ve en büyük parça 7 kelime. Dokuz aday kesimin yedisi özgün QDC etiketlerinde tekil kelime sonuyla ayrıca karşılaştırılabiliyor:

| Son kelime | Aday kesim (ms) | QDC etiket sonu (ms) | Fark (ms) | Durum |
| ---: | ---: | ---: | ---: | --- |
| 4 | 621784 | 621950 | −166 | Tekil etiket |
| 9 | 626765 | 626590 | +175 | Tekil etiket |
| 16 | 634477 | 634260 | +217 | Tekil etiket |
| 20 | 639768 | 639700 | +68 | 20. kelime iki ayrı etikette; ikinci etiket sonu kullanıldı |
| 25 | 645010 | 645060 | −50 | Tekil etiket |
| 32 | 654052 | 653960 | +92 | Tekil etiket |
| 35 | 658423 | — | — | 33–35 için özgün etiket kayıp |
| 40 | 664045 | 664150 | −105 | Tekil etiket |
| 44 | 669306 | 669180 | +126 | Tekil etiket |

20 ve 35 için bağımsız QDC kelime sınırı kanıtı yok. Özellikle 20. kelime iki kez etiketlendiğinden, aday kesimin tekrar edilen sesi sahiplenmesi dinlenmeli. Dokuz kesimin *hepsinde* sol son kelimenin eksiksizliği, sağ ilk kelimenin eksiksizliği ve sızma yokluğu işitilmeden `audition_status` değiştirilmemeli. PCM düşük enerji oranları hece bütünlüğünü tek başına kanıtlamaz.

## 5:46 ve 5:82

5:46'da QDC etiket dizisi 1–12'den sonra 5, 6, 7 olarak geri dönüyor; 13–18 yok. 5:82'de 9 ve 18–23 yok, 14/15 ve 6 tekrar ediyor. Bu bölgeleri sırf sıradaki boş zamana göre etiketlemek ses/metin kayması oluşturabilir. EveryAyah 64 ve 192 kbps adayları QDC sûre kaydına güçlü eşleşmedi: 5:46 için test edilen pencere korelasyonları yaklaşık 0,16–0,31; 5:82 için yaklaşık 0,19–0,29. Bunların kelime zamanları aynı icraya taşınamaz. QUD 5:82 adayı da EveryAyah kaydı üzerindedir; QDC kaydının aynı kesimleri için kanıt değildir.

## Kapatma koşulu

24:35 için mevcut dokuz adayın iki taraflı uzman dinleme kaydı alınmalı. 5:46 ve 5:82 için doğrudan uygulamanın QDC sesine hizalanmış, tekrarlanan/eksik kelimeleri açıkça gösteren yeni kaynak veya elle doğrulanmış kayıt gerekli. Sonrasında normal, bölünmüş, tekrar, seçili kelime ve 1+2 oynatma aynı kayıt üzerinde sınanmalı.
