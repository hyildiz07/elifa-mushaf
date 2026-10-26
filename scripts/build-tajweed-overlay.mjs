import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Build-time conversion only. The reader keeps its own Arabic text and fonts.
const [editionFile, annotationFile, rulesFile, outputDirectory = 'assets/tajweed'] = process.argv.slice(2);
if (!editionFile || !annotationFile || !rulesFile) {
  console.error('Usage: node scripts/build-tajweed-overlay.mjs <edition.json> <annotations.json> <rules.json> [output-dir]');
  process.exit(2);
}
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const embedded = (name) => {
  const line = html.split(/\r?\n/).find((item) => item.startsWith(`const ${name}=`));
  if (!line?.endsWith(';')) throw Error(`Missing ${name}`);
  return JSON.parse(line.slice(`const ${name}=`.length, -1));
};
const target = embedded('QTEXT');
const edition = JSON.parse(readFileSync(editionFile, 'utf8'));
const annotations = JSON.parse(readFileSync(annotationFile, 'utf8'));
const rules = JSON.parse(readFileSync(rulesFile, 'utf8'));
const refs = Object.keys(edition.ayahs).sort((a, b) => {
  const [sa, aa] = a.split(':').map(Number);
  const [sb, ab] = b.split(':').map(Number);
  return sa - sb || aa - ab;
});
const digest = createHash('sha256').update(refs.map(ref => `${ref}\0${edition.ayahs[ref]}`).join('\u0001')).digest('hex');
if (digest !== annotations.edition.sha256 || refs.length !== 6236 || rules.riwayah !== annotations.riwayah)
  throw Error('Edition, annotation, and rule set do not agree');

const ruleById = new Map(rules.rules.map(rule => [rule.id, rule]));
const hukumById = new Map(rules.hukums.map(hukum => [hukum.id, hukum]));
const categoryById = new Map(rules.categories.map(category => [category.id, category]));
const topics = rules.topics.map(topic => topic.id);
const topicByRule = annotations.ruleIds.map(id => {
  const rule = ruleById.get(id);
  const hukum = hukumById.get(rule?.hukum);
  const category = categoryById.get(hukum?.category);
  if (!category || !topics.includes(category.topic)) throw Error(`Unknown rule ${id}`);
  return rule.status === 'stable' ? topics.indexOf(category.topic) : -1;
});

// The two editions mostly differ in vowel/stop marks. A base letter can be
// followed by different combining marks, but no source index is copied raw.
function letters(text) {
  const result = [];
  for (let offset = 0; offset < text.length;) {
    const char = String.fromCodePoint(text.codePointAt(offset));
    const end = offset + char.length;
    if (char !== '\u0640' && /\p{Letter}/u.test(char)) {
      const base = char.normalize('NFD').replace(/\p{Mark}/gu, '').replace(/ى/g, 'ي');
      result.push({ base, start: offset, end });
    } else if (/\p{Mark}/u.test(char) && result.length) {
      result.at(-1).end = end;
    }
    offset = end;
  }
  return result;
}
const stats = { ayahs: refs.length, mappedAyahs: 0, unmappedAyahs: [], sourceSpans: 0, stableSpans: 0, mappedSpans: 0, skippedSpans: 0, outputSegments: 0, wordTextMismatches: 0 };
const bySurah = {};
function fingerprint(text) {
  let hash = 2166136261;
  for (let i=0;i<text.length;i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  return hash >>> 0;
}
for (const ref of refs) {
  const [sid, ayah] = ref.split(':').map(Number);
  const row = target[sid]?.[ayah - 1];
  if (!row || row[0] !== ayah) throw Error(`Target ayah missing: ${ref}`);
  const words = row[2].filter(item => item[1] === 0).map(item => item[0]);
  const text = words.join(' ');
  const sourceText = edition.ayahs[ref];
  const sourceLetters = letters(sourceText);
  const targetLetters = letters(text);
  const sourceSpans = annotations.spans[ref] || [];
  stats.sourceSpans += sourceSpans.length;
  if (sourceLetters.map(x => x.base).join('') !== targetLetters.map(x => x.base).join('')) {
    stats.unmappedAyahs.push(ref);
    stats.skippedSpans += sourceSpans.length;
    continue;
  }
  stats.mappedAyahs++;
  const wordBounds = [];
  let cursor = 0;
  for (const word of words) {
    wordBounds.push([cursor, cursor + word.length]);
    cursor += word.length + 1;
  }
  // Priority follows quran.ws: earlier start wins; longer span breaks ties.
  const chosen = new Array(sourceLetters.length).fill(-1);
  for (const [start, end, ruleIndex] of [...sourceSpans].sort((a, b) => a[0] - b[0] || (b[1] - b[0]) - (a[1] - a[0]))) {
    const topic = topicByRule[ruleIndex];
    if (topic < 0) { stats.skippedSpans++; continue; }
    stats.stableSpans++;
    if (start < 0 || end > sourceText.length || end <= start) { stats.skippedSpans++; continue; }
    const covered = [];
    for (let i = 0; i < sourceLetters.length; i++) {
      const letter = sourceLetters[i];
      if (letter.start < end && letter.end > start) covered.push(i);
    }
    if (!covered.length) { stats.skippedSpans++; continue; }
    let used = false;
    for (const i of covered) if (chosen[i] === -1) { chosen[i] = topic; used = true; }
    if (used) stats.mappedSpans++;
  }
  const segments = [];
  for (let i = 0; i < targetLetters.length; i++) {
    const topic = chosen[i];
    if (topic < 0) continue;
    const letter = targetLetters[i];
    const wi = wordBounds.findIndex(([start, end]) => letter.start >= start && letter.end <= end);
    if (wi < 0) { stats.wordTextMismatches++; continue; }
    const [wordStart] = wordBounds[wi];
    const start = letter.start - wordStart, end = letter.end - wordStart;
    const previous = segments.at(-1);
    if (previous && previous[0] === wi && previous[2] === start && previous[3] === topic) previous[2] = end;
    else segments.push([wi, start, end, topic]);
  }
  stats.outputSegments += segments.length;
  if (segments.length) (bySurah[sid] ||= {})[ayah] = [fingerprint(text), segments];
}
if (stats.wordTextMismatches) throw Error(`Mapped letters crossed word bounds: ${stats.wordTextMismatches}`);
const output = resolve(outputDirectory);
mkdirSync(output, { recursive: true });
writeFileSync(resolve(output, 'meta.json'), JSON.stringify({ source: 'quran-ws/quran-tajweed', commit: '4fec00b726d32163fba72b41c2f4cfdd025fe645', license: 'CC BY 4.0', editionDigest: digest, topics, stats }));
writeFileSync(resolve(output, 'medine.json'), JSON.stringify(bySurah));
console.log(JSON.stringify({ ...stats, unmappedAyahs: stats.unmappedAyahs }, null, 2));
