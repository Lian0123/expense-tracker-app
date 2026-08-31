import { readdir, readFile } from 'node:fs/promises';

const reportDir = 'lhci-report';
const files = (await readdir(reportDir)).filter((file) => file.endsWith('.report.json'));
if (files.length < 3) {
  throw new Error(`Expected Lighthouse reports for zh-TW, en, and app; found ${files.length}.`);
}

const entries = await Promise.all(
  files.map(async (file) => ({
    file,
    report: JSON.parse(await readFile(`${reportDir}/${file}`, 'utf8')),
  })),
);
// LHCI keeps historical JSON reports. Evaluate only the newest report for each
// path so a previous local run can never mask a current regression.
const latestByPath = new Map();
for (const entry of entries.sort((a, b) => b.file.localeCompare(a.file))) {
  const pathname = new URL(entry.report.finalUrl).pathname;
  if (!latestByPath.has(pathname)) latestByPath.set(pathname, entry.report);
}
const reports = [...latestByPath.values()];
const publicReports = reports.filter((report) => {
  const pathname = new URL(report.finalUrl).pathname;
  return pathname === '/' || pathname === '/en/';
});
if (publicReports.length < 2) {
  throw new Error('Could not find both public landing page Lighthouse reports.');
}

for (const report of publicReports) {
  const scores = ['performance', 'accessibility', 'best-practices', 'seo'];
  for (const category of scores) {
    const score = report.categories?.[category]?.score ?? 0;
    if (score < 0.9) {
      throw new Error(
        `${new URL(report.finalUrl).pathname} ${category} score ${score} is below 0.90.`,
      );
    }
  }
}

const appReports = reports.filter((report) => /\/app\/?$/u.test(new URL(report.finalUrl).pathname));
if (appReports.length === 0) throw new Error('Expected an app Lighthouse report.');
for (const report of appReports) {
  const appNoIndex = report.audits?.['is-crawlable']?.score === 0;
  if (!appNoIndex)
    throw new Error('App Lighthouse report must confirm the intentional noindex directive.');
}

console.log(
  `Lighthouse validated: ${publicReports.length} public pages >= 90; app is intentionally noindex.`,
);
