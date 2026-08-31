import { readdir, rename, stat } from 'node:fs/promises';
import { extname, join } from 'node:path';
import sharp from 'sharp';

const roots = ['public/assets/characters', 'public/assets/backgrounds', 'public/assets/social'];

for (const root of roots) {
  for (const name of await readdir(root)) {
    if (extname(name).toLowerCase() !== '.png') continue;
    const source = join(root, name);
    const stem = source.slice(0, -4);
    const image = sharp(source, { failOn: 'error' });
    const metadata = await image.metadata();
    const isCharacter = root.endsWith('characters');
    const width = isCharacter ? Math.min(metadata.width ?? 640, 640) : metadata.width;
    await image
      .clone()
      .resize({ width, withoutEnlargement: true })
      .avif({ quality: isCharacter ? 70 : 62, effort: 5 })
      .toFile(`${stem}.avif`);
    await image
      .clone()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: isCharacter ? 82 : 76, effort: 5, alphaQuality: 100 })
      .toFile(`${stem}.webp`);
    if (isCharacter && (metadata.width ?? width) > width) {
      const fallback = `${stem}.optimized.png`;
      await image
        .clone()
        .resize({ width, withoutEnlargement: true })
        .png({ compressionLevel: 9, effort: 10 })
        .toFile(fallback);
      await rename(fallback, source);
    }
  }
}

let original = 0;
let optimized = 0;
for (const root of roots) {
  for (const name of await readdir(root)) {
    const size = (await stat(join(root, name))).size;
    if (name.endsWith('.png')) original += size;
    if (name.endsWith('.avif')) optimized += size;
  }
}
console.log(
  `Optimized assets: PNG ${(original / 1024 / 1024).toFixed(1)} MB -> AVIF ${(optimized / 1024 / 1024).toFixed(1)} MB`,
);
