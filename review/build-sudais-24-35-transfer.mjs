// Review-only: transfer openly licensed per-ayah word times onto a verified
// identical chapter recording. This script does not modify production assets.
import fs from 'node:fs';
import { prepareWindow } from '../src/split-audio.mjs';

const qdc = JSON.parse(fs.readFileSync('test-results/timings/3-24.json', 'utf8'));
const source = JSON.parse(fs.readFileSync('test-results/quranlab-targets.json', 'utf8'))
  .find(row => row.rid === 3 && row.verse === '24:35');
const text = JSON.parse(fs.readFileSync('test-results/quran.json', 'utf8')).verses
  .find(row => row.verse_key === '24:35').text_uthmani;
const current = qdc.verse_timings.find(row => row.verse_key === '24:35');
const next = qdc.verse_timings.find(row => row.verse_key === '24:36');
const match = JSON.parse(fs.readFileSync('test-results/sudais-24-35-decile-match.json', 'utf8'));

const words = text.trim().split(/\s+/u).filter(word => !/^[ۖۗۚ۞]+$/u.test(word));
const windows = match.windows;
const matchedOffsets = windows.map(window => window.chapterMs - window.clipMs).sort((a, b) => a - b);
const chapterOffsetMs = matchedOffsets[Math.floor(matchedOffsets.length / 2)];
const assert = (condition, description) => { if (!condition) throw new Error(description); };
assert(words.length === 48 && source.segments.length === 48, 'Expected 48 canonical words and timing rows');
assert(source.segments.every((row, index) => row.word_position === index + 1 && row.word_start === index && row.word_end === index + 1), 'QuranLab position sequence is incomplete');
assert(windows.length === 10 && windows.every(window => window.corr >= 0.87), 'Insufficient independent audio-source correlation');
assert(Math.max(...matchedOffsets) - Math.min(...matchedOffsets) <= 20, 'Audio mapping drifts across verse');

const mapped = source.segments.map((row, index) => ({
  position: index + 1,
  word: words[index],
  from_ms: chapterOffsetMs + row.start_ms,
  to_ms: chapterOffsetMs + row.end_ms,
}));
assert(mapped.every((row, index) => row.from_ms < row.to_ms &&
  (index === 0 || mapped[index - 1].to_ms <= row.from_ms)), 'Mapped words overlap or reverse');
assert(mapped[0].from_ms >= current.timestamp_from && mapped.at(-1).to_ms < next.timestamp_from,
  'Mapped verse crosses the next verse');

// These breaks follow the canonical phrase structure; the intervals, not the
// midpoint cut itself, require final two-sided human listening before release.
const breakAfter = [4, 9, 16, 20, 25, 32, 35, 40, 44];
const cuts = breakAfter.map(position => ({
  after_word: position,
  left_word: words[position - 1],
  right_word: words[position],
  left_end_ms: mapped[position - 1].to_ms,
  right_start_ms: mapped[position].from_ms,
  gap_ms: mapped[position].from_ms - mapped[position - 1].to_ms,
  tentative_midpoint_ms: Math.round((mapped[position - 1].to_ms + mapped[position].from_ms) / 2),
  audition_status: 'pending',
}));
const context = { createBuffer(channels, length, sampleRate) {
  const data = Array.from({ length: channels }, () => new Float32Array(length));
  return { numberOfChannels: channels, length, sampleRate, duration: length / sampleRate,
    copyToChannel(values, index) { data[index].set(values); }, getChannelData(index) { return data[index]; } };
} };
const prepared = await prepareWindow({
  sourceUrl: qdc.audio_url, verifiedCbr: false,
  verseRanges: { 35: [current.timestamp_from, current.timestamp_to], 36: [next.timestamp_from, next.timestamp_to] },
  verseSegments: { 35: current.segments },
}, 35, context, { positions: [] });
function rms20ms(atMs) {
  const from = Math.max(0, Math.round((atMs - prepared.off) * prepared.buffer.sampleRate / 1000));
  const to = Math.min(prepared.buffer.length, Math.round((atMs + 20 - prepared.off) * prepared.buffer.sampleRate / 1000));
  let maximum = 0;
  for (let channel = 0; channel < prepared.buffer.numberOfChannels; channel++) {
    let sum = 0;
    const samples = prepared.buffer.getChannelData(channel);
    for (let i = from; i < to; i++) sum += samples[i] * samples[i];
    maximum = Math.max(maximum, Math.sqrt(sum / Math.max(1, to - from)));
  }
  return maximum;
}
for (const cut of cuts) {
  const center = cut.tentative_midpoint_ms;
  const middle = Array.from({ length: 4 }, (_, index) => rms20ms(center - 40 + index * 20));
  const speech = [];
  for (let at = cut.left_end_ms - 500; at < cut.left_end_ms - 100; at += 20) speech.push(rms20ms(at));
  for (let at = cut.right_start_ms + 100; at < cut.right_start_ms + 500; at += 20) speech.push(rms20ms(at));
  speech.sort((a, b) => a - b);
  const median = speech[Math.floor(speech.length / 2)];
  const middleRms = middle.reduce((sum, value) => sum + value, 0) / middle.length;
  Object.assign(cut, {
    pcm_middle_80ms_rms_max_channel: +middleRms.toFixed(6),
    pcm_nearby_speech_median_20ms_rms_max_channel: +median.toFixed(6),
    pcm_middle_to_speech_ratio: +(middleRms / median).toFixed(3),
  });
}
const parts = [];
let start = 1;
for (const end of [...breakAfter, words.length]) {
  parts.push({ first_word: start, last_word: end, word_count: end - start + 1 });
  start = end + 1;
}
assert(parts.every(part => part.word_count <= 8), 'Part exceeds eight words');
assert(cuts.every(cut => cut.gap_ms >= 100), 'No positive candidate word gap');

const proposal = {
  status: 'review-only-human-audition-required',
  verse: '24:35',
  chapter_audio_url: qdc.audio_url,
  timing_audio_url: source.source,
  timing_credit: 'QuranLab, quranlab/quran-audio, CC BY 4.0',
  timing_license_url: 'https://huggingface.co/datasets/quranlab/quran-audio',
  source_identity: { evidence: 'ten-independent-high-energy-pcm-windows', window_correlations: windows.map(w => w.corr), chapter_offset_ms: chapterOffsetMs, offset_spread_ms: Math.max(...matchedOffsets) - Math.min(...matchedOffsets) },
  current_qdc_range_ms: [current.timestamp_from, current.timestamp_to],
  next_qdc_start_ms: next.timestamp_from,
  mapped_words: mapped,
  candidate_parts: parts,
  candidate_cuts: cuts,
  blockers: ['Word-boundary alignment is machine-generated and needs two-sided audition at every cut.', 'The QuranCDN recording and per-ayah recording are the same performance, but audio licensing must be assessed separately from CC BY timing.'],
};
fs.writeFileSync('review/sudais-24-35-transfer-candidate.json', `${JSON.stringify(proposal, null, 2)}\n`);
console.log(JSON.stringify({ offset_ms: chapterOffsetMs, spread_ms: proposal.source_identity.offset_spread_ms, canonical_words: words.length, parts: parts.map(part => part.word_count), cut_gaps_ms: cuts.map(cut => cut.gap_ms), cut_pcm_middle_to_speech_ratios: cuts.map(cut => cut.pcm_middle_to_speech_ratio), mapped_last_word_end_ms: mapped.at(-1).to_ms, next_verse_start_ms: next.timestamp_from }, null, 2));
