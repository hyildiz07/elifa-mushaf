# Hânî ve Hüsarî istisnaları: ek akustik karar

## Hânî 6:139

EveryAyah 192 kbps 6:139 klibi ile uygulamadaki sûre MP3'ü aynı icranın eşleşen dalga biçimini taşıyor; önceden ölçülen son PCM penceresi korelasyonu yaklaşık 0,912. QUD³ aynı klipte 22/22 kanonik kelimeyi eksiksiz ve sırayla, son `عَلِيمٌ` kelimesi dahil, 26,973. saniyeye kadar hizalıyor. Dosya 26,98449 saniye; sûre kaydında bu ucun hemen sonrasındaki ilk ve ikinci 10 ms RMS sırasıyla 0,000035 ve 0,000003. [Bağımsız 6:140 hizalaması](./hani-006140-qud-candidate.json) ilk kanonik 6:140 kelimesini klip başlangıcından 20 ms sonra buldu. Aynı klibin sûre kaydı eşleşmesi ~2862080 ms olduğundan sözlü 6:140 başlangıcı ~2862100 ms; 6:139 dosya sonu ~2862089 ms, yani sonraki sözlü başlangıçtan yaklaşık 11 ms önce. Bu birleşik ölçümler tam âyet kaynağını ve tam âyet tekrarını yüksek güvenli bir aday yapar; son fonemin tamlığını işitsel olarak kesin ispatlamaz. İnceleme sayfasındaki son 0,9 saniye yine dinlenmelidir.

QUD³'ün beş öbeği arasındaki dört boşluk yalnız 30 ms. [Yeniden üretilebilir ölçüm](./hani-6139-qud-boundary-acoustics.mjs) ve [çıktısı](./hani-6139-qud-boundary-acoustics.json), sınırların ±50 ms çevresinde RMS'nin 0,0088–0,0182 olduğunu gösteriyor. Bunlar sessiz durak olarak onaylanamaz; model öbeklerini parçalı oynatma kesimi yapmak güvenli değil.

## Hânî 34:46

192 kbps ayrı klip ile sûre MP3'ü aynı icrayla eşleşiyor, fakat âyet sonunda görülen ek sesin kelime kimliği belirsiz. QUD³ 34:46 klibindeki `27,18–27,861 s` aralığını metinsiz, güven 0 olarak bırakıyor. [Bağımsız 34:47 hizalaması](./hani-034047-qud-candidate.json), sonraki âyetin ilk kanonik kelimesini ayrı klibin ancak 1,460. saniyesinde buldu; sûre saatiyle yaklaşık 874151 ms. Ek ses yaklaşık 872006–872687 ms, 34:46 ayrı dosyasının sonu yaklaşık 872699 ms. Böylece ek sesin sonraki âyetin ilk kanonik kelimesi olmadığına dair güçlü zaman kanıtı var; ancak önceki âyetin son kelime tekrarı mı, başka bir ses mi olduğu doğrulanmadı. Dosya ucunda hâlâ ölçülebilir ses bulunduğundan yeni tam âyet ucu veya parça sonu önerilmiyor.

## Hüsarî Muallim 2:145

İlk 61,25 saniyelik 2:145 kapsamı ve 1–10 / 11–14 / 15–19 / 20–32 dört parçası doğrulanmış durumda. [Akustik kesim denetimi](./check-husary-2145-cuts.mjs) son 13 kelimede yalnız 20. kelime arkasında yaklaşık 400 ms durak buluyor; tek kelimelik ilk parça ve hâlâ 12 kelimelik son parça ezber kolaylığı hedefini karşılamaz. 23/28 konumlarında sessiz durak yok, bu yüzden ek kesim önerilmiyor.

[40 ms enerji taraması](./husary-2145-inner-boundary-energy.mjs) aynı dosyada 23. kelime etiket sınırında RMS `0,028227`, 28. kelimede `0,016264` ölçtü. Sınırların ±250 ms çevresindeki en sessiz 40 ms pencereler bile sırasıyla `0,013182` ve `0,008446`; doğrulanmış 10/14/19 sınırlarındaki en sessiz pencereler `0,000574 / 0,000501 / 0,000406`. Ham sonuç [JSON](./husary-2145-inner-boundary-energy.json) içindedir. Bu karşılaştırma iç kesimin sessizliğe denk gelmediğini gösterir, ama fonem kimliğini söylemez.

## Hânî 6:140–141 birleşimi

[Bağımsız PCM eşleşmesi](./hani-140-tail-join.json), 6:140 ayrı klibinin sûre kaydında yaklaşık 2881724 ms'de bittiğini ve 6:141 ayrı klibinin aynı noktadan başladığını gösteriyor. [Enerji taraması](./hani-141-lead-acoustics.json), 6:141 klibinin ilk 400 ms'sinde belirgin ses, 2,2–2,4 saniyelerinde ise başka kısa bir ses buluyor. QUD³ Large ve Base, 6:141'in ilk kanonik kelimesini 4,2 saniyede başlatıyor; ancak önceki kısa sesin hangi âyete ait olduğu bağımsız dinlemeyle doğrulanmadı. Bu nedenle 6:140 sonu ve 6:141 başlangıcına yeni zaman sınırı uygulanmadı.

Üretimde yalnız aynı icraya ait SHA-256 ile doğrulanan 6:139 tam âyet kaynağı kullanılabilir; küçük parça kesimleri kapalı kalır. 34:46 ve 6:139'un küçük parça sınırları ile 2:145'in son 13 kelimesindeki ek sınırlar insan dinlemesi olmadan kesinleştirilemedi.
