// Review-only fail-closed screen. This file never writes production timings.
// A quiet interval is necessary for this deliberately strict shortcut, but
// cannot by itself prove that the final/initial phonemes are intact.
import fs from 'node:fs';
import crypto from 'node:crypto';

const expectedSha = {
  3: '7a52d1efb56e31d8c84436aec39cbeebde8498dfa43acaf2c082c7c145153614',
  4: '60adc3638bc3cdf6dbfcf110ab1102f810794ea21e74f3764cd159b3f13d122d',
};
const root = new URL('../', import.meta.url);
const read = path => JSON.parse(fs.readFileSync(new URL(path, root), 'utf8'));
const digest = path => crypto.createHash('sha256').update(fs.readFileSync(new URL(path, root))).digest('hex');
const structural = read('review/sudais-qul-chapters-3-4-boundaries.json');
const acoustics = read('review/sudais-interverse-acoustics-2026-09-30.json');
const report = {
  status: 'review-only-no-production-approval',
  rule: 'Exact source SHA, complete canonical word structure, both adjacent verse cuts with >=120 ms quiet PCM, independent source-bound phonetic and playback proof for every enabled mode.',
  limitations: [
    'The existing acoustic report has no source SHA or per-cut decoder provenance; its quiet-run values are screening evidence only.',
    'A quiet interval cannot establish that a final consonant was not clipped or the next first consonant was not included.',
    'No independent phonetic hold-out or full player-mode evidence is present for the whole candidate set.',
    'Internal word cuts require their own exact-source acoustic and phonetic checks; verse-level evidence cannot approve them.',
  ],
  chapters: {},
};

for (const [chapter, total] of [[3, 200], [4, 176]]) {
  const file = `test-results/sudais-qdc-${chapter}.mp3`;
  const sourceSha256 = digest(file);
  const sourceMatches = sourceSha256 === expectedSha[chapter];
  const s = structural.chapters[chapter];
  const a = acoustics.chapters[chapter];
  if (s.total_verses !== total || a.verses !== total || a.boundaries.length !== total - 1)
    throw new Error(`Chapter ${chapter} report coverage changed; fail closed`);
  const failedStructure = new Set(s.flagged.map(row => row.key));
  const boundaries = new Map(a.boundaries.map(row => [row.after, row]));
  const rows = [];
  for (let ayah = 1; ayah <= total; ayah++) {
    const key = `${chapter}:${ayah}`;
    const adjacent = [ayah > 1 ? boundaries.get(`${chapter}:${ayah - 1}`) : null,
      ayah < total ? boundaries.get(key) : null].filter(Boolean);
    const bothQuiet = adjacent.length > 0 && adjacent.every(row => !row.missing && row.quietRunMs >= 120);
    const reasons = [];
    if (!sourceMatches) reasons.push('source-sha-mismatch');
    if (failedStructure.has(key)) reasons.push('canonical-word-structure-failed');
    if (!bothQuiet) reasons.push('adjacent-quiet-cut-not-established');
    reasons.push('independent-phonetic-and-player-mode-proof-missing');
    rows.push({key, structuralCandidate: !failedStructure.has(key), adjacentQuietCandidate: bothQuiet,
      automaticProductionApproval: false, reasons});
  }
  report.chapters[chapter] = {
    verseCount: total, sourceFile: file, sourceSha256, sourceMatches,
    structuralCandidates: rows.filter(row => row.structuralCandidate).length,
    quietAdjacentCandidates: rows.filter(row => row.adjacentQuietCandidate).length,
    productionApproved: 0,
    wordCutApproved: 0,
    rows,
  };
}
fs.writeFileSync(new URL('review/sudais-exact-qdc-batch-gate-2026-09-30.json', root),
  `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(Object.fromEntries(Object.entries(report.chapters).map(([chapter, row]) =>
  [chapter, {sourceMatches: row.sourceMatches, structuralCandidates: row.structuralCandidates,
    quietAdjacentCandidates: row.quietAdjacentCandidates, productionApproved: row.productionApproved}]))));
