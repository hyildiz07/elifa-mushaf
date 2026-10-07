// Review-only independent verse-identity probe; no cut timings are inferred.
import fs from 'node:fs';
import crypto from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { MPEGDecoder } from 'mpg123-decoder';
import { decodeWindow } from '../src/split-audio.mjs';
import { pipeline, env } from '../test-results/independent-asr/node_modules/@huggingface/transformers/dist/transformers.node.mjs';

env.cacheDir = 'test-results/independent-asr/model-cache';
env.allowRemoteModels = false;
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const sources = {
  5: {file: 'test-results/sudais-qdc-5.mp3', sha256: '16fad03b000d69492da95e9f970f220ae097a6693815917924b43f1730ae8cdb'},
  29: {file: 'test-results/sudais-qdc-29.mp3', sha256: '525bcfbaaa6fbeece6c93e0e25d7d36393aaddd406366284ded5bd141107af67'},
};
const windows = [
  {surah: 5, name: '5-111-old-meta', from: 2475690, to: 2489460},
  {surah: 5, name: '5-111-corrected-target', from: 2496497, to: 2511277},
  {surah: 5, name: '5-111-corrected-neighbors', from: 2494000, to: 2514000},
  {surah: 29, name: '29-45-old-meta-first', from: 576920, to: 589000},
  {surah: 29, name: '29-45-old-meta-last', from: 587000, to: 599200},
  {surah: 29, name: '29-45-corrected-first', from: 598400, to: 612500},
  {surah: 29, name: '29-45-corrected-last', from: 610500, to: 625500},
  {surah: 29, name: '29-45-corrected-middle-short', from: 610500, to: 617000},
  {surah: 29, name: '29-45-corrected-end-short', from: 616500, to: 623500},
  {surah: 29, name: '29-46-old-meta-first', from: 599200, to: 612000},
  {surah: 29, name: '29-46-old-meta-last', from: 610000, to: 621670},
  {surah: 29, name: '29-46-adjacent-probe-first', from: 622000, to: 638000},
  {surah: 29, name: '29-46-adjacent-probe-last', from: 636000, to: 652000},
];
const buffers = Object.fromEntries(Object.entries(sources).map(([key, source]) => {
  const bytes = fs.readFileSync(source.file);
  if (sha256(bytes) !== source.sha256) throw Error(`Unexpected source hash ${source.file}`);
  return [key, bytes];
}));
const modelId = 'Xenova/whisper-tiny';
const initStart = performance.now();
const transcriber = await pipeline('automatic-speech-recognition', modelId, {device: 'cpu', dtype: 'q8'});
const initSeconds = (performance.now()-initStart)/1000;
const results = [];
for (const window of windows) {
  const pcm = await decodeWindow(new Blob([buffers[window.surah]]).stream(), window.from, window.to,
    {decoderFactory: () => new MPEGDecoder()});
  const rate = 16000, frames = Math.floor((window.to-window.from)*rate/1000);
  const audio = new Float32Array(frames);
  for (let i=0; i<frames; i++) {
    const index = Math.min(pcm.channelData[0].length-1,
      Math.max(0, Math.round(((window.from-pcm.off)/1000+i/rate)*pcm.sampleRate)));
    for (const channel of pcm.channelData) audio[i] += (channel[index] || 0)/pcm.channelData.length;
  }
  const started = performance.now();
  const output = await transcriber(audio, {language: 'arabic', task: 'transcribe', return_timestamps: false});
  const result = {...window, decodedFromMs: pcm.off, sampleRate: rate,
    audioSha256: sha256(Buffer.from(audio.buffer)), seconds: +((performance.now()-started)/1000).toFixed(3),
    text: output.text};
  results.push(result);
  console.log(JSON.stringify(result));
}
fs.writeFileSync('review/sudais-whisper-tiny-5-111-29-45-46-pilot.json', JSON.stringify({
  status: 'review-only-identity-probe-no-cut-approval', modelId, dtype: 'q8', language: 'arabic',
  task: 'transcribe', sources, initSeconds: +initSeconds.toFixed(3), results,
}, null, 2)+'\n');
