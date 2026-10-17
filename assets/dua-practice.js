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
    }
  ];

  // src/dua-catalog.mjs
  var portal = "https://namaz.diyanet.gov.tr/namaz/#sureler-dualar.html";
  var book = "https://dijital.diyanet.gov.tr/File/Download?id=4061&path=4061_1.pdf";
  var record = (id) => dua_recordings_default.find((r) => r.id === id);
  function prayerCatalog(texts) {
    const item = (id, indices, title) => {
      const rows = indices.map((i) => texts[i]), languages = new Set(rows.flatMap((r) => Object.keys(r.meal || {})));
      return { id, title: title || rows[0].t, ar: rows.map((r) => r.ar).join("\n\n"), ok: rows.map((r) => r.ok).join("\n\n"), meal: Object.fromEntries([...languages].map((l) => [l, rows.map((r) => r.meal?.[l] || r.meal?.en || "").join("\n\n")])), recording: record(id), source: portal, namaz: indices };
    };
    return [item("subhaneke", [0]), item("tahiyyat", [1]), item("salli", [2]), item("barik", [3]), item("kunut", [4, 5], "Kun\xFBt 1\u20132"), item("ament\xFC", [6]), item("rabbena", [7, 8], "Rabben\xE2 dualar\u0131"), {
      id: "ezan",
      title: "Ezan duas\u0131",
      source: portal,
      recording: record("ezan"),
      ar: "\u0627\u064E\u0644\u0644\u0651\u0670\u0647\u064F\u0645\u064E\u0651 \u0631\u064E\u0628\u064E\u0651 \u0647\u0670\u0630\u0650\u0647\u0650 \u0627\u0644\u062F\u064E\u0651\u0639\u0652\u0648\u064E\u0629\u0650 \u0627\u0644\u062A\u064E\u0651\u0627\u0645\u064E\u0651\u0629\u0650 \u0648\u064E\u0627\u0644\u0635\u064E\u0651\u0644\u064E\u0627\u0629\u0650 \u0627\u0644\u0652\u0642\u064E\u0627\u0626\u0650\u0645\u064E\u0629\u0650 \u0622\u062A\u0650 \u0645\u064F\u062D\u064E\u0645\u064E\u0651\u062F\u064B\u0627 \u0627\u0644\u0652\u0648\u064E\u0633\u0650\u064A\u0644\u064E\u0629\u064E \u0648\u064E\u0627\u0644\u0652\u0641\u064E\u0636\u0650\u064A\u0644\u064E\u0629\u064E \u0648\u064E\u0627\u0628\u0652\u0639\u064E\u062B\u0652\u0647\u064F \u0645\u064E\u0642\u064E\u0627\u0645\u064B\u0627 \u0645\u064E\u062D\u0652\u0645\u064F\u0648\u062F\u064B\u0627 \u0627\u0644\u064E\u0651\u0630\u0650\u064A \u0648\u064E\u0639\u064E\u062F\u0652\u062A\u064E\u0647\u064F",
      ok: "All\xE2h\xFCmme Rabbe h\xE2zihid-da\u2018vetit-t\xE2mmeti ves-sal\xE2til-k\xE2imeti, \xE2ti Muhammedenil-ves\xEElete vel-fad\xEElete veb\u2018ash\xFC mak\xE2men mahm\xFBdenillez\xEE va\u2018adteh.",
      meal: { tr: "Allah\u2019\u0131m! Bu eksiksiz davetin ve k\u0131l\u0131nacak namaz\u0131n Rabbi! Muhammed\u2019e vesileyi ve fazileti ver; onu vadetti\u011Fin \xF6v\xFClm\xFC\u015F makama ula\u015Ft\u0131r.", en: "O Allah, Lord of this complete call and the prayer to be established, grant Muhammad the means of nearness and excellence, and raise him to the praised station You promised." }
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
      title: "Yemek sonras\u0131 duas\u0131",
      source: book + "#page=112",
      ar: "\u0627\u0644\u0652\u062D\u064E\u0645\u0652\u062F\u064F \u0644\u0650\u0644\u0651\u0670\u0647\u0650 \u0627\u0644\u064E\u0651\u0630\u0650\u064A \u0623\u064E\u0637\u0652\u0639\u064E\u0645\u064E\u0646\u064E\u0627 \u0648\u064E\u0633\u064E\u0642\u064E\u0627\u0646\u064E\u0627 \u0648\u064E\u062C\u064E\u0639\u064E\u0644\u064E\u0646\u064E\u0627 \u0645\u0650\u0646\u064E \u0627\u0644\u0652\u0645\u064F\u0633\u0652\u0644\u0650\u0645\u0650\u064A\u0646\u064E",
      ok: "Elhamd\xFC lill\xE2hillez\xEE et\u2018amen\xE2 ve sek\xE2n\xE2 ve cealen\xE2 minel-m\xFCslim\xEEn.",
      meal: { tr: "Bizi yediren, i\xE7iren ve M\xFCsl\xFCmanlardan k\u0131lan Allah\u2019a hamdolsun.", en: "Praise belongs to Allah, who fed us, gave us drink, and made us Muslims." }
    }, {
      id: "kuran-baslama",
      title: "Kur\u2019an okumaya ba\u015Flama duas\u0131",
      source: book + "#page=70",
      ar: "\u0627\u0644\u0644\u064E\u0651\u0647\u064F\u0645\u064E\u0651 \u0628\u0650\u0627\u0644\u0652\u062D\u064E\u0642\u0650\u0651 \u0623\u064E\u0646\u0652\u0632\u064E\u0644\u0652\u062A\u064E\u0647\u064F \u0648\u064E\u0628\u0650\u0627\u0644\u0652\u062D\u064E\u0642\u0650\u0651 \u0646\u064E\u0632\u064E\u0644\u064E. \u0627\u0644\u0644\u064E\u0651\u0647\u064F\u0645\u064E\u0651 \u0639\u064E\u0638\u0650\u0651\u0645\u0652 \u0631\u064E\u063A\u0652\u0628\u064E\u062A\u0650\u064A \u0641\u0650\u064A\u0647\u0650 \u0648\u064E\u0627\u062C\u0652\u0639\u064E\u0644\u0652\u0647\u064F \u0646\u064F\u0648\u0631\u064B\u0627 \u0644\u0650\u0628\u064E\u0635\u064E\u0631\u0650\u064A \u0648\u064E\u0634\u0650\u0641\u064E\u0627\u0621\u064B \u0644\u0650\u0635\u064E\u062F\u0652\u0631\u0650\u064A. \u0627\u0644\u0644\u064E\u0651\u0647\u064F\u0645\u064E\u0651 \u0632\u064E\u064A\u0650\u0651\u0646\u0652 \u0628\u0650\u0647\u0650 \u0644\u0650\u0633\u064E\u0627\u0646\u0650\u064A \u0648\u064E\u062C\u064E\u0645\u0650\u0651\u0644\u0652 \u0628\u0650\u0647\u0650 \u0648\u064E\u062C\u0652\u0647\u0650\u064A \u0648\u064E\u0642\u064E\u0648\u0650\u0651 \u0628\u0650\u0647\u0650 \u062C\u064E\u0633\u064E\u062F\u0650\u064A \u0648\u064E\u0627\u0631\u0652\u0632\u064F\u0642\u0652\u0646\u0650\u064A \u062A\u0650\u0644\u064E\u0627\u0648\u064E\u062A\u064E\u0647\u064F \u0639\u064E\u0644\u064E\u0649 \u0637\u064E\u0627\u0639\u064E\u062A\u0650\u0643\u064E \u0622\u0646\u064E\u0627\u0621\u064E \u0627\u0644\u0644\u064E\u0651\u064A\u0652\u0644\u0650 \u0648\u064E\u0623\u064E\u0637\u0652\u0631\u064E\u0627\u0641\u064E \u0627\u0644\u0646\u064E\u0651\u0647\u064E\u0627\u0631\u0650 \u0648\u064E\u0627\u062D\u0652\u0634\u064F\u0631\u0652\u0646\u0650\u064A \u0645\u064E\u0639\u064E \u0627\u0644\u0646\u064E\u0651\u0628\u0650\u064A\u0650\u0651 \u0635\u064E\u0644\u064E\u0651\u0649 \u0627\u0644\u0644\u064E\u0651\u0647\u064F \u0639\u064E\u0644\u064E\u064A\u0652\u0647\u0650 \u0648\u064E\u0633\u064E\u0644\u064E\u0651\u0645\u064E \u0648\u064E\u0622\u0644\u0650\u0647\u0650 \u0627\u0644\u0652\u0623\u064E\u062E\u0652\u064A\u064E\u0627\u0631\u0650. \u0646\u064E\u0648\u064E\u064A\u0652\u062A\u064F \u062A\u0650\u0644\u064E\u0627\u0648\u064E\u0629\u064E \u0627\u0644\u0652\u0642\u064F\u0631\u0652\u0622\u0646\u0650 \u0644\u0650\u0631\u0650\u0636\u064E\u0627\u0621\u0650 \u0627\u0644\u0631\u064E\u0651\u062D\u0652\u0645\u0670\u0646\u0650 \u0648\u064E\u062A\u064E\u0646\u0652\u0648\u0650\u064A\u0631\u0650 \u0642\u064F\u0628\u064F\u0648\u0631\u0650 \u0623\u064E\u0647\u0652\u0644\u0650 \u0627\u0644\u0652\u0625\u0650\u064A\u0645\u064E\u0627\u0646\u0650 \u0648\u064E\u0644\u0650\u0631\u064F\u0648\u062D\u0650 \u0634\u064E\u0645\u0652\u0633\u0650 \u0633\u064E\u064A\u0650\u0651\u062F\u0650 \u0627\u0644\u0652\u0623\u064E\u0646\u0652\u0628\u0650\u064A\u064E\u0627\u0621\u0650 \u0648\u064E\u0642\u064E\u0645\u064E\u0631\u0650 \u0627\u0644\u0652\u0645\u064F\u0631\u0652\u0633\u064E\u0644\u0650\u064A\u0646\u064E \u0633\u064E\u064A\u0650\u0651\u062F\u0650\u0646\u064E\u0627 \u0645\u064F\u062D\u064E\u0645\u064E\u0651\u062F\u064D \u0639\u064E\u0644\u064E\u064A\u0652\u0647\u0650 \u0635\u064E\u0644\u064E\u0648\u064E\u0627\u062A\u064F \u0627\u0644\u0631\u064E\u0651\u062D\u0652\u0645\u0670\u0646\u0650 \u0648\u064E\u0644\u0650\u0637\u064E\u0631\u0652\u062F\u0650 \u0627\u0644\u0634\u064E\u0651\u064A\u0652\u0637\u064E\u0627\u0646\u0650 \u0648\u064E\u0625\u0650\u0633\u0652\u0642\u064E\u0627\u0637\u0650 \u0627\u0644\u0630\u064F\u0651\u0646\u064F\u0648\u0628\u0650 \u0648\u064E\u0642\u064E\u0628\u064F\u0648\u0644\u0650 \u0627\u0644\u062A\u064E\u0651\u0648\u0652\u0628\u064E\u0629\u0650 \u0648\u064E\u0631\u064E\u0641\u0652\u0639\u0650 \u0627\u0644\u062F\u064E\u0651\u0631\u064E\u062C\u064E\u0627\u062A\u0650 \u0648\u064E\u0627\u0644\u0646\u064E\u0651\u062C\u064E\u0627\u0629\u0650 \u0645\u0650\u0646\u064E \u0627\u0644\u0646\u0650\u0651\u064A\u0631\u064E\u0627\u0646\u0650 \u0648\u064E\u0628\u064E\u0642\u064E\u0627\u0621\u0650 \u0627\u0644\u0652\u0625\u0650\u064A\u0645\u064E\u0627\u0646\u0650 \u0648\u064E\u0644\u0650\u0642\u064E\u0627\u0621\u0650 \u0627\u0644\u0631\u064E\u0651\u062D\u0652\u0645\u0670\u0646\u0650 \u0628\u0650\u0631\u064E\u062D\u0652\u0645\u064E\u062A\u0650\u0643\u064E \u064A\u064E\u0627 \u0623\u064E\u0631\u0652\u062D\u064E\u0645\u064E \u0627\u0644\u0631\u064E\u0651\u0627\u062D\u0650\u0645\u0650\u064A\u0646\u064E \u0648\u064E\u0627\u0644\u0652\u062D\u064E\u0645\u0652\u062F\u064F \u0644\u0650\u0644\u064E\u0651\u0647\u0650 \u0631\u064E\u0628\u0650\u0651 \u0627\u0644\u0652\u0639\u064E\u0627\u0644\u064E\u0645\u0650\u064A\u0646\u064E.",
      ok: "All\xE2h\xFCmme bil-hakk\u0131 enzelteh\xFB ve bil-hakk\u0131 nezel. All\xE2h\xFCmme azz\u0131m ra\u011Fbet\xEE f\xEEhi vec\u2018alh\xFC n\xFBran li-basar\xEE ve \u015Fif\xE2en li-sadr\xEE. All\xE2h\xFCmme zeyyin bih\xEE lis\xE2n\xEE ve cemmil bih\xEE vech\xEE ve kavvi bih\xEE cesed\xEE verzukn\xEE til\xE2veteh\xFB al\xE2 t\xE2atike \xE2n\xE2el-leyli ve etr\xE2fen-neh\xE2ri vah\u015Furn\xEE mean-nebiyyi sallall\xE2h\xFC aleyhi ve selleme ve \xE2lih\u0131l-ahy\xE2r. Neveyt\xFC til\xE2vetel-Kur\u2019\xE2ni li-r\u0131d\xE2ir-Rahm\xE2ni ve tenv\xEEri kub\xFBri ehlil-\xEEm\xE2ni ve li-r\xFBhi \u015Femsi seyyidil-enbiy\xE2i ve kameril-m\xFCrsel\xEEne seyyidin\xE2 Muhammedin aleyhi salav\xE2t\xFCr-Rahm\xE2ni ve li-tardi\u015F-\u015Feyt\xE2ni ve isk\xE2tiz-z\xFCn\xFBbi ve kab\xFBlit-tevbeti ve ref\u2018id-derec\xE2ti ven-nec\xE2ti minen-n\xEEr\xE2ni ve bek\xE2il-\xEEm\xE2ni ve lik\xE2ir-Rahm\xE2ni bi-rahmetike y\xE2 erhamer-r\xE2him\xEEn. Velhamd\xFC lill\xE2hi Rabbil-\xE2lem\xEEn.",
      meal: { tr: "Allah\u2019\u0131m! Kur\u2019an\u2019\u0131 hak ile indirdin. Ona ilgimi art\u0131r; onu g\xF6z\xFCme nur, g\xF6nl\xFCme \u015Fifa k\u0131l. Dilimi onunla s\xFCsle, y\xFCz\xFCm\xFC g\xFCzelle\u015Ftir, bedenimi g\xFC\xE7lendir. Gece ve g\xFCnd\xFCz sana itaat ederek onu okumay\u0131 nasip et; beni Peygamberimiz ve onun se\xE7kin yak\u0131nlar\u0131yla ha\u015Fret. Senin r\u0131zan, iman ehlinin kabirlerinin ayd\u0131nlanmas\u0131 ve Peygamberimizin ruhu i\xE7in; \u015Feytandan uzakla\u015Fmak, g\xFCnahlar\u0131n ba\u011F\u0131\u015Flanmas\u0131, t\xF6vbenin kabul\xFC, derecelerin y\xFCkselmesi, cehennemden kurtulu\u015F, iman\u0131n devam\u0131 ve sana kavu\u015Fmak niyetiyle okuyorum. Rahmetinle kabul et. Hamd \xE2lemlerin Rabbi Allah\u2019ad\u0131r.", en: "O Allah, You sent the Quran down in truth. Increase my desire for it; make it light for my sight and healing for my heart. Adorn my speech and strengthen me through it. Grant me its recitation in obedience to You by night and day, and gather me with the Prophet and his righteous family. I intend this recitation for Your pleasure, for light in the believers\u2019 graves, and for the Prophet; for protection from Satan, forgiveness, acceptance of repentance, higher rank, deliverance from the Fire, lasting faith and meeting You. Accept it through Your mercy. Praise belongs to Allah, Lord of all worlds." },
      note: "traditional_prayer"
    }];
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
    const defaults = { repeat: 1, speed: 1, wait: 0, clips: [] };
    if (!value || value.hash !== hash || !validPrayerPreferences(value)) return defaults;
    return { ...defaults, repeat: value.repeat, speed: value.speed, wait: value.wait, clips: Array.isArray(value.clips) ? value.clips.filter((c) => c && Number.isFinite(c.start) && Number.isFinite(c.end) && c.start >= 0 && c.end - c.start >= 0.2 && typeof c.name === "string" && c.name.length <= 80).slice(0, 50) : [] };
  }
  function pcmExcerptWav(buffer, range) {
    if (!validExcerpt(range, buffer.duration)) throw Error("Invalid prayer excerpt");
    const channels = buffer.numberOfChannels, rate = buffer.sampleRate;
    const from = Math.round(range.start * rate), to = Math.min(buffer.length, Math.round(range.end * rate));
    const frames = to - from, dataBytes = frames * channels * 2;
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
    for (let f = from; f < to; f++) for (const track of tracks) {
      const sample = Math.max(-1, Math.min(1, track[f]));
      view.setInt16(at, Math.round(sample * (sample < 0 ? 32768 : 32767)), true);
      at += 2;
    }
    return bytes;
  }
  var PrayerPlayer = class {
    constructor({ audio, prepare, schedule = (fn, delay) => globalThis.setTimeout(fn, delay), unschedule = (id) => globalThis.clearTimeout(id), onState = () => {
    } }) {
      Object.assign(this, { audio, prepare, schedule, unschedule, onState });
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
      this.audio.pause();
      this.onState("stopped");
    }
    async play(range, preferences) {
      this.stop();
      if (!validPrayerPreferences(preferences)) throw Error("Invalid prayer settings");
      const token = this.token;
      this.active = true;
      this.onState("loading");
      try {
        const source = await this.prepare(range, () => token === this.token);
        if (token !== this.token) return;
        this.audio.src = source;
        this.from = range?.start || 0;
        let done = 0;
        const run = async () => {
          if (token !== this.token) return;
          this.audio.currentTime = 0;
          this.audio.playbackRate = preferences.speed;
          this.audio.preservesPitch = true;
          this.audio.webkitPreservesPitch = true;
          this.audio.mozPreservesPitch = true;
          try {
            await this.audio.play();
            if (token === this.token) this.onState("playing", { current: done + 1, total: preferences.repeat });
          } catch (error) {
            if (token === this.token) {
              this.stop();
              this.onState("error", error);
            }
          }
        };
        this.audio.onerror = () => {
          if (token === this.token) {
            this.stop();
            this.onState("error");
          }
        };
        this.audio.onended = () => {
          if (token !== this.token) return;
          done++;
          if (done >= preferences.repeat) {
            this.active = false;
            this.audio.onended = null;
            this.audio.onerror = null;
            this.onState("complete");
            return;
          }
          this.onState("waiting", { current: done, total: preferences.repeat });
          this.timer = this.schedule(() => {
            this.timer = null;
            run();
          }, preferences.wait * 1e3);
        };
        await run();
      } catch (error) {
        if (token === this.token) {
          this.stop();
          this.onState("error", error);
        }
      }
    }
  };

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
    const preferences = restorePrayerState(saved()[item.id], hash);
    let clips = preferences.clips, undo = [];
    const title = '<h2 class="dd-title">' + esc(item.title) + "</h2>";
    const copy = item.meal?.[lang] || item.meal?.en || item.meal?.tr || "";
    const body = '<div class="prayerText"><div class="dd-ar" dir="rtl" lang="ar">' + esc(item.ar) + "</div><details><summary>" + esc(ui.translate("dua_okunus")) + '</summary><p class="dd-ok">' + esc(item.ok) + "</p></details><details><summary>" + esc(ui.translate("dua_meal")) + (item.meal?.[lang] ? "" : " \xB7 English") + '</summary><p class="dd-meal">' + esc(copy) + '</p></details></div><div class="prayerPractice"></div>';
    const back = ui.overlay(title, body), box = back.querySelector(".prayerPractice");
    const status = document.createElement("p");
    status.className = "prayerStatus";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    const source = document.createElement("a");
    source.href = item.source;
    source.target = "_blank";
    source.rel = "noopener noreferrer";
    source.textContent = t("source") + " \xB7 Diyanet";
    source.className = "prayerSource";
    box.append(source);
    if (item.note === "traditional_prayer") {
      const p = document.createElement("p");
      p.className = "prayerHelp";
      p.textContent = local("Diyanet rehberinde, okumaya ba\u015Flarken okunmas\u0131 gelenek h\xE2line gelmi\u015F bir dua olarak aktar\u0131l\u0131r.", "The Diyanet guide describes this as a traditional prayer before recitation.");
      box.append(p);
    }
    if (item.id === "kunut" || item.id === "rabbena") {
      const p = document.createElement("p");
      p.className = "prayerHelp";
      p.textContent = local("Bu kay\u0131t iki duay\u0131 birlikte i\xE7erir. Metin ve ses birlikte g\xF6sterilir.", "This recording contains both supplications; their texts are shown together.");
      box.append(p);
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
        a.textContent = t("official") + " \xB7 Mi\u015F\xE2r\xEE";
        box.append(a);
      }
      return true;
    }
    const sourceNote = document.createElement("p");
    sourceNote.className = "prayerHelp";
    sourceNote.textContent = local("Diyanet Namaz Portal\u0131 kayd\u0131. Okuyucunun ad\u0131 kaynakta belirtilmiyor.", "Diyanet Prayer Portal recording. The source does not identify the reciter.");
    box.append(sourceNote);
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
    full.textContent = "\u25B6 " + t("full");
    full.id = "prayerPlay";
    const stop = document.createElement("button");
    stop.type = "button";
    stop.className = "prayerAction";
    stop.textContent = "\u25A0";
    stop.setAttribute("aria-label", globalText("pb_play"));
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
    box.append(controls, transport, seek, time, status, offline);
    const audio = new Audio();
    audio.preload = "none";
    let closed = false, bytes = null, decoded = null, context = null, objectUrl = null, duration = 0, range = null, abort = new AbortController();
    const format = (n) => Math.floor(n / 60) + ":" + String(Math.floor(n % 60)).padStart(2, "0");
    const read = () => ({ repeat: Number(fields.repeat.value), speed: Number(fields.speed.value), wait: Number(fields.wait.value) });
    const remember = () => {
      const p = read();
      if (!validPrayerPreferences(p)) return false;
      const ok = persist(item.id, { hash, ...p, clips });
      if (!ok) status.textContent = local("Bu cihazda kaydedilemedi.", "Could not save on this device.");
      return ok;
    };
    const player = new PrayerPlayer({ audio, prepare: async (selected, isCurrent) => {
      bytes ?? (bytes = await verifiedBytes(record2, abort.signal));
      if (closed || !isCurrent()) throw Error("Closed");
      let blob;
      if (selected) {
        if (!decoded) {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (!AudioContext) throw Error("No audio decoder");
          context = new AudioContext();
          decoded = await context.decodeAudioData(bytes.slice(0));
          duration = decoded.duration;
          seek.max = duration;
          seek.disabled = false;
        }
        if (closed || !isCurrent()) throw Error("Closed");
        blob = new Blob([pcmExcerptWav(decoded, selected)], { type: "audio/wav" });
      } else blob = new Blob([bytes], { type: "audio/mpeg" });
      if (closed || !isCurrent()) throw Error("Closed");
      range = selected;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      objectUrl = URL.createObjectURL(blob);
      return objectUrl;
    }, onState: (state, progress) => {
      if (closed) return;
      full.classList.toggle("playing", state === "playing");
      status.textContent = state === "complete" ? t("complete") : state === "error" ? t("error") : progress ? (state === "waiting" ? t("waiting") + " \xB7 " : "") + progress.current + " / " + progress.total : state === "loading" ? "\u2026" : "";
      status.dataset.state = state;
    } });
    function cleanup() {
      if (closed) return;
      closed = true;
      player.stop();
      abort.abort();
      audio.removeAttribute("src");
      audio.load();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      context?.close().catch(() => {
      });
      if (activeClose === cleanup) activeClose = null;
    }
    activeClose = cleanup;
    back.addEventListener("elifa:dua-close", cleanup, { once: true });
    audio.onloadedmetadata = () => {
      if (!range) {
        duration = audio.duration;
        seek.max = duration;
        seek.disabled = !Number.isFinite(duration);
      }
      updateTime();
    };
    function updateTime() {
      if (closed) return;
      const pos = audio.currentTime + (range?.start || 0);
      seek.value = pos;
      time.textContent = format(pos) + " / " + format(duration);
    }
    audio.ontimeupdate = updateTime;
    seek.oninput = () => {
      const start = range?.start || 0, end = range?.end || duration;
      const pos = Math.min(end, Math.max(start, Number(seek.value)));
      audio.currentTime = pos - start;
      updateTime();
    };
    full.onclick = () => {
      const p = read();
      if (!validPrayerPreferences(p)) {
        status.textContent = t("error");
        return;
      }
      remember();
      player.play(null, p);
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
        await cache.put(record2.path, new Response(data, { headers: { "Content-Type": "audio/mpeg" } }));
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
    const detail = document.createElement("details");
    detail.className = "prayerClips";
    const summary = document.createElement("summary");
    summary.textContent = t("clip");
    detail.append(summary);
    const explanation = document.createElement("p");
    explanation.className = "prayerHelp";
    explanation.textContent = local("B\xFCt\xFCn duay\u0131 dinlerken c\xFCmlenin ba\u015F\u0131n\u0131 ve sonunu i\u015Faretle. \u0130stersen saniyeleri d\xFCzelt, sonra kaydet. C\xFCmlelerin bu cihazda kaydedilir. Otomatik kelime zamanlamas\u0131 kullan\u0131lmaz.", "While listening to the whole prayer, mark the phrase\u2019s start and end. Adjust the seconds if needed, then save. Your phrases are saved on this device. No automatic word timing is assumed.");
    detail.append(explanation);
    const marks = document.createElement("div");
    marks.className = "prayerGrid";
    const boundaries = {};
    for (const [key, label] of [["start", t("start")], ["end", t("end")]]) {
      const wrap = document.createElement("label");
      const mark = document.createElement("button");
      mark.type = "button";
      mark.className = "prayerAction";
      mark.textContent = label;
      mark.setAttribute("aria-label", label);
      const input = document.createElement("input");
      input.type = "number";
      input.min = 0;
      input.step = 0.01;
      input.value = 0;
      input.setAttribute("aria-label", label + " (s)");
      input.id = "prayer_" + key;
      boundaries[key] = input;
      mark.onclick = () => {
        input.value = (audio.currentTime + (range?.start || 0)).toFixed(2);
      };
      wrap.append(mark, input);
      marks.append(wrap);
    }
    detail.append(marks);
    const name = document.createElement("input");
    name.maxLength = 80;
    name.placeholder = t("clip");
    name.setAttribute("aria-label", t("clip"));
    name.id = "prayerClipName";
    const save = document.createElement("button");
    save.type = "button";
    save.className = "prayerAction";
    save.textContent = t("save");
    save.id = "prayerClipSave";
    const undoButton = document.createElement("button");
    undoButton.type = "button";
    undoButton.className = "prayerAction";
    undoButton.textContent = t("undo");
    undoButton.hidden = true;
    const list = document.createElement("div");
    list.className = "prayerClipList";
    function renderClips() {
      list.replaceChildren();
      undoButton.hidden = !undo.length;
      for (const clip of clips) {
        const row = document.createElement("div");
        row.className = "prayerClipRow";
        const edit = document.createElement("input");
        edit.maxLength = 80;
        edit.value = clip.name;
        edit.setAttribute("aria-label", t("clip"));
        edit.onchange = () => {
          clip.name = edit.value.trim().slice(0, 80) || t("clip");
          remember();
        };
        const play = document.createElement("button");
        play.type = "button";
        play.className = "prayerAction";
        play.textContent = "\u25B6 " + format(clip.start) + "\u2013" + format(clip.end);
        play.setAttribute("aria-label", clip.name);
        play.onclick = () => {
          const p = read();
          if (validPrayerPreferences(p)) player.play(clip, p);
        };
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "prayerAction";
        remove.textContent = "\xD7";
        remove.setAttribute("aria-label", clip.name + " \xB7 " + t("remove"));
        remove.onclick = () => {
          player.stop();
          undo.push(clips.map((c) => ({ ...c })));
          clips = clips.filter((c) => c !== clip);
          remember();
          renderClips();
        };
        row.append(edit, play, remove);
        list.append(row);
      }
    }
    save.onclick = () => {
      const clip = { start: Number(boundaries.start.value), end: Number(boundaries.end.value), name: name.value.trim() || t("clip") + " " + (clips.length + 1) };
      if (!validExcerpt(clip, duration) || clips.length >= 50) {
        status.textContent = local("\xD6nce kayd\u0131 a\xE7; ba\u015Flang\u0131\xE7 ve biti\u015Fi sesin i\xE7inde, en az 0,2 saniye arayla se\xE7.", "Open the recording first. Select a start and end within the audio, at least 0.2 seconds apart.");
        return;
      }
      undo.push(clips.map((c) => ({ ...c })));
      clips = [...clips, clip];
      remember();
      renderClips();
    };
    undoButton.onclick = () => {
      player.stop();
      clips = undo.pop() || clips;
      remember();
      renderClips();
    };
    detail.append(name, save, undoButton, list);
    box.append(detail);
    renderClips();
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
        sub.textContent = item.recording ? "\u25B6 " + t("tab") : t("missing");
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
