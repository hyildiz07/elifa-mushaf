# Südeys 3 ve 4. sûre: QDC sesine QUL zaman aktarımı kararı

**Karar (30 Eylül 2026):** QUL'un 3 ve 4. sûre zamanlarını topluca üretime aktarmayın. QUL ve uygulamanın QDC sûre MP3'leri aynı icra ve aynı zaman eksenindedir; fakat dokuz âyette kelime sırası etiketi bozuk, âyet sonlarında işitsel sınır onayı eksik ve bu QUL kaynağının yeniden kullanım koşulları doğrulanmadı. Mevcut koruma sürsün. Bu, kaynak uyumsuzluğunu çözmek için güçlü bir yol bulduğumuz fakat sıfır hata iddiası için henüz kapanmadığımız anlamına gelir.

## Kaynak kimliği

- QDC ve QUL MP3'leri bayt 0'dan ardışık çözüldü; VBR byte seek kullanılmadı. 3:160 ve 4:143 içinde üçer uzak 1 saniyelik pencerede en iyi ofset **0 ms** ve korelasyon **0.999585–0.999911**: `review/sudais-qul-qdc-3-160-pcm.json`, `review/sudais-qul-qdc-4-143-pcm.json`.
- Sûrelerin baş/orta/sonunda altı ek kontrol: 3:10, 3:100, 3:195 için **0.999718–0.999843**; 4:10, 4:88, 4:170 için **0.999854–0.999919**; hepsi 0 ms ofset: `review/sudais-qul-qdc-{3,4}-chapter-pcm.json`. Bu 12 uzak pencerede sabit veya biriken drift görünmüyor.
- QUL MP3'lerinden altı uzak âyet, bağımsız QUD Base ASR ile hedef âyet olarak tanındı: `test-results/review-sudais-qul-asr/*.json`. Bu örnekleme bütün kelime sınırlarını kanıtlamaz.

## Zaman verisinin sınırları

- QUL API, 3. sûre için **200/200 âyet, 3612 okuma satırı/3481 kanonik kelime**; 4. sûre için **176/176, 3884/3747** döndürüyor. Eksik kelime pozisyonu yok. Kaynak: `https://qul.tarteel.ai/api/v1/audio/surah_segments/3?surah=3&from=1&to=200` ve 4. sûreye karşılık gelen API; yerel denetim: `review/sudais-qul-chapters-3-4-audit.json`.
- Sıkı kanonik sıra denetiminde **dokuz âyet karantina gerektiriyor:** `3:69`, `3:90`, `3:91`, `3:99`, `3:100`, `3:153`, `4:12`, `4:135`, `4:174`. Örneğin 3:100 etiketleri `1..8,10..14,9` sıralı; 4:12'de `82`, `83..88` sonrasında. 3:69'da 2–4 etiketleri sağlayıcının âyet başlangıcından yaklaşık 5.7 saniye önce, önceki âyetin alanında. Ayrıntı: `review/sudais-qul-chapters-3-4-boundaries.json`.
- Her komşu QUL âyet aralığının arasındaki boşluk **tam 200 ms**. Bu veri kümesi kuralı olabilir; tek başına gerçek sessizlik veya son harf güvenliği kanıtı değildir. Örneğin 4:143 için QUL bitişi `2980276`, QUD kaynak PCM son kelime adayı `2980477`, âyet segment sonu `2980867` ms; QUL bitişini körlemesine kullanmak kelimeyi yutabilir. Aynı bölümün dinleme dosyaları: `test-results/review-sudais-qdc-verse-ends/listen.html`.

## Hazır veri ve hak durumu

- [QUD v3.2.0 yayımlanmış kataloğu](https://github.com/QUD-Technologies/quranic-universal-audio/releases/tag/v3.2.0) Südeys için önceden hizalanmış veri içermez. Canlı QUD `/audio-recitations` kaynağı `abdulrahman_al_sudais_qdc` ve 114 sûreyi listeler; `/recitations` hizalanmış kataloğu aynı slug'ı içermez. Bunlar farklı kataloglardır. Kaynağı tanıması hazır kelime zamanları olduğu anlamına gelmez.
- [QUL kendi açıklamasında](https://qul.tarteel.ai/faq) kaynakların lisans durumlarının ayrı ayrı değiştiğini ve kullanılan kaynağın koşullarının incelenmesini söylüyor. Bu Südeys MP3'ü veya QUL kelime zamanları için açık yeniden dağıtım/uygulamaya paketleme izni bu denetimde bulunmadı. QUD'nin yayımlanmış veri kümesindeki CC BY 4.0, QUL'un bu ayrı kaynağına otomatik uygulanmaz. Ürün aktarımından önce ilgili kaynak hakkı/atıf koşulu yazılı olarak saptanmalı.

## Güvenli devam yolu

1. QDC MP3'ü korunarak QUL zamanları yalnız **inceleme adayı** olarak kullanılır; dokuz karantina âyeti ayrı kaynağa/hizalamaya veya dinleme düzeltmesine gider. Toplu sabit ofset uygulanmaz.
2. Her âyetin ilk/son kelimesi ve önerilen her kısa parça sınırı iki taraflı dinlenir; 200 ms yapay boşluk ses kanıtı sayılmaz. Özellikle 3:160 ve 4:143 sonları önce doğrulanır.
3. Hak koşulları netleştirilirse, karantinadan geçen satırlar sürüm sabitli yerel zaman varlığına dönüştürülür; kaynağın SHA, ses URL'si, kelime sayısı, tekrar sırası ve aralıkları build/test içinde doğrulanır.
4. Üretim denemesinde aynı hocanın normal âyet, bölünmüş âyet, kelime aralığı, tekrar ve 1+2 oynatımı karşılaştırılır. Hatalı satırda kullanıcıya yanlış ses verilmez; güvenli tam âyet/başka doğrulanmış kaynak seçilir.
