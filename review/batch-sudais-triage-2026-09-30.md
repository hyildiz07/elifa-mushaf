# Südeys için toplu çözüm denemesi: sûre sesinde akustik geçiş taraması

653 âyeti tek tek saat kaydırarak düzeltmek yerine, 3. ve 4. sûrelerin **aynı eksendeki QDC MP3'ünü baştan sona birer kez** çözüp QUL aday âyet geçişlerini topluca taradım. Araştırma betiği `review/audit-sudais-interverse-acoustics.mjs`; sonuç `review/sudais-interverse-acoustics-2026-09-30.json`. Kaynak QDC dosyaları SHA-256: 3. sûre `7a52d1efb56e31d8c84436aec39cbeebde8498dfa43acaf2c082c7c145153614`, 4. sûre `60adc3638bc3cdf6dbfcf110ab1102f810794ea21e74f3764cd159b3f13d122d`. Önceki PCM kaynak-eşleme kanıtı `review/sudais-qul-qdc-restoration-decision-2026-09-30.md` içindedir.

| Sûre | Taranan komşu âyet sınırı | Aday aralık | Katı sessizlik eşiğinde ≥120 ms bulunan |
| --- | ---: | ---: | ---: |
| 3 | 199 | 200 ms | **0** |
| 4 | 175 | 200 ms | **0** |
| **Toplam** | **374** | | **0** |

Her kaynak MP3, 10 ms PCM RMS izine dönüştürüldü. Aday boşluktaki 120 ms kesintisiz düşük enerji, çevredeki ses tepesinin %1,5'iyle 0,002 mutlak sınırın küçüğünü aşmamalıydı. Bu eşik bilerek katıdır: sonuç **bütün geçişlerin yanlış olduğu** anlamına gelmez; adayın sabit 200 ms aralığının *kendiliğinden gerçek sessizlik kanıtı olmadığını* gösterir. Kaynak süresi ile aday sonu 3. sûrede yaklaşık 30 ms, 4. sûrede yaklaşık 67 ms farkla kapanıyor; yanlış bir dakikalık genel ofset işareti yok. 3/4'te daha önce bulunan dokuz sıra/kapsam anomalisi de ayrıca açık kalır.

Toplu, güvenli yol şu: özgün QDC kayıtlarında âyet ve kelime hizasını otomatik olarak üretmek; iki bağımsız modelin sıra/tekrar ve ilk-son kelime konusunda uyuşmasını istemek; PCM'deki her önerilen kesimin iki tarafında ses devamı bulunup bulunmadığını test etmek. Model uyuşmazlığı veya sürekli aktif ses olan geçişler **otomatik üretime alınmaz**. Bu süreç elle incelenecek adayları önceliklendirebilir; tek başına “sıfır fonem hatası” sertifikası veremez. QUL zamanlarının özgül kullanım/atıf koşulu da henüz doğrulanmadığından QUL satırları üretim verisine taşınmadı.

Öğrenciler için erişim açısından ayrı bir kontrol yapıldı: Ebû Bekir eş-Şâtırî'nin seçili 114 sûre kaydı **6.236 âyetin ve 77.429 kanonik kelimenin tamamı** için sıralı zaman satırı içeriyor; bunlara Südeys'te korunan 653 âyet de dahil. Kaynak adresleri önceki 1.254/1.254 erişilebilirlik taramasına dahildir. Kanıt: `review/audit-fallback-reciter.mjs`, `review/fallback-reciter-coverage-2026-09-30.json`. Bu yapısal kapsama ve kaynak erişimi kanıtıdır; telaffuz ve her cihazda oynatma garantisi değildir.
