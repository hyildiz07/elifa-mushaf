import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('test-results/review-sudais-full-verses');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));

function readWav(file) {
  const data = fs.readFileSync(file);
  if (data.toString('ascii', 0, 4) !== 'RIFF') throw new Error(`Not WAV: ${file}`);
  const channels = data.readUInt16LE(22);
  const rate = data.readUInt32LE(24);
  const bits = data.readUInt16LE(34);
  if (bits !== 16) throw new Error(`Unexpected WAV bit depth: ${bits}`);
  let offset = 12;
  while (offset + 8 <= data.length) {
    const kind = data.toString('ascii', offset, offset + 4);
    const size = data.readUInt32LE(offset + 4);
    if (kind === 'data') return { data, offset: offset + 8, samples: Math.floor(size / (2 * channels)), channels, rate };
    offset += 8 + size + (size % 2);
  }
  throw new Error(`Missing PCM data: ${file}`);
}

function rmsSeries(wav, windowMs = 10) {
  const size = Math.round(wav.rate * windowMs / 1000);
  const result = [];
  for (let from = 0; from + size <= wav.samples; from += size) {
    let energy = 0;
    for (let i = from; i < from + size; i++) {
      for (let c = 0; c < wav.channels; c++) {
        const sample = wav.data.readInt16LE(wav.offset + 2 * (i * wav.channels + c)) / 32768;
        energy += sample * sample;
      }
    }
    result.push(Math.sqrt(energy / (size * wav.channels)));
  }
  return result;
}

const output = {};
for (const verse of manifest.cases) {
  if (!['3:160', '4:143', '5:5', '4:134'].includes(verse.verse_key)) continue;
  output[verse.verse_key] = {};
  for (const rec of verse.recordings) {
    const wav = readWav(path.join(root, rec.clips.tail.file));
    const series = rmsSeries(wav);
    const block = n => {
      const bins = series.slice(-n);
      return Number(Math.sqrt(bins.reduce((s, value) => s + value * value, 0) / bins.length).toFixed(5));
    };
    output[verse.verse_key][rec.bitrate_kbps] = {
      decoded_duration_ms: rec.decoded_duration_ms,
      label_to_file_end_gap_ms: rec.label_to_file_end_gap_ms,
      last_100ms_rms: block(10),
      preceding_100ms_rms: Number(Math.sqrt(series.slice(-20, -10).reduce((s, value) => s + value * value, 0) / 10).toFixed(5)),
      last_10ms_rms: block(1),
      last_100ms_10ms_envelope: series.slice(-10).map(value => Number(value.toFixed(5))),
    };
  }
}
process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
