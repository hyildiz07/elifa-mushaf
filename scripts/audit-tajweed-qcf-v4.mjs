import fs from 'node:fs';
import path from 'node:path';

// QCF V4 uses the same word codes as QCF V2. Keep the codes with their page
// numbers; a verse may cross a page boundary and need two different fonts.
const root = path.resolve(import.meta.dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const textLine = html.split(/\r?\n/).find(line => line.startsWith('const QTEXT='));
if (!textLine) throw new Error('Embedded QTEXT is missing');
const qtext = JSON.parse(textLine.slice('const QTEXT='.length, -1));
const mismatches = [];
const textMismatches = [];
const knownTextDifferences = new Set(['11:13:3', '80:25:1']);

async function fetchChapter(sid) {
  const rows = [];
  for (let page = 1; page;) {
    const url = `https://api.qurancdn.com/api/qdc/verses/by_chapter/${sid}?words=true&per_page=300&page=${page}&mushaf=19&fields=page_number&word_fields=code_v2,text_uthmani,char_type_name,page_number`;
    let response;
    for (let attempt = 0; attempt < 4; attempt++) {
      try { response = await fetch(url, { signal: AbortSignal.timeout(30000) }); }
      catch (error) { if (attempt === 3) throw error; }
      if (response?.ok) break;
      if (attempt === 3) throw new Error(`QDC chapter ${sid}: ${response?.status}`);
      await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
    }
    const data = await response.json();
    rows.push(...data.verses);
    page = data.pagination?.next_page || 0;
  }
  const expected = qtext[sid];
  if (rows.length !== expected.length) throw new Error(`Chapter ${sid}: ${rows.length} verses, expected ${expected.length}`);
  for (let i = 0; i < rows.length; i++) {
    const verse = rows[i];
    if (verse.verse_number !== expected[i][0]) throw new Error(`Chapter ${sid} verse order at ${i}`);
    // QDC currently labels the printed 2:181 verse number as a word.
    const words = verse.words.filter(word => word.char_type_name === 'word' &&
      !/^[٠-٩۰-۹0-9]+$/.test(word.text_uthmani || ''));
    const appWords = expected[i][2].filter(word => word[1] === 0);
    if (words.length !== appWords.length) mismatches.push(`${sid}:${verse.verse_number} ${words.length}/${appWords.length}`);
    words.forEach((word, j) => {
      if (word.position !== j + 1 || !word.code_v2 || !Number.isInteger(word.page_number))
        throw new Error(`Invalid QCF word ${sid}:${verse.verse_number}:${j + 1}`);
      if (word.text_uthmani !== appWords[j]?.[0]) {
        const key = `${sid}:${verse.verse_number}:${j + 1}`;
        textMismatches.push(key);
        // Preserve the app's original writing where the two editions differ.
        return;
      }
      if (/[<>]/.test(word.code_v2)) throw new Error('Unexpected markup in QCF code');
    });
  }
  process.stdout.write(`\rQCF V4 audit: ${sid}/114 chapters`);
}

for (let sid = 1; sid <= 114; sid += 4)
  await Promise.all(Array.from({ length: Math.min(4, 115 - sid) }, (_, i) => fetchChapter(sid + i)));
console.log(`\nVerse word-count mismatches: ${mismatches.length}`);
console.log(mismatches.slice(0, 30).join(', '));
console.log(`Word text mismatches: ${textMismatches.length}`);
console.log(textMismatches.slice(0, 30).join(', '));
if (mismatches.length || textMismatches.some(key => !knownTextDifferences.has(key)) ||
    textMismatches.length !== knownTextDifferences.size)
  throw new Error('QCF codes do not align with the app text');
console.log('QCF V4 words align with the app Mushaf. No content was stored.');
