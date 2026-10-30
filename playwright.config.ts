import { defineConfig, devices } from '@playwright/test';
const localURL = 'http://127.0.0.1:5173' + (process.env.VITE_BASE_PATH || '/');
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 90000,
  reporter: [['list'], ['json', { outputFile: 'docs/evidence/browser-results.json' }]],
  use: {
    baseURL: localURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: { channel: process.env.CI ? 'chromium' : 'msedge' },
  },
  projects: [
    {
      name: 'desktop-edge',
      testIgnore: /viewport.spec.ts/,
      use: { ...devices['Desktop Edge'], viewport: { width: 1440, height: 1000 } },
    },
    {
      name: 'mobile-edge',
      testIgnore: /viewport.spec.ts/,
      use: {
        viewport: { width: 375, height: 812 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 1,
      },
    },
    { name: 'decision-viewports', testMatch: /viewport.spec.ts/ },
  ],
  webServer: {
    command:
      process.env.E2E_PRODUCTION === '1'
        ? 'npm run preview -- --port 5173 --strictPort'
        : 'npm run dev -- --port 5173 --strictPort',
    url: localURL,
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
