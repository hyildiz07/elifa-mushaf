/* Study Desk split UI. The chapter audio and ordinary split view stay in index.html. */
(() => {
  const el = id => document.getElementById(id);
  const tr = (key, fallback) => {
    const translated = typeof window.tr === 'function' ? window.tr(key) : key;
    return translated && translated !== key ? translated : fallback;
  };
  const ui = {
    panel: el('studySplitPanel'), scroll: el('rscroll'), status: el('studySplitStatus'),
    wizard: el('studySplitWizard'), results: el('studySplitResults'),
    words: el('studySplitWords'), draft: el('studySplitDraftParts'), reason: el('studySplitReason'),
    progress: el('studySplitProgress'), title: el('studySplitWizardTitle'),
    confirm: el('studySplitConfirm'), undo: el('studySplitUndo'),
    parts: el('studySplitParts'), more: el('studySplitMore'), playAll: el('studySplitPlayAll'),
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
  const finalGi = () => ayGi[session?.to]?.[1];
  const firstGi = () => ayGi[session?.from]?.[0];
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
      cursorGi:Number.isInteger(source.cursorGi)?source.cursorGi:null,
      selectedGi:Number.isInteger(source.selectedGi)?source.selectedGi:null };
  }
  function remember() {
    if (!session || !contextMatches()) return;
    remembered = {sid:session.sid,from:session.from,to:session.to,
      ...copyPrefs({mode:session.mode,cutsByAy:session.cutsByAy,
        cursorGi:session.cursorGi,selectedGi:session.selectedGi})};
  }
  function savedPrefs(range) {
    if (session && sameRange(session,range)) return copyPrefs({mode:session.mode,cutsByAy:session.cutsByAy,
      cursorGi:session.cursorGi,selectedGi:session.selectedGi});
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
  }

  function appendParts() {
    const start = session.visibleCount || 0;
    const end = Math.min(start + BATCH, session.parts.length);
    const fragment = document.createDocumentFragment();
    for (let index = start; index < end; index++) {
      const part = session.parts[index];
      const card = document.createElement('div');
      card.className = 'studySplitPart';
      const text = document.createElement('span');
      text.lang = 'ar';
      text.dir = 'rtl';
      text.textContent = (part.words || []).map(word => (word.txt || '') + (word.joinNext ? '' : ' ')).join('').trimEnd();
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = `${tr('study_split_listen', 'Dinle')} · ${tr('study_split_verse', 'Âyet')} ${part.ay} · ${part.fallbackVerse ? tr('study_split_whole_verse', 'Tam âyet') : `${tr('study_split_part', 'Parça')} ${index + 1}`}`;
      button.disabled = !(part.canPlay || part.pendingAudio || session.pendingAudio || (Number.isFinite(part.f) && Number.isFinite(part.t)));
      button.addEventListener('click', async () => {
        if (!contextMatches()) { close(); return; }
        if (!audioMatches()) {
          setStatus(tr('study_split_source_changed', 'Hoca değişti. Parçaları yeni kayıtla yeniden hazırla.'), true);
          ui.retry.hidden = false;
          return;
        }
        if (typeof playStudySplitPart !== 'function') return;
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
    session.visibleCount = 0;
    ui.wizard.hidden = true;
    ui.results.hidden = false;
    ui.retry.hidden = true;
    ui.revise.hidden = session.mode !== 'manual';
    ui.parts.replaceChildren();
    appendParts();
    ui.playAll.disabled = !parts.length || parts.length > 200;
    const notes = [tr('study_split_complete', 'Parçalar hazır. Dinlemek istediğin parçayı seç.')];
    if (warningAys.length) notes.push(tr('study_split_fallback', 'Bazı âyetler tam âyet olarak çalışılır: {a}.').replace('{a}', warningAys.join(', ')));
    if (parts.length > 200) notes.push(tr('study_split_limit', 'Tüm parçaları tek seferde çalışmak için aralığı kısalt (en fazla 200 parça).'));
    setStatus(notes.join(' '), false);
    el('studySplitResultsTitle')?.focus({ preventScroll: true });
  }

  function build(mode) {
    if (!contextMatches() || typeof buildStudySplitParts !== 'function') return;
    if (typeof stopPlan === 'function') stopPlan(false);
    const cuts = mode === 'manual' ? session.cutsByAy : {};
    let outcome;
    try { outcome = buildStudySplitParts(session.from, session.to, mode, cuts); }
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
    for(let ay=session.from;ay<=session.to;ay++){
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
    session.confirmed=confirmed;session.cutsByAy=cutsByAy;
    session.cursorGi=cursorGi;
    session.selectedGi=Number.isInteger(savedSelection)&&savedSelection>=cursorGi&&savedSelection<=finalGi()?savedSelection:null;
    session.manualInitialized=true;
    return true;
  }

  function arabicWords(startGi,endGi) {
    return wordArr.slice(startGi,endGi+1).map(word => (word.txt || '')+(word.joinNext?'':' ')).join('').trimEnd();
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
    ui.wizard.hidden = false;
    ui.results.hidden = true;
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
    if (!ay || ay < session.from || ay > session.to) {
      setStatus(tr('study_split_unavailable', 'Bu kayıtta güvenilir ses sınırı bulunamadı. Başka hoca seçebilir veya yeniden deneyebilirsin.'), true);
      return;
    }
    ui.progress.textContent = `${tr('study_split_verse', 'Âyet')} ${ay} · ${tr('study_split_part', 'Parça')} ${session.confirmed.length + 1}`;
    ui.title.textContent = tr('study_split_mark_step', '{n}. parça için kelimeleri işaretle').replace('{n}', session.confirmed.length + 1);
    ui.reason.textContent = tr('study_split_unsafe_hint', 'Soluk görünen kelimelerde güvenilir ses sınırı bulunmuyor.');
    let safeCount = 0;
    let defaultGi=null;
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
        if(defaultGi===null && cursor>=Math.min(gi+2,ayGi[ay][1]))defaultGi=cursor;
        button.addEventListener('click', () => markEnd(cursor));
      }
      ui.words.appendChild(button);
    }
    if(defaultGi===null)defaultGi=ayGi[ay][1];
    if (!safeCount) {
      ui.retry.hidden = false;
      setStatus(tr('study_split_unavailable', 'Bu kayıtta güvenilir ses sınırı bulunamadı. Başka hoca seçebilir veya yeniden deneyebilirsin.'), true);
    } else {
      setStatus(tr('study_split_mark_hint','Parçanın kelimelerini dokunarak veya sürükleyerek işaretle, sonra Böl’e bas.'));
      if(!markEnd(session.selectedGi ?? defaultGi))markEnd(ayGi[ay][1]);
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
      selectedGi: null, cursorGi: ayGi[studyRange.from][0], parts: [] };
    el('studySplitRange').textContent = `${SURAHS[curS - 1].tr} · ${session.from}–${session.to}`;
    ui.scroll.hidden = true;
    ui.panel.hidden = false;
    ui.panel.scrollTop = 0;
    if(saved?.mode==='manual'&&restoreManualCuts(saved.cutsByAy,saved.cursorGi,saved.selectedGi)){
      session.mode='manual';
      el('studySplitAuto').setAttribute('aria-pressed','false');
      el('studySplitManual').setAttribute('aria-pressed','true');
      if(session.cursorGi<=finalGi())renderManual();
      else build('manual');
      if(session.cursorGi>finalGi() && ui.results.hidden){
        session.manualInitialized=false;session.confirmed=[];session.cutsByAy={};
        setMode('manual');
      }
    }else setMode('manual');
    (ui.results.hidden ? ui.words.querySelector('.studySplitEndpoint') : el('studySplitResultsTitle'))?.focus({ preventScroll: true });
  }

  el('studySplitClose').addEventListener('click', () => close());
  ui.more.addEventListener('click', appendParts);
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
  window.elifaStudySplitPrefs = savedPrefs;
  window.elifaRememberStudySplitPrefs = (range,prefs) => {
    const clean=copyPrefs(prefs);
    if(!range||!clean)return false;
    remembered={sid:range.sid,from:range.from,to:range.to,...clean};
    return true;
  };
})();
