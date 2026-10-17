(() => {
  // assets/dua-recordings.json
  var dua_recordings_default = [
    {
      id: "subhaneke",
      path: "/assets/dua-audio/subhaneke.mp3",
      source: "https://namaz.diyanet.gov.tr/namaz/assets/audio/dualar/hanefi/3_SUBHANEKE.mp3",
      sha256: "64c76f36d86811ed9494a383f46af9af6cce06f8fb8020a9ba114aad186aebf0",
      bytes: 554364
    },
    {
      id: "tahiyyat",
      path: "/assets/dua-audio/tahiyyat.mp3",
      source: "https://namaz.diyanet.gov.tr/namaz/assets/audio/dualar/hanefi/7_HANEFI_ETTEHIYATU.mp3",
      sha256: "57566de437b059577f257eaf7a982ba6f3ab0ceb99db198f4fc78a6c539bba30",
      bytes: 1318572
    },
    {
      id: "salli",
      path: "/assets/dua-audio/salli.mp3",
      source: "https://namaz.diyanet.gov.tr/namaz/assets/audio/dualar/hanefi/8_ALLAHUMMESALLI.mp3",
      sha256: "a4f07c49f208be6ceb523ff495704f7d9be6e14366797c607f3e9a4dd5aac2eb",
      bytes: 796572
    },
    {
      id: "barik",
      path: "/assets/dua-audio/barik.mp3",
      source: "https://namaz.diyanet.gov.tr/namaz/assets/audio/dualar/hanefi/9_ALLAHUMMEBARIK.mp3",
      sha256: "7fc098ccc6e3a5ad641b138c9193cf77024b0fd41d4409b4e7ba4ecc942d1bec",
      bytes: 804924
    },
    {
      id: "kunut",
      path: "/assets/dua-audio/kunut.mp3",
      source: "https://namaz.diyanet.gov.tr/namaz/assets/audio/dualar/hanefi/6_KUNUT_DUALARI.mp3",
      sha256: "e46311b60ae8f42c62366a95c9c44c0cd95c2cbc513892070054286e418a73b1",
      bytes: 2012832
    },
    {
      id: "rabbena",
      path: "/assets/dua-audio/rabbena.mp3",
      source: "https://namaz.diyanet.gov.tr/namaz/assets/audio/dualar/hanefi/10_RABBENA_DUALARI.mp3",
      sha256: "c27698a556be1cc6dafcc4637bc28b8256274a2c011f2e98d2c5dae2324c80a1",
      bytes: 879048
    },
    {
      id: "ezan",
      path: "/assets/dua-audio/ezan.mp3",
      source: "https://namaz.diyanet.gov.tr/namaz/assets/audio/dualar/hanefi/EZAN_DUASI.mp3",
      sha256: "31d2f0ab5369249904f6ec918b236735bceae960c987b469d43d36ac3090cd2d",
      bytes: 1145268
    },
    {
      id: "istihare-chapter",
      path: "/assets/dua-audio/istihare-chapter.mp3",
      source: "https://d1.islamhouse.com/data/ar/ih_sounds/chain_01/Hisn_Almuslim/Hisn_Almuslim_AlShwehi/ar_028_Hisn_Almuslim_Alshwehi.mp3",
      sourcePage: "https://islamhouse.com/ar/audios/2799103/",
      bytes: 1612689,
      sha256: "1be9a28155054bdc28df1d74534bd27fb96ede28aa42a110e016f6c8b5ef7a3a",
      kind: "complete-audiobook-chapter",
      reader: "S\xFCleyman b. Muhammed e\u015F-\u015Euveyh\xEE \xB7 M\xFCsl\xFCman\u0131n Kalesi",
      sourceName: "IslamHouse",
      permissionUrl: "https://d1.islamhouse.com/html/faq.htm",
      mime: "audio/mpeg"
    },
    {
      id: "yemek-chapter",
      path: "/assets/dua-audio/yemek-chapter.mp3",
      source: "https://d1.islamhouse.com/data/ar/ih_sounds/chain_01/Hisn_Almuslim/Hisn_Almuslim_AlShwehi/ar_071_Hisn_Almuslim_Alshwehi.mp3",
      sourcePage: "https://islamhouse.com/ar/audios/2799103/",
      bytes: 491736,
      sha256: "87ab07afaabd79178945db1fe7f5cf5b7241e84d84934579c39c88feedb0299c",
      kind: "complete-audiobook-chapter",
      reader: "S\xFCleyman b. Muhammed e\u015F-\u015Euveyh\xEE \xB7 M\xFCsl\xFCman\u0131n Kalesi",
      sourceName: "IslamHouse",
      permissionUrl: "https://d1.islamhouse.com/html/faq.htm",
      mime: "audio/mpeg"
    },
    {
      id: "istigfar-adult",
      path: "/assets/dua-audio/istigfar-adult.mp3",
      source: "https://d1.islamhouse.com/data/ar/ih_sounds/chain_01/Hisn_Almuslim/Hisn_Almuslim_AlShwehi/ar_029_Hisn_Almuslim_Alshwehi.mp3",
      sourcePage: "https://islamhouse.com/ar/audios/2799103/",
      bytes: 448234,
      sha256: "5ffc96288162045bcfb53e72a868ddafde23652046c015d505d6dd84f3d6915c",
      kind: "verified-dua-excerpt",
      reader: "S\xFCleyman b. Muhammed e\u015F-\u015Euveyh\xEE \xB7 M\xFCsl\xFCman\u0131n Kalesi",
      sourceName: "IslamHouse",
      permissionUrl: "https://d1.islamhouse.com/html/faq.htm",
      mime: "audio/mpeg"
    },
    {
      id: "uyanma",
      path: "/assets/dua-audio/remaining-uyanma.mp3",
      source: "https://d1.islamhouse.com/data/ar/ih_sounds/chain_01/Hisn_Almuslim/Hisn_Almuslim_AlShwehi/ar_003_Hisn_Almuslim_Alshwehi.mp3",
      sourcePage: "https://islamhouse.com/ar/audios/2799103/",
      bytes: 112034,
      sha256: "bd9a76306a49f3049a9c94b9cf6c721d9257e97fa93b45e63a079f4143a125fe",
      kind: "complete-supplication-excerpt",
      reader: "S\xFCleyman b. Muhammed e\u015F-\u015Euveyh\xEE \xB7 M\xFCsl\xFCman\u0131n Kalesi",
      sourceName: "IslamHouse",
      permissionUrl: "https://d1.islamhouse.com/html/faq.htm",
      mime: "audio/mpeg"
    },
    {
      id: "uyku-alternatif",
      path: "/assets/dua-audio/remaining-uyku-alternatif.mp3",
      source: "https://d1.islamhouse.com/data/ar/ih_sounds/chain_01/Hisn_Almuslim/Hisn_Almuslim_AlShwehi/ar_030_Hisn_Almuslim_Alshwehi.mp3",
      sourcePage: "https://islamhouse.com/ar/audios/2799103/",
      bytes: 76065,
      sha256: "53599e66a3944fd84e0c4f0b242914d7be91384151de35c98fe3eb3c5514ef86",
      kind: "complete-supplication-excerpt",
      reader: "S\xFCleyman b. Muhammed e\u015F-\u015Euveyh\xEE \xB7 M\xFCsl\xFCman\u0131n Kalesi",
      sourceName: "IslamHouse",
      permissionUrl: "https://d1.islamhouse.com/html/faq.htm",
      mime: "audio/mpeg"
    },
    {
      id: "iftar-alternatif",
      path: "/assets/dua-audio/remaining-iftar-alternatif.mp3",
      source: "https://d1.islamhouse.com/data/ar/ih_sounds/chain_01/Hisn_Almuslim/Hisn_Almuslim_AlShwehi/ar_069_Hisn_Almuslim_Alshwehi.mp3",
      sourcePage: "https://islamhouse.com/ar/audios/2799103/",
      bytes: 377207,
      sha256: "0475f0e01e71604c99982c727c335d3a6efcae49b1593757770e427d4c9ba328",
      kind: "complete-audiobook-chapter",
      reader: "S\xFCleyman b. Muhammed e\u015F-\u015Euveyh\xEE \xB7 M\xFCsl\xFCman\u0131n Kalesi",
      sourceName: "IslamHouse",
      permissionUrl: "https://d1.islamhouse.com/html/faq.htm",
      mime: "audio/mpeg"
    },
    {
      id: "yolculuk-alternatif",
      path: "/assets/dua-audio/remaining-yolculuk-alternatif.mp3",
      source: "https://d1.islamhouse.com/data/ar/ih_sounds/chain_01/Hisn_Almuslim/Hisn_Almuslim_AlShwehi/ar_096_Hisn_Almuslim_Alshwehi.mp3",
      sourcePage: "https://islamhouse.com/ar/audios/2799103/",
      bytes: 643423,
      sha256: "cc0169e71788b2a6cbe61920a8afc3de454f0e32bc264e88e441d947212c1c9d",
      kind: "complete-audiobook-chapter",
      reader: "S\xFCleyman b. Muhammed e\u015F-\u015Euveyh\xEE \xB7 M\xFCsl\xFCman\u0131n Kalesi",
      sourceName: "IslamHouse",
      permissionUrl: "https://d1.islamhouse.com/html/faq.htm",
      mime: "audio/mpeg"
    },
    {
      id: "mishary-uyanma",
      prayerId: "uyanma",
      readerId: "mishary-alafasy",
      path: "/assets/dua-audio/mishary-uyanma.mp3",
      source: "https://d1.islamhouse.com/data/ar/ih_sounds/chain/ar_Mashari_Athkar/ar_Mashari_Azkar01.mp3",
      sourcePage: "https://islamhouse.com/ar/audios/171286/",
      bytes: 205911,
      sha256: "2ffd42ec69a6f5182ff973cad102bd7b260271b4a0e4c6f624ad68c167c7b14f",
      kind: "complete-supplication-excerpt",
      reader: "Mi\u015F\xE2r\xEE R\xE2\u015Fid el-Af\xE2s\xEE \xB7 G\xFCnl\xFCk zikirler",
      sourceName: "IslamHouse",
      permissionUrl: "https://d1.islamhouse.com/html/faq.htm",
      mime: "audio/mpeg"
    },
    {
      id: "mishary-uyku-alternatif",
      prayerId: "uyku-alternatif",
      readerId: "mishary-alafasy",
      path: "/assets/dua-audio/mishary-uyku-alternatif.mp3",
      source: "https://d1.islamhouse.com/data/ar/ih_sounds/chain/ar_Mashari_Athkar/ar_Mashari_Azkar06.mp3",
      sourcePage: "https://islamhouse.com/ar/audios/171291/",
      bytes: 98478,
      sha256: "89296f4b9d34eabf4e512fca085974e786b2e216d47ce59b19d62a11051d17a4",
      kind: "complete-supplication-excerpt",
      reader: "Mi\u015F\xE2r\xEE R\xE2\u015Fid el-Af\xE2s\xEE \xB7 G\xFCnl\xFCk zikirler",
      sourceName: "IslamHouse",
      permissionUrl: "https://d1.islamhouse.com/html/faq.htm",
      mime: "audio/mpeg"
    },
    {
      id: "mishary-istigfar-1419",
      prayerId: "istigfar",
      readerId: "mishary-alafasy",
      path: "/assets/dua-audio/mishary-istigfar.mp3",
      source: "https://d1.islamhouse.com/data/ar/ih_sounds/chain_01/Mishari_Raashid/Azkar_AlSba7_w_AlMsa/ar_1419_Azkar_AlSba7.mp3",
      sourcePage: "https://islamhouse.com/ar/audios/92368/",
      bytes: 576717,
      sha256: "8985f91950f6d8e7f8a690083cefcbfbe5ad996c6b3f130a9a03a7e41ee95021",
      kind: "verified-dua-excerpt",
      reader: "Mi\u015F\xE2r\xEE R\xE2\u015Fid el-Af\xE2s\xEE",
      sourceName: "IslamHouse \xB7 Mi\u015F\xE2r\xEE el-Af\xE2s\xEE \xB7 Sabah zikirleri, 1419",
      permissionUrl: "https://d1.islamhouse.com/html/faq.htm",
      mime: "audio/mpeg"
    }
  ];

  // src/dua-extra-catalog.mjs
  var istihareSource = "https://kurul.diyanet.gov.tr/tr/fetva/istihare-namazi-nasil-kilinir-istihare-nasil-yapilir/0193c42d-555c-727e-768e-8bd66d68104e";
  var book = "https://dijital.diyanet.gov.tr/File/Download?id=4061&path=4061_1.pdf";
  var dailySource = "https://hadislerleislam.diyanet.gov.tr/sayfa.php?CILT=1&SAYFA=180";
  var extraPrayers = [{
    id: "istihare",
    title: "\u0130stih\xE2re duas\u0131 ve nas\u0131l yap\u0131l\u0131r?",
    source: istihareSource,
    audioNoteTR: "Bu sesli kitap b\xF6l\xFCm\xFC ba\u015Fl\u0131k ve rivayet a\xE7\u0131klamalar\u0131yla birlikte istih\xE2re duas\u0131n\u0131 i\xE7erir. \u201C\xC2k\u0131beti emr\xEE\u201D ve \u201C\xE2cili emr\xEE ve \xE2cilih\xEE\u201D gibi nakil farkl\u0131l\u0131klar\u0131 da okunabilir. Yaln\u0131z dua b\xF6l\xFCm\xFCn\xFC \xE7al\u0131\u015Fmak i\xE7in dinleyerek ba\u015Flang\u0131\xE7 ve biti\u015Fi se\xE7ebilirsin.",
    audioNoteEN: "This audiobook chapter contains headings, narration notes and the istikhara supplication. It may read alternative reported wordings such as \u201Caqibati amri\u201D and \u201Cajili amri wa ajilihi\u201D. Listen and mark the beginning and end to practise the supplication alone.",
    ar: "\u0627\u0644\u0644\u064E\u0651\u0647\u064F\u0645\u064E\u0651 \u0625\u0650\u0646\u0650\u0651\u064A \u0623\u064E\u0633\u0652\u062A\u064E\u062E\u0650\u064A\u0631\u064F\u0643\u064E \u0628\u0650\u0639\u0650\u0644\u0652\u0645\u0650\u0643\u064E \u0648\u064E\u0623\u064E\u0633\u0652\u062A\u064E\u0642\u0652\u062F\u0650\u0631\u064F\u0643\u064E \u0628\u0650\u0642\u064F\u062F\u0652\u0631\u064E\u062A\u0650\u0643\u064E \u0648\u064E\u0623\u064E\u0633\u0652\u0623\u064E\u0644\u064F\u0643\u064E \u0645\u0650\u0646\u0652 \u0641\u064E\u0636\u0652\u0644\u0650\u0643\u064E \u0627\u0644\u0652\u0639\u064E\u0638\u0650\u064A\u0645\u0650\u060C \u0641\u064E\u0625\u0650\u0646\u064E\u0651\u0643\u064E \u062A\u064E\u0642\u0652\u062F\u0650\u0631\u064F \u0648\u064E\u0644\u064E\u0627 \u0623\u064E\u0642\u0652\u062F\u0650\u0631\u064F \u0648\u064E\u062A\u064E\u0639\u0652\u0644\u064E\u0645\u064F \u0648\u064E\u0644\u064E\u0627 \u0623\u064E\u0639\u0652\u0644\u064E\u0645\u064F \u0648\u064E\u0623\u064E\u0646\u0652\u062A\u064E \u0639\u064E\u0644\u064E\u0651\u0627\u0645\u064F \u0627\u0644\u0652\u063A\u064F\u064A\u064F\u0648\u0628\u0650. \u0627\u0644\u0644\u064E\u0651\u0647\u064F\u0645\u064E\u0651 \u0625\u0650\u0646\u0652 \u0643\u064F\u0646\u0652\u062A\u064E \u062A\u064E\u0639\u0652\u0644\u064E\u0645\u064F \u0623\u064E\u0646\u064E\u0651 \u0647\u064E\u0630\u064E\u0627 \u0627\u0644\u0652\u0623\u064E\u0645\u0652\u0631\u064E \u062E\u064E\u064A\u0652\u0631\u064C \u0644\u0650\u064A \u0641\u0650\u064A \u062F\u0650\u064A\u0646\u0650\u064A \u0648\u064E\u0645\u064E\u0639\u064E\u0627\u0634\u0650\u064A \u0648\u064E\u0639\u064E\u0627\u0642\u0650\u0628\u064E\u0629\u0650 \u0623\u064E\u0645\u0652\u0631\u0650\u064A \u0641\u064E\u0627\u0642\u0652\u062F\u064F\u0631\u0652\u0647\u064F \u0644\u0650\u064A \u0648\u064E\u064A\u064E\u0633\u0650\u0651\u0631\u0652\u0647\u064F \u0644\u0650\u064A\u060C \u062B\u064F\u0645\u064E\u0651 \u0628\u064E\u0627\u0631\u0650\u0643\u0652 \u0644\u0650\u064A \u0641\u0650\u064A\u0647\u0650. \u0648\u064E\u0625\u0650\u0646\u0652 \u0643\u064F\u0646\u0652\u062A\u064E \u062A\u064E\u0639\u0652\u0644\u064E\u0645\u064F \u0623\u064E\u0646\u064E\u0651 \u0647\u064E\u0630\u064E\u0627 \u0627\u0644\u0652\u0623\u064E\u0645\u0652\u0631\u064E \u0634\u064E\u0631\u064C\u0651 \u0644\u0650\u064A \u0641\u0650\u064A \u062F\u0650\u064A\u0646\u0650\u064A \u0648\u064E\u0645\u064E\u0639\u064E\u0627\u0634\u0650\u064A \u0648\u064E\u0639\u064E\u0627\u0642\u0650\u0628\u064E\u0629\u0650 \u0623\u064E\u0645\u0652\u0631\u0650\u064A \u0641\u064E\u0627\u0635\u0652\u0631\u0650\u0641\u0652\u0647\u064F \u0639\u064E\u0646\u0650\u0651\u064A \u0648\u064E\u0627\u0635\u0652\u0631\u0650\u0641\u0652\u0646\u0650\u064A \u0639\u064E\u0646\u0652\u0647\u064F \u0648\u064E\u0627\u0642\u0652\u062F\u064F\u0631\u0652 \u0644\u0650\u064A\u064E \u0627\u0644\u0652\u062E\u064E\u064A\u0652\u0631\u064E \u062D\u064E\u064A\u0652\u062B\u064F \u0643\u064E\u0627\u0646\u064E \u062B\u064F\u0645\u064E\u0651 \u0623\u064E\u0631\u0652\u0636\u0650\u0646\u0650\u064A.",
    ok: "All\xE2h\xFCmme inn\xEE esteh\xEEr\xFCke bi-ilmike ve estakdir\xFCke bi-kudretike ve es\u2019el\xFCke min fadlikel-az\xEEm. Fe-inneke takdiru ve l\xE2 akdiru ve ta\u2018lem\xFC ve l\xE2 a\u2018lem\xFC ve ente all\xE2m\xFCl-guy\xFBb. All\xE2h\xFCmme in k\xFCnte ta\u2018lem\xFC enne h\xE2zel-emra hayrun l\xEE f\xEE d\xEEn\xEE ve me\xE2\u015F\xEE ve \xE2k\u0131beti emr\xEE fakd\xFCrh\xFC l\xEE ve yessirh\xFC l\xEE, s\xFCmme b\xE2rik l\xEE f\xEEh. Ve in k\xFCnte ta\u2018lem\xFC enne h\xE2zel-emra \u015Ferrun l\xEE f\xEE d\xEEn\xEE ve me\xE2\u015F\xEE ve \xE2k\u0131beti emr\xEE fasrifh\xFC ann\xEE vasrifn\xEE anh\xFC vakd\xFCr liyel-hayra hays\xFC k\xE2ne s\xFCmme erd\u0131n\xEE.",
    meal: { tr: "Allah\u2019\u0131m! Bilginle senden hay\u0131rl\u0131s\u0131n\u0131 se\xE7meni, kudretinle bana g\xFC\xE7 vermeni ve b\xFCy\xFCk l\xFCtfundan ihsan etmeni dilerim. Senin g\xFCc\xFCn yeter, benim yetmez; sen bilirsin, ben bilmem. Gizliyi en iyi bilen sensin. Allah\u2019\u0131m! Bu i\u015F dinim, ya\u015Fay\u0131\u015F\u0131m ve sonucum bak\u0131m\u0131ndan benim i\xE7in hay\u0131rl\u0131ysa onu bana nasip et, kolayla\u015Ft\u0131r ve bereketli k\u0131l. K\xF6t\xFCyse onu benden, beni ondan uzakla\u015Ft\u0131r. Hay\u0131r nerede olursa olsun onu bana nasip et ve beni raz\u0131 k\u0131l.", en: "O Allah, through Your knowledge I seek what is good, through Your power I seek strength, and I ask of Your great bounty. You have power and I do not; You know and I do not. You know all that is hidden. If this matter is good for my religion, livelihood and outcome, decree it for me, make it easy and bless it. If it is bad for me, turn it away from me and me away from it. Decree goodness for me wherever it is, then make me content." },
    guideTitle: { tr: "\u0130stih\xE2re nas\u0131l yap\u0131l\u0131r?", en: "How to make istikhara" },
    guide: { tr: [
      "\u0130stih\xE2re, karar\u0131n hay\u0131rl\u0131 olmas\u0131 i\xE7in Allah\u2019a y\xF6nelmektir. \xD6nce konuyu ara\u015Ft\u0131r ve g\xFCvendi\u011Fin, bilgili ki\u015Filerle isti\u015Fare et. Din\xEE h\xFCkm\xFC a\xE7\u0131k olan farz veya haram bir \u015Fey i\xE7in karar arac\u0131 olarak kullan\u0131lmaz.",
      "Abdest al\u0131p farz namazlar\u0131n d\u0131\u015F\u0131nda iki rek\xE2t nafile namaza niyet et. Diyanet\u2019in tarifinde ilk rek\xE2tta F\xE2tiha\u2019dan sonra K\xE2fir\xFBn, ikinci rek\xE2tta F\xE2tiha\u2019dan sonra \u0130hl\xE2s okunur; ard\u0131ndan normal bi\xE7imde namaz tamamlan\u0131r.",
      "Namazdan sonra bu ekrandaki duay\u0131 oku. \u201CH\xE2zel-emra / bu i\u015F\u201D derken karar verece\u011Fin konuyu d\xFC\u015F\xFCn; Allah\u2019tan hay\u0131rl\u0131 olan\u0131 kolayla\u015Ft\u0131rmas\u0131n\u0131, zararl\u0131 olandan uzakla\u015Ft\u0131rmas\u0131n\u0131 iste.",
      "\u0130stih\xE2re i\xE7in yatmadan \xF6nce dua edebilirsin; r\xFCya g\xF6rmek \u015Fart de\u011Fildir. Beyaz/ye\u015Fil iyi, siyah/k\u0131rm\u0131z\u0131 k\xF6t\xFC gibi bir renk tablosuyla karar verme; Diyanet bu t\xFCr r\xFCya yorumunu dayanak olarak g\xF6stermez.",
      "Namaz k\u0131lam\u0131yorsan yaln\u0131z istih\xE2re duas\u0131n\u0131 okuyabilirsin. Karar verirken ara\u015Ft\u0131rmay\u0131 ve isti\u015Fareyi s\xFCrd\xFCr; istih\xE2re gelece\u011Fi \xF6\u011Frenme veya kesin sonu\xE7 garantisi de\u011Fildir."
    ], en: [
      "Istikhara asks Allah for a good outcome. First examine the matter and consult trustworthy, knowledgeable people. It is not used to reconsider what is already clearly obligatory or forbidden.",
      "Make ablution and pray two voluntary rak\u2018ahs apart from an obligatory prayer. The Diyanet guide specifies al-Fatihah followed by al-Kafirun in the first rak\u2018ah and al-Fatihah followed by al-Ikhlas in the second. Complete the prayer normally.",
      "After the prayer, recite the supplication below. At \u201Cthis matter\u201D, have the decision in mind and ask Allah to facilitate what is good and turn you away from what is harmful.",
      "You may pray before bed; seeing a dream is not required. Do not base the decision on a colour code for dreams. Diyanet does not treat such interpretations as evidence.",
      "If you cannot perform the prayer, you may recite the supplication alone. Continue research and consultation; istikhara is not fortune-telling or a guarantee of a particular result."
    ] }
  }, {
    id: "yemek-uzun",
    title: "Yemek sonras\u0131 duas\u0131 \xB7 uzun",
    source: book + "#page=112",
    note: "traditional_prayer",
    ar: "\u0623\u064E\u0639\u064F\u0648\u0630\u064F \u0628\u0650\u0627\u0644\u0644\u0651\u0670\u0647\u0650 \u0645\u0650\u0646\u064E \u0627\u0644\u0634\u064E\u0651\u064A\u0652\u0637\u064E\u0627\u0646\u0650 \u0627\u0644\u0631\u064E\u0651\u062C\u0650\u064A\u0645\u0650. \u0628\u0650\u0633\u0652\u0645\u0650 \u0627\u0644\u0644\u0651\u0670\u0647\u0650 \u0627\u0644\u0631\u064E\u0651\u062D\u0652\u0645\u0670\u0646\u0650 \u0627\u0644\u0631\u064E\u0651\u062D\u0650\u064A\u0645\u0650. \u0627\u0644\u0652\u062D\u064E\u0645\u0652\u062F\u064F \u0644\u0650\u0644\u0651\u0670\u0647\u0650 \u0627\u0644\u064E\u0651\u0630\u0650\u064A \u0623\u064E\u0637\u0652\u0639\u064E\u0645\u064E\u0646\u064E\u0627 \u0648\u064E\u0633\u064E\u0642\u064E\u0627\u0646\u064E\u0627 \u0648\u064E\u062C\u064E\u0639\u064E\u0644\u064E\u0646\u064E\u0627 \u0645\u0650\u0646\u064E \u0627\u0644\u0652\u0645\u064F\u0633\u0652\u0644\u0650\u0645\u0650\u064A\u0646\u064E. \u0648\u064E\u0631\u064E\u062D\u0652\u0645\u064E\u0629\u064F \u0627\u0644\u0644\u0651\u0670\u0647\u0650 \u0648\u064E\u0628\u064E\u0631\u064E\u0643\u064E\u0627\u062A\u064F\u0647\u064F \u0639\u064E\u0644\u064E\u0649 \u0635\u064E\u0627\u062D\u0650\u0628\u0650 \u0627\u0644\u0637\u064E\u0651\u0639\u064E\u0627\u0645\u0650 \u0648\u064E\u0627\u0644\u0652\u0622\u0643\u0650\u0644\u0650\u064A\u0646\u064E. \u0627\u0644\u0644\u0651\u0670\u0647\u064F\u0645\u064E\u0651 \u0623\u064E\u0639\u0652\u0637\u0650 \u0644\u064E\u0646\u064E\u0627 \u0631\u0650\u0632\u0652\u0642\u064B\u0627 \u0648\u064E\u0627\u0633\u0650\u0639\u064B\u0627 \u0648\u064E\u062D\u064E\u0644\u064E\u0627\u0644\u064B\u0627 \u0637\u064E\u064A\u0650\u0651\u0628\u064B\u0627. \u0648\u064E\u0628\u064E\u0627\u0631\u0650\u0643\u0652 \u0644\u064E\u0646\u064E\u0627 \u0641\u0650\u064A\u0645\u064E\u0627 \u0631\u064E\u0632\u064E\u0642\u0652\u062A\u064E\u0646\u064E\u0627\u060C \u0648\u064E\u0627\u0634\u0652\u0641\u0650 \u0645\u064E\u0631\u0652\u0636\u064E\u0627\u0646\u064E\u0627 \u0648\u064E\u0627\u0631\u0652\u062D\u064E\u0645\u0652 \u0645\u064E\u0648\u0652\u062A\u064E\u0627\u0646\u064E\u0627 \u0623\u064E\u0646\u0652\u062A\u064E \u0645\u064E\u0648\u0652\u0644\u064E\u0627\u0646\u064E\u0627. \u0627\u0644\u0644\u0651\u0670\u0647\u064F\u0645\u064E\u0651 \u0625\u0650\u0646\u064E\u0651\u0627 \u0646\u064E\u0633\u0652\u0623\u064E\u0644\u064F\u0643\u064E \u0627\u0644\u0652\u0639\u064E\u0641\u0652\u0648\u064E \u0648\u064E\u0627\u0644\u0652\u0639\u064E\u0627\u0641\u0650\u064A\u064E\u0629\u064E \u0641\u0650\u064A \u0627\u0644\u062F\u064F\u0651\u0646\u0652\u064A\u064E\u0627 \u0648\u064E\u0627\u0644\u0652\u0622\u062E\u0650\u0631\u064E\u0629\u0650. \u0631\u064E\u0628\u0650\u0651 \u0627\u062C\u0652\u0639\u064E\u0644\u0652\u0646\u0650\u064A \u0645\u064F\u0642\u0650\u064A\u0645\u064E \u0627\u0644\u0635\u064E\u0651\u0644\u064E\u0627\u0629\u0650 \u0648\u064E\u0645\u0650\u0646\u0652 \u0630\u064F\u0631\u0650\u0651\u064A\u064E\u0651\u062A\u0650\u064A \u0631\u064E\u0628\u064E\u0651\u0646\u064E\u0627 \u0648\u064E\u062A\u064E\u0642\u064E\u0628\u064E\u0651\u0644\u0652 \u062F\u064F\u0639\u064E\u0627\u0621\u0650. \u0631\u064E\u0628\u064E\u0651\u0646\u064E\u0627 \u0622\u062A\u0650\u0646\u064E\u0627 \u0641\u0650\u064A \u0627\u0644\u062F\u064F\u0651\u0646\u0652\u064A\u064E\u0627 \u062D\u064E\u0633\u064E\u0646\u064E\u0629\u064B \u0648\u064E\u0641\u0650\u064A \u0627\u0644\u0652\u0622\u062E\u0650\u0631\u064E\u0629\u0650 \u062D\u064E\u0633\u064E\u0646\u064E\u0629\u064B. \u0631\u064E\u0628\u064E\u0651\u0646\u064E\u0627 \u0627\u063A\u0652\u0641\u0650\u0631\u0652 \u0644\u0650\u064A \u0648\u064E\u0644\u0650\u0648\u064E\u0627\u0644\u0650\u062F\u064E\u064A\u064E\u0651 \u0648\u064E\u0644\u0650\u0644\u0652\u0645\u064F\u0624\u0652\u0645\u0650\u0646\u0650\u064A\u0646\u064E \u064A\u064E\u0648\u0652\u0645\u064E \u064A\u064E\u0642\u064F\u0648\u0645\u064F \u0627\u0644\u0652\u062D\u0650\u0633\u064E\u0627\u0628\u064F. \u0627\u0644\u0644\u0651\u0670\u0647\u064F\u0645\u064E\u0651 \u0632\u0650\u062F\u0652 \u0648\u064E\u0644\u064E\u0627 \u062A\u064E\u0646\u0652\u0642\u064F\u0635\u0652 \u0628\u0650\u062D\u064F\u0631\u0652\u0645\u064E\u0629\u0650 \u0633\u064E\u064A\u0650\u0651\u062F\u0650 \u0627\u0644\u0652\u0645\u064F\u0631\u0652\u0633\u064E\u0644\u0650\u064A\u0646\u064E. \u0648\u064E\u0627\u0644\u0652\u062D\u064E\u0645\u0652\u062F\u064F \u0644\u0650\u0644\u0651\u0670\u0647\u0650 \u0631\u064E\u0628\u0650\u0651 \u0627\u0644\u0652\u0639\u064E\u0627\u0644\u064E\u0645\u0650\u064A\u0646\u064E.",
    ok: "E\xFBz\xFC bill\xE2hi mine\u015F-\u015Feyt\xE2nir-rac\xEEm. Bismill\xE2hir-rahm\xE2nir-rah\xEEm. Elhamd\xFC lill\xE2hillez\xEE et\u2018amen\xE2 ve sek\xE2n\xE2 ve cealen\xE2 minel-m\xFCslim\xEEn. Ve rahmetull\xE2hi ve berek\xE2t\xFCh\xFB al\xE2 s\xE2hibit-ta\xE2mi vel-\xE2kil\xEEn. All\xE2h\xFCmme a\u2018t\u0131 len\xE2 r\u0131zkan v\xE2sian ve hal\xE2len tayyib\xE2. Ve b\xE2rik len\xE2 f\xEEm\xE2 razakten\xE2 ve\u015Ffi merd\xE2n\xE2 verham mevt\xE2n\xE2 ente mevl\xE2n\xE2. All\xE2h\xFCmme inn\xE2 nes\u2019el\xFCkel-afve vel-\xE2fiyete fid-d\xFCny\xE2 vel-\xE2hirah. Rabbic\u2018aln\xEE muk\xEEmes-sal\xE2ti ve min z\xFCrriyyet\xEE Rabben\xE2 ve tekabbel d\xFC\xE2. Rabben\xE2 \xE2tin\xE2 fid-d\xFCny\xE2 haseneten ve fil-\xE2hirati haseneh. Rabbena\u011Ffir l\xEE ve li-v\xE2lideyye ve lil-m\xFC\u2019min\xEEne yevme yek\xFBm\xFCl-his\xE2b. All\xE2h\xFCmme zid ve l\xE2 tenkus bi-hurmeti seyyidil-m\xFCrsel\xEEn. Velhamd\xFC lill\xE2hi Rabbil-\xE2lem\xEEn.",
    meal: { tr: "Kovulmu\u015F \u015Feytandan Allah\u2019a s\u0131\u011F\u0131n\u0131r\u0131m. Rahman ve Rahim Allah\u2019\u0131n ad\u0131yla. Bizi yediren, i\xE7iren ve M\xFCsl\xFCmanlardan k\u0131lan Allah\u2019a hamdolsun. Allah\u2019\u0131n rahmeti ve bereketi yeme\u011Fi sunana ve yiyenlere olsun. Allah\u2019\u0131m! Bize bol, helal ve temiz r\u0131z\u0131k ver; verdiklerini bereketlendir. Hastalar\u0131m\u0131za \u015Fifa, \xF6l\xFClerimize rahmet eyle; sen bizim Mevl\xE2m\u0131zs\u0131n. D\xFCnyada ve ahirette ba\u011F\u0131\u015Flanma ve esenlik dileriz. Rabbim! Beni ve soyumu namaz\u0131 s\xFCrd\xFCrenlerden eyle, duam\u0131z\u0131 kabul et. Bize d\xFCnyada ve ahirette iyilik ver. Hesap g\xFCn\xFCnde beni, ana babam\u0131 ve m\xFCminleri ba\u011F\u0131\u015Fla. Allah\u2019\u0131m! Peygamberlerin efendisinin h\xFCrmetine nimetini art\u0131r, eksiltme. Hamd \xE2lemlerin Rabbi Allah\u2019ad\u0131r.", en: "I seek refuge in Allah from Satan. In the name of Allah, the Most Merciful. Praise belongs to Allah, who fed us, gave us drink and made us Muslims. May His mercy and blessing be upon the host and those eating. O Allah, grant us abundant, lawful, wholesome provision and bless what You give. Heal our sick and have mercy on our deceased; You are our Protector. We ask for pardon and well-being in this life and the next. Make me and my descendants steadfast in prayer and accept our supplication. Grant us good in this life and the next. Forgive me, my parents and the believers on the Day of Reckoning. Increase Your blessings and do not diminish them, in honour of the master of messengers. Praise belongs to Allah, Lord of all worlds." },
    guideTitle: { tr: "Bu metin hakk\u0131nda", en: "About this text" },
    guide: { tr: ["Diyanet rehberinin 112\u2013113. sayfalar\u0131ndaki toplu yemek duas\u0131 \xF6rne\u011Fidir. K\u0131sa yemek \u015F\xFCkr\xFC duas\u0131 da ayr\u0131ca bulunur; her yemekte bu uzun metnin tamam\u0131n\u0131 okumak \u015Fart de\u011Fildir. Rehber bu duan\u0131n ard\u0131ndan F\xE2tiha okunabilece\u011Fini belirtir."], en: ["This is the collective after-meal prayer example on pages 112\u2013113 of the Diyanet guide. The short thanksgiving is also available; reciting this entire long version at every meal is not a requirement. The guide follows this example with a direction to recite al-Fatihah."] }
  }, {
    id: "yemek-sonrasi-alternatif",
    title: "Yemek sonras\u0131 \xB7 iki \u015F\xFCk\xFCr duas\u0131",
    source: "https://islamhouse.com/ar/audios/2799103/",
    sourceName: "IslamHouse \xB7 M\xFCsl\xFCman\u0131n Kalesi",
    note: "audio_chapter",
    ar: "\u0627\u0644\u0652\u062D\u064E\u0645\u0652\u062F\u064F \u0644\u0650\u0644\u064E\u0651\u0647\u0650 \u0627\u0644\u064E\u0651\u0630\u0650\u064A \u0623\u064E\u0637\u0652\u0639\u064E\u0645\u064E\u0646\u0650\u064A \u0647\u064E\u0630\u064E\u0627 \u0648\u064E\u0631\u064E\u0632\u064E\u0642\u064E\u0646\u0650\u064A\u0647\u0650 \u0645\u0650\u0646\u0652 \u063A\u064E\u064A\u0652\u0631\u0650 \u062D\u064E\u0648\u0652\u0644\u064D \u0645\u0650\u0646\u0650\u0651\u064A \u0648\u064E\u0644\u064E\u0627 \u0642\u064F\u0648\u064E\u0651\u0629\u064D.\n\n\u0627\u0644\u0652\u062D\u064E\u0645\u0652\u062F\u064F \u0644\u0650\u0644\u064E\u0651\u0647\u0650 \u062D\u064E\u0645\u0652\u062F\u064B\u0627 \u0643\u064E\u062B\u0650\u064A\u0631\u064B\u0627 \u0637\u064E\u064A\u0650\u0651\u0628\u064B\u0627 \u0645\u064F\u0628\u064E\u0627\u0631\u064E\u0643\u064B\u0627 \u0641\u0650\u064A\u0647\u0650\u060C \u063A\u064E\u064A\u0652\u0631\u064E \u0645\u064E\u0643\u0652\u0641\u0650\u064A\u064D\u0651 \u0648\u064E\u0644\u064E\u0627 \u0645\u064F\u0648\u064E\u062F\u064E\u0651\u0639\u064D \u0648\u064E\u0644\u064E\u0627 \u0645\u064F\u0633\u0652\u062A\u064E\u063A\u0652\u0646\u064B\u0649 \u0639\u064E\u0646\u0652\u0647\u064F \u0631\u064E\u0628\u064E\u0651\u0646\u064E\u0627.",
    ok: "Elhamd\xFC lill\xE2hillez\xEE et\u2018amen\xEE h\xE2z\xE2 ve razakan\xEEhi min gayri havlin minn\xEE ve l\xE2 kuvveh.\n\nElhamd\xFC lill\xE2hi hamden kes\xEEran tayyiben m\xFCb\xE2reken f\xEEhi, gayra mekfiyyin ve l\xE2 m\xFCveddein ve l\xE2 m\xFCsta\u011Fnen anh\xFC Rabben\xE2.",
    meal: { tr: "Bana kendi g\xFC\xE7 ve kuvvetim olmaks\u0131z\u0131n bu yeme\u011Fi yediren ve onu bana r\u0131z\u0131k veren Allah\u2019a hamdolsun.\n\nAllah\u2019a \xE7ok\xE7a, temiz ve bereketli hamdolsun. Rabbimiz kimseye muhta\xE7 de\u011Fildir; O\u2019na y\xF6neli\u015F ve \u015F\xFCk\xFCr b\u0131rak\u0131lmaz, O\u2019ndan vazge\xE7ilmez.", en: "Praise belongs to Allah, who fed me this and provided it for me without any might or strength of my own.\n\nAbundant, wholesome, blessed praise belongs to Allah. Our Lord needs no one to sustain Him; He is not forsaken, and we can never do without Him." },
    audioNoteTR: "S\xFCleyman e\u015F-\u015Euveyhi\u2019nin seslendirdi\u011Fi M\xFCsl\xFCman\u0131n Kalesi b\xF6l\xFCm\xFCd\xFCr. Kay\u0131tta b\xF6l\xFCm ba\u015Fl\u0131\u011F\u0131 ve yemek sonras\u0131 okunabilecek iki alternatif dua yer al\u0131r; bu, yukar\u0131daki uzun toplu yemek duas\u0131n\u0131n seslendirmesi de\u011Fildir. Her bir duay\u0131 ayr\u0131 \xE7al\u0131\u015Fmak i\xE7in dinleyerek i\u015Faretleyebilirsin.",
    audioNoteEN: "This Fortress of the Muslim chapter is read by Sulayman al-Shuwayhi. It includes the chapter heading and two alternative after-meal supplications; it is not a recording of the separate long collective meal prayer. Listen and mark each supplication to practise it separately.",
    guideTitle: { tr: "\u0130ki alternatif \u015F\xFCk\xFCr duas\u0131", en: "Two alternative prayers of thanks" },
    guide: { tr: ["Birinci metin, yeme\u011Fin ve r\u0131zk\u0131n Allah\u2019tan geldi\u011Fini hat\u0131rlatan k\u0131sa \u015F\xFCk\xFCr duas\u0131d\u0131r (Tirmiz\xEE, 3458; Eb\xFB D\xE2v\xFBd, 4023). \u0130kinci metin, sofra kald\u0131r\u0131l\u0131rken okunan hamd duas\u0131d\u0131r (Buh\xE2r\xEE, 5458).", "Bunlar iki ayr\u0131 rivayettir; tek ve zorunlu bir uzun dua gibi de\u011Ferlendirilmez. Sesli kitap ikisini ve ba\u015Fl\u0131\u011F\u0131 birlikte okur. B\xF6lerek \xE7al\u0131\u015Fma i\xE7in ses \xFCzerinde her duan\u0131n s\u0131n\u0131r\u0131n\u0131 ayr\u0131 se\xE7."], en: ["The first text gives thanks for food and provision from Allah (al-Tirmidhi, Da\u2018awat; Abu Dawud, Libas). The second is praise recited when the meal is finished (al-Bukhari, At\u2018imah).", "These are two separate reported supplications, not one compulsory long formula. The audiobook reads both with a heading. Mark each prayer separately in the recording for phrase practice."] },
    guideSource: "https://d1.islamhouse.com/data/ar/ih_books/single/ar_hisn_almuslim.pdf"
  }, {
    id: "uyku",
    title: "Uyumadan \xF6nce",
    source: dailySource,
    ar: "\u0627\u0644\u0644\u064E\u0651\u0647\u064F\u0645\u064E\u0651 \u0628\u0650\u0627\u0633\u0652\u0645\u0650\u0643\u064E \u0623\u064E\u062D\u0652\u064A\u064E\u0627 \u0648\u064E\u0628\u0650\u0627\u0633\u0652\u0645\u0650\u0643\u064E \u0623\u064E\u0645\u064F\u0648\u062A\u064F.",
    ok: "All\xE2h\xFCmme bismike ahy\xE2 ve bismike em\xFBt.",
    meal: { tr: "Allah\u2019\u0131m! Senin ad\u0131nla ya\u015Far, senin ad\u0131nla \xF6l\xFCr\xFCm.", en: "O Allah, in Your name I live and in Your name I die." }
  }, {
    id: "uyanma",
    title: "Uyan\u0131nca",
    source: "https://hadislerleislam.diyanet.gov.tr/sayfa.php?CILT=6&SAYFA=519",
    ar: "\u0627\u0644\u0652\u062D\u064E\u0645\u0652\u062F\u064F \u0644\u0650\u0644\u064E\u0651\u0647\u0650 \u0627\u0644\u064E\u0651\u0630\u0650\u064A \u0623\u064E\u062D\u0652\u064A\u064E\u0627\u0646\u064E\u0627 \u0628\u064E\u0639\u0652\u062F\u064E \u0645\u064E\u0627 \u0623\u064E\u0645\u064E\u0627\u062A\u064E\u0646\u064E\u0627 \u0648\u064E\u0625\u0650\u0644\u064E\u064A\u0652\u0647\u0650 \u0627\u0644\u0646\u064F\u0651\u0634\u064F\u0648\u0631\u064F.",
    ok: "Elhamd\xFC lill\xE2hillez\xEE ahy\xE2n\xE2 ba\u2018de m\xE2 em\xE2ten\xE2 ve ileyhin-n\xFC\u015F\xFBr.",
    meal: { tr: "Bizi \xF6l\xFCm gibi uykudan sonra yeniden hayata kavu\u015Fturan Allah\u2019a hamdolsun. Son d\xF6n\xFC\u015F\xFCm\xFCz O\u2019nad\u0131r.", en: "Praise belongs to Allah, who brought us back to life after sleep, and to Him is the resurrection." }
  }, {
    id: "yolculuk",
    title: "Yolculuk \xB7 binite binerken",
    source: "https://yayin.diyanet.gov.tr/File/Download?id=3737&path=3737_1.pdf#page=54",
    ar: "\u0633\u064F\u0628\u0652\u062D\u064E\u0627\u0646\u064E \u0627\u0644\u064E\u0651\u0630\u0650\u064A \u0633\u064E\u062E\u064E\u0651\u0631\u064E \u0644\u064E\u0646\u064E\u0627 \u0647\u064E\u0630\u064E\u0627 \u0648\u064E\u0645\u064E\u0627 \u0643\u064F\u0646\u064E\u0651\u0627 \u0644\u064E\u0647\u064F \u0645\u064F\u0642\u0652\u0631\u0650\u0646\u0650\u064A\u0646\u064E. \u0648\u064E\u0625\u0650\u0646\u064E\u0651\u0627 \u0625\u0650\u0644\u064E\u0649 \u0631\u064E\u0628\u0650\u0651\u0646\u064E\u0627 \u0644\u064E\u0645\u064F\u0646\u0652\u0642\u064E\u0644\u0650\u0628\u064F\u0648\u0646\u064E.",
    ok: "S\xFCbh\xE2nellez\xEE sehhara len\xE2 h\xE2z\xE2 ve m\xE2 k\xFCnn\xE2 leh\xFB mukrin\xEEn. Ve inn\xE2 il\xE2 Rabbin\xE2 le-m\xFCnkalib\xFBn.",
    meal: { tr: "Bunu hizmetimize veren Allah\u2019\u0131 her eksiklikten uzak tutar\u0131z; yoksa bizim buna g\xFCc\xFCm\xFCz yetmezdi. Ku\u015Fkusuz Rabbimize d\xF6nece\u011Fiz.", en: "Glory be to the One who placed this at our service; we could not have mastered it ourselves. Surely we will return to our Lord." },
    guideTitle: { tr: "Okuma notu", en: "Recitation note" },
    guide: { tr: ["Zuhruf 43:13\u201314\u2019ten al\u0131nan k\u0131sa bini\u015F duas\u0131d\u0131r; yolculuk duas\u0131n\u0131n daha uzun rivayetleri de vard\u0131r. Diyanet\u2019in aktard\u0131\u011F\u0131 uygulamada \xF6nce \xFC\xE7 kez \u201CAllahu ekber\u201D denir."], en: ["This short prayer on mounting a vehicle uses Quran 43:13\u201314; longer travel supplications also exist. The practice reported by Diyanet precedes it with \u201CAllahu akbar\u201D three times."] }
  }, {
    id: "iftar",
    title: "\u0130ftar duas\u0131",
    source: "https://bingol.diyanet.gov.tr/karliova/sayfalar/contentdetail.aspx?ContentId=605&MenuCategory=Kurumsal",
    ar: "\u0627\u0644\u0644\u064E\u0651\u0647\u064F\u0645\u064E\u0651 \u0644\u064E\u0643\u064E \u0635\u064F\u0645\u0652\u062A\u064F \u0648\u064E\u0639\u064E\u0644\u064E\u0649 \u0631\u0650\u0632\u0652\u0642\u0650\u0643\u064E \u0623\u064E\u0641\u0652\u0637\u064E\u0631\u0652\u062A\u064F.",
    ok: "All\xE2h\xFCmme leke sumt\xFC ve al\xE2 r\u0131zk\u0131ke eftart\xFC.",
    meal: { tr: "Allah\u2019\u0131m! Senin i\xE7in oru\xE7 tuttum, senin verdi\u011Fin r\u0131z\u0131kla orucumu a\xE7t\u0131m.", en: "O Allah, for You I fasted, and with Your provision I broke my fast." }
  }, {
    id: "ilim",
    title: "\u0130lim duas\u0131",
    source: "https://dijital.diyanet.gov.tr/File/Download?id=480&path=480_1.pdf",
    quran: { surah: 20, ayah: 114 },
    ar: "\u0631\u064E\u0628\u0650\u0651 \u0632\u0650\u062F\u0652\u0646\u0650\u064A \u0639\u0650\u0644\u0652\u0645\u064B\u0627.",
    ok: "Rabbi zidn\xEE ilm\xE2.",
    meal: { tr: "Rabbim! \u0130lmimi art\u0131r.", en: "My Lord, increase me in knowledge." }
  }];

  // src/dua-recorded-alternatives.mjs
  var recordedAlternatives = [
    {
      "id": "uyku-alternatif",
      "title": "Uyumadan \xF6nce \xB7 alternatif okunu\u015F",
      "source": "https://islamhouse.com/ar/audios/2799103/",
      "ar": "\u0628\u0650\u0627\u0633\u0652\u0645\u0650\u0643\u064E \u0627\u0644\u0644\u064E\u0651\u0647\u064F\u0645\u064E\u0651 \u0623\u064E\u0645\u064F\u0648\u062A\u064F \u0648\u064E\u0623\u064E\u062D\u0652\u064A\u064E\u0627.",
      "ok": "Bismike All\xE2h\xFCmme em\xFBt\xFC ve ahy\xE2.",
      "meal": {
        "tr": "Allah\u2019\u0131m! Senin ad\u0131nla \xF6l\xFCr, senin ad\u0131nla ya\u015Far\u0131m.",
        "en": "In Your name, O Allah, I die and I live."
      },
      "audioNoteTR": "Kaynakta belirtilen uyku zikirleri kayd\u0131ndan tam dua b\xF6l\xFCm\xFCd\xFCr. \u201CAllah\xFCmme bismike ahy\xE2 ve bismike em\xFBt\u201D bi\xE7imindeki di\u011Fer rivayetle ayn\u0131 laf\u0131z de\u011Fildir; ayr\u0131 bir alternatif olarak g\xF6sterilir.",
      "audioNoteEN": "A complete supplication excerpt from the credited bedtime-remembrance recording. Its wording differs from the other bedtime variant and is shown separately.",
      "sourceName": "IslamHouse \xB7 M\xFCsl\xFCman\u0131n Kalesi",
      "note": "adult_prayer_excerpt",
      "guideSource": "https://islamhouse.com/ar/books/2522"
    },
    {
      "id": "iftar-alternatif",
      "title": "\u0130ftar \xB7 iki alternatif dua",
      "source": "https://islamhouse.com/ar/audios/2799103/",
      "ar": "\u0630\u064E\u0647\u064E\u0628\u064E \u0627\u0644\u0638\u064E\u0651\u0645\u064E\u0623\u064F \u0648\u064E\u0627\u0628\u0652\u062A\u064E\u0644\u064E\u0651\u062A\u0650 \u0627\u0644\u0652\u0639\u064F\u0631\u064F\u0648\u0642\u064F \u0648\u064E\u062B\u064E\u0628\u064E\u062A\u064E \u0627\u0644\u0652\u0623\u064E\u062C\u0652\u0631\u064F \u0625\u0650\u0646\u0652 \u0634\u064E\u0627\u0621\u064E \u0627\u0644\u0644\u064E\u0651\u0647\u064F.\n\n\u0627\u0644\u0644\u064E\u0651\u0647\u064F\u0645\u064E\u0651 \u0625\u0650\u0646\u0650\u0651\u064A \u0623\u064E\u0633\u0652\u0623\u064E\u0644\u064F\u0643\u064E \u0628\u0650\u0631\u064E\u062D\u0652\u0645\u064E\u062A\u0650\u0643\u064E \u0627\u0644\u064E\u0651\u062A\u0650\u064A \u0648\u064E\u0633\u0650\u0639\u064E\u062A\u0652 \u0643\u064F\u0644\u064E\u0651 \u0634\u064E\u064A\u0652\u0621\u064D \u0623\u064E\u0646\u0652 \u062A\u064E\u063A\u0652\u0641\u0650\u0631\u064E \u0644\u0650\u064A.",
      "ok": "Zehebez-zama\xFC vebtelletil-ur\xFBku ve sebetel-ecru in \u015F\xE2all\xE2h.\n\nAll\xE2h\xFCmme inn\xEE es\u2019el\xFCke bi-rahmetikellet\xEE vesiat k\xFClle \u015Fey\u2019in en ta\u011Ffira l\xEE.",
      "meal": {
        "tr": "Susuzluk gitti, damarlar suya kavu\u015Ftu; Allah dilerse ecir kesinle\u015Fti.\n\nAllah\u2019\u0131m! Her \u015Feyi ku\u015Fatan rahmetinle beni ba\u011F\u0131\u015Flaman\u0131 dilerim.",
        "en": "Thirst has gone, the veins are moistened, and the reward is assured, if Allah wills.\n\nO Allah, I ask You by Your mercy which encompasses everything to forgive me."
      },
      "audioNoteTR": "B\xF6l\xFCm ba\u015Fl\u0131\u011F\u0131 ve \u201Cder\u201D a\xE7\u0131klamalar\u0131yla iki dua okunur. Bu, \u201CAllah\xFCmme leke sumt\xFC\u2026\u201D duas\u0131n\u0131n seslendirmesi de\u011Fildir. \u0130lk dua Eb\xFB D\xE2v\xFBd 2357\u2019de; ikinci dua Hisn kitab\u0131nda Abdullah b. Amr\u2019\u0131n duas\u0131 olarak aktar\u0131l\u0131r. \u0130kisi ayn\u0131 rivayet derecesindeymi\u015F gibi sunulmaz.",
      "audioNoteEN": "The chapter reads two prayers with its heading and \u201Che says\u201D instructions. It is not a recording of \u201CAllahumma laka sumtu\u201D. The first is reported in Abu Dawud2357; Hisn attributes the second to Abdullah ibn Amr\u2019s own supplication. Their provenance is distinguished.",
      "sourceName": "IslamHouse \xB7 M\xFCsl\xFCman\u0131n Kalesi",
      "note": "audio_chapter",
      "guideSource": "https://islamhouse.com/ar/books/2522"
    },
    {
      "id": "yolculuk-alternatif",
      "title": "Binite binerken \xB7 tam dua",
      "source": "https://islamhouse.com/ar/audios/2799103/",
      "ar": "\u0628\u0650\u0633\u0652\u0645\u0650 \u0627\u0644\u0644\u064E\u0651\u0647\u0650. \u0627\u0644\u0652\u062D\u064E\u0645\u0652\u062F\u064F \u0644\u0650\u0644\u064E\u0651\u0647\u0650. \u0633\u064F\u0628\u0652\u062D\u064E\u0627\u0646\u064E \u0627\u0644\u064E\u0651\u0630\u0650\u064A \u0633\u064E\u062E\u064E\u0651\u0631\u064E \u0644\u064E\u0646\u064E\u0627 \u0647\u064E\u0630\u064E\u0627 \u0648\u064E\u0645\u064E\u0627 \u0643\u064F\u0646\u064E\u0651\u0627 \u0644\u064E\u0647\u064F \u0645\u064F\u0642\u0652\u0631\u0650\u0646\u0650\u064A\u0646\u064E. \u0648\u064E\u0625\u0650\u0646\u064E\u0651\u0627 \u0625\u0650\u0644\u064E\u0649 \u0631\u064E\u0628\u0650\u0651\u0646\u064E\u0627 \u0644\u064E\u0645\u064F\u0646\u0652\u0642\u064E\u0644\u0650\u0628\u064F\u0648\u0646\u064E. \u0627\u0644\u0652\u062D\u064E\u0645\u0652\u062F\u064F \u0644\u0650\u0644\u064E\u0651\u0647\u0650\u060C \u0627\u0644\u0652\u062D\u064E\u0645\u0652\u062F\u064F \u0644\u0650\u0644\u064E\u0651\u0647\u0650\u060C \u0627\u0644\u0652\u062D\u064E\u0645\u0652\u062F\u064F \u0644\u0650\u0644\u064E\u0651\u0647\u0650. \u0627\u0644\u0644\u064E\u0651\u0647\u064F \u0623\u064E\u0643\u0652\u0628\u064E\u0631\u064F\u060C \u0627\u0644\u0644\u064E\u0651\u0647\u064F \u0623\u064E\u0643\u0652\u0628\u064E\u0631\u064F\u060C \u0627\u0644\u0644\u064E\u0651\u0647\u064F \u0623\u064E\u0643\u0652\u0628\u064E\u0631\u064F. \u0633\u064F\u0628\u0652\u062D\u064E\u0627\u0646\u064E\u0643\u064E \u0627\u0644\u0644\u064E\u0651\u0647\u064F\u0645\u064E\u0651 \u0625\u0650\u0646\u0650\u0651\u064A \u0638\u064E\u0644\u064E\u0645\u0652\u062A\u064F \u0646\u064E\u0641\u0652\u0633\u0650\u064A \u0641\u064E\u0627\u063A\u0652\u0641\u0650\u0631\u0652 \u0644\u0650\u064A\u060C \u0641\u064E\u0625\u0650\u0646\u064E\u0651\u0647\u064F \u0644\u064E\u0627 \u064A\u064E\u063A\u0652\u0641\u0650\u0631\u064F \u0627\u0644\u0630\u064F\u0651\u0646\u064F\u0648\u0628\u064E \u0625\u0650\u0644\u064E\u0651\u0627 \u0623\u064E\u0646\u0652\u062A\u064E.",
      "ok": "Bismill\xE2h. Elhamd\xFC lill\xE2h. S\xFCbh\xE2nellez\xEE sehhara len\xE2 h\xE2z\xE2 ve m\xE2 k\xFCnn\xE2 leh\xFB mukrin\xEEn. Ve inn\xE2 il\xE2 Rabbin\xE2 le-m\xFCnkalib\xFBn. Elhamd\xFC lill\xE2h, Elhamd\xFC lill\xE2h, Elhamd\xFC lill\xE2h. All\xE2h\xFC ekber, All\xE2h\xFC ekber, All\xE2h\xFC ekber. S\xFCbh\xE2nekell\xE2h\xFCmme inn\xEE zalemt\xFC nefs\xEE fa\u011Ffir l\xEE, fe-inneh\xFB l\xE2 ya\u011Ffiruz-z\xFCn\xFBbe ill\xE2 ente.",
      "meal": {
        "tr": "Allah\u2019\u0131n ad\u0131yla. Allah\u2019a hamdolsun. Bunu hizmetimize veren Allah\u2019\u0131 her eksiklikten uzak tutar\u0131z; yoksa bizim buna g\xFCc\xFCm\xFCz yetmezdi. Rabbimize d\xF6nece\u011Fiz. Allah\u2019a hamdolsun (\xFC\xE7 kez). Allah en b\xFCy\xFCkt\xFCr (\xFC\xE7 kez). Allah\u2019\u0131m! Seni her eksiklikten uzak tutar\u0131m. Kendime haks\u0131zl\u0131k ettim; beni ba\u011F\u0131\u015Fla. G\xFCnahlar\u0131 ancak sen ba\u011F\u0131\u015Flars\u0131n.",
        "en": "In Allah\u2019s name. Praise belongs to Allah. Glory be to Him who placed this at our service; we could not have mastered it ourselves. We will return to our Lord. Praise belongs to Allah (three times). Allah is the greatest (three times). O Allah, You are free of imperfection. I have wronged myself; forgive me, for only You forgive sins."
      },
      "audioNoteTR": "Bu tam bini\u015F duas\u0131 kayd\u0131nda b\xF6l\xFCm ba\u015Fl\u0131\u011F\u0131, besmele, hamd, iki \xE2yet, \xFC\xE7 hamd, \xFC\xE7 tekbir ve ba\u011F\u0131\u015Flanma duas\u0131 yer al\u0131r. Yaln\u0131z iki \xE2yetlik k\u0131sa kartla ayn\u0131 kapsamda de\u011Fildir; ayr\u0131 bir se\xE7enek olarak g\xF6sterilir.",
      "audioNoteEN": "This complete mounting-prayer chapter includes the heading, basmalah, praise, two Quranic verses, three praises, three takbirs and forgiveness prayer. It is broader than the existing short two-verse card and must be offered separately.",
      "sourceName": "IslamHouse \xB7 M\xFCsl\xFCman\u0131n Kalesi",
      "note": "audio_chapter",
      "guideSource": "https://hadislerleislam.diyanet.gov.tr/sayfa.php?CILT=1&SAYFA=180"
    }
  ];

  // src/dua-catalog.mjs
  var portal = "https://namaz.diyanet.gov.tr/namaz/#sureler-dualar.html";
  var book2 = "https://dijital.diyanet.gov.tr/File/Download?id=4061&path=4061_1.pdf";
  var record = (id) => dua_recordings_default.find((r) => r.prayerId === id && r.readerId === "mishary-alafasy") || dua_recordings_default.find((r) => r.id === ({ "istigfar": "istigfar-adult", "istihare": "istihare-chapter", "yemek-sonrasi-alternatif": "yemek-chapter" }[id] || id));
  function prayerCatalog(texts) {
    const item = (id, indices, title) => {
      const rows = indices.map((i) => texts[i]), languages = new Set(rows.flatMap((r) => Object.keys(r.meal || {})));
      const result = { id, title: title || rows[0].t, ar: rows.map((r) => r.ar).join("\n\n"), ok: rows.map((r) => r.ok).join("\n\n"), meal: Object.fromEntries([...languages].map((l) => [l, rows.map((r) => r.meal?.[l] || r.meal?.en || "").join("\n\n")])), recording: record(id), source: portal, namaz: indices };
      if (id === "ament\xFC") {
        result.source = "https://www.diyanethaber.com.tr/video/diyanet-elifba-amentu";
        result.external = result.source;
        result.externalLabel = "Diyanet";
      }
      if (id === "subhaneke") {
        result.ok = result.ok.replace(/\s*\(ve celle senâük\)\s*/u, " ");
        result.guideTitle = { tr: "Okuma notu", en: "Recitation note" };
        result.guide = { tr: ["Buradaki metin normal namaz\u0131n ba\u015F\u0131nda okunan bi\xE7imdir. Cenaze namaz\u0131nda ayr\u0131ca \u201Cve celle sen\xE2\xFCk\u201D (\u0648\u064E\u062C\u064E\u0644\u064E\u0651 \u062B\u064E\u0646\u064E\u0627\u0624\u064F\u0643\u064E) ifadesi eklenebilir; bu ifade burada Arap\xE7a metnin ve okunu\u015Fun i\xE7ine kar\u0131\u015Ft\u0131r\u0131lmaz."], en: ["The displayed text is the form used at the start of an ordinary prayer. In a funeral prayer, \u201Cve celle sen\xE2\xFCk\u201D (\u0648\u064E\u062C\u064E\u0644\u064E\u0651 \u062B\u064E\u0646\u064E\u0627\u0624\u064F\u0643\u064E) may be added; it is kept separate from this Arabic text and transliteration."] };
        result.guideSource = "https://kurul.diyanet.gov.tr/tr/fetva/namazlarda-subhaneke-okurken-ve-celle-senauke-kismi-nicin/0193c42d-4fad-78f8-6b66-b6ee0ffe1e2a";
      }
      return result;
    };
    const entries = [item("subhaneke", [0]), item("tahiyyat", [1]), item("salli", [2]), item("barik", [3]), item("kunut", [4, 5], "Kun\xFBt 1\u20132"), item("ament\xFC", [6]), item("rabbena", [7, 8], "Rabben\xE2 dualar\u0131"), {
      id: "ezan",
      title: "Ezan duas\u0131",
      source: "https://kurul.diyanet.gov.tr/tr/fetva/ezan-duasinin-dini-hukmu-nedir-ve-nasil-yapilir/0193c42d-8590-778e-6819-7c9e7a6f6197",
      recording: record("ezan"),
      ar: "\u0627\u064E\u0644\u0644\u0651\u0670\u0647\u064F\u0645\u064E\u0651 \u0631\u064E\u0628\u064E\u0651 \u0647\u0670\u0630\u0650\u0647\u0650 \u0627\u0644\u062F\u064E\u0651\u0639\u0652\u0648\u064E\u0629\u0650 \u0627\u0644\u062A\u064E\u0651\u0627\u0645\u064E\u0651\u0629\u0650 \u0648\u064E\u0627\u0644\u0635\u064E\u0651\u0644\u064E\u0627\u0629\u0650 \u0627\u0644\u0652\u0642\u064E\u0627\u0626\u0650\u0645\u064E\u0629\u0650 \u0622\u062A\u0650 \u0645\u064F\u062D\u064E\u0645\u064E\u0651\u062F\u064B\u0627 \u0627\u0644\u0652\u0648\u064E\u0633\u0650\u064A\u0644\u064E\u0629\u064E \u0648\u064E\u0627\u0644\u0652\u0641\u064E\u0636\u0650\u064A\u0644\u064E\u0629\u064E \u0648\u064E\u0627\u0644\u062F\u064E\u0651\u0631\u064E\u062C\u064E\u0629\u064E \u0627\u0644\u0631\u064E\u0651\u0641\u0650\u064A\u0639\u064E\u0629\u064E \u0648\u064E\u0627\u0628\u0652\u0639\u064E\u062B\u0652\u0647\u064F \u0645\u064E\u0642\u064E\u0627\u0645\u064B\u0627 \u0645\u064E\u062D\u0652\u0645\u064F\u0648\u062F\u064B\u0627 \u0627\u0644\u064E\u0651\u0630\u0650\u064A \u0648\u064E\u0639\u064E\u062F\u0652\u062A\u064E\u0647\u064F. \u0625\u0650\u0646\u064E\u0651\u0643\u064E \u0644\u064E\u0627 \u062A\u064F\u062E\u0652\u0644\u0650\u0641\u064F \u0627\u0644\u0652\u0645\u0650\u064A\u0639\u064E\u0627\u062F\u064E.",
      ok: "All\xE2h\xFCmme Rabbe h\xE2zihid-da\u2018vetit-t\xE2mmeti ves-sal\xE2til-k\xE2imeti, \xE2ti Muhammedenil-ves\xEElete vel-fad\xEElete ved-dereceter-raf\xEEate veb\u2018ash\xFC mak\xE2men mahm\xFBdenillez\xEE va\u2018adteh. \u0130nneke l\xE2 tuhlif\xFCl-m\xEE\xE2d.",
      meal: { tr: "Allah\u2019\u0131m! Bu eksiksiz davetin ve k\u0131l\u0131nacak namaz\u0131n Rabbi! Muhammed\u2019e vesileyi, fazileti ve y\xFCksek dereceyi ver; onu vadetti\u011Fin \xF6v\xFClm\xFC\u015F makama ula\u015Ft\u0131r. \u015E\xFCphesiz sen vaadinden d\xF6nmezsin.", en: "O Allah, Lord of this complete call and the prayer to be established, grant Muhammad the means of nearness, excellence and the lofty rank, and raise him to the praised station You promised. Surely You never break Your promise." },
      guideTitle: { tr: "Metin ve ses s\xFCr\xFCm\xFC", en: "Text and recording versions" },
      guide: { tr: ["\u201C\u0130nneke l\xE2 tuhlif\xFCl-m\xEE\xE2d\u201D (Sen vaadinden d\xF6nmezsin) c\xFCmlesi baz\u0131 rivayetlerde yer al\u0131r. Buradaki metin, mevcut ses kayd\u0131nda okunan \u201Cved-dereceter-raf\xEEate\u201D ve bu son c\xFCmleyi de i\xE7erir. Daha k\u0131sa ezan duas\u0131 rivayetleri de vard\u0131r."], en: ["\u201CInneke l\xE2 tuhlif\xFCl-m\xEE\xE2d\u201D (You never break Your promise) appears in some narrations. The displayed version includes \u201Cved-dereceter-raf\xEEate\u201D and the closing sentence, as recited in the current recording. Shorter versions also exist."] },
      guideSource: "https://sehitferhatarslanaihl.meb.k12.tr/meb_iys_dosyalar/65/14/761411/dosyalar/2018_11/09172051_20195555_Ezan_ve_Namaz_TesbihatY.pdf"
    }, {
      id: "istigfar",
      title: "Seyyid\xFCl isti\u011Ffar",
      source: "https://kurul.diyanet.gov.tr/tr/fetva/istigfar-duasi-nedir/0193c42d-87eb-7113-39c4-1d8562685e34",
      external: "https://www.youtube.com/watch?v=HWCKSAvMWn8",
      ar: "\u0627\u0644\u0644\u064E\u0651\u0647\u064F\u0645\u064E\u0651 \u0623\u064E\u0646\u0652\u062A\u064E \u0631\u064E\u0628\u0650\u0651\u064A \u0644\u064E\u0627 \u0625\u0650\u0644\u064E\u0647\u064E \u0625\u0650\u0644\u064E\u0651\u0627 \u0623\u064E\u0646\u0652\u062A\u064E \u062E\u064E\u0644\u064E\u0642\u0652\u062A\u064E\u0646\u0650\u064A \u0648\u064E\u0623\u064E\u0646\u064E\u0627 \u0639\u064E\u0628\u0652\u062F\u064F\u0643\u064E \u0648\u064E\u0623\u064E\u0646\u064E\u0627 \u0639\u064E\u0644\u064E\u0649 \u0639\u064E\u0647\u0652\u062F\u0650\u0643\u064E \u0648\u064E\u0648\u064E\u0639\u0652\u062F\u0650\u0643\u064E \u0645\u064E\u0627 \u0627\u0633\u0652\u062A\u064E\u0637\u064E\u0639\u0652\u062A\u064F \u0623\u064E\u0639\u064F\u0648\u0630\u064F \u0628\u0650\u0643\u064E \u0645\u0650\u0646\u0652 \u0634\u064E\u0631\u0650\u0651 \u0645\u064E\u0627 \u0635\u064E\u0646\u064E\u0639\u0652\u062A\u064F \u0623\u064E\u0628\u064F\u0648\u0621\u064F \u0644\u064E\u0643\u064E \u0628\u0650\u0646\u0650\u0639\u0652\u0645\u064E\u062A\u0650\u0643\u064E \u0639\u064E\u0644\u064E\u064A\u064E\u0651 \u0648\u064E\u0623\u064E\u0628\u064F\u0648\u0621\u064F \u0628\u0650\u0630\u064E\u0646\u0652\u0628\u0650\u064A \u0641\u064E\u0627\u063A\u0652\u0641\u0650\u0631\u0652 \u0644\u0650\u064A \u0641\u064E\u0625\u0650\u0646\u064E\u0651\u0647\u064F \u0644\u064E\u0627 \u064A\u064E\u063A\u0652\u0641\u0650\u0631\u064F \u0627\u0644\u0630\u064F\u0651\u0646\u064F\u0648\u0628\u064E \u0625\u0650\u0644\u064E\u0651\u0627 \u0623\u064E\u0646\u0652\u062A\u064E",
      ok: "All\xE2h\xFCmme ente Rabb\xEE l\xE2 il\xE2he ill\xE2 ente, halakten\xEE ve ene abd\xFCke ve ene al\xE2 ahdike ve va\u2018dike mesteta\u2018t\xFC. E\xFBz\xFC bike min \u015Ferri m\xE2 sana\u2018t\xFC. Eb\xFB\xFC leke bi-ni\u2018metike aleyye ve eb\xFB\xFC bi-zenb\xEE, fa\u011Ffir l\xEE, fe-inneh\xFB l\xE2 ya\u011Ffiruz-z\xFCn\xFBbe ill\xE2 ente.",
      meal: { tr: "Allah\u2019\u0131m! Sen benim Rabbimsin; senden ba\u015Fka ilah yoktur. Beni sen yaratt\u0131n, ben senin kulunum. G\xFCc\xFCm yetti\u011Fince sana verdi\u011Fim s\xF6ze ba\u011Fl\u0131y\u0131m. Yapt\u0131klar\u0131m\u0131n k\xF6t\xFCl\xFC\u011F\xFCnden sana s\u0131\u011F\u0131n\u0131r\u0131m. Nimetlerini ve g\xFCnah\u0131m\u0131 itiraf ederim. Beni ba\u011F\u0131\u015Fla; g\xFCnahlar\u0131 ancak sen ba\u011F\u0131\u015Flars\u0131n.", en: "O Allah, You are my Lord; there is no deity but You. You created me and I am Your servant. I keep Your covenant and promise as best I can. I seek refuge in You from my wrongdoing, acknowledge Your blessings and confess my sin. Forgive me, for only You forgive sins." }
    }, {
      id: "yemek",
      title: "Yemek sonras\u0131 duas\u0131 \xB7 k\u0131sa",
      source: book2 + "#page=112",
      ar: "\u0627\u0644\u0652\u062D\u064E\u0645\u0652\u062F\u064F \u0644\u0650\u0644\u0651\u0670\u0647\u0650 \u0627\u0644\u064E\u0651\u0630\u0650\u064A \u0623\u064E\u0637\u0652\u0639\u064E\u0645\u064E\u0646\u064E\u0627 \u0648\u064E\u0633\u064E\u0642\u064E\u0627\u0646\u064E\u0627 \u0648\u064E\u062C\u064E\u0639\u064E\u0644\u064E\u0646\u064E\u0627 \u0645\u0650\u0646\u064E \u0627\u0644\u0652\u0645\u064F\u0633\u0652\u0644\u0650\u0645\u0650\u064A\u0646\u064E",
      ok: "Elhamd\xFC lill\xE2hillez\xEE et\u2018amen\xE2 ve sek\xE2n\xE2 ve cealen\xE2 minel-m\xFCslim\xEEn.",
      meal: { tr: "Bizi yediren, i\xE7iren ve M\xFCsl\xFCmanlardan k\u0131lan Allah\u2019a hamdolsun.", en: "Praise belongs to Allah, who fed us, gave us drink, and made us Muslims." }
    }, {
      id: "kuran-baslama",
      title: "Kur\u2019an okumaya ba\u015Flama duas\u0131",
      source: book2 + "#page=70",
      ar: "\u0627\u0644\u0644\u064E\u0651\u0647\u064F\u0645\u064E\u0651 \u0628\u0650\u0627\u0644\u0652\u062D\u064E\u0642\u0650\u0651 \u0623\u064E\u0646\u0652\u0632\u064E\u0644\u0652\u062A\u064E\u0647\u064F \u0648\u064E\u0628\u0650\u0627\u0644\u0652\u062D\u064E\u0642\u0650\u0651 \u0646\u064E\u0632\u064E\u0644\u064E. \u0627\u0644\u0644\u064E\u0651\u0647\u064F\u0645\u064E\u0651 \u0639\u064E\u0638\u0650\u0651\u0645\u0652 \u0631\u064E\u063A\u0652\u0628\u064E\u062A\u0650\u064A \u0641\u0650\u064A\u0647\u0650 \u0648\u064E\u0627\u062C\u0652\u0639\u064E\u0644\u0652\u0647\u064F \u0646\u064F\u0648\u0631\u064B\u0627 \u0644\u0650\u0628\u064E\u0635\u064E\u0631\u0650\u064A \u0648\u064E\u0634\u0650\u0641\u064E\u0627\u0621\u064B \u0644\u0650\u0635\u064E\u062F\u0652\u0631\u0650\u064A. \u0627\u0644\u0644\u064E\u0651\u0647\u064F\u0645\u064E\u0651 \u0632\u064E\u064A\u0650\u0651\u0646\u0652 \u0628\u0650\u0647\u0650 \u0644\u0650\u0633\u064E\u0627\u0646\u0650\u064A \u0648\u064E\u062C\u064E\u0645\u0650\u0651\u0644\u0652 \u0628\u0650\u0647\u0650 \u0648\u064E\u062C\u0652\u0647\u0650\u064A \u0648\u064E\u0642\u064E\u0648\u0650\u0651 \u0628\u0650\u0647\u0650 \u062C\u064E\u0633\u064E\u062F\u0650\u064A \u0648\u064E\u0627\u0631\u0652\u0632\u064F\u0642\u0652\u0646\u0650\u064A \u062A\u0650\u0644\u064E\u0627\u0648\u064E\u062A\u064E\u0647\u064F \u0639\u064E\u0644\u064E\u0649 \u0637\u064E\u0627\u0639\u064E\u062A\u0650\u0643\u064E \u0622\u0646\u064E\u0627\u0621\u064E \u0627\u0644\u0644\u064E\u0651\u064A\u0652\u0644\u0650 \u0648\u064E\u0623\u064E\u0637\u0652\u0631\u064E\u0627\u0641\u064E \u0627\u0644\u0646\u064E\u0651\u0647\u064E\u0627\u0631\u0650 \u0648\u064E\u0627\u062D\u0652\u0634\u064F\u0631\u0652\u0646\u0650\u064A \u0645\u064E\u0639\u064E \u0627\u0644\u0646\u064E\u0651\u0628\u0650\u064A\u0650\u0651 \u0635\u064E\u0644\u064E\u0651\u0649 \u0627\u0644\u0644\u064E\u0651\u0647\u064F \u0639\u064E\u0644\u064E\u064A\u0652\u0647\u0650 \u0648\u064E\u0633\u064E\u0644\u064E\u0651\u0645\u064E \u0648\u064E\u0622\u0644\u0650\u0647\u0650 \u0627\u0644\u0652\u0623\u064E\u062E\u0652\u064A\u064E\u0627\u0631\u0650. \u0646\u064E\u0648\u064E\u064A\u0652\u062A\u064F \u062A\u0650\u0644\u064E\u0627\u0648\u064E\u0629\u064E \u0627\u0644\u0652\u0642\u064F\u0631\u0652\u0622\u0646\u0650 \u0644\u0650\u0631\u0650\u0636\u064E\u0627\u0621\u0650 \u0627\u0644\u0631\u064E\u0651\u062D\u0652\u0645\u0670\u0646\u0650 \u0648\u064E\u062A\u064E\u0646\u0652\u0648\u0650\u064A\u0631\u0650 \u0642\u064F\u0628\u064F\u0648\u0631\u0650 \u0623\u064E\u0647\u0652\u0644\u0650 \u0627\u0644\u0652\u0625\u0650\u064A\u0645\u064E\u0627\u0646\u0650 \u0648\u064E\u0644\u0650\u0631\u064F\u0648\u062D\u0650 \u0634\u064E\u0645\u0652\u0633\u0650 \u0633\u064E\u064A\u0650\u0651\u062F\u0650 \u0627\u0644\u0652\u0623\u064E\u0646\u0652\u0628\u0650\u064A\u064E\u0627\u0621\u0650 \u0648\u064E\u0642\u064E\u0645\u064E\u0631\u0650 \u0627\u0644\u0652\u0645\u064F\u0631\u0652\u0633\u064E\u0644\u0650\u064A\u0646\u064E \u0633\u064E\u064A\u0650\u0651\u062F\u0650\u0646\u064E\u0627 \u0645\u064F\u062D\u064E\u0645\u064E\u0651\u062F\u064D \u0639\u064E\u0644\u064E\u064A\u0652\u0647\u0650 \u0635\u064E\u0644\u064E\u0648\u064E\u0627\u062A\u064F \u0627\u0644\u0631\u064E\u0651\u062D\u0652\u0645\u0670\u0646\u0650 \u0648\u064E\u0644\u0650\u0637\u064E\u0631\u0652\u062F\u0650 \u0627\u0644\u0634\u064E\u0651\u064A\u0652\u0637\u064E\u0627\u0646\u0650 \u0648\u064E\u0625\u0650\u0633\u0652\u0642\u064E\u0627\u0637\u0650 \u0627\u0644\u0630\u064F\u0651\u0646\u064F\u0648\u0628\u0650 \u0648\u064E\u0642\u064E\u0628\u064F\u0648\u0644\u0650 \u0627\u0644\u062A\u064E\u0651\u0648\u0652\u0628\u064E\u0629\u0650 \u0648\u064E\u0631\u064E\u0641\u0652\u0639\u0650 \u0627\u0644\u062F\u064E\u0651\u0631\u064E\u062C\u064E\u0627\u062A\u0650 \u0648\u064E\u0627\u0644\u0646\u064E\u0651\u062C\u064E\u0627\u0629\u0650 \u0645\u0650\u0646\u064E \u0627\u0644\u0646\u0650\u0651\u064A\u0631\u064E\u0627\u0646\u0650 \u0648\u064E\u0628\u064E\u0642\u064E\u0627\u0621\u0650 \u0627\u0644\u0652\u0625\u0650\u064A\u0645\u064E\u0627\u0646\u0650 \u0648\u064E\u0644\u0650\u0642\u064E\u0627\u0621\u0650 \u0627\u0644\u0631\u064E\u0651\u062D\u0652\u0645\u0670\u0646\u0650 \u0628\u0650\u0631\u064E\u062D\u0652\u0645\u064E\u062A\u0650\u0643\u064E \u064A\u064E\u0627 \u0623\u064E\u0631\u0652\u062D\u064E\u0645\u064E \u0627\u0644\u0631\u064E\u0651\u0627\u062D\u0650\u0645\u0650\u064A\u0646\u064E \u0648\u064E\u0627\u0644\u0652\u062D\u064E\u0645\u0652\u062F\u064F \u0644\u0650\u0644\u064E\u0651\u0647\u0650 \u0631\u064E\u0628\u0650\u0651 \u0627\u0644\u0652\u0639\u064E\u0627\u0644\u064E\u0645\u0650\u064A\u0646\u064E.",
      ok: "All\xE2h\xFCmme bil-hakk\u0131 enzelteh\xFB ve bil-hakk\u0131 nezel. All\xE2h\xFCmme azz\u0131m ra\u011Fbet\xEE f\xEEhi vec\u2018alh\xFC n\xFBran li-basar\xEE ve \u015Fif\xE2en li-sadr\xEE. All\xE2h\xFCmme zeyyin bih\xEE lis\xE2n\xEE ve cemmil bih\xEE vech\xEE ve kavvi bih\xEE cesed\xEE verzukn\xEE til\xE2veteh\xFB al\xE2 t\xE2atike \xE2n\xE2el-leyli ve etr\xE2fen-neh\xE2ri vah\u015Furn\xEE mean-nebiyyi sallall\xE2h\xFC aleyhi ve selleme ve \xE2lih\u0131l-ahy\xE2r. Neveyt\xFC til\xE2vetel-Kur\u2019\xE2ni li-r\u0131d\xE2ir-Rahm\xE2ni ve tenv\xEEri kub\xFBri ehlil-\xEEm\xE2ni ve li-r\xFBhi \u015Femsi seyyidil-enbiy\xE2i ve kameril-m\xFCrsel\xEEne seyyidin\xE2 Muhammedin aleyhi salav\xE2t\xFCr-Rahm\xE2ni ve li-tardi\u015F-\u015Feyt\xE2ni ve isk\xE2tiz-z\xFCn\xFBbi ve kab\xFBlit-tevbeti ve ref\u2018id-derec\xE2ti ven-nec\xE2ti minen-n\xEEr\xE2ni ve bek\xE2il-\xEEm\xE2ni ve lik\xE2ir-Rahm\xE2ni bi-rahmetike y\xE2 erhamer-r\xE2him\xEEn. Velhamd\xFC lill\xE2hi Rabbil-\xE2lem\xEEn.",
      meal: { tr: "Allah\u2019\u0131m! Kur\u2019an\u2019\u0131 hak ile indirdin. Ona ilgimi art\u0131r; onu g\xF6z\xFCme nur, g\xF6nl\xFCme \u015Fifa k\u0131l. Dilimi onunla s\xFCsle, y\xFCz\xFCm\xFC g\xFCzelle\u015Ftir, bedenimi g\xFC\xE7lendir. Gece ve g\xFCnd\xFCz sana itaat ederek onu okumay\u0131 nasip et; beni Peygamberimiz ve onun se\xE7kin yak\u0131nlar\u0131yla ha\u015Fret. Senin r\u0131zan, iman ehlinin kabirlerinin ayd\u0131nlanmas\u0131 ve Peygamberimizin ruhu i\xE7in; \u015Feytandan uzakla\u015Fmak, g\xFCnahlar\u0131n ba\u011F\u0131\u015Flanmas\u0131, t\xF6vbenin kabul\xFC, derecelerin y\xFCkselmesi, cehennemden kurtulu\u015F, iman\u0131n devam\u0131 ve sana kavu\u015Fmak niyetiyle okuyorum. Rahmetinle kabul et. Hamd \xE2lemlerin Rabbi Allah\u2019ad\u0131r.", en: "O Allah, You sent the Quran down in truth. Increase my desire for it; make it light for my sight and healing for my heart. Adorn my speech and strengthen me through it. Grant me its recitation in obedience to You by night and day, and gather me with the Prophet and his righteous family. I intend this recitation for Your pleasure, for light in the believers\u2019 graves, and for the Prophet; for protection from Satan, forgiveness, acceptance of repentance, higher rank, deliverance from the Fire, lasting faith and meeting You. Accept it through Your mercy. Praise belongs to Allah, Lord of all worlds." },
      note: "traditional_prayer"
    }, ...extraPrayers];
    const withAlternatives = entries.flatMap((entry) => [entry, ...recordedAlternatives.filter((a) => a.id === entry.id + "-alternatif")]);
    return withAlternatives.map((entry) => ({ ...entry, recording: entry.recording || record(entry.id) }));
  }

  // src/dua-copy.mjs
  var locales = ["tr", "de", "en", "ru", "ar", "fr", "es", "el", "zh", "ja", "ko", "hi", "ur", "it", "id", "nl", "pt", "fa", "bn", "ms", "sw"];
  var labels = {
    tab: ["Dinle ve ezberle", "H\xF6ren und lernen", "Listen and learn", "\u0421\u043B\u0443\u0448\u0430\u0442\u044C \u0438 \u0443\u0447\u0438\u0442\u044C", "\u0627\u0633\u062A\u0645\u0639 \u0648\u0627\u062D\u0641\u0638", "\xC9couter et apprendre", "Escuchar y aprender", "\u0386\u03BA\u03BF\u03C5\u03C3\u03B5 \u03BA\u03B1\u03B9 \u03BC\u03AC\u03B8\u03B5", "\u8046\u542C\u4E0E\u5B66\u4E60", "\u805E\u3044\u3066\u899A\u3048\u308B", "\uB4E3\uACE0 \uBC30\uC6B0\uAE30", "\u0938\u0941\u0928\u0947\u0902 \u0914\u0930 \u0938\u0940\u0916\u0947\u0902", "\u0633\u0646\u06CC\u06BA \u0627\u0648\u0631 \u06CC\u0627\u062F \u06A9\u0631\u06CC\u06BA", "Ascolta e impara", "Dengar dan hafalkan", "Luisteren en leren", "Ouvir e aprender", "\u06AF\u0648\u0634 \u062F\u0647\u06CC\u062F \u0648 \u062D\u0641\u0638 \u06A9\u0646\u06CC\u062F", "\u09B6\u09C1\u09A8\u09C1\u09A8 \u0993 \u09B6\u09BF\u0996\u09C1\u09A8", "Dengar dan hafal", "Sikiliza na ujifunze"],
    full: ["B\xFCt\xFCn dua", "Ganzes Bittgebet", "Whole supplication", "\u0412\u0441\u044F \u043C\u043E\u043B\u0438\u0442\u0432\u0430", "\u0627\u0644\u062F\u0639\u0627\u0621 \u0643\u0627\u0645\u0644\u064B\u0627", "Invocation enti\xE8re", "S\xFAplica completa", "\u039F\u03BB\u03CC\u03BA\u03BB\u03B7\u03C1\u03B7 \u03B4\u03AD\u03B7\u03C3\u03B7", "\u5B8C\u6574\u7948\u7977", "\u7948\u308A\u5168\u4F53", "\uC804\uCCB4 \uAE30\uB3C4", "\u092A\u0942\u0930\u0940 \u0926\u0941\u0906", "\u0645\u06A9\u0645\u0644 \u062F\u0639\u0627", "Supplica intera", "Seluruh doa", "Hele smeekbede", "S\xFAplica completa", "\u06A9\u0644 \u062F\u0639\u0627", "\u09B8\u09AE\u09CD\u09AA\u09C2\u09B0\u09CD\u09A3 \u09A6\u09CB\u09AF\u09BC\u09BE", "Seluruh doa", "Dua nzima"],
    clip: ["C\xFCmle", "Abschnitt", "Phrase", "\u0424\u0440\u0430\u0433\u043C\u0435\u043D\u0442", "\u0645\u0642\u0637\u0639", "Passage", "Fragmento", "\u0391\u03C0\u03CC\u03C3\u03C0\u03B1\u03C3\u03BC\u03B1", "\u7247\u6BB5", "\u533A\u9593", "\uAD6C\uAC04", "\u0905\u0902\u0936", "\u062D\u0635\u06C1", "Passaggio", "Bagian", "Fragment", "Trecho", "\u0628\u062E\u0634", "\u0985\u0982\u09B6", "Bahagian", "Sehemu"],
    download: ["\xC7evrimd\u0131\u015F\u0131 indir", "Offline speichern", "Download offline", "\u0421\u043A\u0430\u0447\u0430\u0442\u044C \u043E\u0444\u043B\u0430\u0439\u043D", "\u062A\u0646\u0632\u064A\u0644 \u062F\u0648\u0646 \u0627\u062A\u0635\u0627\u0644", "T\xE9l\xE9charger hors ligne", "Descargar sin conexi\xF3n", "\u039B\u03AE\u03C8\u03B7 \u03B5\u03BA\u03C4\u03CC\u03C2 \u03C3\u03CD\u03BD\u03B4\u03B5\u03C3\u03B7\u03C2", "\u79BB\u7EBF\u4E0B\u8F7D", "\u30AA\u30D5\u30E9\u30A4\u30F3\u4FDD\u5B58", "\uC624\uD504\uB77C\uC778 \uC800\uC7A5", "\u0911\u092B\u093C\u0932\u093E\u0907\u0928 \u0921\u093E\u0909\u0928\u0932\u094B\u0921", "\u0622\u0641 \u0644\u0627\u0626\u0646 \u0688\u0627\u0624\u0646 \u0644\u0648\u0688", "Scarica offline", "Unduh offline", "Offline downloaden", "Baixar offline", "\u0628\u0627\u0631\u06AF\u06CC\u0631\u06CC \u0622\u0641\u0644\u0627\u06CC\u0646", "\u0985\u09AB\u09B2\u09BE\u0987\u09A8\u09C7 \u09A1\u09BE\u0989\u09A8\u09B2\u09CB\u09A1", "Muat turun luar talian", "Pakua nje ya mtandao"],
    ready: ["\u0130ndirildi", "Gespeichert", "Downloaded", "\u0421\u043A\u0430\u0447\u0430\u043D\u043E", "\u062A\u0645 \u0627\u0644\u062A\u0646\u0632\u064A\u0644", "T\xE9l\xE9charg\xE9", "Descargado", "\u039B\u03AE\u03C6\u03B8\u03B7\u03BA\u03B5", "\u5DF2\u4E0B\u8F7D", "\u4FDD\u5B58\u6E08\u307F", "\uB2E4\uC6B4\uB85C\uB4DC\uB428", "\u0921\u093E\u0909\u0928\u0932\u094B\u0921 \u0939\u0941\u0906", "\u0688\u0627\u0624\u0646 \u0644\u0648\u0688 \u06C1\u0648 \u06AF\u06CC\u0627", "Scaricato", "Diunduh", "Gedownload", "Baixado", "\u0628\u0627\u0631\u06AF\u06CC\u0631\u06CC \u0634\u062F", "\u09A1\u09BE\u0989\u09A8\u09B2\u09CB\u09A1 \u09B9\u09AF\u09BC\u09C7\u099B\u09C7", "Dimuat turun", "Imepakuliwa"],
    source: ["Kaynak", "Quelle", "Source", "\u0418\u0441\u0442\u043E\u0447\u043D\u0438\u043A", "\u0627\u0644\u0645\u0635\u062F\u0631", "Source", "Fuente", "\u03A0\u03B7\u03B3\u03AE", "\u6765\u6E90", "\u51FA\u5178", "\uCD9C\uCC98", "\u0938\u094D\u0930\u094B\u0924", "\u0645\u0627\u062E\u0630", "Fonte", "Sumber", "Bron", "Fonte", "\u0645\u0646\u0628\u0639", "\u0989\u09CE\u09B8", "Sumber", "Chanzo"],
    start: ["Ba\u015Flang\u0131c\u0131 i\u015Faretle", "Anfang markieren", "Mark start", "\u041E\u0442\u043C\u0435\u0442\u0438\u0442\u044C \u043D\u0430\u0447\u0430\u043B\u043E", "\u062D\u062F\u062F \u0627\u0644\u0628\u062F\u0627\u064A\u0629", "Marquer le d\xE9but", "Marcar inicio", "\u03A3\u03B7\u03BC\u03B5\u03AF\u03C9\u03C3\u03B7 \u03B1\u03C1\u03C7\u03AE\u03C2", "\u6807\u8BB0\u8D77\u70B9", "\u958B\u59CB\u4F4D\u7F6E\u3092\u8A18\u9332", "\uC2DC\uC791 \uD45C\uC2DC", "\u0936\u0941\u0930\u0942 \u091A\u093F\u0939\u094D\u0928\u093F\u0924 \u0915\u0930\u0947\u0902", "\u0622\u063A\u0627\u0632 \u0646\u0634\u0627\u0646 \u0644\u06AF\u0627\u0626\u06CC\u06BA", "Segna inizio", "Tandai awal", "Begin markeren", "Marcar in\xEDcio", "\u062B\u0628\u062A \u0622\u063A\u0627\u0632", "\u09B6\u09C1\u09B0\u09C1 \u099A\u09BF\u09B9\u09CD\u09A8\u09BF\u09A4 \u0995\u09B0\u09C1\u09A8", "Tanda mula", "Weka mwanzo"],
    end: ["Biti\u015Fi i\u015Faretle", "Ende markieren", "Mark end", "\u041E\u0442\u043C\u0435\u0442\u0438\u0442\u044C \u043A\u043E\u043D\u0435\u0446", "\u062D\u062F\u062F \u0627\u0644\u0646\u0647\u0627\u064A\u0629", "Marquer la fin", "Marcar final", "\u03A3\u03B7\u03BC\u03B5\u03AF\u03C9\u03C3\u03B7 \u03C4\u03AD\u03BB\u03BF\u03C5\u03C2", "\u6807\u8BB0\u7EC8\u70B9", "\u7D42\u4E86\u4F4D\u7F6E\u3092\u8A18\u9332", "\uB05D \uD45C\uC2DC", "\u0905\u0902\u0924 \u091A\u093F\u0939\u094D\u0928\u093F\u0924 \u0915\u0930\u0947\u0902", "\u0627\u062E\u062A\u062A\u0627\u0645 \u0646\u0634\u0627\u0646 \u0644\u06AF\u0627\u0626\u06CC\u06BA", "Segna fine", "Tandai akhir", "Einde markeren", "Marcar fim", "\u062B\u0628\u062A \u067E\u0627\u06CC\u0627\u0646", "\u09B6\u09C7\u09B7 \u099A\u09BF\u09B9\u09CD\u09A8\u09BF\u09A4 \u0995\u09B0\u09C1\u09A8", "Tanda akhir", "Weka mwisho"],
    save: ["C\xFCmleyi kaydet", "Abschnitt speichern", "Save phrase", "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u0444\u0440\u0430\u0433\u043C\u0435\u043D\u0442", "\u0627\u062D\u0641\u0638 \u0627\u0644\u0645\u0642\u0637\u0639", "Enregistrer le passage", "Guardar fragmento", "\u0391\u03C0\u03BF\u03B8\u03AE\u03BA\u03B5\u03C5\u03C3\u03B7 \u03B1\u03C0\u03BF\u03C3\u03C0\u03AC\u03C3\u03BC\u03B1\u03C4\u03BF\u03C2", "\u4FDD\u5B58\u7247\u6BB5", "\u533A\u9593\u3092\u4FDD\u5B58", "\uAD6C\uAC04 \uC800\uC7A5", "\u0905\u0902\u0936 \u0938\u0939\u0947\u091C\u0947\u0902", "\u062D\u0635\u06C1 \u0645\u062D\u0641\u0648\u0638 \u06A9\u0631\u06CC\u06BA", "Salva passaggio", "Simpan bagian", "Fragment opslaan", "Salvar trecho", "\u0630\u062E\u06CC\u0631\u0647 \u0628\u062E\u0634", "\u0985\u0982\u09B6 \u09B8\u0982\u09B0\u0995\u09CD\u09B7\u09A3", "Simpan bahagian", "Hifadhi sehemu"],
    remove: ["Kald\u0131r", "Entfernen", "Remove", "\u0423\u0431\u0440\u0430\u0442\u044C", "\u0625\u0632\u0627\u0644\u0629", "Retirer", "Quitar", "\u0391\u03C6\u03B1\u03AF\u03C1\u03B5\u03C3\u03B7", "\u79FB\u9664", "\u524A\u9664", "\uC0AD\uC81C", "\u0939\u091F\u093E\u090F\u0901", "\u06C1\u0679\u0627\u0626\u06CC\u06BA", "Rimuovi", "Hapus", "Verwijderen", "Remover", "\u062D\u0630\u0641", "\u09B8\u09B0\u09BE\u09A8", "Buang", "Ondoa"],
    undo: ["Geri al", "R\xFCckg\xE4ngig", "Undo", "\u041E\u0442\u043C\u0435\u043D\u0438\u0442\u044C", "\u062A\u0631\u0627\u062C\u0639", "Annuler", "Deshacer", "\u0391\u03BD\u03B1\u03AF\u03C1\u03B5\u03C3\u03B7", "\u64A4\u9500", "\u5143\u306B\u623B\u3059", "\uC2E4\uD589 \uCDE8\uC18C", "\u092A\u0942\u0930\u094D\u0935\u0935\u0924", "\u0648\u0627\u067E\u0633 \u0644\u06CC\u06BA", "Annulla", "Urungkan", "Ongedaan maken", "Desfazer", "\u0648\u0627\u06AF\u0631\u062F", "\u09AA\u09C2\u09B0\u09CD\u09AC\u09BE\u09AC\u09B8\u09CD\u09A5\u09BE\u09AF\u09BC", "Buat asal", "Tendua"],
    waiting: ["Bekleniyor", "Warten", "Waiting", "\u041F\u0430\u0443\u0437\u0430", "\u0627\u0646\u062A\u0638\u0627\u0631", "Pause", "Espera", "\u0391\u03BD\u03B1\u03BC\u03BF\u03BD\u03AE", "\u7B49\u5F85\u4E2D", "\u5F85\u6A5F\u4E2D", "\uB300\uAE30 \uC911", "\u092A\u094D\u0930\u0924\u0940\u0915\u094D\u0937\u093E", "\u0627\u0646\u062A\u0638\u0627\u0631", "Pausa", "Menunggu", "Wachten", "Aguardando", "\u062F\u0631 \u0627\u0646\u062A\u0638\u0627\u0631", "\u0985\u09AA\u09C7\u0995\u09CD\u09B7\u09BE", "Menunggu", "Inasubiri"],
    complete: ["\xC7al\u0131\u015Fma tamamland\u0131", "\xDCbung beendet", "Practice complete", "\u0417\u0430\u043D\u044F\u0442\u0438\u0435 \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u043E", "\u0627\u0643\u062A\u0645\u0644 \u0627\u0644\u062A\u062F\u0631\u064A\u0628", "Exercice termin\xE9", "Pr\xE1ctica completada", "\u0397 \u03B5\u03BE\u03AC\u03C3\u03BA\u03B7\u03C3\u03B7 \u03BF\u03BB\u03BF\u03BA\u03BB\u03B7\u03C1\u03CE\u03B8\u03B7\u03BA\u03B5", "\u7EC3\u4E60\u5B8C\u6210", "\u7DF4\u7FD2\u5B8C\u4E86", "\uD559\uC2B5 \uC644\uB8CC", "\u0905\u092D\u094D\u092F\u093E\u0938 \u092A\u0942\u0930\u093E", "\u0645\u0634\u0642 \u0645\u06A9\u0645\u0644", "Esercizio completato", "Latihan selesai", "Oefening voltooid", "Exerc\xEDcio conclu\xEDdo", "\u062A\u0645\u0631\u06CC\u0646 \u062A\u0645\u0627\u0645 \u0634\u062F", "\u0985\u09A8\u09C1\u09B6\u09C0\u09B2\u09A8 \u09B8\u09AE\u09CD\u09AA\u09C2\u09B0\u09CD\u09A3", "Latihan selesai", "Zoezi limekamilika"],
    error: ["Ses a\xE7\u0131lamad\u0131. Yeniden dene.", "Audio nicht verf\xFCgbar. Erneut versuchen.", "Audio unavailable. Try again.", "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u0442\u043A\u0440\u044B\u0442\u044C \u0437\u0432\u0443\u043A. \u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u0435.", "\u062A\u0639\u0630\u0631 \u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0635\u0648\u062A. \u062D\u0627\u0648\u0644 \u0645\u062C\u062F\u062F\u064B\u0627.", "Audio indisponible. R\xE9essayez.", "Audio no disponible. Reintenta.", "\u039F \u03AE\u03C7\u03BF\u03C2 \u03B4\u03B5\u03BD \u03AC\u03BD\u03BF\u03B9\u03BE\u03B5. \u0394\u03BF\u03BA\u03AF\u03BC\u03B1\u03C3\u03B5 \u03BE\u03B1\u03BD\u03AC.", "\u97F3\u9891\u4E0D\u53EF\u7528\uFF0C\u8BF7\u91CD\u8BD5\u3002", "\u97F3\u58F0\u3092\u958B\u3051\u307E\u305B\u3093\u3002\u518D\u8A66\u884C\u3057\u3066\u304F\u3060\u3055\u3044\u3002", "\uC624\uB514\uC624\uB97C \uC5F4 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uC2DC\uB3C4\uD558\uC138\uC694.", "\u0911\u0921\u093F\u092F\u094B \u0928\u0939\u0940\u0902 \u0916\u0941\u0932\u093E\u0964 \u092B\u093F\u0930 \u0915\u094B\u0936\u093F\u0936 \u0915\u0930\u0947\u0902\u0964", "\u0622\u0688\u06CC\u0648 \u0646\u06C1\u06CC\u06BA \u06A9\u06BE\u0644\u06CC\u06D4 \u062F\u0648\u0628\u0627\u0631\u06C1 \u06A9\u0648\u0634\u0634 \u06A9\u0631\u06CC\u06BA\u06D4", "Audio non disponibile. Riprova.", "Audio tidak tersedia. Coba lagi.", "Audio niet beschikbaar. Probeer opnieuw.", "\xC1udio indispon\xEDvel. Tente novamente.", "\u0635\u062F\u0627 \u0628\u0627\u0632 \u0646\u0634\u062F. \u062F\u0648\u0628\u0627\u0631\u0647 \u062A\u0644\u0627\u0634 \u06A9\u0646\u06CC\u062F.", "\u0985\u09A1\u09BF\u0993 \u0996\u09CB\u09B2\u09BE \u09AF\u09BE\u09AF\u09BC\u09A8\u09BF\u0964 \u0986\u09AC\u09BE\u09B0 \u099A\u09C7\u09B7\u09CD\u099F\u09BE \u0995\u09B0\u09C1\u09A8\u0964", "Audio tidak tersedia. Cuba lagi.", "Sauti haipatikani. Jaribu tena."],
    missing: ["Bu dua i\xE7in uygulama i\xE7i ses hen\xFCz haz\u0131r de\u011Fil.", "F\xFCr dieses Bittgebet ist noch kein App-Audio verf\xFCgbar.", "In-app audio is not yet available for this prayer.", "\u0417\u0432\u0443\u043A \u044D\u0442\u043E\u0439 \u043C\u043E\u043B\u0438\u0442\u0432\u044B \u0432 \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0438 \u043F\u043E\u043A\u0430 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D.", "\u0635\u0648\u062A \u0647\u0630\u0627 \u0627\u0644\u062F\u0639\u0627\u0621 \u063A\u064A\u0631 \u0645\u062A\u0627\u062D \u062F\u0627\u062E\u0644 \u0627\u0644\u062A\u0637\u0628\u064A\u0642 \u0628\u0639\u062F.", "L\u2019audio de cette invocation n\u2019est pas encore disponible dans l\u2019application.", "El audio de esta s\xFAplica a\xFAn no est\xE1 disponible en la aplicaci\xF3n.", "\u0394\u03B5\u03BD \u03C5\u03C0\u03AC\u03C1\u03C7\u03B5\u03B9 \u03B1\u03BA\u03CC\u03BC\u03B7 \u03AE\u03C7\u03BF\u03C2 \u03B3\u03B9\u03B1 \u03B1\u03C5\u03C4\u03AE \u03C4\u03B7 \u03B4\u03AD\u03B7\u03C3\u03B7 \u03C3\u03C4\u03B7\u03BD \u03B5\u03C6\u03B1\u03C1\u03BC\u03BF\u03B3\u03AE.", "\u5E94\u7528\u5185\u6682\u672A\u63D0\u4F9B\u8FD9\u6BB5\u7948\u7977\u7684\u97F3\u9891\u3002", "\u3053\u306E\u7948\u308A\u306E\u30A2\u30D7\u30EA\u5185\u97F3\u58F0\u306F\u307E\u3060\u3042\u308A\u307E\u305B\u3093\u3002", "\uC774 \uAE30\uB3C4\uC758 \uC571 \uB0B4 \uC624\uB514\uC624\uB294 \uC544\uC9C1 \uC5C6\uC2B5\uB2C8\uB2E4.", "\u0907\u0938 \u0926\u0941\u0906 \u0915\u093E \u0910\u092A \u092E\u0947\u0902 \u0911\u0921\u093F\u092F\u094B \u0905\u092D\u0940 \u0909\u092A\u0932\u092C\u094D\u0927 \u0928\u0939\u0940\u0902 \u0939\u0948\u0964", "\u0627\u0633 \u062F\u0639\u0627 \u06A9\u06CC \u0622\u0688\u06CC\u0648 \u0627\u0628\u06BE\u06CC \u0627\u06CC\u067E \u0645\u06CC\u06BA \u062F\u0633\u062A\u06CC\u0627\u0628 \u0646\u06C1\u06CC\u06BA\u06D4", "L\u2019audio di questa supplica non \xE8 ancora disponibile nell\u2019app.", "Audio doa ini belum tersedia di aplikasi.", "Audio van deze smeekbede is nog niet beschikbaar in de app.", "O \xE1udio desta s\xFAplica ainda n\xE3o est\xE1 dispon\xEDvel no aplicativo.", "\u0635\u062F\u0627\u06CC \u0627\u06CC\u0646 \u062F\u0639\u0627 \u0647\u0646\u0648\u0632 \u062F\u0631 \u0628\u0631\u0646\u0627\u0645\u0647 \u0622\u0645\u0627\u062F\u0647 \u0646\u06CC\u0633\u062A.", "\u098F\u0987 \u09A6\u09CB\u09AF\u09BC\u09BE\u09B0 \u0985\u09A1\u09BF\u0993 \u098F\u0996\u09A8\u0993 \u0985\u09CD\u09AF\u09BE\u09AA\u09C7 \u09A8\u09C7\u0987\u0964", "Audio doa ini belum tersedia dalam aplikasi.", "Sauti ya dua hii bado haipatikani kwenye programu."],
    official: ["Resm\xEE kayd\u0131 a\xE7", "Offizielle Aufnahme \xF6ffnen", "Open official recording", "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u043E\u0444\u0438\u0446\u0438\u0430\u043B\u044C\u043D\u0443\u044E \u0437\u0430\u043F\u0438\u0441\u044C", "\u0627\u0641\u062A\u062D \u0627\u0644\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u0631\u0633\u0645\u064A", "Ouvrir l\u2019enregistrement officiel", "Abrir grabaci\xF3n oficial", "\u0386\u03BD\u03BF\u03B9\u03B3\u03BC\u03B1 \u03B5\u03C0\u03AF\u03C3\u03B7\u03BC\u03B7\u03C2 \u03B7\u03C7\u03BF\u03B3\u03C1\u03AC\u03C6\u03B7\u03C3\u03B7\u03C2", "\u6253\u5F00\u5B98\u65B9\u5F55\u97F3", "\u516C\u5F0F\u97F3\u58F0\u3092\u958B\u304F", "\uACF5\uC2DD \uB179\uC74C \uC5F4\uAE30", "\u0906\u0927\u093F\u0915\u093E\u0930\u093F\u0915 \u0930\u093F\u0915\u0949\u0930\u094D\u0921\u093F\u0902\u0917 \u0916\u094B\u0932\u0947\u0902", "\u0627\u0635\u0644 \u0631\u06CC\u06A9\u0627\u0631\u0688\u0646\u06AF \u06A9\u06BE\u0648\u0644\u06CC\u06BA", "Apri registrazione ufficiale", "Buka rekaman resmi", "Offici\xEBle opname openen", "Abrir grava\xE7\xE3o oficial", "\u0628\u0627\u0632 \u06A9\u0631\u062F\u0646 \u0636\u0628\u0637 \u0631\u0633\u0645\u06CC", "\u0986\u09A8\u09C1\u09B7\u09CD\u09A0\u09BE\u09A8\u09BF\u0995 \u09B0\u09C7\u0995\u09B0\u09CD\u09A1\u09BF\u0982 \u0996\u09C1\u09B2\u09C1\u09A8", "Buka rakaman rasmi", "Fungua rekodi rasmi"]
  };
  function prayerCopy(locale, key) {
    return labels[key]?.[locales.indexOf(locale) >= 0 ? locales.indexOf(locale) : 2] || key;
  }

  // src/prayer-audio-cache.mjs
  async function verifyPrayerResponse(response, record2) {
    if (!response?.ok || !/^audio\//.test(response.headers.get("content-type") || "")) throw Error("Invalid prayer audio");
    const bytes = await response.arrayBuffer();
    if (bytes.byteLength !== record2.bytes) throw Error("Incomplete prayer audio");
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)), (b) => b.toString(16).padStart(2, "0")).join("");
    if (hash !== record2.sha256) throw Error("Prayer recording changed");
    return bytes;
  }
  async function loadPrayerBytes(record2, { cache = null, fetcher = fetch, signal } = {}) {
    const cached = await cache?.match(record2.path);
    if (cached) {
      try {
        return await verifyPrayerResponse(cached, record2);
      } catch {
        await cache.delete(record2.path);
      }
    }
    return verifyPrayerResponse(await fetcher(record2.path, { signal }), record2);
  }

  // src/dua-practice-core.mjs
  function validExcerpt(value, duration) {
    return !!value && Number.isFinite(duration) && duration > 0 && Number.isFinite(value.start) && Number.isFinite(value.end) && value.start >= 0 && value.end <= duration && value.end - value.start >= 0.2;
  }
  function validPrayerPreferences(value) {
    return !!value && Number.isInteger(value.repeat) && value.repeat >= 1 && value.repeat <= 99 && Number.isFinite(value.speed) && value.speed >= 0.5 && value.speed <= 2 && Number.isFinite(value.wait) && value.wait >= 0 && value.wait <= 60;
  }
  function restorePrayerState(value, hash) {
    const defaults = { repeat: 1, speed: 1, wait: 0, clips: [], method: "sequential", partRepeat: 1, combineRepeat: 0, tourRepeat: 0 };
    if (!value || value.hash !== hash || !validPrayerPreferences(value)) return defaults;
    const count = (v, fallback) => Number.isInteger(v) && v >= 0 && v <= 99 ? v : fallback;
    return { ...defaults, repeat: value.repeat, speed: value.speed, wait: value.wait, method: value.method === "cumulative" ? "cumulative" : "sequential", partRepeat: count(value.partRepeat, value.repeat), combineRepeat: count(value.combineRepeat, 0), tourRepeat: count(value.tourRepeat, 0), clips: Array.isArray(value.clips) ? value.clips.filter((c) => c && Number.isFinite(c.start) && Number.isFinite(c.end) && c.start >= 0 && c.end - c.start >= 0.2 && typeof c.name === "string" && c.name.length <= 80).slice(0, 50) : [] };
  }
  function pcmExcerptWav(buffer, range) {
    return pcmRangesWav(buffer, [range]);
  }
  function checkedRanges(ranges, duration = Infinity) {
    if (!Array.isArray(ranges) || ranges.length === 0 || ranges.length > 50) throw Error("Invalid prayer ranges");
    let end = 0;
    return ranges.map((range) => {
      if (!range || !Number.isFinite(range.start) || !Number.isFinite(range.end) || range.start < end || range.end - range.start < 0.2 || range.end > duration) throw Error("Invalid or overlapping prayer ranges");
      end = range.end;
      return { ...range };
    });
  }
  function pcmRangesWav(buffer, ranges) {
    if (!Number.isFinite(buffer.duration) || buffer.duration <= 0) throw Error("Invalid prayer recording");
    const selected = checkedRanges(ranges, buffer.duration);
    const channels = buffer.numberOfChannels, rate = buffer.sampleRate;
    const bounds = selected.map((range) => [Math.round(range.start * rate), Math.min(buffer.length, Math.round(range.end * rate))]);
    const frames = bounds.reduce((sum, [from, to]) => sum + to - from, 0), dataBytes = frames * channels * 2;
    const bytes = new ArrayBuffer(44 + dataBytes), view = new DataView(bytes);
    const str = (at2, s) => {
      for (let i = 0; i < s.length; i++) view.setUint8(at2 + i, s.charCodeAt(i));
    };
    str(0, "RIFF");
    view.setUint32(4, 36 + dataBytes, true);
    str(8, "WAVE");
    str(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channels, true);
    view.setUint32(24, rate, true);
    view.setUint32(28, rate * channels * 2, true);
    view.setUint16(32, channels * 2, true);
    view.setUint16(34, 16, true);
    str(36, "data");
    view.setUint32(40, dataBytes, true);
    const tracks = Array.from({ length: channels }, (_, c) => buffer.getChannelData(c));
    let at = 44;
    for (const [from, to] of bounds) for (let f = from; f < to; f++) for (const track of tracks) {
      const sample = Math.max(-1, Math.min(1, track[f]));
      view.setInt16(at, Math.round(sample * (sample < 0 ? 32768 : 32767)), true);
      at += 2;
    }
    return bytes;
  }
  function validPrayerStudyPreferences(value) {
    return !!value && ["sequential", "cumulative"].includes(value.method) && ["partRepeat", "combineRepeat", "tourRepeat"].every((key) => Number.isInteger(value[key]) && value[key] >= 0 && value[key] <= 99) && Number.isFinite(value.speed) && value.speed >= 0.5 && value.speed <= 2 && Number.isFinite(value.wait) && value.wait >= 0 && value.wait <= 60;
  }
  function buildPrayerStudyPlan(ranges, preferences) {
    const selected = checkedRanges(ranges);
    if (!validPrayerStudyPreferences(preferences)) throw Error("Invalid prayer study settings");
    const { method, partRepeat, combineRepeat, tourRepeat } = preferences;
    const tours = Math.max(1, tourRepeat), partTotal = Math.max(1, partRepeat);
    return (function* () {
      for (let tour = 1; tour <= tours; tour++) for (let partIndex = 0; partIndex < selected.length; partIndex++) {
        for (let current = 1; current <= partTotal; current++) yield { ranges: [selected[partIndex]], phase: "part", partIndex, current, total: partTotal, tour, tours };
        if (method === "cumulative" && combineRepeat > 0 && partIndex > 0) for (let current = 1; current <= combineRepeat; current++) yield { ranges: selected.slice(0, partIndex + 1), phase: "combine", partIndex, current, total: combineRepeat, tour, tours };
      }
    })();
  }
  var PrayerPlayer = class {
    constructor({ audio, prepare, preparePlan, schedule = (fn, delay) => globalThis.setTimeout(fn, delay), unschedule = (id) => globalThis.clearTimeout(id), onState = () => {
    } }) {
      Object.assign(this, { audio, prepare, preparePlan, schedule, unschedule, onState });
      this.token = 0;
      this.timer = null;
      this.active = false;
      this.from = 0;
    }
    stop() {
      this.token++;
      this.active = false;
      if (this.timer !== null) this.unschedule(this.timer);
      this.timer = null;
      this.audio.onended = null;
      this.audio.onerror = null;
      this.audio.onpause = null;
      this.audio.pause();
      this.onState("stopped");
    }
    interrupt() {
      if (!this.active) return;
      this.stop();
      this.onState("interrupted");
    }
    async play(range, preferences) {
      if (!validPrayerPreferences(preferences)) {
        this.stop();
        throw Error("Invalid prayer settings");
      }
      const steps = (function* () {
        for (let current = 1; current <= preferences.repeat; current++) yield { ranges: range ? [range] : [], phase: range ? "part" : "full", partIndex: 0, current, total: preferences.repeat, tour: 1, tours: 1 };
      })();
      return this._playSteps(steps, preferences, (_, isCurrent) => this.prepare(range, isCurrent));
    }
    async playPlan(ranges, preferences) {
      let steps;
      try {
        steps = buildPrayerStudyPlan(ranges, preferences);
        if (typeof this.preparePlan !== "function") throw Error("Prayer study audio preparation is unavailable");
      } catch (error) {
        this.stop();
        throw error;
      }
      return this._playSteps(steps, preferences, (step, isCurrent) => this.preparePlan(step.ranges, isCurrent));
    }
    async _playSteps(steps, preferences, prepare) {
      this.stop();
      const token = this.token;
      this.active = true;
      let sourceKey = null, source, stepNumber = 0, pending;
      const fail = (error) => {
        if (token === this.token) {
          this.stop();
          this.onState("error", error);
        }
      };
      const run = async () => {
        if (token !== this.token) return;
        const next = pending || steps.next();
        pending = null;
        if (next.done) {
          this.active = false;
          this.audio.onended = null;
          this.audio.onerror = null;
          this.audio.onpause = null;
          this.onState("complete");
          return;
        }
        const step = next.value, number = ++stepNumber, key = JSON.stringify(step.ranges.map((r) => [r.start, r.end]));
        const isCurrent = () => token === this.token && number === stepNumber;
        this.onState("loading", step);
        if (key !== sourceKey) {
          source = await prepare(step, isCurrent);
          if (!isCurrent()) return;
          sourceKey = key;
          this.audio.src = source;
        }
        if (!isCurrent()) return;
        this.from = step.ranges[0]?.start || 0;
        this.audio.currentTime = 0;
        this.audio.playbackRate = preferences.speed;
        this.audio.preservesPitch = true;
        this.audio.webkitPreservesPitch = true;
        this.audio.mozPreservesPitch = true;
        let ended = false, started = false;
        this.audio.onpause = () => {
          if (isCurrent() && started && !ended && this.audio.paused && !this.audio.ended) this.interrupt();
        };
        this.audio.onerror = () => {
          if (isCurrent()) fail();
        };
        this.audio.onended = () => {
          if (!isCurrent() || ended) return;
          ended = true;
          this.audio.onended = null;
          const following = steps.next();
          if (following.done) {
            this.active = false;
            this.audio.onerror = null;
            this.audio.onpause = null;
            this.onState("complete", step);
            return;
          }
          pending = following;
          this.onState("waiting", step);
          this.timer = this.schedule(() => {
            this.timer = null;
            return run().catch(fail);
          }, preferences.wait * 1e3);
        };
        await this.audio.play();
        started = true;
        if (isCurrent() && !ended) this.onState("playing", step);
      };
      try {
        await run();
      } catch (error) {
        fail(error);
      }
    }
  };

  // src/dua-word-selection.mjs
  var prayerWords = (text) => String(text || "").trim().split(/\s+/u).filter(Boolean);
  function validPrayerTextPart(part, count) {
    return !!part && Number.isInteger(part.wordFrom) && Number.isInteger(part.wordTo) && part.wordFrom >= 0 && part.wordTo >= part.wordFrom && part.wordTo < count;
  }
  function prayerPartText(words, part) {
    return validPrayerTextPart(part, words.length) ? words.slice(part.wordFrom, part.wordTo + 1).join(" ") : "";
  }
  function restorePrayerTextParts(value, text, hash) {
    if (value?.text !== text || !Array.isArray(value.textParts)) return [];
    const words = prayerWords(text), parts = [];
    for (const part of value.textParts.slice(0, 50)) if (validPrayerTextPart(part, words.length) && !parts.some((p) => p.wordFrom <= part.wordTo && part.wordFrom <= p.wordTo)) parts.push({ ...part, name: String(part.name || "").slice(0, 80) });
    return parts.sort((a, b) => a.wordFrom - b.wordFrom).map((part) => {
      if (hash !== void 0 && value.hash !== hash) {
        const { start, end, ...textPart } = part;
        return textPart;
      }
      return part;
    });
  }
  function mountPrayerWords(root, text, { onChange = () => {
  } } = {}) {
    const words = prayerWords(text);
    let selected = null, used = [], drag = null, frame = null, closed = false;
    root.className = "prayerWords";
    root.dir = "rtl";
    root.lang = "ar";
    root.setAttribute("aria-label", "Dua");
    const buttons = words.map((word, index) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "prayerWord";
      b.textContent = word;
      b.dataset.word = index;
      b.setAttribute("aria-pressed", "false");
      root.append(b, document.createTextNode(" "));
      return b;
    });
    const isUsed = (index) => used.some((p) => index >= p.wordFrom && index <= p.wordTo);
    function paint() {
      buttons.forEach((b, i) => {
        b.classList.toggle("assigned", isUsed(i));
        b.classList.toggle("selected", !!selected && i >= selected.wordFrom && i <= selected.wordTo);
        b.setAttribute("aria-pressed", String(!!selected && i >= selected.wordFrom && i <= selected.wordTo));
      });
      onChange(selected);
    }
    function choose(a, b) {
      const from = Math.min(a, b), to = Math.max(a, b);
      if (buttons.some((_, i) => i >= from && i <= to && isUsed(i))) return;
      selected = { wordFrom: from, wordTo: to };
      paint();
    }
    const hit = (x, y) => root.ownerDocument.elementFromPoint(x, y)?.closest?.(".prayerWord");
    function selectAt(x, y) {
      const target = hit(x, y);
      if (target && root.contains(target)) choose(drag.anchor, Number(target.dataset.word));
    }
    function tick() {
      if (!drag || closed) return;
      const area = root.closest(".dd-body") || root.closest(".dua-detail-body") || root.parentElement;
      let scroller = area;
      while (scroller && scroller.scrollHeight <= scroller.clientHeight + 1) scroller = scroller.parentElement;
      if (scroller) {
        const rect = scroller.getBoundingClientRect(), margin = 55;
        const dy = drag.y < rect.top + margin ? -12 : drag.y > rect.bottom - margin ? 12 : 0;
        if (dy) {
          scroller.scrollTop += dy;
          selectAt(drag.x, Math.min(rect.bottom - 8, Math.max(rect.top + 8, drag.y)));
        }
      }
      frame = requestAnimationFrame(tick);
    }
    const down = (e) => {
      const target = e.target.closest(".prayerWord");
      if (!target || isUsed(Number(target.dataset.word))) return;
      const index = Number(target.dataset.word);
      drag = { id: e.pointerId, anchor: index, x: e.clientX, y: e.clientY };
      root.setPointerCapture?.(e.pointerId);
      choose(index, index);
      e.preventDefault();
      frame = requestAnimationFrame(tick);
    };
    const move = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      drag.x = e.clientX;
      drag.y = e.clientY;
      selectAt(e.clientX, e.clientY);
      e.preventDefault();
    };
    const up = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      drag = null;
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
    };
    root.addEventListener("pointerdown", down);
    root.addEventListener("pointermove", move);
    root.addEventListener("pointerup", up);
    root.addEventListener("pointercancel", up);
    root.addEventListener("click", (e) => {
      if (e.detail !== 0) return;
      const target = e.target.closest(".prayerWord");
      if (target) {
        const i = Number(target.dataset.word);
        choose(selected?.wordFrom ?? i, i);
      }
    });
    return { words, getSelection: () => selected ? { ...selected } : null, clear() {
      selected = null;
      paint();
    }, setUsed(parts) {
      used = parts.filter((p) => validPrayerTextPart(p, words.length));
      selected = null;
      paint();
    }, close() {
      closed = true;
      drag = null;
      if (frame !== null) cancelAnimationFrame(frame);
      root.removeEventListener("pointerdown", down);
      root.removeEventListener("pointermove", move);
      root.removeEventListener("pointerup", up);
      root.removeEventListener("pointercancel", up);
    } };
  }

  // src/dua-study-ui.mjs
  function mountPrayerStudy({ container, item, saved: saved2, preferences, copy, globalText: globalText2, save, audio }) {
    const local2 = (tr, en) => copy(tr, en);
    let parts = restorePrayerTextParts(saved2, item.ar, item.recording?.sha256 || "text-only-v1"), clips = preferences.clips.map((c) => ({ ...c })), undo = [], textIndex = 0, textMode = false;
    const section = document.createElement("section");
    section.className = "prayerStudy";
    container.append(section);
    const heading = document.createElement("h3");
    heading.textContent = local2("B\xF6lerek ezberle", "Learn in parts");
    section.append(heading);
    const help = document.createElement("p");
    help.className = "prayerHelp";
    help.textContent = local2("Duay\u0131 b\xF6l\u2019e bas; istedi\u011Fin kelimeleri parma\u011F\u0131nla i\u015Faretleyip bir par\xE7a olu\u015Ftur. Olu\u015Fan par\xE7alar gri g\xF6r\xFCn\xFCr. Sesli \xE7al\u0131\u015Fmada kayd\u0131 dinleyerek her par\xE7an\u0131n ba\u015Flang\u0131\xE7 ve biti\u015Fini de i\u015Faretle.", "Open Split prayer, select words and create a part. Assigned words turn gray. To study with audio, listen and mark the start and end of each part.");
    section.append(help);
    const feedback = document.createElement("p");
    feedback.className = "prayerStatus";
    feedback.setAttribute("role", "status");
    section.append(feedback);
    const editor = document.createElement("details"), summary = document.createElement("summary");
    summary.textContent = local2("Duay\u0131 b\xF6l", "Split prayer");
    editor.className = "prayerClips";
    editor.append(summary);
    section.append(editor);
    const wordRoot = document.createElement("div");
    editor.append(wordRoot);
    const selection = document.createElement("p");
    selection.className = "prayerSelectedText";
    editor.append(selection);
    const words = mountPrayerWords(wordRoot, item.ar, { onChange: (p) => {
      selection.textContent = p ? prayerPartText(item.ar.trim().split(/\s+/u), p) : "";
    } });
    const clear = button(local2("Se\xE7imi kald\u0131r", "Clear selection"), () => words.clear());
    editor.append(clear);
    const markers = document.createElement("div");
    markers.className = "prayerGrid prayerMarkers";
    editor.append(markers);
    const bounds = {};
    for (const key of ["start", "end"]) {
      const field = document.createElement("div");
      field.className = "prayerBoundary";
      const label = local2(key === "start" ? "Ba\u015Flang\u0131c\u0131 i\u015Faretle" : "Biti\u015Fi i\u015Faretle", key === "start" ? "Mark start" : "Mark end");
      const mark = button(label, () => {
        bounds[key].value = audio?.position().toFixed(2) || "0";
      });
      const input = document.createElement("input");
      input.type = "number";
      input.min = 0;
      input.step = 0.01;
      input.value = 0;
      input.setAttribute("aria-label", label + " (s)");
      bounds[key] = input;
      field.append(mark, input);
      markers.append(field);
    }
    markers.hidden = !audio;
    for (const key of ["start", "end"]) {
      const nudge = document.createElement("div");
      nudge.className = "prayerFineTune";
      for (const delta of [-0.1, 0.1]) {
        const b = button(delta < 0 ? local2("\u2212 0,1 sn", "\u2212 0.1 s") : local2("+ 0,1 sn", "+ 0.1 s"), () => {
          const current = Number(bounds[key].value);
          bounds[key].value = Math.min(audio?.duration() || Infinity, Math.max(0, (Number.isFinite(current) ? current : 0) + delta)).toFixed(2);
        });
        b.setAttribute("aria-label", local2(key === "start" ? "Ba\u015Flang\u0131\xE7" : "Biti\u015F", key === "start" ? "Start" : "End") + " " + (delta < 0 ? "\u2212" : "+") + " 0.1 " + local2("saniye", "seconds"));
        nudge.append(b);
      }
      bounds[key].after(nudge);
    }
    const audition = button(local2("\u25B6 Se\xE7ti\u011Fim ses aral\u0131\u011F\u0131n\u0131 dene", "\u25B6 Preview selected audio"), () => {
      const p = { start: Number(bounds.start.value), end: Number(bounds.end.value), name: local2("Par\xE7a \xF6nizleme", "Part preview") };
      if (audio && validExcerpt(p, audio.duration())) audio.playOne(p);
      else feedback.textContent = local2("\xD6nce duay\u0131 dinle ve en az 0,2 saniyelik bir ba\u015Flang\u0131\xE7\u2013biti\u015F se\xE7.", "Listen to the recording first and choose a start and end at least 0.2 seconds apart.");
    });
    audition.hidden = !audio;
    editor.append(audition);
    const carry = button(local2("Son par\xE7an\u0131n bitti\u011Fi yerden devam et", "Continue from the last part\u2019s end"), () => {
      const last = parts.at(-1);
      if (Number.isFinite(last?.end)) {
        bounds.start.value = last.end.toFixed(2);
        bounds.end.value = last.end.toFixed(2);
      } else feedback.textContent = local2("\xD6nce son par\xE7an\u0131n ses biti\u015Fini ayarla.", "Set the last part\u2019s audio end first.");
    });
    carry.hidden = !audio;
    editor.append(carry);
    const title = document.createElement("input");
    title.maxLength = 80;
    title.placeholder = local2("Par\xE7a ad\u0131 (iste\u011Fe ba\u011Fl\u0131)", "Part name (optional)");
    title.setAttribute("aria-label", title.placeholder);
    editor.append(title);
    editor.append(button(local2("Par\xE7ay\u0131 olu\u015Ftur", "Create part"), () => {
      const selected = words.getSelection();
      if (!selected) {
        feedback.textContent = local2("\xD6nce metinde istedi\u011Fin kelimeleri i\u015Faretle.", "First select the words in the text.");
        return;
      }
      if (parts.length >= 50) {
        feedback.textContent = local2("En fazla 50 par\xE7a kaydedebilirsin.", "You can save up to 50 parts.");
        return;
      }
      snapshot();
      const p = { ...selected, name: title.value.trim() || local2("Par\xE7a ", "Part ") + (parts.length + 1) };
      const range = { start: Number(bounds.start.value), end: Number(bounds.end.value) };
      if (audio && validExcerpt(range, audio.duration())) Object.assign(p, range);
      parts.push(p);
      parts.sort((a, b) => a.wordFrom - b.wordFrom);
      title.value = "";
      words.setUsed(parts);
      const stored = remember();
      render();
      if (stored !== false) feedback.textContent = audio && !validExcerpt(p, audio.duration()) ? local2("Metin par\xE7as\u0131 kaydedildi. Sesli \xE7al\u0131\u015Fmak i\xE7in bu par\xE7an\u0131n saniyelerini ayarla.", "Text part saved. Set this part\u2019s seconds to study with audio.") : local2("Par\xE7a kaydedildi. Sonraki b\xF6l\xFCm\xFC se\xE7ebilirsin.", "Part saved. Select the next section.");
    }));
    const undoButton = button(local2("Geri al", "Undo"), () => {
      const state = undo.pop();
      if (!state) return;
      audio?.stop();
      parts = state.parts;
      clips = state.clips;
      words.setUsed(parts);
      remember();
      render();
    });
    section.append(undoButton);
    const list = document.createElement("div");
    list.className = "prayerPartList";
    section.append(list);
    const plan = document.createElement("div");
    plan.className = "prayerStudySettings";
    section.append(plan);
    const methodLabel = document.createElement("label");
    methodLabel.textContent = local2("\xC7al\u0131\u015Fma \u015Fekli", "Study method");
    const method = document.createElement("select");
    method.setAttribute("aria-label", methodLabel.textContent);
    for (const [value, label] of [["sequential", local2("Par\xE7a par\xE7a tekrar", "Repeat each part")], ["cumulative", local2("1+2 ile h\u0131fz", "1+2 memorization")]]) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      method.append(option);
    }
    method.value = preferences.method || "sequential";
    methodLabel.append(method);
    plan.append(methodLabel);
    const fields = {};
    const grid = document.createElement("div");
    grid.className = "prayerGrid";
    grid.hidden = !audio;
    plan.append(grid);
    for (const [key, label, defaultValue] of [["tourRepeat", globalText2("repeat_range_count"), 0], ["partRepeat", local2("Par\xE7a tekrar say\u0131s\u0131", "Part repeats"), preferences.repeat], ["combineRepeat", globalText2("repeat_combine_count"), 0]]) {
      const labelEl = document.createElement("label");
      labelEl.textContent = label;
      const input = document.createElement("input");
      input.type = "number";
      input.min = 0;
      input.max = 99;
      input.step = 1;
      input.value = preferences[key] ?? defaultValue;
      input.setAttribute("aria-label", label);
      fields[key] = input;
      labelEl.append(input);
      grid.append(labelEl);
    }
    const countHelp = document.createElement("small");
    countHelp.className = "prayerHelp";
    countHelp.textContent = audio ? local2("Par\xE7a say\u0131s\u0131 her par\xE7aya uygulan\u0131r. Birle\u015Ftirme say\u0131s\u0131 1+2, sonra 1+2+3 i\xE7indir; 0 kapal\u0131d\u0131r. T\xFCm \xE7al\u0131\u015Fma say\u0131s\u0131, b\xFCt\xFCn program bitince ba\u015Fa d\xF6ner; 0 ve 1 tek turdur.", "Part repeats apply to each part. Combine repeats apply to 1+2, then 1+2+3; 0 turns combining off. Whole-study repeats restart the completed program; 0 and 1 both mean one tour.") : local2("Bu duan\u0131n uygulama i\xE7i sesi hen\xFCz yok. Olu\u015Fturdu\u011Fun metin par\xE7alar\u0131n\u0131 gizleyip g\xF6stererek ve Sonraki\u2019ye basarak kendin okuyabilirsin.", "In-app audio is not available for this prayer yet. Read your text parts yourself, hide or reveal them and move on with Next.");
    plan.append(countHelp);
    const play = button(local2("\u25B6 Par\xE7alar\u0131 sesli \xE7al\u0131\u015F", "\u25B6 Study parts with audio"), () => {
      const ranges = chosenRanges();
      if (!audio || !ranges || !ranges.length) {
        feedback.textContent = local2("Her par\xE7an\u0131n ses ba\u015Flang\u0131c\u0131n\u0131 ve biti\u015Fini, kayd\u0131 dinleyerek ayarla.", "Set the audio start and end of every part while listening.");
        return;
      }
      const prefs = read();
      if (!prefs) {
        feedback.textContent = local2("Tekrar say\u0131lar\u0131 0\u201399 aras\u0131nda tam say\u0131 olmal\u0131.", "Repeat counts must be whole numbers between 0 and 99.");
        return;
      }
      remember();
      audio.playPlan(ranges, prefs);
    });
    play.classList.add("prayerPrimary");
    plan.append(play);
    play.hidden = !audio;
    const textPlay = button(local2("Metinle \xE7al\u0131\u015F", "Study the text"), () => {
      if (!parts.length) return;
      audio?.stop();
      textMode = true;
      textIndex = 0;
      renderText();
    });
    plan.append(textPlay);
    const reader = document.createElement("div");
    reader.className = "prayerTextPractice";
    reader.hidden = true;
    section.append(reader);
    const readerTitle = document.createElement("strong"), readerText = document.createElement("p");
    readerText.dir = "rtl";
    readerText.lang = "ar";
    reader.append(readerTitle, readerText);
    const toggle = button(local2("Gizle / g\xF6ster", "Hide / show"), () => {
      readerText.hidden = !readerText.hidden;
    });
    const previous = button(local2("\xD6nceki", "Previous"), () => {
      textIndex = Math.max(0, textIndex - 1);
      renderText();
    }), next = button(local2("Sonraki", "Next"), () => {
      textIndex++;
      renderText();
    });
    reader.append(toggle, previous, next);
    function button(label, action) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "prayerAction";
      b.textContent = label;
      b.onclick = action;
      return b;
    }
    function snapshot() {
      undo.push({ parts: parts.map((p) => ({ ...p })), clips: clips.map((p) => ({ ...p })) });
      if (undo.length > 20) undo.shift();
    }
    function read() {
      const p = { method: method.value };
      for (const key of Object.keys(fields)) {
        const n = Number(fields[key].value);
        if (!Number.isInteger(n) || n < 0 || n > 99) return null;
        p[key] = n;
      }
      return p;
    }
    function remember() {
      audio?.stop();
      const result = save(getState());
      if (result === false) feedback.textContent = local2("De\u011Fi\u015Fiklik bu cihazda saklanamad\u0131. Ekran\u0131 kapatmadan \xF6nce cihaz\u0131n depolama alan\u0131n\u0131 kontrol et.", "Could not save this change on your device. Check available storage before closing.");
      return result;
    }
    function getState() {
      return { text: item.ar, textParts: parts.map((p) => ({ ...p })), clips: clips.map((p) => ({ ...p })), ...read() || {} };
    }
    function chosenRanges() {
      const rows = parts.length ? parts : clips;
      const ranges = rows.map((p, i) => ({ start: p.start, end: p.end, name: p.name || local2("Par\xE7a ", "Part ") + (i + 1) }));
      return ranges.every((p, i) => validExcerpt(p, audio?.duration() || Number.MAX_VALUE) && (!i || ranges[i - 1].end <= p.start)) ? ranges : null;
    }
    function render() {
      list.replaceChildren();
      undoButton.hidden = !undo.length;
      words.setUsed(parts);
      textPlay.disabled = !parts.length;
      play.disabled = !(parts.length || clips.length);
      reader.hidden = !textMode || !parts.length;
      for (const [p, index] of parts.map((p2, i) => [p2, i])) {
        const card = document.createElement("article");
        card.className = "prayerPartCard";
        card.dataset.part = index;
        const name = document.createElement("input");
        name.value = p.name;
        name.maxLength = 80;
        name.setAttribute("aria-label", local2("Par\xE7a ad\u0131", "Part name") + " " + (index + 1));
        name.onchange = () => {
          p.name = name.value.trim() || local2("Par\xE7a ", "Part ") + (index + 1);
          remember();
        };
        const text = document.createElement("p");
        text.dir = "rtl";
        text.lang = "ar";
        text.className = "prayerPartArabic";
        text.textContent = prayerPartText(words.words, p);
        card.append(name, text);
        if (audio) {
          const timeFields = document.createElement("div");
          timeFields.className = "prayerMarkers prayerGrid";
          for (const key of ["start", "end"]) {
            const label = document.createElement("label");
            label.textContent = local2(key === "start" ? "Ba\u015Flang\u0131\xE7 (sn)" : "Biti\u015F (sn)", key === "start" ? "Start (s)" : "End (s)");
            const input = document.createElement("input");
            input.type = "number";
            input.step = 0.01;
            input.min = 0;
            input.value = Number.isFinite(p[key]) ? p[key] : "";
            input.setAttribute("aria-label", p.name + " \xB7 " + label.textContent);
            input.onchange = () => {
              p[key] = input.value === "" ? void 0 : Number(input.value);
              remember();
            };
            label.append(input);
            timeFields.append(label);
          }
          card.append(timeFields);
          card.append(button(local2("\u25B6 Bu par\xE7a", "\u25B6 This part"), () => {
            if (validExcerpt(p, audio.duration() || Number.MAX_VALUE)) audio.playOne(p);
            else feedback.textContent = local2("\xD6nce duay\u0131 a\xE7, sonra bu par\xE7an\u0131n saniyelerini ayarla.", "Open the recording first, then set this part\u2019s seconds.");
          }));
        }
        card.append(button(local2("Kald\u0131r", "Remove"), () => {
          snapshot();
          audio?.stop();
          parts = parts.filter((x) => x !== p);
          remember();
          render();
        }));
        list.append(card);
      }
      for (const clip of clips) {
        const row = document.createElement("div");
        row.className = "prayerClipRow";
        const name = document.createElement("input");
        name.value = clip.name;
        name.maxLength = 80;
        name.setAttribute("aria-label", local2("Kay\u0131tl\u0131 c\xFCmle ad\u0131", "Saved phrase name"));
        name.onchange = () => {
          clip.name = name.value.trim() || local2("C\xFCmle", "Phrase");
          remember();
        };
        row.append(name, button("\u25B6 " + clip.start.toFixed(1) + "\u2013" + clip.end.toFixed(1), () => audio?.playOne(clip)), button("\xD7", () => {
          snapshot();
          clips = clips.filter((p) => p !== clip);
          remember();
          render();
        }));
        list.append(row);
      }
      if (!parts.length && !clips.length) {
        const empty = document.createElement("p");
        empty.className = "prayerHelp";
        empty.textContent = local2("Hen\xFCz par\xE7a yok. Duay\u0131 b\xF6l b\xF6l\xFCm\xFCnden ilk par\xE7an\u0131 olu\u015Ftur.", "No parts yet. Open Split prayer to create your first part.");
        list.append(empty);
      }
      if (textMode && parts.length) renderText();
    }
    function renderText() {
      if (!parts.length) {
        reader.hidden = true;
        return;
      }
      const cumulative = method.value === "cumulative", steps = cumulative ? parts.flatMap((_, i) => i ? [{ from: i, to: i }, { from: 0, to: i }] : [{ from: 0, to: 0 }]) : parts.map((_, i) => ({ from: i, to: i }));
      textIndex = Math.max(0, Math.min(steps.length - 1, textIndex));
      const step = steps[textIndex];
      reader.hidden = false;
      readerTitle.textContent = local2("Metin \xE7al\u0131\u015Fmas\u0131", "Text practice") + " \xB7 " + (step.from + 1) + (step.to === step.from ? "" : "\u2013" + (step.to + 1));
      readerText.textContent = parts.slice(step.from, step.to + 1).map((p) => prayerPartText(words.words, p)).join(" ");
      readerText.hidden = false;
      previous.disabled = textIndex === 0;
      next.disabled = textIndex === steps.length - 1;
    }
    method.onchange = () => {
      remember();
      if (textMode) {
        textIndex = 0;
        renderText();
      }
    };
    for (const input of Object.values(fields)) input.onchange = () => remember();
    render();
    return { getState, close: () => words.close(), onProgress(data) {
      if (!data?.ranges) return;
      feedback.textContent = local2(data.phase === "combine" ? "Birle\u015Ftirme" : "Par\xE7a", data.phase === "combine" ? "Combine" : "Part") + " " + (data.partIndex + 1) + " \xB7 " + data.current + "/" + data.total + " \xB7 " + local2("Tur ", "Tour ") + data.tour + "/" + data.tours;
      list.querySelectorAll(".prayerPartCard").forEach((node, i) => node.classList.toggle("active", data.phase === "combine" ? i <= data.partIndex : i === data.partIndex));
    } };
  }

  // src/dua-media-session.mjs
  function bindPrayerMediaSession({ gateway, title, reader, play, interrupt, stop }) {
    let closed = false, restart = null;
    const owner = gateway?.claim?.({
      metadata: { title, artist: reader || "Elifa Mushaf", album: "Elifa Mushaf \xB7 Dua" },
      handlers: { play: () => {
        if (!closed && restart) play(restart);
      }, pause: () => {
        if (!closed) interrupt();
      }, stop: () => {
        if (!closed) stop();
      } }
    });
    return {
      remember(request) {
        restart = request;
      },
      update(state) {
        if (!closed) owner?.update?.(state === "playing" ? "playing" : state === "stopped" || state === "complete" || state === "error" ? "none" : "paused");
      },
      close() {
        if (closed) return;
        closed = true;
        restart = null;
        owner?.release?.();
      }
    };
  }
  function createPrayerDecoder({ createContext, onDecoded = () => {
  } }) {
    let closed = false, decoded = null, pending = null, context = null;
    return {
      async decode(bytes) {
        if (closed) throw Error("Closed prayer decoder");
        if (decoded) return decoded;
        if (!pending) pending = (async () => {
          const decoder = createContext();
          context = decoder;
          try {
            const result = await decoder.decodeAudioData(bytes.slice(0));
            if (closed) throw Error("Closed prayer decoder");
            decoded = result;
            onDecoded(result);
            return result;
          } finally {
            if (context === decoder) {
              context = null;
              try {
                await decoder.close();
              } catch {
              }
            }
          }
        })().finally(() => {
          pending = null;
        });
        return pending;
      },
      close() {
        closed = true;
        decoded = null;
        const decoder = context;
        context = null;
        if (decoder) try {
          Promise.resolve(decoder.close()).catch(() => {
          });
        } catch {
        }
      }
    };
  }

  // src/dua-practice.mjs
  var ui = window.elifaPrayerUI;
  if (!ui) throw Error("Prayer screen anchors unavailable");
  var language = () => window.ElifaLocale?.current?.() || "en";
  var t = (key) => prayerCopy(language(), key);
  var local = (tr, en) => language() === "tr" ? tr : en;
  var esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  var globalText = (key) => window.tr?.(key) || key;
  var catalog = prayerCatalog(ui.texts);
  var cacheName = "elifa-dua-audio-v1";
  var activeClose = null;
  function saved() {
    try {
      return ui.storage.get("duaPracticeV1", {});
    } catch {
      return {};
    }
  }
  function persist(id, state) {
    try {
      return ui.storage.set("duaPracticeV1", { ...saved(), [id]: state }) !== false;
    } catch {
      return false;
    }
  }
  async function verifiedBytes(record2, signal) {
    let cache = null;
    try {
      if ("caches" in window) cache = await caches.open(cacheName);
    } catch {
    }
    return loadPrayerBytes(record2, { cache, signal });
  }
  function open(item) {
    activeClose?.();
    window.duaCloseOverlay?.();
    window.stopPlan?.(true);
    const lang = language(), record2 = item.recording, hash = record2?.sha256 || "text-only-v1";
    const original = saved()[item.id] || {}, preferences = restorePrayerState(original, hash);
    let studyUI = null;
    const title = '<h2 class="dd-title">' + esc(item.title) + "</h2>";
    const copy = item.meal?.[lang] || item.meal?.en || item.meal?.tr || "";
    const arabic = '<div class="dd-ar" dir="rtl" lang="ar">' + esc(item.ar) + "</div>";
    const textBlock = item.ar.length > 420 ? '<details class="prayerFullText"><summary>' + esc(local("Tam dua metnini a\xE7", "Open the complete prayer text")) + "</summary>" + arabic + "</details>" : arabic;
    const body = '<div class="prayerText">' + textBlock + "<details><summary>" + esc(ui.translate("dua_okunus")) + '</summary><p class="dd-ok">' + esc(item.ok) + "</p></details><details><summary>" + esc(ui.translate("dua_meal")) + (item.meal?.[lang] ? "" : " \xB7 English") + '</summary><p class="dd-meal">' + esc(copy) + '</p></details></div><div class="prayerPractice"></div>';
    const back = ui.overlay(title, body), box = back.querySelector(".prayerPractice");
    const status = document.createElement("p");
    status.className = "prayerStatus";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    const source = document.createElement("a");
    source.href = item.source;
    source.target = "_blank";
    source.rel = "noopener noreferrer";
    source.textContent = t("source") + " \xB7 " + (item.sourceName || "Diyanet");
    source.className = "prayerSource";
    box.append(source);
    if (record2 && original.hash && original.hash !== hash && (original.textParts?.length || original.clips?.length)) {
      const note = document.createElement("p");
      note.className = "prayerHelp";
      note.textContent = original.text === item.ar ? local("Bu duan\u0131n ses kayd\u0131 de\u011Fi\u015Fti. Metin par\xE7alar\u0131n korunur; eski kayda ait ses saniyelerini yeni okuyu\u015Fu dinleyerek yeniden ayarla.", "This prayer uses a different recording now. Your text parts are kept; listen to the new recording to set their audio boundaries again.") : local("Bu duan\u0131n metni veya ses kayd\u0131 de\u011Fi\u015Fti. \xD6nceki kayda ait par\xE7a s\u0131n\u0131rlar\u0131 yeni kayda uygulanmaz; bu okuyu\u015F i\xE7in par\xE7alar\u0131n\u0131 yeniden ayarla.", "This prayer has a different text or recording now. Earlier boundaries do not apply to the new version; set the parts again for this reading.");
      box.append(note);
    }
    if (item.note === "traditional_prayer" && item.id === "kuran-baslama") {
      const p = document.createElement("p");
      p.className = "prayerHelp";
      p.textContent = local("Diyanet rehberinde, okumaya ba\u015Flarken okunmas\u0131 gelenek h\xE2line gelmi\u015F bir dua olarak aktar\u0131l\u0131r.", "The Diyanet guide describes this as a traditional prayer before recitation.");
      box.append(p);
    }
    if (item.guideSource) {
      const a = document.createElement("a");
      a.href = item.guideSource;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.className = "prayerSource";
      a.textContent = local("Metin ve a\xE7\u0131klama kayna\u011F\u0131", "Text and guidance source");
      box.append(document.createTextNode(" \xB7 "), a);
    }
    if (item.id === "kunut" || item.id === "rabbena") {
      const p = document.createElement("p");
      p.className = "prayerHelp";
      p.textContent = local("Bu kay\u0131t iki duay\u0131 birlikte i\xE7erir. Metin ve ses birlikte g\xF6sterilir.", "This recording contains both supplications; their texts are shown together.");
      box.append(p);
    }
    if (item.guide) {
      const guide = document.createElement("details");
      guide.className = "prayerGuide";
      const heading = document.createElement("summary");
      heading.textContent = item.guideTitle?.[lang] || item.guideTitle?.tr || local("Nas\u0131l yap\u0131l\u0131r?", "How to practice");
      guide.append(heading);
      const ol = document.createElement("ol");
      for (const step of item.guide[lang] || item.guide.en || item.guide.tr) {
        const li = document.createElement("li");
        li.textContent = step;
        ol.append(li);
      }
      guide.append(ol);
      box.append(guide);
    }
    if (!record2) {
      status.textContent = t("missing");
      box.append(status);
      if (item.external) {
        const a = document.createElement("a");
        a.href = item.external;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.className = "prayerAction";
        a.textContent = t("official") + " \xB7 " + (item.externalLabel || "Mi\u015F\xE2r\xEE");
        box.append(a);
      }
      studyUI = mountPrayerStudy({ container: box, item, saved: original, preferences, copy: local, globalText, save: (state) => persist(item.id, { hash, ...preferences, ...state }) });
      const cleanup2 = () => {
        studyUI.close();
        if (activeClose === cleanup2) activeClose = null;
      };
      activeClose = cleanup2;
      back.addEventListener("elifa:dua-close", cleanup2, { once: true });
      return true;
    }
    const sourceNote = document.createElement("p");
    sourceNote.className = "prayerHelp";
    sourceNote.textContent = record2.reader ? record2.reader : local("Diyanet Namaz Portal\u0131 kayd\u0131. Okuyucunun ad\u0131 kaynakta belirtilmiyor.", "Diyanet Prayer Portal recording. The source does not identify the reciter.");
    box.append(sourceNote);
    if (record2.sourceName) {
      const a = document.createElement("a");
      a.href = record2.sourcePage || record2.source;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.className = "prayerSource";
      a.textContent = local("Ses kayna\u011F\u0131", "Audio source") + " \xB7 " + record2.sourceName;
      box.append(a);
    }
    const chapter = record2.kind === "complete-audiobook-chapter", lesson = record2.kind === "teaching-recording", fullCaption = chapter ? local("Dua ve a\xE7\u0131klamas\u0131", "Prayer and explanation") : lesson ? local("Dua \xF6\u011Fretim kayd\u0131", "Prayer teaching recording") : t("full");
    if (chapter) {
      const note = document.createElement("p");
      note.className = "prayerHelp";
      note.textContent = lang === "tr" ? item.audioNoteTR || "Bu sesli kitap b\xF6l\xFCm\xFC, duayla birlikte ba\u015Fl\u0131k ve rivayet a\xE7\u0131klamalar\u0131n\u0131 da i\xE7erir." : item.audioNoteEN || "This audiobook chapter includes the prayer together with headings and narration explanations.";
      box.append(note);
    }
    if (lesson) {
      const note = document.createElement("p");
      note.className = "prayerHelp";
      note.textContent = local("\xD6\u011Fretim kayd\u0131n\u0131n tamam\u0131d\u0131r; duadan \xF6nce k\u0131sa bir giri\u015F bulunur. Par\xE7a s\u0131n\u0131rlar\u0131n\u0131 kayd\u0131 dinleyerek se\xE7ebilirsin.", "The complete teaching recording includes a short introduction before the prayer. Choose phrase boundaries while listening.");
      box.append(note);
    }
    if (!chapter && !lesson && item.audioNoteTR) {
      const note = document.createElement("p");
      note.className = "prayerHelp";
      note.textContent = lang === "tr" ? item.audioNoteTR : item.audioNoteEN;
      box.append(note);
    }
    const controls = document.createElement("div");
    controls.className = "prayerGrid";
    const fields = {};
    for (const [key, label, min, max, step] of [["repeat", globalText("pb_repeat"), 1, 99, 1], ["speed", globalText("pb_speed"), 0.5, 2, 0.05], ["wait", globalText("workflow_wait"), 0, 60, 0.5]]) {
      const field = document.createElement("label");
      field.textContent = label;
      const input = document.createElement("input");
      input.type = "number";
      input.min = min;
      input.max = max;
      input.step = step;
      input.value = preferences[key];
      input.id = "prayer_" + key;
      field.append(input);
      controls.append(field);
      fields[key] = input;
    }
    const full = document.createElement("button");
    full.type = "button";
    full.className = "prayerAction prayerPrimary";
    full.textContent = "\u25B6 " + fullCaption;
    full.id = "prayerPlay";
    const stop = document.createElement("button");
    stop.type = "button";
    stop.className = "prayerAction";
    stop.textContent = "\u25A0";
    stop.setAttribute("aria-label", local("Durdur", "Stop"));
    stop.id = "prayerStop";
    const transport = document.createElement("div");
    transport.className = "prayerTransport";
    transport.append(full, stop);
    const seek = document.createElement("input");
    seek.type = "range";
    seek.min = 0;
    seek.max = 0;
    seek.step = 0.01;
    seek.value = 0;
    seek.disabled = true;
    seek.setAttribute("aria-label", t("full"));
    const selectionLabel = document.createElement("p");
    selectionLabel.className = "prayerSelection";
    selectionLabel.textContent = fullCaption;
    const time = document.createElement("output");
    time.className = "prayerTime";
    time.textContent = "0:00 / 0:00";
    const download = document.createElement("button");
    download.type = "button";
    download.className = "prayerAction";
    download.textContent = t("download");
    download.id = "prayerDownload";
    const removeDownload = document.createElement("button");
    removeDownload.type = "button";
    removeDownload.className = "prayerAction";
    removeDownload.textContent = t("remove");
    removeDownload.setAttribute("aria-label", t("ready") + " \xB7 " + t("remove"));
    removeDownload.hidden = true;
    const offline = document.createElement("div");
    offline.className = "prayerTransport";
    offline.append(download, removeDownload);
    box.append(controls, transport, selectionLabel, seek, time, status, offline);
    const audio = new Audio();
    audio.preload = "none";
    let closed = false, bytes = null, decoded = null, objectUrl = null, duration = 0, range = null, activeRanges = null, mediaSession = null, abort = new AbortController();
    const format = (n) => Math.floor(n / 60) + ":" + String(Math.floor(n % 60)).padStart(2, "0");
    const read = () => ({ repeat: Number(fields.repeat.value), speed: Number(fields.speed.value), wait: Number(fields.wait.value) });
    const remember = () => {
      const p = read();
      if (!validPrayerPreferences(p)) return false;
      const ok = persist(item.id, { hash, ...p, ...studyUI?.getState() || { clips: preferences.clips } });
      if (!ok) status.textContent = local("Bu cihazda kaydedilemedi.", "Could not save on this device.");
      return ok;
    };
    const decoder = createPrayerDecoder({ createContext: () => {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) throw Error("No audio decoder");
      return new AudioContext();
    }, onDecoded: (result) => {
      decoded = result;
      duration = result.duration;
    } });
    const ensureDecoded = () => decoder.decode(bytes);
    async function prepareRanges(ranges, isCurrent) {
      bytes ?? (bytes = await verifiedBytes(record2, abort.signal));
      if (closed || !isCurrent()) throw Error("Closed");
      await ensureDecoded();
      if (closed || !isCurrent()) throw Error("Closed");
      const blob = new Blob([pcmRangesWav(decoded, ranges)], { type: "audio/wav" });
      activeRanges = ranges;
      range = ranges[0];
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      objectUrl = URL.createObjectURL(blob);
      return objectUrl;
    }
    const player = new PrayerPlayer({ audio, prepare: async (selected, isCurrent) => {
      bytes ?? (bytes = await verifiedBytes(record2, abort.signal));
      if (closed || !isCurrent()) throw Error("Closed");
      let blob;
      if (selected) {
        await ensureDecoded();
        seek.max = duration;
        seek.disabled = false;
        if (closed || !isCurrent()) throw Error("Closed");
        blob = new Blob([pcmExcerptWav(decoded, selected)], { type: "audio/wav" });
      } else blob = new Blob([bytes], { type: record2.mime || "audio/mpeg" });
      if (closed || !isCurrent()) throw Error("Closed");
      range = selected;
      activeRanges = selected ? [selected] : null;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      objectUrl = URL.createObjectURL(blob);
      return objectUrl;
    }, preparePlan: prepareRanges, onState: (state, progress) => {
      if (closed) return;
      mediaSession?.update(state);
      full.classList.toggle("playing", state === "playing" && progress?.phase === "full");
      status.textContent = state === "interrupted" ? local("Oynatma duraklat\u0131ld\u0131. Devam etmek i\xE7in yeniden Ba\u015Flat\u2019a bas; se\xE7ili program ba\u015Ftan ba\u015Flar.", "Playback was paused. Press Play again to restart the selected program.") : state === "complete" ? t("complete") : state === "error" ? t("error") : progress ? (state === "waiting" ? t("waiting") + " \xB7 " : "") + progress.current + " / " + progress.total : state === "loading" ? "\u2026" : "";
      status.dataset.state = state;
      if (progress?.ranges?.length) studyUI?.onProgress(progress);
    } });
    function launch(request) {
      if (closed) return;
      mediaSession?.remember(request);
      const pending = request.kind === "plan" ? player.playPlan(request.ranges, request.preferences) : player.play(request.range, request.preferences);
      pending.catch(() => {
        if (!closed) {
          mediaSession?.update("error");
          status.textContent = t("error");
          status.dataset.state = "error";
        }
      });
    }
    mediaSession = bindPrayerMediaSession({ gateway: window.elifaMediaSession, title: item.title, reader: record2.reader, play: launch, interrupt: () => player.interrupt(), stop: () => player.stop() });
    const leavePage = () => player.interrupt();
    window.addEventListener("pagehide", leavePage);
    function cleanup() {
      if (closed) return;
      closed = true;
      studyUI?.close();
      player.stop();
      window.removeEventListener("pagehide", leavePage);
      mediaSession?.close();
      abort.abort();
      audio.removeAttribute("src");
      audio.load();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      decoder.close();
      if (activeClose === cleanup) activeClose = null;
    }
    activeClose = cleanup;
    back.addEventListener("elifa:dua-close", cleanup, { once: true });
    audio.onloadedmetadata = () => {
      const label = activeRanges?.length > 1 ? local("Birle\u015Ftirme", "Combined parts") : range?.name || fullCaption;
      selectionLabel.textContent = label + " \xB7 " + format(audio.duration);
      seek.setAttribute("aria-label", label);
      seek.min = 0;
      seek.max = audio.duration;
      seek.disabled = !Number.isFinite(audio.duration);
      if (!range) duration = audio.duration;
      updateTime();
    };
    function updateTime() {
      if (closed) return;
      seek.value = audio.currentTime;
      time.textContent = format(audio.currentTime) + " / " + format(Number.isFinite(audio.duration) ? audio.duration : 0);
    }
    audio.ontimeupdate = updateTime;
    seek.oninput = () => {
      audio.currentTime = Math.min(audio.duration || 0, Math.max(0, Number(seek.value)));
      updateTime();
    };
    full.onclick = () => {
      const p = read();
      if (!validPrayerPreferences(p)) {
        status.textContent = t("error");
        return;
      }
      remember();
      launch({ kind: "single", range: null, preferences: p });
    };
    stop.onclick = () => player.stop();
    Object.values(fields).forEach((input) => input.onchange = () => {
      player.stop();
      remember();
    });
    async function offlineState() {
      try {
        const cache = await caches.open(cacheName);
        let cached = await cache.match(record2.path);
        if (cached) {
          try {
            await verifyPrayerResponse(cached.clone(), record2);
          } catch {
            await cache.delete(record2.path);
            cached = null;
          }
        }
        if (closed) return;
        download.textContent = cached ? t("ready") : t("download");
        download.disabled = !!cached;
        removeDownload.hidden = !cached;
      } catch {
        download.disabled = true;
      }
    }
    download.onclick = async () => {
      download.disabled = true;
      status.textContent = "\u2026";
      try {
        const data = bytes || await verifiedBytes(record2, abort.signal);
        if (closed) return;
        const cache = await caches.open(cacheName);
        await cache.put(record2.path, new Response(data, { headers: { "Content-Type": record2.mime || "audio/mpeg" } }));
        if (closed) return;
        status.textContent = t("ready");
        await offlineState();
      } catch {
        if (!closed) {
          status.textContent = t("error");
          download.disabled = false;
        }
      }
    };
    removeDownload.onclick = async () => {
      try {
        await (await caches.open(cacheName)).delete(record2.path);
        await offlineState();
      } catch {
        status.textContent = t("error");
      }
    };
    offlineState();
    studyUI = mountPrayerStudy({ container: box, item, saved: original, preferences, copy: local, globalText, save: () => remember(), audio: {
      position() {
        let left = audio.currentTime;
        for (const r of activeRanges || []) {
          const length = r.end - r.start;
          if (left <= length) return r.start + left;
          left -= length;
        }
        return activeRanges?.at(-1)?.end ?? audio.currentTime;
      },
      duration: () => duration,
      stop: () => player.stop(),
      playOne: (clip) => {
        if (!validPrayerPreferences(read())) {
          status.textContent = t("error");
          return;
        }
        remember();
        launch({ kind: "single", range: { ...clip }, preferences: read() });
      },
      playPlan: (ranges, prefs) => {
        if (!validPrayerPreferences(read())) {
          status.textContent = t("error");
          return;
        }
        remember();
        launch({ kind: "plan", ranges: ranges.map((r) => ({ ...r })), preferences: { ...prefs, speed: read().speed, wait: read().wait } });
      }
    } });
    return true;
  }
  window.elifaDuaPractice = {
    label: () => t("tab"),
    openNamaz(index) {
      const item = catalog.find((x) => x.namaz?.includes(index));
      return item ? open(item) : false;
    },
    renderList(container) {
      for (const item of catalog) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "prayerCard";
        const title = document.createElement("strong");
        title.textContent = item.title;
        const sub = document.createElement("span");
        sub.textContent = item.recording ? "\u25B6 " + t("tab") + (item.recording.readerId === "mishary-alafasy" ? " \xB7 Mi\u015F\xE2r\xEE R\xE2\u015Fid el-Af\xE2s\xEE" : "") : t("missing");
        b.append(title, sub);
        b.onclick = () => open(item);
        container.append(b);
      }
    },
    stop() {
      activeClose?.();
    }
  };
})();
