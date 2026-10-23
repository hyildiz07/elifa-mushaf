import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const sharp = createRequire(import.meta.url)('sharp');
const directory = path.dirname(fileURLToPath(import.meta.url));
const source = path.join(directory, 'approved-icon-2026-10-23.jpg');
const target = path.join(directory, 'play-icon-512.png');
const size = 512;
const background = [6, 61, 46];

const metadata = await sharp(source).metadata();
if (metadata.width !== metadata.height || metadata.width < size) {
  throw new Error('The approved icon must be square and at least 512 pixels wide.');
}

const {data, info} = await sharp(source)
  .resize(size, size, {kernel: 'lanczos3'})
  .removeAlpha()
  .raw()
  .toBuffer({resolveWithObject: true});
if (info.channels !== 3) throw new Error('Unexpected icon color channels.');

// The supplied photograph already has rounded dark corners on a white square.
// Only replace the edge-connected near-white matte so Android masks do not
// display white wedges. The photo, decorative border and title stay intact.
const visited = new Uint8Array(size * size);
const queue = new Int32Array(size * size);
let first = 0;
let last = 0;
const nearWhite = pixel => {
  const offset = pixel * 3;
  const [red, green, blue] = data.subarray(offset, offset + 3);
  return red >= 215 && green >= 215 && blue >= 215 &&
    Math.max(red, green, blue) - Math.min(red, green, blue) < 22;
};
const enqueue = pixel => {
  if (visited[pixel] || !nearWhite(pixel)) return;
  visited[pixel] = 1;
  queue[last++] = pixel;
};
for (let coordinate = 0; coordinate < size; coordinate++) {
  enqueue(coordinate);
  enqueue((size - 1) * size + coordinate);
  enqueue(coordinate * size);
  enqueue(coordinate * size + size - 1);
}
while (first < last) {
  const pixel = queue[first++];
  const x = pixel % size;
  const y = Math.floor(pixel / size);
  data.set(background, pixel * 3);
  if (x > 0) enqueue(pixel - 1);
  if (x + 1 < size) enqueue(pixel + 1);
  if (y > 0) enqueue(pixel - size);
  if (y + 1 < size) enqueue(pixel + size);
}

const result = await sharp(data, {raw: {width: size, height: size, channels: 3}})
  .png({compressionLevel: 9})
  .toFile(target);
if (result.size > 1024 * 1024) throw new Error('Google Play icon exceeds 1 MiB.');
console.log(JSON.stringify({width: size, height: size, bytes: result.size, mattePixels: last}));
