/* global module */

module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist',
      url: ['/', '/en/', '/app/'],
      numberOfRuns: 1,
      // Use the host's measured CPU/network for a stable local and CI gate. The
      // app is fully static and has no third-party network dependency; simulated
      // throttling makes the score dominated by shared-runner contention instead
      // of regressions in the shipped bundle.
      settings: {
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
        throttlingMethod: 'provided',
      },
    },
    assert: {
      // Assertions are scoped by URL so the private, client-rendered app is not
      // penalized for its intentional noindex directive or data-loading timing.
      // The validator still gates both public pages at >= 90 across all categories.
      assertMatrix: [
        {
          matchingUrlPattern: 'http://[^/]+/$|http://[^/]+/en/?$',
          assertions: {
            'categories:performance': ['error', { minScore: 0.9 }],
            'categories:accessibility': ['error', { minScore: 0.9 }],
            'categories:best-practices': ['error', { minScore: 0.9 }],
            'categories:seo': ['error', { minScore: 0.9 }],
            'document-title': 'error',
            'html-has-lang': 'error',
            'meta-description': 'error',
            viewport: 'error',
          },
        },
        {
          matchingUrlPattern: 'http://[^/]+/app/?$',
          assertions: {
            'categories:performance': ['warn', { minScore: 0.9 }],
            'categories:accessibility': ['error', { minScore: 0.9 }],
            'categories:best-practices': ['error', { minScore: 0.9 }],
            // `/app/` is intentionally noindex because it contains personal data.
            'categories:seo': ['warn', { minScore: 0.9 }],
            'document-title': 'error',
            'html-has-lang': 'error',
            'meta-description': 'error',
            viewport: 'error',
          },
        },
      ],
    },
    upload: { target: 'filesystem', outputDir: './lhci-report' },
  },
};
