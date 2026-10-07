# Üç eski kaynak kuyruğunun fonem modeli denemesi

`python review/probe-final-tail-phoneme-ctc.py` yerel A/B örneklerini,
önceden indirilen Arapça Wav2Vec2 CTC modeliyle serbest çözdü. Ham çıktı
`test-results/final-tail-phoneme-ctc.json` dosyasındadır. Modelin yaklaşık
20 ms kareleri, bağlama duyarlı sonuçları ve yankıyı ayıramaması nedeniyle
bu deney bir kesim veya kaynak değiştirme onayı değildir.

| Âyet | Üretim son 2 saniye | Eski kaynak aynı başlangıç + kuyruk | Çıkarım |
|---|---|---|---|
| Südeys 36:83 | Son `n` adayı kesimden önce | Son `n` adayı yine kesimden önce | Ek 209 ms'de ayrı bir fonem doğrulanmadı. |
| Hânî 2:286 | Serbest sonuç boş | `n` adayı eski örneğin ~1,69. saniyesinde, üretim sonundan **önce** | Bağlama duyarlı ayrışma; 526 ms ek kuyrukta eksik harf kanıtı yok. |
| Hânî 65:12 | `E i l m aa` | Aynı `E i l m aa` | Son kelime hipotezi aynı, 7,18 saniyelik dosya farkının büyük kısmı sessizlik. |

Sinyal eşleşmesi ve enerji ölçümü eski kaynakların farklı uzunlukta olduğunu
gösterir; eksik harfin kimliğini göstermez. Bu yüzden uygulamanın ses kaynağı
ve güvenlik korumaları bu deneyle değiştirilmedi.
