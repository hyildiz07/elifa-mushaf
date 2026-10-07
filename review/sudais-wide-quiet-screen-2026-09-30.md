# Südeys 3/4: geniş sınır çevresi enerji taraması (yalnız inceleme)

`node review/screen-sudais-wide-quiet.mjs`, uygulamanın kullandığı tam QDC MP3'lerini baştan sona birer kez çözüp 374 komşu âyet geçişini QUL'un sınır merkezi çevresinde ±500 ve ±1000 ms tarar. QUL'un sabit 200 ms metadata boşluğunu doğrudan güvenli kesim saymaz. Kaynak SHA-256 ve her adayın aralığı `review/sudais-wide-quiet-screen-2026-09-30.json` içindedir.

| Tarama | 3. sûre (199 geçiş) | 4. sûre (175 geçiş) |
| --- | ---: | ---: |
| Katı sessizlik (en az 120 ms, ≤ min(0,002 RMS; yerel tepenin %1,5'i)), ±500 ms | 0 | 0 |
| Aynı katı eşik, ±1000 ms | 0 | 0 |
| Düşük enerji (en az 120 ms, ≤ min(0,03 RMS; yerel tepenin %10'u)), ±500 ms | 36 | 14 |
| Aynı düşük enerji eşiği, ±1000 ms | 39 | 19 |

Geniş taramada bulunan 58 düşük enerji aralığının yalnız 9'u metadata merkezinin 200 ms içinde. Bu yakın aralıklardan hiçbir iki komşu geçiş, aynı âyetin iki ucunu birlikte sağlamıyor. Geri kalan vadiler âyetin içindeki duraklar veya yanlış konumlu metadata olabilir. Düşük enerji sessizlik değildir; son harfin tamamlandığını veya sonraki âyetin başlamadığını kanıtlamaz. Bu çıktı yalnız daha az örneği fonetik/işitsel incelemeye yönlendirmek içindir. **Üretime otomatik açılan âyet: 0.**
