# Google Play mağaza görselleri

25 Ekim 2026: Kullanıcının yeni yazılı `play-artwork-2026-10-25.jpg` görseli, kırpma veya rötuş yapılmadan 512 × 512, 32 bit PNG `play-icon-512.png` dosyasına küçültüldü. Bu dosya yalnız Google Play mağaza/aramanın simgesi içindir. Telefonun başlatıcı simgesi ayrı `../android/phone-artwork-2026-10-25.jpg` kaynağından hazırlanır. Önceki özellik grafiği değişmez.

23 Ekim 2026 tarihinde kullanıcının seçtiği güncel simge:

| Dosya | Boyut | Kullanım |
| --- | --- | --- |
| `play-icon-512.png` | 512 × 512 piksel | Google Play uygulama simgesi ve Android başlatıcı kaynağı |
| `play-feature-1024x500.png` | 1024 × 500 piksel | Google Play özellik grafiği / kapak |

Yeni simgenin kaynağı `approved-icon-2026-10-23.jpg` dosyasındaki, kullanıcının gönderdiği “Kur’an-ı Kerim Hafız” görselidir. `node store-assets/google-play/prepare-icon.mjs` komutu bu görseli 512 × 512 opak PNG'ye indirger. Android'in farklı simge maskelerinde beyaz köşeler görünmemesi için yalnızca kenara bağlı beyaz zemin pikselleri koyu yeşile çevrilir; Kur'an resmi ve yazı korunur. Başlatıcı boyutları `node android-twa/scripts/generate-launcher-icons.mjs` ile bu PNG'den üretilir.

Özellik grafiği 20 Ekim tarihli önceki çalışmadır; bu yeni simge isteği onu değiştirmez.

## 20 Ekim görsel çalışması

Sanat kaynağı, kullanıcının paylaştığı `codex-clipboard-7cb20347-80b4-41ad-a3e6-3c7181daf7e0.jpg` ekidir. İki farklı yerleşim built-in `image_gen` ile bu görselden uyarlanmıştır. Son ölçülere deterministik küçültme ve opak PNG dışa aktarımı için `sharp` / Lanczos3 kullanılmıştır; son aşamada yeni öğe eklenmemiştir.

Üretilen büyük ana dosyalar Git tarafından izlenmeyen `artifacts/google-play-2026-10-20/` klasöründedir:

- `play-icon-generated-master.png` — 1254 × 1254
- `play-feature-generated-master.png` — 1795 × 876

`generation-notes.json`, kaynak ve üretim yöntemi ile yerel çıktıların teknik bilgilerini içerir. Bu klasördeki iki PNG, mağazaya yüklenmek üzere seçilen son kopyalardır.

## Mağaza durumu

23 Ekim 2026: Yeni `play-icon-512.png` Google Play varsayılan mağaza girişine yüklendi. Yayın özeti bu tek simge değişikliğini Türkçe ve mevcut 24 diğer mağaza diline yansıyan **25 simge değişikliği** olarak gösterdi; başka öğe değişikliği yoktu. Değişiklikler incelemeye gönderildi ve yayın özetinde **İncelenmekte olan değişiklikler** başlığıyla geri okundu. Yönetilen yayınlama kapalı; Google onayından sonra otomatik yayımlanması beklenir. Telefon başlatıcı simgesi ayrı bir Android AAB güncellemesi gerektirir. Kanıt: `artifacts/android-branding-2026-10-23/play-icon-review.png`.

20 Ekim 2026: Varsayılan Türkçe mağaza girişinin simgesi ve özellik grafiği bu iki dosyayla değiştirildi. İki yeni görsel yapay zekâyla düzenlenmiş olarak işaretlendi. Yayın özetinde yalnız bu iki görsel değişikliği gönderildi ve **İncelenmekte olan değişiklikler** durumu doğrulandı. Bu, herkese açık mağazada yayına girdiği anlamına gelmez; Google incelemesi bekleniyor. Android AAB sürümü bu görsel gönderiminden ayrıdır.

Yerel gönderim kanıtı: `artifacts/google-play-2026-10-20/play-review-submitted.png`.

## Yerelleştirilmiş mağaza adları

20 Ekim 2026'daki sonraki kontrolde önceki görsel değişikliği mağaza düzenleme ekranında **Canlı** olarak göründü. Yeni simge ve özellik grafiği, başka görsel tanımlanmayan dillerde varsayılan görsel olarak kullanılır.

Uygulamanın 21 arayüz dilini kapsayan mağaza adları ve açıklamaları hazırlandı. Mevcut Türkçe giriş korunurken **24 yeni dil/bölge girişi** eklendi: de-DE, en-US, en-GB, ru-RU, fr-FR, es-ES, es-419, el-GR, it-IT, nl-NL, pt-PT, pt-BR, ar, zh-CN, zh-TW, ja-JP, ko-KR, hi-IN, ur, id, fa, bn-BD, ms, sw. Türkçeyle birlikte 25 mağaza dil/bölge girişi vardır.

- `localization-west.json` ve `localization-east.json`: ad, kısa telefon adı, kısa/tam mağaza açıklamaları.
- `node store-assets/google-play/prepare-localizations.mjs`: 30/80/4000 karakter sınırlarını ve dil kapsamını denetler; `play-listing-translations.md` içe aktarma dosyasını üretir.
- Google Play'in dosya içe aktarma arayüzüyle 24 yeni çeviri eklendi. Her birinin üç metin alanı tarayıcı formundan geri okunup kaynakla **birebir** karşılaştırıldı.
- Kayıttan sonra yayın özetindeki 24 dil satırı kontrol edildi ve gönderildi. Son doğrulanan durum **İncelenmekte olan değişiklikler**; yeni dil adları henüz herkese açık mağazada doğrulanmadı. Yönetilen yayınlama kapalı olduğundan Google onayından sonra yayımlanır.
- `localization-readback.json` alan karşılaştırmalarını ve gönderim durumunu tutar. Ekran kanıtı: `artifacts/google-play-2026-10-20/play-localizations-in-review.png`.

Android paketindeki telefon adları ve simge de bu kaynaklarla güncellendi. 23 Ekim'deki yeni simgeli imzalı AAB dahili test kanalında kullanıma sunuldu; cihaz doğrulaması ve herkese açık güncelleme durumu `android-twa/VALIDATION.md` içindedir.
