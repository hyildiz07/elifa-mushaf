# Elifa Mushaf — Mantık ve kullanım denetimi

Tarih: 17 Ekim 2026. İncelenen canlı sürüm: `elifa-mushaf-v333-afasy-split-handles`.
İncelenen kaynak: `0b5a30674a3308e2cc353a23aa2300a5baf9d4bb`.

Bu çalışma bir incelemedir. Uygulama kodu değiştirilmedi, dağıtım yapılmadı.
Önceden bulunan üç çeviri dosyası değişikliği korundu.

## Doğrulama kapsamı

- Canlı ana ekran ve Çalışma Masası arayüzü incelendi.
- Çalışma kayıtları, bölmeler, tekrar planları, indirmeler, servis çalışanı, eşitleme ve olay ölçümleri kaynak üzerinden incelendi.
- Mevcut testler: 299 toplam; 297 başarılı, 2 atlanan, 0 başarısız.
- Dil anahtarı denetimi: 21 dilde kontrol edilen tablolarda eksik anahtar yok. Bu denetim dinamik ekran metinlerinin tamamının çevrildiğini kanıtlamıyor.
- Aşağıdaki ilk üç bulgu gerçek işlev kodunun bağımlılıkları taklit edilerek çalıştırıldığı yerel deneylerle yeniden üretildi. Kullanıcı kayıtları ve canlı önbellek değiştirilmedi.
- Tüm sûreler dinlenmedi; Android/iOS fiziksel cihaz, gerçek iki hesaplı eşitleme ve uzun süreli çevrimdışı uçtan uca denemeler yapılmadı. Bu rapor kapsamlı güvenlik veya tüm cihazlarda hatasızlık sertifikası değildir.

## Öncelikli bulgular

### 1. Aynı aralıktaki kayıtların manuel bölmeleri isim düzenlerken karışabiliyor

Öncelik: yüksek — kaydedilmiş kullanıcı çalışması değişebilir.

Kaynak: `assets/study-sessions.js:120` ve `:139`; `assets/study-split.js:48` ve `:71`.

Koşul: A ve B aynı sûre/âyet aralığına sahip, ancak farklı bölmelere sahip kayıtlar. A açıldıktan sonra B için Düzenle seçilir, yalnızca adı değiştirilip kaydedilir.

Kaydetme işlevi B'nin kendi bölmelerinden önce ortak geçici bölme tercihlerini kullanıyor. Geçici tercihler kayıt kimliğine göre değil, sadece sûre ve aralığa göre eşleştiriliyor.

Kontrollü sonuç:

```json
{"A_cuts":{"1":[2]},"B_before":{"1":[4,7]},"B_after":{"1":[2]}}
```

Öneri: Kayıt kimliği ile düzenleme taslağını birbirine bağlamak; salt isim değişikliğinde eski bölmeleri aynen korumak. Aynı aralıkta iki ayrı kaydın açma/düzenleme akışını regresyon testine eklemek.

### 2. Toplu indirme tüm dosyalarda başarısız olsa bile başarı bildiriyor

Öncelik: yüksek — çevrimdışı çalışacağını düşünen kullanıcı hazırlıksız kalabilir.

Kaynak: `index.html:12027` (`dlAll`), özellikle `:12041` hata yutma ve `:12049` sonuç mesajı.

Her indirme hatası atlanıyor; başarıyla kaydedilip kaydedilmediğine bakılmadan sayaç artırılıyor. İşlem iptal edilmediyse sonuç mesajı her durumda “Doğrulanmış sûreler indirildi”.

Kontrollü sonuç: iki indirme denemesinin ikisi de ağ hatası verdi, sıfır dosya indirildi; yine de başarı mesajı çıktı.

Öneri: Başarılı/başarısız/iptal edilen sayıları ayırmak, başarısız sûreleri tekrar deneme seçeneği sunmak. Yalnızca ses ve zamanlama verileri birlikte doğrulandığında “Çevrimdışı hazır” göstermek.

### 3. Eksik güncelleme eski çalışan çevrimdışı sürümü silebiliyor

Öncelik: yüksek — özellikle zayıf bağlantıda güncelleme sonrası çevrimdışı açılış riski.

Kaynak: `sw.js:63` kurulum, `sw.js:72` etkinleştirme.

Kurulumda ana sayfa ve zorunlu dosyaların indirme hataları yutuluyor. Yeni sürüm yine kurulmuş sayılıyor; etkinleşince eski uygulama önbelleği siliniyor.

Kontrollü sonuç: `./` ve `./index.html` indirmeleri hata verdiği halde kurulum tamamlandı; eski v332 önbelleği silindi ve yeni sürüm istemcileri devraldı. Bu, canlıda gözlenen bir kesinti değil, yeniden üretilmiş hata koşuludur.

Öneri: Zorunlu dosyalar eksiksiz olmadan yeni sürümü etkinleştirmemek; isteğe bağlı dosyaları ayrı ele almak. Eski sürümü ancak yeni çekirdek doğrulandıktan sonra temizlemek.

### 4. Dil entegrasyonu kullanıcı ekranında hâlâ eksik

Öncelik: orta.

Canlı v333 ana ekranında Hollandaca arayüzle birlikte Türkçe “Az ve sürekli; ezberin sırrı tekrardadır.”, “âyet”, “Sayfa”, “Mekkî/Medenî” ve İngilizce “verse” görüldü. Anahtarların tabloda var olması ekranda doğru zamanda ve doğru yerlerde uygulandığını garanti etmiyor.

Öneri: Dinamik sûre kartları, kaldığın yer, uyarılar ve tema metinlerini de ortak dil katmanına bağlamak. Her dil için sadece eksik anahtar sayımı yerine temsilî ekran akışları ve metin kontrolleri yapmak. Sûre adları/özel adlar ile çevrilebilir arayüz kelimelerini ayırmak.

### 5. 1+2 modu başka çalışma akışına taşınıyor

Durum: kodda doğrulanan ortak durum; beklentiye göre kullanım/mantık belirsizliği.

Kaynak: `assets/study-split.js:519`; `index.html:8336`, `:10994`.

Bölünmüş çalışmada 1+2 açıldığında ortak `SET.cumu` değişiyor. Aynı ziyaret içinde normal aralık çalışmasına geçildiğinde de bu ayar okunuyor; “Aralığı başlat” tam aralık döngüsü yerine birleştirme planı oluşturabiliyor. Uygulama yeniden açılırken ayar sıfırlanıyor; bulgu aynı oturum içindeki geçişle ilgilidir. Aktif 1+2'nin korunması bilinçli olabilir, fakat başlat düğmesinin sonucu daha açık anlatılmalı.

Öneri: Başlatmadan önce üç açık seçenek: “Aralığı tekrarla”, “Âyet âyet”, “1+2 birleştir”. Seçili modu ve toplam turu düğmenin yakınında göstermek; çalışma bağlamlarını birbirinden ayırmak.

### 6. Mevcut ölçüm, kullanıcıların neden bıraktığını açıklamak için eksik

Kaynak: `src/usage-analytics.mjs:3`; `index.html:8309`, `:8321`, `:8329`, `:12027`.

`offline_download_result` kabul edilen olaylar arasında, ancak indirme akışında gönderilmiyor. `playback_error` çağrıları Çalışma Masası aralığının bazı yükleme/koruma durumlarıyla sınırlı. Genel okuyucu ve bölme oynatmasındaki tüm hata yollarını kapsamıyor. Başlatılan çalışmanın tamamlanması veya nerede yarım kaldığına ilişkin yeterli olay yok.

Öneri: Kişisel metin, not veya ses toplamadan; indirme sonucu, oynatma hata kategorisi, başlama/tamamlama ve anonimleştirilmiş kullanım aşamalarını ölçmek. Uygulama silme nedenini bu olaylardan kesin olarak bildiğimizi iddia etmemek; isteğe bağlı geri bildirimle desteklemek.

## Ek risk ve ürün önerileri

### Eşitleme sırasında kesilme riski

`src/account.mjs:160`, buluttan farklı veri gelince doğrudan `location.reload()` çağırıyor. `:176` internet geri geldiğinde eşitleme planlıyor. Bu yol açık bir okuma/bölme çalışmasını kesebilir. Kaynak üzerinden saptandı; gerçek iki hesaplı/cihazlı senaryoda henüz yeniden üretilmedi. Yeni veriyi güvenli bir duraklama noktasında uygulamak veya kullanıcıya “Yeni kayıtlar geldi” seçeneği vermek daha uygun.

### Çalışmayı kendi ayarlarıyla kaydetmek

Mevcut kayıtta isim, sûre, aralık, bölme yöntemi ve kesim noktaları var. Hoca, hız, tekrar, ara bekleme, birleştirme modu ve son çalışılan parça kayda ait alanlar değil (`assets/study-sessions.js:137`; `src/account-data.mjs:38`). Bir çalışma açılınca o anki ortak ayarlar geçerli oluyor.

Öneri: Bu tercihleri kayıt başına saklamak; “kaldığın parçadan devam et” sunmak. Açılır açılmaz ses başlatmama davranışı korunmalı.

### Çalışırken ne olduğunu göstermek

“Bakara 1–5 · aralığı tekrarla · 3/5 tur” veya “Parça 1+2 · 2/5 tekrar” gibi kısa bir durum satırı; tamamlanınca net bir bitiş durumu ve yeniden başlatma seçeneği.

### Sorun bildirmeyi kolaylaştırmak

Okuyucuda kısa bir “Ses/sınır sorunu bildir” akışı: sonraki kelime taşıyor, erken kesiliyor, tekrar çalışmıyor seçenekleri. Tanı bilgisi gönderimini kullanıcıya göstermek; özel notları ve ses kaydını otomatik toplamamak.

### Önce güvenilirlik, sonra yeni özellik

Önerilen sıra: kayıt karışması → indirme/güncelleme güvenliği → modların açıklığı → ekranlarda dil bütünlüğü → sonuç ölçümü. Mevcut görünümü büyütmek yerine bu akışları sağlamlaştırmak. Gerçek mobil testlerde zayıf internet, çevrimdışı açılış, arka plana alıp geri dönme, uzun sûre, hız değiştirme ve kayıt açma/düzenleme senaryolarını kapsamak.
