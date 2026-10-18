import recordings from '../assets/dua-recordings.json' with {type:'json'};
import {extraPrayers} from './dua-extra-catalog.mjs';
import {recordedAlternatives} from './dua-recorded-alternatives.mjs';
const portal='https://namaz.diyanet.gov.tr/namaz/#sureler-dualar.html';
const book='https://dijital.diyanet.gov.tr/File/Download?id=4061&path=4061_1.pdf';
const record=id=>recordings.find(r=>r.prayerId===id&&r.readerId==='mishary-alafasy')||recordings.find(r=>r.id===({'istigfar':'istigfar-adult','yemek-sonrasi-alternatif':'yemek-chapter'}[id]||id));
export function prayerCatalog(texts){
  const item=(id,indices,title)=>{
    const rows=indices.map(i=>texts[i]),languages=new Set(rows.flatMap(r=>Object.keys(r.meal||{})));
    const result={id,title:title||rows[0].t,ar:rows.map(r=>r.ar).join('\n\n'),ok:rows.map(r=>r.ok).join('\n\n'),meal:Object.fromEntries([...languages].map(l=>[l,rows.map(r=>r.meal?.[l]||r.meal?.en||'').join('\n\n')])),recording:record(id),source:portal,namaz:indices};
    if(id==='amentü'){result.source='https://www.diyanethaber.com.tr/video/diyanet-elifba-amentu';result.external=result.source;result.externalLabel='Diyanet';}
    if(id==='subhaneke'){
      result.ok=result.ok.replace(/\s*\(ve celle senâük\)\s*/u,' ');
      result.guideTitle={tr:'Okuma notu',en:'Recitation note'};
      result.guide={tr:['Buradaki metin normal namazın başında okunan biçimdir. Cenaze namazında ayrıca “ve celle senâük” (وَجَلَّ ثَنَاؤُكَ) ifadesi eklenebilir; bu ifade burada Arapça metnin ve okunuşun içine karıştırılmaz.'],en:['The displayed text is the form used at the start of an ordinary prayer. In a funeral prayer, “ve celle senâük” (وَجَلَّ ثَنَاؤُكَ) may be added; it is kept separate from this Arabic text and transliteration.']};
      result.guideSource='https://kurul.diyanet.gov.tr/tr/fetva/namazlarda-subhaneke-okurken-ve-celle-senauke-kismi-nicin/0193c42d-4fad-78f8-6b66-b6ee0ffe1e2a';
    }
    return result;
  };
  const entries=[item('subhaneke',[0]),item('tahiyyat',[1]),item('salli',[2]),item('barik',[3]),item('kunut',[4,5],'Kunût 1–2'),item('amentü',[6]),item('rabbena',[7,8],'Rabbenâ duaları'),{
    id:'ezan',title:'Ezan duası',source:'https://kurul.diyanet.gov.tr/tr/fetva/ezan-duasinin-dini-hukmu-nedir-ve-nasil-yapilir/0193c42d-8590-778e-6819-7c9e7a6f6197',recording:record('ezan'),
    ar:'اَللّٰهُمَّ رَبَّ هٰذِهِ الدَّعْوَةِ التَّامَّةِ وَالصَّلَاةِ الْقَائِمَةِ آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ وَالدَّرَجَةَ الرَّفِيعَةَ وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ. إِنَّكَ لَا تُخْلِفُ الْمِيعَادَ.',
    ok:'Allâhümme Rabbe hâzihid-da‘vetit-tâmmeti ves-salâtil-kâimeti, âti Muhammedenil-vesîlete vel-fadîlete ved-dereceter-rafîate veb‘ashü makâmen mahmûdenillezî va‘adteh. İnneke lâ tuhlifül-mîâd.',
    meal:{tr:'Allah’ım! Bu eksiksiz davetin ve kılınacak namazın Rabbi! Muhammed’e vesileyi, fazileti ve yüksek dereceyi ver; onu vadettiğin övülmüş makama ulaştır. Şüphesiz sen vaadinden dönmezsin.',en:'O Allah, Lord of this complete call and the prayer to be established, grant Muhammad the means of nearness, excellence and the lofty rank, and raise him to the praised station You promised. Surely You never break Your promise.'},
    guideTitle:{tr:'Metin ve ses sürümü',en:'Text and recording versions'},guide:{tr:['“İnneke lâ tuhlifül-mîâd” (Sen vaadinden dönmezsin) cümlesi bazı rivayetlerde yer alır. Buradaki metin, mevcut ses kaydında okunan “ved-dereceter-rafîate” ve bu son cümleyi de içerir. Daha kısa ezan duası rivayetleri de vardır.'],en:['“Inneke lâ tuhlifül-mîâd” (You never break Your promise) appears in some narrations. The displayed version includes “ved-dereceter-rafîate” and the closing sentence, as recited in the current recording. Shorter versions also exist.']},
    guideSource:'https://sehitferhatarslanaihl.meb.k12.tr/meb_iys_dosyalar/65/14/761411/dosyalar/2018_11/09172051_20195555_Ezan_ve_Namaz_TesbihatY.pdf'
  },{
    id:'istigfar',title:'Seyyidül istiğfar',source:'https://kurul.diyanet.gov.tr/tr/fetva/istigfar-duasi-nedir/0193c42d-87eb-7113-39c4-1d8562685e34',external:'https://www.youtube.com/watch?v=HWCKSAvMWn8',
    ar:'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ',
    ok:'Allâhümme ente Rabbî lâ ilâhe illâ ente, halaktenî ve ene abdüke ve ene alâ ahdike ve va‘dike mesteta‘tü. Eûzü bike min şerri mâ sana‘tü. Ebûü leke bi-ni‘metike aleyye ve ebûü bi-zenbî, fağfir lî, fe-innehû lâ yağfiruz-zünûbe illâ ente.',
    meal:{tr:'Allah’ım! Sen benim Rabbimsin; senden başka ilah yoktur. Beni sen yarattın, ben senin kulunum. Gücüm yettiğince sana verdiğim söze bağlıyım. Yaptıklarımın kötülüğünden sana sığınırım. Nimetlerini ve günahımı itiraf ederim. Beni bağışla; günahları ancak sen bağışlarsın.',en:'O Allah, You are my Lord; there is no deity but You. You created me and I am Your servant. I keep Your covenant and promise as best I can. I seek refuge in You from my wrongdoing, acknowledge Your blessings and confess my sin. Forgive me, for only You forgive sins.'}
  },{
    id:'yemek',title:'Yemek sonrası duası · kısa',source:book+'#page=112',
    ar:'الْحَمْدُ لِلّٰهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مِنَ الْمُسْلِمِينَ',
    ok:'Elhamdü lillâhillezî et‘amenâ ve sekânâ ve cealenâ minel-müslimîn.',
    meal:{tr:'Bizi yediren, içiren ve Müslümanlardan kılan Allah’a hamdolsun.',en:'Praise belongs to Allah, who fed us, gave us drink, and made us Muslims.'}
  },{
    id:'kuran-baslama',title:'Kur’an okumaya başlama duası',source:book+'#page=70',
    ar:'اللَّهُمَّ بِالْحَقِّ أَنْزَلْتَهُ وَبِالْحَقِّ نَزَلَ. اللَّهُمَّ عَظِّمْ رَغْبَتِي فِيهِ وَاجْعَلْهُ نُورًا لِبَصَرِي وَشِفَاءً لِصَدْرِي. اللَّهُمَّ زَيِّنْ بِهِ لِسَانِي وَجَمِّلْ بِهِ وَجْهِي وَقَوِّ بِهِ جَسَدِي وَارْزُقْنِي تِلَاوَتَهُ عَلَى طَاعَتِكَ آنَاءَ اللَّيْلِ وَأَطْرَافَ النَّهَارِ وَاحْشُرْنِي مَعَ النَّبِيِّ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ وَآلِهِ الْأَخْيَارِ. نَوَيْتُ تِلَاوَةَ الْقُرْآنِ لِرِضَاءِ الرَّحْمٰنِ وَتَنْوِيرِ قُبُورِ أَهْلِ الْإِيمَانِ وَلِرُوحِ شَمْسِ سَيِّدِ الْأَنْبِيَاءِ وَقَمَرِ الْمُرْسَلِينَ سَيِّدِنَا مُحَمَّدٍ عَلَيْهِ صَلَوَاتُ الرَّحْمٰنِ وَلِطَرْدِ الشَّيْطَانِ وَإِسْقَاطِ الذُّنُوبِ وَقَبُولِ التَّوْبَةِ وَرَفْعِ الدَّرَجَاتِ وَالنَّجَاةِ مِنَ النِّيرَانِ وَبَقَاءِ الْإِيمَانِ وَلِقَاءِ الرَّحْمٰنِ بِرَحْمَتِكَ يَا أَرْحَمَ الرَّاحِمِينَ وَالْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ.',
    ok:'Allâhümme bil-hakkı enzeltehû ve bil-hakkı nezel. Allâhümme azzım rağbetî fîhi vec‘alhü nûran li-basarî ve şifâen li-sadrî. Allâhümme zeyyin bihî lisânî ve cemmil bihî vechî ve kavvi bihî cesedî verzuknî tilâvetehû alâ tâatike ânâel-leyli ve etrâfen-nehâri vahşurnî mean-nebiyyi sallallâhü aleyhi ve selleme ve âlihıl-ahyâr. Neveytü tilâvetel-Kur’âni li-rıdâir-Rahmâni ve tenvîri kubûri ehlil-îmâni ve li-rûhi şemsi seyyidil-enbiyâi ve kameril-mürselîne seyyidinâ Muhammedin aleyhi salavâtür-Rahmâni ve li-tardiş-şeytâni ve iskâtiz-zünûbi ve kabûlit-tevbeti ve ref‘id-derecâti ven-necâti minen-nîrâni ve bekâil-îmâni ve likâir-Rahmâni bi-rahmetike yâ erhamer-râhimîn. Velhamdü lillâhi Rabbil-âlemîn.',
    meal:{tr:'Allah’ım! Kur’an’ı hak ile indirdin. Ona ilgimi artır; onu gözüme nur, gönlüme şifa kıl. Dilimi onunla süsle, yüzümü güzelleştir, bedenimi güçlendir. Gece ve gündüz sana itaat ederek onu okumayı nasip et; beni Peygamberimiz ve onun seçkin yakınlarıyla haşret. Senin rızan, iman ehlinin kabirlerinin aydınlanması ve Peygamberimizin ruhu için; şeytandan uzaklaşmak, günahların bağışlanması, tövbenin kabulü, derecelerin yükselmesi, cehennemden kurtuluş, imanın devamı ve sana kavuşmak niyetiyle okuyorum. Rahmetinle kabul et. Hamd âlemlerin Rabbi Allah’adır.',en:'O Allah, You sent the Quran down in truth. Increase my desire for it; make it light for my sight and healing for my heart. Adorn my speech and strengthen me through it. Grant me its recitation in obedience to You by night and day, and gather me with the Prophet and his righteous family. I intend this recitation for Your pleasure, for light in the believers’ graves, and for the Prophet; for protection from Satan, forgiveness, acceptance of repentance, higher rank, deliverance from the Fire, lasting faith and meeting You. Accept it through Your mercy. Praise belongs to Allah, Lord of all worlds.'},note:'traditional_prayer'
  },...extraPrayers];
  const withAlternatives=entries.flatMap(entry=>[entry,...recordedAlternatives.filter(a=>a.id===entry.id+'-alternatif')]);
  return withAlternatives.map(entry=>({...entry,recording:entry.audioDisabled?undefined:entry.recording||record(entry.id)}));
}
