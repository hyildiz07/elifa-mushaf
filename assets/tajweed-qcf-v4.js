/* QCF V4 Tajweed: printed colours live in the page font, not in Unicode spans. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const supported = !!(window.FontFace && document.fonts && window.CSS?.supports?.('font-palette', 'normal'));
  const families = new Map();
  const pageLoads = new Map();
  const knownSpellings = new Set(['11:13:3', '80:25:1']);
  const chapters = new Map();
  let current = null;
  let generation = 0;
  let scrollFrame = 0;

  const copy = {
    tr: {
      title: 'Tecvidli Mushaf',
      detail: 'Açınca hazır renkli Mushaf yazısı, kapatınca normal yazımız görünür.',
      source: 'Yazı ve renkler Quran Foundation QCF V4 Mushaf fontundan gelir. İnternet gerekir.',
      unsupported: 'Bu cihaz renkli Mushaf fontunu desteklemiyor.',
      loading: 'Tecvidli Mushaf yükleniyor…',
      unavailable: 'Tecvidli Mushaf yüklenemedi; normal yazı gösteriliyor.'
    },
    en: {
      title: 'Tajweed Mushaf',
      detail: 'Show the ready-made coloured Mushaf font; turn off to return to your normal script.',
      source: 'Script and colours come from the Quran Foundation QCF V4 Mushaf font. Internet is required.',
      unsupported: 'This device does not support the coloured Mushaf font.',
      loading: 'Loading Tajweed Mushaf…',
      unavailable: 'Tajweed Mushaf could not load; normal script is shown.'
    }
  };
  function language() {
    return copy[window.ElifaLocale?.current?.() || document.documentElement.lang] || copy.en;
  }
  async function chapter(sid) {
    if (chapters.has(sid)) return chapters.get(sid);
    const task = (async () => {
      const expected = QTEXT[sid];
      if (!expected) throw new Error(`Missing chapter ${sid}`);
      const rows = [];
      for (let page = 1; page;) {
        const url = `https://api.qurancdn.com/api/qdc/verses/by_chapter/${sid}?words=true&per_page=300&page=${page}&mushaf=19&fields=page_number&word_fields=code_v2,text_uthmani,char_type_name,page_number`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`QCF chapter ${sid}: ${response.status}`);
        const result = await response.json();
        rows.push(...result.verses);
        page = result.pagination?.next_page || 0;
      }
      if (rows.length !== expected.length) throw new Error(`QCF verse count: ${sid}`);
      return rows.map((verse, index) => {
        const original = expected[index];
        if (verse.verse_number !== original[0]) throw new Error(`QCF verse order: ${sid}:${index + 1}`);
        const originalWords = original[2].filter(word => word[1] === 0);
        // The public response currently labels one printed ayah marker as a word (2:181).
        const words = verse.words.filter(word => word.char_type_name === 'word' &&
          !/^[٠-٩۰-۹0-9]+$/.test(word.text_uthmani || ''));
        if (words.length !== originalWords.length) throw new Error(`QCF word count: ${sid}:${index + 1}`);
        return words.map((word, position) => {
          if (word.position !== position + 1 || !Number.isInteger(word.page_number) ||
              word.page_number < 1 || word.page_number > 604 || !word.code_v2 || /[<>]/.test(word.code_v2))
            throw new Error(`QCF word: ${sid}:${index + 1}:${position + 1}`);
          // These two words use another orthography in our original Mushaf.
          const key = `${sid}:${index + 1}:${position + 1}`;
          const sameSpelling = word.text_uthmani === originalWords[position][0];
          if (!sameSpelling && !knownSpellings.has(key)) throw new Error(`QCF spelling: ${key}`);
          const code = sameSpelling ? word.code_v2 : null;
          return [word.page_number, code];
        });
      });
    })().catch(error => { chapters.delete(sid); throw error; });
    chapters.set(sid, task);
    return task;
  }
  function palette() {
    // QCF's palettes are built into the font: 0 light, 1 dark, 2 sepia.
    if (document.body.dataset.dark === '1') return 'dark';
    return document.body.dataset.theme === 'elifasaray' || SET.theme === 'elifasaray' ? 'sepia' : 'light';
  }
  function family(page) { return `ElifaQcfV4P${page}`; }
  function installPalettes(page) {
    if (families.has(page)) return;
    const name = family(page);
    const style = document.createElement('style');
    style.textContent = [0, 1, 2].map((base, index) =>
      `@font-palette-values --elifa-qcf-${page}-${['light','dark','sepia'][index]}{font-family:"${name}";base-palette:${base}}`
    ).join('');
    document.head.append(style);
    families.set(page, name);
  }
  function loadPage(page) {
    if (pageLoads.has(page)) return pageLoads.get(page);
    installPalettes(page);
    const url = `https://verses.quran.foundation/fonts/quran/hafs/v4/colrv1/woff2/p${page}.woff2`;
    const face = new FontFace(family(page), `url("${url}") format("woff2")`, { style: 'normal', weight: '400' });
    const task = face.load().then(loaded => { document.fonts.add(loaded); return true; })
      .catch(error => { pageLoads.delete(page); console.warn('QCF V4 font', page, error); return false; });
    pageLoads.set(page, task);
    return task;
  }
  function restore(session) {
    if (!session) return;
    for (const item of session.items) {
      if (!item.applied) continue;
      item.record.el.innerHTML = item.original;
      item.record.el.style.removeProperty('font-family');
      item.record.el.style.removeProperty('font-palette');
      item.record.el.classList.remove('tajweedQcfWord');
      item.applied = false;
    }
  }
  function applyPage(session, page) {
    const colour = palette();
    for (const item of session.byPage.get(page) || []) {
      if (!item.record.el.isConnected || !item.code) continue;
      if (!item.applied) {
        item.record.el.innerHTML = item.code;
        item.record.el.style.setProperty('font-family', `"${family(page)}"`, 'important');
        item.record.el.classList.add('tajweedQcfWord');
        item.applied = true;
      }
      item.record.el.style.fontPalette = `--elifa-qcf-${page}-${colour}`;
    }
  }
  function visiblePages(session) {
    if (!session || session.ticket !== generation || !SET.tajweed || document.body.classList.contains('testing')) return;
    const scroll = $('rscroll');
    if (!scroll) return;
    const box = scroll.getBoundingClientRect();
    for (const [page, items] of session.byPage) {
      if (session.loading.has(page)) continue;
      const first = items[0].record.el.getBoundingClientRect();
      const last = items[items.length - 1].record.el.getBoundingClientRect();
      if (last.bottom < box.top - 800 || first.top > box.bottom + 800) continue;
      session.loading.add(page);
      loadPage(page).then(ok => {
        if (!ok) session.loading.delete(page);
        if (ok && session.ticket === generation && SET.tajweed && !document.body.classList.contains('testing')) applyPage(session, page);
      });
    }
  }
  function scheduleVisible() {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => { scrollFrame = 0; visiblePages(current); });
  }
  async function render(sid, records = wordArr) {
    restore(current);
    const ticket = ++generation;
    current = null;
    if (!supported || !SET.tajweed || !sid || !records?.length || document.body.classList.contains('testing')) return;
    let verses;
    try { verses = await chapter(sid); }
    catch (error) { console.warn(error); if (ticket === generation) window.toast?.(language().unavailable); return; }
    if (ticket !== generation || !SET.tajweed || curS !== sid || document.body.classList.contains('testing')) return;
    const items = [], byPage = new Map();
    const counts = new Map();
    for (const record of records) counts.set(record.ay, (counts.get(record.ay) || 0) + 1);
    for (const record of records) {
      const words = verses[record.ay - 1];
      if (!words || words.length !== counts.get(record.ay)) continue;
      const pair = words[record.pos - 1];
      if (!pair || !Number.isInteger(pair[0])) continue;
      const item = { record, code: pair[1], original: record.el.innerHTML, applied: false };
      items.push(item);
      if (!byPage.has(pair[0])) byPage.set(pair[0], []);
      byPage.get(pair[0]).push(item);
    }
    current = { ticket, sid, items, byPage, loading: new Set() };
    scheduleVisible();
  }
  function refresh() { if (current) render(current.sid, wordArr); else if (typeof curS !== 'undefined' && curS) render(curS, wordArr); }
  function setTesting(on) { if (on) { restore(current); generation++; current = null; } else refresh(); }
  window.elifaTajweed = { render, refresh, setTesting, supported };
  $('rscroll')?.addEventListener('scroll', scheduleVisible, { passive: true });
  window.addEventListener('resize', scheduleVisible, { passive: true });
  new MutationObserver(() => {
    if (!current) return;
    for (const page of current.loading) if (document.fonts.check(`16px "${family(page)}"`)) applyPage(current, page);
  }).observe(document.body, { attributes: true, attributeFilter: ['data-dark', 'data-theme'] });

  const method = $('gearSheet')?.querySelector('.workflowMode');
  if (!method) return;
  const section = document.createElement('section');
  section.className = 'tajweedSettings';
  section.innerHTML = '<label class="tajweedToggle" for="tajweedEnabled"><span><strong></strong><small></small></span><input id="tajweedEnabled" type="checkbox" role="switch"></label><small class="tajweedSource"></small>';
  method.after(section);
  function updateLocale() {
    const t = language();
    section.querySelector('strong').textContent = t.title;
    section.querySelector('.tajweedToggle small').textContent = supported ? t.detail : t.unsupported;
    section.querySelector('.tajweedSource').textContent = t.source;
  }
  const toggle = $('tajweedEnabled');
  toggle.checked = !!SET.tajweed;
  toggle.disabled = !supported;
  toggle.addEventListener('change', () => { SET.tajweed = toggle.checked; saveSet(); refresh(); });
  window.addEventListener('elifa:language-changed', updateLocale);
  updateLocale();
  if (typeof curS !== 'undefined' && curS && typeof wordArr !== 'undefined' && wordArr.length) render(curS, wordArr);
})();
