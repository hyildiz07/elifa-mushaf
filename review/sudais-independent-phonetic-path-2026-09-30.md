# Südeys 28/29: bağımsız fonem hizası için yerel yol

## Elde hazır olanlar

- Uygulamanın özgün QDC kayıtları `test-results/sudais-qdc-28.mp3` ve `29.mp3` altında duruyor. SHA-256 değerleri sırasıyla `f8e5291cf10a3a29230fd443b5ddabc4297cf5b16c70250dda3bfe6314917576` ve `525bcfbaaa6fbeece6c93e0e25d7d36393aaddd406366284ded5bd141107af67`.
- `src/split-audio.mjs` içindeki `decodeWindow`, kurulu `mpg123-decoder` ile MP3'ü bayt sıfırdan çözebiliyor. `review/pilot-sudais-independent-qdc-align.mjs`, dört pencere için bu yolu kullandı. Fonem hizası henüz üretmedi; QUD Large ile âyet kimliği taraması yaptı.
- Windows PATH üzerinde `ffmpeg`, `sox`, `whisper-cli`, çalışan sistem Python'u yok. Codex'in paketli Python'unda `numpy` var; `torch`, `torchaudio`, `transformers`, `onnxruntime`, `whisper`, `faster_whisper` yok. Yerel Hugging Face model önbelleği de bulunmadı. Bu yüzden sıfır indirmeyle bağımsız sinirsel fonem hizası çalıştırılamıyor.

## En küçük dürüst pilot

**Önce 29:45–46, sonra 28:44.** Mevcut QUD çıktısı 29:45 meta aralığında 29:42 kuyruğu, 29:43, 29:44 ve 29:45'in ilk üç kelimesini; 29:46 meta aralığında ise 29:45'i buldu. 28:44 meta aralığında 28:43 kuyruğunu buldu. Bu üç pencere, ikinci modelin kaymayı bağımsız saptayıp saptamadığını sınamak için yeterlidir. `review/sudais-independent-pilot/*.json` içindeki kaynak SHA, pencere koordinatı ve çıktı bu pilotun sabit girdileridir.

1. Aynı QDC MP3'ünden komşu âyetleri de içeren 15–20 saniyelik mono 16 kHz PCM pencereleri çıkar; `decodeWindow` ile kaynak zaman ofsetini ve SHA-256'yı kaydet. Uzun 29:45 okumasını birkaç **örtüşen** pencereye ayır; modelin 20 saniye eğitim sınırını aşma.
2. Ayrı bir fonem CTC modelinin çerçeve olasılıklarını (yalnız serbest metin çıktısını değil) al. Beklenen Hafs fonem dizisi ile CTC/Viterbi hizası kur; belirsiz veya yinelenen fonem yollarını işaretle. Arapça yazıyı doğrudan fonem sayma: şedde, uzun ünlü, hemze, idğam ve vakıf biçimleri denetlenmiş sözlük/g2p gerektirir.
3. 29:44 son fonemi–29:45 ilk fonemi, 29:45 son fonemi–29:46 ilk fonemi ve 28:43–44 için iki taraflı 0,5–1 saniyelik dinleme parçaları üret. Bağımsız model ile QUD/QUL yalnız sınır adayları sunar; kesim onayı dinlemeye bağlıdır. JSON çıktısını `review/` altında tut; uygulama zamanlarına yazma.

Gerçek fonem çıktısı için araştırmaya en yakın açık aday, [MostafaMaroof/wav2vec2-arabic-phoneme-asr](https://huggingface.co/MostafaMaroof/wav2vec2-arabic-phoneme-asr) modelidir: Apache-2.0 etiketli, Kur'an tarzı telaffuz içeren veriyle eğitilmiş ve 78 fonem/sessizlik tokenı kullanıyor. Ancak ağırlık dosyası [1,26 GB](https://huggingface.co/MostafaMaroof/wav2vec2-arabic-phoneme-asr/tree/main), ayrıca PyTorch/Transformers kurulumu gerekiyor; bu pilotta indirilmedi. Kartı sınır titremesi ve ünlü karışıklığını açıkça bildiriyor. Model kartı, temel modelin lisansının ayrıca incelenmesini de istiyor. Bu nedenle modeli otomatik ürün kapısı olarak değil, çevrimdışı inceleme adayı olarak ele almak gerekir.

75 MiB [whisper.cpp tiny](https://github.com/ggml-org/whisper.cpp/blob/master/models/README.md), MIT lisanslı [whisper.cpp](https://github.com/ggml-org/whisper.cpp) ile hafif bir **âyet kimliği karşı denemesi** olabilir; fakat Whisper çıktı zamanları fonem sınırı kanıtı değildir. [WhisperX'in Arapça varsayılan hizalayıcısı](https://github.com/m-bain/whisperX/blob/main/whisperx/alignment.py) büyük bir wav2vec2 modeline gider; bu makinede hazır bağımlılık yok. İkisini fonem doğrulaması diye sunmamak gerekir.

**Karar:** Bu ortamda ağır indirme yapmadan en hızlı tekrar edilebilir çalışma mevcut QDC/QUD pilotunu ve komşu ses dinlemesini sürdürmektir. Gerçekten bağımsız fonem karşılaştırması gerekli olduğunda, tek bir 1,26 GB model ve onun bağımlılıkları ayrı bir araştırma ortamına alınarak yukarıdaki üç sınırda denenebilir. Hiçbir model koşulu kabul edilmedi, model kurulmadı veya üretim dosyası değiştirilmedi.
