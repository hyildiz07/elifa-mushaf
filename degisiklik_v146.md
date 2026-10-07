# ELIFA v146 — Sûre çekmecesine kulp

## Ne değişti
Ana ekranda sûre listesini açan **yuvarlak yüzen daire** kaldırıldı.
Yerine, okuma ekranındaki kulbun **aynı dili**:

- **Kapalı:** listenin alt kenarından **yükselen** kulp (74×26, üst köşeleri yuvarlak), ok ▼
- **Bas** → liste açılır (mevcut çekmece animasyonu aynen çalışır: kartlar sırayla, yaylanma)
- **Açık:** kulp **kayarak** ekranın altına, sekme çubuğunun hemen üstüne oturur, ok ▲ döner
- **Bas** → kapanır

### Neden aşağıdan yükseliyor, okumadaki gibi sarkmıyor
Sûre listesinin **hemen altında alt sekme çubuğu var**. Sarkan kulp onun
üstüne binerdi. Yön çevrildi — çekmece mantığı aynı.

## Tema uyumu
Kulp yalnız değişken kullanır: `--chrome` · `--line` · `--muted` · `--gold` · `--shadow`.
**0 sabit renk.**

Saray teması bu düğmeye sabit renk yazmıştı (`#caa14b`, lacivert gradyan).
Yeni kural **id seçicisiyle** (`#surahExpand`) yazıldığı için saray'ın kuralını
yener — ama saray'ın CSS'ine **dokunulmadı**, tek satır bile silinmedi.
Diğer 15 tema da kendi paletinden doğru rengi basar.

## Dokunulmayanlar
- `setSurahDrawer()` ve tüm çekmece JS'i
- Kart açılış sıralaması (`--drawer-i`, `--drawer-delay`)
- Yaylanma sınıfları (`spring-open`, `spring-close`, `drawer-click`)
- Masaüstü görünümü (≥768px) — eski hap düğme aynen duruyor
- Arama sırasında düğmenin gizlenmesi

## Test
| | |
|---|---|
| 9 script bloğu, JS hatası | **yok** |
| Kulp CSS'inde sabit renk | **0** |
| sw.js | v145 → **v146** |
