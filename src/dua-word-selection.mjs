export const prayerWords=text=>String(text||'').trim().split(/\s+/u).filter(Boolean);
export function validPrayerTextPart(part,count){return !!part&&Number.isInteger(part.wordFrom)&&Number.isInteger(part.wordTo)&&part.wordFrom>=0&&part.wordTo>=part.wordFrom&&part.wordTo<count;}
export function prayerPartText(words,part){return validPrayerTextPart(part,words.length)?words.slice(part.wordFrom,part.wordTo+1).join(' '):'';}
export function restorePrayerTextParts(value,text,hash){
  if(value?.text!==text||!Array.isArray(value.textParts))return [];
  const words=prayerWords(text),parts=[];
  for(const part of value.textParts.slice(0,50))if(validPrayerTextPart(part,words.length)&&!parts.some(p=>p.wordFrom<=part.wordTo&&part.wordFrom<=p.wordTo))parts.push({...part,name:String(part.name||'').slice(0,80)});
  return parts.sort((a,b)=>a.wordFrom-b.wordFrom).map(part=>{if(hash!==undefined&&value.hash!==hash){const {start,end,...textPart}=part;return textPart;}return part;});
}

// Text boundaries are chosen by the reader; they never imply audio word timings.
export function mountPrayerWords(root,text,{onChange=()=>{}}={}){
  const words=prayerWords(text);let selected=null,used=[],drag=null,frame=null,closed=false;
  root.className='prayerWords';root.dir='rtl';root.lang='ar';root.setAttribute('aria-label','Dua');
  const buttons=words.map((word,index)=>{const b=document.createElement('button');b.type='button';b.className='prayerWord';b.textContent=word;b.dataset.word=index;b.setAttribute('aria-pressed','false');root.append(b,document.createTextNode(' '));return b;});
  const isUsed=index=>used.some(p=>index>=p.wordFrom&&index<=p.wordTo);
  function paint(){buttons.forEach((b,i)=>{b.classList.toggle('assigned',isUsed(i));b.classList.toggle('selected',!!selected&&i>=selected.wordFrom&&i<=selected.wordTo);b.setAttribute('aria-pressed',String(!!selected&&i>=selected.wordFrom&&i<=selected.wordTo));});onChange(selected);}
  function choose(a,b){const from=Math.min(a,b),to=Math.max(a,b);if(buttons.some((_,i)=>i>=from&&i<=to&&isUsed(i)))return;selected={wordFrom:from,wordTo:to};paint();}
  const hit=(x,y)=>root.ownerDocument.elementFromPoint(x,y)?.closest?.('.prayerWord');
  function selectAt(x,y){const target=hit(x,y);if(target&&root.contains(target))choose(drag.anchor,Number(target.dataset.word));}
  function tick(){if(!drag||closed)return;const area=root.closest('.dd-body')||root.closest('.dua-detail-body')||root.parentElement;let scroller=area;while(scroller&&scroller.scrollHeight<=scroller.clientHeight+1)scroller=scroller.parentElement;if(scroller){const rect=scroller.getBoundingClientRect(),margin=55;const dy=drag.y<rect.top+margin?-12:drag.y>rect.bottom-margin?12:0;if(dy){scroller.scrollTop+=dy;selectAt(drag.x,Math.min(rect.bottom-8,Math.max(rect.top+8,drag.y)));}}frame=requestAnimationFrame(tick);}
  const down=e=>{const target=e.target.closest('.prayerWord');if(!target||isUsed(Number(target.dataset.word)))return;const index=Number(target.dataset.word);drag={id:e.pointerId,anchor:index,x:e.clientX,y:e.clientY};root.setPointerCapture?.(e.pointerId);choose(index,index);e.preventDefault();frame=requestAnimationFrame(tick);};
  const move=e=>{if(!drag||e.pointerId!==drag.id)return;drag.x=e.clientX;drag.y=e.clientY;selectAt(e.clientX,e.clientY);e.preventDefault();};
  const up=e=>{if(!drag||e.pointerId!==drag.id)return;drag=null;if(frame!==null)cancelAnimationFrame(frame);frame=null;};
  root.addEventListener('pointerdown',down);root.addEventListener('pointermove',move);root.addEventListener('pointerup',up);root.addEventListener('pointercancel',up);
  root.addEventListener('click',e=>{if(e.detail!==0)return;const target=e.target.closest('.prayerWord');if(target){const i=Number(target.dataset.word);choose(selected?.wordFrom??i,i);}});
  return {words,getSelection:()=>selected?{...selected}:null,clear(){selected=null;paint();},setUsed(parts){used=parts.filter(p=>validPrayerTextPart(p,words.length));selected=null;paint();},close(){closed=true;drag=null;if(frame!==null)cancelAnimationFrame(frame);root.removeEventListener('pointerdown',down);root.removeEventListener('pointermove',move);root.removeEventListener('pointerup',up);root.removeEventListener('pointercancel',up);}};
}
