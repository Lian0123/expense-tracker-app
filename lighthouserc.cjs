/* global module */

module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist',
      url: ['/', '/en/', '/app/'],
      numberOfRuns: 1,
      settings: { chromeFlags: '--no-sandbox --disable-dev-shm-usage' },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        // `/app/` is intentionally noindex because it contains personal data. Its
        // SEO score therefore includes Lighthouse's expected `is-crawlable` failure;
        // scripts/validate-lighthouse.mjs gates the two public landing pages instead.
        'categories:seo': ['warn', { minScore: 0.9 }],
        'document-title': 'error',
        'html-has-lang': 'error',
        'meta-description': 'error',
        viewport: 'error',
      },
    },
    upload: { target: 'filesystem', outputDir: './lhci-report' },
  },
};
