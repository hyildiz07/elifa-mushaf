# v262 ses yükleme ve bölme denetimi

Doğrulanmış kaynaklardaki 909 hoca–sûre MP3 bağlantısı `node scripts/audit-online-seek.mjs` ile canlı kaynaktan denetlendi. Her dosyanın ilk 64 KiB'i ve toplam uzunluğu kullanılarak hızlı konum indeksi doğrulandı; geçici ağ hatasında bir kez yeniden denendi. Sonuç: **909/909 indekslenebilir**. Ebû Bekir eş-Şâtırî'nin 10, 17 ve 59. sûreleri MPEG-2.5 biçimindeydi; v262 bu biçimi tanıyarak dosyanın başından işlemek yerine yalnız âyet çevresini indirir.

Bu üç sûrede geç âyet pencereleri uzak kaynaktan tam dosya isteği yapmadan hazırlandı: 10:82, 17:84 ve 59:19. Ayrıca her kayıttaki erken örnek pencere, özgün MP3'ün baştan çözülmüş PCM sesiyle karşılaştırıldı; örnek farkı yaklaşık `1.4–1.6e-8` RMS idi. Bu kontroller her kelime sınırının işitsel doğrulaması değildir.

Tüm korpusun yapısal denetiminde 1.254 hoca–sûre dosyası, 137.192 âyet/yazım durumu ve 604.050 oynatma adımı için **0 yapısal hata** bulundu. Kalan **11** kısa parça istisnası [v262 listesinde](split-exceptions-v262.json) yer alır; beş hoca–âyet eşleşmesinde belirsiz kaynak sınırı nedeniyle parça oynatma bilinçli olarak engellenir. Kaynak kayıtlardaki tekrar, eksik kelime zamanları ve bitiş belirsizlikleri çözülmeden tüm Kur’an için işitsel sıfır hata iddiası kurulamaz.
