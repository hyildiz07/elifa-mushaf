// Research-only exact-source probe. Compares decoded PCM windows, not filenames.
import fs from 'node:fs';
import {decodeWindow} from '../src/split-audio.mjs';

const targets = [[3, 160], [4, 143], [5, 46], [28, 87]];
const output = [];
function monoMs(p) {
  const src = p.channelData[0], step = p.sampleRate / 1000;
  return Float32Array.from({length: Math.floor(src.length / step)}, (_, i) => {
    const a = Math.floor(i * step), b = Math.max(a + 1, Math.floor((i + 1) * step));
    let sum = 0;
    for (let j = a; j < b; j++) sum += src[j];
    return sum / (b - a);
  });
}
function corr(a, b, ai, bi, n = 800) {
  let aa = 0, bb = 0, ab = 0;
  for (let i = 0; i < n; i += 3) {
    const x = a[ai + i], y = b[bi + i];
    if (x === undefined || y === undefined) return -Infinity;
    aa += x * x; bb += y * y; ab += x * y;
  }
  return ab / Math.sqrt(aa * bb || 1);
}
function rms(a, lo, hi) {
  let sum = 0;
  for (let i = lo; i < hi; i++) sum += a[i] * a[i];
  return Math.sqrt(sum / (hi - lo));
}
for (const [surah, ayah] of targets) {
  const key = `${surah}:${ayah}`;
  const [sourceResponse, clipResponse] = await Promise.all([
    fetch(`https://qul.tarteel.ai/api/v1/audio/surah_segments/3?surah=${surah}&from=${ayah}&to=${ayah}`),
    fetch(`https://qul.tarteel.ai/api/v1/audio/ayah_segments/16?surah=${surah}&from=${ayah}&to=${ayah}`)
  ]);
  if (!sourceResponse.ok || !clipResponse.ok) throw Error(`Metadata unavailable ${key}`);
  const source = (await sourceResponse.json()).segments[key];
  const clip = (await clipResponse.json()).segments[key];
  const response = await fetch(clip.audio_url, {signal: AbortSignal.timeout(60000)});
  if (!response.ok) throw Error(`Clip ${response.status} ${key}`);
  const clipBytes = Buffer.from(await response.arrayBuffer());
  const clipP = await decodeWindow(new Blob([clipBytes]).stream(), 0, Math.min(60000, clip.segments.at(-1)[3] + 250), {maxMissingMs: 1000});
  const clipMs = monoMs(clipP);
  const qdcBytes = fs.readFileSync(`test-results/sudais-qdc-${surah}.mp3`);
  const from = Math.max(0, source.time_from - 30000), to = source.time_to + 5000;
  const qdcP = await decodeWindow(new Blob([qdcBytes]).stream(), from, to);
  const qdcMs = monoMs(qdcP);
  const anchors = [.2, .5, .8].map(f => Math.floor(f * (clipMs.length - 800)));
  const matches = anchors.map(anchor => {
    let best = {qdcMs: null, correlation: -Infinity};
    for (let i = 0; i + 800 < qdcMs.length; i += 5) {
      const value = corr(qdcMs, clipMs, i, anchor);
      if (value > best.correlation) best = {qdcMs: from + i, correlation: value};
    }
    const rough = best.qdcMs - from;
    for (let i = Math.max(0, rough - 5); i < Math.min(qdcMs.length - 800, rough + 5); i++) {
      const value = corr(qdcMs, clipMs, i, anchor);
      if (value > best.correlation) best = {qdcMs: from + i, correlation: value};
    }
    return {clipMs: anchor, ...best};
  });
  const first = clip.segments[0];
  output.push({key, sourceVerseRangeMs: [source.time_from, source.time_to], clipUrl: clip.audio_url,
    clipBytes: clipBytes.length, clipDurationMs: clipMs.length, firstSegment: first,
    firstSegmentRms: rms(clipMs, Math.min(clipMs.length - 1, first[2]), Math.min(clipMs.length, first[3])),
    following500MsRms: rms(clipMs, 100, Math.min(clipMs.length, 600)), matches});
  console.log(key, JSON.stringify(output.at(-1)));
}
fs.writeFileSync('review/sudais-qul-ayah-clip-qdc-pcm.json', JSON.stringify({status: 'research-only', method: 'fully decoded QDC chapter and QUL per-ayah clip; 800 ms PCM cross-correlation', output}, null, 2) + '\n');
