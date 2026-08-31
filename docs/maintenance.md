# Maintenance runbook

Use Node 24 (`.nvmrc`) and `npm ci` for reproducible installs. If a browser storage error is reported, direct the user to export JSON/CSV before clearing site data. Never clear the database automatically. If a backup is rejected, preserve the original file and report row/field issues.

When changing public asset names, update both manifests, `src/lib/assets.ts`, the asset docs, and the asset existence check. Run `npm run assets:optimize` after changing a PNG source. When changing copy, update both locale objects. For release triage, reproduce with a fresh browser profile, run `npm run quality` with `SITE_URL` and `BASE_PATH`, inspect `dist/index.html` SEO tags, and test one JSON and one CSV round trip including a second-level time.

`build` stamps a unique cache name into `dist/sw.js`; keep that finalization step intact so an updated hashed shell triggers the in-app update notice instead of serving stale JavaScript.
