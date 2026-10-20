# Google Play mağaza görselleri

20 Ekim 2026 tarihinde hazırlanan son görseller:

| Dosya | Boyut | Kullanım |
| --- | --- | --- |
| `play-icon-512.png` | 512 × 512 piksel | Google Play uygulama simgesi |
| `play-feature-1024x500.png` | 1024 × 500 piksel | Google Play özellik grafiği / kapak |

Her iki dosya da opak PNG biçimindedir. Simge tam kare olarak hazırlanmıştır; köşeleri önceden yuvarlatılmamıştır. Yeşil/altın sanat dili ve “Easy Quran Memorization” metni korunmuştur.

Sanat kaynağı, kullanıcının paylaştığı `codex-clipboard-7cb20347-80b4-41ad-a3e6-3c7181daf7e0.jpg` ekidir. İki farklı yerleşim built-in `image_gen` ile bu görselden uyarlanmıştır. Son ölçülere deterministik küçültme ve opak PNG dışa aktarımı için `sharp` / Lanczos3 kullanılmıştır; son aşamada yeni öğe eklenmemiştir.

Üretilen büyük ana dosyalar Git tarafından izlenmeyen `artifacts/google-play-2026-10-20/` klasöründedir:

- `play-icon-generated-master.png` — 1254 × 1254
- `play-feature-generated-master.png` — 1795 × 876

`generation-notes.json`, kaynak ve üretim yöntemi ile yerel çıktıların teknik bilgilerini içerir. Bu klasördeki iki PNG, mağazaya yüklenmek üzere seçilen son kopyalardır.

## Mağaza durumu

20 Ekim 2026: Varsayılan Türkçe mağaza girişinin simgesi ve özellik grafiği bu iki dosyayla değiştirildi. İki yeni görsel yapay zekâyla düzenlenmiş olarak işaretlendi. Yayın özetinde yalnız bu iki görsel değişikliği gönderildi ve **İncelenmekte olan değişiklikler** durumu doğrulandı. Bu, herkese açık mağazada yayına girdiği anlamına gelmez; Google incelemesi bekleniyor. Android AAB sürümü bu görsel gönderiminden ayrıdır.

Yerel gönderim kanıtı: `artifacts/google-play-2026-10-20/play-review-submitted.png`.
