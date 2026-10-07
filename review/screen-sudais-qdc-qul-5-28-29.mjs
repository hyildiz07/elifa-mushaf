// Research only: compare the exact pinned QDC recordings with QUL resource 407.
// A waveform match does not validate word/verse cut points or audio reuse rights.
import fs from 'node:fs';
import crypto from 'node:crypto';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { MPEGDecoderWebWorker } from 'mpg123-decoder';

const surahs = [5, 28, 29];
const outPath = 'review/sudais-qdc-qul-5-28-29-identity-screen.json';
const base = 'https://qul.tarteel.ai/api/v1/audio/surah_segments/3';
const counts = { 5: 120, 28: 88, 29: 69 };

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw Error(`${url}: HTTP ${response.status}`);
  return response.json();
}
async function inputFor(surah) {
  const timingPath = `test-results/sudais-qul-timings-${surah}.json`;
  let timing;
  if (fs.existsSync(timingPath)) timing = JSON.parse(fs.readFileSync(timingPath, 'utf8'));
  else {
    const first = await fetchJson(`${base}?surah=${surah}`);
    const segments = { ...first.segments };
    for (let page = 2; page <= first.pagination.total_pages; page++) {
      const next = await fetchJson(`${base}?surah=${surah}&page=${page}`);
      Object.assign(segments, next.segments);
    }
    timing = { audio: first.audio, segments, pagination: first.pagination };
    if (Object.keys(segments).length !== counts[surah]) throw Error(`${surah}: incomplete QUL timing`);
    fs.writeFileSync(timingPath, JSON.stringify(timing) + '\n');
  }
  const mp3Path = `test-results/sudais-qul-${surah}.mp3`;
  if (!fs.existsSync(mp3Path)) {
    const response = await fetch(timing.audio.url);
    if (!response.ok || !response.body) throw Error(`${surah}: QUL MP3 HTTP ${response.status}`);
    await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(mp3Path));
  }
  if (fs.statSync(mp3Path).size !== timing.audio.audio_size) throw Error(`${surah}: QUL MP3 incomplete`);
  return timing;
}
async function waveform(file) {
  const decoder = new MPEGDecoderWebWorker();
  let rate = 0, total = 0, sum = 0, count = 0, bin = 0;
  const out = [];
  try {
    await decoder.ready;
    for await (const chunk of fs.createReadStream(file, { highWaterMark: 32768 })) {
      const block = await decoder.decode(new Uint8Array(chunk));
      if (block.errors?.length) throw Error(`MP3 decode error: ${file}`);
      if (!block.samplesDecoded) continue;
      if (!rate) rate = block.sampleRate;
      if (rate !== block.sampleRate) throw Error(`Sample rate changed: ${file}`);
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
  return { samples: Float32Array.from(out), durationMs: total / rate * 1000 };
}
function corr(x, y, xc, yc, width = 300, step = 3) {
  let xx = 0, yy = 0, xy = 0;
  for (let i = -width / 2; i < width / 2; i += step) {
    const a = x[xc + i], b = y[yc + i];
    if (a === undefined || b === undefined) return -1;
    xx += a * a; yy += b * b; xy += a * b;
  }
  return xy / Math.sqrt(xx * yy || 1);
}
function envelope(samples) {
  const out = new Float32Array(Math.floor(samples.length / 10));
  for (let i = 0; i < out.length; i++) {
    let power = 0;
    for (let j = 0; j < 10; j++) power += samples[i * 10 + j] ** 2;
    out[i] = Math.sqrt(power / 10);
  }
  return out;
}
function anchorCenters(row) {
  const words = row.segments.filter(s => s[2] - s[1] >= 100);
  if (words.length >= 3) return [0.18, 0.50, 0.82].map(p => {
    const w = words[Math.min(words.length - 1, Math.floor(words.length * p))];
    return Math.round((w[1] + w[2]) / 2);
  });
  return [0.2, 0.5, 0.8].map(p => Math.round(row.time_from + (row.time_to - row.time_from) * p));
}
function matchAnchor(x, y, xe, ye, yc, predicted, preferredOffsets = [], radius = 180000) {
  // Exact matching is much stronger than envelope similarity. Reuse the
  // observed chapter offsets first; this also catches matches whose amplitude
  // envelope has many similar-looking recitation phrases.
  let near = { timeMs: null, correlation: -1 };
  for (const offset of [...new Set([0, 100, 126057, ...preferredOffsets])]) {
    if (!Number.isFinite(offset)) continue;
    for (let time = Math.round(yc + offset) - 180; time <= Math.round(yc + offset) + 180; time++) {
      const score = corr(x, y, time, yc, 300, 2);
      if (score > near.correlation) near = { timeMs: time, correlation: score };
    }
  }
  if (near.correlation >= 0.95) return { qdcCenterMs: near.timeMs, offsetMs: near.timeMs - yc,
    envelopeCorrelation: null, correlation: +near.correlation.toFixed(6) };
  const yb = Math.round(yc / 10);
  const min = Math.max(50, Math.round((predicted - radius) / 10));
  const max = Math.min(xe.length - 50, Math.round((predicted + radius) / 10));
  let best = { bin: null, envelopeCorrelation: -1 };
  // An RMS envelope locates possible matches without depending on MP3 phase.
  for (let bin = min; bin <= max; bin += 2) {
    const score = corr(xe, ye, bin, yb, 80, 2);
    if (score > best.envelopeCorrelation) best = { bin, envelopeCorrelation: score };
  }
  let fine = { timeMs: null, correlation: -1 };
  for (let time = Math.max(200, best.bin * 10 - 30); time <= Math.min(x.length - 200, best.bin * 10 + 30); time++) {
    const score = corr(x, y, time, yc, 300, 2);
    if (score > fine.correlation) fine = { timeMs: time, correlation: score };
  }
  return { qdcCenterMs: fine.timeMs, offsetMs: fine.timeMs - yc,
    envelopeCorrelation: +best.envelopeCorrelation.toFixed(6), correlation: +fine.correlation.toFixed(6) };
}
function sha256(file) { return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'); }
const report = { status: 'research-only-not-for-production',
  method: 'full sequential MP3 decode; three word-centered PCM anchors per verse; 10ms RMS envelope broad ±180s search around QDC provider midpoint, then 1ms full-waveform verification', chapters: {} };
for (const surah of surahs) {
  const timing = await inputFor(surah);
  const qdcPath = `test-results/sudais-qdc-${surah}.mp3`;
  const qulPath = `test-results/sudais-qul-${surah}.mp3`;
  const qdcTiming = JSON.parse(fs.readFileSync(`test-results/timings/3-${surah}.json`, 'utf8'));
  const qdcRanges = new Map(qdcTiming.verse_timings.map(v => [v.verse_key, v]));
  const [qdc, qul] = await Promise.all([waveform(qdcPath), waveform(qulPath)]);
  const qdcEnvelope = envelope(qdc.samples), qulEnvelope = envelope(qul.samples);
  const rows = [];
  let lastStrongOffset = null;
  for (let ayah = 1; ayah <= counts[surah]; ayah++) {
    const key = `${surah}:${ayah}`;
    const row = timing.segments[key], original = qdcRanges.get(key);
    if (!row || !original) throw Error(`Missing ${key}`);
    const centers = anchorCenters(row);
    const qdcMid = (original.timestamp_from + original.timestamp_to) / 2;
    const qulMid = (row.time_from + row.time_to) / 2;
    const anchors = centers.map(centerMs => ({ centerMs,
      ...matchAnchor(qdc.samples, qul.samples, qdcEnvelope, qulEnvelope, centerMs,
        qdcMid + centerMs - qulMid, [lastStrongOffset]) }));
    const strong = anchors.filter(a => a.correlation >= 0.95);
    const offsetSpreadMs = strong.length ? Math.max(...strong.map(a => a.offsetMs)) - Math.min(...strong.map(a => a.offsetMs)) : null;
    const sameRecording = strong.length === 3 && offsetSpreadMs <= 20;
    if (sameRecording) lastStrongOffset = Math.round(strong.reduce((sum, a) => sum + a.offsetMs, 0) / strong.length);
    rows.push({ key, qulRangeMs: [row.time_from, row.time_to], qdcProviderRangeMs: [original.timestamp_from, original.timestamp_to],
      anchors, offsetSpreadMs, sameRecording });
    if (ayah % 20 === 0) console.log(`${surah}: ${ayah}/${counts[surah]}`);
  }
  report.chapters[surah] = { qdcSha256: sha256(qdcPath), qulSha256: sha256(qulPath),
    qdcDurationMs: qdc.durationMs, qulDurationMs: qul.durationMs,
    screened: rows.length, sameRecordingCandidates: rows.filter(r => r.sameRecording).length,
    held: rows.filter(r => !r.sameRecording).length, rows };
  console.log(JSON.stringify({ surah, screened: rows.length, sameRecordingCandidates: report.chapters[surah].sameRecordingCandidates }));
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n');
}
