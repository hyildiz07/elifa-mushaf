# Sûre sonu kaynak sesi öncelik taraması — 2026-10-01

`node review/audit-final-tail-energy.mjs`, önceki üretim oynatma denetimindeki
221 son âyetin **özgün sûre MP3'lerinden** indeksli son PCM penceresini açtı.
Her pencere, indeksin kalibre edilmiş fiziksel sonuna en çok 26,1 ms kala
bitiyor. Ham ölçümler `test-results/final-tail-energy.json` dosyasında
(Git tarafından yok sayılır). Bu tarama uygulama zamanlarını değiştirmez.

| Ölçüm | Sonuç |
|---|---:|
| Kaynağı açılıp ölçülen kayıt | 221/221 |
| Son çözülmüş 10 ms RMS > 0,01 | 69 |
| Üretim kesimi fiziksel sondan >50 ms önce **ve** hemen sonraki 50 ms RMS > 0,02 | 77 |
| Bu iki öncelik işaretinden en az biri veya metadata sonu fiziksel sonu aşıp son 10 ms RMS > 0,002 | 103 |

RMS yalnız ses enerjisidir. Son harfin tamamı, sonraki harfin sızması,
yankı ve Muallim tekrarları yalnız bu sayılarla ayırt edilemez. Bu yüzden
103 sayı **hata sayısı değil**, dinleme ve fonetik kontrol sırasıdır.
Enerjisi düşük kalan kayıtlar da fonetik açıdan otomatik onaylanmış sayılmaz.

İlk dinleme önceliği, metadata bitişi dosya sonunu aşarken son PCM'nin
etkin kaldığı Hânî kayıtlarıdır:

| Kaynak âyet | Üretim sonu − fiziksel son | Son 50 ms RMS | Son 10 ms RMS |
|---|---:|---:|---:|
| Hânî 2:286 | +475 ms | 0,01270 | 0,01275 |
| Hânî 24:64 | +464 ms | 0,00639 | 0,00409 |
| Hânî 107:7 | +255 ms | 0,00996 | 0,00911 |
| Hânî 113:5 | +148 ms | 0,01059 | 0,00826 |
| Hânî 31:34 | +98 ms | 0,00114 | 0,00003 |
| Hânî 88:26 | +39 ms | 0,00423 | 0,00019 |

İkinci öncelik, üretim kesiminden **sonra** güçlü PCM bulunan ve özellikle
fiziksel dosya sonunda da etkin kalan kayıtlardır. Örnekler:

| Kaynak âyet | Üretim sonu − fiziksel son | Kesimden sonraki 50 ms RMS | Son 10 ms RMS |
|---|---:|---:|---:|
| Südeys 71:28 | −325 ms | 0,16373 | 0,03871 |
| Südeys 34:54 | −583 ms | 0,15615 | 0,02732 |
| Südeys 42:53 | −1319 ms | 0,12495 | 0,01941 |
| Südeys 20:135 | −62 ms | 0,12451 | 0,03927 |
| Hüsarî Muallim 25:77 | −1942 ms | 0,12155 | 0,00096 |
| Südeys 46:35 | −81 ms | 0,09560 | 0,06789 |
| Südeys 27:93 | −3 ms | kesim fiziksel sona çok yakın | 0,04341 |

Özellikle Hüsarî Muallim'deki kesim sonrası ses, son âyetin ikinci okunuşu
veya fazladan eğitim tekrarı olabilir; tüm bu bölümü âyete eklemek doğru
değildir. Südeys 27:93 için üretim seçimi reddi yerel v293'te ayrıca
düzeltildi; buradaki ölçüm son fonemin tamlığını yine kanıtlamaz.

**Bu ölçümle onaylanamayanlar:** 221 kaydın tamamında son fonemin işitsel
tamlığı açık kalır. 650 ms sınırının dışında kalan Hânî 65:12 (887 ms
taşma, etkin son PCM) ve Südeys 4:176 (çok büyük zaman uyuşmazlığı) zaten
korumalıdır ve bu 221'lik ölçüme dahil değildir. Aynı icranın ayrı âyet
klibi kaydın sonuna kadar eşleşse bile klip de aynı ana kaynaktan kesilmiş
olabilir; bağımsız devam veya son ses kanıtı sayılmaz.

Üretime yeni kesim veya koruma kaldırma önerilmez. Öncelikli kayıtların
son 1 saniyesi, kanonik son kelime ve varsa bağımsız aynı icra kaydıyla
karşılıklı dinlenip kelime/son harf düzeyinde işaretlenmelidir.
