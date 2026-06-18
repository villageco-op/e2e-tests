import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src/tests',
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL,

    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    
    extraHTTPHeaders: process.env.E2E_NEON_DB_URL ? {
      'x-e2e-neon-db-url': process.env.E2E_NEON_DB_URL
    } : {},
  },
  projects: [
    { 
      name: 'setup',
      testDir: './src/setup',
      testMatch: '**/*.setup.ts',
    },
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/staging-state.json',
      },
      dependencies: ['setup'],
    },
  ],
});
