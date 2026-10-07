# Sûre sonu ses hazırlama denetimi — 2026-10-01

PowerShell'de `$env:FINAL_TAIL_FORCE='1'; node review/audit-all-final-tail-playback.mjs`
gerçek uzak MP3 kaynaklarıyla,
ham sağlayıcı son zamanı MP3 dosya sonundan ileri olan 221 ve 650 ms sınırında
kalan son âyetin tamamını denedi. Üretimdeki gibi âyet aralığı segmentlerden,
`audio.end` da son segmentten üretildi. Her kayıtta `prepareWindow` ve ardından
`prepareSelectedRange` çağrıldı. Doğrulanmış Südeys VBR indeksi kaynakla eşleşti.
Ham, yeniden başlatılabilir sonuç:
`test-results/all-final-tail-production-playback.json` (Git tarafından yok sayılır).

| Sonuç | Adet |
|---|---:|
| Denenen son âyet | 221 |
| `prepareWindow` başarılı | 221 |
| `prepareSelectedRange` başarılı | 221 |
| Seçim reddi | 0 |

v292'deki tek kalıcı hata Südeys **27:93** idi: `Selected audio range incomplete`.
Üretim segment aralığı 1.019.750–1.032.135 ms; sağlayıcı sonu 1.032.450 ms.
Doğrulanmış VBR indeksiyle kalibre edilen fiziksel dosya sonu
1.032.138,209 ms. `prepareWindow` gerçek PCM'yi 1.032.112,086 ms'ye kadar
çözüyor: istenen segment bitişinden yaklaşık **22,9 ms**, indeks sonundan
**26,1 ms** önce. Mevcut `completeAtIndexedFileEnd` yalnız istek indeks
sonunu aşıyorsa tolerans tanıdığı için bu son kelimeyi reddediyor. İndeks
eşleşmesi ve dekodaj sonunun indeks sonuna yakınlığı birlikte doğrulanarak
v293'te doğrulanmış fiziksel dosya sonuna 40 ms yakın son kare için eklenen
dar toleransla bu kayıt da geçti; genel 650 ms sınırı genişletilmedi.
Yeniden hazırlanan pencere ve seçim ikisinde de `hi=1.032.112,086 ms`,
`finalTailRequestedEnd=1.032.135 ms`. 221 kaydın tamamı gerçek kaynakla
yeniden çalıştırıldı; bu sonuç yalnız önceki JSON'u yeniden saymak değildir.

İlk taramada test nesnesi `audio.end` içermiyordu ve seçim sağlayıcı
`timestamp_to` değerine kadar uzatılıyordu. Bu üretim davranışı değildi;
altı kısa sûre için sahte 250 ms son-uzatma hatası üretti. Üretim aralığına
geçilince altısı da geçti. Hânî 9:129 için bir ilk ağ/dekod denemesinde
`Audio format changed` görüldü; üretim-biçimli tekrar denemesinde başarılı
oldu. Böylece kalıcı hata olarak sayılmadı.

Bu denetim sesin indirilebilirliği ve seçili son âyet penceresinin
hazırlanabilirliğini ölçer; son fonemlerin işitsel doğruluğunu kanıtlamaz.
Südeys 4:176 ve Hânî 65:12, 650 ms üzerindeki ayrı karantina kayıtları
olduğu için bu 221'lik kümenin dışında kaldı. Canlıya yükleme yapılmadı.
