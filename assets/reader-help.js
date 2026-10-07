(function(){
  const root=document.getElementById('readerHelp');
  if(!root)return;
  const $=id=>document.getElementById(id);
  const topics=[
    {id:'actions',sel:'#zenTab',name:'Âyet işlemleri',text:'Üstteki aşağı oka dokununca Âyeti böl, Kaydet, Not, Ezberledim ve Zorlandığım açılır. Önce işlemi seç, sonra Mushaf’ta istediğin âyete veya kelimeye dokun.',demo:'İşlemleri aç',run:()=>setSelectionToolsOpen(true)},
    {id:'repeat',sel:'#repTog',name:'5× Tekrar',text:'Ortadaki 5× düğmesine kısa dokunmak tekrarı açar veya kapatır; bu işlem dinlemeyi başlatabilir. − ve + tekrar sayısını değiştirir. Düğmeye basılı tutunca tekrar, ara bekleme, hız ve âyet aralığı ayarları açılır.',demo:'Ayarları göster',run:openRepeatSettings},
    {id:'combine',sel:'#cumuTog',name:'1+2 Birleştir',text:'Birleştir açıkken âyetler birikerek dinlenir. Her aşama seçtiğin tekrar sayısı kadar çalınır. Kısa dokunmak modu ve tekrarı açıp dinlemeyi başlatır; basılı tutmak âyet aralığı ayarlarını açar.',demo:'Aralığı göster',run:openRepeatSettings},
    {id:'reciter',sel:'#readerReciter',name:'Hoca seçimi',text:'Bu düğmeden okuyacak hocayı değiştirirsin. Dinlerken geri dönüp Ayarlar’a gitmen gerekmez.',demo:'Hocaları göster',run:()=>{close();openReciterSheet();}},
    {id:'split',sel:'#selSplit',group:'actions',name:'Âyeti böl',text:'Bu işlemi seçip Mushaf’ta bölmek istediğin âyete dokun. Açılan ekranda kelimelerin arasından parça sınırlarını belirlersin. İşlemi seçince düğme belirginleşir.'},
    {id:'save',sel:'#selMark',group:'actions',name:'Kaydet',text:'Kaydet’e dokun, ardından işaretlemek istediğin âyeti veya kelimeyi seç. Kayıtlarına sonra üstteki Kayıtlar düğmesinden ulaşabilirsin.'},
    {id:'note',sel:'#selNote',group:'actions',name:'Not',text:'Not’a dokun, ardından Mushaf’ta not almak istediğin âyeti veya kelimeyi seç. Açılan alana notunu yaz.'},
    {id:'memorized',sel:'#selHifz',group:'actions',name:'Ezberledim',text:'Bu işlemi seçip ezberlediğin âyete dokun. Ezber takibine eklenir.'},
    {id:'difficult',sel:'#selErr',group:'actions',name:'Zorlandığım',text:'Bu işlemi seçip zorlandığın âyete veya kelimeye dokun. Yer düz çizgiyle işaretlenir ve Zorlandığım kayıtlarına eklenir.'},
    {id:'word',name:'Âyet ve kelime',text:'Mushaf’ta bir kelimeye dokununca bulunduğu âyet okunur. Kelimeyi basılı tutarak daha dar bir bölüm seçebilir, ardından üstteki âyet işlemlerini kullanabilirsin.'},
    {id:'page',sel:'#pageChip',name:'Sayfa ve cüz',text:'Sayfa numarasına dokunarak 604 sayfadan birine, Cüz’e dokunarak 30 cüzden birine geçebilirsin.'},
    {id:'font',sel:'#fontBtn',name:'Yazı ve okunuş',text:'Yazı düğmesi hat ve boyutu ayarlar. Okunuş düğmesi Latin harfli okunuşu açıp kapatır.'},
    {id:'test',sel:'#testModeTop',name:'Test ve ezber',text:'Test modu kelimeleri gizler; ezberden okuyup dokunarak kontrol edebilirsin. Alt alta görünüm de âyetleri satır satır çalışmana yardım eder.'},
    {id:'play',sel:'#playBtn',name:'Çal / Dur',text:'Seçili âyeti veya kaldığın yeri dinletir ve duraklatır. Önceki ve Sonraki düğmeleri âyetler arasında geçer; Hız düğmesi okuma hızını değiştirir.'},
    {id:'bookmark',sel:'#bmBtn',name:'Yer imi',text:'Yer imi düğmesine basıp Mushaf’ta kurdeleyi koymak istediğin konuma dokun. Daha sonra Kayıtlar’dan geri dönebilirsin.'},
  ];
  const english={
    actions:['Verse actions','Open the down arrow above the text. Choose an action, then tap the verse or word you want to work with.','Show actions'],
    repeat:['5× Repeat','Tap 5× to turn repetition on or off. Use − and + to change the count. Press and hold 5× to set the count, pause, speed and verse range.','Show settings'],
    combine:['1+2 Combine','With Combine on, verses play cumulatively: 1, then 1+2, then 1+2+3. Each step plays as many times as your repeat count. Press and hold to set the verse range.','Show range'],
    reciter:['Choose reciter','Change the reciter here while listening. You do not need to return to Settings.','Show reciters'],
    split:['Split verse','Choose this action, then tap the verse to split. Set the part boundaries between words on the next screen.'],
    save:['Save','Choose Save, then tap the verse or word you want to mark. Find it later in Records.'],
    note:['Note','Choose Note, then tap the verse or word you want to annotate. Write your note in the field that opens.'],
    memorized:['Memorized','Choose this action, then tap the verse you memorized. It will appear in your memorization tracking.'],
    difficult:['Difficult','Choose this action, then tap the difficult verse or word. It is marked with a straight underline and added to Difficult records.'],
    word:['Verse and word','Tap a word to play its verse. Press and hold to select a smaller passage.'],
    page:['Page and juz’','Tap the page number to choose one of 604 pages, or Juz’ to choose one of 30 parts.'],
    font:['Script and transliteration','Script changes the type and size of the Arabic text. Transliteration turns the Latin-letter reading on or off.'],
    test:['Test and memorization','Test mode hides words so you can recite from memory and tap to check. Line-by-line view helps you practise one verse at a time.'],
    play:['Play / Pause','Play or pause the selected verse or the place where you stopped. Previous and Next move between verses; Speed changes the reading speed.'],
    bookmark:['Bookmark','Tap Bookmark, then tap the place in the Mushaf where you want to put the ribbon. Return to it from Records.']
  };
  const guideIndex={repeat:['reader',10],combine:['reader',11],reciter:['ayarlar',1],save:['reader',8],note:['saved',1],memorized:['ezber',0],difficult:['saved',3],word:['reader',3],page:['reader',0],font:['reader',5],test:['ezber',0],play:['reader',12],bookmark:['reader',7]};
  function language(){return window.ElifaLocale?window.ElifaLocale.current():(localStorage.getItem('elifaLang')||'en');}
  function helpDraft(){return window.ELIFA_READER_HELP_DRAFTS?.[language()]||{};}
  function copy(t){
    if(language()==='tr')return {name:t.name,text:t.text,demo:t.demo};
    const fallback=english[t.id]||english.actions;
    const [section,index]=guideIndex[t.id]||[];
    const translated=window.ELIFA_GUIDE_L10N?.[language()]?.[section]?.[index];
    const draft=helpDraft();
    const demo=draft[t.id+'Demo']||fallback[2];
    return {name:translated?.t||(t.id==='actions'?draft.actionsTitle:null)||fallback[0],text:translated?.x||(t.id==='actions'?draft.actionsText:null)||fallback[1],demo};
  }
  function ui(key){
    if(language()==='tr')return {intro:'Neyi öğrenmek istersin?',hint:'Parlayan düğmelerden birine dokun veya aşağıdan bir konu seç.',about:' hakkında bilgi',done:'Bitti'}[key];
    return helpDraft()[key]||{intro:'What would you like to learn?',hint:'Tap a highlighted button or choose a topic below.',about:' information',done:'Done'}[key];
  }
  let active=null,observer=null;
  const primary=['actions','repeat','combine','reciter'];
  function openRepeatSettings(){close();gearCtx='ayah';fillGearSheet();openSheet('gearSheet');}
  function visible(t){const el=t.sel&&document.querySelector(t.sel);if(!el)return false;const r=el.getBoundingClientRect();return r.width>2&&r.height>2&&r.bottom>0&&r.top<innerHeight;}
  function position(){
    if(root.hidden)return;
    const box=$('readerHelpTargets');box.replaceChildren();
    const ids=primary.concat(document.getElementById('selbar').classList.contains('show')?['split','save','note','memorized','difficult']:[]);
    for(const id of ids){const t=topics.find(item=>item.id===id);if(!visible(t))continue;
      const r=document.querySelector(t.sel).getBoundingClientRect();const pad=3;
      const b=document.createElement('button');b.type='button';b.className='readerHelpTarget'+(active===id?' active':'');
      b.setAttribute('aria-label',copy(t).name+ui('about'));b.style.left=Math.max(0,r.left-pad)+'px';b.style.top=Math.max(0,r.top-pad)+'px';
      b.style.width=Math.min(innerWidth-r.left+pad,r.width+pad*2)+'px';b.style.height=(r.height+pad*2)+'px';
      b.onclick=()=>select(id);box.appendChild(b);
    }
  }
  function select(id){
    const t=topics.find(item=>item.id===id);if(!t)return;
    const localized=copy(t);active=id;$('readerHelpTitle').textContent=localized.name;$('readerHelpText').textContent=localized.text;
    const example=$('readerHelpExample');example.hidden=id!=='combine';if(id==='combine')example.textContent='1 → 1+2 → 1+2+3 …';
    const demo=$('readerHelpDemo');demo.hidden=!localized.demo;demo.textContent=localized.demo||'';demo.onclick=t.run||null;
    document.querySelectorAll('#readerHelpTopics button').forEach(b=>b.classList.toggle('active',b.dataset.topic===id));
    if(t.group==='actions'&&!document.getElementById('selbar').classList.contains('show'))setSelectionToolsOpen(true);
    requestAnimationFrame(position);
  }
  function start(){
    if(!document.getElementById('reader').classList.contains('on'))return;
    root.hidden=false;active=null;root.setAttribute('dir',['ar','ur','fa'].includes(language())?'rtl':'ltr');
    $('readerHelpTitle').textContent=ui('intro');$('readerHelpText').textContent=ui('hint');
    $('readerHelpDone').textContent=window.ELIFA_COACH_LABELS?.done?.[language()]||ui('done');
    $('readerHelpClose').setAttribute('aria-label',window.ELIFA_COACH_LABELS?.close?.[language()]||ui('done'));
    $('readerHelpExample').hidden=true;
    $('readerHelpDemo').hidden=true;
    const list=$('readerHelpTopics');list.replaceChildren();
    topics.forEach(t=>{const b=document.createElement('button');b.type='button';b.dataset.topic=t.id;b.textContent=copy(t).name;b.onclick=()=>select(t.id);list.appendChild(b);});
    position();
    addEventListener('resize',position);document.getElementById('rscroll').addEventListener('scroll',position,{passive:true});
    if(typeof ResizeObserver!=='undefined'){
      observer=new ResizeObserver(position);observer.observe(document.getElementById('selbar'));
    }
    $('readerHelpClose').focus();
  }
  function close(){
    root.hidden=true;active=null;removeEventListener('resize',position);
    document.getElementById('rscroll').removeEventListener('scroll',position);
    if(observer){observer.disconnect();observer=null;}
  }
  $('readerHelpClose').onclick=close;$('readerHelpDone').onclick=close;
  window.startReaderHelp=start;window.closeReaderHelp=close;
})();
