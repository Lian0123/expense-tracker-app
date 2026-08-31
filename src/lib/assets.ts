/** Resolve public assets correctly in both root development and GitHub Pages subpaths. */
export function assetUrl(path: string): string {
  const base = typeof __DAILY_LEDGER_BASE__ === 'string' ? __DAILY_LEDGER_BASE__ : '/';
  return `${base}${path.replace(/^\/+/, '')}`;
}

export function assetVariant(path: string, extension: 'avif' | 'webp'): string {
  return assetUrl(path.replace(/\.png$/i, `.${extension}`));
}

export function assetImageSet(path: string): string {
  return `image-set(url("${assetVariant(path, 'avif')}") type("image/avif"), url("${assetVariant(path, 'webp')}") type("image/webp"), url("${assetUrl(path)}") type("image/png"))`;
}

declare const __DAILY_LEDGER_BASE__: string | undefined;

export const mascotAsset: Record<string, string> = {
  idle: 'assets/characters/hana-idle.png',
  welcome: 'assets/characters/hana-welcome.png',
  focus: 'assets/characters/hana-input.png',
  thinking: 'assets/characters/hana-thinking.png',
  income: 'assets/characters/hana-income.png',
  expense: 'assets/characters/hana-expense.png',
  edit: 'assets/characters/hana-edit.png',
  validation: 'assets/characters/hana-error.png',
  empty: 'assets/characters/hana-empty.png',
  success: 'assets/characters/hana-import.png',
  export: 'assets/characters/hana-export.png',
  warning: 'assets/characters/hana-warning.png',
};

export const sceneAsset: Record<string, string> = {
  morning: 'assets/backgrounds/shrine-morning.png',
  noon: 'assets/backgrounds/shrine-noon.png',
  dusk: 'assets/backgrounds/shrine-dusk.png',
  evening: 'assets/backgrounds/shrine-night.png',
  'deep-night': 'assets/backgrounds/shrine-late-night.png',
};
