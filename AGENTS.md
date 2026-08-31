# Daily Ledger contributor guide

## Product boundaries

Daily Ledger is a static, client-only React app. Never add a server, account flow, analytics SDK, remote sync, or code that sends transaction data away from the browser. IndexedDB is the source of truth; JSON/CSV export is the user-controlled portability path.

## Working agreements

- Keep TypeScript strict and validate every data boundary with `src/lib/schema.ts`.
- Treat decimal amounts as strings and use `src/lib/amount.ts`; do not perform financial sums with binary floating point.
- Preserve `?mode=companion|ledger` deep links and the shared repository subscription contract.
- Public asset filenames are owned by the asset manifest. Use `assetUrl()` for runtime paths so GitHub Pages subpaths work.
- After changing a PNG source, run `npm run assets:optimize`; UI images must prefer AVIF/WebP and retain PNG fallback.
- New UI must be keyboard usable, have an accessible name, retain 44px touch targets, and respect both OS and the persisted reduced-motion setting.
- Use `apply_patch` for source edits, then run `npm run quality` (or the narrowest relevant checks while iterating).

See `docs/` for the living architecture, data contract, asset, quality, deployment, and maintenance notes.
