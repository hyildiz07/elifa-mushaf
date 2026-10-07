# ELIFA v157 — Kapanış da kayarak

## Sorun
Toplanan blokların geçişi `max-height: 340px → 0` üzerinden gidiyordu.
Ama blokların **gerçek boyu ~95 px.**

Yani hareketin **%72'si görünmez bir aralıkta** geçiyor (340 → 95 arası
hiçbir şey olmuyor), sonra kalan %28'de blok çat diye kapanıyor.
Açılışta bu şans eseri hoş duruyordu; kapanışta blok "birden" geri geliyordu.

## Çözüm
Sabit sayı atıldı. Blokların **gerçek yüksekliği ölçülüp** değişkene yazılıyor:

```js
--heroH  : .hero.scrollHeight  + 8px
--quickH : .quick.scrollHeight + 8px
```
```css
.hero { max-height: var(--heroH); }
.quick{ max-height: var(--quickH); }
```

Artık geçiş **birebir**: 95px → 0 ve 0 → 95px.
Açılış ve kapanış **aynı akışkanlıkta**, aynı eğri, aynı süre (0.36 sn).

Ölçüm yenilenir: yüklemede · 120/600/1500 ms sonra · ekran döndürmede ·
pencere boyu değişince · ResizeObserver ile.
Çekmece açıkken ölçüm yapılmaz (o an yükseklik 0'dır).

## Eski WebView uyumu
`?.` `??` `=>` `const/let` **yok** — tablet dersi unutulmadı.
