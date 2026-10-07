// Review only: QUD word timestamps and QUL candidates on the pinned QDC clock.
import fs from 'node:fs';
import crypto from 'node:crypto';
import { decodeWindow } from '../src/split-audio.mjs';

const endpoint = 'https://hetchyy-quranic-universal-aligner.hf.space/api/v1';
const settings = [
  { key: '28:44', surah: 28, window: 'review/sudais-28-44-corrected-window-align.json', qdc: 'test-results/sudais-qdc-28.mp3', qulPair: 'review/sudais-qul-pair/28-44.json' },
  { key: '5:111', surah: 5, window: 'review/sudais-5-111-corrected-window-align.json', qdc: 'test-results/sudais-qdc-5.mp3', qulOffset: 126057 },
];
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const report = { status: 'review-only-no-cut-approval', generated_at_utc: new Date().toISOString(), method: 'QUD Base and Large session word timestamps mapped by segment offset to pinned QDC chapter PCM; QUL source-matched nominal words; 20 ms PCM RMS bins', verses: {} };
for (const row of settings) {
  const alignment = JSON.parse(fs.readFileSync(row.window));
  const source = fs.readFileSync(row.qdc);
  if (sha256(source) !== alignment.source_sha256) throw Error(`${row.key}: source identity changed`);
  const pcm = await decodeWindow(new Blob([source]).stream(), ...alignment.requested_window_ms);
  const channel = pcm.channelData[0], rate = pcm.sampleRate;
  if (Math.abs(pcm.off - alignment.decoded_window_ms[0]) > 1) throw Error(`${row.key}: decode offset changed`);
  const bins = [];
  for (let i = 0; i < channel.length; i++) {
    const bin = Math.floor(i * 1000 / rate / 20);
    const x = bins[bin] ?? (bins[bin] = { sum: 0, count: 0 });
    x.sum += channel[i] * channel[i]; x.count++;
  }
  const rms = bins.map(x => Math.sqrt(x.sum / x.count));
  const energy = (from, to) => {
    const a = Math.max(0, Math.floor((from - pcm.off) / 20));
    const b = Math.min(rms.length, Math.ceil((to - pcm.off) / 20));
    const values = rms.slice(a, b);
    return values.length ? Math.sqrt(values.reduce((s, x) => s + x * x, 0) / values.length) : null;
  };
  let qulWords;
  if (row.qulPair) qulWords = JSON.parse(fs.readFileSync(row.qulPair)).source_word_segments.map(([n, a, b]) => ({ n, start_ms: a, end_ms: b }));
  else {
    const ayah = Number(row.key.split(':')[1]);
    const url = `https://qul.tarteel.ai/api/v1/audio/surah_segments/3?surah=${row.surah}&from=${ayah}&to=${ayah}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!res.ok) throw Error(`${row.key}: QUL HTTP ${res.status}`);
    const sourceWords = (await res.json()).segments[row.key].segments;
    qulWords = sourceWords.map(([n, a, b]) => ({ n, start_ms: a + row.qulOffset, end_ms: b + row.qulOffset }));
  }
  const modelWords = {};
  for (const model of ['Base', 'Large']) {
    const id = alignment.models[model].audio_id;
    const res = await fetch(`${endpoint}/sessions/${id}/timestamps`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ granularity: 'words' }), signal: AbortSignal.timeout(180000) });
    if (!res.ok) throw Error(`${row.key} ${model}: session HTTP ${res.status}`);
    const data = await res.json();
    const output = [];
    for (const part of data.segments ?? []) {
      const segment = alignment.models[model].segments[part.segment - 1];
      if (!segment || part.timing_status !== 'ok') continue;
      for (const [ref, start, end] of part.words ?? []) {
        if (!ref.startsWith(`${row.key}:`)) continue;
        output.push({ n: Number(ref.split(':')[2]), start_ms: Math.round(segment.source_from_ms + start * 1000), end_ms: Math.round(segment.source_from_ms + end * 1000), segment: part.segment });
      }
    }
    modelWords[model] = { audio_id: id, session_status: res.status, segment_statuses: data.segments?.map(x => x.timing_status), words: output };
  }
  const boundaries = [];
  for (let n = 1; n <= qulWords.length - 1; n++) {
    const q = qulWords[n - 1].end_ms;
    const b = modelWords.Base.words.find(x => x.n === n)?.end_ms;
    const l = modelWords.Large.words.find(x => x.n === n)?.end_ms;
    if (b == null || l == null) throw Error(`${row.key}: missing word ${n}`);
    const lo = Math.min(q, b, l), hi = Math.max(q, b, l);
    const candidates = Array.from({ length: 13 }, (_, i) => Math.round((Math.min(b, l) - 120 + i * 20) / 20) * 20);
    const quietest = candidates.map(t => ({ at_ms: t, rms: energy(t, t + 20) })).sort((x, y) => x.rms - y.rms)[0];
    boundaries.push({ after_word: n, qul_nominal_ms: q, base_end_ms: b, large_end_ms: l, base_large_delta_ms: b - l, model_vs_qul_ms: { Base: b - q, Large: l - q }, spread_ms: hi - lo, rms20_at_qul: energy(q - 10, q + 10), rms20_at_base: energy(b - 10, b + 10), rms20_at_large: energy(l - 10, l + 10), quietest_near_models: quietest, rms_between_extremes: energy(lo, hi), review_cue: Math.abs(b - l) <= 60 && Math.min(Math.abs(b - q), Math.abs(l - q)) <= 120 && quietest.rms < 0.002 });
  }
  const targetSegments = alignment.models.Base.segments.filter(x => x.ref_from.startsWith(`${row.key}:`));
  const firstSegment = targetSegments[0], lastSegment = targetSegments.at(-1);
  const allSegments = alignment.models.Base.segments;
  const prevSegment = allSegments[allSegments.indexOf(firstSegment) - 1];
  const nextSegment = allSegments[allSegments.indexOf(lastSegment) + 1];
  const outer = [
    { side: 'start', qul_ms: alignment.qul_source_matched_candidate_ms[row.key][0], qud_segment_ms: firstSegment.source_from_ms, qud_word_ms: modelWords.Base.words[0].start_ms, neighbor_segment_ms: prevSegment?.source_to_ms },
    { side: 'end', qul_ms: alignment.qul_source_matched_candidate_ms[row.key][1], qud_segment_ms: lastSegment.source_to_ms, qud_word_ms: modelWords.Base.words.at(-1).end_ms, neighbor_segment_ms: nextSegment?.source_from_ms },
  ].map(x => ({ ...x, rms20_at_qul: energy(x.qul_ms - 10, x.qul_ms + 10), rms20_at_qud_segment: energy(x.qud_segment_ms - 10, x.qud_segment_ms + 10), rms20_at_qud_word: energy(x.qud_word_ms - 10, x.qud_word_ms + 10), gap_ms: x.side === 'start' ? x.qud_segment_ms - x.neighbor_segment_ms : x.neighbor_segment_ms - x.qud_segment_ms }));
  report.verses[row.key] = { qdc_sha256: alignment.source_sha256, wav_sha256: alignment.wav_sha256, qdc_window_ms: alignment.decoded_window_ms, qdc_sample_rate: rate, qul_words: qulWords, models: modelWords, boundaries, outer_boundaries: outer, verse_edges: { qul: alignment.qul_source_matched_candidate_ms[row.key], Base: [modelWords.Base.words[0]?.start_ms, modelWords.Base.words.at(-1)?.end_ms], Large: [modelWords.Large.words[0]?.start_ms, modelWords.Large.words.at(-1)?.end_ms] } };
  console.log(JSON.stringify({ key: row.key, counts: { QUL: qulWords.length, Base: modelWords.Base.words.length, Large: modelWords.Large.words.length }, max_spread_ms: Math.max(...boundaries.map(x => x.spread_ms)), review_cues: boundaries.filter(x => x.review_cue).map(x => x.after_word) }));
}
fs.writeFileSync('review/sudais-corrected-qdc-word-clock-comparison-2026-09-30.json', JSON.stringify(report, null, 2) + '\n');
