# v233 kelime seçiminde hoca kaydı doğruluğu

Uzun sûrelerde kelime seçimi önceki sürümde `chapter_reciters` kimliğini
`recitations` âyet-kaydı uç noktasına geçiriyordu. Quran Foundation bu iki
kimlik kümesinin birbirinin yerine kullanılamayacağını açıkça belirtiyor.
Bu yüzden seçilen hocanın dışında bir sesin ve başka kaydın kelime
zamanlamasının karışma riski vardı.

Kelime seçimi artık v232'nin kullandığı aynı orijinal sûre MP3'ünden çözülmüş
örnek-hassas ses penceresini paylaşır. Pencere hazırlanamıyorsa farklı bir
âyet kaydına veya yaklaşık kelime kesimine geçilmez; kullanıcıya yeniden
denemesi söylenir. Hazırlık sırasında seçim/hoca değişirse eski işlem ses
başlatmaz. Bölme ekranının yolu değişmedi.

Yerel tarayıcıda Nisâ 4:12 kelime seçimiyle kontrol edildi: seçili hocanın
`quranicaudio.com` sûre kaydı kullanıldı, seçim ve bölme aynı PCM buffer'ını
paylaştı ve oynatma Web Audio yolunda gerçekleşti.

Kaynak: [Quran Foundation Audio API](https://api-docs.quran.com/docs/sdk/javascript/audio/).
