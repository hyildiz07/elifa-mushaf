# ELIFA v153

## Çekmece açılınca 3-4 sûre daha görünür
Sadece scroll yetmiyordu: saray'da `.surahViewport{flex:1}` — liste kalan
boşluğu tam dolduruyor. Sayfa kayınca liste kutusu da kayıyor,
**görünen sûre sayısı değişmiyor.**

Yer açmak için üstten bir şey verilmeli. En az önemli blok seçildi:
**besmele + motto (`.hero`)** → açılınca kayarak toplanır.
**Birlikte, Kaldığın Yer, hızlı düğmeler yerinde kalır.**

Ayrıca sayfa gerçekten kaydırılabiliyorsa aşağı kayar; kaydırılamıyorsa
zorlanmaz (boşuna kod çalışmaz).

## sw.js v153 + version.json v153
