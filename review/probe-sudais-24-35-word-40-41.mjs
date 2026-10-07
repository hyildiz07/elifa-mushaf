// Two-sided PCM review for the only missing 24:35 <8-word split boundary.
import fs from 'node:fs';
import { prepareWindow } from '../src/split-audio.mjs';

const qdc = JSON.parse(fs.readFileSync('test-results/timings/3-24.json', 'utf8'));
const verse = qdc.verse_timings.find(row => row.verse_key === '24:35');
const next = qdc.verse_timings.find(row => row.verse_key === '24:36');
const row = JSON.parse(fs.readFileSync('assets/audio-timing-overrides-r3-r5.json', 'utf8')).rows['3:24:35'];
const [,, leftEnd] = row.segments.find(segment => segment[0] === 40);
const [, rightStart] = row.segments.find(segment => segment[0] === 41);
const context = { createBuffer(channels, length, sampleRate) {
  const data = Array.from({ length: channels }, () => new Float32Array(length));
  return { numberOfChannels: channels, length, sampleRate, duration: length / sampleRate,
    copyToChannel(values, index) { data[index].set(values); }, getChannelData(index) { return data[index]; } };
} };
const prepared = await prepareWindow({ sourceUrl: qdc.audio_url, verifiedCbr: false,
  verseRanges: { 35: [verse.timestamp_from, verse.timestamp_to], 36: [next.timestamp_from, next.timestamp_to] },
  verseSegments: { 35: row.segments } }, 35, context, { positions: [] });
function rms(fromMs, toMs) {
  const rate = prepared.buffer.sampleRate;
  const from = Math.max(0, Math.round((fromMs - prepared.off) * rate / 1000));
  const to = Math.min(prepared.buffer.length, Math.round((toMs - prepared.off) * rate / 1000));
  let max = 0;
  for (let channel = 0; channel < prepared.buffer.numberOfChannels; channel++) {
    const samples = prepared.buffer.getChannelData(channel); let power = 0;
    for (let i = from; i < to; i++) power += samples[i] ** 2;
    max = Math.max(max, Math.sqrt(power / Math.max(1, to - from)));
  }
  return max;
}
const speech = [];
for (let at = leftEnd - 1000; at < leftEnd - 200; at += 20) speech.push(rms(at, at + 20));
for (let at = rightStart + 200; at < rightStart + 1000; at += 20) speech.push(rms(at, at + 20));
speech.sort((a, b) => a - b);
const median = speech[Math.floor(speech.length / 2)];
const profile = [];
for (let at = leftEnd - 150; at <= rightStart + 150; at += 10) {
  const value = rms(at, at + 10);
  profile.push({ from_ms: at, rms: +value.toFixed(6), ratio: +(value / median).toFixed(3) });
}
const cutCandidates = [];
for (let at = leftEnd + 40; at <= rightStart - 120; at += 10) {
  const middle80 = rms(at, at + 80);
  cutCandidates.push({ center_ms: at + 40, middle_80ms_rms: middle80,
    ratio: middle80 / median });
}
cutCandidates.sort((a, b) => a.ratio - b.ratio);
const result = { status: 'review-only-no-production-cut', verse: '24:35', after_word: 40,
  left_word: 'يَشَآءُ', right_word: 'وَيَضْرِبُ',
  source_url: qdc.audio_url, qa_source: 'https://everyayah.com/data/Abdurrahmaan_As-Sudais_64kbps/024035.mp3',
  same_performance_evidence: 'review/sudais-24-35-transfer-candidate.json: ten PCM windows, 0.875–0.944 correlation and 13ms alignment spread',
  source_word_gap_ms: [leftEnd, rightStart], gap_duration_ms: rightStart - leftEnd,
  nearby_speech_median_rms: +median.toFixed(6),
  best_80ms: { center_ms: cutCandidates[0].center_ms,
    rms: +cutCandidates[0].middle_80ms_rms.toFixed(6), ratio: +cutCandidates[0].ratio.toFixed(3) },
  profile,
};
fs.writeFileSync('review/sudais-24-35-word-40-41-pcm.json', `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ gap: result.source_word_gap_ms, median: result.nearby_speech_median_rms,
  best: result.best_80ms, status: result.status }, null, 2));
