import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const sharp = createRequire(import.meta.url)('sharp');
const directory = path.dirname(fileURLToPath(import.meta.url));
const repository = path.resolve(directory, '../..');
const source = path.join(directory, 'phone-artwork-2026-10-25.jpg');
const background = '#061A37';
const metadata = await sharp(source).metadata();
if (metadata.width !== metadata.height || metadata.width < 512) {
  throw new Error('The supplied phone artwork must be square and at least 512 pixels wide.');
}

// Direct proportional resizing preserves the user's image on Android, iOS and web installs.
for (const [target, size] of [
  [path.join(directory, 'phone-icon-512.png'), 512],
  [path.join(repository, 'pwa_icon-192.png'), 192],
  [path.join(repository, 'pwa_icon-512.png'), 512],
  [path.join(repository, 'pwa_apple-180.png'), 180],
]) {
  await sharp(source).resize(size, size, {kernel: 'lanczos3'})
    .png({compressionLevel: 9}).toFile(target);
}

// Android/PWA masks can crop corners. Keep the book in the central safe area.
const artwork = await sharp(source).resize(224, 224, {kernel: 'lanczos3'}).png().toBuffer();
await sharp({create: {width: 432, height: 432, channels: 4, background}})
  .composite([{input: artwork, left: 104, top: 104}])
  .png({compressionLevel: 9})
  .toFile(path.join(repository, 'pwa_icon-maskable.png'));
console.log(JSON.stringify({source, background, output: 'phone-icon-512.png and PWA icons'}));
