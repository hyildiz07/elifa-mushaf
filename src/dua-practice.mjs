import {prayerCatalog} from './dua-catalog.mjs';
import {prayerCopy} from './dua-copy.mjs';
import {loadPrayerBytes,verifyPrayerResponse} from './prayer-audio-cache.mjs';
import {PrayerPlayer,pcmExcerptWav,restorePrayerState,validExcerpt,validPrayerPreferences} from './dua-practice-core.mjs';
const ui=window.elifaPrayerUI;
if(!ui)throw Error('Prayer screen anchors unavailable');
const language=()=>window.ElifaLocale?.current?.()||'en';
const t=key=>prayerCopy(language(),key);
const local=(tr,en)=>language()==='tr'?tr:en;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const globalText=key=>window.tr?.(key)||key;
const catalog=prayerCatalog(ui.texts),cacheName='elifa-dua-audio-v1';
let activeClose=null;
function saved(){try{return ui.storage.get('duaPracticeV1',{});}catch{return {};}}
function persist(id,state){try{return ui.storage.set('duaPracticeV1',{...saved(),[id]:state})!==false;}catch{return false;}}
async function verifiedBytes(record,signal){
  let cache=null;try{if('caches'in window)cache=await caches.open(cacheName);}catch{}
  return loadPrayerBytes(record,{cache,signal});
}

function open(item){
  activeClose?.();window.duaCloseOverlay?.();window.stopPlan?.(true);
  const lang=language(),record=item.recording,hash=record?.sha256||'text-only-v1';
  const preferences=restorePrayerState(saved()[item.id],hash);let clips=preferences.clips,undo=[];
  const title='<h2 class="dd-title">'+esc(item.title)+'</h2>';
  const copy=item.meal?.[lang]||item.meal?.en||item.meal?.tr||'';
  const body='<div class="prayerText"><div class="dd-ar" dir="rtl" lang="ar">'+esc(item.ar)+'</div><details><summary>'+esc(ui.translate('dua_okunus'))+'</summary><p class="dd-ok">'+esc(item.ok)+'</p></details><details><summary>'+esc(ui.translate('dua_meal'))+(item.meal?.[lang]?'':' · English')+'</summary><p class="dd-meal">'+esc(copy)+'</p></details></div><div class="prayerPractice"></div>';
  const back=ui.overlay(title,body),box=back.querySelector('.prayerPractice');
  const status=document.createElement('p');status.className='prayerStatus';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  const source=document.createElement('a');source.href=item.source;source.target='_blank';source.rel='noopener noreferrer';source.textContent=t('source')+' · Diyanet';source.className='prayerSource';
  box.append(source);
  if(item.note==='traditional_prayer'){const p=document.createElement('p');p.className='prayerHelp';p.textContent=local('Diyanet rehberinde, okumaya başlarken okunması gelenek hâline gelmiş bir dua olarak aktarılır.','The Diyanet guide describes this as a traditional prayer before recitation.');box.append(p);}
  if(item.id==='kunut'||item.id==='rabbena'){const p=document.createElement('p');p.className='prayerHelp';p.textContent=local('Bu kayıt iki duayı birlikte içerir. Metin ve ses birlikte gösterilir.','This recording contains both supplications; their texts are shown together.');box.append(p);}
  if(!record){
    status.textContent=t('missing');box.append(status);
    if(item.external){const a=document.createElement('a');a.href=item.external;a.target='_blank';a.rel='noopener noreferrer';a.className='prayerAction';a.textContent=t('official')+' · Mişârî';box.append(a);}
    return true;
  }
  const sourceNote=document.createElement('p');sourceNote.className='prayerHelp';sourceNote.textContent=local('Diyanet Namaz Portalı kaydı. Okuyucunun adı kaynakta belirtilmiyor.','Diyanet Prayer Portal recording. The source does not identify the reciter.');box.append(sourceNote);
  const controls=document.createElement('div');controls.className='prayerGrid';
  const fields={};
  for(const [key,label,min,max,step]of [['repeat',globalText('pb_repeat'),1,99,1],['speed',globalText('pb_speed'),0.5,2,0.05],['wait',globalText('workflow_wait'),0,60,0.5]]){
    const field=document.createElement('label');field.textContent=label;const input=document.createElement('input');input.type='number';input.min=min;input.max=max;input.step=step;input.value=preferences[key];input.id='prayer_'+key;field.append(input);controls.append(field);fields[key]=input;
  }
  const full=document.createElement('button');full.type='button';full.className='prayerAction prayerPrimary';full.textContent='▶ '+t('full');full.id='prayerPlay';
  const stop=document.createElement('button');stop.type='button';stop.className='prayerAction';stop.textContent='■';stop.setAttribute('aria-label',globalText('pb_play'));stop.id='prayerStop';
  const transport=document.createElement('div');transport.className='prayerTransport';transport.append(full,stop);
  const seek=document.createElement('input');seek.type='range';seek.min=0;seek.max=0;seek.step=0.01;seek.value=0;seek.disabled=true;seek.setAttribute('aria-label',t('full'));
  const selectionLabel=document.createElement('p');selectionLabel.className='prayerSelection';selectionLabel.textContent=t('full');
  const time=document.createElement('output');time.className='prayerTime';time.textContent='0:00 / 0:00';
  const download=document.createElement('button');download.type='button';download.className='prayerAction';download.textContent=t('download');download.id='prayerDownload';
  const removeDownload=document.createElement('button');removeDownload.type='button';removeDownload.className='prayerAction';removeDownload.textContent=t('remove');removeDownload.setAttribute('aria-label',t('ready')+' · '+t('remove'));removeDownload.hidden=true;
  const offline=document.createElement('div');offline.className='prayerTransport';offline.append(download,removeDownload);
  box.append(controls,transport,selectionLabel,seek,time,status,offline);
  const audio=new Audio();audio.preload='none';
  let closed=false,bytes=null,decoded=null,context=null,objectUrl=null,duration=0,range=null,abort=new AbortController();
  const format=n=>Math.floor(n/60)+':'+String(Math.floor(n%60)).padStart(2,'0');
  const read=()=>({repeat:Number(fields.repeat.value),speed:Number(fields.speed.value),wait:Number(fields.wait.value)});
  const remember=()=>{const p=read();if(!validPrayerPreferences(p))return false;const ok=persist(item.id,{hash,...p,clips});if(!ok)status.textContent=local('Bu cihazda kaydedilemedi.','Could not save on this device.');return ok;};
  const player=new PrayerPlayer({audio,prepare:async (selected,isCurrent)=>{
    bytes??=await verifiedBytes(record,abort.signal);if(closed||!isCurrent())throw Error('Closed');
    let blob;
    if(selected){
      if(!decoded){const AudioContext=window.AudioContext||window.webkitAudioContext;if(!AudioContext)throw Error('No audio decoder');context=new AudioContext();decoded=await context.decodeAudioData(bytes.slice(0));duration=decoded.duration;seek.max=duration;seek.disabled=false;}
      if(closed||!isCurrent())throw Error('Closed');
      blob=new Blob([pcmExcerptWav(decoded,selected)],{type:'audio/wav'});
    }else blob=new Blob([bytes],{type:'audio/mpeg'});
    if(closed||!isCurrent())throw Error('Closed');range=selected;if(objectUrl)URL.revokeObjectURL(objectUrl);objectUrl=URL.createObjectURL(blob);return objectUrl;
  },onState:(state,progress)=>{
    if(closed)return;
    full.classList.toggle('playing',state==='playing');
    status.textContent=state==='complete'?t('complete'):state==='error'?t('error'):progress?(state==='waiting'?t('waiting')+' · ':'')+progress.current+' / '+progress.total:state==='loading'?'…':'';
    status.dataset.state=state;
  }});
  function cleanup(){if(closed)return;closed=true;player.stop();abort.abort();audio.removeAttribute('src');audio.load();if(objectUrl)URL.revokeObjectURL(objectUrl);context?.close().catch(()=>{});if(activeClose===cleanup)activeClose=null;}
  activeClose=cleanup;back.addEventListener('elifa:dua-close',cleanup,{once:true});
  audio.onloadedmetadata=()=>{selectionLabel.textContent=(range?range.name:t('full'))+' · '+format(audio.duration);if(!range){duration=audio.duration;seek.max=duration;seek.disabled=!Number.isFinite(duration);}updateTime();};
  function updateTime(){if(closed)return;const pos=audio.currentTime+(range?.start||0);seek.value=pos;time.textContent=format(pos)+' / '+format(duration);}
  audio.ontimeupdate=updateTime;
  seek.oninput=()=>{const start=range?.start||0,end=range?.end||duration;const pos=Math.min(end,Math.max(start,Number(seek.value)));audio.currentTime=pos-start;updateTime();};
  full.onclick=()=>{const p=read();if(!validPrayerPreferences(p)){status.textContent=t('error');return;}remember();player.play(null,p);};
  stop.onclick=()=>player.stop();
  Object.values(fields).forEach(input=>input.onchange=()=>{player.stop();remember();});
  async function offlineState(){try{const cache=await caches.open(cacheName);let cached=await cache.match(record.path);if(cached){try{await verifyPrayerResponse(cached.clone(),record);}catch{await cache.delete(record.path);cached=null;}}if(closed)return;download.textContent=cached?t('ready'):t('download');download.disabled=!!cached;removeDownload.hidden=!cached;}catch{download.disabled=true;}}
  download.onclick=async()=>{
    download.disabled=true;status.textContent='…';
    try{const data=bytes||await verifiedBytes(record,abort.signal);if(closed)return;const cache=await caches.open(cacheName);await cache.put(record.path,new Response(data,{headers:{'Content-Type':'audio/mpeg'}}));if(closed)return;status.textContent=t('ready');await offlineState();}catch{if(!closed){status.textContent=t('error');download.disabled=false;}}
  };
  removeDownload.onclick=async()=>{try{await(await caches.open(cacheName)).delete(record.path);await offlineState();}catch{status.textContent=t('error');}};
  offlineState();
  // Manual phrases are cut from decoded PCM before playback. The next phrase
  // can never leak into a repeat, including when the browser is backgrounded.
  const detail=document.createElement('details');detail.className='prayerClips';
  const summary=document.createElement('summary');summary.textContent=t('clip');detail.append(summary);
  const explanation=document.createElement('p');explanation.className='prayerHelp';explanation.textContent=local('Bütün duayı dinlerken cümlenin başını ve sonunu işaretle. İstersen saniyeleri düzelt, sonra kaydet. Cümlelerin bu cihazda kaydedilir. Otomatik kelime zamanlaması kullanılmaz.','While listening to the whole prayer, mark the phrase’s start and end. Adjust the seconds if needed, then save. Your phrases are saved on this device. No automatic word timing is assumed.');detail.append(explanation);
  const marks=document.createElement('div');marks.className='prayerGrid';
  const boundaries={};for(const [key,label]of [['start',t('start')],['end',t('end')]]){const wrap=document.createElement('div');wrap.className='prayerBoundary';const mark=document.createElement('button');mark.type='button';mark.className='prayerAction';mark.textContent=label;mark.setAttribute('aria-label',label);const input=document.createElement('input');input.type='number';input.min=0;input.step=0.01;input.value=0;input.setAttribute('aria-label',label+' (s)');input.id='prayer_'+key;boundaries[key]=input;mark.onclick=()=>{input.value=(audio.currentTime+(range?.start||0)).toFixed(2);};wrap.append(mark,input);marks.append(wrap);}detail.append(marks);
  const name=document.createElement('input');name.maxLength=80;name.placeholder=t('clip');name.setAttribute('aria-label',t('clip'));name.id='prayerClipName';
  const save=document.createElement('button');save.type='button';save.className='prayerAction';save.textContent=t('save');save.id='prayerClipSave';
  const undoButton=document.createElement('button');undoButton.type='button';undoButton.className='prayerAction';undoButton.textContent=t('undo');undoButton.hidden=true;
  const list=document.createElement('div');list.className='prayerClipList';
  function renderClips(){
    list.replaceChildren();undoButton.hidden=!undo.length;
    for(const clip of clips){
      const row=document.createElement('div');row.className='prayerClipRow';
      const edit=document.createElement('input');edit.maxLength=80;edit.value=clip.name;edit.setAttribute('aria-label',t('clip'));edit.onchange=()=>{clip.name=edit.value.trim().slice(0,80)||t('clip');remember();};
      const play=document.createElement('button');play.type='button';play.className='prayerAction';play.textContent='▶ '+format(clip.start)+'–'+format(clip.end);play.setAttribute('aria-label',clip.name);play.onclick=()=>{const p=read();if(validPrayerPreferences(p))player.play(clip,p);};
      const remove=document.createElement('button');remove.type='button';remove.className='prayerAction';remove.textContent='×';remove.setAttribute('aria-label',clip.name+' · '+t('remove'));remove.onclick=()=>{player.stop();undo.push(clips.map(c=>({...c})));clips=clips.filter(c=>c!==clip);remember();renderClips();};row.append(edit,play,remove);list.append(row);
    }
  }
  save.onclick=()=>{
    const clip={start:Number(boundaries.start.value),end:Number(boundaries.end.value),name:name.value.trim()||t('clip')+' '+(clips.length+1)};
    if(!validExcerpt(clip,duration)||clips.length>=50){status.textContent=local('Önce kaydı aç; başlangıç ve bitişi sesin içinde, en az 0,2 saniye arayla seç.','Open the recording first. Select a start and end within the audio, at least 0.2 seconds apart.');return;}
    undo.push(clips.map(c=>({...c})));clips=[...clips,clip];remember();renderClips();
  };
  undoButton.onclick=()=>{player.stop();clips=undo.pop()||clips;remember();renderClips();};
  detail.append(name,save,undoButton,list);box.append(detail);renderClips();return true;
}
window.elifaDuaPractice={
  label:()=>t('tab'),
  openNamaz(index){const item=catalog.find(x=>x.namaz?.includes(index));return item?open(item):false;},
  renderList(container){for(const item of catalog){const b=document.createElement('button');b.type='button';b.className='prayerCard';const title=document.createElement('strong');title.textContent=item.title;const sub=document.createElement('span');sub.textContent=item.recording?'▶ '+t('tab'):t('missing');b.append(title,sub);b.onclick=()=>open(item);container.append(b);}},
  stop(){activeClose?.();}
};
