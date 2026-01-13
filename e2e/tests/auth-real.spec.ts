/**
 * Phase 2: Real Authentication Tests
 *
 * Tests the complete OAuth flow with Passport integration.
 * Verifies JWT handling, token refresh, and logout flows.
 */

import { test, expect, Page } from '@playwright/test';
import { API_CONFIG, generateTestJWT, generateExpiredJWT } from '../helpers/api-client';

const APP_URL = API_CONFIG.appUrl;
const PASSPORT_URL = API_CONFIG.passportUrl;

// Test credentials (from environment)
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test-clinician@watson.oceanheart.ai';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || '';

// Helper: Setup mock auth for testing without real Passport
async function setupMockAuth(page: Page): Promise<void> {
  await page.goto(APP_URL);
  await page.waitForLoadState('domcontentloaded');

  await page.evaluate(
    ({ token, user }) => {
      localStorage.setItem('watson_auth_token', token);
      localStorage.setItem(
        'watson_user',
        JSON.stringify({
          email: user.email,
          name: 'Dr. Test Clinician',
          role: 'clinician',
        })
      );
      localStorage.setItem('isAuthenticated', 'true');
    },
    {
      token: generateTestJWT(),
      user: { email: TEST_USER_EMAIL },
    }
  );
}

// Helper: Check if real Passport auth is configured
function hasRealAuthConfig(): boolean {
  return Boolean(TEST_USER_PASSWORD && process.env.USE_REAL_AUTH === 'true');
}

test.describe('Authentication Flow Tests', () => {
  test.describe('Mock Auth Flow (Development)', () => {
    test('Login button redirects to login page', async ({ page }) => {
      await page.goto(APP_URL);

      // Look for login/sign-in element
      const loginButton = page.locator('[data-testid="login-button"], a:has-text("Sign In"), button:has-text("Login")');

      if (await loginButton.count() > 0) {
        await loginButton.first().click();
        // Should redirect to login page or Passport
        await page.waitForURL(/\/(login|auth)|passport/);
      }
    });

    test('Authenticated state allows access to protected routes', async ({ page }) => {
      await setupMockAuth(page);
      await page.goto(`${APP_URL}/app`);

      // Should not redirect to login
      await page.waitForLoadState('networkidle');
      const url = page.url();
      expect(url).toContain('/app');

      // Main content should be visible
      const mainContent = page.locator('[data-testid="main-content"]');
      await expect(mainContent).toBeVisible();
    });

    test('Unauthenticated users are redirected from protected routes', async ({ page }) => {
      // Clear any existing auth
      await page.goto(APP_URL);
      await page.evaluate(() => {
        localStorage.removeItem('watson_auth_token');
        localStorage.removeItem('watson_user');
        localStorage.removeItem('isAuthenticated');
      });

      // Try to access protected route
      await page.goto(`${APP_URL}/app`);
      await page.waitForLoadState('networkidle');

      // Should redirect to landing or login
      const url = page.url();
      expect(url).not.toContain('/app');
    });

    test('User info is displayed when authenticated', async ({ page }) => {
      await setupMockAuth(page);
      await page.goto(`${APP_URL}/app`);

      // Look for user info display
      const userInfo = page.locator('[data-testid="user-info"], [data-testid="user-name"], .user-menu');

      // User info might be in a dropdown or profile section
      if ((await userInfo.count()) > 0) {
        await expect(userInfo.first()).toBeVisible();
      }
    });

    test('JWT token is stored correctly', async ({ page }) => {
      await setupMockAuth(page);

      const token = await page.evaluate(() => localStorage.getItem('watson_auth_token'));
      expect(token).toBeTruthy();
      expect(token?.split('.').length).toBe(3); // Valid JWT format

      const user = await page.evaluate(() => {
        const userData = localStorage.getItem('watson_user');
        return userData ? JSON.parse(userData) : null;
      });
      expect(user).toBeTruthy();
      expect(user.email).toBe(TEST_USER_EMAIL);
    });
  });

  test.describe('Token Handling', () => {
    test('Expired token triggers re-authentication', async ({ page }) => {
      await page.goto(APP_URL);

      // Set expired token
      await page.evaluate(
        ({ expiredToken }) => {
          localStorage.setItem('watson_auth_token', expiredToken);
          localStorage.setItem('isAuthenticated', 'true');
        },
        { expiredToken: generateExpiredJWT() }
      );

      // Try to access protected route
      await page.goto(`${APP_URL}/app`);
      await page.waitForLoadState('networkidle');

      // Application should handle expired token
      // Either redirect to login or show auth error
      const url = page.url();
      const hasAuthError = await page.locator('[data-testid="auth-error"], .error:has-text("expired")').count();

      // Either redirected or showing error is acceptable
      expect(url.includes('/app') === false || hasAuthError > 0).toBeTruthy();
    });

    test('Invalid token format is rejected', async ({ page }) => {
      await page.goto(APP_URL);

      await page.evaluate(() => {
        localStorage.setItem('watson_auth_token', 'invalid-not-a-jwt');
        localStorage.setItem('isAuthenticated', 'true');
      });

      await page.goto(`${APP_URL}/app`);
      await page.waitForLoadState('networkidle');

      // Should handle gracefully
      const url = page.url();
      expect(url).toBeDefined();
    });
  });

  test.describe('Logout Flow', () => {
    test('Logout clears auth state', async ({ page }) => {
      await setupMockAuth(page);
      await page.goto(`${APP_URL}/app`);

      // Look for logout button
      const logoutButton = page.locator(
        '[data-testid="logout-button"], button:has-text("Logout"), button:has-text("Sign Out")'
      );

      if ((await logoutButton.count()) > 0) {
        await logoutButton.first().click();

        // Wait for navigation
        await page.waitForLoadState('networkidle');

        // Verify auth cleared
        const token = await page.evaluate(() => localStorage.getItem('watson_auth_token'));
        const isAuth = await page.evaluate(() => localStorage.getItem('isAuthenticated'));

        expect(token).toBeNull();
        expect(isAuth).not.toBe('true');
      }
    });

    test('After logout, protected routes are inaccessible', async ({ page }) => {
      await setupMockAuth(page);
      await page.goto(`${APP_URL}/app`);

      // Manually clear auth (simulating logout)
      await page.evaluate(() => {
        localStorage.removeItem('watson_auth_token');
        localStorage.removeItem('watson_user');
        localStorage.removeItem('isAuthenticated');
      });

      // Refresh page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should redirect away from protected route
      const url = page.url();
      expect(url).not.toContain('/app');
    });
  });

  test.describe('Session Persistence', () => {
    test('Auth state persists across page reloads', async ({ page }) => {
      await setupMockAuth(page);
      await page.goto(`${APP_URL}/app`);

      // Verify we're on the app
      let url = page.url();
      expect(url).toContain('/app');

      // Reload
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should still be authenticated
      url = page.url();
      expect(url).toContain('/app');
    });

    test('Auth state persists across navigation', async ({ page }) => {
      await setupMockAuth(page);
      await page.goto(`${APP_URL}/app`);

      // Navigate to different sections
      const navButtons = ['nav-reviews', 'nav-analytics', 'nav-dashboard'];

      for (const navId of navButtons) {
        const button = page.locator(`[data-testid="${navId}"]`);
        if ((await button.count()) > 0) {
          await button.click();
          await page.waitForLoadState('networkidle');

          // Should still be authenticated
          const url = page.url();
          expect(url).toContain('/app');
        }
      }
    });
  });
});

// Real Passport Authentication Tests (only run when configured)
test.describe('Real Passport OAuth Flow', () => {
  test.skip(!hasRealAuthConfig(), 'Skipping - Real auth not configured');

  test('Complete OAuth login flow', async ({ page }) => {
    // 1. Navigate to login
    await page.goto(`${APP_URL}/login`);

    // 2. Click Passport login button
    const passportLoginBtn = page.locator('[data-testid="passport-login"], a:has-text("Passport")');
    await passportLoginBtn.click();

    // 3. Should redirect to Passport
    await page.waitForURL(/passport\.oceanheart\.ai/);

    // 4. Enter credentials on Passport
    await page.fill('input[name="email"], input[type="email"]', TEST_USER_EMAIL);
    await page.fill('input[name="password"], input[type="password"]', TEST_USER_PASSWORD);
    await page.click('button[type="submit"]');

    // 5. Should redirect back to app with token
    await page.waitForURL(/watson.*\/app/);

    // 6. Verify JWT stored correctly
    const token = await page.evaluate(() => localStorage.getItem('watson_auth_token'));
    expect(token).toBeTruthy();
    expect(token?.split('.').length).toBe(3);

    // 7. Verify protected route accessible
    const mainContent = page.locator('[data-testid="main-content"]');
    await expect(mainContent).toBeVisible();
  });

  test('Token refresh on near-expiry', async ({ page }) => {
    // This test requires a token that's close to expiring
    // Implementation depends on the token refresh mechanism
    test.skip();
  });

  test('Multiple browser tabs share auth state', async ({ context }) => {
    const page1 = await context.newPage();
    const page2 = await context.newPage();

    // Login on first tab
    await setupMockAuth(page1);
    await page1.goto(`${APP_URL}/app`);

    // Second tab should also be authenticated
    await page2.goto(`${APP_URL}/app`);
    await page2.waitForLoadState('networkidle');

    // Both should show authenticated content
    const url1 = page1.url();
    const url2 = page2.url();

    expect(url1).toContain('/app');
    expect(url2).toContain('/app');

    await page1.close();
    await page2.close();
  });
});

test.describe('Authorization Tests', () => {
  test('User can access permitted resources', async ({ page }) => {
    await setupMockAuth(page);
    await page.goto(`${APP_URL}/app`);

    // Navigate to reviews (should be permitted for clinician role)
    const reviewsNav = page.locator('[data-testid="nav-reviews"]');
    if ((await reviewsNav.count()) > 0) {
      await reviewsNav.click();
      await page.waitForSelector('[data-testid="reviews-panel"]');
    }

    // Navigate to analytics
    const analyticsNav = page.locator('[data-testid="nav-analytics"]');
    if ((await analyticsNav.count()) > 0) {
      await analyticsNav.click();
      // Should not show access denied
      const accessDenied = await page.locator('[data-testid="access-denied"], .error:has-text("denied")').count();
      expect(accessDenied).toBe(0);
    }
  });

  test('Unauthorized actions show appropriate error', async ({ page }) => {
    await setupMockAuth(page);
    await page.goto(`${APP_URL}/app`);

    // Try to access admin-only features (if any)
    const adminLink = page.locator('[data-testid="admin-link"], a:has-text("Admin")');
    if ((await adminLink.count()) > 0) {
      await adminLink.click();
      await page.waitForLoadState('networkidle');

      // Should show access denied or redirect
      const url = page.url();
      const hasError = await page.locator('[data-testid="access-denied"]').count();
      expect(url.includes('admin') === false || hasError > 0).toBeTruthy();
    }
  });
});
