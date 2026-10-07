# ELIFA v156 — "Kaldığın Yer" artık hep açık

## Değişen
```js
// ESKİ
if(prog && SURAHS[prog.s-1]){ b.style.display='flex'; ... }
else b.style.display='none';          // ← ana ekranda boşluk

// YENİ
b.style.display='flex';               // HİÇ gizlenmez
const varMi = !!(prog && SURAHS[prog.s-1]);
const s0 = varMi ? prog.s : 1;        // kayıt yoksa → Fâtiha
const a0 = varMi ? prog.a : 1;        //              → 1. âyet
```

HTML'deki `style="display:none"` de kaldırıldı → ilk çizimde bile görünür,
sayfa açılırken kutu "zıplayarak" gelmez.

## Davranış
| Durum | Kutuda yazan | Tıklayınca |
|---|---|---|
| Okuma kaydı var | Bakara · 11. âyet | oraya gider |
| **Kayıt yok / yeni kullanıcı** | **Fâtiha · 1. âyet** | Fâtiha 1'e gider |

Yeni kullanıcı ilk açtığında ana ekran artık **eksiksiz** görünüyor —
ve tek dokunuşla Kur'ân'ın başından okumaya başlıyor. İyi bir ilk izlenim.

## Ayrıca (v155'ten)
Çekmece açılınca besmele + hızlı düğmeler toplanır (~170 px ≈ 4-5 sûre).
**Birlikte ve Kaldığın Yer toplanmaz** — korumaya alındı.
