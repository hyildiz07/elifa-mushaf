# Tecvidli gösterim: metin uyumluluğu denetimi

Tarih: 26 Ekim 2026. Bu dal yalnızca teknik denetim içerir; okuyucuya tecvid
renkleri eklenmedi ve canlı site değiştirilmedi. Mevcut Mushaf fontu ile iki
Arapça metin kaynağı aynen bırakıldı.

## İncelenen uygulama

- `index.html` içindeki `QTEXT` Medine metni ve `QTEXT_TR` Türk mushafı,
  `fetchVerses` ile kelimelere çevriliyor. `buildDOM` her kelimeyi `.w` içinde
  gösteriyor; `wHTML` bazı vakıf ve secde işaretlerine iç `span` ekliyor.
- `--qf` okuyucu fontunu belirliyor. Kullanıcının seçtiği font/metin korunmalı.
- `CSS.highlights` / `::highlight()` metin düğümlerini bölmeden harf rengi
  uygulamak için uygun aday; ancak eski tarayıcılarda destek kontrolü gerekir.

## Kaynak denetimi

İncelenen kaynak: [quran-ws/quran-tajweed](https://github.com/quran-ws/quran-tajweed),
commit `4fec00b726d32163fba72b41c2f4cfdd025fe645`, corpus `0.4.2`.
İşaretlemeler Hafs rivayeti için 6.236 âyeti kapsıyor. Korpus ve annotation
verisi [CC BY 4.0](https://quran.ws/docs/reference/licensing/) lisanslı;
uygulamada kaynak bilgisi gösterilmesi gerekir. Metin ve annotation dosyalarının
bağlı olduğu içerik özeti hesaplanıp doğrulandı:
`b5d29736bb3ef49d9d331c4e60a59d83fe899b921e9e8dc35911bd4a18ce55f3`.

| 6.236 âyet içinde karşılaştırma | Medine | Türk mushafı |
| --- | ---: | ---: |
| Kaynakla karakter karakter aynı | 63 | 0 |
| Yalnız temel harf dizisi aynı; hareke, işaret, boşluk yok sayıldı | 3.846 | 862 |

Medine metnindeki 6.030 âyetin kelime sayısı kaynakla aynı olsa da aynı
konumdaki 77.429 kelimenin yalnızca 30.433'ü karakter karakter aynı.
Örneğin Fâtiha 1:1'de mevcut metin `بِسْمِ`, kaynaktaki ise `بِسۡمِ` yazıyor.
Bu iki metin gözle benzer görünse bile karakter konumları farklı. Türk
mushafında ayrıca harf yazımı ve vakıf işaretleri daha fazla ayrışıyor.
Temel harf eşleşmesi **tecvid konumu doğrulaması değildir**.

Bu sayılar `node scripts/audit-tajweed-compat.mjs <edition.json>
<annotations.json>` komutuyla yeniden üretilebilir. Dosyalar yukarıdaki
committen `editions/uthmani-hafs.json` ve
`packages/annotations/uthmani-hafs.json` yollarından alınmalıdır. Denetim
betiği önce edition özetini doğrular; metin dosyalarını projeye eklemez.

## Karar ve güvenli devam yolu

Kaynağın karakter indekslerini mevcut metne doğrudan uygulamak yanlış harfleri
boyar. [Kaynağın kendi rehberi](https://quran.ws/docs/build/tajweed/) de
annotation konumlarının yalnızca kendi edition metni için geçerli olduğunu
özellikle belirtiyor. Mevcut Kur'an metnini edition metniyle değiştirmek bu
görevin açık şartını bozar. Bu nedenle renkleri, Hıfz ayarlarındaki aç/kapat
seçeneğini ve paletleri bu aşamada kullanıcıya açmadık.

Uygulanabilir yöntem: Medine ve Türk mushafı için ayrı ayrı, uzman tarafından
doğrulanmış **mevcut metne özgü** konum eşlemesi elde etmek. Her âyette kaynak
ve hedef metin karakter dizilerini doğrulayan bir üretim kapısı kurulmalı;
belirsiz âyetler boyanmamalı. Ardından Fâtiha ve Bakara 1–5 üzerinde
`CSS.highlights` prototipiyle font, satır ölçüsü ve aktif kelime vurgusu
karşılaştırılmalı. Tam Kur'an denetimi ve mobil/çevrimdışı testler geçmeden
özellik açılmamalı.

Quran Foundation `text_uthmani_tajweed` kaynağı da değerlendirildi; mevcut
Medine yazımına daha yakın olabilir. Ancak [güncel geliştirici şartları](https://api-docs.quran.com/legal/developer-terms/)
normal API yanıtlarının bir haftadan uzun saklanmasını ve düzenli API
yanıtlarından çevrimdışı paket hazırlanmasını kısıtlıyor. Uygun Content Sync
erişimi, sürekli eşitleme ve metin eşleşmesi ayrıca doğrulanmadan bu veri
uygulamaya gömülmemeli.

Bu dalın sonucu: güvenli bir kaynak/eşleme kararı için somut ölçüm var; henüz
tecvid özelliği yok. Canlıya geçiş için ayrı ürün testi ve yayın kararı gerekir.
