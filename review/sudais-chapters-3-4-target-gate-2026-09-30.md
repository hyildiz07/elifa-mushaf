# Südeys 3–4: altı hedef âyet için üretim kapısı

Bu denetim yerel v281 sonrasında kalan 3. ve 4. sûre adaylarını üretim kaydına göre yeniden karşılaştırır. Uygulama, Südeys'in 3/4/5/28/29. sûrelerini `audioTimingUnverified` ile kapatır; tek bir kelime zamanını doldurmak bu kapıyı açmaz. Üretim QDC MP3 SHA-256 değerleri 3. sûre için `7a52d1efb56e31d8c84436aec39cbeebde8498dfa43acaf2c082c7c145153614`, 4. sûre için `60adc3638bc3cdf6dbfcf110ab1102f810794ea21e74f3764cd159b3f13d122d`. İncelenen QUL sûre kaydı QDC ile sûre başı/ortası/sonunda 0 ms ofsette yüksek PCM korelasyonu gösterir; bu kayıt kimliği ve yaklaşık saat için destekleyici kanıttır, kesim onayı değildir.

| Âyet | Üretim sağlayıcısı (ms) | QDC PCM'de bağımsız aday (ms) | Kalan engel |
| --- | ---: | ---: | --- |
| 3:37 | 615370–647470 | 615930–647980; sonraki âyet 648060 | Eksik 10. kelime iki modelde bulunsa da sağlayıcı bitişi gerçek okumanın yaklaşık 0,5 sn önünde. Sûre genelindeki saat kayması giderilmedi. |
| 3:160 | 2610330–2622580 | 2658483–2677407; sonraki âyet 2677437 | Sağlayıcı yanlış âyeti gösteriyor. 18/18 kelime adayı sıralı, fakat son fonem/3:161 girişi ve iç kesimler işitsel olarak onaylı değil. 30 ms model aralığı sessizlik kanıtı değil. |
| 4:95 | 2094160–2126240 | 2062750–2093307; sonraki âyet 2093337 | Eksik 15. kelime bulundu; sağlayıcı yaklaşık 31 sn sonra başlıyor. Bütün sûre karantinası sürüyor. |
| 4:134 | 2847350–2864300 | 2780610–2796887/2796893; sonraki âyet 2796917/2796923 | Sağlayıcı yaklaşık 67 sn sonra başlıyor. 14/14 metin konumu bulunabilse de 7/8 iç sınırı ve 4:135 girişi son fonemi koruyacak şekilde onaylı değil. |
| 4:143 | 3041450–3054380 | 2966063–2980867; sonraki âyet 2980897 | Sağlayıcı yanlış âyeti gösteriyor. 16/16 kelime adayı sıralı, fakat son ses/4:144 girişi ve iç sınırlar onaylı değil. |
| 4:146 | 3082120–3106150 | 3007423–3030087; sonraki âyet 3030117 | Eksik 6. kelime bulundu; 7–9. kelimeler gerçekten tekrarlanıyor. Sağlayıcı yaklaşık 75 sn geç. Tekil konum aktarımı tekrarın hangi parçaya ait olduğunu çözmez. |

**Karar:** Bu altı hedefin sıfırı üretimde güvenle açılabilir. v281 tam taramasında 3:37/10, 4:95/15, 4:134/14 ve 4:146/6 olmak üzere dört eksik kelime konumu görünür. 3:160, 4:134 ve 4:143 ayrıca uzun/korumalı parça vakalarıdır. Kalan eksik konumların tümünü bu altı vaka temsil etmez. Kaynak kimliği ve model kelimeleri yaklaşık yeri belirliyor, ancak üretim sağlayıcısının yanlış âyet saatini ve fonem kesimini düzeltmiyor. `index.html` ya da zaman varlıklarında değişiklik yapılmadı.

Geri açma için her ilgili sûrenin baştan sona kanonik âyet sırası ve komşu geçişleri **aynı üretim MP3'ünde** çıkarılmalı; her kullanılacak kesimin iki tarafı dinlenip son harf, sonraki harf ve tekrar sahipliği doğrulanmalı. En azından bu hedeflerde sağlayıcı sınırlarını körlemesine kullanmak, yanlış âyet veya yarım kelime oynatma riskini taşır. QUD/QUL model boşluğu tek başına sessizlik veya fonetik tamlık sayılmaz.

Kanıtlar: [küçük boşluklarda tam MP3 denetimi](sudais-exact-qdc-small-gaps-2026-09-30.md), [3:160 ve 4:143 gerçek uçları](sudais-qdc-endpoints-2026-09-30.md), [4:134 ikinci kaynak geçişi](sudais-second-source-pass-2026-09-30.md), [QDC/QUL 3/4 PCM eşleşmeleri](sudais-six-quarantine-source-followup-2026-09-30.md), [koruma kapısı](sudais-exact-qdc-restoration-gate-2026-09-30.md).
