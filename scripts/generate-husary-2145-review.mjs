// Produce a listening worksheet, not playback timings. The two automatic
// alignments disagree on the repeated passage, so every label stays provisional.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {decodeWindow} from '../src/split-audio.mjs';

const verseKey='2:145';
const audioUrl='https://everyayah.com/data/Husary_Muallim_128kbps/002145.mp3';
const timingUrl='https://api.quran.com/api/v4/chapter_recitations/12/2?segments=true';
const qf=await (await fetch(timingUrl)).json();
const verse=qf.audio_file.timestamps.find(row=>row.verse_key===verseKey);
if(!verse||!Array.isArray(verse.segments))throw Error('QF 2:145 timing unavailable');
const htmlSource=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const start=htmlSource.indexOf('const QTEXT=')+'const QTEXT='.length;
const stop=htmlSource.indexOf(';',start);
if(start<12||stop<start)throw Error('Canonical text unavailable');
const words=JSON.parse(htmlSource.slice(start,stop))['2'][144][2]
  .filter(word=>word[1]===0).map(word=>word[0]);
if(words.length!==32)throw Error(`Expected 32 words, got ${words.length}`);
const response=await fetch(audioUrl);
if(!response.ok)throw Error(`Audio HTTP ${response.status}`);
const bytes=await response.arrayBuffer();
const requestedEnd=verse.timestamp_to-verse.timestamp_from+1200;
const pcm=await decodeWindow(new Blob([bytes]).stream(),0,requestedEnd,{maxMissingMs:1800});
const frameSize=Math.max(1,Math.round(pcm.sampleRate*.02));
const frames=Math.floor(pcm.channelData[0].length/frameSize);
const rms=[];
for(let frame=0;frame<frames;frame++){
  let loudest=0;
  for(const channel of pcm.channelData){
    let sum=0;
    const first=frame*frameSize;
    for(let i=first;i<first+frameSize;i++)sum+=channel[i]*channel[i];
    loudest=Math.max(loudest,Math.sqrt(sum/frameSize));
  }
  rms.push(Number(loudest.toFixed(5)));
}
const sorted=[...rms].sort((a,b)=>a-b);
const median=sorted[Math.floor(sorted.length/2)];
const threshold=Math.min(.002,median*.15);
const quiet=[];
for(let i=0;i<rms.length;){
  if(rms[i]>threshold){i++;continue;}
  const from=i;
  while(i<rms.length&&rms[i]<=threshold)i++;
  if(i-from>=9&&from>10&&i<rms.length-10){
    const before=rms.slice(Math.max(0,from-10),from);
    const after=rms.slice(i,Math.min(rms.length,i+10));
    if(Math.max(...before)>threshold*2&&Math.max(...after)>threshold*2){
      quiet.push({from_ms:Math.round(from*frameSize/pcm.sampleRate*1000),
        to_ms:Math.round(i*frameSize/pcm.sampleRate*1000)});
    }
  }
}
const qfSegments=verse.segments.map(([word,from,to])=>({word,
  from_ms:Math.round(from-verse.timestamp_from),
  to_ms:Math.round(to-verse.timestamp_from)}));
const data={verse_key:verseKey,reciter:'Mahmud Halil el-Husârî (Muallim)',audio_url:audioUrl,
  audio_sha256:createHash('sha256').update(Buffer.from(bytes)).digest('hex'),
  audio_bytes:bytes.byteLength,duration_ms:Math.round(pcm.channelData[0].length/pcm.sampleRate*1000),
  qf_source:timingUrl,cpfair_source:'https://github.com/cpfair/quran-align/releases/tag/release-2016-11-24',
  cpfair_quality:{insertions:36,transpositions:1,deletions:0,aligned_tail_ms:60750},
  words,qf_segments:qfSegments,quiet_candidates:quiet,rms_frame_ms:frameSize/pcm.sampleRate*1000,rms};
const encoded=JSON.stringify(data).replace(/</g,'\\u003c');
const out=`<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Hüsarî Muallim 2:145 ses incelemesi</title>
<style>body{font:16px system-ui;margin:0;background:#f5f3ee;color:#14231e}main{max-width:1200px;margin:auto;padding:20px}h1{font-size:1.5rem}.warn{background:#fff1d4;border-left:5px solid #a45b00;padding:12px;margin:16px 0}.panel{background:white;border:1px solid #cbd6cd;border-radius:12px;padding:14px;margin:14px 0}canvas{width:100%;height:220px;cursor:crosshair;background:#fafdfb;border:1px solid #aabbb0}button,input,select{font:inherit;padding:6px 9px}button{cursor:pointer}label{display:inline-flex;gap:6px;align-items:center;margin:5px}.words{display:flex;flex-wrap:wrap;gap:7px;direction:rtl}.word{border:1px solid #c4d1c6;border-radius:7px;background:#f9fbf9;padding:6px;direction:rtl;font-family:serif;font-size:1.25rem}.word small{font:12px system-ui;color:#40564a}.selected{background:#dbf3e5}.row{display:flex;flex-wrap:wrap;align-items:center;gap:8px}table{border-collapse:collapse;width:100%}td,th{border-bottom:1px solid #ddd;padding:5px;text-align:left}#status{min-height:1.3em;color:#7d4700}code{overflow-wrap:anywhere}</style>
<main><h1>Hüsarî Muallim — Bakara 2:145 ses incelemesi</h1>
<div class="warn"><strong>İnceleme taslağı; oynatıcı verisi değildir.</strong> Aynı 118 saniyelik kayıtta cpfair 32. kelimeyi 60,75 saniyede bitiriyor ve 36 ek konuşma aralığı bildiriyor. Quran Foundation etiketleri tekrarları gösterse de 23–27 ve 30–32. kelimeleri atlıyor. Dalga üzerindeki sessizlikler yalnız dinleme işaretidir; kelime sınırı kanıtı sayılmaz. Yeni sınırları kaydı dinleyerek ve ikinci bir incelemeyle doğrulayın.</div>
<div class="panel"><audio id="audio" controls preload="metadata" src="${audioUrl}"></audio><button id="whole">Tam âyeti dinle</button><p>Kaynak: <a href="${audioUrl}">EveryAyah MP3</a> · <a href="${timingUrl}">Quran Foundation zamanları</a> · <a href="https://github.com/cpfair/quran-align/releases/tag/release-2016-11-24">cpfair ham hizalama</a></p><div id="status"></div></div>
<div class="panel"><h2>Ses dalgası ve dinleme</h2><canvas id="wave" width="1200" height="220" aria-label="Ses dalgası"></canvas><div class="row"><label>Başlangıç (sn) <input id="from" type="number" min="0" step="0.01" value="0"></label><label>Bitiş (sn) <input id="to" type="number" min="0" step="0.01" value="5"></label><button id="play">Seçimi dinle</button><label><input id="loop" type="checkbox"> Tekrar et</label><button id="stop">Durdur</button><span id="cursor"></span></div><p>Dalga üzerinde tıklama başlangıcı ayarlar. Shift+tıklama bitişi ayarlar. İnce dikey çizgiler otomatik bulunan sessiz aralıklardır; sözcük sınırı olarak kullanılmaz.</p></div>
<div class="panel"><h2>Âyet kelimeleri</h2><div class="words" id="words"></div><p>Kelimeye tıklamak başlangıç indeksini, Shift+tıklamak bitiş indeksini seçer.</p><div class="row"><label>İlk kelime <input id="firstWord" type="number" min="1" max="32" value="1"></label><label>Son kelime <input id="lastWord" type="number" min="1" max="32" value="1"></label><label>Duyulan ses / konuşmacı <input id="note" size="40" placeholder="Örn. hoca okuyor; çocuklar tekrar ediyor"></label><button id="add">İnceleme satırı ekle</button></div><p>Yanlış olduğu bilinen hazır zamanları onaylamayın. Önce sesi dinleyip duyulan kelimeleri seçin.</p></div>
<div class="panel"><h2>Elle işaretlenen aralıklar</h2><table><thead><tr><th>Ses aralığı</th><th>Kelime</th><th>Not</th><th></th></tr></thead><tbody id="annotations"></tbody></table><p><button id="export">JSON dışa aktar</button> <button id="clear">Taslağı temizle</button></p></div>
<details class="panel"><summary>Kaynak etiketleri (doğrulanmamış)</summary><p>Bu tablo otomatik tahmindir; doğrudan üretim zamanına çevrilmemelidir.</p><table><thead><tr><th>QF kelime</th><th>Başlangıç</th><th>Bitiş</th></tr></thead><tbody id="qf"></tbody></table></details></main>
<script id="review-data" type="application/json">${encoded}</script>
<script>
const d=JSON.parse(document.getElementById('review-data').textContent),$=id=>document.getElementById(id),audio=$('audio'),from=$('from'),to=$('to');
const fmt=ms=>(ms/1000).toFixed(2),duration=d.duration_ms/1000;
let annotations=JSON.parse(localStorage.getItem('husary-2-145-review')||'[]'),selectionPlaying=false;
const wave=$('wave'),ctx=wave.getContext('2d');
function draw(){const w=wave.width,h=wave.height;ctx.clearRect(0,0,w,h);ctx.fillStyle='#fafdfb';ctx.fillRect(0,0,w,h);
  const a=Math.max(0,Math.min(duration,Number(from.value))),b=Math.max(a,Math.min(duration,Number(to.value)));
  ctx.fillStyle='#e2f2e8';ctx.fillRect(a/duration*w,0,(b-a)/duration*w,h);
  const max=Math.max(...d.rms);ctx.fillStyle='#306a54';for(let x=0;x<w;x++){const i=Math.floor(x/w*d.rms.length),j=Math.max(i+1,Math.floor((x+1)/w*d.rms.length));let peak=0;for(let k=i;k<j;k++)peak=Math.max(peak,d.rms[k]);const amp=Math.min(h*.46,peak/max*h*.46);ctx.fillRect(x,h/2-amp,1,amp*2)}
  ctx.strokeStyle='#ad6834';ctx.lineWidth=1;for(const q of d.quiet_candidates){const x=((q.from_ms+q.to_ms)/2)/d.duration_ms*w;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke()}
  ctx.fillStyle='#263f33';for(let t=0;t<duration;t+=10){const x=t/duration*w;ctx.fillRect(x,h-18,1,8);ctx.fillText(t+' s',x+2,h-5)}
  ctx.strokeStyle='#1773b1';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(audio.currentTime/duration*w,0);ctx.lineTo(audio.currentTime/duration*w,h);ctx.stroke();}
wave.addEventListener('click',e=>{const r=wave.getBoundingClientRect(),sec=Math.max(0,Math.min(duration,(e.clientX-r.left)/r.width*duration));(e.shiftKey?to:from).value=sec.toFixed(2);$('cursor').textContent='İşaret: '+sec.toFixed(2)+' sn';draw()});
for(const input of [from,to])input.addEventListener('input',draw);
$('play').onclick=async()=>{const a=Number(from.value),b=Number(to.value);if(!(a>=0&&b>a&&b<=duration)){alert('Geçerli bir aralık seçin.');return}selectionPlaying=true;audio.currentTime=a;await audio.play()};
$('whole').onclick=async()=>{selectionPlaying=false;audio.currentTime=0;await audio.play()};
$('stop').onclick=()=>{selectionPlaying=false;audio.pause()};audio.addEventListener('timeupdate',()=>{const b=Number(to.value);if(selectionPlaying&&audio.currentTime>=b-.03){if($('loop').checked)audio.currentTime=Number(from.value);else{selectionPlaying=false;audio.pause()}}draw()});
function renderWords(){const box=$('words');box.replaceChildren();d.words.forEach((word,i)=>{const button=document.createElement('button');button.className='word'+(i+1>=Number($('firstWord').value)&&i+1<=Number($('lastWord').value)?' selected':'');button.innerHTML='<small>'+(i+1)+'</small> '+word;button.onclick=e=>{(e.shiftKey?$('lastWord'):$('firstWord')).value=i+1;renderWords()};box.append(button)})}
for(const id of ['firstWord','lastWord'])$(id).addEventListener('input',renderWords);
function renderAnnotations(){const body=$('annotations');body.replaceChildren();annotations.forEach((a,i)=>{const tr=document.createElement('tr');for(const value of [fmt(a.from_ms)+'–'+fmt(a.to_ms)+' sn',a.first_word+'–'+a.last_word,a.note]){const td=document.createElement('td');td.textContent=value;tr.append(td)}const td=document.createElement('td'),button=document.createElement('button');button.textContent='Sil';button.onclick=()=>{annotations.splice(i,1);save()};td.append(button);tr.append(td);body.append(tr)})}
function save(){localStorage.setItem('husary-2-145-review',JSON.stringify(annotations));renderAnnotations()}
$('add').onclick=()=>{const a=Number(from.value),b=Number(to.value),first=Number($('firstWord').value),last=Number($('lastWord').value);if(!(a>=0&&b>a&&b<=duration&&first>=1&&last>=first&&last<=32)){alert('Ses ve kelime aralıklarını denetleyin.');return}annotations.push({from_ms:Math.round(a*1000),to_ms:Math.round(b*1000),first_word:first,last_word:last,note:$('note').value.trim(),review_status:'unverified'});save()};
$('export').onclick=()=>{const payload={verse_key:d.verse_key,audio_url:d.audio_url,audio_bytes:d.audio_bytes,audio_sha256:d.audio_sha256,source:'manual-listening-worksheet',review_status:'unverified',annotations};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='husary-muallim-2-145-review.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
$('clear').onclick=()=>{if(confirm('Yalnız bu tarayıcıdaki inceleme taslağı temizlensin mi?')){annotations=[];save()}};
for(const s of d.qf_segments){const tr=document.createElement('tr');for(const value of [s.word+' — '+d.words[s.word-1],fmt(s.from_ms),fmt(s.to_ms)]){const td=document.createElement('td');td.textContent=value;tr.append(td)}$('qf').append(tr)}
$('status').textContent='Kayıt '+fmt(d.duration_ms)+' sn · '+d.audio_bytes+' bayt · '+d.quiet_candidates.length+' akustik sessizlik adayı · cpfair 36 atlama / 1 yer değiştirme';renderWords();renderAnnotations();draw();
</script></html>`;
const path=new URL('../docs/husary-muallim-2-145-review.html',import.meta.url);
fs.writeFileSync(path,out);
console.log(JSON.stringify({output:path.pathname,duration_ms:data.duration_ms,audio_bytes:bytes.byteLength,
  quiet_candidates:quiet.length,median_rms:median,threshold},null,2));
