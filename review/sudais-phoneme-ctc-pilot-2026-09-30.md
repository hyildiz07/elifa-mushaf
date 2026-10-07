# Südeys QDC fonem CTC pilotu: 28:44 ve 5:111

**Karar: yalnızca inceleme; hiçbir âyet veya kelime kesimi onaylanmadı.** Ayrı, açık ağırlıklı fonem modeli iki doğru QDC penceresindeki konuşma sırasını destekliyor ve dış geçişlerin yakınında bir CTC boşluk bölgesi gösteriyor. Bu modelin `blank` kararı sessizlik ölçümü değildir; `|` ise eğitimde fonemleri ayırmak için kullanılmış bir etikettir, kelime veya sessizlik sınırı değildir. İç sınırlar fonem bütünlüğü bakımından belirsiz kalıyor.

## Kaynak ve yöntem

- Model: [`MostafaMaroof/wav2vec2-arabic-phoneme-asr`](https://huggingface.co/MostafaMaroof/wav2vec2-arabic-phoneme-asr), Apache-2.0; `facebook/wav2vec2-large-xlsr-53` temel modeli. Ağırlık `model.safetensors` SHA-256: `582149e3e913a0fc7f29c116530e0b1b6ae7a7ab23eef4efc3fc2acc760e2b75`, 1.262.135.432 bayt. Model kartı kısa ünlüler ve sınır zamanlarında kayma uyarısı yapıyor.
- 28:44 penceresi: QDC 28.mp3 651500–666000 ms, 16 kHz WAV SHA-256 `be00b58d8884b0b820d260e6055dda03cc05caba68c43b935377b2a7dd57a20b`. Özgün MP3 SHA-256 `f8e5291cf10a3a29230fd443b5ddabc4297cf5b16c70250dda3bfe6314917576`.
- 5:111 penceresi: QDC 5.mp3 2494000–2514000 ms, 16 kHz WAV SHA-256 `4dc4010e7a60485b0480610d046f78d46a6af1d38fae8045a5ec46f06a1facda`. Özgün MP3 SHA-256 `16fad03b000d69492da95e9f970f220ae097a6693815917924b43f1730ae8cdb`.
- Her MP3 baştan çözülüp hedef pencereye kırpıldı. Model CPU üzerinde serbest CTC çözümlemesiyle çalıştı; beklenen âyet metnine zorlanmış fonem hizalaması yapılmadı. Yaklaşık 20 ms/kare çözünürlükteki argmax fonemleri ve `blank` posteriorları [28:44 ham JSON](sudais-phoneme-ctc-28-44-pilot.json) ile [5:111 ham JSON](sudais-phoneme-ctc-5-111-pilot.json) içinde. QUL/QUD saatleri önceki [kelime saati incelemesinden](sudais-corrected-qdc-word-clock-comparison-2026-09-30.md) ve [düzeltilmiş pencere pilotundan](sudais-corrected-qdc-window-pilot-2026-09-30.md) alındı.

## Dış geçişler

| Geçiş | QUL âyet sınırı | QUD segment sınırı | CTC'de yakın fonem olayı | Gözlem |
| --- | ---: | ---: | --- | --- |
| 28:43→44 | 653640 | 653780 | 28:44 ilk `w`: 653803–653843 | Her iki aday ilk fonemden önce; CTC `blank` iki adayda yüksek. |
| 28:44→45 | 663092 | 663460 | Hedef son `|`: 662876–663116; sonraki `w`: 663557–663597 | QUL son `|` aralığında, QUD sonraki `w` öncesinde. |
| 5:110→111 | 2496497 | 2496560 | 5:111 ilk `w`: 2496603–2496643 | Her iki aday ilk fonemden önce; CTC `blank` iki adayda yüksek. |
| 5:111→112 | 2511277 | 2511493 | Hedef son `|`: 2510997–2511257; sonraki `<`: 2511578–2511598 | Her iki aday CTC etiketleri arasında. |

Bu gözlemler hedef ve komşu âyetin sırasını destekler. CTC'nin son fonemi nerede bitirdiği, uzatma/yankının ne zaman söndüğü ve ilk komşu sesin nerede başladığı bu modelle kesinleşmez. Dış uçların oynatma kesimi olarak güvenli olduğu çıkarılamaz.

## Seçilmiş iç sınırlar

| Sınır | QUL ms | QUD kelime ucu ms | CTC yakınında görülenler | Sonuç |
| --- | ---: | ---: | --- | --- |
| 28:44 kelime 1 sonrası | 654550 | 654360 | QUD anında `k` 654324–654364; QUL anında `|`, çevrede `u` 654464–654484 ve `n` 654564–654624 | Aktif fonem dizisi; güvenli kesim gösterilmedi. |
| 28:44 kelime 3 sonrası | 656310 | 656140 | QUL anında `g` 656307–656327; QUD anında `|`, ardından `i`, `l`, `g` | 170 ms ayrışma çözümlenmedi. |
| 28:44 kelime 12 sonrası | 661910 | 661730 | QUL anında `$$` 661894–661914; QUD anında `|` | Etiket ayrımı kesim onayı değildir. |
| 5:111 kelime 7 sonrası | 2501357 | 2501590 | QUL anında `|`; QUD yakınında `w` 2501568–2501588 ve `a` 2501628–2501648 | 233 ms ayrışma çözümlenmedi. |
| 5:111 kelime 8 sonrası | 2503357 | 2502910 | QUD `|` 2502689–2503109; `q` 2503329–2503349; QUL hemen sonrasında `|` | 447 ms fark sürüyor; QUL de sonraki fonemin ardından. |
| 5:111 kelime 9 sonrası | 2504437 | 2504190 | QUD yakınında `<` 2504190–2504210; QUL anında `|` | 247 ms ayrışma çözümlenmedi. |

CTC fonemleri serbest çözümlendiği için tek bir etiketin hangi kanonik kelimeye ait olduğu ayrıca zorlanmış hizalama veya dinleme olmadan kesin söylenemez. Modelin `|` için yüksek olasılık üretmesi, dalga biçiminde sessiz boşluk olduğu anlamına gelmez. Önceki PCM incelemesinde 24 iç sınırın hiçbirinde QUD çevresinde 20 ms RMS < 0.002 sessiz aralık bulunmamıştı; bu pilot o engeli kaldırmıyor.

Tekrar üretim: `node review/pilot-sudais-phoneme-ctc.mjs`, ardından yerel CPU ortamında `python review/run-sudais-phoneme-ctc.py 28:44 5:111`. Bağımlılıklar ve ağırlık yalnız Git'in yok saydığı `test-results/review-phoneme/` altında. Üretim verisi, paket listesi, koruma durumu ve yayın değişmedi.
