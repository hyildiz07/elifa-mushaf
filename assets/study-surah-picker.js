/* Çalışma Masası sûre seçimi: mevcut #studySurah değerini koruyan aramalı liste. */
(function(){
  'use strict';
  const select=document.getElementById('studySurah');
  const toggle=document.getElementById('studySurahToggle');
  const choice=document.getElementById('studySurahChoice');
  const menu=document.getElementById('studySurahMenu');
  const search=document.getElementById('studySurahSearch');
  const list=document.getElementById('studySurahList');
  const empty=document.getElementById('studySurahEmpty');
  if(!select||!toggle||!menu||!search||!list||!window.SURAHS&&typeof SURAHS==='undefined')return;
  const surahs=typeof SURAHS!=='undefined'?SURAHS:window.SURAHS;
  const normalize=value=>String(value||'').toLocaleLowerCase('tr').replace(/ı/g,'i').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
  function selected(){return surahs[Number(select.value)-1]||surahs[0];}
  function sync(){
    const meta=selected();
    if(meta)choice.textContent=meta.id+'. '+meta.tr;
    for(const button of list.querySelectorAll('button[data-sid]'))
      button.setAttribute('aria-current',String(Number(button.dataset.sid)===meta?.id));
    search.setAttribute('aria-label',window.tr?tr('home_search'):'Sûre ara');
  }
  function render(){
    const query=normalize(search.value),fragment=document.createDocumentFragment();
    let found=0;
    for(const meta of surahs){
      if(query&&!normalize([meta.id,meta.tr,meta.en,meta.ar].join(' ')).includes(query))continue;
      found++;
      const item=document.createElement('li'),button=document.createElement('button');
      button.type='button';button.dataset.sid=meta.id;
      button.setAttribute('aria-current',String(meta.id===Number(select.value)));
      const number=document.createElement('span');number.className='studySurahNumber';number.textContent=meta.id+'.';
      const name=document.createElement('span');name.textContent=meta.tr;
      const arabic=document.createElement('span');arabic.className='studySurahArabic';arabic.lang='ar';arabic.dir='rtl';arabic.textContent=meta.ar||'';
      button.append(number,name,arabic);item.append(button);fragment.append(item);
    }
    list.replaceChildren(fragment);
    empty.hidden=found!==0;
    sync();
  }
  function close(restoreFocus=false){
    if(menu.hidden)return;
    menu.hidden=true;toggle.setAttribute('aria-expanded','false');
    if(restoreFocus)toggle.focus();
  }
  function open(){
    menu.hidden=false;toggle.setAttribute('aria-expanded','true');
    search.value='';render();
    requestAnimationFrame(()=>{
      const current=list.querySelector('button[aria-current="true"]');
      if(current)list.scrollTop=Math.max(0,current.offsetTop-list.offsetTop-80);
    });
  }
  toggle.addEventListener('click',()=>menu.hidden?open():close());
  toggle.addEventListener('keydown',event=>{
    if(event.key==='ArrowDown'){event.preventDefault();if(menu.hidden)open();list.querySelector('button[aria-current="true"]')?.focus();}
  });
  search.addEventListener('input',render);
  search.addEventListener('keydown',event=>{
    if(event.key==='ArrowDown'){event.preventDefault();list.querySelector('button')?.focus();}
  });
  list.addEventListener('click',event=>{
    const button=event.target.closest('button[data-sid]');if(!button)return;
    select.value=button.dataset.sid;
    const max=surahs[Number(select.value)-1].n;
    const from=document.getElementById('studyFrom'),to=document.getElementById('studyTo');
    from.value=Math.max(1,Math.min(max,Number(from.value)||1));
    to.value=Math.max(Number(from.value),Math.min(max,Number(to.value)||max));
    select.dispatchEvent(new Event('input',{bubbles:true}));
    sync();close(true);
  });
  list.addEventListener('keydown',event=>{
    if(!['ArrowDown','ArrowUp'].includes(event.key))return;
    event.preventDefault();
    const buttons=[...list.querySelectorAll('button')],at=buttons.indexOf(document.activeElement);
    buttons[Math.max(0,Math.min(buttons.length-1,at+(event.key==='ArrowDown'?1:-1)))]?.focus();
  });
  document.addEventListener('pointerdown',event=>{
    if(!menu.hidden&&!menu.contains(event.target)&&!toggle.contains(event.target))close();
  });
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!menu.hidden){event.preventDefault();close(true);}});
  window.addEventListener('elifa:language-changed',()=>{sync();if(!menu.hidden)render();});
  window.elifaStudySurahPicker={sync,close};
})();
