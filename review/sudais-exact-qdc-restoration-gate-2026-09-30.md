# Südeys'in QDC kaydından güvenli geri açma kapısı (inceleme)

Mevcut karantina (3, 4, 5, 28, 29. sûreler) korunmalı. Sağlayıcının âyet zamanlarını tek bir ofsetle düzeltmek güvenli değil: tam MP3 çözümü ve QUD Base/Large kontrolünde 3:160, 4:143, 5:5, 28:44 ve 29:35 gibi uzak örnekler yanlış âyet alanına düşüyor. Aralık isteği/MP3 seek hatası değil; tam çözülen PCM ile indexed PCM aynı. Kaynak: `sudais-chapter-timing-audit-2026-09-30.md`.

## Dar ve kaynakla eşleşen adaylar

| Âyet | QDC PCM'sinde iki QUD modelinin bulduğu âyet (ms) | Son kelime adayı (ms) | Sonraki âyet başlangıcı (ms) | Durum |
| --- | ---: | ---: | ---: | --- |
| 3:160 | 2658483–2677407 | 2673853–2677133 | 2677437 | Yalnız inceleme |
| 4:143 | 2966063–2980867 | 2979547–2980477 | 2980897 | Yalnız inceleme |
| 5:5 | 155137–192853 | 191167–192827 | 192883 | Yalnız inceleme |

Kaynak dosyalarının uzak başlangıç/orta/son örnekleri canlı QDC CDN dosyasıyla bayt bayt eşleşti. QUD Base ve Large, uzun komşu-âyet pencerelerinde aynı âyet sırasını ve yaklaşık 20 ms içinde aynı uçları buldu. 3:160 için 18/18, 4:143 için 16/16 kelime pozisyonu tekil ve sıralı; 5:5'te 24–25. pozisyonlar tekrarlanıyor. Veriler `sudais-qdc-endpoints-2026-09-30.md`, `sudais-qdc-word-candidates-2026-09-30.json` ve yerel `test-results/review-sudais-qdc-verse-ends/*-real-{search,base}.json` içindedir.

**Bu üç âyet dahi henüz üretim için onaylı değil.** Modellerin âyetler arasındaki 30 ms etiketi gerçek sessizlik göstermiyor. Aynı PCM'nin ±500 ms RMS taramasında üç uçta da güçlü sessiz aralık çıkmadı (`audit-sudais-qdc-verse-boundaries.mjs`). 3:160 son kelimesi ile sonraki âyet başlangıcı arasında modelce yaklaşık 304 ms, 4:143'te 420 ms, 5:5'te 56 ms bulunsa da uzatılan son ses/yankı ve sonraki ilk harf karşılıklı dinlenmeden bu alan kesim garantisi vermez. 5:5 özellikle dar.

## Otomatik kapı ve doğrulama sınırı

Her geri açılacak âyet için yalnız **uygulamadaki tam QDC MP3'ü** baştan çözülerek kaynak SHA-256 sabitlenir. Örtüşen 30–60 saniyelik pencerelerde QUD Base ve Large bağımsız çalıştırılır; hedef ve iki komşu âyetin sırası, kanonik kelime kapsamı, gerçek tekrarlar, kelime uçları ve model uzlaşması doğrulanır. Aday aralık yeniden kesilip iki modelle tekrar tanınır; hedefin son kelimesi ve sonraki âyetin ilk kelimesi için pozitif/negatif kontrol yapılır. Her küçük parça sınırında RMS/spektrogram sessizlik bulgusu ve iki taraftaki ses dinlemesi gerekir. Sessizlik yoksa veya modeller ayrışırsa yalnız o aralık kapalı kalır. Bunun sonucu ayet düzeyinde ve mod düzeyinde (tam âyet, küçük parça, kelime seçimi, tekrar/1+2) işaretlenir; bir modun geçmesi diğerlerine otomatik izin vermez.

Bu kapı yanlış âyet kimliğini otomatik olarak yakalamaya yarar; **fonem sonunun yutulmadığını yalnız ASR/RMS kanıtlayamaz**. Böyle bir durumda yanlış kesimi yayımlamak yerine karantina sürer. QUL zamanları veya sesine ihtiyaç yoktur; QUL lisansını veya ses sahipliğini varsaymaz. Kullanıcı şimdilik dinleme yapamadığını belirttiği için dinleme onayı bekleyen sınırlar onaylı sayılmamalı.
