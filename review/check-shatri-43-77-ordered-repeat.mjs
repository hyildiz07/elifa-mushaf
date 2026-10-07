// Review-only source identity and repetition check for one of 74 candidates.
// The QUA timing is CC BY 4.0; external audio reuse is a separate question.
import fs from 'node:fs';
import zlib from 'node:zlib';
import { prepareWindow } from '../src/split-audio.mjs';

const key = '43:77', ay = 77;
const qdc = JSON.parse(fs.readFileSync('test-results/timings/4-43.json', 'utf8'));
const qdcVerse = qdc.verse_timings.find(row => row.verse_key === key);
const qdcNext = qdc.verse_timings.find(row => row.verse_key === '43:78');
const qua = JSON.parse(zlib.gunzipSync(fs.readFileSync('test-results/qua-shatri/word_timestamps.json.gz')));
const quaRows = qua.rows.filter(row => row[0] === key);
const source = JSON.parse(fs.readFileSync('test-results/qua-source-catalog.json', 'utf8')).recitations
  .find(row => row.audio?.chapter_urls?.['43']?.includes('abuBakrAlShatri'));
if (quaRows.length !== 2 || !source) throw new Error('Missing QUA 43:77 data');
const production = JSON.parse(fs.readFileSync('assets/verified-audio/4-43.json', 'utf8'));
const productionVerse = production.verse_timings.find(row => row.verse_key === key);
const productionNext = production.verse_timings.find(row => row.verse_key === '43:78');
if (production.audio_url !== source.audio.chapter_urls['43'] ||
  production.source_recording !== 'abu_bakr_al_shatri_tarteel' ||
  !productionVerse || !productionNext ||
  JSON.stringify(productionVerse.segments) !== JSON.stringify(quaRows[0][5])) {
  throw new Error('Production MP3 or existing first-take timing differs from QUA source');
}
const context = { createBuffer(channels, length, sampleRate) {
  const data = Array.from({ length: channels }, () => new Float32Array(length));
  return { numberOfChannels: channels, length, sampleRate, duration: length / sampleRate,
    copyToChannel(values, index) { data[index].set(values); }, getChannelData(index) { return data[index]; } };
} };
const qdcAudio = { sourceUrl: qdc.audio_url, verifiedCbr: false,
  verseRanges: { [ay]: [qdcVerse.timestamp_from, Math.max(qdcVerse.timestamp_to, ...qdcVerse.segments.map(segment => segment[2]))],
    [ay + 1]: [qdcNext.timestamp_from, qdcNext.timestamp_to] }, verseSegments: { [ay]: qdcVerse.segments } };
const quaAudio = { sourceUrl: source.audio.chapter_urls['43'], verifiedCbr: false,
  verseRanges: { [ay]: [quaRows[0][1], quaRows.at(-1)[2]], [ay + 1]: [quaRows.at(-1)[2] + 100, quaRows.at(-1)[2] + 1000] },
  verseSegments: { [ay]: quaRows.flatMap(row => row[5]) } };
const [left, right] = await Promise.all([
  prepareWindow(qdcAudio, ay, context, { positions: [] }),
  prepareWindow(quaAudio, ay, context, { positions: [] }),
]);
function mono1k(window) {
  const samples = window.buffer.getChannelData(0), ratio = window.buffer.sampleRate / 1000;
  const output = new Float32Array(Math.floor(samples.length / ratio));
  for (let i = 0; i < output.length; i++) {
    const from = Math.floor(i * ratio), to = Math.max(from + 1, Math.floor((i + 1) * ratio));
    let sum = 0; for (let j = from; j < to; j++) sum += samples[j];
    output[i] = sum / (to - from);
  }
  return output;
}
const x = mono1k(left), y = mono1k(right);
function correlation(at, shift, length = 1000) {
  let xy = 0, xx = 0, yy = 0;
  for (let i = 0; i < length; i += 4) {
    const a = x[at + i + shift], b = y[at + i];
    if (a === undefined || b === undefined) return -Infinity;
    xy += a * b; xx += a * a; yy += b * b;
  }
  return xy / Math.sqrt(xx * yy || 1);
}
const positions = [875000, 880000, 886000, 891000, 901000, 908000];
const local = positions.map(ms => Math.round(ms - right.off));
let best = { shift: null, mean: -Infinity, correlations: [] };
for (let shift = -500; shift <= 500; shift++) {
  const correlations = local.map(at => correlation(at, shift));
  const mean = correlations.reduce((sum, value) => sum + value, 0) / correlations.length;
  if (mean > best.mean) best = { shift, mean, correlations };
}
const qdcSequence = qdcVerse.segments.map(row => row[0]);
const quaSequence = quaRows.flatMap(row => row[5].map(segment => segment[0]));
function maxChannelRms(fromMs, toMs) {
  const sampleRate = left.buffer.sampleRate;
  const start = Math.max(0, Math.round((fromMs - left.off) * sampleRate / 1000));
  const end = Math.min(left.buffer.length, Math.round((toMs - left.off) * sampleRate / 1000));
  let maximum = 0;
  for (let channel = 0; channel < left.buffer.numberOfChannels; channel++) {
    const samples = left.buffer.getChannelData(channel);
    let power = 0;
    for (let i = start; i < end; i++) power += samples[i] ** 2;
    maximum = Math.max(maximum, Math.sqrt(power / Math.max(1, end - start)));
  }
  return maximum;
}
const takes = quaRows.flatMap(row => {
  const segments = row[5], starts = [];
  for (let index = 0; index < segments.length; index++) if (segments[index][0] === 1) starts.push(index);
  return starts.map((index, take) => ({
    take: take + 1, segments: segments.slice(index, starts[take + 1] ?? segments.length),
  }));
}).map((row, index) => ({ ...row, take: index + 1 }));
const afterFive = takes.map(({ take, segments }) => {
  const leftEnd = segments.find(segment => segment[0] === 5)[2];
  const rightStart = segments.find(segment => segment[0] === 6)[1];
  const middleAt = Math.round((leftEnd + rightStart) / 2);
  const middleRms = maxChannelRms(middleAt - 40, middleAt + 40);
  const nearby = [];
  for (let at = leftEnd - 400; at < leftEnd - 100; at += 20) nearby.push(maxChannelRms(at, at + 20));
  for (let at = rightStart + 100; at < rightStart + 400; at += 20) nearby.push(maxChannelRms(at, at + 20));
  nearby.sort((a, b) => a - b);
  const median = nearby[Math.floor(nearby.length / 2)];
  return { take, after_word: 5, left_end_ms: leftEnd, right_start_ms: rightStart,
    gap_ms: rightStart - leftEnd, candidate_cut_ms: middleAt,
    middle_80ms_rms_max_channel: +middleRms.toFixed(6),
    nearby_speech_median_20ms_rms_max_channel: +median.toFixed(6),
    middle_to_speech_ratio: +(middleRms / median).toFixed(3), audition_status: 'pending' };
});
const finalWords = takes.map(({ take, segments }) => {
  const final = segments.at(-1);
  if (final[0] !== 8) throw new Error(`Take ${take} has no final word`);
  return { take, word: 8, from_ms: final[1], to_ms: final[2],
    final_500ms_rms_max_channel: +maxChannelRms(Math.max(final[1], final[2] - 500), final[2]).toFixed(6) };
});
const candidateAudioRanges = {
  words_1_to_5: takes.map(({ segments }, index) => ({
    from_ms: index === 0 ? productionVerse.timestamp_from : segments[0][1],
    to_ms: segments.find(segment => segment[0] === 5)[2],
  })),
  words_6_to_8: takes.map(({ segments }, index) => ({
    from_ms: segments.find(segment => segment[0] === 6)[1],
    to_ms: index === takes.length - 1 ? quaRows.at(-1)[2] : segments.at(-1)[2],
  })),
};
if (takes.length !== 3 || takes.some(row => row.segments.length !== 8) ||
  afterFive.some(row => row.gap_ms < 400 || row.middle_to_speech_ratio >= 0.1) ||
  finalWords.some(row => row.final_500ms_rms_max_channel < 0.005) ||
  candidateAudioRanges.words_6_to_8.at(-1).to_ms > qdcNext.timestamp_from ||
  takes.at(-1).segments.at(-1)[2] >= productionNext.timestamp_from) {
  throw new Error('Three-take split candidate fails structural/acoustic review threshold');
}
const audioReviewDir = 'test-results/review-shatri-43-77';
fs.mkdirSync(audioReviewDir, { recursive: true });
function writePcmWav(path, fromMs, toMs) {
  const sampleRate = left.buffer.sampleRate, channels = left.buffer.numberOfChannels;
  const from = Math.max(0, Math.round((fromMs - left.off) * sampleRate / 1000));
  const to = Math.min(left.buffer.length, Math.round((toMs - left.off) * sampleRate / 1000));
  const frames = to - from, bytes = Buffer.alloc(44 + frames * channels * 2);
  bytes.write('RIFF', 0); bytes.writeUInt32LE(bytes.length - 8, 4); bytes.write('WAVEfmt ', 8);
  bytes.writeUInt32LE(16, 16); bytes.writeUInt16LE(1, 20); bytes.writeUInt16LE(channels, 22);
  bytes.writeUInt32LE(sampleRate, 24); bytes.writeUInt32LE(sampleRate * channels * 2, 28);
  bytes.writeUInt16LE(channels * 2, 32); bytes.writeUInt16LE(16, 34);
  bytes.write('data', 36); bytes.writeUInt32LE(frames * channels * 2, 40);
  for (let i = 0; i < frames; i++) for (let channel = 0; channel < channels; channel++) {
    const value = left.buffer.getChannelData(channel)[from + i];
    bytes.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(value * 32767))),
      44 + (i * channels + channel) * 2);
  }
  fs.writeFileSync(path, bytes);
  return { file: path, from_ms: fromMs, to_ms: toMs };
}
const reviewAudio = afterFive.map(row => writePcmWav(
  `${audioReviewDir}/take-${row.take}-word-5-6-context.wav`,
  row.candidate_cut_ms - 1500, row.candidate_cut_ms + 1500));
reviewAudio.push(writePcmWav(`${audioReviewDir}/middle-full-take.wav`,
  takes[1].segments[0][1] - 200, takes[1].segments.at(-1)[2] + 200));
const output = {
  status: 'review-only-do-not-enable-repeated-playback', key, qdc_url: qdc.audio_url,
  qua_url: quaAudio.sourceUrl, qua_release: 'https://github.com/QUD-Technologies/quranic-universal-audio/releases/tag/v3.2.0',
  production_url: production.audio_url,
  production_source_matches_qua_url: production.audio_url === quaAudio.sourceUrl,
  production_existing_range_ms: [productionVerse.timestamp_from, productionVerse.timestamp_to],
  production_next_verse_start_ms: productionNext.timestamp_from,
  qdc_window_start_ms: left.off, qua_window_start_ms: right.off,
  independent_window_chapter_ms: positions,
  best_pcm_match: { shift_ms: best.shift, chapter_offset_ms: left.off - right.off + best.shift,
    mean_correlation: +best.mean.toFixed(4), correlations: best.correlations.map(value => +value.toFixed(4)) },
  qdc_spoken_positions: qdcSequence, qua_spoken_positions: quaSequence,
  candidate_full_three_take_segments_review_only: quaRows.flatMap(row => row[5]),
  qdc_verse_range_ms: [qdcVerse.timestamp_from, qdcVerse.timestamp_to],
  qdc_next_verse_start_ms: qdcNext.timestamp_from,
  qua_occurrences: quaRows.map(row => ({ from_ms: row[1], to_ms: row[2], words: row[5].length })),
  candidate_parts: [{ canonical_positions: [1, 5], spoken_takes: 3 },
    { canonical_positions: [6, 8], spoken_takes: 3 }],
  candidate_audio_ranges_review_only: candidateAudioRanges,
  candidate_after_word_five: afterFive,
  candidate_final_words: finalWords,
  review_audio: reviewAudio,
  blocker: 'The production MP3 URL equals the QUA URL, but its asset contains only the first take. Human listening must confirm the middle and last recitations and all three word-5/word-6 acoustic joins before enabling a production split.',
};
fs.writeFileSync('review/shatri-43-77-ordered-repeat.json', `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify({ match: output.best_pcm_match, qdc: qdcSequence, qua: quaSequence,
  occurrences: output.qua_occurrences, afterFive, finalWords,
  productionSourceMatchesQuaUrl: output.production_source_matches_qua_url,
  productionNextVerseStartMs: output.production_next_verse_start_ms }, null, 2));
