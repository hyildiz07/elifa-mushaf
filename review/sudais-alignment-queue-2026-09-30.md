# Südeys hizalama iş kuyruğu

`node review/prepare-sudais-alignment-queue.mjs` beş özgün QDC sûre kaydının SHA-256 değerini denetler, 653 âyetlik toplu tarama çıktısını bir kez okur ve `sudais-alignment-queue-2026-09-30.json` dosyasını yeniden üretir.

| Kuyruk | Âyet | İşlem |
| --- | ---: | --- |
| `sourceAndShape` | 429 | QDC ile aynı dalga şekli ve kanonik kelime dizisi bulunan örneklerde **bağımsız** kelime/fonem hizası ve iki taraflı kesim denetimi |
| `repeatOrLabel` | 90 | Tekrarı ve etiket sırasını çöz, ardından hizala |
| `directQdcAlign` | 134 | Sınırlı kaynak taraması eşleşmediği için doğrudan özgün QDC sesine hizala |

Kullanıcı bildirimi veya âyet sınırı riski taşıyan örnekler her kuyrukta öne alınır. Her iş, sûre MP3 yolunu, doğrulanmış SHA-256 değerini, âyet numarasını, kanonik kelime sayısını ve varsa kaynak zaman kaymasını taşır. Kaynak eşleşmesi ya da kelime sayısının tutması **güvenli kesim kanıtı değildir**. Bu dosya üretim uygulamasında kullanılmaz; mevcut koruma sürer. Üretime geçirilecek her sınır, son fonemin bitişi ve sonraki fonemin başlangıcı için ayrı ayrı doğrulanmalıdır.
