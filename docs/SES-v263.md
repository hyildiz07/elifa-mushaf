# v263 Südeys 27 hızlı ses erişimi

Canlı kaynak denetiminde 909 doğrulanmış QUA sûre MP3'ü ve 342 eski Südeys/Hânî/Hüsarî kaydı incelendi. Südeys 27. sûresinin VBR olduğu ve önceki konum dizininde bulunmadığı görüldü. Özgün 21.703.176 baytlık MP3'ün bütün 39.512 MPEG karesi taranarak 397 doğrulanabilir kontrol noktası çıkarıldı; baş ve son 64 KiB SHA-256 özetleriyle dosya kimliği sabitlendi. Yeniden ağ denetiminde bu 342 kaydın tamamı hızlı konum yolundan geçti.

27:75'in geç ses penceresi, aynı MP3 baştan çözülerek üretilen PCM ile yaklaşık `3.9e-8` RMS farkla eşleşti. Canlı kaynaktan tam MP3 istenmeden hazırlık yaklaşık 2,2 saniye sürdü. Yüksek bit hızlı dosyada ilk 64 KiB üç saniye ses içermediğinden başlangıç düzeltmesi, daha kısa örnekle aynı kesin PCM eşleşmesi aranarak ölçüldü; ölçülen düzeltme 529 örnekti.

Kaynak dosyalarının diğer üçünde iki eski Şuraym sûresi hızlı indeksleniyor. Yâsir ed-Dûserî Fâtiha dosyası 777 KiB civarında ve tagless CBR olsa da uygulamanın kısa sûre tam çözümleme yolunda. Bu nedenle uzun sûre için hızlı erişim gerekmiyor. Kalan kelime/âyet sınırı istisnaları [v263 listesinde](split-exceptions-v263.json) duruyor; bu sürüm onların doğruluğunu ilan etmez.
