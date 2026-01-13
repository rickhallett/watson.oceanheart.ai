import { defineConfig, devices } from '@playwright/test';

/**
 * Watson E2E Test Configuration
 *
 * Uses Playwright with Chrome DevTools Protocol (CDP) for enhanced observability:
 * - Performance tracing
 * - Network request monitoring
 * - Console log capture
 * - Coverage collection
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // Sequential for UX flow testing
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker for E2E user journey tests
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results.json' }],
    ['list'],
  ],

  // Output directory for test artifacts
  outputDir: 'test-results',

  // Global timeout settings
  timeout: 60000,
  expect: {
    timeout: 10000,
  },

  use: {
    // Base URL for tests
    baseURL: process.env.WATSON_URL || 'http://localhost:3001',

    // Enable tracing for debugging
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video recording
    video: 'retain-on-failure',

    // DevTools Protocol settings
    launchOptions: {
      // Enable DevTools Protocol
      devtools: process.env.DEVTOOLS === 'true',
      args: [
        '--enable-features=NetworkService',
        '--disable-web-security', // For local testing with CORS
      ],
    },

    // Viewport
    viewport: { width: 1440, height: 900 },

    // Locale for consistent testing
    locale: 'en-US',
    timezoneId: 'America/New_York',
  },

  projects: [
    // Setup project for authentication
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    // Main Chrome tests with CDP
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Enable CDP for DevTools integration
        channel: 'chrome',
      },
      dependencies: ['setup'],
    },

    // Mobile viewport test
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
      },
      dependencies: ['setup'],
    },
  ],

  // Dev server configuration
  webServer: [
    {
      command: 'cd .. && bun run dev',
      url: 'http://localhost:3001',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
    {
      command: 'cd ../backend && python manage.py runserver 8001',
      url: 'http://localhost:8001/health/',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  ],
});
