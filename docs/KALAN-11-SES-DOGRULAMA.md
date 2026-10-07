# Kalan 11 ses bölme istisnası — doğrulama kaydı

**v265 kaynak güvenliği notu:** Bu 11 satır yalnız kısa parça planı istisnalarıdır. Daha sonra Südeys'in 3, 4, 5, 28 ve 29. sûrelerinde üretim MP3'ü ile sağlayıcı âyet saatinin sistematik biçimde ayrıldığı doğrulandı; bu beş sûrenin Südeys sesi geçici olarak kapatıldı. Dolayısıyla aşağıdaki sayı bütün ses doğruluğu sorunlarının sayısı değildir. [Kanıt ve koruma kaydı](SES-v265.md).

Bu kayıt `split-exceptions-v264.json` ve yerel inceleme çıktılarından hazırlanmıştır. Sayısal oynatma planı taraması sıfır yapısal hata buldu; bu, aşağıdaki seslerin kelime kelime dinlenerek doğrulandığı anlamına gelmez. Hedef, bir kelimeyi kesmeden ve sonraki kelimeden ses sızdırmadan kısa ezber parçaları üretmektir. Her kesimin sol ve sağ tarafı, aynı hocanın aynı kaynak kaydında bağımsız dinlemeyle doğrulanmadan üretim zamanına aktarılmamalıdır.

| Hoca | Âyet | Şimdiki parça boyları | Açık mesele | İnceleme kaydı |
| --- | --- | --- | --- | --- |
| Hüsarî Muallim (12) | 2:145 | 10+4+5+13 | Üç iç sınır onaylı; 10 ve 13 kelimelik kısımların içinde ek sınır kanıtı yok. | [Dinleme sayfası](husary-muallim-2-145-review.html), [kaynak raporu](HUSARY-MUALLIM-2-145-TEKRAR-INCELEMESI.md) |
| Südeys (3) | 24:35 | 4+5+5+5+6+7+3+9+4 | v264 sürümünde aynı icraya eşlenen 48 kelime ve sekiz sessiz kesim uygulandı. Dokuz kelimelik bir parça kaldığı için sıkılık hedefinde hâlâ istisna. | [Dinleme sayfası](sudais-verse-review.html), [ses denetimi](../review/sudais-2435-playback-check.json) |
| Südeys (3) | 3:160 | 18, kapalı | Son kelime zamanı sağlayıcının âyet sonunu aşıyor. Tam âyet aralığı bile kanıtlanmalı. | [Dinleme sayfası](sudais-verse-review.html) |
| Südeys (3) | 39:54 | 13 | Özgün veri 13 kelimeyi tek satırda veriyor. Tekrarlı 4–5. kelimeleri içeren alternatif zamanlar ve telif durumu doğrulanmalı. | [Dinleme sayfası](sudais-verse-review.html), [tekrar adayı](../review/sudais-39-54-repeat-candidate.json) |
| Südeys (3) | 4:134 | 14 | Etiketlerin sonundaki 1 ve 7 tekrarları gerçek ses sırasıyla eşlenmedi. | [Dinleme sayfası](sudais-verse-review.html), [alternatif aday](../review/sudais-4-134-qud-candidate.json) |
| Südeys (3) | 4:143 | 16, kapalı | Son kelime zamanı âyet sonunu aşıyor. | [Dinleme sayfası](sudais-verse-review.html) |
| Südeys (3) | 5:5 | 43, kapalı | Son kelime zamanı âyet sonunu aşıyor. | [Dinleme sayfası](sudais-verse-review.html) |
| Südeys (3) | 5:46 | 4+15+4+3 | 13–18. kelimelerin etiketleri yok; ortadaki uzun parçaya güvenilir iç sınır lazım. | [Dinleme sayfası](sudais-verse-review.html) |
| Südeys (3) | 5:82 | 5+19+2 | 9 ve 18–23. kelime etiketleri yok; ortadaki uzun parçaya güvenilir iç sınır lazım. | [Dinleme sayfası](sudais-verse-review.html), [alternatif aday](../review/sudais-5-82-qud-candidate.json) |
| Hânî (5) | 34:46 | 24, kapalı | Son ses ve kelime sırası özgün kayıtta güvenilir biçimde doğrulanmadı. | [Dinleme sayfası](../review/hani-audio-review.html), [kaynak raporu](SES-HANI-34-46-6-139-DENETIMI.md) |
| Hânî (5) | 6:139 | 22, kapalı | 17/18 etiketleri belirsiz ve son ses güvenilir biçimde doğrulanmadı. | [Dinleme sayfası](../review/hani-audio-review.html), [kaynak raporu](SES-HANI-34-46-6-139-DENETIMI.md) |

Bir vaka ancak şu kanıtlar bir arada olduğunda kapatılabilir:

1. Kaynak sesin uygulamadaki hocaya ait **aynı icra** olduğu kaydın birden fazla uzak noktasında doğrulanır. Başka hocanın veya başka okumada aynı metnin zamanları kullanılmaz.
2. Eksik/tekrarlanan kelimeler için işitilen sıra, mushaf kelimeleriyle eşleştirilir; tekrar edilen sözler oynatmadan düşürülmez.
3. Önerilen her kesimin öncesi ve sonrası dinlenir: sol kelime tamam, sağ kelime tam başlıyor, üçüncü kelimeden sızma yok. Âyet sonu ve sonraki âyet başlangıcı ayrıca kontrol edilir.
4. Kullanılacak ses/zaman verisinin yeniden kullanım koşulları kontrol edilir. İnceleme amacıyla indirilmiş aday kayıt, otomatik olarak ürün varlığı sayılmaz.
5. Üretim değişikliğinden sonra ilgili âyetin normal, bölünmüş, seçili aralık, tekrar ve 1+2 akışı denenir; tam korpus yapısal taraması ve canlı sürüm doğrulaması tekrar çalıştırılır.

**Öncelik:** Kapalı beş âyet için önce tam âyet sonunu kanıtlamak; ardından 24:35, 5:46 ve 5:82'nin eksik kelime eşlemesini tamamlamak. Kesim sayısını düşürmek adına doğrulanmamış zamanı yayımlamak sıfır hata hedefiyle bağdaşmaz.
