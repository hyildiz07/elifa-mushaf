(function(){
  'use strict';
  // Same locale order as the app's translation table.
  const labels={
    study_save_name:['Çalışmaya ad ver (isteğe bağlı)','Übung benennen (optional)','Name this study (optional)','Назовите занятие (необязательно)','سمّ هذه المراجعة (اختياري)','Nommer cette étude (facultatif)','Pon nombre al estudio (opcional)','Ονόμασε τη μελέτη (προαιρετικά)','为练习命名（可选）','学習に名前を付ける（任意）','학습 이름 (선택)','अभ्यास का नाम (वैकल्पिक)','مشق کا نام (اختیاری)','Dai un nome allo studio (facoltativo)','Beri nama latihan (opsional)','Geef de studie een naam (optioneel)','Nomeie o estudo (opcional)','نام تمرین (اختیاری)','অনুশীলনের নাম (ঐচ্ছিক)','Namakan latihan (pilihan)','Ipe zoezi jina (hiari)'],
    study_save_name_hint:['Örn. Kehf 1–10','z. B. Al-Kahf 1–10','e.g. Al-Kahf 1–10','Напр. Аль-Кахф 1–10','مثال: الكهف ١–١٠','Ex. Al-Kahf 1–10','Ej. Al-Kahf 1–10','π.χ. Αλ-Καχφ 1–10','例如：山洞章 1–10','例：洞窟章 1–10','예: 알카흐프 1–10','जैसे अल-कहफ़ 1–10','مثلاً الکہف 1–10','Es. Al-Kahf 1–10','Mis. Al-Kahf 1–10','Bijv. Al-Kahf 1–10','Ex.: Al-Kahf 1–10','مثلاً کهف ۱–۱۰','যেমন আল-কাহফ ১–১০','Contoh: Al-Kahf 1–10','Mf. Al-Kahf 1–10'],
    study_save:['Bu çalışmayı kaydet','Übung speichern','Save this study','Сохранить занятие','احفظ هذه المراجعة','Enregistrer cette étude','Guardar este estudio','Αποθήκευση μελέτης','保存此练习','この学習を保存','이 학습 저장','यह अभ्यास सहेजें','یہ مشق محفوظ کریں','Salva questo studio','Simpan latihan ini','Deze studie opslaan','Guardar este estudo','ذخیره این تمرین','এই অনুশীলন সংরক্ষণ','Simpan latihan ini','Hifadhi zoezi hili'],
    study_update:['Kaydı güncelle','Eintrag aktualisieren','Update saved study','Обновить запись','حدّث المراجعة','Mettre à jour','Actualizar estudio','Ενημέρωση μελέτης','更新已保存练习','保存した学習を更新','저장된 학습 수정','सहेजा अभ्यास बदलें','محفوظ مشق بدلیں','Aggiorna studio','Perbarui latihan','Studie bijwerken','Atualizar estudo','به‌روزرسانی تمرین','সংরক্ষিত অনুশীলন বদলান','Kemas kini latihan','Sasisha zoezi'],
    study_saved:['Kaydedilen çalışmalar','Gespeicherte Übungen','Saved studies','Сохранённые занятия','مراجعات محفوظة','Études enregistrées','Estudios guardados','Αποθηκευμένες μελέτες','已保存的练习','保存した学習','저장된 학습','सहेजे अभ्यास','محفوظ مشقیں','Studi salvati','Latihan tersimpan','Opgeslagen studies','Estudos guardados','تمرین‌های ذخیره‌شده','সংরক্ষিত অনুশীলন','Latihan tersimpan','Mazoezi yaliyohifadhiwa'],
    study_saved_empty:['Henüz kayıtlı çalışma yok.','Noch keine Übung gespeichert.','No saved studies yet.','Пока нет сохранённых занятий.','لا توجد مراجعات محفوظة بعد.','Aucune étude enregistrée.','Aún no hay estudios guardados.','Δεν υπάρχουν αποθηκευμένες μελέτες.','尚无已保存练习。','保存した学習はありません。','저장된 학습이 없습니다.','अभी कोई अभ्यास सहेजा नहीं गया।','ابھی کوئی محفوظ مشق نہیں۔','Nessuno studio salvato.','Belum ada latihan tersimpan.','Nog geen studies opgeslagen.','Ainda não há estudos guardados.','هنوز تمرینی ذخیره نشده است.','এখনও কোনো অনুশীলন সংরক্ষিত নেই।','Belum ada latihan tersimpan.','Bado hakuna zoezi lililohifadhiwa.'],
    study_open_saved:['Aç','Öffnen','Open','Открыть','افتح','Ouvrir','Abrir','Άνοιγμα','打开','開く','열기','खोलें','کھولیں','Apri','Buka','Openen','Abrir','باز کردن','খুলুন','Buka','Fungua'],
    study_edit_saved:['Düzenle','Bearbeiten','Edit','Изменить','تعديل','Modifier','Editar','Επεξεργασία','编辑','編集','편집','संपादित करें','ترمیم','Modifica','Ubah','Bewerken','Editar','ویرایش','সম্পাদনা','Ubah','Hariri'],
    study_delete:['Sil','Löschen','Delete','Удалить','احذف','Supprimer','Eliminar','Διαγραφή','删除','削除','삭제','हटाएँ','حذف کریں','Elimina','Hapus','Verwijderen','Excluir','حذف','মুছুন','Padam','Futa'],
    study_cancel:['İptal','Abbrechen','Cancel','Отмена','إلغاء','Annuler','Cancelar','Ακύρωση','取消','キャンセル','취소','रद्द करें','منسوخ','Annulla','Batal','Annuleren','Cancelar','لغو','বাতিল','Batal','Ghairi'],
    study_confirm_delete:['Evet, sil','Ja, löschen','Yes, delete','Да, удалить','نعم، احذف','Oui, supprimer','Sí, eliminar','Ναι, διαγραφή','确认删除','はい、削除','예, 삭제','हाँ, हटाएँ','ہاں، حذف کریں','Sì, elimina','Ya, hapus','Ja, verwijderen','Sim, excluir','بله، حذف کن','হ্যাঁ, মুছুন','Ya, padam','Ndiyo, futa'],
    study_delete_confirm:['“{name}” çalışması silinsin mi?','Übung „{name}“ löschen?','Delete “{name}”?','Удалить «{name}»?','حذف «{name}»؟','Supprimer « {name} » ?','¿Eliminar «{name}»?','Διαγραφή «{name}»;','删除“{name}”？','「{name}」を削除しますか？','“{name}” 삭제할까요?','“{name}” हटाएँ?','“{name}” حذف کریں؟','Eliminare “{name}”?','Hapus “{name}”?','„{name}” verwijderen?','Excluir “{name}”?','«{name}» حذف شود؟','“{name}” মুছবেন?','Padam “{name}”?','Futa “{name}”?'],
    study_saved_ok:['Çalışma kaydedildi.','Übung gespeichert.','Study saved.','Занятие сохранено.','حُفظت المراجعة.','Étude enregistrée.','Estudio guardado.','Η μελέτη αποθηκεύτηκε.','练习已保存。','学習を保存しました。','학습을 저장했습니다.','अभ्यास सहेजा गया।','مشق محفوظ ہوگئی۔','Studio salvato.','Latihan disimpan.','Studie opgeslagen.','Estudo guardado.','تمرین ذخیره شد.','অনুশীলন সংরক্ষিত হয়েছে।','Latihan disimpan.','Zoezi limehifadhiwa.'],
    study_deleted:['Çalışma silindi.','Übung gelöscht.','Study deleted.','Занятие удалено.','حُذفت المراجعة.','Étude supprimée.','Estudio eliminado.','Η μελέτη διαγράφηκε.','练习已删除。','学習を削除しました。','학습을 삭제했습니다.','अभ्यास हटाया गया।','مشق حذف ہوگئی۔','Studio eliminato.','Latihan dihapus.','Studie verwijderd.','Estudo excluído.','تمرین حذف شد.','অনুশীলন মুছে ফেলা হয়েছে।','Latihan dipadam.','Zoezi limefutwa.'],
    study_save_failed:['Kaydedilemedi. Cihazda boş alan açıp tekrar dene.','Speichern fehlgeschlagen. Speicherplatz prüfen.','Could not save. Free device storage and retry.','Не удалось сохранить. Освободите место.','تعذّر الحفظ. أخلِ مساحة وحاول مجددًا.','Enregistrement impossible. Libérez de l’espace.','No se pudo guardar. Libera espacio.','Η αποθήκευση απέτυχε. Ελευθέρωσε χώρο.','无法保存。请释放设备空间。','保存できません。空き容量を確保してください。','저장할 수 없습니다. 저장 공간을 확보하세요.','सहेजा नहीं जा सका। जगह खाली करें।','محفوظ نہیں ہوسکا۔ جگہ خالی کریں۔','Salvataggio non riuscito. Libera spazio.','Tidak dapat menyimpan. Kosongkan ruang.','Opslaan mislukt. Maak ruimte vrij.','Não foi possível salvar. Libere espaço.','ذخیره نشد. فضای دستگاه را خالی کن.','সংরক্ষণ করা যায়নি। জায়গা খালি করুন।','Gagal menyimpan. Kosongkan ruang.','Haikuhifadhiwa. Ongeza nafasi.'],
    study_limit:['En fazla 100 çalışma kaydedilebilir.','Maximal 100 Übungen speicherbar.','You can save up to 100 studies.','Можно сохранить до 100 занятий.','يمكن حفظ ١٠٠ مراجعة كحد أقصى.','Vous pouvez enregistrer 100 études au maximum.','Puedes guardar hasta 100 estudios.','Μπορείς να αποθηκεύσεις έως 100 μελέτες.','最多可保存 100 个练习。','最大100件の学習を保存できます。','최대 100개를 저장할 수 있습니다.','अधिकतम 100 अभ्यास सहेज सकते हैं।','زیادہ سے زیادہ ۱۰۰ مشقیں محفوظ ہوسکتی ہیں۔','Puoi salvare fino a 100 studi.','Maksimal 100 latihan dapat disimpan.','Je kunt maximaal 100 studies opslaan.','Você pode salvar até 100 estudos.','حداکثر ۱۰۰ تمرین ذخیره می‌شود.','সর্বোচ্চ ১০০টি অনুশীলন সংরক্ষণ করা যায়।','Maksimum 100 latihan boleh disimpan.','Unaweza kuhifadhi hadi mazoezi 100.']
  };
  Object.assign(window.T||{},labels);
  const key='studySessions';
  const byId=id=>document.getElementById(id);
  let editingId=null,activeId=null,confirmation=null;
  function message(label){return window.tr?window.tr(label):label;}
  function rangeOf(item){return SURAHS[item.sid-1].tr+' · '+item.from+'–'+item.to+' '+message('study_verses');}
  function isValid(item){
    return item&&typeof item==='object'&&!Array.isArray(item)&&
      typeof item.id==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(item.id)&&
      typeof item.title==='string'&&!!item.title.trim()&&item.title.length<=80&&
      validStudyRange(item.sid,item.from,item.to)&&
      typeof item.createdAt==='string'&&Number.isFinite(Date.parse(item.createdAt))&&
      typeof item.updatedAt==='string'&&Number.isFinite(Date.parse(item.updatedAt))&&
      (item.splitMode===undefined||['auto','manual'].includes(item.splitMode))&&
      (item.manualCuts===undefined||(item.manualCuts&&typeof item.manualCuts==='object'&&
        !Array.isArray(item.manualCuts)&&Object.values(item.manualCuts).reduce((n,cuts)=>n+(Array.isArray(cuts)?cuts.length:1001),0)<=1000&&
        Object.entries(item.manualCuts).every(([ay,cuts])=>
          /^\d{1,3}$/.test(ay)&&Number(ay)>=item.from&&Number(ay)<=item.to&&
          Array.isArray(cuts)&&cuts.every((pos,i)=>Number.isInteger(pos)&&pos>0&&pos<=1000&&
            (i===0||pos>cuts[i-1])))));
  }
  function read(){const items=store.get(key,[]);return Array.isArray(items)?items.filter(isValid):[];}
  function uuid(){
    if(crypto.randomUUID)return crypto.randomUUID();
    const bytes=crypto.getRandomValues(new Uint8Array(16));bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
    return [...bytes].map((n,i)=>(i===4||i===6||i===8||i===10?'-':'')+n.toString(16).padStart(2,'0')).join('');
  }
  function resetEdit(){editingId=null;byId('studySessionTitle').value='';updateSaveState();}
  function updateSaveState(){
    const {sid,from,to}=readStudyDraft(),valid=validStudyRange(sid,from,to);
    byId('studySessionSave').disabled=!valid;
    byId('studySessionSave').textContent=message(editingId?'study_update':'study_save');
    const meta=SURAHS[sid-1];
    byId('studySessionTitle').placeholder=meta?meta.tr+' '+from+'–'+to:message('study_save_name_hint');
  }
  function button(label,action,extraClass=''){
    const el=document.createElement('button');el.type='button';el.textContent=message(label);
    if(extraClass)el.className=extraClass;el.addEventListener('click',action);return el;
  }
  function applyRange(item){
    byId('studySurah').value=item.sid;byId('studyFrom').value=item.from;byId('studyTo').value=item.to;
    updateStudySetup();updateSaveState();
  }
  function closeConfirmation(returnFocus=true){
    if(!confirmation)return;
    const {panel,trigger}=confirmation;confirmation=null;
    trigger.setAttribute('aria-expanded','false');panel.remove();
    if(returnFocus)trigger.focus();
  }
  function askDelete(item,row,trigger){
    if(confirmation?.trigger===trigger){closeConfirmation();return;}
    closeConfirmation(false);
    const panel=document.createElement('div');panel.className='studyDeleteConfirm';
    panel.id='studyDeleteConfirm-'+item.id;panel.setAttribute('role','group');
    const prompt=document.createElement('p');prompt.id=panel.id+'-prompt';
    prompt.textContent=message('study_delete_confirm').replace('{name}',item.title);
    panel.setAttribute('aria-labelledby',prompt.id);
    const actions=document.createElement('div');actions.className='studyDeleteConfirmActions';
    const cancel=button('study_cancel',()=>closeConfirmation());
    const remove=button('study_confirm_delete',()=>{
      const current=read(),next=current.filter(entry=>entry.id!==item.id);
      if(next.length===current.length){closeConfirmation();return;}
      if(!store.set(key,next)){toast(message('study_save_failed'));return;}
      closeConfirmation(false);
      if(editingId===item.id)resetEdit();if(activeId===item.id)activeId=null;
      render();toast(message('study_deleted'));
      const first=byId('studySavedList').children[0]?.querySelector('button');
      (first||byId('studySavedHeading')).focus({preventScroll:true});
    },'studyDeleteConfirmAction');
    actions.append(cancel,remove);panel.append(prompt,actions);
    panel.addEventListener('keydown',event=>{
      if(event.key==='Escape'){event.preventDefault();closeConfirmation();}
    });
    row.appendChild(panel);
    trigger.setAttribute('aria-expanded','true');trigger.setAttribute('aria-controls',panel.id);
    confirmation={panel,trigger};cancel.focus({preventScroll:true});
  }
  function render(){
    const items=read().sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
    closeConfirmation(false);
    const list=byId('studySavedList');list.replaceChildren();
    byId('studySavedEmpty').hidden=items.length>0;
    for(const item of items){
      const row=document.createElement('li');row.className='studySavedItem';
      const detail=document.createElement('div'),title=document.createElement('strong'),range=document.createElement('small');
      title.textContent=item.title;range.textContent=rangeOf(item)+(item.splitMode==='manual'?' · '+message('study_split_manual'):'');detail.append(title,range);
      const actions=document.createElement('div');actions.className='studySavedActions';
      const open=button('study_open_saved',()=>{
          applyRange(item);
          activeId=item.id;
          if(item.splitMode)window.elifaRememberStudySplitPrefs?.(item,{mode:item.splitMode,cutsByAy:item.manualCuts||{}});
          byId('studyOpen').click();
        });
      const edit=button('study_edit_saved',()=>{
          editingId=item.id;applyRange(item);byId('studySessionTitle').value=item.title;
          updateSaveState();byId('studySessionTitle').focus();
        });
      const remove=button('study_delete',()=>askDelete(item,row,remove),'studyDelete');
      remove.setAttribute('aria-expanded','false');
      for(const control of [open,edit,remove])control.setAttribute('aria-label',item.title+' · '+control.textContent);
      actions.append(open,edit,remove);
      row.append(detail,actions);list.appendChild(row);
    }
    updateSaveState();
  }
  function save(){
    const {sid,from,to}=readStudyDraft();
    if(!validStudyRange(sid,from,to)){updateStudySetup();return;}
    const items=read(),now=new Date().toISOString();
    const title=byId('studySessionTitle').value.trim()||SURAHS[sid-1].tr+' '+from+'–'+to;
    if(title.length>80){toast(message('study_save_failed'));return;}
    let index=editingId?items.findIndex(item=>item.id===editingId):-1;
    if(editingId&&index<0){resetEdit();render();toast(message('study_save_failed'));return;}
    if(index<0&&items.length>=100){toast(message('study_limit'));return;}
    const old=index>=0?items[index]:null;
    const item={id:old?.id||uuid(),title,sid,from,to,createdAt:old?.createdAt||now,updatedAt:now};
    const sameOld=old&&old.sid===sid&&old.from===from&&old.to===to;
    const prefs=window.elifaStudySplitPrefs?.(item)||(sameOld&&old.splitMode?{mode:old.splitMode,cutsByAy:old.manualCuts||{}}:null);
    if(prefs){item.splitMode=prefs.mode;item.manualCuts=prefs.cutsByAy;}
    if(index>=0)items[index]=item;else items.push(item);
    if(!store.set(key,items)){toast(message('study_save_failed'));return;}
    editingId=item.id;activeId=item.id;byId('studySessionTitle').value=title;render();toast(message('study_saved_ok'));
  }
  byId('studySessionSave').addEventListener('click',save);
  for(const id of ['studySurah','studyFrom','studyTo'])byId(id).addEventListener('input',updateSaveState);
  window.addEventListener('elifa:language-changed',render);
  window.addEventListener('storage',event=>{if(event.key===key)render();});
  function translateStatic(){
    document.querySelectorAll('#studySetup [data-study-i18n],#studySetup [data-study-i18n-ph]').forEach(el=>{
      const label=el.getAttribute('data-study-i18n'),placeholder=el.getAttribute('data-study-i18n-ph');
      if(label&&labels[label])el.textContent=message(label);
      if(placeholder&&labels[placeholder])el.placeholder=message(placeholder);
    });
  }
  window.elifaStudySessions={
    onOpen({fromReader=false}={}){
      const current=fromReader&&activeId?read().find(item=>item.id===activeId):null;
      const draft=readStudyDraft();
      if(current&&current.sid===draft.sid&&current.from===draft.from&&current.to===draft.to){
        editingId=current.id;byId('studySessionTitle').value=current.title;
      }else{activeId=null;resetEdit();}
      render();
    },
    clearActive(){activeId=null;resetEdit();},render
  };
  window.addEventListener('elifa:language-changed',translateStatic);
  translateStatic();
  render();
})();
