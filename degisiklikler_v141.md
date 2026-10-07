# ELIFA Mushaf v141 — BİRLİKTE TAMAMEN ONARILDI

## TOPLU ZİKİR — hiç çalışmıyordu, 4 ayrı hata vardı

### 1. Zikir adı hiç yazılmıyordu
Hazır seçeneğe (Salavat / Ayetel Kürsi / İhlas) basınca **yalnız HEDEF**
yazılıyordu, **zikir adı alanı BOŞ** kalıyordu:

```js
if (s.dataset.h) document.getElementById('bkHedef').value = s.dataset.h;
// ✗ s.dataset.z hiç kullanılmıyor!
```

Doğrulama `if (!zikirAd) → "Zikir/dua adı gerekli."` deyip **her seferinde
reddediyordu.** Niyet ASLA oluşmuyordu.

**Onarım:** seçenek tıklanınca adı da yaz; modal açılışında varsayılan
seçeneği (Salavat / 1000) alanlara doldur.

### 2. Tesbih halkasının 6 sabiti tanımsızdı

```js
for (let i=0; i<N; i++){                     // N         ✗
  const ang = (START_DEG + (END_DEG-...))    // START_DEG ✗ END_DEG ✗
  const x = BEAD_CX + BEAD_R*Math.cos(ang);  // BEAD_CX ✗ BEAD_CY ✗ BEAD_R ✗
```

Kod ana ekrandaki halkadan kopyalanmış, **sabitleri kopyalanmamış.**
`N is not defined` atıp zikir ekranını **hiç açmıyordu.**

**Onarım:** geometri `bkRingSVG()`'deki daireden alındı
(`cx=170 cy=145 r=130`) → N=33, BEAD_CX=170, BEAD_CY=145, BEAD_R=130,
START_DEG=105, END_DEG=435.

### 3. Tesbih halkasının CSS'i tamamen yoktu
8 sınıfın hiçbirinin kuralı yoktu: `.ring-wrap .bk-ring-wrap .mark-btn
.mark-pad .mark-group .mark-hilal .mark-yildiz .custom-empty`

3 CSS değişkeni tanımsızdı: `--hilal --bead-off --bead-off-stroke`
→ tanımsız değişken = geçersiz kural = **fill siyaha düşüyor.**
Hilal ve yıldız **kapkara** çıkıyordu.

### 4. Buton yazıları görünmüyordu
Tema kuralı
`body[data-layout="saray"] #bkwrap .org-btn { background:rgba(255,251,239,.92) }`
özgüllükte `.org-btn.primary`'yi eziyordu → **krem zemin + beyaz yazı**.

---

## CÜZ PAYLAŞIMI — 3 hata

| Bug | Sebep |
|---|---|
| Birlikte hiç açılmıyordu | `escapeHtml` **tanımsız** (8 çağrı) |
| Liste çizilemiyordu | `shortName` **tanımsız** (4 çağrı) |
| "Organizasyona git" geri atıyordu | `closeElifaModal()` → `history.back()` **asenkron**; org push edilip hemen geri itiliyordu |

---

## TEST — 13/13 GEÇTİ, SIFIR JS HATASI

**Cüz paylaşımı**
1. Hatim oluştu — çevrimdışı uyarısı **yok** ✓
2. "Organizasyona git" ✓
3. **Başka cihaz** linki açtı ✓
4. Ayşe 1. cüzü aldı + okudu ✓
5. Yönetici Ayşe'yi gördü ✓

**Toplu zikir**
1. Zikir adı ön-dolu (Salavat) ✓
2. Niyet oluştu ✓
3. Tesbih halkası 33 boncuk ✓
4. Dokunarak say (10) ✓
5. Buton okunur ✓
6. Hedefe eklendi ✓
7. **Başka cihaz** açtı ✓
8. Toplam 510, Ayşe listede ✓

---

## YÜKLEME

`sw.js` sürümü **v137 → v141** artırıldı. Eski önbellek otomatik silinir.

`dist` içindekileri Netlify'ye at. `netlify.toml` fonksiyonu kurar.

**Kontrol:** `https://mushaf.elifaplatform.com/api/org` → "Yalnız POST" ✓
