import {
  assetImageSet,
  assetUrl,
  assetVariant,
  mascotAssetFor,
  mascotAsset,
  resolveRuntimeBase,
  sceneAsset,
} from '../src/lib/assets';

describe('asset manifest', () => {
  it('uses a safe root fallback in test/dev environments', () => {
    expect(assetUrl('/assets/characters/hana-idle.png')).toBe('/assets/characters/hana-idle.png');
  });

  it('resolves Actions, dist-folder and local Lighthouse deployment paths', () => {
    expect(resolveRuntimeBase('/', '/anything', 'example.com')).toBe('/');
    expect(
      resolveRuntimeBase('/expense-tracker-app/', '/expense-tracker-app/dist/', 'github.io'),
    ).toBe('/expense-tracker-app/dist/');
    expect(resolveRuntimeBase('/expense-tracker-app/', '/app/', 'localhost')).toBe('/');
    expect(
      resolveRuntimeBase('/expense-tracker-app/', '/expense-tracker-app/app/', 'localhost'),
    ).toBe('/expense-tracker-app/');
    expect(resolveRuntimeBase('/expense-tracker-app/', '/other/', 'example.com')).toBe(
      '/expense-tracker-app/',
    );
  });

  it('references the generated transparent character and scene assets', () => {
    expect(mascotAsset.income).toBe('assets/characters/hana-income.png');
    expect(sceneAsset['deep-night']).toBe('assets/backgrounds/shrine-late-night.png');
    expect(mascotAssetFor('mugi', 'income')).toBe('assets/characters/mugi-corgi-happy.png');
    expect(mascotAssetFor('mugi', 'thinking')).toBe('assets/characters/mugi-corgi-thinking.png');
  });

  it('builds modern image candidates while retaining the PNG fallback', () => {
    expect(assetVariant('assets/characters/hana-idle.png', 'avif')).toBe(
      '/assets/characters/hana-idle.avif',
    );
    expect(assetVariant('assets/characters/hana-idle.png', 'webp')).toBe(
      '/assets/characters/hana-idle.webp',
    );
    expect(assetImageSet('assets/backgrounds/shrine-morning.png')).toContain('type("image/avif")');
    expect(assetImageSet('assets/backgrounds/shrine-morning.png')).toContain('shrine-morning.png');
  });
});
