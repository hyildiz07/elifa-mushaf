# Elifa Mushaf — v241 kaynak paketi

Otomatik âyet bölme, aynı kayıttan hassas ses oynatma, isteğe bağlı hesap ve kayıt güvenilirliği çalışması. İki mushaf yazımının durak işaretleri Uthmanî metne göre eşleştirilir. Eksik kelime etiketleri yalnızca zamanlama satırları aradaki eksik konumları kesin olarak dolduruyorsa düzeltilir. Uzun hoca duraklarının ortası yanlışlıkla MP3 kayması sayılmaz; önceki parça sessizlik içinde kapanır, sonraki parça konuşma başlamadan hemen önce açılır.

v236, güvenilir kelime zamanlaması bulunan uzun âyetleri yaklaşık 3–6 kelimelik ezber gruplarına ayırır; anlamlı cümlecik başlangıçlarını ve doğal nefesleri tercih eder. Durak olmayan kayıtta iki komşu parçanın sesi aynı kelime zamanında birleşir. Bakara 2:277, farklı hocalarda 5+4+4+6 kelime olarak doğrulandı. Zamanlama satırları eksik veya çelişkiliyse tahmini ses kesimi yapılmaz. Arapça metinler değiştirilmedi. Bütün sesler dinlenerek veya uzman tarafından onaylanmış değildir.

v237, Türk mushafında farklı yazılan birleşik kelimeleri metni değiştirmeden sesin kelime numaralarına eşler. Örneğin iki yazılı kelime olan “يَٓا اَيُّهَا”, ses kaydının tek zamanlama birimi olarak seçilir. Güvenilir eşleme kurulamayan âyetlerde yanlış kelime vurgusu yapılmaz.

v238, parça kartındaki kelime sayısını ses zamanlama birimleri yerine ekranda görünen Arapça kelimelerden hesaplar.

v239, Türk mushafında bir yazılı kelimeye karşılık gelen iki ses kelimesini ve toplam kelime sayısı eşit olsa da konumu kaymış birleşmeleri eşler. Âl-i İmrân 3:4, 11 hoca kaydında kısa parçalara ayrılır. Geçersiz sıfır süreli zamanlama satırları ayıklanır; küçük âyet sonu zamanlama taşmaları diğer güvenli iç sınırları iptal etmez. Tekrar ayar menüsüne görünür Kapat düğmesi ve aralığı başlatıp menüyü kapatan düğme eklendi. Bütün uzun âyetler henüz sesli olarak bölünemiyor; kalan istisnalar [v239 ses denetimi](docs/SES-v239.md) içinde sayısal olarak belirtilmiştir.

v240, ana sayfanın altındaki eski sürüm etiketini kaldırır; güncel sürüm Hakkında ekranında görünür.

v241, yalnız son kelimenin zamanlaması taşan hoca kayıtlarında önceki doğrulanmış ses sınırlarını korur. Son parça âyet sınırında biter. Güncel istisna ve test sayıları [v241 ses denetiminde](docs/SES-v241.md) yer alır.

[v241 ses denetimi](docs/SES-v241.md) · [v239 Türk mushafı eşleştirmesi](docs/SES-v239.md) · [v238 görünen kelime sayısı](docs/SES-v238.md) · [v237 Türk mushafı ses eşleştirmesi](docs/SES-v237.md) · [v236 kısa parçalar](docs/SES-v236.md) · [Firebase kurulumu](docs/FIREBASE-v227.md). Önceki raporlar bütün parça sızmalarının çözüldüğüne kanıt sayılmamalı.

## Yerel kullanım

Proje klasöründe:

```sh
npm ci
npm run dev
```

Önizleme: http://127.0.0.1:4173/ . Yerel hesap API'si Firebase emülatörlerine bağlanır; Birlikte yerel demo modunda çalışır. Hesap testleri için önce Firebase emülatörlerini başlatın.

```sh
npm test
npm run build
```

Build önce testleri çalıştırır, ardından yalnızca yayımlanacak dosyaları `dist/` içine kopyalar. Kaynak, test ve inceleme dosyaları siteye yayımlanmaz. Fonksiyonlar ayrıca `netlify/functions/` içindedir.

## GitHub ve mevcut Netlify sitesi

GitHub kullanmak mantıklı: değişiklik geçmişi, geri dönüş ve testlerden geçen sürümlerin dağıtımı izlenebilir olur. Önce özel bir depo ve önizleme dağıtımı önerilir. Bu çalışma sırasında GitHub deposu oluşturulmadı, uzak bağlantı yapılmadı.

Mevcut Netlify projesinde **Project configuration → Developer settings → Continuous deployment → Repository → Link repository** yoluyla depo bağlanabilir. Yeni bir Netlify sitesi açmak yerine mevcut siteyi kullanmak, alan adı ve mevcut siteye bağlı verilerin korunmasını kolaylaştırır. [Netlify bağlantı belgesi](https://docs.netlify.com/build/git-workflows/repo-permissions-linking/)

`netlify.toml` içindeki ayarlar:

| Ayar | Değer |
|---|---|
| Build command | `npm run build` |
| Publish directory | `dist` |
| Functions directory | `netlify/functions` |

Node 22.12 veya üzeri gerekir. Netlify Identity/PostgreSQL gerekmiyor. Firebase Authentication ve Firestore kullanılır. Yeniden dağıtımda [canlı yapılandırmayı](docs/FIREBASE-v227.md) koruyun; Firebase Admin sürümü Lambda uyumluluğu için sabitlenmiştir.

Mevcut `ELIFA_ADMIN_SECRET` ortam değişkenini ve Netlify Blobs verilerini aynı sitede koruyun. Sırları GitHub'a koymayın. ZIP kaynak paketidir; Netlify Drop ile yalnızca statik dosyaları yüklemek Birlikte sunucu fonksiyonlarının dağıtımı yerine geçmez.

## Denetimleri yeniden çalıştırma

```sh
npm run audit:audio
node scripts/audit-text.mjs
node scripts/audit-pages.mjs
```

İlk ses denetimi 1.254 zamanlama kaydı indirir. Sonuçlar ve indirilen referanslar `test-results/` altında saklanır; Git'e eklenmez. Tekrar çalıştırma önbellekteki referansı kullanır. Güncel kaynaklarla yeniden karşılaştırma yapılacaksa önce bu klasörün bir kopyasını saklayıp ilgili önbellek dosyalarını ayrı bir klasöre taşıyın.

Diyanet karşılaştırması Windows PowerShell'de:

```powershell
powershell -File scripts/fetch-diyanet.ps1
node scripts/audit-diyanet.mjs
```

Metin farklılıklarının raporlanması tek başına yanlış okunuş kanıtı değildir. Normalleştirme kuralları ilgili betiklerde açıkça yazılıdır; çözümlenmemiş farklar insan incelemesi için korunmuştur.
