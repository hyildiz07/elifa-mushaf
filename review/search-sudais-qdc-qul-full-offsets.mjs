// Research only. Search the entire original QDC PCM stream for QUL verse anchors.
// A 12-bit sign fingerprint gives a cheap candidate index; three 300 ms PCM
// correlations must then agree on one absolute offset. No timing is exported.
import fs from 'node:fs';
import crypto from 'node:crypto';
import { MPEGDecoderWebWorker } from 'mpg123-decoder';

const source = JSON.parse(fs.readFileSync('review/sudais-qdc-qul-5-28-29-identity-screen.json'));
const output = 'review/sudais-qdc-qul-full-offset-search-2026-09-30.json';
const positions = [-145, -119, -94, -70, -45, -20, 5, 30, 54, 79, 105, 130];
const t0 = Date.now();
function sha256(path) {
  return crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
}

async function waveform(path) {
  const decoder = new MPEGDecoderWebWorker();
  await decoder.ready;
  let rate = 0, total = 0, sum = 0, count = 0, bin = 0;
  const out = [];
  try {
    for await (const chunk of fs.createReadStream(path, {highWaterMark: 32768})) {
      const block = await decoder.decode(new Uint8Array(chunk));
      if (block.errors?.length) throw Error(`decode error: ${path}`);
      if (!block.samplesDecoded) continue;
      if (!rate) rate = block.sampleRate;
      if (rate !== block.sampleRate) throw Error(`sample rate changed: ${path}`);
      const samples = block.channelData[0];
      for (let i = 0; i < block.samplesDecoded; i++) {
        const nextBin = Math.floor((total + i) * 1000 / rate);
        if (nextBin !== bin) {
          out.push(count ? sum / count : 0);
          for (let m = bin + 1; m < nextBin; m++) out.push(0);
          bin = nextBin; sum = 0; count = 0;
        }
        sum += samples[i]; count++;
      }
      total += block.samplesDecoded;
    }
    if (count) out.push(sum / count);
  } finally { await decoder.free(); }
  return Float32Array.from(out);
}

function fingerprint(samples, center) {
  let bits = 0;
  for (let i = 0; i < positions.length; i++) bits |= (samples[center + positions[i]] >= 0 ? 1 : 0) << i;
  return bits;
}
function correlation(x, y, xc, yc) {
  let xx = 0, yy = 0, xy = 0;
  for (let i = -150; i < 150; i += 2) {
    const a = x[xc + i], b = y[yc + i];
    xx += a * a; yy += b * b; xy += a * b;
  }
  return xy / Math.sqrt(xx * yy || 1);
}
function buildIndex(samples) {
  const heads = new Int32Array(1 << positions.length).fill(-1);
  const next = new Int32Array(samples.length).fill(-1);
  for (let center = 150; center < samples.length - 150; center++) {
    const hash = fingerprint(samples, center);
    next[center] = heads[hash]; heads[hash] = center;
  }
  return {heads, next};
}
function matches(x, y, index, center, max = 40) {
  if (center < 150 || center >= y.length - 150) return [];
  const hash = fingerprint(y, center);
  const strong = [];
  // Up to three flipped signs cover every calibrated known-match window.
  const masks = [0];
  for (let i = 0; i < positions.length; i++) masks.push(1 << i);
  for (let i = 0; i < positions.length; i++)
    for (let j = i + 1; j < positions.length; j++) masks.push((1 << i) | (1 << j));
  for (let i = 0; i < positions.length; i++)
    for (let j = i + 1; j < positions.length; j++)
      for (let k = j + 1; k < positions.length; k++) masks.push((1 << i) | (1 << j) | (1 << k));
  for (const mask of masks) {
    const candidateHash = hash ^ mask;
    for (let xc = index.heads[candidateHash]; xc >= 0; xc = index.next[xc]) {
      const score = correlation(x, y, xc, center);
      if (score >= 0.95) strong.push({qdcCenterMs: xc, offsetMs: xc - center, correlation: +score.toFixed(6)});
    }
  }
  strong.sort((a,b) => b.correlation - a.correlation);
  return strong.slice(0, max);
}
const report = {status: 'research-only-not-for-production', method: 'full-chapter 1ms PCM search with 12-bit sign fingerprint (0 to 3 bit errors), then 300ms PCM correlation >=0.95 and independent three-anchor offset agreement <=20ms', chapters: {}};
for (const surah of [5, 28, 29]) {
  const old = source.chapters[surah];
  const qdcPath = `test-results/sudais-qdc-${surah}.mp3`;
  const qulPath = `test-results/sudais-qul-${surah}.mp3`;
  const qdcSha256 = sha256(qdcPath), qulSha256 = sha256(qulPath);
  if (qdcSha256 !== old.qdcSha256 || qulSha256 !== old.qulSha256)
    throw Error(`${surah}: MP3 SHA-256 changed since prior screen`);
  const [qdc, qul] = await Promise.all([
    waveform(qdcPath),
    waveform(qulPath)
  ]);
  const index = buildIndex(qdc);
  const calibrations = old.rows.filter(row => row.sameRecording).flatMap(row => row.anchors.map(anchor => {
    const a = fingerprint(qdc, anchor.qdcCenterMs);
    const b = fingerprint(qul, anchor.centerMs);
    const differingBits = (a ^ b).toString(2).replaceAll('0', '').length;
    return {key: row.key, differingBits, correlation: +correlation(qdc, qul, anchor.qdcCenterMs, anchor.centerMs).toFixed(6)};
  }));
  const rows = [];
  // Include one known positive in each chapter as a calibration control.
  const controls = {5: '5:111', 28: '28:44', 29: '29:45'};
  for (const prior of old.rows.filter(row => !row.sameRecording || row.key === controls[surah])) {
    const centers = prior.anchors.map(a => a.centerMs);
    const search = centers.map(c => matches(qdc, qul, index, c));
    const triples = [];
    for (const first of search[0]) {
      const companions = search.slice(1).map(set => set.find(m => Math.abs(m.offsetMs - first.offsetMs) <= 20));
      if (companions.every(Boolean)) triples.push({offsetMs: first.offsetMs,
        qdcCentersMs: [first, ...companions].map(m => m.qdcCenterMs),
        correlations: [first, ...companions].map(m => m.correlation)});
    }
    triples.sort((a,b) => Math.min(...b.correlations) - Math.min(...a.correlations));
    rows.push({key: prior.key, previousSameRecording: prior.sameRecording,
      anchorMatchCounts: search.map(set => set.length), candidates: triples.slice(0, 5)});
  }
  report.chapters[surah] = {qdcSha256, qulSha256, sha256MatchesPriorScreen: true,
    qdcDurationMs: old.qdcDurationMs, qulDurationMs: old.qulDurationMs,
    calibration: {knownWindows: calibrations.length,
      fingerprintMisses: calibrations.filter(v => v.differingBits > 3).length,
      minCorrelation: Math.min(...calibrations.map(v => v.correlation)),
      maxDifferingBits: Math.max(...calibrations.map(v => v.differingBits))},
    searched: rows.length, newlyMatched: rows.filter(r => !r.previousSameRecording && r.candidates.length).length,
    rows, elapsedSec: +((Date.now() - t0)/1000).toFixed(1)};
  fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
  console.log(`${surah}: ${report.chapters[surah].newlyMatched} new of ${rows.length - 1} held, ${report.chapters[surah].elapsedSec}s elapsed`);
}
