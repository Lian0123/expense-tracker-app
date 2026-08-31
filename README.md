# 日常記帳 · Daily Ledger

A calm, private, offline-first personal ledger built for GitHub Pages. There is no backend, account, analytics or cloud sync: transactions and preferences stay in the browser's IndexedDB.

## Local development

Use Node 24 (`nvm use`, as pinned by `.nvmrc`), then:

```bash
npm ci
npm run dev
```

Open `/` for the bilingual landing page or `/app/?mode=companion` for the companion dashboard. `?mode=ledger` opens the searchable ledger. Both views subscribe to the same repository and update across tabs via `BroadcastChannel`.

## Data safety

JSON backups include schema and app versions and can be merged or restored. CSV uses UTF-8 BOM and RFC 4180 quoting. Each currency is summarized separately; no exchange-rate conversion is performed. Import is previewed and validated before any write.

## GitHub Pages

The Pages workflow runs lint, typecheck, Jest coverage, build and SEO validation before deploying. Set `SITE_URL` and (when needed) `BASE_PATH` in the workflow/repository environment. Vite derives the repository base path from `GITHUB_REPOSITORY` during Actions builds.

For deployment, set GitHub Pages **Source** to **GitHub Actions**. Serving the repository root as a branch bypasses Vite and exposes raw `/src/main.tsx`; the checked-in workflow uploads the compiled `dist` artifact instead.

The visual system uses a summer shrine palette, five time-aware scenes, a visible local clock on mobile, a seven-day spending chart, and twelve animated Hana states. Hana can be moved to any mobile corner and remembers that choice. AVIF/WebP are preferred at runtime, with transparent PNG fallbacks under `public/assets/characters` and scene fallbacks under `public/assets/backgrounds`. The installable PWA and favicon use Hana's character portrait as their identity.

## Quality commands

`npm run quality` runs the complete release gate (lint, formatting, strict typecheck, Jest coverage, docs, production build, SEO, Playwright and Lighthouse). Individual checks are also available: `npm run lint` · `npm run format:check` · `npm run typecheck` · `npm run test:coverage` · `npm run build` · `npm run seo:validate` · `npm run test:e2e` · `npm run lighthouse`.
