# Elifa Mushaf — v224

## Ana hata: sayfa sonsuz döngüde kendini yeniliyordu (F5 döngüsü)

`index.html` içindeki `<head>` bölümünde `clearOld()` fonksiyonu **her açılışta**:

1. `getRegistrations()` ile **bütün** service worker kayıtlarını iptal ediyordu
   (yeni `sw.js` dâhil),
2. `caches.keys()` ile **bütün** önbellekleri siliyordu.

Sayfanın altındaki kod ise hemen ardından `sw.js`'i tekrar kaydediyordu.
`sw.js` → `activate` → `clients.claim()` → tarayıcı `controllerchange`
olayını tetikliyor → dinleyici koşulsuz `location.reload()` çağırıyordu.

Yeni yüklemede `clearOld()` yine siliyor → yine kaydediyor → yine reload:
**sonsuz döngü.** Safari'de `controllerchange` daha hızlı tetiklendiği için
orada belirgin şekilde görülüyordu.

Aynı hata ikinci şikâyetin de sebebiydi: kalıcı bir service worker asla
oluşamadığı için tarayıcı "Uygulamayı yükle / Ana ekrana ekle" seçeneğini
hiç göstermiyordu.

### Yapılanlar
- `clearOld()` tamamen kaldırıldı. Yerine yalnızca v113 kalıntısı
  `service-worker.js` kaydını **ömür boyu bir kez** temizleyen kod geldi
  (`localStorage: elifaLegacySwCleaned`). `sw.js` ve önbellekler artık
  hiç silinmiyor.
- `controllerchange` dinleyicisine `_hadController` koruması eklendi:
  ilk kurulumda (önceden controller yoksa) sayfa **yenilenmiyor**.
  Yenileme sadece gerçek bir güncellemede yapılıyor.
- Emniyet freni: 12 saniye içinde 3'ten fazla yenileme olursa
  (`sessionStorage: elifaRlN/elifaRlT`) yenileme tamamen durduruluyor.
  İleride benzer bir hata olsa bile uygulama artık kilitlenmez.

## "Uygulamayı yükle" desteği eklendi
- `beforeinstallprompt` dinleyicisi eklendi (Chrome / Edge / Samsung Internet):
  alt kısımda "Elifa Mushaf'ı telefonuna kur → Yükle" çubuğu.
- iOS Safari'de `beforeinstallprompt` yok; orada
  "Paylaş → Ana Ekrana Ekle" yönlendirme çubuğu gösteriliyor.
- `appinstalled` olayında ve kapatıldığında çubuk bir daha çıkmıyor
  (`localStorage: elifaInstallHidden`). Uygulama standalone/TWA modunda
  açıldığında hiç gösterilmiyor.

## sw.js sertleştirildi (v224)
- Sadece `ok` + `200` + `basic` + yönlendirilmemiş yanıtlar önbelleğe alınır.
- **SPA fallback zehirlenmesi giderildi:** Netlify'deki `/* → /index.html 200`
  kuralı yüzünden eksik bir dosya istendiğinde HTML dönüyordu ve bu HTML
  `.json` / `.png` adreslerinin altına önbelleğe yazılıyordu → sonraki
  açılışta `JSON.parse` hatası. Artık HTML olmayan bir isteğe gelen HTML
  yanıtı önbelleğe **yazılmıyor**.
- `version.json`, `duyuru.json` ve `manual-*.json` artık ağ öncelikli
  (bayat kalmıyor); offline'da önbellekten geliyor.
- `/api/*` ve `/.netlify/*` istekleri service worker'a hiç girmiyor.

## manifest.json
- `lang`, `dir`, `display_override`, `categories`,
  `prefer_related_applications: false` eklendi; ikonlara `purpose` yazıldı.
- `name`, `start_url`, `scope`, `theme_color`, `background_color`
  **değiştirilmedi** — yayında olan Play Store TWA'nın kimliği bozulmasın.

## _headers
- `/sw.js` → `no-store` + doğru `Content-Type`.
- `/index.html` ve `/` → `no-cache, must-revalidate`.
- `/manifest.json` → `application/manifest+json` + `no-cache`.

---

# Gerçek tarayıcı testleri (Playwright)

Yamalar sadece göz kontrolüyle bırakılmadı; Chromium ve WebKit (Safari motoru)
ile ölçüldü. Test: aynı tarayıcı profilinde önce eski sürüm açılıyor
(telefondaki mevcut hal), sonra sunucudaki dosyalar v224 ile değiştiriliyor
(Netlify'a yükleme anı), ardından uygulama üç kez tekrar açılıyor.

## Eski v223 — hata birebir tekrar üretildi

| Motor | 15 sn içinde sayfa yüklenme sayısı |
|---|---|
| Chromium | 2 |
| WebKit (Safari) | **5 – 7** |

WebKit'te sunucu isteği kaydı döngüyü açıkça gösteriyor:

```
/ → sw.js → / → index.html → sw.js → / → sw.js → / → index.html → sw.js → ...
```

Önbellek listesi çoğu turda **boş** kalıyordu — yani offline çalışma da
hiç kurulamıyordu ve tarayıcı kurulum seçeneğini bu yüzden göstermiyordu.
Safari'de döngünün Chromium'dan çok daha şiddetli olması, hatanın
`clearOld()` ile service worker kaydı arasındaki bir **yarış durumu**
(race condition) olmasından kaynaklanıyor: Safari'nin service worker
zamanlaması yarışı hep döngü lehine çözüyor.

## Yeni v224 — Chromium'da doğrulandı

| Açılış | Yüklenme | Önbellek |
|---|---|---|
| v224 yayına alındıktan sonra 1. açılış | 2 | `elifa-mushaf-v224-loopfix` |
| 2. açılış | 1 | `elifa-mushaf-v224-loopfix` |
| 3. açılış | 1 | `elifa-mushaf-v224-loopfix` |

İlk açılıştaki tek fazladan yüklenme **hata değil**: yeni sürüm indiğinde
uygulanması için yapılan normal güncelleme yenilemesidir. Sonrası sabit.

## Test sırasında bulunan İKİNCİ hata: Safari yeni sw.js'i almıyor

WebKit ölçümünde v224 yayına alındıktan sonra üç açılış boyunca
`sw.js` sunucudan **hiç istenmedi**; eski v223 service worker aktif kaldı ve
önbellek v223'te takılı kaldı. Yani sadece döngüyü düzeltmek yetmezdi —
iPhone'lardaki kullanıcılar eski sürümde kalmaya devam edecekti.

Eklenen çözüm (`_forceSwRefresh`): beklenen önbellek adı (`SW_CACHE_EXPECTED`)
yoksa ama eski bir `elifa-mushaf-*` önbelleği varsa, kayıt **ömür boyu bir kez**
tazeleniyor — eski kayıt iptal ediliyor, eski önbellekler siliniyor ve sayfa
bir kez yeniden yükleniyor (WebKit, sayfayı yöneten service worker'ı aynı
yükleme içinde bırakmadığı için yeniden yükleme şart).

**Önemli güvenlik detayı:** işaret `localStorage`'a yazılıyor ve yazıldığı
**geri okunarak doğrulanıyor**. Safari gizli modunda veya depolama dolu
olduğunda `localStorage` yazılamaz; doğrulama olmasa bu blok her açılışta
tekrar çalışıp yeni bir sonsuz döngü başlatırdı. Yazılamıyorsa migrasyondan
tamamen vazgeçiliyor.

## Kalan belirsizlik — gerçek iPhone'da denenmeli

Playwright'ın Linux üzerindeki headless WebKit'i **Safari'nin kendisi değildir**;
service worker desteği eksik ve kararsızdır (testte kayıt `installing`
durumunda takılı kaldı, bu büyük olasılıkla headless kusuru). Bu yüzden:

- Eski sürümdeki döngünün tekrar üretilmesi **güvenilir bir bulgudur**
  (gerçek dünyadaki şikâyetle birebir örtüşüyor).
- Yeni sürümün gerçek iOS Safari'de sorunsuz güncellendiği buradan
  **kesin olarak doğrulanamaz**; gerçek bir iPhone'da denenmelidir.

## Üç kademeli koruma

Tek bir düzeltmeye güvenilmedi; biri kaçsa bile diğerleri tutar:

1. `clearOld()` kaldırıldı → döngünün kaynağı yok.
2. `_hadController` → ilk kurulumda yenileme yapılmıyor.
3. Fırtına freni → 12 saniyede 3'ten fazla yenileme olursa yenileme
   tamamen durur. **En kötü senaryoda bile uygulama sonsuz döngüye girmez.**
