# Dil kapsamı ve çeviri incelemesi

21 dil desteğinin taslak sürümü kullanıcı isteğiyle canlıya alındı. `npm run audit:i18n` dil bazında kapsamı, `node scripts/audit-i18n.mjs --strict` ise çevirmen onayı gerektiren taslak durumunu gösterir. Üretim derlemesinde yapısal denetim zorunludur; `ELIFA_PUBLISH_TRANSLATION_DRAFTS=1` yalnızca taslakların yayımlanmasına izin verir, onları onaylanmış saymaz.

| Alan | Türkçe | İngilizce | Diğer 19 dil |
| --- | --- | --- | --- |
| Ana çeviri tablosu | Var | Var | 287/287 anahtar var |
| Kullanım kılavuzu JSON | Kaynak | Var | 20 dosya var |
| Ekran rehberi | Kaynak | Var | 15 dilde mevcut, Farsça, Bengalce, Malayca ve Svahilice makine çevirisi taslağı |
| Hesap, eşitleme ve hata metinleri | Kaynak | Taslak | 19 dilde 151 metin yayında; AI anlam kontrolü yapıldı, uzman kontrolü bekleniyor |
| Güncel gizlilik metni | Kaynak | Taslak | 19 dilde makine çevirisi taslağı |
| Destek sayfası | Kaynak | Taslak | 19 dilde makine çevirisi taslağı |

Taslaklar otomatik çeviriyle oluşturuldu ve kritik hesap metinlerinin bir bölümü ayrıca elle düzeltildi. `node scripts/validate-i18n-drafts.mjs` dosya, anahtar ve önemli hukuk metni yapısını denetler; çeviri doğruluğunu onaylamaz. Hesap ve gizlilik metinlerinde saklama, silme, cihazda kalan kayıtlar, Firebase ve Apple/Google ile yeniden doğrulama ifadeleri çevirmen ve hukuk kontrolü gerektirir. Ana dili bilen kişilerin gözden geçirmesi ve gerekli düzeltmeler sürmelidir. Eski `manual-*.json` dosyalarındaki gizlilik metni güncel hesap özelliğini anlatmadığı için uygulamada gösterilmez.

İlk açılışta `/api/locale` ülke kodu döndürür. Desteklenen ülke dilleri arasından cihaz diline uygun olan seçilir; tanınmayan ülke İngilizceye düşer. Kullanıcının açıkça elle seçtiği dil korunur. Eski sürüm dil tahminini de aynı alana yazdığı ve seçim kaynağını kaydetmediği için geçişte eski kayıt cihaz diliyle aynıysa otomatik kabul edilir, farklıysa kullanıcının seçimi kabul edilir. Yerel sunucuda ülke kodu yoksa cihaz dili geçici başlangıç dilidir.

Son kontrol için her dilde ana sayfa, okuma, ezber/âyet bölme, kayıtlar, dua, ayarlar, ekran rehberi, hesap, destek ve gizlilik ekranları incelenmeli; sağdan sola dillerde yerleşim ve uzun metin taşmaları ayrıca doğrulanmalıdır. Çeviriler incelenip onaylanmadan `releaseReady` doğru kabul edilmez.
