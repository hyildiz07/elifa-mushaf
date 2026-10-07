# ELIFA Mushaf v144

## 1. İsim: Elifa İslam → Elifa Mushaf
13 yer + manifest.json (name, short_name).
Font adı "Elifa Mushaf Nesih" korundu.

## 2. Gizlilik Politikası — İKİ YERDE
- **Uygulama içinde:** Ayarlar → Gizlilik Politikası (Kılavuz ile Hakkında arasında).
  Tam ekran, 8 bölüm, içindekiler, geri tuşu kapatır, çevrimdışı çalışır.
  Kılavuzun CSS'i yeniden kullanıldı → +6 KB.
- **Web sayfası:** /gizlilik (statik). Play'in tarayıcısı JS çalıştırmaz, bu şart.
- Doğrudan /gizlilik adresi açılırsa uygulama da o ekranı açar.

## 3. TWA doğrulaması
- `.well-known/assetlinks.json` pakete kondu
- `_redirects` → `/.well-known/*` kuralı EN ÜSTE (catch-all yutuyordu)
- `_headers` → assetlinks için `Content-Type: application/json`

## 4. sw.js → v144 (eski önbellek silinir)

## Test
| | |
|---|---|
| 8 script bloğu, JS hatası | **yok** |
| Ayarlar satırı | ✓ |
| Geri tuşu gizliliği kapatıyor | ✓ |
