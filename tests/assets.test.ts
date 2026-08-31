import { assetImageSet, assetUrl, assetVariant, mascotAsset, sceneAsset } from '../src/lib/assets';

describe('asset manifest', () => {
  it('uses a safe root fallback in test/dev environments', () => {
    expect(assetUrl('/assets/characters/hana-idle.png')).toBe('/assets/characters/hana-idle.png');
  });

  it('references the generated transparent character and scene assets', () => {
    expect(mascotAsset.income).toBe('assets/characters/hana-income.png');
    expect(sceneAsset['deep-night']).toBe('assets/backgrounds/shrine-late-night.png');
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
