// A small upward menu for the existing reader counter. Playback stays with the
// shared practice mode; this control does not keep a second mode of its own.
export function initReaderRepeatMenu({document,readMode,onSelect,translate}){
  const toggle=document.getElementById('readerRepeatToggle');
  const menu=document.getElementById('readerRepeatMenu');
  if(!toggle||!menu)return null;
  const options=[['range','readerRepeatRange','repeat_scope_work'],['verse','readerRepeatVerse','repeat_scope_verse']].map(([mode,id,key])=>({mode,key,button:document.getElementById(id)}));
  function selected(){return readMode()==='range'?'range':'verse';}
  function sync(){
    for(const o of options){o.button.textContent=translate(o.key);o.button.setAttribute('aria-checked',String(o.mode===selected()));}
    toggle.setAttribute('aria-label',translate(selected()==='range'?'repeat_scope_work':'repeat_scope_verse'));
    menu.setAttribute('aria-label',translate('study_method'));
  }
  function close(restoreFocus=false){menu.hidden=true;toggle.setAttribute('aria-expanded','false');if(restoreFocus)toggle.focus();}
  function open(){sync();menu.hidden=false;toggle.setAttribute('aria-expanded','true');options.find(o=>o.mode===selected()).button.focus();}
  toggle.onclick=()=>menu.hidden?open():close(true);
  toggle.addEventListener('keydown',event=>{if(event.key==='ArrowUp'||event.key==='ArrowDown'){event.preventDefault();open();}});
  for(const o of options)o.button.onclick=()=>{onSelect(o.mode);sync();close(true);};
  menu.addEventListener('keydown',event=>{
    const index=options.findIndex(o=>o.button===document.activeElement);
    if(['ArrowUp','ArrowDown','Home','End'].includes(event.key)){
      event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?1:(index+(event.key==='ArrowDown'?1:-1)+2)%2;options[next].button.focus();
    }
    if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close(true);}
    if(event.key==='Tab')close(true);
  });
  document.addEventListener('click',event=>{if(!menu.hidden&&!menu.contains(event.target)&&!toggle.contains(event.target))close();});
  document.addEventListener('focusin',event=>{if(!menu.hidden&&!menu.contains(event.target)&&!toggle.contains(event.target))close();});
  sync();return {sync,close};
}
