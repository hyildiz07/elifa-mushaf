import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const embedded = name => {
  const line = html.split(/\r?\n/).find(item => item.startsWith(`const ${name}=`));
  return JSON.parse(line.slice(`const ${name}=`.length, -1));
};
const medineText = embedded('QTEXT');
const turkishText = embedded('QTEXT_TR');
const medine = JSON.parse(readFileSync(new URL('../assets/tajweed/medine.json', import.meta.url), 'utf8'));
const turkish = JSON.parse(readFileSync(new URL('../assets/tajweed/turk.json', import.meta.url), 'utf8'));
const meta = JSON.parse(readFileSync(new URL('../assets/tajweed/meta.json', import.meta.url), 'utf8'));
const turkishMeta = JSON.parse(readFileSync(new URL('../assets/tajweed/turk-meta.json', import.meta.url), 'utf8'));
const alignSource = html.slice(html.indexOf('function alignTurkishWords('), html.indexOf('async function fetchVerses('));
const alignTurkishWords = new Function(`${alignSource}\nreturn alignTurkishWords;`)();
const overlaySource = readFileSync(new URL('../assets/tajweed-overlay.js', import.meta.url), 'utf8');
const clusterSource = overlaySource.slice(overlaySource.indexOf('const graphemeSegmenter ='), overlaySource.indexOf('function fingerprint('))
  + overlaySource.slice(overlaySource.indexOf('function unsafeClusters('), overlaySource.indexOf('function addRange('));
const unsafeClusters = new Function(`${clusterSource}\nreturn unsafeClusters;`)();
const hash = text => {
  let value = 2166136261;
  for (let i=0;i<text.length;i++) value = Math.imul(value ^ text.charCodeAt(i), 16777619);
  return value >>> 0;
};

test('generated Medine colors fit unchanged app words and omit ambiguous ayahs', () => {
  assert.equal(meta.stats.mappedAyahs, 6234);
  assert.deepEqual(meta.stats.unmappedAyahs, ['2:72', '17:7']);
  assert.equal(medine[2]?.[72], undefined);
  assert.equal(medine[17]?.[7], undefined);
  let checked = 0;
  for (const [sid, rows] of Object.entries(medineText)) for (const row of rows) {
    const [ayah,,entries] = row;
    const words = entries.filter(x => x[1] === 0).map(x => x[0]);
    const record = medine[sid]?.[ayah];
    if (!record) continue;
    assert.equal(record[0], hash(words.join(' ')), `${sid}:${ayah} hash`);
    for (const [wi,start,end,topic] of record[1]) {
      assert.ok(words[wi] && start >= 0 && end > start && end <= words[wi].length, `${sid}:${ayah} word bounds`);
      assert.ok(topic >= 0 && topic < meta.topics.length);
    }
    checked++;
  }
  assert.equal(checked, 6214); // some ayahs have no stable visible span
});

test('Turkish overlay fits reader word grouping without altering printed text', () => {
  assert.equal(turkishMeta.stats.ayahs, 6236);
  let matched = 0, colored = 0;
  for (const [sid, verses] of Object.entries(turkishText)) verses.forEach((raw, index) => {
    const canonical = raw.split(/\s+/).filter(Boolean).join(' ');
    const printed = canonical.split(' ');
    const reference = medineText[sid][index][2].filter(word => word[1] === 0).map(word => word[0]);
    const aligned = alignTurkishWords(reference, printed);
    const grouped = aligned || printed;
    const recreated = grouped.map((word, wi) => word + (wi < grouped.length - 1 && !aligned?.joinNext?.has(wi) ? ' ' : '')).join('');
    assert.equal(recreated, canonical, `${sid}:${index + 1} reader grouping`);
    const record = turkish[sid]?.[index + 1];
    if (!record) return;
    assert.equal(record[0], hash(recreated), `${sid}:${index + 1} hash`);
    for (const [start,end,topic] of record[1]) {
      assert.ok(start >= 0 && end > start && end <= canonical.length, `${sid}:${index + 1} offsets`);
      assert.ok(topic >= 0 && topic < turkishMeta.topics.length);
    }
    matched++; colored += record[1].length;
  });
  assert.ok(matched > 6000);
  assert.ok(colored > 90000);
});

test('mixed-colour lam-alif stays in normal ink without hiding either letter', () => {
  const spansForWord = (sid, ayah, word) => {
    const text = turkishText[sid][ayah - 1];
    const start = text.indexOf(word);
    assert.ok(start >= 0, `${sid}:${ayah} ${word}`);
    return turkish[sid][ayah][1].flatMap(([from, to, topic]) => {
      const left = Math.max(from, start), right = Math.min(to, start + word.length);
      return left < right ? [[left - start, right - start, topic]] : [];
    });
  };
  const split = 'لَا';
  const splitMask = unsafeClusters(split, spansForWord(2, 6, split));
  assert.deepEqual([...splitMask], [0, 1, 2]);
  const sameColour = 'وَلَا';
  assert.equal(unsafeClusters(sameColour, spansForWord(2, 283, sameColour)).size, 0);
  assert.equal(turkishText[2][282].includes('فَرِهَانٌ مَقْبُوضَةٌ'), true);
});

test('colour ranges never split a grapheme or its joining control', () => {
  const word = 'رَا‌كِعاً';
  assert.deepEqual([...unsafeClusters(word, [[0, 3, 5]])], [2, 3]);
});
