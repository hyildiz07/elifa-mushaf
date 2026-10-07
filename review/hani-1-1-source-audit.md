# Hânî 1:1 kelime zamanlaması incelemesi

Üretimdeki [QuranCDN sûre MP3'ü](https://download.quranicaudio.com/qdc/hani_ar_rifai/murattal/1.mp3)
ile eşleşen mevcut satır, 1:1 için dört kelimeden yalnızca `2` konumunda
`[7, 3972]` ms aralığını veriyor. Aynı satır
[Kalamalah zamanlama API'sinde](https://api.kalamalah.com/api/timing/hani-ar-rifai/murattal/001)
de aynen bulunuyor; bağımsız bir düzeltme oluşturmuyor.

[QUA v3.2.0](https://github.com/QUD-Technologies/quranic-universal-audio/releases/tag/v3.2.0)
arşivinde aynı sûre MP3'üne bağlı 1:1 kelime veya harf satırı yok.
[Colin Fair'in 2016 Hânî verisi](https://github.com/cpfair/quran-align/releases/tag/release-2016-11-24)
ise 192 kbps âyet dosyasında ilk iki kelimeyi birlikte `[0, 1810]` ms
aralığına koyuyor; kalan iki kelimeyi ayrı işaretliyor. Dolayısıyla ilk
iki kelimenin kendi aralarındaki sınırı bu kaynak da vermiyor.

Üretim MP3'ünün SHA-256 değeri `c420173faed0a1734b586c5f7883c56e75d3eb820508a86dd3eafd9b7fa25654`.
[EveryAyah 192 kbps](https://everyayah.com/data/Hani_Rifai_192kbps/001001.mp3)
ve [64 kbps](https://everyayah.com/data/Hani_Rifai_64kbps/001001.mp3)
âyet sesleri, üretim MP3'ünün başlangıcıyla 1,2 ve 2,5 saniyelik
pencerelerde sırasıyla `0.99989/0.99984` ve `0.99777/0.99700` normalize
dalga korelasyonu veriyor. Bunlar aynı okuyuşun eşleştiğini gösteriyor;
eksik kelime sınırını kendiliğinden üretmiyor. İlk 350 ms sessiz olduğundan
o pencere eşleşme kanıtı sayılmadı. Ham sonuçlar
`review/hani-1-1-source-audit.json` dosyasında.

Güvenilir dört ayrı kelime aralığı bulunmadığı için 1:1 zamanlamasına
override eklenmedi. Kısmi kelime seçimi eksik sözleri atlayarak ses
çalmamalı; tam âyet, mevcut âyet sınırıyla çalınabilir. Sınırı kesinleştirmek
için aynı kayıt üzerinde uzman dinlemesi veya bağımsız, dört kelimeyi ayrı
işaretleyen doğrulanmış bir hizalama gerekiyor.
