import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import base from './playwright.config';

// Reuse the complete guest-life test against an already deployed release.
export default defineConfig({
  ...base,
  grep: /starts, decides/,
  outputDir: '.local/assets-live-g5-results',
  webServer: undefined,
  reporter: [
    ['list'],
    [
      'json',
      { outputFile: fileURLToPath(new URL('./docs/evidence/assets-live-g5.json', import.meta.url)) },
    ],
  ],
  use: {
    ...base.use,
    baseURL: process.env.MKV_QA_URL ?? 'https://johnathanjjnbao.github.io/mot-kiep-viet/',
  },
  projects: base.projects?.filter((p) => p.name === 'desktop-edge' || p.name === 'mobile-edge'),
});
