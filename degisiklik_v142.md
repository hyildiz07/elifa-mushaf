# v142 — Âyet numaraları küçültüldü

## Sorun
Âyet numarası madalyonları (`﴿١﴾`) metne göre çok büyüktü.

## Neden ilk denemede olmadı
Uygulamada şu kural vardı:

```css
body #rbody .am { font-size:.76em !important; }
```

Özgüllüğü **(0,1,1,1)**. Benim yazdığım `#reader .am` kuralının özgüllüğü
**(0,1,1,0)** — daha düşük. `!important` yazsam da kazanamıyordu.

## Çözüm
Seçiciye `html body` ön eki eklendi → özgüllük **(0,1,1,2)** → kazanıyor.

```css
html body #rbody .am, html body #reader .am, ... {
  font-size:.58em !important;
}
```

## Sonuç

| | Önce | Sonra |
|---|---|---|
| font-size | .76em (27,3 px) | **.58em (20,8 px)** |
| rozet boyutu | 54 × 67 px | **49 × 51 px** |
| küçülme | — | **%24 alçak** |

5 temada test edildi, hepsinde tutarlı. JS hatası yok.

`sw.js` sürümü **v141 → v142** artırıldı.
