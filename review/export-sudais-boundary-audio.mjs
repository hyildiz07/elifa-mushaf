// Review-only: export a short WAV around one QDC source boundary. No timing
// override is produced; this is a listening aid for two-sided inspection.
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { MPEGDecoder } from 'mpg123-decoder';
import { decodeWindow } from '../src/split-audio.mjs';

const [surahText, fromText, toText, output] = process.argv.slice(2);
const surah = Number(surahText), from = Number(fromText), to = Number(toText);
if (!Number.isInteger(surah) || surah < 1 || surah > 114 ||
    !Number.isFinite(from) || !Number.isFinite(to) || from < 0 || to <= from ||
    to - from > 10000 || !output?.startsWith('test-results/'))
  throw Error('Usage: node review/export-sudais-boundary-audio.mjs SURAH FROM_MS TO_MS test-results/out.wav (<=10 s)');
const sourcePath = `test-results/sudais-qdc-${surah}.mp3`;
const source = fs.readFileSync(sourcePath);
const sourceSha256 = crypto.createHash('sha256').update(source).digest('hex');
const pcm = await decodeWindow(new Blob([source]).stream(), from, to,
  {decoderFactory: () => new MPEGDecoder()});
const rate = 16000, frames = Math.floor((to - from) * rate / 1000);
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
  wav.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(sample * 32767))),
    44 + i * 2);
}
fs.mkdirSync(path.dirname(output), {recursive:true});
fs.writeFileSync(output, wav);
console.log(JSON.stringify({surah, from, to, sourceSha256, decodedFrom:pcm.off,
  wavSha256:crypto.createHash('sha256').update(wav).digest('hex'), bytes:wav.length, output}));
