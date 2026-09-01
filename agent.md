# Daily Ledger agent handoff

This file is the short operational handoff for future maintenance agents. The longer living decisions are in [`docs/README.md`](docs/README.md) and its linked documents.

## Current product contract

- React 19 + TypeScript strict + Vite; Node 24 is pinned in `.nvmrc`.
- The app is static and local-only. IndexedDB is the source of truth; JSON/CSV are user-controlled backups.
- `/` and `/en/` are crawlable marketing pages. `/app/?mode=companion|ledger` is the noindex application shell.
- GitHub Pages Actions serves the artifact at `/<repository>/`; a committed `dist/` preview is also supported with relative HTML and runtime base detection.
- Transactions retain local `HH:mm:ss` precision. Amounts are decimal strings and all calculations go through `src/lib/amount.ts`.
- `UserSettingsV1.mascotPosition` controls the mobile Hana anchor (`top-left`, `top-right`, `bottom-left`, `bottom-right`); old settings migrate to `bottom-right`.
- `UserSettingsV1.mascotCharacter` switches between Hana and the optional Mugi corgi companion; legacy settings default to Hana.
- `UserSettingsV1.sortMode` remembers the user's ledger ordering; legacy settings without it use `newest` until the next sort change.
- `src/lib/weekly.ts` derives a seven-day, selected-currency spending summary for the companion dashboard.

## Visual and interaction rules

- Hana and Mugi use transparent generated state cutouts. Do not add a colored plate, legacy anchor object, or opaque backdrop behind either character.
- Prefer AVIF/WebP with PNG fallback for character and scene art. PWA identity uses the opaque character portrait in `public/assets/brand/hana-app-icon-192.png` and `hana-app-icon-512.png`.
- All interactions need keyboard names, 44px touch targets, visible focus, and reduced-motion behavior. Mobile time is intentionally visible as a per-second local clock with a scene greeting.

## Handoff checklist

1. Read `docs/architecture.md`, `docs/data-contract.md`, and `docs/quality.md` before changing persistence or UI contracts.
2. Use `apply_patch` for text edits and update both locale dictionaries for new copy.
3. Run `npm run quality` with `SITE_URL=https://<owner>.github.io` and the correct `BASE_PATH`; production SEO generation must not use a placeholder URL.
4. For generated raster changes, inspect the source and outputs, update `docs/assets.md`, and verify the asset manifest and service-worker precache list.
