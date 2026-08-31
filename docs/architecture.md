# Architecture

The Vite entry (`src/main.tsx`) mounts `App`. `App` keeps the crawlable landing route lightweight and lazy-loads `AppShellRoute` only for `/app`; the route owns mode, scene and current mascot event, then passes the shared snapshot to `AppShell`. `CompanionView` and `LedgerView` are sibling projections of the same state, so a write in either view is immediately visible in the other.

`useLedger` owns one process-wide `LedgerRepository`. The repository validates writes, persists atomically to IndexedDB stores (`transactions`, `categories`, `settings`), and broadcasts a lightweight change notice with `BroadcastChannel`. IndexedDB is the only source of truth: unavailable or failed storage is surfaced to the UI and is never silently replaced with memory. Transfer parsing is deliberately separate from persistence: preview and validation happen before `replaceAll` or merge.

Built-in categories are merged by id on every read, which keeps the product vocabulary available even when a backup or first write contains only custom categories. Transactions preserve a local `HH:mm:ss` wall-clock time; sorting and range filtering compare the combined local date-time string.

`assetUrl()` is the only runtime public-asset URL builder. `runtimeBaseUrl()` also recognizes a committed-folder preview at `/<repository>/dist/` and the local Lighthouse root, so relative HTML, lazy chunks, images and the service worker resolve together. `vite.config.ts` injects the current base path for local root hosting and GitHub Pages repository hosting. The service worker caches the app shell only; it never caches private transaction data as a generated file.

Companion analytics are derived projections: `src/lib/weekly.ts` calculates a seven-day local-calendar window with decimal-safe `sumAmounts`, and `CompanionView` renders it as a seven-column chart per selected currency. On mobile, `AppShell` updates a visible local clock every second and persists the four-corner mascot anchor in settings; the desktop companion remains in the side rail.
