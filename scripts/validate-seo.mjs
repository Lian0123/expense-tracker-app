import { readFile } from 'node:fs/promises';
const files = [
  'dist/index.html',
  'dist/en/index.html',
  'dist/app/index.html',
  'dist/sitemap.xml',
  'dist/robots.txt',
  'dist/manifest.webmanifest',
];
for (const file of files) await readFile(file);
const html = await readFile('dist/index.html', 'utf8');
for (const needle of [
  '<title>',
  'name="description"',
  'rel="canonical"',
  'og:title',
  'application/ld+json',
]) {
  if (!html.includes(needle)) throw new Error(`SEO validation failed: ${needle}`);
}
const english = await readFile('dist/en/index.html', 'utf8');
for (const needle of [
  'rel="canonical"',
  '../assets/brand/hana-app-icon-192.png',
  'og:image',
  'twitter:card',
  'SoftwareApplication',
]) {
  if (!english.includes(needle)) throw new Error(`English SEO validation failed: ${needle}`);
}
const app = await readFile('dist/app/index.html', 'utf8');
if (!app.includes('noindex,nofollow')) throw new Error('App entry must be noindex');
if (!html.includes('src="./assets/') || !html.includes('href="./manifest.webmanifest"'))
  throw new Error('Landing HTML must use portable relative asset paths');
if (!app.includes('src="../assets/') || !app.includes('href="../manifest.webmanifest"'))
  throw new Error('App HTML must use portable parent-relative asset paths');
if (!html.includes('href="./manifest.webmanifest"'))
  throw new Error('Landing manifest link must resolve relative to the Pages root');
if (!app.includes('href="../manifest.webmanifest"'))
  throw new Error('App manifest link must resolve one level up to the Pages root');
const sitemap = await readFile('dist/sitemap.xml', 'utf8');
if (sitemap.includes('/app/'))
  throw new Error('Sitemap must not include the personalized app shell');
for (const artifact of [html, english, app]) {
  if (artifact.includes('%BASE_URL%') || artifact.includes('src/main.tsx'))
    throw new Error('Production HTML contains an unbuilt source/base placeholder');
  if (artifact.includes('daily-ledger.example'))
    throw new Error('SEO artifact contains placeholder domain');
  const ogImage = artifact.match(/property="og:image" content="([^"]+)"/u)?.[1];
  if (ogImage && !ogImage.startsWith('https://'))
    throw new Error('Open Graph images must use an absolute HTTPS URL');
}
console.log(`SEO validation passed (${files.length} artifacts).`);
