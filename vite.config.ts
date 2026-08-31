import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const repository = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? 'expense-tracker-app';
const base = process.env.BASE_PATH ?? (process.env.GITHUB_ACTIONS ? `/${repository}/` : '/');

export default defineConfig({
  base,
  define: { __DAILY_LEDGER_BASE__: JSON.stringify(base) },
  plugins: [react()],
  build: { target: 'es2022', sourcemap: true, assetsInlineLimit: 4096 },
  server: { host: '127.0.0.1', port: 4173 },
});
