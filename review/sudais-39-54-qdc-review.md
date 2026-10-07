# Südeys 39:54 — özgün sûre sesinde tekrar

Uygulamanın gerçek QuranCDN Südeys 39. sûre MP3'ünden hazırlanan pencere, QUD³ Tibyan Large ve Base modelleriyle ayrı ayrı hizalandı. İki model aynı sırayı buldu: 1–5, ardından 4–13. Yani 4 ve 5. kelimeler icracı tarafından ikinci kez okunuyor; bunları zamanlama hatası diye silmek ses bütünlüğünü bozardı. [Large sonucu](sudais-3954-qdc-large.json), [Base sonucu](sudais-3954-qdc-base.json) ve [kelime adayı](sudais-3954-qdc-words.json) yalnız inceleme içindir.

İlk okumanın 5. kelimesinden sonra yaklaşık 800 ms'lik doğal ara var. İkinci 5. kelime ile 6. kelime arasında ise sağlayıcı verisinde yalnız 50 ms var ve özgün PCM'de düşük enerjili güvenli kesim bulunmadı. İlk aradan kesilirse ikinci kartın metninde 4–5 tekrarının da gösterilmesi gerekir; mevcut monoton kart modeli bunu desteklemiyor. İkinci 5'ten kesmek de son harfi yutma riskini doğuruyor. Bu nedenle 13 kelimelik tek kart şimdilik korunur. Kısa ezber parçaları için ses tekrarıyla örtüşen kart modelinin geliştirilmesi ve kesimin ses bütünlüğünün doğrulanması gerekir.

Hizalama verisinin lisansı ve kaynak bilgisi: [QUD³ Qur'anic Universal Audio](https://github.com/QUD-Technologies/quranic-universal-audio), CC BY 4.0; özgün kayıt hakkı icracı ve kaynakta kalır.
