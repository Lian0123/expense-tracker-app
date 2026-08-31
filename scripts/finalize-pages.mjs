import { mkdir, readFile, writeFile } from 'node:fs/promises';

const sourceRoot = await readFile('dist/index.html', 'utf8');
const configuredBase = (process.env.BASE_PATH || '/').replace(/^\/+|\/+$/g, '');
const basePrefix = configuredBase ? `/${configuredBase}/` : '/';
// Keep compiled HTML portable when a user previews the generated folder at
// /<repo>/dist/. Runtime JS still receives the configured Pages base and has a
// matching /dist/ fallback in src/lib/assets.ts.
const root = sourceRoot
  .replaceAll(`src="${basePrefix}assets/`, 'src="./assets/')
  .replaceAll(`href="${basePrefix}assets/`, 'href="./assets/');
await writeFile('dist/index.html', root);
const app = root
  .replace('content="index,follow"', 'content="noindex,nofollow"')
  .replace('<title>日常記帳｜Daily Ledger</title>', '<title>日常記帳｜Daily Ledger · App</title>')
  // The app shell is copied one directory deeper than the public landing page.
  // Keep its manifest and touch-icon links pointed at the deployment root.
  .replaceAll('src="./assets/', 'src="../assets/')
  .replaceAll('href="./assets/', 'href="../assets/')
  .replaceAll('href="./manifest.webmanifest"', 'href="../manifest.webmanifest"');
await mkdir('dist/app', { recursive: true });
await writeFile('dist/app/index.html', app);

const serviceWorker = await readFile('dist/sw.js', 'utf8');
await writeFile(
  'dist/sw.js',
  serviceWorker.replace('__DAILY_LEDGER_CACHE__', `daily-ledger-shell-${Date.now()}`),
);
