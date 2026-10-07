// Research only: screen every QUL 3/4 verse against the exact local QDC chapter
// recording. A matching waveform and complete word labels are *candidates*,
// never permission to ship a phoneme boundary without independent review.
import fs from 'node:fs';
import crypto from 'node:crypto';
import vm from 'node:vm';
import { MPEGDecoderWebWorker } from 'mpg123-decoder';

const selected = process.argv.includes('--surah=3') ? [3]
  : process.argv.includes('--surah=4') ? [4] : [3, 4];
const limitFlag = process.argv.find(arg => arg.startsWith('--max-verses='));
const maxVerses = limitFlag ? Number(limitFlag.split('=')[1]) : Infinity;
if (!(maxVerses > 0)) throw Error('Invalid --max-verses');
const OUT = 'review/sudais-qdc-qul-verse-screen-2026-09-30.json';
const CANONICAL = { 3: 200, 4: 176 };

function qtext() {
  const html = fs.readFileSync('index.html', 'utf8');
  const at = html.indexOf('const QTEXT=');
  if (at < 0) throw Error('QTEXT missing');
  return vm.runInNewContext(`${html.slice(at, html.indexOf('\n', at))};QTEXT`);
}

async function waveform(file) {
  // One signed sample per millisecond keeps both full chapters under ~30 MB.
  // Decode from byte zero: MP3 VBR byte seeking caused misleading comparisons.
  const decoder = new MPEGDecoderWebWorker();
  let rate = 0, total = 0, sum = 0, count = 0, currentBin = 0;
  const values = [];
  try {
    await decoder.ready;
    for await (const chunk of fs.createReadStream(file, { highWaterMark: 32768 })) {
      const decoded = await decoder.decode(new Uint8Array(chunk));
      if (decoded.errors?.length) throw Error(`MP3 decode error: ${file}`);
      if (!decoded.samplesDecoded) continue;
      if (!rate) rate = decoded.sampleRate;
      if (decoded.sampleRate !== rate) throw Error(`Sample rate changed: ${file}`);
      const channel = decoded.channelData[0];
      for (let i = 0; i < decoded.samplesDecoded; i++) {
        const bin = Math.floor((total + i) * 1000 / rate);
        if (bin !== currentBin) {
          values.push(count ? sum / count : 0);
          for (let missing = currentBin + 1; missing < bin; missing++) values.push(0);
          currentBin = bin; sum = 0; count = 0;
        }
        sum += channel[i]; count++;
      }
      total += decoded.samplesDecoded;
    }
    if (count) values.push(sum / count);
  } finally { await decoder.free(); }
  return { samples: Float32Array.from(values), durationMs: total / rate * 1000 };
}

function correlation(x, y, center, shift, halfWidth = 180) {
  let xx = 0, yy = 0, xy = 0;
  for (let i = center - halfWidth; i < center + halfWidth; i++) {
    const a = x[i + shift], b = y[i];
    if (a === undefined || b === undefined) return { score: -1, rms: 0 };
    xx += a * a; yy += b * b; xy += a * b;
  }
  return { score: xy / Math.sqrt(xx * yy || 1), rms: Math.sqrt(yy / (halfWidth * 2)) };
}

function anchorCenters(row) {
  const words = row.segments.filter(s => s[2] - s[1] >= 80);
  if (words.length >= 3) return [0.15, 0.5, 0.85].map(p => {
    const w = words[Math.min(words.length - 1, Math.floor(words.length * p))];
    return Math.round((w[1] + w[2]) / 2);
  });
  return [0.2, 0.5, 0.8].map(p => Math.round(row.time_from + (row.time_to - row.time_from) * p));
}

function structural(row, count) {
  if (!row || !Array.isArray(row.segments)) return ['missing-row'];
  const positions = row.segments.map(s => s[0]);
  const unique = new Set(positions);
  const reasons = [];
  if (Array.from({ length: count }, (_, i) => i + 1).some(p => !unique.has(p))) reasons.push('missing-position');
  if (positions.some(p => !Number.isInteger(p) || p < 1 || p > count)) reasons.push('outside-position');
  if (row.segments.some((s, i) => s[2] < s[1] || s[1] < row.time_from - 1000 || s[2] > row.time_to + 1000)) reasons.push('time-outside-verse');
  if (row.segments.some((s, i) => i && s[1] < row.segments[i - 1][1])) reasons.push('time-regression');
  // Repetition is legitimate, but a backward nonadjacent label jump may be
  // an erroneous provider label and needs a human check.
  if (positions.some((p, i) => i && p < positions[i - 1] && p !== positions[i - 1])) reasons.push('repeat-or-label-regression');
  return reasons;
}

const text = qtext();
const report = { status: 'research-only-not-for-production', method: 'full sequential MP3 decode; three 360ms PCM anchors per verse; ±20ms shift', chapters: {} };
for (const surah of selected) {
  const qdcPath = `test-results/sudais-qdc-${surah}.mp3`;
  const qulPath = `test-results/sudais-qul-${surah}.mp3`;
  const timingPath = `test-results/sudais-qul-timings-${surah}.json`;
  for (const file of [qdcPath, qulPath, timingPath]) if (!fs.existsSync(file)) throw Error(`Missing pinned input: ${file}`);
  const timing = JSON.parse(fs.readFileSync(timingPath, 'utf8'));
  const [qdc, qul] = await Promise.all([waveform(qdcPath), waveform(qulPath)]);
  const rows = [];
  for (let ayah = 1; ayah <= Math.min(CANONICAL[surah], maxVerses); ayah++) {
    const key = `${surah}:${ayah}`;
    const verse = timing.segments[key];
    const wordCount = text[surah][ayah - 1][2].filter(w => w[1] === 0).length;
    const reasons = structural(verse, wordCount);
    const anchors = verse ? anchorCenters(verse).map(centerMs => {
      let best = { shiftMs: null, correlation: -1, rms: 0 };
      for (let shift = -20; shift <= 20; shift++) {
        const found = correlation(qdc.samples, qul.samples, centerMs, shift);
        if (found.score > best.correlation) best = { shiftMs: shift, correlation: +found.score.toFixed(6), rms: +found.rms.toFixed(6) };
      }
      return { centerMs, ...best };
    }) : [];
    if (anchors.some(a => a.rms < 0.0005)) reasons.push('weak-speech-anchor');
    if (anchors.some(a => a.correlation < 0.95)) reasons.push('pcm-mismatch');
    if (new Set(anchors.map(a => a.shiftMs)).size > 1) reasons.push('offset-drift');
    rows.push({ key, words: wordCount, labels: verse?.segments.length ?? 0,
      rangeMs: verse ? [verse.time_from, verse.time_to] : null,
      anchors, candidate: reasons.length === 0, reasons });
  }
  const reasons = {};
  for (const row of rows) for (const reason of row.reasons) reasons[reason] = (reasons[reason] || 0) + 1;
  report.chapters[surah] = {
    qdcSha256: crypto.createHash('sha256').update(fs.readFileSync(qdcPath)).digest('hex'),
    qulSha256: crypto.createHash('sha256').update(fs.readFileSync(qulPath)).digest('hex'),
    qdcDurationMs: qdc.durationMs, qulDurationMs: qul.durationMs,
    screened: rows.length, waveformMatchedCandidates: rows.filter(row => row.candidate).length,
    heldForReview: rows.filter(row => !row.candidate).length, reasons, rows,
  };
  console.log(JSON.stringify({ surah, screened: rows.length,
    candidates: report.chapters[surah].waveformMatchedCandidates,
    held: report.chapters[surah].heldForReview, reasons }));
}
fs.writeFileSync(OUT, JSON.stringify(report, null, 2) + '\n');
