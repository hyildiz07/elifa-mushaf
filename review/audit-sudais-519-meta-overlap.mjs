import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// Research-only: compare QDC provider metadata against QUL candidate timing on the
// QDC time axis. All candidates come from existing three-anchor per-verse
// PCM screens. No production assets are written.
const root = path.resolve(import.meta.dirname, '..');
const read = p => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const screen34 = read('review/sudais-qdc-qul-verse-screen-2026-09-30.json');
const screen = read('review/sudais-qdc-qul-5-28-29-identity-screen.json');
const overlap = (a, b) => Math.max(0, Math.min(a[1], b[1]) - Math.max(a[0], b[0]));
const chapters = [3, 4, 5, 28, 29];
const expectedCounts = { 3: 200, 4: 176, 5: 10, 28: 88, 29: 45 };
const knownOffsets = { 3: 0, 4: 0, 5: 126057, 28: 0, 29: 100 };
const byChapter = {};
const all = [];

for (const c of chapters) {
  const qdc = read(`test-results/timings/3-${c}.json`);
  const qul = read(`test-results/sudais-qul-timings-${c}.json`).segments;
  const identity = c <= 4 ? screen34.chapters[c] : screen.chapters[c];
  const actualSha = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, `test-results/sudais-qdc-${c}.mp3`))).digest('hex');
  if (actualSha !== identity.qdcSha256) throw new Error(`${c}: QDC source SHA mismatch`);
  const qdcRows = new Map(qdc.verse_timings.map(v => [v.verse_key, v]));
  const candidates = c <= 4
    ? identity.rows.map(r => r.key)
    : identity.rows.filter(r => r.sameRecording).map(r => r.key);
  if (candidates.length !== expectedCounts[c]) throw new Error(`${c}: expected ${expectedCounts[c]} candidates, got ${candidates.length}`);
  const candidateSet = new Set(candidates);
  const rows = [];
  for (const key of candidates) {
    const q = qdcRows.get(key), u = qul[key];
    if (!q || !u) throw new Error(`missing QDC/QUL row ${key}`);
    const [chapter, verse] = key.split(':').map(Number);
    const identityRow = identity.rows[verse - 1];
    if (identityRow?.key !== key || identityRow.anchors?.length !== 3) throw new Error(`${key}: missing source anchors`);
    const offsets = identityRow.anchors.map(a => c <= 4 ? a.shiftMs : a.offsetMs);
    if (offsets.some(x => x !== knownOffsets[c])) throw new Error(`${key}: source offset changed`);
    const offset = offsets[0];
    const meta = [q.timestamp_from, q.timestamp_to];
    const target = [u.time_from + offset, u.time_to + offset];
    const first = u.segments.find(s => s[0] === 1);
    if (!first) throw new Error(`missing first word ${key}`);
    const firstWord = [first[1] + offset, first[2] + offset];
    const previousKey = `${chapter}:${verse - 1}`;
    const previous = candidateSet.has(previousKey)
      ? [qul[previousKey].time_from + offset, qul[previousKey].time_to + offset] : null;
    const nextKey = `${chapter}:${verse + 1}`;
    const next = candidateSet.has(nextKey)
      ? [qul[nextKey].time_from + offset, qul[nextKey].time_to + offset] : null;
    const midpoint = (meta[0] + meta[1]) / 2;
    const row = {
      key, offset, sourceEvidence: 'three-anchor-verse-PCM',
      meta, target, firstWord, previousKey: previous ? previousKey : null,
      previous, nextKey: next ? nextKey : null, next,
      overlapTargetMs: overlap(meta, target),
      overlapFirstWordMs: overlap(meta, firstWord),
      endsBeforeFirstWord: meta[1] <= firstWord[0],
      endsBeforeTarget: meta[1] <= target[0],
      startsAfterTarget: meta[0] >= target[1],
      overlapsPrevious: previous ? overlap(meta, previous) > 0 : null,
      midpointInPrevious: previous ? midpoint >= previous[0] && midpoint < previous[1] : null,
      whollyInPrevious: previous ? meta[0] >= previous[0] && meta[1] <= previous[1] : null,
      overlapsNext: next ? overlap(meta, next) > 0 : null,
      midpointInNext: next ? midpoint >= next[0] && midpoint < next[1] : null,
      whollyInNext: next ? meta[0] >= next[0] && meta[1] <= next[1] : null,
      firstWordStartMinusMetaEndMs: firstWord[0] - meta[1],
    };
    rows.push(row); all.push(row);
  }
  byChapter[c] = rows;
}

const count = (xs, p) => xs.filter(p).length;
const summarize = xs => ({
  candidates: xs.length,
  targetOverlap: count(xs, r => r.overlapTargetMs > 0),
  noTargetOverlap: count(xs, r => r.overlapTargetMs === 0),
  endsBeforeTarget: count(xs, r => r.endsBeforeTarget),
  startsAfterTarget: count(xs, r => r.startsAfterTarget),
  endsBeforeFirstWord: count(xs, r => r.endsBeforeFirstWord),
  previousComparable: count(xs, r => r.previous !== null),
  overlapsPrevious: count(xs, r => r.overlapsPrevious === true),
  midpointInPrevious: count(xs, r => r.midpointInPrevious === true),
  whollyInPrevious: count(xs, r => r.whollyInPrevious === true),
  nextComparable: count(xs, r => r.next !== null),
  overlapsNext: count(xs, r => r.overlapsNext === true),
  midpointInNext: count(xs, r => r.midpointInNext === true),
  whollyInNext: count(xs, r => r.whollyInNext === true),
});
const result = {
  status: 'review-only-not-for-production',
  rules: {
    offsetMsByChapter: knownOffsets,
    candidates3and4: 'All existing three-anchor source-matched verse rows; candidate=false flags word-shape review, not source mismatch.',
    candidates5_28_29: 'Only existing three-anchor sameRecording=true verse rows.',
    previousComparison: 'Only when immediately preceding verse belongs to the same candidate set and inherits the same verified offset.',
    nextComparison: 'Only when immediately following verse belongs to the same candidate set and inherits the same verified offset.',
    overlap: 'Half-open intervals; no auditory boundary certification.',
  },
  chapters: Object.fromEntries(chapters.map(c => [c, summarize(byChapter[c])])),
  total: summarize(all),
  rows: all,
};
const output = path.join(root, 'review/sudais-519-meta-overlap-2026-09-30.json');
fs.writeFileSync(output, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ chapters: result.chapters, total: result.total }, null, 2));
