import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const sharp = createRequire(import.meta.url)('sharp');
const directory = path.dirname(fileURLToPath(import.meta.url));
const source = path.join(directory, 'play-artwork-2026-10-25.jpg');
const target = path.join(directory, 'play-icon-512.png');
const size = 512;

const metadata = await sharp(source).metadata();
if (metadata.width !== metadata.height || metadata.width < size) {
  throw new Error('The supplied Play artwork must be square and at least 512 pixels wide.');
}

// Keep the supplied composition intact: downscale only, with no crop or retouch.
const result = await sharp(source)
  .resize(size, size, {kernel: 'lanczos3'})
  .ensureAlpha()
  .png({compressionLevel: 9})
  .toFile(target);
if (result.size > 1024 * 1024) throw new Error('Google Play icon exceeds 1 MiB.');
console.log(JSON.stringify({width: size, height: size, bytes: result.size, source}));
