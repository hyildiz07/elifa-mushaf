// Review-only gates for candidate full-verse playback on the exact QDC chapter MP3.
// Structural and PCM evidence locate candidates; they do not certify phoneme cuts.
import fs from 'node:fs';

const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const overlap = read('review/sudais-519-meta-overlap-2026-09-30.json');
const triage = read('review/sudais-batch-structural-triage-2026-09-30.json');
const cohort = new Set(overlap.rows.map(r => r.key));
const details = overlap.rows.map(r => {
  const [chapter, ayah] = r.key.split(':').map(Number);
  const shape = triage.chapters[chapter].rows.find(x => x.key === r.key);
  if (!shape?.sourceMatched) throw Error(`Unmatched cohort row ${r.key}`);
  const qul = read(`test-results/sudais-qul-timings-${chapter}.json`).segments;
  const row = qul[r.key];
  const first = row.segments.find(s => s[0] === 1);
  const last = [...row.segments].reverse().find(s => s[0] === shape.canonicalWords);
  const nextKey = `${chapter}:${ayah + 1}`;
  const nextMatched = cohort.has(nextKey);
  const previousMatched = cohort.has(`${chapter}:${ayah - 1}`);
  const startsInside = first && first[1] >= row.time_from && first[2] <= row.time_to;
  const endsInside = last && last[1] >= row.time_from && last[2] <= row.time_to;
  return {
    key: r.key, sourceMatched: true, cleanWordShape: shape.structuralCandidate,
    providerOverlapsCandidate: r.overlapTargetMs > 0,
    previousMatched, nextMatched,
    candidate: r.target,
    firstWordLeadMs: first ? first[1] - row.time_from : null,
    lastWordTailMs: last ? row.time_to - last[2] : null,
    edgeLabelsWithinCandidate: Boolean(startsInside && endsInside),
    nextCandidateGapMs: nextMatched ? r.next[0] - r.target[1] : null,
    needsDirectNextBoundary: ayah < triage.chapters[chapter].total && !nextMatched,
  };
});
const count = (rows, predicate) => rows.filter(predicate).length;
const summary = rows => ({
  verses: rows.length,
  providerDisjoint: count(rows, r => !r.providerOverlapsCandidate),
  cleanWordShape: count(rows, r => r.cleanWordShape),
  repeatOrLabelReview: count(rows, r => !r.cleanWordShape),
  bothNeighborsMatched: count(rows, r => r.previousMatched && r.nextMatched),
  nextMatched: count(rows, r => r.nextMatched),
  nextNotMatched: count(rows, r => !r.nextMatched),
  needsDirectNextBoundary: count(rows, r => r.needsDirectNextBoundary),
  edgeLabelsWithinCandidate: count(rows, r => r.edgeLabelsWithinCandidate),
  structurallySimpleWithNext: count(rows, r => r.cleanWordShape && r.nextMatched && r.edgeLabelsWithinCandidate),
  structurallySimpleWithNextAndDisjointProvider: count(rows, r => r.cleanWordShape && r.nextMatched && r.edgeLabelsWithinCandidate && !r.providerOverlapsCandidate),
  nextCandidateOverlaps: count(rows, r => r.nextCandidateGapMs !== null && r.nextCandidateGapMs < 0),
});
const out = {
  status: 'review-only-no-audio-cut-approved',
  meaning: 'Even structurally simple rows need independent phonetic first/last boundary and adjacent-verse checks on the exact QDC PCM before production use.',
  total: summary(details),
  chapters: Object.fromEntries([3, 4, 5, 28, 29].map(c => [c, summary(details.filter(r => r.key.startsWith(`${c}:`)))])),
  focus: details.filter(r => ['28:44', '29:45'].includes(r.key)),
};
fs.writeFileSync('review/sudais-519-whole-verse-gates-2026-09-30.json', JSON.stringify(out, null, 2) + '\n');
console.log(JSON.stringify(out, null, 2));
