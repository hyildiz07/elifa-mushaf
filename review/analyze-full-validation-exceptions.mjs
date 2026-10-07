// Read-only classification of the saved full-Quran validation artifact.
// This never converts a provider timestamp into a publishable acoustic cut.
import fs from 'node:fs';

const report = JSON.parse(fs.readFileSync('test-results/full-validation.json', 'utf8'));
function feasible(count, positions, maxLength = 8) {
  const eligible = new Set(positions.filter(position => position >= 2 && position <= count - 2));
  const reachable = new Map([[0, new Set([false])]]);
  for (let end = 2; end <= count; end++) {
    if (end !== count && !eligible.has(end)) continue;
    for (const [start, states] of reachable) if (end - start >= 2 && end - start <= maxLength) {
      const next = reachable.get(end) ?? new Set();
      for (const hasCut of states) next.add(hasCut || end !== count);
      reachable.set(end, next);
    }
  }
  return !!reachable.get(count)?.has(true);
}
function completeOrderedRepeat(row) {
  const { segments: raw, words: count, range } = row;
  if (!range || raw.length < count) return false;
  let repeated = false;
  const seen = new Set();
  for (let i = 0; i < raw.length; i++) {
    const [position, from, to] = raw[i], previous = raw[i - 1];
    if (!Number.isInteger(position) || position < 1 || position > count ||
      !Number.isFinite(from) || !Number.isFinite(to) || to <= from ||
      from < range[0] || to > range[1]) return false;
    if (i === 0 && position !== 1) return false;
    if (previous) {
      if (from < previous[2] || position > previous[0] + 1) return false;
      if (position <= previous[0]) repeated = true;
    }
    seen.add(position);
  }
  return repeated && raw.at(-1)[0] === count && seen.size === count;
}
const byReciter = {}, examples = { eligibleButStillLong: [], noFeasibleCut: [], fallback: [] };
let fallback = 0, aligned = 0, safeFeasible = 0, safeInfeasible = 0;
let safeFeasibleFallback = 0, safeFeasibleAligned = 0;
let single = 0, multi = 0, missingPositions = 0, repeatedPositions = 0;
const defectShape = { missingAndRepeated: 0, missingOnly: 0, repeatedOnly: 0, neither: 0 };
const defectShapeAligned = { missingAndRepeated: 0, missingOnly: 0, repeatedOnly: 0, neither: 0 };
let completeOrderedRepeatCandidates = 0;
const orderedRepeatExamples = [];
const orderedRepeatCandidates = [];
for (const row of report.splitExceptions) {
  const reciter = row.key.split('/')[0];
  const result = byReciter[reciter] ??= { verses: 0, fallback: 0, aligned: 0,
    single: 0, multi: 0, missingPositions: 0, repeatedPositions: 0,
    safeFeasible: 0, safeInfeasible: 0, overlongParts: 0, maxWords: 0 };
  result.verses++;
  if (row.fallback) { fallback++; result.fallback++; if (examples.fallback.length < 6) examples.fallback.push(row.key); }
  else { aligned++; result.aligned++; }
  if (row.parts.length === 1) { single++; result.single++; }
  else { multi++; result.multi++; }
  if (row.uniquePositions < row.words) { missingPositions++; result.missingPositions++; }
  if (row.rows > row.uniquePositions) { repeatedPositions++; result.repeatedPositions++; }
  const missing = row.uniquePositions < row.words, repeated = row.rows > row.uniquePositions;
  const shape = missing ? (repeated ? 'missingAndRepeated' : 'missingOnly') :
    (repeated ? 'repeatedOnly' : 'neither');
  defectShape[shape]++;
  if (!row.fallback) defectShapeAligned[shape]++;
  if (!row.fallback && completeOrderedRepeat(row)) {
    completeOrderedRepeatCandidates++;
    result.completeOrderedRepeatCandidates = (result.completeOrderedRepeatCandidates || 0) + 1;
    orderedRepeatCandidates.push({ key: row.key, words: row.words, parts: row.parts,
      rows: row.rows, range: row.range });
    if (orderedRepeatExamples.length < 15) orderedRepeatExamples.push(row.key);
  }
  const canPartition = feasible(row.words, row.safe);
  if (canPartition) {
    safeFeasible++; result.safeFeasible++;
    if (row.fallback) safeFeasibleFallback++; else safeFeasibleAligned++;
    if (examples.eligibleButStillLong.length < 16) examples.eligibleButStillLong.push({ key: row.key, words: row.words, parts: row.parts, safe: row.safe });
  } else {
    safeInfeasible++; result.safeInfeasible++;
    if (examples.noFeasibleCut.length < 10) examples.noFeasibleCut.push({ key: row.key, words: row.words, parts: row.parts, safe: row.safe });
  }
  const overlong = row.parts.filter(length => length > 8);
  result.overlongParts += overlong.length;
  result.maxWords = Math.max(result.maxWords, row.words);
}
const output = {
  source: 'test-results/full-validation.json',
  counters: {
    medineSplitExceptionVerses: report.splitExceptions.length,
    bothOrthographiesSingleEightPlus: report.singleEightPlus,
    bothOrthographiesOverlongParts: report.partsOverEight,
    bothOrthographiesAlignedOverlongParts: report.alignedPartsOverEight,
    bothOrthographiesFallbackOverlongParts: report.partsOverEight - report.alignedPartsOverEight,
    structuralErrors: report.errorCount, totalVerseModes: report.verseModes,
  },
  exceptionClassification: { fallback, aligned, single, multi, missingPositions,
    repeatedPositions, safeFeasibleUnderTwoToEightWordRule: safeFeasible,
    safeFeasibleFallback, safeFeasibleAligned,
    safeInfeasibleUnderTwoToEightWordRule: safeInfeasible,
    labelShapes: defectShape, alignedLabelShapes: defectShapeAligned,
    completeOrderedRepeatCandidates },
  fallbackCausesBothOrthographies: report.fallbackCauses,
  byReciter, orderedRepeatCandidates, examples: { ...examples, orderedRepeatExamples },
  interpretation: 'A metadata-safe boundary only proves nonoverlap of timestamps and adjacent word labels. It does not prove an audible phoneme boundary. Safe-feasible exceptions warrant a focused algorithm/plan audit; they are not automatically safe production fixes.',
};
fs.writeFileSync('review/full-quran-split-exception-classification.json', `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify({ counters: output.counters, exceptionClassification: output.exceptionClassification,
  byReciter: Object.fromEntries(Object.entries(byReciter).map(([key, value]) => [key, {
    verses: value.verses, fallback: value.fallback, missingPositions: value.missingPositions,
    repeatedPositions: value.repeatedPositions, safeFeasible: value.safeFeasible,
    completeOrderedRepeatCandidates: value.completeOrderedRepeatCandidates || 0,
  }])) }, null, 2));
