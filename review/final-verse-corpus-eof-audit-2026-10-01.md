# Sûre sonu MP3 bitiş taraması — 2026-10-01

Üretimde seçilen 11 kâri × 114 sûre için 1.254 metadata/MP3 URL eşleşmesi tarandı. Yerel doğrulanmış metadata bulunan eşleşmelerde `assets/verified-audio`, kalanlarda mevcut `test-results/timings` kopyaları kullanıldı; URL'ler [canlı kaynak denetimi](remote-audio-audit-2026-09-30.md) ile karşılaştırıldı. CBR kayıtların yalnız ilk 64 KiB aralığı, doğrulanmış Südeys VBR kayıtlarının ilk/son 64 KiB aralıkları ve HEAD bilgileri okundu. Tam sûre MP3'leri indirilmedi. Ham sonuç: `test-results/final-verse-corpus-index.json`; tekrar üretim: `node review/audit-final-verse-corpus.mjs`.

**1.253/1.254 kayıt indekslendi.** 223 son âyetin sağlayıcı bitişi hesaplanan ham MP3 bitişinden sonra: 221'i en fazla 650 ms, ikisi daha fazla. Üretimde doğrulanmış indeksi olmayan tek kayıt Yâsir ed-Dûserî 1:7; etiketli Info başlığı bulunmadığı için uygulama indeksli yolu kullanmıyor. Araştırma amaçlı etiket kullanılmasına izin veren hesap, 47.987 ms dosya bitişi ve 47.970 ms metadata bitişi gösterdi; bu üretim indeksi sayılmadı.

| Kayıt | Metadata sonu | Ham MP3 sonu | Fark | Durum |
|---|---:|---:|---:|---|
| Südeys 4:176 | 3.648.770 ms | 3.549.989 ms | 98.781 ms | Önceden karantinada; son âyet dosyada bu zaman aralığında yok. |
| Hânî 65:12 | 317.440 ms | 316.578 ms | 862 ms | Yeni, yeniden üretilmiş seçim hatası. |

Hânî 65:12 için gerçek `prepareSelectedRange` çağrısı `Selected audio range incomplete` verdi. Kalibrasyonla MP3'ün kullanılabilir sonu **316.553 ms**; istenen sonla fark **887 ms**. Ayrı EveryAyah `065012.mp3` klibinin aynı icraya ait olduğu, altı saniyelik PCM karşılaştırmasında **0,99969 korelasyon** ile doğrulandı. Zaman ekseni hizalandığında klip sûre kaydının sonundan yalnız yaklaşık **1 ms önce** bitiyor; eksik 887 ms'lik bir devam sağlamıyor. Sûre kaydının son 200 ms'lik 20 ms pencerelerinde RMS **0,00317–0,00495**; son pencerede **0,00338**. Bu kapanış sessiz kabul edilemez ve son fonemin tamlığını kanıtlamaz. Ölçüm betiği `review/probe-hani-65-12-tail.mjs`, ham sonuç `test-results/hani-65-12-tail.json`.

Bu bulgu genel 650 ms eşiğini genişletmeye dayanak oluşturmuyor. Hânî 65:12 için kaynağın son fonemi güvenilir referansla işitsel olarak incelenmeden metadata bitişini dosya sonuna çekmek veya oynatmayı başarılı saymak eksik bir okuma riskini gizler. Tarama yalnız son âyetlerin dosya sonuyla ilişkisini ölçer; bütün âyetlerin teknik oynatılabilirliğini veya işitsel doğruluğunu kanıtlamaz.

## Yerel v290 güvenlik düzeltmesi

Hânî 65:12 için bölme kartı, kelime seçimi ve tek âyet/tekrar adımları belirsiz son sesi oynatmıyor; hoca değiştirme veya kesintisiz sûre akışını öneriyor. Bu engel aynı hocanın bütün Talâk sûresi akışına uygulanmıyor. Birim testleri ve yerel derleme geçti (236 test, 234 başarılı, 2 Firebase atlandı). Canlıya henüz yayımlanmadı; son fonemin işitsel incelemesi açık.
