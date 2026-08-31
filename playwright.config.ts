import { defineConfig, devices } from '@playwright/test';

const basePath = `/${(process.env.BASE_PATH ?? '/').replace(/^\/+|\/+$/g, '')}`.replace('//', '/');
const baseURL = `http://127.0.0.1:4173${basePath === '/' ? '/' : `${basePath}/`}`;

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 8_000 },
  use: { baseURL, trace: 'on-first-retry' },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4173',
    url: baseURL,
    reuseExistingServer: false,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], locale: 'zh-TW' } }],
});
