# ELIFA v160 — Çift splash

## Gerçek
İlk açılan ekran (hilal + yıldız, krem zemin) **Android/Chrome'un kendi
açılış ekranı.** `manifest.json`'daki ikondan işletim sistemi çiziyor,
sayfa daha yüklenmemişken. **HTML'den kaldırılamaz** — o an kodumuz
çalışmıyor bile.

## Yapılan (index.html)
İki splash **birebir üst üste bindirildi:**

| | OS splash | Uygulama splash (önce) | Uygulama splash (şimdi) |
|---|---|---|---|
| Zemin | #F8EFD9 | radyal gradyan | **#F8EFD9** ✓ |
| İkon konumu | tam merkez | merkezden yukarıda (yazı ittiriyordu) | **tam merkez** ✓ |
| İkon boyutu | ~240px | 116px | **240px** ✓ |

Başka kurallar ikonu `!important` ile 132/92px'e zorluyordu — hepsi ezildi.
Yazılar artık mutlak konumda, ikonu ittirmiyorlar; ikonun altında
yumuşakça beliriyorlar.

**Sonuç:** OS ekranından uygulama ekranına geçerken **ikon hiç kıpırdamıyor.**
Sadece altına yazı geliyor. Çift görüntü hissi bitiyor.

## Gerçekten kaldırmak için (Play sürümü)
Ayrı paket: **TWA_SPLASH_DUZELTME.zip**
Android projesindeki `res/drawable-*/splash.png` dosyaları düz krem
görsellerle değiştiriliyor → OS açılış ekranı **bomboş** görünüyor,
sadece uygulamanın kendi splash'ı kalıyor. AAB yeniden derlenmeli.
