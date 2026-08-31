import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Hana PWA identity', () => {
  it('ships character-based install icons in both required sizes', () => {
    const root = resolve(process.cwd(), 'public');
    const manifest = JSON.parse(readFileSync(resolve(root, 'manifest.webmanifest'), 'utf8')) as {
      icons: Array<{ src: string; sizes: string; type: string }>;
    };
    expect(manifest.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sizes: '192x192', type: 'image/png' }),
        expect.objectContaining({ sizes: '512x512', type: 'image/png' }),
      ]),
    );
    for (const icon of manifest.icons)
      expect(existsSync(resolve(root, icon.src.slice(2)))).toBe(true);
  });
});
