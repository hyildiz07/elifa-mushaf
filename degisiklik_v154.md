# ELIFA v154

## 1. Sayfa yapısı geri geldi
v153'te besmele+motto bloğu (`.hero`) toplanıyordu → yapı bozuldu.
**Tamamen geri alındı.** Kapalı görünüm eskisi gibi:
besmele · Birlikte · Kaldığın Yer · hızlı düğmeler · arama · 5 sûre.

> Not: "Kaldığın Yer" kutusunu ben gizlemedim — `.hero` yalnızca besmele ve
> mottoyu kapsıyor. O kutu sayfa aşağı kaydığı için görüş alanından çıkmıştı.

## 2. Açılınca daha fazla kayıyor
Hedef: **arama kutusu ekranın tepesine otursun** → 4-5 sûre daha görünür.
Kaydırma sınırı aşarsa kırpılıyor (sayfa sonuna çarpıp zıplamıyor).

## 3. Kulp alt bara ÇAKILDI — CSS'e güvenmiyoruz artık
Bu düğmenin konumunu **dört ayrı CSS kuralı** çekiştiriyordu:
temel · mobil · saray · saray.open. Hangisinin kazandığı öngörülemiyordu;
boşluk buradan geliyordu.

Artık konum doğrudan elemanın `style`'ına `!important` ile yazılıyor:
```js
bottom = innerHeight − tabbar.getBoundingClientRect().top
```
Hiçbir CSS kuralı bunu ezemez. Yeniden hesaplanır:
açılış · kapanış · tıklama · ekran döndürme · pencere boyu · body sınıf
değişimi · ResizeObserver.

## sw.js v154 · version.json v154
