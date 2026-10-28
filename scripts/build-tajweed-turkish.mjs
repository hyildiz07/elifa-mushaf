import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const [editionFile, annotationFile, rulesFile, outputDirectory = 'assets/tajweed'] = process.argv.slice(2);
if (!editionFile || !annotationFile || !rulesFile) throw Error('Pass pinned Quran.ws edition, annotations and rules files');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const line = html.split(/\r?\n/).find(item => item.startsWith('const QTEXT_TR='));
if (!line?.endsWith(';')) throw Error('Missing QTEXT_TR');
const target = JSON.parse(line.slice('const QTEXT_TR='.length, -1));
const edition = JSON.parse(readFileSync(editionFile, 'utf8'));
const annotations = JSON.parse(readFileSync(annotationFile, 'utf8'));
const rules = JSON.parse(readFileSync(rulesFile, 'utf8'));
const refs = Object.keys(edition.ayahs).sort((a, b) => {
  const [sa, aa] = a.split(':').map(Number), [sb, ab] = b.split(':').map(Number);
  return sa - sb || aa - ab;
});
const digest = createHash('sha256').update(refs.map(ref => `${ref}\0${edition.ayahs[ref]}`).join('\u0001')).digest('hex');
if (digest !== annotations.edition.sha256 || refs.length !== 6236 ||
    annotations.corpusVersion !== rules.version || annotations.riwayah !== rules.riwayah)
  throw Error('Edition, annotation, and rule set do not agree');
const ruleById = new Map(rules.rules.map(x => [x.id, x]));
const hukumById = new Map(rules.hukums.map(x => [x.id, x]));
const categoryById = new Map(rules.categories.map(x => [x.id, x]));
const topics = rules.topics.map(x => x.id);
const topicByRule = annotations.ruleIds.map(id => {
  const rule = ruleById.get(id);
  const topic = categoryById.get(hukumById.get(rule?.hukum)?.category)?.topic;
  if (!topics.includes(topic)) throw Error(`Unknown topic for ${id}`);
  // A stable rule can still carry an explicit pending scholarly review.
  return rule.status === 'stable' && !rule.needsReview ? topics.indexOf(topic) : -1;
});
function letters(text) {
  const result = [];
  for (let offset = 0; offset < text.length;) {
    const char = String.fromCodePoint(text.codePointAt(offset));
    const end = offset + char.length;
    if (char !== '\u0640' && /\p{Letter}/u.test(char)) {
      const base = char.normalize('NFD').replace(/\p{Mark}/gu, '').replace(/ى/g, 'ي').replace(/ٱ/g, 'ا');
      result.push({ base, start: offset, end });
    } else if (/\p{Mark}/u.test(char) && result.length) result.at(-1).end = end;
    offset = end;
  }
  return result;
}
// Some Turkish printings use a full alif where the source edition writes a
// dagger alif on the preceding letter. Only project such a word when its
// entire letter sequence has one unambiguous correspondence. A source letter
// with a dagger alif then covers both the target letter and its written alif.
function safeWordMap(sourceWord, targetWord) {
  const a = letters(sourceWord), b = letters(targetWord);
  if (!a.length || !b.length) return null;
  const paths = [];
  function walk(i, j, path) {
    if (paths.length > 1) return;
    if (i === a.length) {
      if (j === b.length) paths.push(path);
      return;
    }
    if (j >= b.length || a[i].base !== b[j].base) return;
    walk(i + 1, j + 1, [...path, [j]]);
    if (sourceWord.slice(a[i].start, a[i].end).includes('\u0670') && b[j + 1]?.base === 'ا')
      walk(i + 1, j + 2, [...path, [j, j + 1]]);
  }
  walk(0, 0, []);
  return paths.length === 1 ? paths[0] : null;
}
function stableWordPairs(sourceWords, targetWords) {
  const n = sourceWords.length, m = targetWords.length;
  const matches = sourceWords.map(word => targetWords.map(other => safeWordMap(word, other)));
  const dp = Array.from({length:n+1}, () => new Uint16Array(m+1));
  for (let i=n-1;i>=0;i--) for (let j=m-1;j>=0;j--)
    dp[i][j] = matches[i][j] ? dp[i+1][j+1]+1 : Math.max(dp[i+1][j], dp[i][j+1]);
  const trace = (preferSource) => {
    const pairs = new Map(); let i=0,j=0;
    while (i<n && j<m) {
      if (matches[i][j] && dp[i][j]===dp[i+1][j+1]+1) { pairs.set(i,j); i++;j++; }
      else if (dp[i+1][j]>dp[i][j+1] || (preferSource && dp[i+1][j]===dp[i][j+1])) i++;
      else j++;
    }
    return pairs;
  };
  const first=trace(true),last=trace(false);
  return [...first].filter(([i,j]) => last.get(i)===j);
}
const stats = { ayahs: refs.length, fullyMatchedAyahs: 0, partlyMatchedAyahs: 0, unsupportedAyahs: 0,
  sourceSpans: 0, excludedSpans: 0, unmatchedSpans: 0, shadowedSpans: 0, mappedSpans: 0,
  skippedSpans: 0, segments: 0 };
const bySurah = {};
function fingerprint(text) {
  let hash = 2166136261;
  for (let i=0;i<text.length;i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  return hash >>> 0;
}
for (const ref of refs) {
  const [sid, ayah] = ref.split(':').map(Number);
  const sourceText = edition.ayahs[ref], rawTarget = target[sid]?.[ayah - 1];
  if (typeof rawTarget !== 'string') throw Error(`Missing Turkish text ${ref}`);
  const targetText = rawTarget.split(/\s+/).filter(Boolean).join(' ');
  const source = letters(sourceText), destination = letters(targetText);
  const map = new Array(source.length).fill(null);
  const sourceBase = source.map(x => x.base).join(''), destinationBase = destination.map(x => x.base).join('');
  if (sourceBase === destinationBase) {
    for (let i = 0; i < source.length; i++) map[i] = [i];
    stats.fullyMatchedAyahs++;
  } else {
    // Never guess around a changed spelling. Stable identical words can be
    // mapped even when a neighbouring written word is split differently.
    const sourceWords = sourceText.split(' '), targetWords = targetText.split(' ');
    const sourceOffsets=[], targetOffsets=[];
    let offset=0;
    for(const word of sourceWords){sourceOffsets.push(offset);offset+=letters(word).length;}
    offset=0;
    for(const word of targetWords){targetOffsets.push(offset);offset+=letters(word).length;}
    const pairs = sourceWords.length===targetWords.length
      ? sourceWords.map((_,i)=>[i,i]).filter(([i])=>safeWordMap(sourceWords[i],targetWords[i]))
      : stableWordPairs(sourceWords,targetWords);
    for(const [fromWord,toWord] of pairs){
      const local = safeWordMap(sourceWords[fromWord],targetWords[toWord]);
      for(let i=0;i<local.length;i++)map[sourceOffsets[fromWord]+i]=local[i].map(j=>targetOffsets[toWord]+j);
    }
    if (map.some(i => i !== null)) stats.partlyMatchedAyahs++;
    else stats.unsupportedAyahs++;
  }
  const spans = annotations.spans[ref] || [];
  stats.sourceSpans += spans.length;
  const chosen = new Array(destination.length).fill(-1);
  for (const [start, end, ruleIndex] of [...spans].sort((a,b) => a[0] - b[0] || (b[1]-b[0]) - (a[1]-a[0]))) {
    const topic = topicByRule[ruleIndex];
    if (topic < 0) { stats.excludedSpans++; stats.skippedSpans++; continue; }
    if (start < 0 || end > sourceText.length || end <= start) throw Error(`Invalid source span ${ref}`);
    const covered = [];
    for (let i = 0; i < source.length; i++) if (source[i].start < end && source[i].end > start) covered.push(i);
    if (!covered.length || covered.some(i => map[i] === null)) {
      stats.unmatchedSpans++; stats.skippedSpans++; continue;
    }
    let used = false;
    for (const i of covered) for (const j of map[i]) if (chosen[j] < 0) { chosen[j] = topic; used = true; }
    if (used) stats.mappedSpans++;
    else stats.shadowedSpans++;
  }
  const segments = [];
  for (let i = 0; i < destination.length; i++) {
    const topic = chosen[i]; if (topic < 0) continue;
    const letter = destination[i], previous = segments.at(-1);
    if (previous && previous[1] === letter.start && previous[2] === topic) previous[1] = letter.end;
    else segments.push([letter.start, letter.end, topic]);
  }
  stats.segments += segments.length;
  if (segments.length) (bySurah[sid] ||= {})[ayah] = [fingerprint(targetText), segments];
}
if (stats.sourceSpans !== stats.excludedSpans + stats.unmatchedSpans + stats.shadowedSpans + stats.mappedSpans)
  throw Error('Projection accounting mismatch');
const output = resolve(outputDirectory);
mkdirSync(output, { recursive: true });
writeFileSync(resolve(output, 'turk-meta.json'), JSON.stringify({ source:'quran-ws/quran-tajweed', commit:'4fec00b726d32163fba72b41c2f4cfdd025fe645', license:'CC BY 4.0', editionDigest:digest, topics, stats }));
writeFileSync(resolve(output, 'turk.json'), JSON.stringify(bySurah));
console.log(JSON.stringify(stats, null, 2));
