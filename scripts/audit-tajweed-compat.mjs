import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
const [editionPath, annotationsPath] = process.argv.slice(2);

if (!editionPath || !annotationsPath) {
  console.error('Usage: node scripts/audit-tajweed-compat.mjs <uthmani-hafs.json> <annotations-uthmani-hafs.json>');
  process.exit(2);
}

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
function embeddedJson(name) {
  const line = html.split(/\r?\n/).find((item) => item.startsWith(`const ${name}=`));
  if (!line?.endsWith(';')) throw new Error(`Missing embedded ${name} text`);
  return JSON.parse(line.slice(`const ${name}=`.length, -1));
}

const medine = embeddedJson('QTEXT');
const turkish = embeddedJson('QTEXT_TR');
const edition = JSON.parse(readFileSync(editionPath, 'utf8'));
const annotations = JSON.parse(readFileSync(annotationsPath, 'utf8'));
const refs = Object.keys(edition.ayahs).sort((a, b) => {
  const [sa, aa] = a.split(':').map(Number);
  const [sb, ab] = b.split(':').map(Number);
  return sa - sb || aa - ab;
});
const canonical = refs.map((ref) => `${ref}\0${edition.ayahs[ref]}`).join('\u0001');
const digest = createHash('sha256').update(canonical).digest('hex');
if (digest !== annotations.edition.sha256) {
  throw new Error('Tecvid annotation edition digest does not match its text');
}
if (refs.length !== annotations.edition.ayahCount) {
  throw new Error('Tecvid annotation edition verse count does not match');
}

// Diagnostic only: removing marks and spacing does not produce safe annotation offsets.
const baseLetters = (text) => String(text).normalize('NFD')
  .replace(/[\p{Mark}\u0640\s]/gu, '')
  .replace(/[\u06D6-\u06ED]/g, '');
const counts = {
  sourceAyahs: refs.length,
  medineExact: 0,
  medineBaseLetters: 0,
  turkishExact: 0,
  turkishBaseLetters: 0,
  medineEqualWordCount: 0,
  medineWordCount: 0,
  medineExactWordsAtSamePosition: 0,
  missingVerses: [],
};

for (const ref of refs) {
  const [surah, ayah] = ref.split(':').map(Number);
  const row = medine[surah]?.[ayah - 1];
  const turkishText = turkish[surah]?.[ayah - 1];
  if (!row || typeof turkishText !== 'string') {
    counts.missingVerses.push(ref);
    continue;
  }
  const words = row[2].filter((entry) => entry[1] === 0).map((entry) => entry[0]);
  const medineText = words.join(' ');
  const sourceText = edition.ayahs[ref];
  counts.medineExact += Number(medineText === sourceText);
  counts.medineBaseLetters += Number(baseLetters(medineText) === baseLetters(sourceText));
  counts.turkishExact += Number(turkishText === sourceText);
  counts.turkishBaseLetters += Number(baseLetters(turkishText) === baseLetters(sourceText));
  counts.medineWordCount += words.length;
  const sourceWords = sourceText.split(' ');
  if (words.length === sourceWords.length) {
    counts.medineEqualWordCount++;
    for (let i = 0; i < words.length; i++) {
      counts.medineExactWordsAtSamePosition += Number(words[i] === sourceWords[i]);
    }
  }
}

console.log(JSON.stringify({
  source: 'quran-ws/quran-tajweed',
  corpusVersion: annotations.corpusVersion,
  editionDigest: digest,
  counts,
  warning: 'Base-letter matches are diagnostic only; they do not validate character offsets or tajweed placement.',
}, null, 2));
