// Offline acoustic inspection only. A periodic tail is not proof that a final
// phoneme is complete; this deliberately cannot approve production audio.
import fs from 'node:fs';

const directory = 'test-results/review-sudais-full-verses';
const existing = JSON.parse(fs.readFileSync('review/sudais-full-verse-candidates.json', 'utf8'));
function wav(path) {
  const bytes = fs.readFileSync(path);
  if (bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WAVE') throw new Error(`Invalid WAV: ${path}`);
  const sampleRate = bytes.readUInt32LE(24), channels = bytes.readUInt16LE(22), bits = bytes.readUInt16LE(34);
  if (bits !== 16) throw new Error(`Expected PCM16: ${path}`);
  const dataStart = bytes.indexOf(Buffer.from('data')) + 8;
  const frames = (bytes.length - dataStart) / (channels * 2);
  const firstChannel = new Float32Array(frames);
  for (let i = 0; i < frames; i++) firstChannel[i] = bytes.readInt16LE(dataStart + i * channels * 2) / 32768;
  return { sampleRate, firstChannel };
}
function windowStats(audio, fromMs, lengthMs = 40) {
  const { sampleRate: rate, firstChannel: samples } = audio;
  const start = Math.round(fromMs * rate / 1000), end = Math.min(samples.length, Math.round((fromMs + lengthMs) * rate / 1000));
  let power = 0;
  for (let i = start; i < end; i++) power += samples[i] ** 2;
  let best = { correlation: -Infinity, lag: 0 };
  for (let lag = Math.round(rate / 350); lag <= Math.round(rate / 70); lag++) {
    let xy = 0, xx = 0, yy = 0;
    for (let i = start + lag; i < end; i++) {
      xy += samples[i] * samples[i - lag];
      xx += samples[i] ** 2; yy += samples[i - lag] ** 2;
    }
    const correlation = xy / Math.sqrt(xx * yy || 1);
    if (correlation > best.correlation) best = { correlation, lag };
  }
  return { from_tail_ms: fromMs, rms: +(Math.sqrt(power / (end - start))).toFixed(5),
    periodicity: +(best.correlation).toFixed(3), pitch_hz: Math.round(rate / best.lag) };
}
const cases = {};
for (const [key, prefix] of [['3:160', '3-160'], ['4:143', '4-143']]) {
  const comparison = {};
  for (const kbps of [64, 192]) {
    const file = `${directory}/${prefix}-${kbps}-tail-1p5s.wav`;
    const audio = wav(file);
    const windows = [];
    for (let at = 1020; at <= 1460; at += 40) windows.push(windowStats(audio, at));
    comparison[kbps] = { file, sample_rate: audio.sampleRate, last_500ms_40ms_windows: windows,
      final_window: windows.at(-1) };
  }
  cases[key] = {
    status: 'blocked-final-phoneme-completeness-unproven',
    recording_64: existing.rows[key].audio_url.replace('_192kbps/', '_64kbps/'),
    recording_192: existing.rows[key].audio_url,
    quranlab_64_word_end_ms: existing.rows[key].quranlab_64kbps_last_word_end_ms,
    independent_64_to_192_correlations: existing.rows[key].pcm_64_to_192_correlation,
    next_verse_head_max_correlation: existing.rows[key].next_verse_head_max_correlation,
    recordings: comparison,
    interpretation: 'The end remains periodic voiced audio; amplitude falls on 3:160 but remains substantial on 4:143. These measurements cannot distinguish a naturally finished phoneme with reverberation from a clipped final vowel. Human two-sided auditory review is required.',
  };
}
const output = {
  status: 'review-only-no-production-asset',
  method: 'First-channel 40ms normalized autocorrelation across 70–350 Hz and PCM RMS on locally exported 64/192 kbps last-1.5s WAVs.',
  qud_source_catalog: 'Qur’anic Universal Audio v3.2.0 public catalog: no Sudais recording; no same-take timing alternative found.',
  cases,
};
fs.writeFileSync('review/sudais-two-verse-tail-analysis.json', `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify(Object.fromEntries(Object.entries(cases).map(([key, value]) => [key, {
  final_64: value.recordings[64].final_window, final_192: value.recordings[192].final_window,
}])), null, 2));
