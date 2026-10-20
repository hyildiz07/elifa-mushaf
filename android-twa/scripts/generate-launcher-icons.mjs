import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

// Requires sharp 0.34.x, provided by the local image toolchain.
const sharp = createRequire(import.meta.url)('sharp');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repository = path.dirname(root);
const sourceRelative = '../store-assets/google-play/play-icon-512.png';
const source = await fs.readFile(path.resolve(root, sourceRelative));
const sourceHash = crypto.createHash('sha256').update(source).digest('hex');
const densities = {mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4};
const background = '#063D2E';
const canvasDp = 108;
const artworkDp = 56;
const provenancePath = path.join(root, 'resource-provenance.json');
const provenance = JSON.parse(await fs.readFile(provenancePath, 'utf8'));

for (const [density, scale] of Object.entries(densities)) {
  const directory = path.join(root, 'app/src/main/res', `mipmap-${density}`);
  for (const kind of ['ic_launcher', 'ic_maskable']) {
    const isAdaptive = kind === 'ic_maskable';
    const size = Math.round((isAdaptive ? canvasDp : 48) * scale);
    const artworkSize = Math.round((isAdaptive ? artworkDp : 48) * scale);
    const artwork = await sharp(source).resize(artworkSize, artworkSize, {kernel: 'lanczos3'}).png().toBuffer();
    const output = isAdaptive
      ? await sharp({create: {width: size, height: size, channels: 4, background: {r: 0, g: 0, b: 0, alpha: 0}}})
        .composite([{input: artwork, left: Math.round((size-artworkSize)/2), top: Math.round((size-artworkSize)/2)}])
        .png().toBuffer()
      : artwork;
    const target = `app/src/main/res/mipmap-${density}/${kind}.png`;
    await fs.writeFile(path.join(directory, `${kind}.png`), output);
    const previous = provenance.resources.find(item => item.target === target);
    const originalExtraction = previous.originalExtraction ?? {
      source: previous.source, bytes: previous.bytes, sha256: previous.sha256
    };
    Object.assign(previous, {
      source: sourceRelative,
      target,
      bytes: output.length,
      sha256: crypto.createHash('sha256').update(output).digest('hex'),
      origin: 'approved-store-artwork',
      sourceSha256: sourceHash,
      dimensions: {width: size, height: size},
      originalExtraction
    });
  }
}

provenance.iconReplacement = {
  updatedOn: '2026-10-20',
  source: sourceRelative,
  sourceSha256: sourceHash,
  method: `sharp ${sharp.versions.sharp}, Lanczos3 resize only; no redrawing, generated content or recoloring of the artwork`,
  legacy: 'Approved square artwork resized to 48dp at five standard density scales',
  adaptive: {
    canvasDp, artworkDp, background,
    foreground: 'Approved artwork centered on transparent 108dp canvas',
    viewportDp: 72,
    textSafety: '56dp artwork keeps the title inside the central safe area; shaped launchers may crop decorative corner pixels',
    preview: 'artifacts/android-branding-2026-10-20/launcher-preview.png'
  },
  historicalResources: 'originalExtraction on replaced entries preserves the 4.aab extraction hashes; other resources retain their original hash'
};
await fs.writeFile(provenancePath, JSON.stringify(provenance, null, 2)+'\n');

const previewDirectory = path.join(repository, 'artifacts/android-branding-2026-10-20');
await fs.mkdir(previewDirectory, {recursive: true});
const previewSource = await sharp(source).resize(336,336,{kernel:'lanczos3'}).png().toBuffer();
const fullAdaptiveCanvas = await sharp({create:{width:648,height:648,channels:4,background}})
  .composite([{input:previewSource,left:156,top:156}])
  .png().toBuffer();
const adaptiveCanvas = await sharp(fullAdaptiveCanvas)
  .extract({left:108,top:108,width:432,height:432}).png().toBuffer();
const shapes = {
  circle: '<circle cx="216" cy="216" r="216" fill="white"/>',
  rounded: '<rect width="432" height="432" rx="94" fill="white"/>',
  squircle: '<path d="M216 0 C390 0 432 42 432 216 C432 390 390 432 216 432 C42 432 0 390 0 216 C0 42 42 0 216 0Z" fill="white"/>'
};
const previews = [];
for(const [name,shape] of Object.entries(shapes)) {
  const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="432" height="432">${shape}</svg>`);
  const rendered = await sharp(adaptiveCanvas).composite([{input:mask,blend:'dest-in'}]).png().toBuffer();
  await fs.writeFile(path.join(previewDirectory,`launcher-${name}.png`),rendered);
  previews.push({name,rendered});
}
const panels = [{name:'Legacy square',rendered:await sharp(source).resize(432,432,{kernel:'lanczos3'}).png().toBuffer()},...previews];
const composites=[];
for(let index=0;index<panels.length;index++){
  const {name,rendered}=panels[index];
  composites.push({input:rendered,left:24+index*464,top:56});
  composites.push({input:await sharp(rendered).resize(48,48,{kernel:'lanczos3'}).png().toBuffer(),left:216+index*464,top:524});
  composites.push({input:Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="432" height="40"><text x="216" y="26" text-anchor="middle" font-family="Arial" font-size="22" fill="#ffffff">${name}</text></svg>`),left:24+index*464,top:8});
}
const montage = await sharp({create:{width:1856,height:600,channels:4,background:'#20252b'}}).composite(composites).png().toBuffer();
await fs.writeFile(path.join(previewDirectory,'launcher-preview.png'),montage);
console.log(JSON.stringify({source:sourceRelative, sourceSha256:sourceHash, resources:10,preview:path.join(previewDirectory,'launcher-preview.png')}));
