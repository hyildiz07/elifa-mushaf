// Review only. Recheck the source-matched QUL candidate, not the stale provider window.
import fs from 'node:fs';
import crypto from 'node:crypto';
import { decodeWindow } from '../src/split-audio.mjs';

const sourcePath = 'test-results/sudais-qdc-28.mp3';
const outputPath = 'review/sudais-28-44-corrected-window-align.json';
const expectedSourceSha256 = 'f8e5291cf10a3a29230fd443b5ddabc4297cf5b16c70250dda3bfe6314917576';
const requested = [651500, 666000];
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const source = fs.readFileSync(sourcePath);
if (sha256(source) !== expectedSourceSha256) throw Error('QDC source identity changed');
const pcm = await decodeWindow(new Blob([source]).stream(), ...requested);
const samples = pcm.channelData[0], rate = pcm.sampleRate;
const wav = Buffer.alloc(44 + samples.length * 2);
wav.write('RIFF', 0); wav.writeUInt32LE(wav.length - 8, 4);
wav.write('WAVEfmt ', 8); wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(rate, 24); wav.writeUInt32LE(rate * 2, 28);
wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34);
wav.write('data', 36); wav.writeUInt32LE(samples.length * 2, 40);
for (let i = 0; i < samples.length; i++) {
  wav.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(samples[i] * 32767))), 44 + 2 * i);
}
const report = {
  status: 'review-only-no-cut-approval',
  source_file: sourcePath,
  source_sha256: sha256(source),
  source_url: 'https://download.quranicaudio.com/qdc/abdurrahmaan_as_sudais/murattal/28.mp3',
  requested_window_ms: requested,
  decoded_window_ms: [pcm.off, pcm.off + samples.length / rate * 1000],
  sample_rate: rate,
  wav_sha256: sha256(wav),
  qul_source_matched_candidate_ms: { '28:43': [635492, 653440], '28:44': [653640, 663092], '28:45': [663292, 682853] },
  provider_meta_ms: { '28:43': [625690, 643040], '28:44': [643040, 652390], '28:45': [652390, 671720] },
  models: {},
};
for (const model of ['Base', 'Large']) {
  const form = new FormData();
  form.set('audio', new Blob([wav], { type: 'audio/wav' }), 'sudais-28-44-corrected.wav');
  form.set('model_name', model); form.set('riwayah', 'hafs'); form.set('device', 'GPU');
  const response = await fetch('https://hetchyy-quranic-universal-aligner.hf.space/api/v1/align/audio',
    { method: 'POST', body: form, signal: AbortSignal.timeout(240000) });
  const body = await response.json();
  report.models[model] = {
    http_status: response.status,
    audio_id: body.audio_id ?? null,
    meta: body._meta ?? null,
    error: body.error ?? null,
    segments: (body.segments ?? []).map(s => ({
      ref_from: s.ref_from, ref_to: s.ref_to,
      source_from_ms: Math.round(pcm.off + s.time_from * 1000),
      source_to_ms: Math.round(pcm.off + s.time_to * 1000),
      confidence: s.confidence,
      has_missing_words: s.has_missing_words,
      has_repeated_words: s.has_repeated_words,
      matched_text: s.matched_text,
      error: s.error,
    })),
  };
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ model, status: response.status, segments: report.models[model].segments }));
  if (!response.ok) throw Error(`${model} HTTP ${response.status}: ${JSON.stringify(body).slice(0, 400)}`);
}
