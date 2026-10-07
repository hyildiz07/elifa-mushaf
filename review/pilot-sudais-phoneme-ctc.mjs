// Research-only 16 kHz WAV exports from the exact QDC windows.
import fs from 'node:fs';
import crypto from 'node:crypto';
import { MPEGDecoder } from 'mpg123-decoder';
import { decodeWindow } from '../src/split-audio.mjs';

for (const { surah, verse, from, to } of [
  { surah: 28, verse: 44, from: 651500, to: 666000 },
  { surah: 5, verse: 111, from: 2494000, to: 2514000 },
]) {
  const source = fs.readFileSync(`test-results/sudais-qdc-${surah}.mp3`);
  const pcm = await decodeWindow(new Blob([source]).stream(), from, to,
    { decoderFactory: () => new MPEGDecoder() });
  const rate = 16000;
  const frames = Math.floor((to - from) * rate / 1000);
  const wav = Buffer.alloc(44 + frames * 2);
  wav.write('RIFF', 0); wav.writeUInt32LE(wav.length - 8, 4);
  wav.write('WAVEfmt ', 8); wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(rate, 24); wav.writeUInt32LE(rate * 2, 28);
  wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34);
  wav.write('data', 36); wav.writeUInt32LE(frames * 2, 40);
  for (let i = 0; i < frames; i++) {
    const sourceIndex = Math.min(pcm.channelData[0].length - 1,
      Math.max(0, Math.round(((from - pcm.off) / 1000 + i / rate) * pcm.sampleRate)));
    let sample = 0;
    for (const channel of pcm.channelData) sample += channel[sourceIndex] || 0;
    sample /= pcm.channelData.length;
    wav.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(sample * 32767))), 44 + i * 2);
  }
  const out = `test-results/review-phoneme/${surah}-${verse}-${from}-${to}.wav`;
  fs.writeFileSync(out, wav);
  console.log(JSON.stringify({ verse: `${surah}:${verse}`, from, to,
    sourceSha256: crypto.createHash('sha256').update(source).digest('hex'),
    wavSha256: crypto.createHash('sha256').update(wav).digest('hex'), output: out }));
}
