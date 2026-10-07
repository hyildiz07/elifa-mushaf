# QUL Südeys âyet klipleri: araştırma kararı

**Karar:** [QUL Südeys âyet-âyet kaynağı](https://qul.tarteel.ai/resources/recitation/116) uygulamanın korumalı sûreleri için umut verici bir alternatif, fakat zamanları veya MP3'leri şu anda üretime alınmamalı. 653/653 âyet URL'si dönmesi, kelime kesimlerinin işitsel doğruluğunu veya sesin yeniden dağıtım iznini kanıtlamıyor. Üretim varlıklarına bu incelemede dokunulmadı.

## Kapsam ve yapısal sonuç

Kaynak sayfasının kendi HTML'sinde `data-recitation=16` var. İç `api/v1/audio/ayah_segments/16` yanıtı 3/4/5/28/29. sûreler için 200+176+120+88+69 = **653/653** kayıt ve ayrı MP3 URL'si verdi. Beş örnek MP3 için HEAD 200 ve `Accept-Ranges: bytes` görüldü; bu yalnız erişilebilirlik örneklemesidir. Resmî [kaynak sayfası](https://qul.tarteel.ai/resources/recitation/116) âyet başına klip ve segment sunduğunu anlatıyor. Ham denetim: `review/audit-sudais-qul-ayah-clips.mjs`, `review/sudais-qul-ayah-clips-structure.json`.

| Sûre | Âyet | Kanonik kelime | Segment | Dizi/kapsam anomalili âyet | Aralık dışı konumlu âyet | Tekrar konumlu âyet | Zamanı gerileyen âyet | İlk satırı <120 ms |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 3 | 200 | 3.481 | 3.520 | 23 | 20 | 4 | 7 | 89 |
| 4 | 176 | 3.747 | 3.775 | 18 | 15 | 4 | 12 | 56 |
| 5 | 120 | 2.804 | 2.854 | 36 | 32 | 6 | 19 | 54 |
| 28 | 88 | 1.430 | 1.440 | 8 | 6 | 2 | 0 | 29 |
| 29 | 69 | 976 | 978 | 2 | 2 | 0 | 0 | 20 |
| **Toplam** | **653** | **12.438** | **12.567** | **87** | **75** | **16** | **38** | **248** |

Her kanonik pozisyon en az bir satırla temsil ediliyor; **bu, sesin gerçekten eksiksiz veya satırın doğru kelimeyi gösterdiği anlamına gelmez**. 87 anomalinin bir kısmı gerçek tekrar olabilir; özellikle dizi gerilemesi ve kanonik aralık dışı pozisyonları otomatik üretim dönüşümüne uygun değildir. 15 satır tek kelime için 5 saniyeden uzun. 3:160, 4:143, 5:46 ve 28:87'nin segmentleri ayrı yapısal örnek olarak incelendi.

## Kritik ilk kelime ve kaynak karşılaştırması

3:160 klibinde `إِن` için etiketlenen ilk satır `[0,1,0,70]`: yalnız **70 ms**. İlk 0–70 ms PCM RMS yaklaşık 0,0075; 100–600 ms RMS yaklaşık 0,0638. Bu, ilk kelime sınırını güvenli kabul etmek için güçlü bir uyarıdır. Bağımsız QUD Base hizalayıcı klipte 3:160:1–18 dizisini üç daha geniş öbekte tanıdı; ilk 1–6 öbeğinin `matched_text` alanı boş. Yani bu çıktı ilk kelimenin tam sınırını doğrulamıyor. Ham çıktı `review/sudais-qul-ayah-3-160-asr.json`.

Aynı hocanın uygulamadaki QDC sûre MP3'ü ile QUL ayrı âyet klipleri, bayt sıfırından tam çözülmüş PCM'de 800 ms'lik üçer pencerede karşılaştırıldı. 3:160'ta en iyi korelasyon **0,37–0,64** (yakın zaman ekseninde), 4:143'te **0,29–0,40**, 5:46'da **0,30–0,61**, 28:87'de **0,28–0,31**. Bu, farklı kodlama/işleme veya farklı icra olasılığını ayırt etmeye yetmez; kesin kaynak eşitliği kurulmadı. Âyet klibi zamanını QDC sûre dosyasına doğrudan taşımayın. Ham yöntem ve çıktı: `review/compare-sudais-ayah-clip-qdc.mjs`, `review/sudais-qul-ayah-clip-qdc-pcm.json`.

## Kullanım koşulları

[QUL SSS](https://qul.tarteel.ai/faq), verilerin ticari projelerde kullanılabileceğini söylerken **her kaynağın kendi lisansının incelenmesini** ve telif/atıf durumunun değiştiğini belirtiyor. Aynı SSS, şu anda resmî bir API sunmadığını söylüyor; burada kullanılan `api/v1` sayfanın iç önizleme uç noktasıdır. Kaynak sayfasında bu Südeys kliplerinin veya zamanlarının özgül lisansı görünmüyor; JSON/SQLite indirme bağlantıları oturum açmaya yöneliyor. Erişilebilir URL, yeniden paketleme veya uygulamada kalıcı CDN kullanımı için izin kanıtı değildir. [QUL credits](https://qul.tarteel.ai/credits) birçok verinin topluluk kaynaklı olduğunu, ses derleyicileri arasında EveryAyah ve QuranicAudio'yu anıyor; bu da bu **tekil** kaydın hak sahibini belirtmiyor. Bu bir ihlal tespiti değil, doğrulanmamış izin sınırıdır.

Bu klipler önce aday kaynak olarak kalmalı. Özgül kullanım/atıf hakkı saptanırsa 87 anomalili âyet ayrı incelenmeli; diğerlerinde de ilk/son kelime ve her kısa parça sınırı iki taraflı işitilerek doğrulanmalı. Başarısız satırda tam âyet ya da başka doğrulanmış hoca korunmalı; sırf 653 URL var diye tüm sûre koruması kaldırılmamalı.
