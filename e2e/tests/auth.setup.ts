/**
 * Authentication Setup for E2E Tests
 *
 * Handles JWT token generation and storage for test sessions.
 * This runs before other tests to establish authenticated state.
 */

import { test as setup, expect } from '@playwright/test';
import { createHmac } from 'crypto';

const AUTH_STATE_FILE = 'e2e/.auth/state.json';

// Test user configuration
const TEST_USER = {
  sub: 'test-user-uuid',
  email: 'test-clinician@watson.oceanheart.ai',
  name: 'Dr. Test Clinician',
  role: 'clinician',
  permissions: ['read:documents', 'write:edits', 'read:analytics'],
};

setup('authenticate', async ({ page, context }) => {
  console.log('Setting up authentication for E2E tests...');

  // Navigate to app to establish domain context
  const appUrl = process.env.APP_URL || 'http://localhost:3001';
  await page.goto(appUrl);

  // Generate a test JWT token
  // In a real scenario, this would come from the test auth server
  const testToken = generateTestToken(TEST_USER);

  // Store auth in localStorage
  await page.evaluate(({ token, user }) => {
    localStorage.setItem('watson_auth_token', token);
    localStorage.setItem('watson_user', JSON.stringify(user));
  }, { token: testToken, user: TEST_USER });

  // Verify auth was stored
  const storedToken = await page.evaluate(() => localStorage.getItem('watson_auth_token'));
  expect(storedToken).toBeTruthy();

  console.log('Authentication setup complete');

  // Save storage state for other tests
  await context.storageState({ path: AUTH_STATE_FILE });
});

/**
 * Generate a test JWT token
 * Note: This is for test purposes only. In production, tokens come from Passport.
 */
function generateTestToken(user: typeof TEST_USER): string {
  const header = {
    alg: 'HS256', // Using HS256 for test simplicity (production uses RS256)
    typ: 'JWT',
  };

  const payload = {
    ...user,
    iss: 'watson-test-auth',
    aud: 'watson.oceanheart.ai',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
  };

  // Base64URL encode
  const base64UrlEncode = (obj: object): string => {
    return Buffer.from(JSON.stringify(obj))
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  };

  const headerEncoded = base64UrlEncode(header);
  const payloadEncoded = base64UrlEncode(payload);

  // For test purposes, use a simple signature
  // Production would use proper RS256 signing
  const testSecret = 'watson-e2e-test-secret';
  const signature = createHmac('sha256', testSecret)
    .update(`${headerEncoded}.${payloadEncoded}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${headerEncoded}.${payloadEncoded}.${signature}`;
}

/**
 * Alternative setup for testing unauthenticated flows
 */
setup.describe.configure({ mode: 'serial' });

setup('unauthenticated state', async ({ page }) => {
  const appUrl = process.env.APP_URL || 'http://localhost:3001';
  await page.goto(appUrl);

  // Clear any existing auth
  await page.evaluate(() => {
    localStorage.removeItem('watson_auth_token');
    localStorage.removeItem('watson_user');
  });

  // Save clean state
  await page.context().storageState({ path: 'e2e/.auth/unauthenticated.json' });
});
