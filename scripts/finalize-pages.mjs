import { mkdir, readFile, writeFile } from 'node:fs/promises';

const root = await readFile('dist/index.html', 'utf8');
const app = root
  .replace('content="index,follow"', 'content="noindex,nofollow"')
  .replace('<title>日常記帳｜Daily Ledger</title>', '<title>日常記帳｜Daily Ledger · App</title>');
await mkdir('dist/app', { recursive: true });
await writeFile('dist/app/index.html', app);

const serviceWorker = await readFile('dist/sw.js', 'utf8');
await writeFile(
  'dist/sw.js',
  serviceWorker.replace('__DAILY_LEDGER_CACHE__', `daily-ledger-shell-${Date.now()}`),
);
