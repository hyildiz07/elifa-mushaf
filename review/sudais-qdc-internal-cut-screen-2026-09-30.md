# Südeys 429 adayında kelime içi kesim taraması (yalnız inceleme)

`node review/screen-sudais-qdc-internal-cuts.mjs`, kaynak sesi ve kanonik kelime sırası ilk kapıdan geçen 429 âyetteki **6.822 komşu kelime sınırını** uygulamanın kullandığı beş özgün QDC MP3 üzerinde tarar. Her MP3 tek kez baştan sona çözülür ve SHA-256 değeri önceki kaynak eşleme raporuyla doğrulanır. QUL kelime saatleri yalnız QDC ile üç PCM çapası eşleşen âyetlerde aday merkez olarak kullanılır. Tarama merkez çevresinde ±150 ms, 10 ms en yüksek kanal RMS çözünürlüğündedir.

| Sûre | İlk kapı âyetleri | Kelime sınırları | Katı sessizlik inceleme işareti | Düşük enerji inceleme işareti |
| --- | ---: | ---: | ---: | ---: |
| 3 | 164 | 2.509 | 0 | 2 |
| 4 | 138 | 2.445 | 0 | 1 |
| 5 | 9 | 183 | 0 | 0 |
| 28 | 76 | 1.122 | 0 | 0 |
| 29 | 42 | 563 | 0 | 0 |
| **Toplam** | **429** | **6.822** | **0** | **3** |

Katı işaret, yerel tepenin %1,5'i veya 0,002 RMS'den düşük en az 80 ms aralığın metadata merkezinden en çok 75 ms uzakta olmasıdır. Düşük enerji işareti, %10 veya 0,03 RMS eşiğidir. Üç düşük enerji konumu **3:66 / 7–8**, **3:102 / 3–4**, **4:11 / 8–9**; bunlar otomatik kesim değildir. Her 6.822 metadata kelime boşluğu 0–50 ms olduğundan sağlayıcının boşluk satırı tek başına güvenilir durak kanıtı olamaz.

Bilinen sorun örnekleri 3:160, 4:143, 28:44 ve 29:35 ilk kapıyı geçse de iç kelime sınırlarında katı veya düşük enerji işareti üretmedi. 5:5, 5:46 ve 5:82 ilk kaynak+sıra kapısını geçmediğinden bu taramaya alınmadı. Bu durum söz konusu kelimelerde durak *yok* veya doğru kesim *imkânsız* demek değildir; dar ve katı enerji kestirmesiyle onay bulunmadığını gösterir. Kıraat akıcı olduğunda kelime sonları arasında sessizlik bulunmayabilir. Sessizlik görülse bile son harfin tamamını, yankının aidiyetini veya sonraki kelimenin başlamadığını RMS belirleyemez.

Tam aday listesi, kaynak SHA'ları, QDC ofsetleri, eşikler ve her sınırın ölçümü `sudais-qdc-internal-cut-screen-2026-09-30.json` içindedir. **Üretime onaylanan kesim 0**; karantina korunmalı. Hızlı fakat güvenli sonraki yöntem, kelime bazında iki bağımsız QDC hizalayıcının fonem konumlarını karşılaştırıp yalnız uyuşanları iki taraflı kesilmiş örnek ve uygulama kipleriyle denetlemektir.
