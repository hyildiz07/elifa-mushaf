// Review-only inspection of the repeated phrase in Sudais 39:54.
// QUL metadata is not copied into the production app; its content license is
// still unconfirmed. The script deliberately does not create an override.
import fs from 'node:fs';
import { prepareWindow } from '../src/split-audio.mjs';

const api = 'https://qul.tarteel.ai/api/v1/audio/surah_segments/3?surah=39&from=54&to=54';
const response = await fetch(api);
if (!response.ok) throw new Error(`QUL response ${response.status}`);
const source = (await response.json()).segments['39:54'];
const qdc = JSON.parse(fs.readFileSync('test-results/timings/3-39.json', 'utf8'));
const verse = qdc.verse_timings.find(row => row.verse_key === '39:54');
const next = qdc.verse_timings.find(row => row.verse_key === '39:55');
const positions = source.segments.map(segment => segment[0]);
const expected = [1, 2, 3, 4, 5, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
if (JSON.stringify(positions) !== JSON.stringify(expected)) throw new Error('Spoken word order changed');
const firstRepeatedFive = source.segments[4];
const secondRepeatedFour = source.segments[5];
const secondRepeatedFive = source.segments[6];
const wordSix = source.segments[7];
const audio = {
  sourceUrl: qdc.audio_url, verifiedCbr: false,
  verseRanges: { 54: [verse.timestamp_from, verse.timestamp_to], 55: [next.timestamp_from, next.timestamp_to] },
  verseSegments: { 54: verse.segments },
};
const context = { createBuffer(channels, length, sampleRate) {
  const data = Array.from({ length: channels }, () => new Float32Array(length));
  return { numberOfChannels: channels, length, sampleRate, duration: length / sampleRate,
    copyToChannel(values, index) { data[index].set(values); }, getChannelData(index) { return data[index]; } };
} };
const pcm = await prepareWindow(audio, 54, context, { positions: [] });
function rms(fromMs, toMs) {
  const start = Math.max(0, Math.round((fromMs - pcm.off) * pcm.buffer.sampleRate / 1000));
  const end = Math.min(pcm.buffer.length, Math.round((toMs - pcm.off) * pcm.buffer.sampleRate / 1000));
  let sum = 0;
  for (let channel = 0; channel < pcm.buffer.numberOfChannels; channel++) {
    const samples = pcm.buffer.getChannelData(channel);
    for (let i = start; i < end; i++) sum += samples[i] * samples[i];
  }
  return Math.sqrt(sum / Math.max(1, (end - start) * pcm.buffer.numberOfChannels));
}
const bins = [];
for (let at = secondRepeatedFive[2] - 100; at <= wordSix[1] + 100; at += 10) {
  bins.push({ at_ms: at, rms: rms(at, at + 10) });
}
const between = bins.filter(row => row.at_ms >= secondRepeatedFive[2] && row.at_ms + 10 <= wordSix[1]);
const best = between.reduce((left, right) => left.rms <= right.rms ? left : right);
const nearby = bins.map(row => row.rms).sort((a, b) => a - b);
const median = nearby[Math.floor(nearby.length / 2)];
const proposal = {
  status: 'review-only-human-audition-and-license-review-required', verse: '39:54',
  qdc_audio_url: qdc.audio_url, qul_api: api,
  source_identity_evidence: 'QUL chapter and QuranCDN chapter: three separate 1-second windows correlate 0.9979, 0.9983, 0.9977 with 0ms offset (see review/sudais-eight-exceptions-audit.json).',
  spoken_positions: positions,
  repeated_phrase: { canonical_positions: [4, 5], first_word_five_end_ms: firstRepeatedFive[2], second_word_four_start_ms: secondRepeatedFour[1], second_word_five_end_ms: secondRepeatedFive[2] },
  proposed_cards: [
    { canonical_positions: [1, 5], spoken_positions: [1, 2, 3, 4, 5, 4, 5] },
    { canonical_positions: [6, 13], spoken_positions: [6, 7, 8, 9, 10, 11, 12, 13] },
  ],
  boundary_after_second_five: { left_end_ms: secondRepeatedFive[2], right_start_ms: wordSix[1], gap_ms: wordSix[1] - secondRepeatedFive[2], lowest_10ms_at_ms: best.at_ms, lowest_10ms_rms: best.rms, nearby_median_10ms_rms: median, low_to_median_ratio: best.rms / median },
  blockers: ['The proposed break has only a 50ms metadata interval; two-sided listening must confirm the complete repeated word and next word.', 'QUL timing and audio reuse rights have not been confirmed.'],
};
fs.writeFileSync('review/sudais-39-54-repeat-candidate.json', `${JSON.stringify(proposal, null, 2)}\n`);
console.log(JSON.stringify({ spoken_positions: positions, first_card: proposal.proposed_cards[0], second_card: proposal.proposed_cards[1], boundary: proposal.boundary_after_second_five }, null, 2));
