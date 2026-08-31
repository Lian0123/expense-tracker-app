import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const strict = process.argv.includes('--production') || process.env.CI === 'true';
if (strict && !process.env.SITE_URL) {
  throw new Error(
    'SITE_URL is required for a production SEO build (for example, https://example.com).',
  );
}
const siteUrl = (process.env.SITE_URL || 'http://localhost:4173').replace(/\/$/, '');
const base = (process.env.BASE_PATH || '/').replace(/\/$/, '');
const canonical = `${siteUrl}${base}`;
await mkdir(resolve('public'), { recursive: true });
const urls = [`${canonical}/`, `${canonical}/en/`];
await writeFile(
  resolve('public/sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls
    .slice(0, 2)
    .map((url) => `<url><loc>${url}</loc></url>`)
    .join('')}</urlset>\n`,
);
await writeFile(
  resolve('public/robots.txt'),
  `User-agent: *\nAllow: /\nDisallow: ${base || ''}/app/\nSitemap: ${canonical}/sitemap.xml\n`,
);
await writeFile(
  resolve('public/seo-config.json'),
  JSON.stringify({ siteUrl, canonical, base, generatedAt: new Date().toISOString() }, null, 2),
);

function deploymentRoot(source, english) {
  const current = source.match(/<link rel="canonical" href="([^"]+)"/u)?.[1];
  if (!current) return null;
  return (english ? current.replace(/\/en\/?$/u, '') : current).replace(/\/$/u, '');
}

// Public HTML is intentionally static so crawlers can read the landing copy before JS runs.
// Derive and replace the previous deployment root so SITE_URL/BASE_PATH remain portable.
for (const file of ['index.html', 'public/en/index.html']) {
  const path = resolve(file);
  try {
    const source = await readFile(path, 'utf8');
    const previous = deploymentRoot(source, file.includes('/en/'));
    let rendered = previous ? source.replaceAll(previous, canonical) : source;
    rendered = rendered.replace(
      /(<meta property="og:image" content=")[^"]*(")/u,
      `$1${canonical}/assets/social/daily-ledger-og.png$2`,
    );
    await writeFile(path, rendered);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') continue;
    throw error;
  }
}
