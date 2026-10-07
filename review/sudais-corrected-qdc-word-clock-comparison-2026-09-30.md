# Südeys 28:44 ve 5:111 kelime saati karşılaştırması

**Durum: yalnızca inceleme.** Özgün QDC MP3'ün SHA-256 kimliği önceki düzeltilmiş pencere pilotuyla doğrulandı. O pilotun dört QUD `audio_id` oturumundan Base ve Large kelime zamanları yeniden istendi. Her segmentin göreli zamanı tam kaynak pencerenin başlangıcına eklenerek sûre saatine çevrildi. QUL kelime zamanları aynı kayıtla PCM eşleştirilmiş ofsetle taşındı: 28:44 için mevcut kaynak eşleşmesi; 5:111 için **+126057 ms**. [Makine çıktısı](sudais-corrected-qdc-word-clock-comparison-2026-09-30.json) oturum kimliklerini, bütün 26 kelimeyi ve 24 iç sınırın ölçülerini içerir.

Her iki model de her âyette **1–13** kelime etiketlerini eksiksiz ve sırayla verdi; iç sınırların zamanları Base ile Large arasında bire bir aynı. Bu iki çıktı aynı QUD hizmetinin aynı WAV ve referans metin üzerinde çalışmasıdır; bağımsız işitsel doğrulama sayılmaz. QUL adayı da kesim onayı değil, aynı kayıt üzerindeki karşılaştırma saatidir. 5:111 QUL kelimeleri doğrudan QUL `surah_segments/3` yanıtından alındı. Arapça metnin QUD öbeklerinde 28:44 için 1–13; 5:111 için 1–8 ve 9–13 sırası kanonik konumlarla uyumludur.

Tabloda `QUL` ve `QUD` sözcük bitişinin QDC saati (ms), `Δ` iki zamanın mutlak farkıdır. `RMS QUL/QUD` ilgili zamanda merkezlenen 20 ms ses enerjisi; `en düşük` QUD sınırının ±120 ms çevresindeki en sessiz 20 ms aralığıdır. Sıfıra yakın değer sessizliği işaret eder; **0.002 altı** yalnızca sıkı inceleme ipucudur, fonem bütünlüğü kanıtı değildir.

| Âyet | Kelimeden sonra | QUL ms | QUD Base=Large ms | Δ ms | RMS QUL/QUD | En düşük RMS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 28:44 | 1 | 654550 | 654360 | 190 | .244/.062 | .050 |
| 28:44 | 2 | 655310 | 655230 | 80 | .120/.080 | .068 |
| 28:44 | 3 | 656310 | 656140 | 170 | .064/.096 | .092 |
| 28:44 | 4 | 657190 | 657170 | 20 | .066/.070 | .066 |
| 28:44 | 5 | 657590 | 657520 | 70 | .151/.037 | .029 |
| 28:44 | 6 | 658470 | 658430 | 40 | .099/.066 | .056 |
| 28:44 | 7 | 658990 | 658910 | 80 | .150/.111 | .097 |
| 28:44 | 8 | 659510 | 659410 | 100 | .072/.065 | .061 |
| 28:44 | 9 | 660150 | 660080 | 70 | .150/.099 | .078 |
| 28:44 | 10 | 660790 | 660640 | 150 | .146/.037 | .031 |
| 28:44 | 11 | 661390 | 661380 | 10 | .099/.106 | .099 |
| 28:44 | 12 | 661910 | 661730 | 180 | .063/.072 | .061 |
| 5:111 | 1 | 2497017 | 2497090 | 73 | .154/.267 | .123 |
| 5:111 | 2 | 2498057 | 2497970 | 87 | .131/.134 | .094 |
| 5:111 | 3 | 2498197 | 2498290 | 93 | .205/.148 | .092 |
| 5:111 | 4 | 2499957 | 2499880 | 77 | .263/.129 | .114 |
| 5:111 | 5 | 2500337 | 2500190 | 147 | .413/.132 | .069 |
| 5:111 | 6 | 2501037 | 2501230 | 193 | .212/.098 | .098 |
| 5:111 | 7 | 2501357 | 2501590 | 233 | .240/.257 | .169 |
| 5:111 | 8 | 2503357 | 2502910 | **447** | .041/.136 | .055 |
| 5:111 | 9 | 2504437 | 2504190 | 247 | .323/.129 | .118 |
| 5:111 | 10 | 2505937 | 2505950 | 13 | .141/.129 | .096 |
| 5:111 | 11 | 2506797 | 2506800 | 3 | .085/.085 | .075 |
| 5:111 | 12 | 2508837 | 2508850 | 13 | .163/.163 | .117 |

**Sıkı sonuç:** 24 iç sınırın hiçbirinde QUD ±120 ms çevresinde RMS < .002 olan 20 ms aralığı yok. QUL ve QUD'nin çakışması da kelimelerin fonetik olarak ayrıldığını göstermiyor. Bu ölçülerle hiçbir iç kesim onaylanmadı.

Âyet dış sınırlarında da model segmenti, model kelimesi ve QUL farklıdır:

| Geçiş | QUL uç ms | QUD segment ucu ms | QUD kelime ucu ms | Komşu segment ucu ms | Segment arası ms | RMS QUL/segment |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 28:43→44 | 653640 | 653780 | 653880 | 653680 | 100 | .034/.022 |
| 28:44→45 | 663092 | 663460 | 663160 | 663520 | 60 | .032/.021 |
| 5:110→111 | 2496497 | 2496560 | 2496670 | 2496520 | 40 | .042/.029 |
| 5:111→112 | 2511277 | 2511493 | 2511430 | 2511523 | 30 | .032/.015 |

`Komşu segment ucu`, başlangıç geçişinde önceki segmentin bitişi; bitiş geçişinde sonraki segmentin başlangıcıdır. Bu komşu segmentler dar pencereyle kırpıldığı için tam komşu âyet doğrulaması değildir. 28:44 sonunda QUD son kelime 663160 ms'de biterken âyet öbeği 663460 ms'de biter; 300 ms fark, kelime sonunu doğrudan âyet kesimi olarak kullanmayı özellikle sakıncalı kılar.

**İki taraflı dinleme için kısa liste:** Önce 5:111 kelime 8 (447 ms fark) ve 7–9 çevresi; sonra 28:44 kelime 1, 3, 12 (170–190 ms fark) ve dört âyet geçişi. Dinlemede son fonem, uzatma/yankı ve sonraki kelimenin ilk sesi ayrı ayrı kontrol edilmeli. Liste önceliktir; üretim zamanları veya koruma durumu değiştirilmemiştir.
