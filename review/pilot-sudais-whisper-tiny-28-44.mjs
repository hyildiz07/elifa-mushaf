// Review only: independent verse-identity probe. Whisper timestamps are not cut evidence.
import fs from 'node:fs';
import crypto from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { MPEGDecoder } from 'mpg123-decoder';
import { decodeWindow } from '../src/split-audio.mjs';
import { pipeline, env } from '../test-results/independent-asr/node_modules/@huggingface/transformers/dist/transformers.node.mjs';

env.cacheDir = 'test-results/independent-asr/model-cache';
env.allowRemoteModels = true;
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const sourceFile = 'test-results/sudais-qdc-28.mp3';
const source = fs.readFileSync(sourceFile);
const sourceSha256 = sha256(source);
if (sourceSha256 !== 'f8e5291cf10a3a29230fd443b5ddabc4297cf5b16c70250dda3bfe6314917576')
  throw Error(`Unexpected source SHA-256 ${sourceSha256}`);
const windows = [
  { name: 'old-provider-meta', from: 643040, to: 652390 },
  { name: 'corrected-target-and-neighbors', from: 651500, to: 666000 },
  { name: 'target-only-candidate', from: 653640, to: 663500 },
];
const modelId = 'Xenova/whisper-tiny';
const initStart = performance.now();
const transcriber = await pipeline('automatic-speech-recognition', modelId, { device: 'cpu', dtype: 'q8' });
const initSeconds = (performance.now() - initStart) / 1000;

const results = [];
for (const window of windows) {
  const pcm = await decodeWindow(new Blob([source]).stream(), window.from, window.to,
    { decoderFactory: () => new MPEGDecoder() });
  const rate = 16000, frames = Math.floor((window.to-window.from) * rate / 1000);
  const audio = new Float32Array(frames);
  for (let i=0; i<frames; i++) {
    const index = Math.min(pcm.channelData[0].length - 1,
      Math.max(0, Math.round(((window.from-pcm.off)/1000+i/rate)*pcm.sampleRate)));
    for (const channel of pcm.channelData) audio[i] += (channel[index] || 0)/pcm.channelData.length;
  }
  const started = performance.now();
  const output = await transcriber(audio, { language: 'arabic', task: 'transcribe', return_timestamps: false });
  results.push({ ...window, decodedFromMs: pcm.off, sampleRate: rate, audioSha256: sha256(Buffer.from(audio.buffer)),
    seconds: +(performance.now()-started).toFixed(0)/1000, text: output.text });
  console.log(JSON.stringify(results.at(-1)));
}
const result = {
  status: 'review-only-identity-probe-no-cut-approval', modelId, dtype: 'q8', sourceFile, sourceSha256,
  initSeconds: +initSeconds.toFixed(3), language: 'arabic', task: 'transcribe', results,
};
fs.writeFileSync('review/sudais-whisper-tiny-28-44-pilot.json', JSON.stringify(result,null,2)+'\n');
