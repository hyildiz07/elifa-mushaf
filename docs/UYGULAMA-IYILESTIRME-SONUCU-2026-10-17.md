# Elifa Mushaf — Güvenilir çalışma akışı

17 Ekim 2026 · v337 · Önizleme için hazırlandı; üretim yayını bu değişikliğe dahil değil.

## Tamamlanan işler

- Aynı âyet aralığında farklı bölmelere sahip iki kayıt birbirinden ayrıldı. Bir kaydın adını değiştirmek diğerinin kesim noktalarını taşımıyor.
- Çalışmalar hoca, hız, tekrar sayısı, tekrar açık/kapalı, ara bekleme, çalışma modu ve parça birleştirme tercihleriyle kaydediliyor. Bu alanlar yedekleme/eşitleme doğrulamasına dahil.
- Yarım kalan çalışma doğru âyet/parçada sessiz açılıyor. Tek parça dinlenirken gerçek parça numarası korunuyor. Tamamlanan çalışma ayrıca işaretleniyor.
- Normal çalışma için “Aralığı tekrarla”, “Âyet âyet” ve “1+2 birleştir” ayrı seçenekler. Bölünmüş çalışmanın 1+2 tercihi normal aralığın davranışını değiştirmiyor.
- Çalışma sırasında aralık/parça, tekrar ilerlemesi ve tamamlanma durumu gösteriliyor. Mevcut çalıştır düğmesi yeniden başlatmak için kullanılabiliyor.
- İndirme sonucu başarı/başarısızlık/iptal olarak ayrıldı. Ses ve zamanlama birlikte doğrulanmadan çevrimdışı hazır sayılmıyor; başarısız sûreler yeniden denenebiliyor.
- Güncellemede zorunlu dosyalar eksikse önceki çevrimdışı sürüm korunuyor. Yeni sayfa, eski sürümün sabit çevrimdışı kopyasını ezmiyor. Eski service-worker adresi de aynı güvenli işleyiciye yönlendiriliyor.
- Dil değişince dinamik ana ekran yazıları, sûre kartları, kaldığın yer ve yeni çalışma ekranı metinleri yenileniyor. Yeni metinler 21 dilde mevcut.
- Başlama, tamamlanma, durdurma, indirme sonucu ve oynatma hata kategorileri mevcut ölçüm katmanına bağlandı. Kullanıcı notları, hesap kimliği, serbest metin ve ses bağlantıları olaylara eklenmiyor. Önizleme kullanım ölçümüne gönderilmiyor.
- “Ses sorunu bildir” panelinde taşma, erken kesilme ve tekrar sorunları seçilebiliyor. Gönderilecek teknik bilgiler önce gösteriliyor; e-posta kullanıcı tarafından gönderiliyor.
- Okuyucu, bölme veya Çalışma Masası açıkken eşitleme erteleniyor. Ağ isteği sürerken çalışma açılmışsa dönüşte de kontrol edilerek kayıt geri yükleme/sayfa yenileme engelleniyor.

- Âyet/parça, birleşik bölüm ve tüm çalışma aralığı için üç ayrı tekrar sayısı eklendi. Örnek: âyet 2, birleşik 1, aralık 2 → her âyet iki kez, her birleşik bölüm bir kez; bütün program iki tur. Tek parça Dinle düğmesi yalnız parça sayısını kullanıyor.
- 1+2 aç/kapa artık markajı silmiyor veya otomatik oynatma başlatmıyor. Çalarken değişiklik mevcut kesit bitince uygulanıyor; bütün aralık kesiti çalıyorsa aralık sonu bekleniyor. Tam âyet markajı sûre sonuna genişlemiyor.

- Elifa Saray Koyu Gece dil listesinde beyaz zemin/açık yazı sorunu giderildi. Ortak kart zemini ve seçili/odak renkleri tema değişkenlerine bağlandı. Altın düğmeler, koyu tema metal kenarları ve hesap durum/bağlantı renkleri de düzeltildi.

- Birleştirme ve tüm çalışma sayacı 0 değerini kaydetme, yeniden açma ve yedeklemede koruyor. Birleştirme 0 ise birleşik okuma adımları atlanıyor; tüm çalışma 0 ise tek tur sonunda duruyor. Pozitif sayaçların önceki toplam okuma sayısı anlamı korundu.
- Sayaç sırası âyet/parça → birleştirme → tüm çalışma olarak düzenlendi. “Aralığın tekrar sayısı” adı “Tüm çalışmanın tekrar sayısı” oldu; üç alanın altında 21 dilde kısa açıklama var.

## Doğrulananlar

- `npm run build`: 343 test; 341 başarılı, 0 başarısız, 2 ortam nedeniyle atlanan. Dağıtım paketi üretildi.
- Dil denetimi: 21 dil; eksik anahtar, eksik çeviri satırı, eksik hesap/destek/gizlilik/kılavuz dosyası yok. Bu ölçüm profesyonel dil/hukuk incelemesi yerine geçmez; mevcut inceleme işaretleri değiştirilmedi.
- Tarayıcıda Fâtiha 1–5 aralığı, Mişârî 223, üç tekrar ve 1,25 hızla tamamlandı. Bölünmüş ikinci âyette iki parça ve 1+2 akışı tamamlandı.
- Fâtiha 1–3 birleştirme programı âyet 2 / birleşik bölüm 1 / tüm aralık 2 sayılarıyla tarayıcıda tamamlandı.
- Kaydedilmiş manuel kesimler ve ayarlar yeniden açıldı. İkinci parça sırasında çıkılıp “Kaldığım yerden devam et” seçildiğinde ikinci parça seçili geldi; ses kendiliğinden başlamadı.
- Hollandaca ana ekran ve çalışma ekranındaki dinamik metinler kontrol edildi. Hata raporunun içeriği gösterildi; e-posta gönderilmedi.
- 16 temanın renk değerleriyle dil satırı seçili yüzeyi en az 6,34:1, altın düğme metni 4,88:1, metal ana düğme 4,67:1 kontrast verdi. Bunlar renk hesaplarıdır.
- Tarayıcıda Saray Koyu Gece ve Açık Fildişi dil listeleri, Nahl koyu temasındaki Çalışma Masası ve hesap paneli görsel olarak kontrol edildi. Güncel hesap stilinde bağlantı ve giriş düğmesinin metin/zemin renkleri de doğrulandı.
- Tüm indirmelerin başarısız olması, kısmi başarı/yeniden deneme, iptal, depolama hatası, eksik güncelleme, sahte HTML dönen JS dosyası ve eşitleme yarışları kontrollü testlerde doğrulandı.
- Ses hazırlamada ilk denemede geçici hata görüldü; uyarı/ölçüm yolu eklendi. Sonraki gerçek tarayıcı denemeleri tamamlandı. Bu, her ağ koşulunda kesintisizlik garantisi olarak değerlendirilmemeli.

## Yayın öncesi açık doğrulama sınırları

- Atlanan iki test Firebase Auth/Firestore emülatör bütünleşme testleri. Bu bilgisayarda kullanılabilir Java ve çalışan emülatör yok; gerçek üretim verisi üzerinde test yapılmadı.
- Fiziksel Android/iPhone üzerinde arka plana alma, zayıf ağ ve uzun süreli çevrimdışı çalışma bu turda doğrulanmadı.
- 114 sûrenin tamamı dinlenmedi; mevcut ses sınırı ve kayıt eşleşmesi testleri geçti. Bu sürüm kayıt veya zamanlama kaynağını değiştirmiyor.
- Kullanıcıların uygulamayı silme sebebi bu ölçümlerden kesin olarak çıkarılamaz. Yeni olaylar hata/yarım bırakma ilişkisini incelemeye ve isteğe bağlı geri bildirim toplamaya yardımcı olur.

Önceki bulguların özgün kanıtları `UYGULAMA-MANTIK-DENETIMI-2026-10-17.md` içinde korunmuştur.
