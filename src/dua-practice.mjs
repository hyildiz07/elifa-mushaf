import {prayerCatalog} from './dua-catalog.mjs';
import {prayerCopy} from './dua-copy.mjs';
import {loadPrayerBytes,verifyPrayerResponse} from './prayer-audio-cache.mjs';
import {PrayerPlayer,pcmExcerptWav,pcmRangesWav,restorePrayerState,validPrayerPreferences} from './dua-practice-core.mjs';
import {mountPrayerStudy} from './dua-study-ui.mjs';
import {bindPrayerMediaSession,createPrayerDecoder} from './dua-media-session.mjs';
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
  const original=saved()[item.id]||{},preferences=restorePrayerState(original,hash);let studyUI=null;
  const title='<h2 class="dd-title">'+esc(item.title)+'</h2>';
  const copy=item.meal?.[lang]||item.meal?.en||item.meal?.tr||'';
  const arabic='<div class="dd-ar" dir="rtl" lang="ar">'+esc(item.ar)+'</div>';
  const textBlock=item.ar.length>420?'<details class="prayerFullText"><summary>'+esc(local('Tam dua metnini aç','Open the complete prayer text'))+'</summary>'+arabic+'</details>':arabic;
  const body='<div class="prayerText">'+textBlock+'<details><summary>'+esc(ui.translate('dua_okunus'))+'</summary><p class="dd-ok">'+esc(item.ok)+'</p></details><details><summary>'+esc(ui.translate('dua_meal'))+(item.meal?.[lang]?'':' · English')+'</summary><p class="dd-meal">'+esc(copy)+'</p></details></div><div class="prayerPractice"></div>';
  const back=ui.overlay(title,body),box=back.querySelector('.prayerPractice');
  const status=document.createElement('p');status.className='prayerStatus';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  const source=document.createElement('a');source.href=item.source;source.target='_blank';source.rel='noopener noreferrer';source.textContent=t('source')+' · '+(item.sourceName||'Diyanet');source.className='prayerSource';
  box.append(source);
  if(record&&original.hash&&original.hash!==hash&&(original.textParts?.length||original.clips?.length)){const note=document.createElement('p');note.className='prayerHelp';note.textContent=original.text===item.ar?local('Bu duanın ses kaydı değişti. Metin parçaların korunur; eski kayda ait ses saniyelerini yeni okuyuşu dinleyerek yeniden ayarla.','This prayer uses a different recording now. Your text parts are kept; listen to the new recording to set their audio boundaries again.'):local('Bu duanın metni veya ses kaydı değişti. Önceki kayda ait parça sınırları yeni kayda uygulanmaz; bu okuyuş için parçalarını yeniden ayarla.','This prayer has a different text or recording now. Earlier boundaries do not apply to the new version; set the parts again for this reading.');box.append(note);}
  if(item.note==='traditional_prayer'&&item.id==='kuran-baslama'){const p=document.createElement('p');p.className='prayerHelp';p.textContent=local('Diyanet rehberinde, okumaya başlarken okunması gelenek hâline gelmiş bir dua olarak aktarılır.','The Diyanet guide describes this as a traditional prayer before recitation.');box.append(p);}
  if(item.guideSource){const a=document.createElement('a');a.href=item.guideSource;a.target='_blank';a.rel='noopener noreferrer';a.className='prayerSource';a.textContent=local('Metin ve açıklama kaynağı','Text and guidance source');box.append(document.createTextNode(' · '),a);}
  if(item.id==='kunut'||item.id==='rabbena'){const p=document.createElement('p');p.className='prayerHelp';p.textContent=local('Bu kayıt iki duayı birlikte içerir. Metin ve ses birlikte gösterilir.','This recording contains both supplications; their texts are shown together.');box.append(p);}
  if(item.guide){const guide=document.createElement(item.guideProminent?'section':'details');guide.className='prayerGuide';const heading=document.createElement(item.guideProminent?'h3':'summary');heading.textContent=item.guideTitle?.[lang]||item.guideTitle?.tr||local('Nasıl yapılır?','How to practice');guide.append(heading);const ol=document.createElement('ol');for(const step of item.guide[lang]||item.guide.en||item.guide.tr){const li=document.createElement('li');li.textContent=step;ol.append(li);}guide.append(ol);if(item.guideProminent){guide.classList.add('prayerGuideProminent');const a=document.createElement('a');a.href=item.guideSource||item.source;a.target='_blank';a.rel='noopener noreferrer';a.textContent=local('Kaynak: Diyanet Din İşleri Yüksek Kurulu','Source: Diyanet High Board of Religious Affairs');guide.append(a);back.querySelector('.prayerText').before(guide);}else box.append(guide);}
  if(!record){
    status.textContent=item.audioDisabled?local('Bu dua metin olarak sunuluyor. Okunuşunu ve anlamını okuyabilir, parçaları sessiz çalışabilirsin.','This prayer is available as text. Read its transliteration and meaning, or study the text in parts.'):t('missing');box.append(status);
    if(item.external){const a=document.createElement('a');a.href=item.external;a.target='_blank';a.rel='noopener noreferrer';a.className='prayerAction';a.textContent=t('official')+' · '+(item.externalLabel||'Mişârî');box.append(a);}
    studyUI=mountPrayerStudy({container:box,item,saved:original,preferences,copy:local,globalText,save:state=>persist(item.id,{hash,...preferences,...state})});
    const cleanup=()=>{studyUI.close();if(activeClose===cleanup)activeClose=null;};activeClose=cleanup;back.addEventListener('elifa:dua-close',cleanup,{once:true});return true;
  }
  const sourceNote=document.createElement('p');sourceNote.className='prayerHelp';sourceNote.textContent=record.reader?record.reader:local('Diyanet Namaz Portalı kaydı. Okuyucunun adı kaynakta belirtilmiyor.','Diyanet Prayer Portal recording. The source does not identify the reciter.');box.append(sourceNote);
  if(record.sourceName){const a=document.createElement('a');a.href=record.sourcePage||record.source;a.target='_blank';a.rel='noopener noreferrer';a.className='prayerSource';a.textContent=local('Ses kaynağı','Audio source')+' · '+record.sourceName;box.append(a);}
  const chapter=record.kind==='complete-audiobook-chapter',lesson=record.kind==='teaching-recording',fullCaption=chapter?local('Dua ve açıklaması','Prayer and explanation'):lesson?local('Dua öğretim kaydı','Prayer teaching recording'):t('full');
  if(chapter){const note=document.createElement('p');note.className='prayerHelp';note.textContent=lang==='tr'?item.audioNoteTR||'Bu sesli kitap bölümü, duayla birlikte başlık ve rivayet açıklamalarını da içerir.':item.audioNoteEN||'This audiobook chapter includes the prayer together with headings and narration explanations.';box.append(note);}
  if(lesson){const note=document.createElement('p');note.className='prayerHelp';note.textContent=local('Öğretim kaydının tamamıdır; duadan önce kısa bir giriş bulunur. Parça sınırlarını kaydı dinleyerek seçebilirsin.','The complete teaching recording includes a short introduction before the prayer. Choose phrase boundaries while listening.');box.append(note);}
  if(!chapter&&!lesson&&item.audioNoteTR){const note=document.createElement('p');note.className='prayerHelp';note.textContent=lang==='tr'?item.audioNoteTR:item.audioNoteEN;box.append(note);}
  const controls=document.createElement('div');controls.className='prayerGrid';
  const fields={};
  for(const [key,label,min,max,step]of [['repeat',globalText('pb_repeat'),1,99,1],['speed',globalText('pb_speed'),0.5,2,0.05],['wait',globalText('workflow_wait'),0,60,0.5]]){
    const field=document.createElement('label');field.textContent=label;const input=document.createElement('input');input.type='number';input.min=min;input.max=max;input.step=step;input.value=preferences[key];input.id='prayer_'+key;field.append(input);controls.append(field);fields[key]=input;
  }
  const full=document.createElement('button');full.type='button';full.className='prayerAction prayerPrimary';full.textContent='▶ '+fullCaption;full.id='prayerPlay';
  const stop=document.createElement('button');stop.type='button';stop.className='prayerAction';stop.textContent='■';stop.setAttribute('aria-label',local('Durdur','Stop'));stop.id='prayerStop';
  const transport=document.createElement('div');transport.className='prayerTransport';transport.append(full,stop);
  const seek=document.createElement('input');seek.type='range';seek.min=0;seek.max=0;seek.step=0.01;seek.value=0;seek.disabled=true;seek.setAttribute('aria-label',t('full'));
  const selectionLabel=document.createElement('p');selectionLabel.className='prayerSelection';selectionLabel.textContent=fullCaption;
  const time=document.createElement('output');time.className='prayerTime';time.textContent='0:00 / 0:00';
  const download=document.createElement('button');download.type='button';download.className='prayerAction';download.textContent=t('download');download.id='prayerDownload';
  const removeDownload=document.createElement('button');removeDownload.type='button';removeDownload.className='prayerAction';removeDownload.textContent=t('remove');removeDownload.setAttribute('aria-label',t('ready')+' · '+t('remove'));removeDownload.hidden=true;
  const offline=document.createElement('div');offline.className='prayerTransport';offline.append(download,removeDownload);
  box.append(controls,transport,selectionLabel,seek,time,status,offline);
  const audio=new Audio();audio.preload='none';
  let closed=false,bytes=null,decoded=null,objectUrl=null,duration=0,range=null,activeRanges=null,mediaSession=null,abort=new AbortController();
  const format=n=>Math.floor(n/60)+':'+String(Math.floor(n%60)).padStart(2,'0');
  const read=()=>({repeat:Number(fields.repeat.value),speed:Number(fields.speed.value),wait:Number(fields.wait.value)});
  const remember=()=>{const p=read();if(!validPrayerPreferences(p))return false;const ok=persist(item.id,{hash,...p,...(studyUI?.getState()||{clips:preferences.clips})});if(!ok)status.textContent=local('Bu cihazda kaydedilemedi.','Could not save on this device.');return ok;};
  const decoder=createPrayerDecoder({createContext:()=>{const AudioContext=window.AudioContext||window.webkitAudioContext;if(!AudioContext)throw Error('No audio decoder');return new AudioContext();},onDecoded:result=>{decoded=result;duration=result.duration;}});
  const ensureDecoded=()=>decoder.decode(bytes);
  async function prepareRanges(ranges,isCurrent){bytes??=await verifiedBytes(record,abort.signal);if(closed||!isCurrent())throw Error('Closed');await ensureDecoded();if(closed||!isCurrent())throw Error('Closed');const blob=new Blob([pcmRangesWav(decoded,ranges)],{type:'audio/wav'});activeRanges=ranges;range=ranges[0];if(objectUrl)URL.revokeObjectURL(objectUrl);objectUrl=URL.createObjectURL(blob);return objectUrl;}
  const player=new PrayerPlayer({audio,prepare:async (selected,isCurrent)=>{
    bytes??=await verifiedBytes(record,abort.signal);if(closed||!isCurrent())throw Error('Closed');
    let blob;
    if(selected){
      await ensureDecoded();seek.max=duration;seek.disabled=false;
      if(closed||!isCurrent())throw Error('Closed');
      blob=new Blob([pcmExcerptWav(decoded,selected)],{type:'audio/wav'});
    }else blob=new Blob([bytes],{type:record.mime||'audio/mpeg'});
    if(closed||!isCurrent())throw Error('Closed');range=selected;activeRanges=selected?[selected]:null;if(objectUrl)URL.revokeObjectURL(objectUrl);objectUrl=URL.createObjectURL(blob);return objectUrl;
  },preparePlan:prepareRanges,onState:(state,progress)=>{
    if(closed)return;
    mediaSession?.update(state);
    full.classList.toggle('playing',state==='playing'&&progress?.phase==='full');
    status.textContent=state==='interrupted'?local('Oynatma duraklatıldı. Devam etmek için yeniden Başlat’a bas; seçili program baştan başlar.','Playback was paused. Press Play again to restart the selected program.'):state==='complete'?t('complete'):state==='error'?t('error'):progress?(state==='waiting'?t('waiting')+' · ':'')+progress.current+' / '+progress.total:state==='loading'?'…':'';
    status.dataset.state=state;
    if(progress?.ranges?.length)studyUI?.onProgress(progress);
  }});
  function launch(request){
    if(closed)return;
    mediaSession?.remember(request);
    const pending=request.kind==='plan'?player.playPlan(request.ranges,request.preferences):player.play(request.range,request.preferences);
    pending.catch(()=>{if(!closed){mediaSession?.update('error');status.textContent=t('error');status.dataset.state='error';}});
  }
  mediaSession=bindPrayerMediaSession({gateway:window.elifaMediaSession,title:item.title,reader:record.reader,play:launch,interrupt:()=>player.interrupt(),stop:()=>player.stop()});
  const leavePage=()=>player.interrupt();window.addEventListener('pagehide',leavePage);
  function cleanup(){if(closed)return;closed=true;studyUI?.close();player.stop();window.removeEventListener('pagehide',leavePage);mediaSession?.close();abort.abort();audio.removeAttribute('src');audio.load();if(objectUrl)URL.revokeObjectURL(objectUrl);decoder.close();if(activeClose===cleanup)activeClose=null;}
  activeClose=cleanup;back.addEventListener('elifa:dua-close',cleanup,{once:true});
  audio.onloadedmetadata=()=>{const label=activeRanges?.length>1?local('Birleştirme','Combined parts'):range?.name||fullCaption;selectionLabel.textContent=label+' · '+format(audio.duration);seek.setAttribute('aria-label',label);seek.min=0;seek.max=audio.duration;seek.disabled=!Number.isFinite(audio.duration);if(!range)duration=audio.duration;updateTime();};
  function updateTime(){if(closed)return;seek.value=audio.currentTime;time.textContent=format(audio.currentTime)+' / '+format(Number.isFinite(audio.duration)?audio.duration:0);}
  audio.ontimeupdate=updateTime;
  seek.oninput=()=>{audio.currentTime=Math.min(audio.duration||0,Math.max(0,Number(seek.value)));updateTime();};
  full.onclick=()=>{const p=read();if(!validPrayerPreferences(p)){status.textContent=t('error');return;}remember();launch({kind:'single',range:null,preferences:p});};
  stop.onclick=()=>player.stop();
  Object.values(fields).forEach(input=>input.onchange=()=>{player.stop();remember();});
  async function offlineState(){try{const cache=await caches.open(cacheName);let cached=await cache.match(record.path);if(cached){try{await verifyPrayerResponse(cached.clone(),record);}catch{await cache.delete(record.path);cached=null;}}if(closed)return;download.textContent=cached?t('ready'):t('download');download.disabled=!!cached;removeDownload.hidden=!cached;}catch{download.disabled=true;}}
  download.onclick=async()=>{
    download.disabled=true;status.textContent='…';
    try{const data=bytes||await verifiedBytes(record,abort.signal);if(closed)return;const cache=await caches.open(cacheName);await cache.put(record.path,new Response(data,{headers:{'Content-Type':record.mime||'audio/mpeg'}}));if(closed)return;status.textContent=t('ready');await offlineState();}catch{if(!closed){status.textContent=t('error');download.disabled=false;}}
  };
  removeDownload.onclick=async()=>{try{await(await caches.open(cacheName)).delete(record.path);await offlineState();}catch{status.textContent=t('error');}};
  offlineState();
  studyUI=mountPrayerStudy({container:box,item,saved:original,preferences,copy:local,globalText,save:()=>remember(),audio:{
    position(){let left=audio.currentTime;for(const r of activeRanges||[]){const length=r.end-r.start;if(left<=length)return r.start+left;left-=length;}return activeRanges?.at(-1)?.end??audio.currentTime;},
    duration:()=>duration,
    stop:()=>player.stop(),
    playOne:clip=>{if(!validPrayerPreferences(read())){status.textContent=t('error');return;}remember();launch({kind:'single',range:{...clip},preferences:read()});},
    playPlan:(ranges,prefs)=>{if(!validPrayerPreferences(read())){status.textContent=t('error');return;}remember();launch({kind:'plan',ranges:ranges.map(r=>({...r})),preferences:{...prefs,speed:read().speed,wait:read().wait}});}
  }});
  return true;
}
window.elifaDuaPractice={
  label:()=>t('tab'),
  openNamaz(index){const item=catalog.find(x=>x.namaz?.includes(index));return item?open(item):false;},
  renderList(container){for(const item of catalog){const b=document.createElement('button');b.type='button';b.className='prayerCard';const title=document.createElement('strong');title.textContent=item.title;const sub=document.createElement('span');sub.textContent=item.recording?'▶ '+t('tab')+(item.recording.readerId==='mishary-alafasy'?' · Mişârî Râşid el-Afâsî':''):item.audioDisabled?local('Metin ve yapılış anlatımı','Text and practice guide'):t('missing');b.append(title,sub);b.onclick=()=>open(item);container.append(b);}},
  stop(){activeClose?.();}
};
