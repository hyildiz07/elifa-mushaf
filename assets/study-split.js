/* Study Desk split UI. The chapter audio and ordinary split view stay in index.html. */
(() => {
  const el = id => document.getElementById(id);
  const tr = (key, fallback) => {
    const translated = typeof window.tr === 'function' ? window.tr(key) : key;
    return translated && translated !== key ? translated : fallback;
  };
  const pickerLabels = {
    study_split_choose_verse: ['Bölünecek âyeti seç','Wähle den Vers zum Teilen','Choose the verse to split','Выберите аят для разделения','اختر الآية التي تريد تقسيمها','Choisis le verset à découper','Elige la aleya que quieres dividir','Επίλεξε εδάφιο για χωρισμό','选择要拆分的经文','分割する節を選択','나눌 구절 선택','विभाजित करने के लिए आयत चुनें','تقسیم کرنے کی آیت منتخب کریں','Scegli il versetto da dividere','Pilih ayat yang akan dibagi','Kies het vers om te splitsen','Escolha o versículo para dividir','آیه‌ای را برای بخش‌بندی انتخاب کن','ভাগ করার আয়াত বেছে নিন','Pilih ayat untuk dibahagi','Chagua aya ya kugawa'],
    study_split_choose_hint: ['Çalışma aralığından bir âyet seç. Yalnızca seçtiğin âyeti istediğin yerlerden böleceksin.','Wähle einen Vers aus dem Übungsbereich. Du teilst nur diesen Vers.','Choose one verse from your study range. Split only that verse where you want.','Выберите один аят из диапазона. Делите только выбранный аят.','اختر آية من نطاق المراجعة، ثم قسّم هذه الآية فقط حيث تريد.','Choisis un verset de ta plage de travail. Découpe uniquement ce verset.','Elige una aleya del intervalo. Divide solo esa aleya donde quieras.','Επίλεξε ένα εδάφιο από το εύρος μελέτης. Χώρισε μόνο αυτό.','从练习范围中选一节，只拆分所选经文。','学習範囲から一節選び、その節だけを分割します。','학습 범위에서 한 구절을 선택하세요. 선택한 구절만 나눕니다.','अभ्यास की सीमा से एक आयत चुनें। केवल उसी आयत को बाँटें।','مطالعے کی حد سے ایک آیت چنیں۔ صرف اسی آیت کو تقسیم کریں۔','Scegli un versetto dell’intervallo. Dividerai solo quello.','Pilih satu ayat dari rentang latihan. Hanya ayat itu yang dibagi.','Kies één vers uit je studiebereik. Alleen dat vers wordt gesplitst.','Escolha um versículo do intervalo. Divida apenas esse versículo.','یک آیه از بازهٔ تمرین انتخاب کن. فقط همان آیه را بخش‌بندی کن.','পড়ার পরিসর থেকে একটি আয়াত বেছে নিন। শুধু সেটিই ভাগ করুন।','Pilih satu ayat daripada julat latihan. Bahagikan ayat itu sahaja.','Chagua aya moja katika masafa ya mazoezi. Gawa aya hiyo pekee.'],
    study_split_change_verse: ['← Başka âyet seç','← Anderen Vers wählen','← Choose another verse','← Выбрать другой аят','← اختر آية أخرى','← Choisir un autre verset','← Elegir otra aleya','← Επιλογή άλλου εδαφίου','← 选择另一节','← 別の節を選ぶ','← 다른 구절 선택','← दूसरी आयत चुनें','← دوسری آیت چنیں','← Scegli un altro versetto','← Pilih ayat lain','← Kies een ander vers','← Escolher outro versículo','← انتخاب آیهٔ دیگر','← অন্য আয়াত বেছে নিন','← Pilih ayat lain','← Chagua aya nyingine'],
    study_split_live_status: ['Şu an {part}/{total}. parça · {repeat} · 1+2 {combine}','Aktuell Teil {part}/{total} · {repeat} · 1+2 {combine}','Now part {part}/{total} · {repeat} · 1+2 {combine}','Сейчас часть {part}/{total} · {repeat} · 1+2 {combine}','الآن الجزء {part}/{total} · {repeat} · 1+2 {combine}','Partie {part}/{total} · {repeat} · 1+2 {combine}','Ahora parte {part}/{total} · {repeat} · 1+2 {combine}','Τώρα μέρος {part}/{total} · {repeat} · 1+2 {combine}','当前第 {part}/{total} 段 · {repeat} · 1+2 {combine}','現在 {part}/{total} パート · {repeat} · 1+2 {combine}','현재 {part}/{total} 부분 · {repeat} · 1+2 {combine}','अभी भाग {part}/{total} · {repeat} · 1+2 {combine}','اب حصہ {part}/{total} · {repeat} · 1+2 {combine}','Ora parte {part}/{total} · {repeat} · 1+2 {combine}','Sekarang bagian {part}/{total} · {repeat} · 1+2 {combine}','Nu deel {part}/{total} · {repeat} · 1+2 {combine}','Agora parte {part}/{total} · {repeat} · 1+2 {combine}','اکنون بخش {part}/{total} · {repeat} · 1+2 {combine}','এখন অংশ {part}/{total} · {repeat} · 1+2 {combine}','Kini bahagian {part}/{total} · {repeat} · 1+2 {combine}','Sasa sehemu {part}/{total} · {repeat} · 1+2 {combine}'],
    study_split_repeat_on: ['{n}× tekrar','{n}× Wiederholung','{n}× repeat','{n}× повтор','تكرار {n}×','{n}× répétition','{n}× repetición','{n}× επανάληψη','重复 {n}×','{n}× 繰り返し','{n}× 반복','{n}× दोहराव','{n}× تکرار','{n}× ripetizione','{n}× ulang','{n}× herhaling','{n}× repetição','{n}× تکرار','{n}× পুনরাবৃত্তি','{n}× ulang','{n}× marudio'],
    study_split_repeat_off: ['tekrar kapalı','Wiederholung aus','repeat off','повтор выключен','التكرار متوقف','répétition désactivée','repetición desactivada','επανάληψη κλειστή','重复关闭','繰り返しオフ','반복 꺼짐','दोहराव बंद','تکرار بند','ripetizione disattivata','ulangan mati','herhaling uit','repetição desligada','تکرار خاموش','পুনরাবৃত্তি বন্ধ','ulangan dimatikan','marudio yamezimwa'],
    study_split_on: ['açık','an','on','вкл.','مفعّل','activé','activado','ενεργό','开启','オン','켜짐','चालू','چالو','attivo','aktif','aan','ligado','روشن','চালু','aktif','imewashwa'],
    study_split_off: ['kapalı','aus','off','выкл.','متوقف','désactivé','desactivado','κλειστό','关闭','オフ','꺼짐','बंद','بند','disattivato','mati','uit','desligado','خاموش','বন্ধ','dimatikan','imezimwa'],
    study_split_save_named: ['Çalışmayı kaydet / adlandır','Übung speichern / benennen','Save / name this study','Сохранить / назвать занятие','احفظ المراجعة / سمّها','Enregistrer / nommer cette étude','Guardar / nombrar este estudio','Αποθήκευση / όνομα μελέτης','保存并命名此练习','学習を保存・命名','학습 저장 / 이름 지정','अभ्यास सहेजें / नाम दें','مشق محفوظ کریں / نام دیں','Salva / nomina lo studio','Simpan / beri nama latihan','Studie opslaan / benoemen','Salvar / nomear este estudo','ذخیره / نام‌گذاری تمرین','অধ্যয়ন সংরক্ষণ / নাম দিন','Simpan / namakan latihan','Hifadhi / ipe jina zoezi']
  };
  Object.assign(window.T || {}, pickerLabels);
  const ui = {
    panel: el('studySplitPanel'), scroll: el('rscroll'), status: el('studySplitStatus'),
    picker: el('studySplitVersePicker'), verseList: el('studySplitVerseList'), changeVerse: el('studySplitChangeVerse'),
    liveStatus: el('studySplitLiveStatus'), save: el('studySplitSave'),
    wizard: el('studySplitWizard'), results: el('studySplitResults'),
    words: el('studySplitWords'), draft: el('studySplitDraftParts'), reason: el('studySplitReason'),
    progress: el('studySplitProgress'), title: el('studySplitWizardTitle'),
    confirm: el('studySplitConfirm'), undo: el('studySplitUndo'),
    parts: el('studySplitParts'), more: el('studySplitMore'), playAll: el('studySplitPlayAll'),
    repeat: el('studySplitRepeat'), combine: el('studySplitCombine'), settings: el('studySplitSettings'),
    retry: el('studySplitRetry'), revise: el('studySplitRevise')
  };
  if (!ui.panel || !ui.scroll) return;

  let session = null;
  let remembered = null;
  let dragPointer = null, dragX = 0, dragY = 0, dragFrame = 0;
  const BATCH = 40;
  const setStatus = (message, error = false) => {
    ui.status.textContent = message;
    ui.status.dataset.error = String(error);
  };
  const contextMatches = () => session && studyRange &&
    session.sid === curS && session.sid === studyRange.sid &&
    session.from === studyRange.from && session.to === studyRange.to;
  const audioMatches = () => contextMatches() && session.reciter === SET.reciter &&
    (session.pendingAudio || session.audio === AD_);
  const finalGi = () => ayGi[session?.selectedAy]?.[1];
  const firstGi = () => ayGi[session?.selectedAy]?.[0];
  const sameRange = (a,b) => a && b && a.sid === b.sid && a.from === b.from && a.to === b.to;
  function copyPrefs(source) {
    if (!source || !['auto','manual'].includes(source.mode)) return null;
    const cutsByAy = {};let totalCuts=0;
    for (const [ay,positions] of Object.entries(source.cutsByAy || {})) {
      if (!/^\d{1,3}$/.test(ay) || !Array.isArray(positions) ||
        positions.some((pos,i) => !Number.isInteger(pos) || pos < 1 || pos > 1000 ||
          (i > 0 && pos <= positions[i-1]))) return null;
      totalCuts+=positions.length;if(totalCuts>1000)return null;
      cutsByAy[ay] = [...positions];
    }
    return { mode:source.mode, cutsByAy,
      selectedAy:Number.isInteger(source.selectedAy)?source.selectedAy:null,
      cursorGi:Number.isInteger(source.cursorGi)?source.cursorGi:null,
      selectedGi:Number.isInteger(source.selectedGi)?source.selectedGi:null };
  }
  function remember() {
    if (!session || !contextMatches()) return;
    remembered = {sid:session.sid,from:session.from,to:session.to,
      ...copyPrefs({mode:session.mode,cutsByAy:session.cutsByAy,
        selectedAy:session.selectedAy,cursorGi:session.cursorGi,selectedGi:session.selectedGi})};
  }
  function savedPrefs(range) {
    if (session && sameRange(session,range)) return copyPrefs({mode:session.mode,cutsByAy:session.cutsByAy,
      selectedAy:session.selectedAy,cursorGi:session.cursorGi,selectedGi:session.selectedGi});
    return sameRange(remembered,range) ? copyPrefs(remembered) : null;
  }

  function close({ stopAudio = true, restoreFocus = true } = {}) {
    if (ui.panel.hidden) return;
    dragPointer = null;
    cancelAnimationFrame(dragFrame);
    remember();
    if (stopAudio && typeof stopPlan === 'function') stopPlan(false);
    ui.panel.hidden = true;
    ui.scroll.hidden = false;
    session = null;
    if (typeof syncStudySplitControlLabels === 'function') syncStudySplitControlLabels();
    if (restoreFocus) el('studySplit')?.focus({ preventScroll: true });
  }

  function safeCut(ay, pos) {
    if (typeof studyValidateManualCut !== 'function') return { ok: false };
    try { return studyValidateManualCut(ay, pos) || { ok: false }; }
    catch (_) { return { ok: false }; }
  }

  function resetResults() {
    ui.results.hidden = true;
    ui.parts.replaceChildren();
    ui.retry.hidden = true;
    ui.playAll.disabled = true;
    ui.more.hidden = true;
    session.parts = [];
    session.selectedIndex = 0;
  }

  function renderLiveStatus() {
    if (!session || ui.panel.hidden || ui.results.hidden || !session.parts.length) return;
    const repeat=SET.repOn?
      tr('study_split_repeat_on','{n}× tekrar').replace('{n}',String(SET.rep||1)):
      tr('study_split_repeat_off','tekrar kapalı');
    ui.liveStatus.textContent=tr('study_split_live_status','Şu an {part}/{total}. parça · {repeat} · 1+2 {combine}')
      .replace('{part}',String(session.selectedIndex+1))
      .replace('{total}',String(session.parts.length))
      .replace('{repeat}',repeat)
      .replace('{combine}',SET.cumu?tr('study_split_on','açık'):tr('study_split_off','kapalı'));
    ui.repeat.textContent=repeat;
    ui.repeat.setAttribute('aria-pressed',String(!!SET.repOn));
    ui.combine.setAttribute('aria-pressed',String(!!SET.cumu));
    ui.combine.setAttribute('aria-label',`1+2 · ${SET.cumu?tr('study_split_on','açık'):tr('study_split_off','kapalı')}`);
    ui.save.textContent=tr('study_split_save_named','Çalışmayı kaydet / adlandır');
  }

  function setSelectedIndex(index) {
    if (!contextMatches() || ui.results.hidden || !Number.isInteger(index) || index<0 || index>=session.parts.length) return false;
    session.selectedIndex=index;
    ui.parts.querySelectorAll('.studySplitPart').forEach(card=>{
      const active=Number(card.dataset.index)===index;
      card.classList.toggle('studySplitPartSelected',active);
      card.querySelector('button')?.setAttribute('aria-current',active?'true':'false');
    });
    renderLiveStatus();
    return true;
  }

  function appendParts() {
    const start = session.visibleCount || 0;
    const end = Math.min(start + BATCH, session.parts.length);
    const fragment = document.createDocumentFragment();
    for (let index = start; index < end; index++) {
      const part = session.parts[index];
      const card = document.createElement('div');
      card.className = 'studySplitPart';
      card.dataset.index=String(index);
      card.classList.toggle('studySplitPartSelected',index===session.selectedIndex);
      const text = document.createElement('span');
      text.lang = 'ar';
      text.dir = 'rtl';
      text.textContent = (part.words || []).map(word => (word.txt || '') + (word.joinNext ? '' : ' ')).join('').trimEnd();
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = `${tr('study_split_listen', 'Dinle')} · ${tr('study_split_verse', 'Âyet')} ${part.ay} · ${part.fallbackVerse ? tr('study_split_whole_verse', 'Tam âyet') : `${tr('study_split_part', 'Parça')} ${index + 1}`}`;
      button.disabled = !(part.canPlay || part.pendingAudio || session.pendingAudio || (Number.isFinite(part.f) && Number.isFinite(part.t)));
      button.setAttribute('aria-current',index===session.selectedIndex?'true':'false');
      button.addEventListener('click', async () => {
        if (!contextMatches()) { close(); return; }
        if (!audioMatches()) {
          setStatus(tr('study_split_source_changed', 'Hoca değişti. Parçaları yeni kayıtla yeniden hazırla.'), true);
          ui.retry.hidden = false;
          return;
        }
        if (typeof playStudySplitPart !== 'function') return;
        setSelectedIndex(index);
        button.disabled = true;
        try {
          const played = await playStudySplitPart(part);
          if (played === false && contextMatches()) {
            if (AD_?.sourceUrl && AD_?.verseSegments) build(session.mode);
            else {
              setStatus(tr('study_split_unavailable', 'Bu kayıtta güvenilir ses sınırı bulunamadı. Başka hoca seçebilir veya yeniden deneyebilirsin.'), true);
              ui.retry.hidden = false;
            }
          }
          if (played !== false && contextMatches()) { session.audio = AD_; session.pendingAudio = false; }
        } catch (_) {
          if (contextMatches()) setStatus(tr('study_split_unavailable', 'Bu kayıtta güvenilir ses sınırı bulunamadı. Başka hoca seçebilir veya yeniden deneyebilirsin.'), true);
        } finally { if (contextMatches()) button.disabled = false; }
      });
      card.append(text, button);
      fragment.appendChild(card);
    }
    ui.parts.appendChild(fragment);
    session.visibleCount = end;
    ui.more.hidden = end >= session.parts.length;
    if (!ui.more.hidden) ui.more.textContent = `${tr('study_split_more', 'Daha fazla göster')} (${end}/${session.parts.length})`;
  }

  function renderParts(parts, warningAys = []) {
    session.parts = parts;
    session.selectedIndex = 0;
    session.visibleCount = 0;
    ui.wizard.hidden = true;
    ui.picker.hidden = true;
    ui.results.hidden = false;
    ui.changeVerse.hidden = false;
    ui.retry.hidden = true;
    ui.revise.hidden = session.mode !== 'manual';
    ui.parts.replaceChildren();
    appendParts();
    renderLiveStatus();
    if (typeof syncStudySplitControlLabels === 'function') syncStudySplitControlLabels();
    ui.playAll.disabled = !parts.length || parts.length > 200;
    const notes = [tr('study_split_complete', 'Parçalar hazır. Dinlemek istediğin parçayı seç.')];
    if (warningAys.length) notes.push(tr('study_split_fallback', 'Bazı âyetler tam âyet olarak çalışılır: {a}.').replace('{a}', warningAys.join(', ')));
    if (parts.length > 200) notes.push(tr('study_split_limit', 'Tüm parçaları tek seferde çalışmak için aralığı kısalt (en fazla 200 parça).'));
    setStatus(notes.join(' '), false);
    el('studySplitResultsTitle')?.focus({ preventScroll: true });
  }

  function build(mode) {
    if (!contextMatches() || !Number.isInteger(session.selectedAy) || typeof buildStudySplitParts !== 'function') return;
    if (typeof stopPlan === 'function') stopPlan(false);
    const cuts = mode === 'manual' ? session.cutsByAy : {};
    let outcome;
    try { outcome = buildStudySplitParts(session.selectedAy, session.selectedAy, mode, cuts); }
    catch (_) { outcome = { error: true }; }
    if (outcome?.error || !outcome?.parts?.length) {
      resetResults();
      ui.results.hidden = !(mode === 'manual' && session.confirmed.length);
      ui.revise.hidden = ui.results.hidden;
      ui.wizard.hidden = !ui.results.hidden;
      ui.retry.hidden = false;
      const ay=String(outcome?.error||'').match(/^(\d+)\./)?.[1];
      setStatus(outcome?.error=== 'Geçerli bir âyet aralığı seç.' ? tr('study_invalid','Geçerli bir âyet aralığı seç.') :
        (ay ? `${tr('study_split_verse', 'Âyet')} ${ay}: ` : '')+
        (mode === 'auto' && ay ? tr('study_split_try_manual', 'Bu âyette kelime sınırları güvenilir değil. Elle bölmeyi veya daha kısa bir aralığı dene.') :
          tr('study_split_unavailable', 'Güvenilir ses sınırı bulunamadı. Başka hoca seç veya yeniden dene.')), true);
      return;
    }
    session.audio = AD_;
    session.reciter = SET.reciter;
    session.pendingAudio = Boolean(outcome.pendingAudio || outcome.parts.some(part => part.pendingAudio));
    renderParts(outcome.parts, outcome.warningAys || []);
  }

  function rebuildCuts() {
    session.cutsByAy = {};
    for (const part of session.confirmed) {
      if (part.endGi < ayGi[part.ay][1]) {
        (session.cutsByAy[part.ay] ||= []).push(wordArr[part.endGi].pos);
      }
    }
    remember();
  }

  function restoreManualCuts(cutsByAy,savedCursor=null,savedSelection=null) {
    const cursorGi=Number.isInteger(savedCursor)&&savedCursor>=firstGi()&&savedCursor<=finalGi()+1?savedCursor:finalGi()+1;
    const confirmed=[];
    const selectedCuts=cutsByAy[session.selectedAy]||[];
    for(let ay=session.selectedAy;ay<=session.selectedAy;ay++){
      const gi=ayGi[ay];if(!gi)return false;
      const n=gi[1]-gi[0]+1,cuts=cutsByAy[ay]||[];
      if(cuts.some(pos=>pos>=n||!safeCut(ay,pos).ok))return false;
      let startGi=gi[0];
      for(const pos of [...cuts,n]){
        const endGi=gi[0]+pos-1;
        if(endGi>=cursorGi)break;
        confirmed.push({ay,startGi,endGi});startGi=endGi+1;
      }
    }
    session.confirmed=confirmed;
    session.cutsByAy=selectedCuts.length?{[session.selectedAy]:[...selectedCuts]}:{};
    session.cursorGi=cursorGi;
    session.selectedGi=Number.isInteger(savedSelection)&&savedSelection>=cursorGi&&savedSelection<=finalGi()?savedSelection:null;
    session.manualInitialized=true;
    return true;
  }

  function arabicWords(startGi,endGi) {
    return wordArr.slice(startGi,endGi+1).map(word => (word.txt || '')+(word.joinNext?'':' ')).join('').trimEnd();
  }

  function showVersePicker() {
    if (!contextMatches()) { close(); return; }
    if (typeof stopPlan === 'function') stopPlan(false);
    if (Number.isInteger(session.selectedAy)) session.draftsByAy[session.selectedAy] = {
      cutsByAy: {...session.cutsByAy}, cursorGi:session.cursorGi, selectedGi:session.selectedGi
    };
    ui.wizard.hidden = true;
    ui.results.hidden = true;
    ui.changeVerse.hidden = true;
    if (typeof syncStudySplitControlLabels === 'function') syncStudySplitControlLabels();
    ui.picker.hidden = false;
    el('studySplitVersePickerTitle').textContent = tr('study_split_choose_verse', 'Bölünecek âyeti seç');
    el('studySplitVersePickerHint').textContent = tr('study_split_choose_hint', 'Çalışma aralığından bir âyet seç. Yalnızca seçtiğin âyeti istediğin yerlerden böleceksin.');
    ui.changeVerse.textContent = tr('study_split_change_verse', '← Başka âyet seç');
    ui.verseList.replaceChildren();
    const fragment = document.createDocumentFragment();
    for (let ay=session.from; ay<=session.to; ay++) {
      if (!ayGi[ay]) continue;
      const button=document.createElement('button');button.type='button';
      const label=document.createElement('strong');label.textContent=`${tr('study_split_verse','Âyet')} ${ay}`;
      const arabic=document.createElement('span');arabic.lang='ar';arabic.dir='rtl';
      arabic.textContent=arabicWords(ayGi[ay][0],ayGi[ay][1]);
      button.append(label,arabic);
      button.addEventListener('click',()=>chooseVerse(ay));
      fragment.appendChild(button);
    }
    ui.verseList.appendChild(fragment);
    setStatus(tr('study_split_choose_verse', 'Bölünecek âyeti seç'));
    el('studySplitVersePickerTitle').focus({preventScroll:true});
  }

  function chooseVerse(ay) {
    if (!contextMatches() || !Number.isInteger(ay) || ay<session.from || ay>session.to || !ayGi[ay]) return;
    if (typeof stopPlan === 'function') stopPlan(false);
    const saved=session.draftsByAy[ay] || (session.initialSaved?.selectedAy===ay ? session.initialSaved : null);
    session.selectedAy=ay;
    resetResults();
    session.mode='manual';
    session.confirmed=[];session.cutsByAy={};session.cursorGi=firstGi();session.selectedGi=null;
    session.manualInitialized=true;
    if (saved && (saved.cursorGi!==null || (saved.cutsByAy[ay]||[]).length)) {
      if (!restoreManualCuts(saved.cutsByAy,saved.cursorGi,saved.selectedGi)) {
        session.confirmed=[];session.cutsByAy={};session.cursorGi=firstGi();session.selectedGi=null;
      }
    }
    session.initialSaved=null;
    el('studySplitAuto').setAttribute('aria-pressed','false');
    el('studySplitManual').setAttribute('aria-pressed','true');
    ui.panel.scrollTop=0;
    if (session.cursorGi>finalGi()) build('manual');
    else renderManual(true);
    remember();
  }

  function showConfirmedParts() {
    ui.draft.replaceChildren();
    session.confirmed.slice(-6).forEach((part,index,visible) => {
      const card=document.createElement('div');card.className='studySplitDraftPart';
      const label=document.createElement('strong');
      label.textContent=`${tr('study_split_part','Parça')} ${session.confirmed.length-visible.length+index+1} · ${tr('study_split_verse','Âyet')} ${part.ay}`;
      const arabic=document.createElement('span');arabic.lang='ar';arabic.dir='rtl';
      arabic.textContent=arabicWords(part.startGi,part.endGi);
      card.append(label,arabic);ui.draft.appendChild(card);
    });
  }

  function markEnd(endGi) {
    if(!contextMatches() || !Number.isInteger(endGi) || endGi<session.cursorGi)return false;
    const word=wordArr[endGi],ay=wordArr[session.cursorGi]?.ay;
    if(!word || word.ay!==ay)return false;
    const valid=safeCut(ay,word.pos);
    if(!valid.ok){
      ui.reason.textContent=tr('study_split_unsafe_hint','Bu kelimeden sonra güvenilir ses sınırı yok.');
      return false;
    }
    session.selectedGi=endGi;
    ui.words.querySelectorAll('button[data-gi]').forEach(button=>{
      const gi=Number(button.dataset.gi),included=gi>=session.cursorGi && gi<=endGi;
      button.classList.toggle('studySplitIncluded',included);
      button.classList.toggle('studySplitEndpoint',gi===endGi);
      button.setAttribute('aria-pressed',String(included));
    });
    ui.confirm.disabled=false;
    ui.reason.textContent=tr('study_split_mark_selected','İşaretli kelimeler Böl’e basınca yeni parça olur.');
    return true;
  }

  function renderManual(focusWord = false) {
    if (!contextMatches()) { close(); return; }
    if (!Number.isInteger(session.selectedAy)) { showVersePicker(); return; }
    ui.picker.hidden = true;
    ui.changeVerse.hidden = false;
    ui.wizard.hidden = false;
    ui.results.hidden = true;
    if (typeof syncStudySplitControlLabels === 'function') syncStudySplitControlLabels();
    ui.retry.hidden = true;
    ui.undo.disabled = !session.confirmed.length;
    ui.confirm.disabled = session.selectedGi == null;
    ui.words.replaceChildren();
    showConfirmedParts();
    const gi = session.cursorGi;
    if (!Number.isInteger(gi) || gi > finalGi()) {
      ui.progress.textContent = tr('study_split_finished_steps', 'Tüm parçaların sınırları seçildi.');
      ui.title.textContent = tr('study_split_check', 'Parçalar denetleniyor');
      ui.confirm.disabled = true;
      build('manual');
      if (ui.results.hidden) ui.wizard.hidden = false;
      return;
    }
    const ay = wordArr[gi]?.ay;
    if (!ay || ay !== session.selectedAy) {
      setStatus(tr('study_split_unavailable', 'Bu kayıtta güvenilir ses sınırı bulunamadı. Başka hoca seçebilir veya yeniden deneyebilirsin.'), true);
      return;
    }
    ui.progress.textContent = `${tr('study_split_verse', 'Âyet')} ${ay} · ${tr('study_split_part', 'Parça')} ${session.confirmed.length + 1}`;
    ui.title.textContent = tr('study_split_mark_step', '{n}. parça için kelimeleri işaretle').replace('{n}', session.confirmed.length + 1);
    ui.reason.textContent = tr('study_split_unsafe_hint', 'Soluk görünen kelimelerde güvenilir ses sınırı bulunmuyor.');
    let safeCount = 0;
    for (let cursor = ayGi[ay][0]; cursor <= ayGi[ay][1]; cursor++) {
      const word = wordArr[cursor];
      const used=cursor<gi;
      const valid = used?{ok:false}:safeCut(ay, word.pos);
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.gi=String(cursor);
      button.textContent = word.txt;
      button.disabled = !valid.ok;
      if(used)button.classList.add('studySplitUsed');
      button.setAttribute('aria-label', `${tr('study_split_verse', 'Âyet')} ${ay}, ${tr('study_split_word', 'Kelime')} ${word.pos}: ${word.txt}${used ? '. '+tr('study_split_used','Önceki parçada') : valid.ok ? '' : '. '+tr('study_split_unsafe_hint', 'Ses sınırı doğrulanmadı.')}`);
      if (!valid.ok && !used) button.setAttribute('aria-describedby', 'studySplitReason');
      button.title = used ? tr('study_split_used','Önceki parçada') : valid.ok ? tr('study_split_end_word', 'Parçanın son kelimesi') :
        tr('study_split_unsafe_hint', 'Bu kelimeden sonra güvenilir ses sınırı bulunmuyor.');
      button.setAttribute('aria-pressed', 'false');
      if (valid.ok) {
        safeCount++;
        button.addEventListener('click', () => markEnd(cursor));
      }
      ui.words.appendChild(button);
    }
    if (!safeCount) {
      ui.retry.hidden = false;
      setStatus(tr('study_split_unavailable', 'Bu kayıtta güvenilir ses sınırı bulunamadı. Başka hoca seçebilir veya yeniden deneyebilirsin.'), true);
    } else {
      setStatus(tr('study_split_mark_hint','Parçanın kelimelerini dokunarak veya sürükleyerek işaretle, sonra Böl’e bas.'));
      if(session.selectedGi!==null && !markEnd(session.selectedGi))session.selectedGi=null;
    }
    if (focusWord) ui.words.querySelector('.studySplitEndpoint')?.focus({ preventScroll: false });
  }

  function pointerWord(x,y) {
    const bounds=ui.words.getBoundingClientRect();
    const px=Math.max(bounds.left+4,Math.min(bounds.right-4,x));
    const py=Math.max(bounds.top+4,Math.min(bounds.bottom-4,y));
    const button=document.elementFromPoint(px,py)?.closest?.('button[data-gi]');
    if(button && ui.words.contains(button)){
      if(button.disabled && !button.classList.contains('studySplitUsed'))
        ui.reason.textContent=tr('study_split_unsafe_hint','Bu kelimeden sonra güvenilir ses sınırı yok.');
      else if(!button.disabled)markEnd(Number(button.dataset.gi));
    }
  }
  function dragStep() {
    if(dragPointer===null || ui.panel.hidden)return;
    const bounds=ui.panel.getBoundingClientRect();
    if(dragY<bounds.top+48)ui.panel.scrollTop-=16;
    else if(dragY>bounds.bottom-48)ui.panel.scrollTop+=16;
    pointerWord(dragX,dragY);
    dragFrame=requestAnimationFrame(dragStep);
  }
  ui.words.addEventListener('pointerdown',e=>{
    const button=e.target.closest?.('button[data-gi]');
    if(!button || button.disabled)return;
    dragPointer=e.pointerId;dragX=e.clientX;dragY=e.clientY;
    ui.words.setPointerCapture?.(e.pointerId);
    e.preventDefault();
    markEnd(Number(button.dataset.gi));
    cancelAnimationFrame(dragFrame);dragFrame=requestAnimationFrame(dragStep);
  });
  ui.words.addEventListener('pointermove',e=>{
    if(dragPointer!==e.pointerId)return;
    dragX=e.clientX;dragY=e.clientY;pointerWord(dragX,dragY);
  });
  for(const type of ['pointerup','pointercancel'])ui.words.addEventListener(type,e=>{
    if(dragPointer!==e.pointerId)return;
    dragPointer=null;cancelAnimationFrame(dragFrame);
    try{ui.words.releasePointerCapture(e.pointerId);}catch(_){}
  });

  function setMode(mode) {
    if (!session || (mode !== 'auto' && mode !== 'manual')) return;
    if (!Number.isInteger(session.selectedAy)) { showVersePicker(); return; }
    if (typeof stopPlan === 'function') stopPlan(false);
    session.mode = mode;
    remember();
    el('studySplitAuto').setAttribute('aria-pressed', String(mode === 'auto'));
    el('studySplitManual').setAttribute('aria-pressed', String(mode === 'manual'));
    resetResults();
    if (mode === 'manual') {
      if (!session.manualInitialized) {
        session.confirmed = [];
        session.cutsByAy = {};
        session.cursorGi = firstGi();
        session.selectedGi = null;
        session.manualInitialized = true;
      }
      renderManual();
    } else {
      ui.wizard.hidden = true;
      build('auto');
    }
  }

  function open() {
    if (!studyRange || studyRange.sid !== curS || !ayGi[studyRange.from] || !ayGi[studyRange.to]) return;
    if (!ui.panel.hidden) { close(); return; }
    if (typeof stopPlan === 'function') stopPlan(false);
    const saved=savedPrefs(studyRange);
    session = { sid: curS, from: studyRange.from, to: studyRange.to,
      reciter: SET.reciter, audio: AD_, pendingAudio: false, mode: 'manual', manualInitialized: false, cutsByAy: {}, confirmed: [],
      selectedAy: null, selectedGi: null, cursorGi: null, parts: [], draftsByAy:{}, initialSaved:saved };
    el('studySplitRange').textContent = `${SURAHS[curS - 1].tr} · ${session.from}–${session.to}`;
    ui.scroll.hidden = true;
    ui.panel.hidden = false;
    ui.panel.scrollTop = 0;
    showVersePicker();
  }

  el('studySplitClose').addEventListener('click', () => close());
  ui.changeVerse.addEventListener('click',showVersePicker);
  ui.save.addEventListener('click',()=>{
    if (!contextMatches() || ui.results.hidden || typeof openStudySetup !== 'function') return;
    remember();
    close({restoreFocus:false});
    openStudySetup(false,true);
  });
  ui.more.addEventListener('click', appendParts);
  ui.repeat.addEventListener('click', () => {
    if (!contextMatches() || ui.results.hidden) return;
    SET.repOn=!SET.repOn;
    if(typeof saveSet==='function')saveSet();
    if(typeof syncRep==='function')syncRep();
    if(typeof syncRep2==='function')syncRep2();
    renderLiveStatus();
    if(SET.repOn)void playActiveStudySplit();
    else if(typeof stopPlan==='function')stopPlan(false);
  });
  ui.combine.addEventListener('click', () => {
    if (!contextMatches() || ui.results.hidden) return;
    SET.cumu=!SET.cumu;
    if(SET.cumu)SET.repOn=true;
    if(typeof saveSet==='function')saveSet();
    if(typeof syncRep==='function')syncRep();
    if(typeof syncRep2==='function')syncRep2();
    if(typeof syncCumu==='function')syncCumu();
    if(typeof syncCumu2==='function')syncCumu2();
    renderLiveStatus();
    if(SET.cumu)void playActiveStudySplit();
    else if(typeof stopPlan==='function')stopPlan(false);
  });
  ui.settings.addEventListener('click', () => {
    if (!contextMatches() || ui.results.hidden || typeof fillGearSheet!=='function') return;
    gearCtx='studyParts';
    fillGearSheet();
    openSheet('gearSheet');
  });
  el('studySplitAuto').addEventListener('click', () => setMode('auto'));
  el('studySplitManual').addEventListener('click', () => setMode('manual'));
  ui.confirm.addEventListener('click', () => {
    if (!contextMatches() || session.selectedGi == null) return;
    const endGi = session.selectedGi;
    const word = wordArr[endGi];
    if (!word || endGi < session.cursorGi || endGi > ayGi[word.ay][1] || !safeCut(word.ay, word.pos).ok) {
      setStatus(tr('study_split_unavailable', 'Bu kayıtta güvenilir ses sınırı bulunamadı. Başka hoca seçebilir veya yeniden deneyebilirsin.'), true);
      return;
    }
    session.confirmed.push({ ay: word.ay, startGi: session.cursorGi, endGi });
    try{window.elifaLog?.('split_created',{mode:'split',range_bucket:'1'});}catch(e){}
    session.cursorGi = endGi + 1;
    session.selectedGi = null;
    rebuildCuts();
    renderManual(true);
  });
  ui.undo.addEventListener('click', () => {
    if (!session?.confirmed.length) return;
    const previous = session.confirmed.pop();
    session.cursorGi = previous.startGi;
    session.selectedGi = previous.endGi;
    rebuildCuts();
    renderManual(true);
  });
  ui.revise.addEventListener('click', () => {
    if (session?.mode !== 'manual') return;
    if (session.confirmed.length) {
      const previous = session.confirmed.pop();
      session.cursorGi = previous.startGi;
      session.selectedGi = previous.endGi;
      rebuildCuts();
    }
    renderManual(true);
  });
  ui.playAll.addEventListener('click', async () => {
    if (!session?.parts.length || typeof playStudySplitRange !== 'function') return;
    if (!contextMatches()) { close(); return; }
    if (!audioMatches()) {
      setStatus(tr('study_split_source_changed', 'Hoca değişti. Parçaları yeni kayıtla yeniden hazırla.'), true);
      ui.retry.hidden = false;
      return;
    }
    ui.playAll.disabled = true;
    try {
      const played = await playStudySplitRange(session.parts, 0, session.parts.length - 1);
      if (played === false && contextMatches()) {
        if (AD_?.sourceUrl && AD_?.verseSegments) build(session.mode);
        else {
          setStatus(tr('study_split_unavailable', 'Bu kayıtta güvenilir ses sınırı bulunamadı. Başka hoca seçebilir veya yeniden deneyebilirsin.'), true);
          ui.retry.hidden = false;
        }
      }
      if (played !== false && contextMatches()) { session.audio = AD_; session.pendingAudio = false; }
    } catch (_) {
      if (contextMatches()) setStatus(tr('study_split_unavailable', 'Bu kayıtta güvenilir ses sınırı bulunamadı. Başka hoca seçebilir veya yeniden deneyebilirsin.'), true);
    } finally { if (contextMatches()) ui.playAll.disabled = !session.parts.length || session.parts.length > 200; }
  });
  ui.retry.addEventListener('click', () => {
    if (!contextMatches()) { close(); return; }
    session.audio = AD_;
    session.reciter = SET.reciter;
    if (session.mode === 'manual' && session.cursorGi <= finalGi()) renderManual();
    else build(session.mode);
  });
  for (const id of ['studyEdit', 'studyExit']) {
    el(id).addEventListener('click', () => close(), true);
  }
  new MutationObserver(() => {
    if (!ui.panel.hidden && (!studyRange || el('studyBanner').hidden)) close();
  }).observe(el('studyBanner'), { attributes: true, attributeFilter: ['hidden'] });
  window.elifaOpenStudySplit = open;
  window.elifaCloseStudySplit = close;
  window.elifaStudySplitSelection = () => {
    if (!contextMatches() || ui.panel.hidden || ui.results.hidden || !Number.isInteger(session.selectedAy) || !session.parts.length) return null;
    return {sid:session.sid,ay:session.selectedAy,parts:session.parts,
      selectedIndex:session.selectedIndex,mode:session.mode,cutsByAy:session.cutsByAy};
  };
  window.elifaStudySplitSetIndex = setSelectedIndex;
  window.elifaStudySplitRefreshStatus = renderLiveStatus;
  window.elifaStudySplitPrefs = savedPrefs;
  window.elifaRememberStudySplitPrefs = (range,prefs) => {
    const clean=copyPrefs(prefs);
    if(!range||!clean)return false;
    remembered={sid:range.sid,from:range.from,to:range.to,...clean};
    return true;
  };
  if (typeof document.addEventListener === 'function') {
    for (const type of ['click','input','change']) document.addEventListener(type,renderLiveStatus);
  }
  window.addEventListener?.('elifa:language-changed',renderLiveStatus);
})();
