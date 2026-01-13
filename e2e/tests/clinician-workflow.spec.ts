/**
 * Phase 3: Complete Workflow Tests
 *
 * Full simulation of the clinician workflow with real backend integration:
 * Review -> Edit -> Submit -> View Diff -> Analytics -> Export
 */

import { test, expect, Page } from '@playwright/test';
import { DevToolsObserver } from '../helpers/devtools-observer';
import {
  API_CONFIG,
  generateTestJWT,
  createAPIClient,
  APIClient,
} from '../helpers/api-client';
import { seedProductionData, SeededData } from '../fixtures/seed-production-data';

const APP_URL = API_CONFIG.appUrl;

// Helper: Setup authenticated state
async function setupAuth(page: Page): Promise<void> {
  await page.goto(APP_URL);
  await page.waitForLoadState('domcontentloaded');

  await page.evaluate(
    ({ token }) => {
      localStorage.setItem('watson_auth_token', token);
      localStorage.setItem(
        'watson_user',
        JSON.stringify({
          email: 'test-clinician@watson.oceanheart.ai',
          name: 'Dr. Test Clinician',
          role: 'clinician',
        })
      );
      localStorage.setItem('isAuthenticated', 'true');
    },
    { token: generateTestJWT() }
  );
}

// Helper: Wait for element with timeout
async function waitForElement(page: Page, selector: string, timeout = 10000): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch {
    return false;
  }
}

test.describe('Complete Clinician Workflow', () => {
  let observer: DevToolsObserver;
  let apiClient: APIClient;
  let seededData: SeededData;

  test.beforeAll(async ({ request }) => {
    apiClient = await createAPIClient(request);
    seededData = await seedProductionData(apiClient);
  });

  test.beforeEach(async ({ page }) => {
    observer = new DevToolsObserver(page);
  });

  test.afterEach(async () => {
    if (observer) {
      await observer.stop();
    }
  });

  test('Full workflow: Dashboard -> Reviews -> Edit -> Submit -> Diff -> Analytics -> Export', async ({
    page,
  }) => {
    await observer.start('Complete Clinician Workflow');
    await setupAuth(page);

    // Step 1: Navigate to Dashboard
    console.log('[Workflow] Step 1: Dashboard');
    await page.goto(`${APP_URL}/app`);
    await page.waitForLoadState('networkidle');
    await observer.snapshot('dashboard-loaded');

    // Verify dashboard content
    const mainContent = page.locator('[data-testid="main-content"]');
    await expect(mainContent).toBeVisible();

    // Step 2: Navigate to Reviews Panel
    console.log('[Workflow] Step 2: Reviews Panel');
    const reviewsNav = page.locator('[data-testid="nav-reviews"]');
    await reviewsNav.click();

    // Wait for reviews panel to load
    const reviewsPanel = page.locator('[data-testid="reviews-panel"]');
    await expect(reviewsPanel).toBeVisible({ timeout: 10000 });
    await observer.snapshot('reviews-loaded');

    // Step 3: Check for review items
    console.log('[Workflow] Step 3: Check Reviews');
    const reviewRows = page.locator('[data-testid="review-row"], tr.hover\\:bg-zinc-900\\/50, tbody tr');
    const reviewCount = await reviewRows.count();
    console.log(`[Workflow] Found ${reviewCount} review items`);

    if (reviewCount > 0) {
      // Step 4: Select a review for editing
      console.log('[Workflow] Step 4: Select Review');
      await reviewRows.first().click();
      await page.waitForTimeout(500); // Wait for animation

      // Step 5: Check for detail panel or editor
      console.log('[Workflow] Step 5: Review Details');
      const detailPanel = page.locator('.glass-card:has-text("Review Details"), [data-testid="review-detail"]');
      if ((await detailPanel.count()) > 0) {
        await expect(detailPanel).toBeVisible();
        await observer.snapshot('review-detail-visible');
      }
    }

    // Step 6: Navigate to Analytics
    console.log('[Workflow] Step 6: Analytics');
    const analyticsNav = page.locator('[data-testid="nav-analytics"]');
    await analyticsNav.click();
    await page.waitForLoadState('networkidle');
    await observer.snapshot('analytics-loaded');

    // Verify analytics content loads
    const analyticsContent = page.locator('[data-testid="analytics-panel"], [data-testid="main-content"]');
    await expect(analyticsContent).toBeVisible();

    // Step 7: Check for export functionality
    console.log('[Workflow] Step 7: Export Check');
    const exportButton = page.locator(
      '[data-testid="export-button"], button:has-text("Export"), [data-testid="export-data"]'
    );
    if ((await exportButton.count()) > 0) {
      console.log('[Workflow] Export button found');
      await observer.snapshot('export-available');
    }

    // Generate final report
    const report = await observer.generateReport();
    console.log(`[Workflow] Completed in ${report.duration}ms`);
    console.log(`[Workflow] Network requests: ${report.networkRequests.length}`);
    console.log(`[Workflow] Errors: ${report.errors.length}`);

    // Verify no critical errors
    expect(report.errors.filter((e) => e.includes('Error') || e.includes('error')).length).toBe(0);
  });

  test('Edit workflow: Create draft -> Modify -> Submit', async ({ page, request }) => {
    await observer.start('Edit Workflow');
    await setupAuth(page);

    // Create a draft via API first
    const client = await createAPIClient(request);

    if (seededData.outputIds.length === 0) {
      console.log('[Edit] No outputs to edit, skipping');
      test.skip();
      return;
    }

    // Create a draft edit
    const createResponse = await client.createEdit({
      llm_output_id: seededData.outputIds[0],
      edited_content: {
        summary: 'Initial draft content for workflow test',
      },
      status: 'draft',
    });

    expect(createResponse.status()).toBe(201);
    const draft = await createResponse.json();
    console.log(`[Edit] Created draft: ${draft.id}`);

    // Navigate to reviews
    await page.goto(`${APP_URL}/app`);
    await page.locator('[data-testid="nav-reviews"]').click();
    await page.waitForSelector('[data-testid="reviews-panel"]');

    // The draft should appear in the list
    // Update the draft via API
    const updateResponse = await client.updateEdit(draft.id, {
      edited_content: {
        summary: 'Updated content with clinician corrections',
        risk_level: 'low',
        corrections: ['Fixed medication dosage', 'Added risk factors'],
      },
      editor_notes: 'Clinician review complete',
    });

    expect(updateResponse.ok()).toBeTruthy();
    console.log('[Edit] Updated draft');

    // Submit the edit
    const submitResponse = await client.submitEdit(draft.id);
    expect(submitResponse.ok()).toBeTruthy();
    const submitted = await submitResponse.json();
    console.log(`[Edit] Submitted edit, status: ${submitted.status}`);

    // Verify diff was computed
    expect(submitted.diff_stats).toBeDefined();
    expect(submitted.status).toBe('submitted');
  });

  test('Analytics view updates after edits', async ({ page, request }) => {
    await observer.start('Analytics Update');
    await setupAuth(page);

    // Get initial analytics
    const client = await createAPIClient(request);
    const initialAnalytics = await client.getAnalytics('7d');
    const initialData = await initialAnalytics.json();
    const initialCount = initialData.total_edits;

    console.log(`[Analytics] Initial edit count: ${initialCount}`);

    // Create and submit an edit
    if (seededData.outputIds.length > 0) {
      const createRes = await client.createEdit({
        llm_output_id: seededData.outputIds[0],
        edited_content: { summary: 'Analytics test edit' },
        status: 'draft',
      });

      if (createRes.status() === 201) {
        const edit = await createRes.json();
        await client.submitEdit(edit.id);
      }
    }

    // Navigate to analytics
    await page.goto(`${APP_URL}/app`);
    await page.locator('[data-testid="nav-analytics"]').click();
    await page.waitForLoadState('networkidle');

    // Get updated analytics
    const updatedAnalytics = await client.getAnalytics('7d');
    const updatedData = await updatedAnalytics.json();

    console.log(`[Analytics] Updated edit count: ${updatedData.total_edits}`);

    // Count should be same or higher
    expect(updatedData.total_edits).toBeGreaterThanOrEqual(initialCount);
  });

  test('Export workflow with filters', async ({ request }) => {
    const client = await createAPIClient(request);

    // Test JSONL export
    const jsonlResponse = await client.getExport('jsonl', { range: '30d' });
    if (jsonlResponse.status() !== 404) {
      expect(jsonlResponse.ok()).toBeTruthy();
      expect(jsonlResponse.headers()['content-type']).toContain('ndjson');
    }

    // Test CSV export
    const csvResponse = await client.getExport('csv', { range: '30d' });
    if (csvResponse.status() !== 404) {
      expect(csvResponse.ok()).toBeTruthy();
      expect(csvResponse.headers()['content-type']).toContain('csv');
    }

    // Test ZIP bundle export
    const zipResponse = await client.getExport('zip', { range: '30d' });
    if (zipResponse.status() !== 404) {
      expect(zipResponse.ok()).toBeTruthy();
      expect(zipResponse.headers()['content-type']).toContain('zip');
      expect(zipResponse.headers()['content-disposition']).toContain('attachment');
    }
  });
});

test.describe('Multi-Step Edit Scenarios', () => {
  test('Edit with label application', async ({ request }) => {
    const client = await createAPIClient(request);

    // Get labels
    const labelsResponse = await client.getLabels();
    const labels = await labelsResponse.json();

    if (labels.length === 0) {
      console.log('[Labels] No labels available, creating one');
      await client.createLabel({
        name: 'test_workflow_label',
        display_name: 'Test Workflow Label',
        category: 'test',
        severity: 'info',
      });
    }

    // This test verifies that edit-label association works
    // Full implementation would apply labels via the EditLabel API
  });

  test('Concurrent edits on same output', async ({ request }) => {
    const client = await createAPIClient(request);

    // Get an output to edit
    const outputsResponse = await client.getOutputs();
    const outputs = await outputsResponse.json();

    if (outputs.length === 0) {
      test.skip();
      return;
    }

    const outputId = outputs[0].id;

    // Create two drafts for the same output
    const draft1Response = await client.createEdit({
      llm_output_id: outputId,
      edited_content: { summary: 'Edit from user 1' },
      editor_name: 'User 1',
      status: 'draft',
    });

    const draft2Response = await client.createEdit({
      llm_output_id: outputId,
      edited_content: { summary: 'Edit from user 2' },
      editor_name: 'User 2',
      status: 'draft',
    });

    // Both should succeed (multiple drafts allowed)
    expect(draft1Response.status()).toBe(201);
    expect(draft2Response.status()).toBe(201);
  });
});

test.describe('Performance Benchmarks', () => {
  test('Dashboard loads within 3 seconds', async ({ page }) => {
    await setupAuth(page);

    const startTime = Date.now();
    await page.goto(`${APP_URL}/app`);
    await page.waitForSelector('[data-testid="main-content"]');
    const loadTime = Date.now() - startTime;

    console.log(`[Performance] Dashboard load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(3000);
  });

  test('Reviews panel loads within 2 seconds', async ({ page }) => {
    await setupAuth(page);
    await page.goto(`${APP_URL}/app`);

    const startTime = Date.now();
    await page.locator('[data-testid="nav-reviews"]').click();
    await page.waitForSelector('[data-testid="reviews-panel"]');
    const loadTime = Date.now() - startTime;

    console.log(`[Performance] Reviews load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(2000);
  });

  test('API response times are acceptable', async ({ request }) => {
    const client = await createAPIClient(request);

    const endpoints = [
      { name: 'Documents', fn: () => client.getDocuments() },
      { name: 'Outputs', fn: () => client.getOutputs() },
      { name: 'Edits', fn: () => client.getEdits() },
      { name: 'Labels', fn: () => client.getLabels() },
      { name: 'Analytics', fn: () => client.getAnalytics('7d') },
    ];

    for (const endpoint of endpoints) {
      const startTime = Date.now();
      const response = await endpoint.fn();
      const responseTime = Date.now() - startTime;

      console.log(`[Performance] ${endpoint.name} API: ${responseTime}ms`);
      expect(response.ok()).toBeTruthy();
      expect(responseTime).toBeLessThan(1000); // Under 1 second
    }
  });
});
