/* Quran.ws CC BY 4.0 annotations projected onto the app's unchanged text. */
(function () {
  'use strict';
  const names = ['tajweed-heavy', 'tajweed-joining', 'tajweed-noon', 'tajweed-meem', 'tajweed-ghunnah', 'tajweed-madd', 'tajweed-qalqalah'];
  const labels = ['Kalın okuma', 'Harf birleşmesi', 'Nûn ve tenvin', 'Mîm', 'Gunne', 'Med', 'Kalkale'];
  const defaults = ['#a33135', '#855f08', '#6e42a0', '#007a87', '#a2496e', '#1765a4', '#ab4d15'];
  const supported = !!(window.CSS?.highlights && window.Highlight && document.createRange);
  const datasets = new Map();
  let generation = 0;
  let current = null;
  const $ = id => document.getElementById(id);
  const paletteValues = new Set(['classic', 'soft', 'contrast', 'custom']);
  function fingerprint(text) {
    let hash = 2166136261;
    for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
    return hash >>> 0;
  }
  function clear() { for (const name of names) CSS.highlights.delete(name); }
  function getDataset(mode) {
    if (!datasets.has(mode)) datasets.set(mode, fetch(`/assets/tajweed/${mode}.json`).then(response => {
      if (!response.ok || !(response.headers.get('content-type') || '').includes('json')) throw Error('Tecvid verisi yüklenemedi');
      return response.json();
    }).catch(error => { datasets.delete(mode); throw error; }));
    return datasets.get(mode);
  }
  function textPoint(element, at) {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let node, seen = 0, last = null;
    while ((node = walker.nextNode())) {
      last = node;
      const end = seen + node.length;
      if (at <= end) return [node, at - seen];
      seen = end;
    }
    return last && at === seen ? [last, last.length] : null;
  }
  function addRange(ranges, record, start, end, topic) {
    if (!record || start < 0 || end <= start || end > record.txt.length || record.el.textContent !== record.txt || !ranges[topic]) return;
    const left = textPoint(record.el, start), right = textPoint(record.el, end);
    if (!left || !right) return;
    const range = document.createRange();
    range.setStart(...left); range.setEnd(...right);
    ranges[topic].push(range);
  }
  function setPalette() {
    document.body.dataset.tajweedPalette = paletteValues.has(SET.tajweedPalette) ? SET.tajweedPalette : 'classic';
    for (let i=0;i<names.length;i++) {
      const variable = '--tj-' + names[i].slice('tajweed-'.length);
      document.body.style.removeProperty(variable);
      const own = SET.tajweedColors?.[i];
      if (document.body.dataset.tajweedPalette === 'custom' && /^#[0-9a-f]{6}$/i.test(own)) document.body.style.setProperty(variable, own);
    }
    if ($('tajweedPalette')) $('tajweedPalette').value = document.body.dataset.tajweedPalette;
    for (let i=0;i<names.length;i++) {
      const input = $('tajweedColor'+i);
      if (input) input.value = /^#[0-9a-f]{6}$/i.test(getComputedStyle(document.body).getPropertyValue('--tj-'+names[i].slice(8)).trim())
        ? getComputedStyle(document.body).getPropertyValue('--tj-'+names[i].slice(8)).trim() : defaults[i];
    }
  }
  async function render(sid, records = wordArr) {
    if (!supported) return;
    const ticket = ++generation;
    clear();
    current = { sid, records };
    if (!SET.tajweed || !sid || !records?.length || document.body.classList.contains('testing')) return;
    const mode = SET.mushaf === 'turk' ? 'turk' : 'medine';
    let data;
    try { data = await getDataset(mode); }
    catch (error) { if (ticket === generation) console.warn(error); return; }
    if (ticket !== generation || !SET.tajweed || document.body.classList.contains('testing') || curS !== sid || (SET.mushaf === 'turk' ? 'turk' : 'medine') !== mode) return;
    const ranges = names.map(() => []);
    const wordsByAyah = new Map();
    for (const record of records) {
      if (!record.el?.isConnected) continue;
      if (!wordsByAyah.has(record.ay)) wordsByAyah.set(record.ay, []);
      wordsByAyah.get(record.ay).push(record);
    }
    for (const [ayah, words] of wordsByAyah) {
      const entry = data[sid]?.[ayah];
      if (!entry) continue;
      const [expectedHash, segments] = entry;
      const text = words.map((word, index) => word.txt + (index < words.length - 1 && !word.joinNext ? ' ' : '')).join('');
      if (fingerprint(text) !== expectedHash) continue; // stale or differently grouped text: fail closed
      if (mode === 'medine') {
        for (const [wordIndex, start, end, topic] of segments) addRange(ranges, words[wordIndex], start, end, topic);
      } else {
        let offset = 0;
        const bounds = words.map((word, index) => {
          const start = offset;
          offset += word.txt.length + (index < words.length - 1 && !word.joinNext ? 1 : 0);
          return [start, start + word.txt.length];
        });
        for (const [start, end, topic] of segments) for (let i = 0; i < words.length; i++) {
          const [wordStart, wordEnd] = bounds[i];
          const left = Math.max(start, wordStart), right = Math.min(end, wordEnd);
          if (left < right) addRange(ranges, words[i], left - wordStart, right - wordStart, topic);
          if (wordStart >= end) break;
        }
      }
    }
    if (ticket !== generation || document.body.classList.contains('testing')) return;
    for (let i = 0; i < names.length; i++) if (ranges[i].length && SET.tajweedTopics?.[i] !== false) CSS.highlights.set(names[i], new Highlight(...ranges[i]));
  }
  function refresh() { if (current) render(current.sid, wordArr); }
  function setTesting(on) {
    if (on) { generation++; clear(); }
    else refresh();
  }
  window.elifaTajweed = { render, refresh, setTesting, supported };
  const method = $('gearSheet')?.querySelector('.workflowMode');
  if (!method) return;
  const section = document.createElement('section');
  section.className = 'tajweedSettings';
  section.innerHTML = `<label class="tajweedToggle" for="tajweedEnabled"><span><strong>Tecvidli gösterim</strong><small>Kuralları mevcut Kur’an yazısında renklerle gösterir.</small></span><input id="tajweedEnabled" type="checkbox" role="switch"></label><div class="tajweedOptions" id="tajweedOptions" hidden><label for="tajweedPalette">Renk düzeni</label><select id="tajweedPalette"><option value="classic">Klasik</option><option value="soft">Yumuşak</option><option value="contrast">Yüksek kontrast</option><option value="custom">Kendi renklerim</option></select><details class="tajweedRules"><summary>Kuralları ve renkleri ayarla</summary><div id="tajweedRules"></div><p>Her kuralı ayrı ayrı açabilir, yanındaki renge dokunup değiştirebilirsin.</p></details><small>Türk mushafında yalnız güvenle eşleşen harfler renklenir; diğerleri normal kalır.</small><small>Kaynak: <a href="https://quran.ws/docs/build/tajweed/" target="_blank" rel="noopener noreferrer">Quran.ws Tecvid</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>. Konumlar mevcut yazıya uyarlandı.</small></div>`;
  method.after(section);
  const rules = $('tajweedRules');
  if (!Array.isArray(SET.tajweedTopics)) SET.tajweedTopics = names.map(() => true);
  if (!SET.tajweedColors || typeof SET.tajweedColors !== 'object' || Array.isArray(SET.tajweedColors)) SET.tajweedColors = {};
  labels.forEach((label, index) => {
    const row = document.createElement('div'); row.className = 'tajweedRule';
    const check = document.createElement('input'); check.type = 'checkbox'; check.id = 'tajweedTopic'+index; check.checked = SET.tajweedTopics[index] !== false;
    const text = document.createElement('label'); text.htmlFor = check.id; text.textContent = label;
    const color = document.createElement('input'); color.type = 'color'; color.id = 'tajweedColor'+index; color.setAttribute('aria-label', `${label} rengi`);
    row.append(check, text, color); rules.append(row);
    check.addEventListener('change', () => {
      SET.tajweedTopics[index] = check.checked; saveSet(); refresh();
    });
    color.addEventListener('input', () => {
      SET.tajweedColors[index] = color.value;
      SET.tajweedPalette = 'custom'; saveSet(); setPalette();
    });
  });
  const toggle = $('tajweedEnabled'), options = $('tajweedOptions');
  const sync = () => {
    toggle.checked = !!SET.tajweed;
    toggle.disabled = !supported;
    options.hidden = !SET.tajweed || !supported;
    setPalette();
  };
  toggle.addEventListener('change', () => { SET.tajweed = toggle.checked; saveSet(); sync(); refresh(); });
  $('tajweedPalette').addEventListener('change', event => {
    SET.tajweedPalette = paletteValues.has(event.target.value) ? event.target.value : 'classic';
    saveSet(); setPalette();
  });
  if (!supported) section.querySelector('small').textContent = 'Bu cihazın tarayıcısı harfleri düzeni bozmadan renklendirmeyi desteklemiyor.';
  sync();
  if (typeof curS !== 'undefined' && curS && typeof wordArr !== 'undefined' && wordArr.length) render(curS, wordArr);
})();
