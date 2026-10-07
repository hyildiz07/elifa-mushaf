# Kelime zamanlı alternatif kayıt incelemesi — 2026-09-27

Bu belge `v244` için yapılan ön incelemenin tarihsel kaydıdır. Kaynağın adı aynı olsa bile farklı MP3'e ait zamanlar uygulamadaki MP3'e uygulanamaz. Uygulamaya alınan seçim ve son denetim `SES-v245.md` içindedir.

Veri kaynağı: [Qur'anic Universal Audio v3.2.0](https://github.com/QUD-Technologies/quranic-universal-audio/releases/tag/v3.2.0). Katalog, Arapça metin, zaman ve ZIP dosyaları sürüm manifestindeki SHA-256 değerleriyle doğrulandı. İçe aktarma adayları yalnızca tam/kanonik âyet okuması, bütün kelimelerin eşleşmesi, tam kelime sınırları, artan zamanlar ve kaynak MP3 URL'si koşullarını karşıladığında sayıldı. Buradaki “8 kelimelik sınırı sağlıyor” sayısı, **güvenli ham kesim noktaları** açısından ön denetimdir; uygulamadaki tam oynatma planının, çevrimdışı depolamanın ve gerçek sesin doğrulandığı anlamına gelmez.

Denetimi yeniden çalıştırma: `node scripts/evaluate-qua-alternatives.mjs`. Kaynaklar sabit sürümden indirilir ve her ZIP/kelime metni dosyasının SHA-256 değeri sürüm manifestine göre doğrulanır. Betik uygulama dosyasını veya mevcut MP3 kaynağını değiştirmez.

| Uygulama hocası | QUA kayıt kimliği | Tam âyet eşleşmesi | Mevcut sorunlardan eşleşen | Ham güvenli sınırlarla 8 kelimeyi aşmayan âyet |
|---|---|---:|---:|---:|
| 1 Abdülbasit Mücevved | `abdulbasit_abdulsamad_mujawwad_tarteel` | 6236/6236 | 6/6 | 6194/6236 |
| 2 Abdülbasit Murattel | `abdulbasit_abdulsamad_tarteel` | 6236/6236 | 171/171 | 6215/6236 |
| 4 Ebû Bekir eş-Şâtırî | `abu_bakr_al_shatri_tarteel` | 6236/6236 | 92/92 | 6232/6236 |
| 6 Hüserî | `mahmoud_khalil_al_husary_qdc_128k` | 6236/6236 | 22/22 | 6193/6236 |
| 7 Mişârî | `mishary_rashid_al_afasy_2008_qdc` | 6236/6236 | 144/144 | 6229/6236 |
| 9 Minşâvî | `mohammed_siddiq_al_minshawi_mp3quran` | 6236/6236 | 19/19 | 6227/6236 |
| 10 Şureym | `saud_al_shuraim_mp3quran` | 6234/6236 | 5/5 | 6232/6236 |
| 97 Yâsir ed-Dûserî | `yasser_al_dosari_archive` | 6235/6236 | 18/18 | 6226/6236 |

Şureym için 1:1 kanonik zaman verisi eksik, 3:36'da bir sonraki zaman aralığıyla çakışma var. Dûserî için 1:1 eksik. Uygulamadaki 3 ve 12 numaralı hocaların eş kayıtları bu sürüm kataloğunda yok. Hânî er-Rifâî'nin mevcut MP3'üyle eşleşen kayıt zaten `v244` içinde kısmen kullanılıyor; 6 kanonik uzun parça durumu kaldı.

Sekiz kaynağın Bakara Sûresi MP3'leri için tarayıcıdan `Range: bytes=0-1023` isteği HTTP 206 ve 1024 bayt döndürdü. Bu, örnek dosyalarda web oynatımının mümkün olduğunu gösterir; bütün 114 sûrenin çalışma hızı veya sürekliliğini kanıtlamaz.

Kayıt değiştirme yolunda tam korpus ses planı denetimi, mevcut çevrimdışı indirmelerin kaynak URL'sine göre ayrılması/geçersiz kılınması, yeni indirmelerde aynı kaynak ve zaman dosyasının birlikte saklanması, tarayıcıda parça/tekrar/geçiş sınaması ve eksik/tekrarlı okumaların dinlenerek kontrolü gerekir. Kaydı aynı hocanın farklı icrası ile değiştirmek ses üslubunu değiştireceği için uygulama tercihi olarak değerlendirilmelidir. Kalan 3 ve 12 numaralı kayıtlar için mevcut MP3 üzerinde hizalama ve insan kulağıyla sınır denetimi gerekir. `0 yapısal hata` veya metin eşleşmesi, `0 işitsel hata` iddiası için yeterli değildir.
