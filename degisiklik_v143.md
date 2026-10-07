# v143 — Kullanma Kılavuzu + Birlikte turu

## 1. Ayarlar → Kullanma Kılavuzu

Ayarlar ekranına yeni satır: **Kullanma Kılavuzu**

Tıklayınca tam ekran kılavuz açılır:
- **11 bölüm**, uygulamanın içinde, **internetsiz** çalışır
- Üstte içindekiler — dokununca o bölüme atlar
- **Geri tuşu** kapatır
- Resim yok → sadece **~25 KB** ekledi (kullanıcı zaten uygulamanın içinde)

**Bölümler:** Okuma · Hat ve mushaf · Durak işaretleri · Dinleme ·
Kelime seçimi · Test modu · Ezber takibi · **Cüz paylaşımı** ·
**Toplu zikir** · Çevrimdışı · Sık sorulanlar

**Cüz paylaşımı** ve **toplu zikir** baştan sona senaryolu anlatıldı:

> Hüseyin hatim başlatır → linki gruba atar → Ayşe cüzünü alır →
> okur, işaretler → Hüseyin %23'ü görür → hatırlatma gönderir →
> hatim biter, PDF raporu iner

**İki linkin farkı** (katılım vs yönetici) kırmızı uyarı kutusuyla
vurgulandı — en sık yapılan hata orası.

## 2. Birlikte artık turda anlatılıyor

Birlikte sonradan eklenmişti, tanıtım turunda **hiç geçmiyordu.**

**Eklenenler:**

| Yer | Ne |
|---|---|
| **Ana ekran turu** | "Birlikte" adımı eklendi (9 adım oldu) |
| **Birlikte ekranı** | **"?" düğmesi** eklendi (yoktu) |
| **GUIDE.birlikte** | 4 adımlık tur: Hatim · Toplu zikir · Linkle katıl · Organizasyonlarım |
| **GUIDE.org** | 2 adımlık tur: Cüz tablosu renkleri · Hatırlatma |
| **currentScreen()** | `birlikte` ve `org` ekranları tanınır oldu |

## Test

| | |
|---|---|
| 114 sûre · 3 hat | ✓ |
| Bakara: Medine 286 / Türk 286 | ✓ |
| Kılavuz 11 bölüm açılıyor | ✓ |
| Geri tuşu kılavuzu kapatıyor | ✓ |
| Birlikte turu 4 adım | ✓ |
| Ana ekran turunda Birlikte | ✓ |
| Âyet numarası küçültülmüş (20,8px) | ✓ |
| JS hatası | **yok** |

`sw.js` → **v143**
