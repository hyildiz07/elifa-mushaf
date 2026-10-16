import {createDiyanetIshakSource} from './diyanet-ayah-source.js';
import {createDiyanetIshakPlayer} from './diyanet-ayah-player.js';

// Opt-in QA panel only. It is intentionally absent from the public reciter
// selector until recording permission and device QA are complete.
const chapters = window.elifaPilotChapters;
if (!Array.isArray(chapters) || chapters.length !== 114)
  throw Error('Ishak pilot chapter catalog unavailable');

const css = document.createElement('style');
css.textContent = `
#ishakPilot{position:fixed;z-index:99999;inset:auto 10px 10px auto;width:min(440px,calc(100vw - 20px));max-height:calc(100vh - 24px);overflow:auto;background:#13243d;color:#fff;border:1px solid #dab96b;border-radius:16px;box-shadow:0 16px 48px #0008;padding:16px;font:14px/1.4 system-ui,sans-serif}
#ishakPilot *{box-sizing:border-box}#ishakPilot h2{font-size:17px;margin:0 32px 8px 0;color:#f0d388}#ishakPilot p{margin:0 0 12px;color:#cfd9e9}
#ishakPilot label{display:grid;gap:3px;font-weight:600}#ishakPilot .grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:8px 0}
#ishakPilot .wide{grid-column:span 4}#ishakPilot input,#ishakPilot select{width:100%;min-width:0;padding:8px;border-radius:8px;border:1px solid #8da0bc;background:#fff;color:#16253d}
#ishakPilot .actions{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}#ishakPilot button{background:#eac96e;color:#17223a;border:0;border-radius:8px;padding:8px 10px;font-weight:700;cursor:pointer}
#ishakPilot button:disabled{opacity:.5;cursor:not-allowed}#ishakPilot #ishakClose{position:absolute;top:10px;right:10px;background:none;color:#fff;font-size:20px}
#ishakPilot #ishakStatus{min-height:22px;color:#fff}#ishakPilot .check{display:flex;align-items:center;gap:8px}#ishakPilot .check input{width:auto}
`;
document.head.append(css);

const panel = document.createElement('section');
panel.id = 'ishakPilot';
panel.setAttribute('aria-label', 'İshak Danış ses denemesi');
panel.innerHTML = `
<button id="ishakClose" type="button" aria-label="Denemeyi kapat">×</button>
<h2>İshak Danış · Ayet sesi denemesi</h2>
<p>Bu alan yalnızca kaynak ve oynatma doğrulaması içindir. Kelimeye göre bölme henüz desteklenmiyor.</p>
<div class="grid">
  <label class="wide">Sûre<select id="ishakChapter"></select></label>
  <label>İlk âyet<input id="ishakFirst" type="number" min="1" value="1"></label>
  <label>Son âyet<input id="ishakLast" type="number" min="1" value="1"></label>
  <label>Tekrar<input id="ishakRepeat" type="number" min="1" max="100" value="1"></label>
  <label>Hız<select id="ishakSpeed"><option value="0.75">0,75×</option><option value="1" selected>1×</option><option value="1.25">1,25×</option><option value="1.5">1,5×</option><option value="2">2×</option></select></label>
</div>
<label class="check"><input id="ishakOfflineOnly" type="checkbox"> Yalnızca indirilen sesleri kullan</label>
<div class="actions">
  <button id="ishakPrepare" type="button">Hazırla</button>
  <button id="ishakPlay" type="button" disabled>▶ Oynat</button>
  <button id="ishakPause" type="button">Duraklat</button>
  <button id="ishakPrev" type="button">Önceki âyet</button>
  <button id="ishakNext" type="button">Sonraki âyet</button>
  <button id="ishakDownload" type="button">Sûreyi indir</button>
  <button id="ishakRemove" type="button">İndirmeyi sil</button>
</div>
<div id="ishakStatus" role="status" aria-live="polite">Ayet seç ve Hazırla'ya bas.</div>`;
document.body.append(panel);

const el = id => panel.querySelector('#' + id);
for (const chapter of chapters)
  el('ishakChapter').add(new Option(`${chapter.id}. ${chapter.tr}`, chapter.id));
const source = createDiyanetIshakSource();
const status = el('ishakStatus');
let busy = false;
const player = createDiyanetIshakPlayer({source, onState: state => {
  if (state.status === 'idle') return;
  if (state.error) status.textContent = state.error.message || String(state.error);
  else status.textContent = `${state.status} · ${state.chapter}:${state.verse ?? '—'} · ${state.repeatIndex}/${state.repeat ?? 1}`;
  el('ishakPlay').disabled = !['ready','paused','ended','playing'].includes(state.status);
}});

function chosenChapter() {
  const chapter = Number(el('ishakChapter').value);
  return {chapter, verseCount: chapters[chapter - 1].n};
}
function invalidate() {
  player.stop();
  el('ishakPlay').disabled = true;
  status.textContent = 'Seçim değişti. Yeniden hazırla.';
}
el('ishakChapter').addEventListener('change', () => {
  const {verseCount} = chosenChapter();
  el('ishakFirst').max = String(verseCount);
  el('ishakLast').max = String(verseCount);
  el('ishakFirst').value = '1';
  el('ishakLast').value = '1';
  invalidate();
});
for (const id of ['ishakFirst','ishakLast','ishakRepeat','ishakOfflineOnly'])
  el(id).addEventListener('change', invalidate);
el('ishakSpeed').addEventListener('change', () => {
  const speed = Number(el('ishakSpeed').value);
  if (player.state.status === 'idle') return;
  player.setSpeed(speed);
});
el('ishakPrepare').addEventListener('click', async () => {
  if (busy) return;
  busy = true;
  try {
    window.elifaStopNormalAudio?.();
    const {chapter, verseCount} = chosenChapter();
    await player.prepare(chapter, Number(el('ishakFirst').value), Number(el('ishakLast').value), verseCount, {
      repeat: Number(el('ishakRepeat').value), speed: Number(el('ishakSpeed').value),
      offlineOnly: el('ishakOfflineOnly').checked
    });
    status.textContent = 'Hazır. ▶ Oynat’a bas.';
  } catch (error) {status.textContent = error.message || String(error);}
  finally {busy = false;}
});
el('ishakPlay').addEventListener('click', () => {
  try {void player.play().catch(error => {status.textContent = error.message;});}
  catch (error) {status.textContent = error.message;}
});
el('ishakPause').addEventListener('click', () => player.pause());
el('ishakPrev').addEventListener('click', () => {void player.previous().catch(error => {status.textContent = error.message;});});
el('ishakNext').addEventListener('click', () => {void player.next().catch(error => {status.textContent = error.message;});});
el('ishakDownload').addEventListener('click', async () => {
  if (busy) return;
  busy = true;
  const {chapter, verseCount} = chosenChapter();
  try {
    await source.downloadChapter(chapter, verseCount, {onProgress: p => {
      status.textContent = `İndiriliyor · ${Math.round(p * 100)}%`;
    }});
    status.textContent = `${chapter}. sûre çevrimdışı hazır.`;
  } catch (error) {status.textContent = error.message || String(error);}
  finally {busy = false;}
});
el('ishakRemove').addEventListener('click', async () => {
  if (busy) return;
  busy = true;
  try {
    const {chapter, verseCount} = chosenChapter();
    player.stop();
    await source.removeChapter(chapter, verseCount);
    status.textContent = 'İndirilen sûre silindi.';
  } catch (error) {status.textContent = error.message || String(error);}
  finally {busy = false;}
});
el('ishakClose').addEventListener('click', () => {
  player.stop(); panel.remove(); css.remove();
});
