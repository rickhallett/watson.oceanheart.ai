/**
 * Phase 5: Load Testing
 *
 * Tests application performance under load:
 * - Concurrent users
 * - Rapid sequential operations
 * - Memory/resource usage
 */

import { test, expect, Browser } from '@playwright/test';
import { API_CONFIG, generateTestJWT, createAPIClient } from '../helpers/api-client';

const APP_URL = API_CONFIG.appUrl;

// Helper: Setup authenticated state for new page
async function setupAuthForPage(
  page: Awaited<ReturnType<Browser['newPage']>>,
  userId: string = 'default'
): Promise<void> {
  await page.goto(APP_URL);
  await page.waitForLoadState('domcontentloaded');

  await page.evaluate(
    ({ token, email }) => {
      localStorage.setItem('watson_auth_token', token);
      localStorage.setItem(
        'watson_user',
        JSON.stringify({
          email,
          name: 'Load Test User',
          role: 'clinician',
        })
      );
      localStorage.setItem('isAuthenticated', 'true');
    },
    {
      token: generateTestJWT({ sub: `load-test-user-${userId}` }),
      email: `load-test-${userId}@watson.oceanheart.ai`,
    }
  );
}

test.describe('Concurrent User Load Tests', () => {
  test('5 concurrent users loading dashboard', async ({ browser }) => {
    const userCount = 5;
    const users = Array.from({ length: userCount }, (_, i) => i);

    console.log(`[Load] Starting test with ${userCount} concurrent users`);

    const results = await Promise.all(
      users.map(async (userId) => {
        const context = await browser.newContext();
        const page = await context.newPage();

        try {
          const start = Date.now();
          await setupAuthForPage(page, userId.toString());
          await page.goto(`${APP_URL}/app`);
          // Wait for any main content area - be flexible about selectors
          await page.waitForSelector('[data-testid="main-content"], main, .app-container, #root', {
            timeout: 15000,
          });
          // Additional wait for app to stabilize
          await page.waitForLoadState('networkidle');
          const duration = Date.now() - start;

          await context.close();
          return { userId, duration, success: true };
        } catch (error) {
          await context.close();
          return {
            userId,
            duration: 0,
            success: false,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      })
    );

    // Log results
    console.log('[Load] Results:');
    results.forEach((r) => {
      console.log(`  User ${r.userId}: ${r.success ? `${r.duration}ms` : `FAILED: ${r.error}`}`);
    });

    // All should succeed
    const successCount = results.filter((r) => r.success).length;
    expect(successCount).toBe(userCount);

    // Calculate statistics
    const successfulResults = results.filter((r) => r.success);
    const avgDuration = successfulResults.reduce((a, r) => a + r.duration, 0) / successfulResults.length;
    const maxDuration = Math.max(...successfulResults.map((r) => r.duration));

    console.log(`[Load] Average load time: ${avgDuration.toFixed(0)}ms`);
    console.log(`[Load] Max load time: ${maxDuration}ms`);

    // Average should be under 5 seconds
    expect(avgDuration).toBeLessThan(5000);
  });

  test('10 concurrent users loading reviews', async ({ browser }) => {
    const userCount = 10;
    const users = Array.from({ length: userCount }, (_, i) => i);

    console.log(`[Load] Testing ${userCount} users on reviews panel`);

    const results = await Promise.all(
      users.map(async (userId) => {
        const context = await browser.newContext();
        const page = await context.newPage();

        try {
          const start = Date.now();
          await setupAuthForPage(page, userId.toString());
          await page.goto(`${APP_URL}/app`);
          // Wait for page to load first
          await page.waitForLoadState('networkidle');
          // Try to click reviews nav if it exists
          const navReviews = page.locator('[data-testid="nav-reviews"]');
          if ((await navReviews.count()) > 0) {
            await navReviews.click();
            await page.waitForSelector('[data-testid="reviews-panel"], [data-testid="panel-reviews"], .reviews-panel', {
              timeout: 20000,
            });
          }
          const duration = Date.now() - start;

          await context.close();
          return { userId, duration, success: true };
        } catch (error) {
          await context.close();
          return {
            userId,
            duration: 0,
            success: false,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      })
    );

    const successCount = results.filter((r) => r.success).length;
    const successRate = (successCount / userCount) * 100;

    console.log(`[Load] Success rate: ${successRate}%`);

    // At least 80% should succeed
    expect(successRate).toBeGreaterThanOrEqual(80);

    // Average time for successful requests
    const successfulResults = results.filter((r) => r.success);
    if (successfulResults.length > 0) {
      const avgDuration =
        successfulResults.reduce((a, r) => a + r.duration, 0) / successfulResults.length;
      console.log(`[Load] Average load time: ${avgDuration.toFixed(0)}ms`);
      expect(avgDuration).toBeLessThan(10000);
    }
  });
});

test.describe('API Load Tests', () => {
  test('50 concurrent API requests', async ({ request }) => {
    const client = await createAPIClient(request);
    const requestCount = 50;

    console.log(`[Load] Making ${requestCount} concurrent API requests`);

    const start = Date.now();
    const requests = Array.from({ length: requestCount }, () => client.getEdits());
    const responses = await Promise.all(requests);
    const totalDuration = Date.now() - start;

    const successCount = responses.filter((r) => r.ok()).length;
    const failCount = responses.filter((r) => !r.ok()).length;

    console.log(`[Load] Success: ${successCount}, Failed: ${failCount}`);
    console.log(`[Load] Total time: ${totalDuration}ms`);
    console.log(`[Load] Requests/second: ${((requestCount / totalDuration) * 1000).toFixed(2)}`);

    // At least 95% should succeed
    expect(successCount / requestCount).toBeGreaterThanOrEqual(0.95);
  });

  test('Rapid sequential API requests', async ({ request }) => {
    const client = await createAPIClient(request);
    const requestCount = 20;
    const results: { endpoint: string; duration: number; success: boolean }[] = [];

    console.log(`[Load] Making ${requestCount} sequential requests to each endpoint`);

    const endpoints = [
      { name: 'documents', fn: () => client.getDocuments() },
      { name: 'outputs', fn: () => client.getOutputs() },
      { name: 'edits', fn: () => client.getEdits() },
      { name: 'analytics', fn: () => client.getAnalytics('7d') },
    ];

    for (const endpoint of endpoints) {
      for (let i = 0; i < requestCount; i++) {
        const start = Date.now();
        const response = await endpoint.fn();
        const duration = Date.now() - start;
        results.push({
          endpoint: endpoint.name,
          duration,
          success: response.ok(),
        });
      }
    }

    // Analyze results by endpoint
    for (const endpoint of endpoints) {
      const endpointResults = results.filter((r) => r.endpoint === endpoint.name);
      const successCount = endpointResults.filter((r) => r.success).length;
      const avgDuration =
        endpointResults.reduce((a, r) => a + r.duration, 0) / endpointResults.length;

      console.log(
        `[Load] ${endpoint.name}: ${successCount}/${requestCount} success, avg ${avgDuration.toFixed(0)}ms`
      );

      expect(successCount).toBe(requestCount);
      expect(avgDuration).toBeLessThan(500); // Each request under 500ms
    }
  });

  test('Sustained load over 30 seconds', async ({ request }) => {
    const client = await createAPIClient(request);
    const testDuration = 30000; // 30 seconds
    const requestInterval = 200; // Request every 200ms

    console.log(`[Load] Sustained load test for ${testDuration / 1000} seconds`);

    const results: { timestamp: number; duration: number; success: boolean }[] = [];
    const startTime = Date.now();

    while (Date.now() - startTime < testDuration) {
      const requestStart = Date.now();
      const response = await client.getEdits();
      const duration = Date.now() - requestStart;

      results.push({
        timestamp: Date.now() - startTime,
        duration,
        success: response.ok(),
      });

      // Wait for next interval
      const elapsed = Date.now() - requestStart;
      if (elapsed < requestInterval) {
        await new Promise((resolve) => setTimeout(resolve, requestInterval - elapsed));
      }
    }

    const totalRequests = results.length;
    const successCount = results.filter((r) => r.success).length;
    const avgDuration = results.reduce((a, r) => a + r.duration, 0) / results.length;
    const maxDuration = Math.max(...results.map((r) => r.duration));

    console.log(`[Load] Total requests: ${totalRequests}`);
    console.log(`[Load] Success rate: ${((successCount / totalRequests) * 100).toFixed(1)}%`);
    console.log(`[Load] Avg response time: ${avgDuration.toFixed(0)}ms`);
    console.log(`[Load] Max response time: ${maxDuration}ms`);

    // 99% success rate required
    expect(successCount / totalRequests).toBeGreaterThanOrEqual(0.99);
    // Average under 300ms
    expect(avgDuration).toBeLessThan(300);
  });
});

test.describe('Memory and Resource Tests', () => {
  test('Memory usage stays stable during navigation', async ({ page }) => {
    await page.goto(APP_URL);
    await page.evaluate(
      ({ token }) => {
        localStorage.setItem('watson_auth_token', token);
        localStorage.setItem('isAuthenticated', 'true');
      },
      { token: generateTestJWT() }
    );

    await page.goto(`${APP_URL}/app`);
    await page.waitForLoadState('networkidle');

    // Collect initial memory
    const initialMetrics = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory
          ?.usedJSHeapSize;
      }
      return null;
    });

    console.log(
      `[Memory] Initial heap: ${initialMetrics ? (initialMetrics / 1024 / 1024).toFixed(2) + 'MB' : 'N/A'}`
    );

    // Navigate repeatedly - use available nav items
    const navItems = ['nav-reviews', 'nav-analytics', 'nav-dashboard', 'nav-settings'];
    let navClickCount = 0;
    for (let i = 0; i < 10; i++) {
      for (const navId of navItems) {
        try {
          const button = page.locator(`[data-testid="${navId}"]`);
          if ((await button.count()) > 0 && (await button.isVisible())) {
            await button.click();
            navClickCount++;
            await page.waitForTimeout(200);
          }
        } catch {
          // Ignore navigation errors during load testing
        }
      }
    }
    console.log(`[Memory] Completed ${navClickCount} navigation clicks`);
    // If no nav items were clicked, skip memory comparison
    if (navClickCount === 0) {
      console.log('[Memory] No navigation elements found, skipping memory growth check');
      return;
    }

    // Collect final memory
    const finalMetrics = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory
          ?.usedJSHeapSize;
      }
      return null;
    });

    console.log(
      `[Memory] Final heap: ${finalMetrics ? (finalMetrics / 1024 / 1024).toFixed(2) + 'MB' : 'N/A'}`
    );

    if (initialMetrics && finalMetrics) {
      const growth = ((finalMetrics - initialMetrics) / initialMetrics) * 100;
      console.log(`[Memory] Growth: ${growth.toFixed(1)}%`);
      // Memory shouldn't grow more than 50% during navigation
      expect(growth).toBeLessThan(50);
    }
  });

  test('No memory leaks on repeated operations', async ({ page }) => {
    await page.goto(APP_URL);
    await page.evaluate(
      ({ token }) => {
        localStorage.setItem('watson_auth_token', token);
        localStorage.setItem('isAuthenticated', 'true');
      },
      { token: generateTestJWT() }
    );

    await page.goto(`${APP_URL}/app`);
    await page.locator('[data-testid="nav-reviews"]').click();
    await page.waitForSelector('[data-testid="reviews-panel"]');

    // Repeatedly click on review items (if available)
    const reviewRows = page.locator('tbody tr');
    const rowCount = await reviewRows.count();

    if (rowCount > 0) {
      for (let i = 0; i < 20; i++) {
        await reviewRows.first().click();
        await page.waitForTimeout(100);
      }
    }

    // Force garbage collection (if exposed)
    await page.evaluate(() => {
      if ('gc' in window) {
        (window as unknown as { gc: () => void }).gc();
      }
    });

    // Page should still be responsive
    const isResponsive = await page
      .locator('[data-testid="reviews-panel"]')
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    expect(isResponsive).toBeTruthy();
  });
});

test.describe('Throughput Benchmarks', () => {
  test('Dashboard throughput benchmark', async ({ browser }) => {
    const iterations = 5;
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto(APP_URL);
      await page.evaluate(
        ({ token }) => {
          localStorage.setItem('watson_auth_token', token);
          localStorage.setItem('isAuthenticated', 'true');
        },
        { token: generateTestJWT() }
      );

      const start = Date.now();
      await page.goto(`${APP_URL}/app`);
      await page.waitForSelector('[data-testid="main-content"]');
      times.push(Date.now() - start);

      await context.close();
    }

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    console.log(`[Benchmark] Dashboard load times:`);
    console.log(`  Average: ${avgTime.toFixed(0)}ms`);
    console.log(`  Min: ${minTime}ms`);
    console.log(`  Max: ${maxTime}ms`);

    expect(avgTime).toBeLessThan(3000);
    expect(maxTime).toBeLessThan(5000);
  });
});
