// Research-only independent word check of the first per-ayah clip.
import fs from 'node:fs';
import {decodeWindow} from '../src/split-audio.mjs';
const key = '3:160';
const meta = await (await fetch('https://qul.tarteel.ai/api/v1/audio/ayah_segments/16?surah=3&from=160&to=160')).json();
const clip = meta.segments[key];
const bytes = Buffer.from(await (await fetch(clip.audio_url)).arrayBuffer());
const p = await decodeWindow(new Blob([bytes]).stream(), 0, clip.segments.at(-1)[3], {maxMissingMs: 1000});
const sampleRate = 22050, step = p.sampleRate / sampleRate, src = p.channelData[0], n = Math.floor(src.length / step);
const wav = Buffer.alloc(44 + n * 2);
wav.write('RIFF', 0); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8);
wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(sampleRate, 24); wav.writeUInt32LE(sampleRate * 2, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34);
wav.write('data', 36); wav.writeUInt32LE(n * 2, 40);
for (let i = 0; i < n; i++) {
  const a = Math.floor(i * step), b = Math.min(src.length - 1, Math.floor((i + 1) * step));
  wav.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round((src[a] + src[b]) / 2 * 32767))), 44 + i * 2);
}
const form = new FormData();
form.set('audio', new Blob([wav], {type: 'audio/wav'}), 'sudais-qul-ayah-3-160.wav');
form.set('model_name', 'Base'); form.set('riwayah', 'hafs');
const response = await fetch('https://hetchyy-quranic-universal-aligner.hf.space/api/v1/align/audio', {method: 'POST', body: form, signal: AbortSignal.timeout(180000)});
const result = await response.json();
const report = {key, clipUrl: clip.audio_url, clipBytes: bytes.length, providedFirstSegment: clip.segments[0], responseStatus: response.status, result};
fs.writeFileSync('review/sudais-qul-ayah-3-160-asr.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({responseStatus: response.status, firstSegments: result.segments?.slice(0, 8), firstWords: result.words?.slice(0, 8)}));
