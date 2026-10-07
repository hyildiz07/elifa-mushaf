# Südeys 653 âyet için toplu inceleme sırası

Kaynak kimliği taramaları, özgün QDC sûre MP3'lerini ve QUL kaynak MP3'lerini her sûre için yalnız birer kez baştan sona çözüyor. 3/4 için 376 âyet ve 1.128 pencere yaklaşık 12,5 saniyede, 5/28/29 için 277 âyet yaklaşık 9–11 saniyede tarandı. Toplam **653 âyet yaklaşık 23 saniyede ilk kuyruğa ayrılıyor**. Bu süre model hizalaması veya kesim onayı süresi değildir.

| İnceleme kuyruğu | Âyet | Sonraki işlem |
| --- | ---: | --- |
| 3/4: QDC–QUL ses pencereleri eşleşiyor, katı kelime sırası kapısı geçti | 302 | Bağımsız QDC hizası ve her önerilen kesimin iki taraflı fonem denetimi |
| 3/4: ses eşleşiyor, tekrar veya etiket gerilemesi var | 74 | Gerçek kıraat tekrarı ile yanlış etiketi ayır, sonra kesimleri denetle |
| 5/28/29: üç pencere kaynak eşleşmesi ve katı kelime sırası kapısı geçti | 127 | Özgün QDC kesim denetimi |
| 5/28/29: ses eşleşiyor, kelime kapsamı/tekrar/sıra kapısında tutuldu | 16 | Etiket ve gerçek tekrarları uzlaştır |
| 5/28/29: bu taramada tam âyet eşleşmesi yok | 134 | QDC'ye doğrudan bağımsız hizalama; farklı icra veya montaj olasılığı |

İlk taramada **519 âyet** üç PCM penceresinde aynı ses dalgasına eşleşiyor (3/4'te 376; diğerlerinde 143). Bunların **429'u** katı kanonik kelime kapsamı ve sıra kapısını da geçiyor; **90'ı** geçmiyor. Bu sayılar `node review/triage-sudais-all-structural.mjs` ile üretilen `sudais-batch-structural-triage-2026-09-30.json` raporunda âyet düzeyinde kayıtlıdır. 5/28/29'daki 134 eşleşmeyen âyetin gerçekten farklı icra olduğu bu sonuçtan çıkarılamaz; geniş aramanın yanlış negatifleri olabilir. 28. sûrenin 88 âyeti aynı zaman ekseninde eşleşti. 29'da 1–45, 5'te 111–120 eşleşti; tek ofset bütün sûreye taşınamaz. Ayrıntılı kaynak SHA'ları ve ölçümler `sudais-batch-screen-2026-09-30.md` ile `sudais-qdc-qul-5-28-29-identity-screen-2026-09-30.md` içindedir.

Sınır güvenliği ayrı kapıdır. 3/4'te 374 komşu geçişin sabit 200 ms QUL boşluğunda, hatta ±1 saniyelik geniş taramada katı ≥120 ms sessizlik kanıtı **0**. Daha gevşek düşük enerji eşiği 58 inceleme vadisi buldu; yalnız 9'u metadata merkezine 200 ms yakın ve hiçbiri bir âyetin iki komşu ucunu birlikte sağlamıyor. Düşük enerji son/ilk fonemin yerini kanıtlamaz. Bu nedenle **üretime otomatik açılan âyet 0**; mevcut koruma ve hoca seçimi sürmeli.

Hızlı devam yolu: 429 temiz adayı özgün QDC sesindeki bağımsız model ve iki taraflı kesim denetimine topluca sokmak; 90 tekrar/etiket istisnasını ayrı uzlaştırmak; 134 eşleşmeyeni bağımsız QDC hizalayıcıya önceliklendirmek. Her açılacak parça sınırı için kaynak SHA, iki bağımsız hizalama/konuşma kanıtı, komşu âyet kontrolü ve uygulamadaki tam âyet/parça/kelime/tekrar/1+2 kipleri sınanmalı. Yeni QUL zamanları paketlenmeden önce bu kaynağın kullanım koşulları netleşmeli.
