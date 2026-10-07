# 103 son-ses önceliği: toplu karar grupları — 2026-10-01

Kaynak `test-results/final-tail-energy.json`: 221 özgün sûre MP3'ünün
indeksli PCM sonu ölçüldü; bunun 103'ü öncelik işareti aldı. Eşikler
öncelik içindir, hata veya son fonem onayı değildir. Tekrar üretim:
`node review/audit-final-tail-energy.mjs`; Hüsarî'nin ve erken kesilen
kayıtların 50/100 ms profilleri aynı ham JSON'dadır.

| Ayrık grup | Adet | Karar |
|---|---:|---|
| Metadata sonu fiziksel dosyayı aşıyor, son ses etkin | 4 | Eksik 148–475 ms MP3'te yok. Saati uzatmak ses üretmez; bağımsız devam kaynağı veya işitsel onay gerekir. |
| Üretim kesiminden sonra ilk 50 ms etkin | 77 | Aynı MP3'te ek PCM var. 16 kayıt aşağıdaki dar uç-uzatma adayı; kalan 61'de kaynak sonu/kelime veya tekrar kimliği açık. |
| Yukarıdakiler olmadan fiziksel EOF'da etkin ses | 22 | Kaynağın ötesinde ses yok; MP3 sonundan fonem tamlığı çıkarılamaz. |

Metadata taşmalı etkin kayıtlar **Hânî 2:286 (+475 ms, son 10 ms RMS
0,01275), 24:64 (+464, 0,00409), 107:7 (+255, 0,00911), 113:5
(+148, 0,00826)**. Hânî 31:34 ve 88:26 da fiziksel sonu aşan metadata
taşır, fakat bu taramanın etkin-son öncelik eşiğine girmez. Korumalı
Hânî 65:12 (+887 ms) ve Südeys 4:176, 221'lik kümenin dışındadır.

**Aynı kaynaktan sınırlı tam-son-âyet uzatma adayı (16):** Hüsarî Muallim
**9:129, 13:43, 14:52, 19:98, 25:77, 47:38, 48:29, 50:45, 59:24,
75:40, 88:26, 95:8, 107:7**; Hüsarî Murattal **85:22**; Südeys
**85:22**; Şureym **81:29**. Bu kayıtların üretim kesiminden hemen sonra
etkin PCM var. İlk 13 Muallim kaydında 100 ms profili, >0,01 RMS enerjinin
kesimden sonraki ilk 200 ms dışına taşmadığını gösteriyor; fiziksel sona
kadarki toplam 1,9–4,1 saniyelik farkta ikinci sözlü öbek işareti yok. Muallim'in genel
"talebe tekrarlı" niteliği, bu belirli son boşlukların tekrar olduğu
anlamına gelmiyor. Hüsarî Murattal 85:22'de ilk 50 ms RMS 0,02653,
200 ms sonrasında tüm 50 ms pencereler <0,005; fiziksel son yaklaşık
609 ms ileride. Südeys 85:22 ve Şureym 81:29'da kesimden dosya sonuna
sırasıyla yalnız 159/83 ms var, ilk 50 ms RMS 0,02050/0,02193 ve son
10 ms yaklaşık sıfır.

Bu 16 için yalnız **son âyetin tam oynatma/tekrar bitişini**, özgün
MP3'ün doğrulanmış fiziksel sonunu aşmadan ve kaynak kimliğine bağlı
olarak uzatmak teknik açıdan dar kapsamlı bir yoldur. Muallim kayıtlarında
yaklaşık +400 ms, Hüsarî Murattal 85:22'de yaklaşık +350 ms, kısa
Südeys/Şureym örneklerinde fiziksel EOF üst sınırı ses kuyruğunu kapsar.
Kelime-içi bölme sınırları veya başka âyetler bu ölçümle değiştirilemez.
Bu **üretim onayı değildir**: uzatılmış son kelime bir kez dinlenip
fonetik olarak karşılaştırılmadan "hatasız" sayılamaz.

Diğer 61 erken kesim ve 22 EOF-yalnız kayıtta genel süre artırımı güvenli
değil. Örneğin Südeys **71:28** kesim sonrası 50 ms RMS 0,16373 ve EOF
10 ms RMS 0,03871; Südeys **46:35** 0,09560/0,06789; Yâsir ed-Devserî
**92:21** 0,08876/0,03254. Bunların bir kısmı doğal ses/yankı ile bitebilir,
bir kısmı gerçekten kesik olabilir. Aynı MP3 dışında doğrulanmış bir devam
veya karşılıklı işitsel/fonetik inceleme olmadan son noktayı kaydırmak
eksik sözü geri getirmez. Bu rapor üretim kodunu ve canlı siteyi değiştirmez.
