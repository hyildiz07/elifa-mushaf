// Review-only cross-source check of a second ordered-repeat family.
import fs from 'node:fs';
import zlib from 'node:zlib';
import { prepareWindow } from '../src/split-audio.mjs';

const key = '2:101', ay = 101;
const qdc = JSON.parse(fs.readFileSync('test-results/timings/2-2.json', 'utf8'));
const verse = qdc.verse_timings.find(row => row.verse_key === key);
const next = qdc.verse_timings.find(row => row.verse_key === '2:102');
const qua = JSON.parse(zlib.gunzipSync(fs.readFileSync('test-results/qua-abdulbasit/word_timestamps.json.gz')));
const rows = qua.rows.filter(row => row[0] === key);
const source = JSON.parse(fs.readFileSync('test-results/qua-source-catalog.json', 'utf8')).recitations
  .find(row => row.slug === 'abdulbasit_abdulsamad_tarteel');
if (rows.length !== 1 || !source) throw new Error('QUD source missing');
const context = { createBuffer(channels, length, sampleRate) {
  const data = Array.from({ length: channels }, () => new Float32Array(length));
  return { numberOfChannels: channels, length, sampleRate, duration: length / sampleRate,
    copyToChannel(values, index) { data[index].set(values); }, getChannelData(index) { return data[index]; } };
} };
const [a, b] = await Promise.all([
  prepareWindow({ sourceUrl: qdc.audio_url, verifiedCbr: false,
    verseRanges: { [ay]: [verse.timestamp_from, verse.timestamp_to], [ay + 1]: [next.timestamp_from, next.timestamp_to] },
    verseSegments: { [ay]: verse.segments } }, ay, context, { positions: [] }),
  prepareWindow({ sourceUrl: source.audio.chapter_urls['2'], verifiedCbr: false,
    verseRanges: { [ay]: [rows[0][1], rows[0][2]], [ay + 1]: [rows[0][2] + 100, rows[0][2] + 1000] },
    verseSegments: { [ay]: rows[0][5] } }, ay, context, { positions: [] }),
]);
function mono1k(p) {
  const x = p.buffer.getChannelData(0), ratio = p.buffer.sampleRate / 1000;
  const out = new Float32Array(Math.floor(x.length / ratio));
  for (let i = 0; i < out.length; i++) {
    const from = Math.floor(i * ratio), to = Math.max(from + 1, Math.floor((i + 1) * ratio));
    let sum = 0; for (let j = from; j < to; j++) sum += x[j]; out[i] = sum / (to - from);
  }
  return out;
}
const x = mono1k(a), y = mono1k(b);
const points = [0.18, 0.5, 0.82].map(f => Math.round(y.length * f));
function corr(shift, at) {
  let xy = 0, xx = 0, yy = 0;
  for (let i = 0; i < 1000; i += 4) {
    const left = x[at + shift + i], right = y[at + i];
    if (left === undefined || right === undefined) return -Infinity;
    xy += left * right; xx += left * left; yy += right * right;
  }
  return xy / Math.sqrt(xx * yy || 1);
}
let best = { shift: 0, average: -Infinity, correlations: [] };
for (let shift = -3000; shift <= 3000; shift += 2) {
  const correlations = points.map(point => corr(shift, point));
  const average = correlations.reduce((sum, value) => sum + value, 0) / correlations.length;
  if (average > best.average) best = { shift, average, correlations };
}
const result = { status: 'review-only', key, qdc_url: qdc.audio_url,
  qua_url: source.audio.chapter_urls['2'], qdc_range: [verse.timestamp_from, verse.timestamp_to],
  qua_range: [rows[0][1], rows[0][2]], best: { shift_ms: best.shift,
    timeline_offset_ms: a.off - b.off + best.shift, average: +best.average.toFixed(4),
    correlations: best.correlations.map(value => +value.toFixed(4)) } };
fs.writeFileSync('review/abdulbasit-2-101-source-check.json', `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
