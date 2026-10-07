# Hânî Fâtiha 1:1 tam âyet kuyruğu

Üretimde kullanılan `https://download.quranicaudio.com/qdc/hani_ar_rifai/murattal/1.mp3` dosyasının SHA-256 değeri yeniden doğrulandı: `c420173faed0a1734b586c5f7883c56e75d3eb820508a86dd3eafd9b7fa25654`. Kaynak metadata 1:1 tam âyet aralığını `[7, 4065]` ms, tek mevcut kelime satırını `[7, 3972]` ms veriyor. Eski tam-âyet seçim yolu kelime satırından oluşturulan `ay[1]` aralığını kullandığı için 93 ms erken bitiyordu.

Aynı MP3'ün 44,1 kHz PCM çözümünde 20 ms RMS değeri 3970/3990/4010/4030/4050 ms pencerelerinde sırasıyla 0,00465 / 0,00337 / 0,00248 / 0,00010 / 0,00001 ölçüldü. Son bölümde sönümlenen ses bulunduğu için tam âyet oynatma ve tekrar, yalnızca bu tam URL'yle eşleşen kayıtta `[7, 4065]` ms aralığını kullanacak şekilde düzeltildi. Başka kayda bu zaman taşınmıyor. Eksik üç kelimenin kısmi seçimi hâlâ oynatılmıyor; tahmini kelime sınırı eklenmedi.

Gerçek kaynak metadata'sından küçültülmüş test örneği tam dört kelimelik seçimin tam âyet aralığını açtığını, 1., 3., 4., 1–2 ve 2–4 kısmi seçimlerin ses planı üretmediğini, başka kayıt URL'sine kuyruk düzeltmesi taşınmadığını sınar. `npm run build`: 231 test, 229 başarılı, 2 Firebase ortam atlaması; dağıtım yapılmadı. PCM enerjisi işitsel/fonetik uzman onayı yerine geçmez.
