import type { MascotCharacter } from '../types/domain';

/**
 * Resolve the effective deployment root at runtime.
 *
 * A GitHub Pages branch preview can expose the production `dist` folder at
 * `/<repository>/dist/`, while the normal Actions deployment serves that same
 * folder at `/<repository>/`. Vite only knows the configured base at build
 * time, so detect the preview path before resolving runtime images and the
 * service worker.
 */
export function runtimeBaseUrl(): string {
  const configuredBase = typeof __DAILY_LEDGER_BASE__ === 'string' ? __DAILY_LEDGER_BASE__ : '/';
  if (typeof window === 'undefined') return configuredBase;
  return resolveRuntimeBase(configuredBase, window.location.pathname, window.location.hostname);
}

/** Pure path resolver kept separate so deployment variants can be regression-tested. */
export function resolveRuntimeBase(
  configuredBase: string,
  pathname: string,
  hostname: string,
): string {
  if (configuredBase === '/') return configuredBase;
  if (pathname.startsWith(`${configuredBase}dist/`)) {
    return `${configuredBase}dist/`;
  }
  // Lighthouse's static server mounts `dist` at localhost root. Keep that
  // quality preview usable without changing the production Pages base.
  if (
    (hostname === 'localhost' || hostname === '127.0.0.1') &&
    !pathname.startsWith(configuredBase)
  ) {
    return '/';
  }
  return configuredBase;
}

/** Resolve public assets correctly in both root development and GitHub Pages subpaths. */
export function assetUrl(path: string): string {
  const base = runtimeBaseUrl();
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

/** Mugi uses a small curated set of expressive poses and the CSS choreography
 * fills in the in-between motion for every ledger event. */
export const mugiMascotAsset: Record<string, string> = {
  idle: 'assets/characters/mugi-corgi.png',
  welcome: 'assets/characters/mugi-corgi-happy.png',
  focus: 'assets/characters/mugi-corgi-thinking.png',
  thinking: 'assets/characters/mugi-corgi-thinking.png',
  income: 'assets/characters/mugi-corgi-happy.png',
  expense: 'assets/characters/mugi-corgi.png',
  edit: 'assets/characters/mugi-corgi-thinking.png',
  validation: 'assets/characters/mugi-corgi-thinking.png',
  empty: 'assets/characters/mugi-corgi.png',
  success: 'assets/characters/mugi-corgi-happy.png',
  export: 'assets/characters/mugi-corgi-happy.png',
  warning: 'assets/characters/mugi-corgi-thinking.png',
};

/** Mimi is a calico cat with three expressive source poses; CSS choreography
 * fills in the in-between motion for every ledger event. */
export const mimiMascotAsset: Record<string, string> = {
  idle: 'assets/characters/mimi-cat.png',
  welcome: 'assets/characters/mimi-cat-happy.png',
  focus: 'assets/characters/mimi-cat-thinking.png',
  thinking: 'assets/characters/mimi-cat-thinking.png',
  income: 'assets/characters/mimi-cat-happy.png',
  expense: 'assets/characters/mimi-cat.png',
  edit: 'assets/characters/mimi-cat-thinking.png',
  validation: 'assets/characters/mimi-cat-thinking.png',
  empty: 'assets/characters/mimi-cat.png',
  success: 'assets/characters/mimi-cat-happy.png',
  export: 'assets/characters/mimi-cat-happy.png',
  warning: 'assets/characters/mimi-cat-thinking.png',
};

export function mascotAssetFor(character: MascotCharacter = 'hana', state: string): string {
  const source =
    character === 'mugi' ? mugiMascotAsset : character === 'mimi' ? mimiMascotAsset : mascotAsset;
  return source[state] ?? source.idle;
}

export const sceneAsset: Record<string, string> = {
  morning: 'assets/backgrounds/shrine-morning.png',
  noon: 'assets/backgrounds/shrine-noon.png',
  dusk: 'assets/backgrounds/shrine-dusk.png',
  evening: 'assets/backgrounds/shrine-night.png',
  'deep-night': 'assets/backgrounds/shrine-late-night.png',
};
