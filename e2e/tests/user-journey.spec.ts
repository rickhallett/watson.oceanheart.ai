/**
 * Watson E2E User Journey Test Suite
 *
 * Comprehensive end-to-end simulation of a clinician's complete workflow:
 * 1. Landing page experience
 * 2. Authentication via Passport
 * 3. Dashboard overview
 * 4. Navigate to Reviews panel
 * 5. Select and review an LLM output
 * 6. Edit content in TipTap editor
 * 7. Apply classification labels
 * 8. Submit the review
 * 9. View the diff
 * 10. Check analytics
 * 11. Export data
 *
 * Uses Chrome DevTools Protocol for enhanced observability.
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';
import { DevToolsObserver, collectAccessibilitySnapshot } from '../helpers/devtools-observer';
import { testDocuments, testLabels } from '../fixtures/seed-data';

// Test configuration
const config = {
  apiUrl: process.env.API_URL || 'http://localhost:8001',
  appUrl: process.env.APP_URL || 'http://localhost:3001',
  // Test user credentials (use test auth in development)
  testUser: {
    email: 'test-clinician@watson.oceanheart.ai',
    name: 'Dr. Test Clinician',
    role: 'clinician',
  },
  // Delays for realistic UX simulation
  humanDelay: {
    typing: 50,   // ms per character
    reading: 500, // ms for reading content
    thinking: 1000, // ms for decision making
    interaction: 200, // ms between interactions
  },
};

// Helper: Simulate human-like typing
async function humanType(page: Page, selector: string, text: string): Promise<void> {
  await page.click(selector);
  await page.keyboard.type(text, { delay: config.humanDelay.typing });
}

// Helper: Wait for human reading time
async function humanRead(page: Page, multiplier: number = 1): Promise<void> {
  await page.waitForTimeout(config.humanDelay.reading * multiplier);
}

// Helper: Simulate thinking/decision time
async function humanThink(page: Page): Promise<void> {
  await page.waitForTimeout(config.humanDelay.thinking);
}

// Helper: Setup authentication by navigating first, then setting localStorage
async function setupAuth(page: Page, targetPath: string = '/app'): Promise<void> {
  // First navigate to establish domain context (needed for localStorage access)
  await page.goto(config.appUrl);
  await page.waitForLoadState('domcontentloaded');

  // Now we can access localStorage on the correct domain
  // Set both the JWT token and the isAuthenticated flag that ProtectedRoute checks
  await page.evaluate((user) => {
    localStorage.setItem('watson_auth_token', 'test-jwt-token');
    localStorage.setItem('watson_user', JSON.stringify(user));
    localStorage.setItem('isAuthenticated', 'true'); // Required by ProtectedRoute
  }, config.testUser);

  // Navigate to the target path
  await page.goto(`${config.appUrl}${targetPath}`);
  await page.waitForLoadState('networkidle');
}

test.describe('Watson Clinical Review - Complete User Journey', () => {
  let observer: DevToolsObserver;

  test.beforeEach(async ({ page }) => {
    observer = new DevToolsObserver(page);
  });

  test.afterEach(async () => {
    if (observer) {
      await observer.stop();
    }
  });

  test('Phase 1: Landing Page Experience', async ({ page }) => {
    await observer.start('Landing Page Experience');

    // Navigate to landing page
    await page.goto(config.appUrl);
    await observer.snapshot('initial-load');

    // Verify landing page elements
    await expect(page).toHaveTitle(/Watson/);

    // Check for hero section
    const hero = page.locator('[data-testid="hero"], .hero, h1').first();
    await expect(hero).toBeVisible({ timeout: 10000 });

    // Check for call-to-action
    const ctaButton = page.locator('button:has-text("Get Started"), button:has-text("Login"), a:has-text("Get Started")').first();
    await expect(ctaButton).toBeVisible();

    await humanRead(page, 2);
    await observer.snapshot('after-hero-read');

    // Landing page uses div-based layout, check for any navigation or interactive element
    const interactiveElements = page.locator('button, a, [role="button"]');
    const count = await interactiveElements.count();
    console.log(`Found ${count} interactive elements on landing page`);
    expect(count).toBeGreaterThan(0);

    // Take accessibility snapshot
    const a11ySnapshot = await collectAccessibilitySnapshot(page);
    console.log('Landing page accessibility:', JSON.stringify(a11ySnapshot, null, 2).slice(0, 500));

    // Click CTA to proceed to login
    await ctaButton.click();
    await page.waitForURL(/\/(login|auth|app)/, { timeout: 10000 });

    await observer.snapshot('navigated-to-login');
  });

  test('Phase 2: Authentication Flow', async ({ page }) => {
    await observer.start('Authentication Flow');

    // Navigate to login
    await page.goto(`${config.appUrl}/login`);
    await observer.snapshot('login-page-loaded');

    // Check login page elements
    const loginForm = page.locator('form, [data-testid="login-form"], .login-container').first();
    await expect(loginForm).toBeVisible({ timeout: 10000 });

    // Look for Passport OAuth button or login form
    const passportButton = page.locator('button:has-text("Sign in"), button:has-text("Login"), button:has-text("Passport")').first();
    const emailInput = page.locator('input[type="email"], input[name="email"]');

    if (await emailInput.isVisible()) {
      // If there's an email form, fill it
      await humanType(page, 'input[type="email"], input[name="email"]', config.testUser.email);
      await humanThink(page);
    }

    // In test environment, we may need to mock the auth
    // For this simulation, we'll set a mock token
    await page.evaluate((user) => {
      // Simulate successful authentication
      localStorage.setItem('watson_auth_token', 'test-jwt-token');
      localStorage.setItem('watson_user', JSON.stringify(user));
      localStorage.setItem('isAuthenticated', 'true'); // Required by ProtectedRoute
    }, config.testUser);

    await observer.snapshot('auth-completed');

    // Navigate to dashboard after auth
    await page.goto(`${config.appUrl}/app`);
    await page.waitForLoadState('networkidle');

    // Dashboard should be visible after auth (main content area)
    const dashboard = page.locator('[data-testid="main-content"], main, [data-testid="dashboard"]').first();
    await expect(dashboard).toBeVisible({ timeout: 10000 });

    await observer.snapshot('dashboard-visible');
  });

  test('Phase 3: Dashboard Overview', async ({ page }) => {
    await observer.start('Dashboard Overview');

    // Setup auth (navigates to app first, then sets localStorage)
    await setupAuth(page, '/app');
    await observer.snapshot('dashboard-loaded');

    // Wait for dashboard content
    await humanRead(page, 2);

    // Check for stat cards
    const statCards = page.locator('[data-testid="stat-card"], .stat-card, .metric-card');
    const cardCount = await statCards.count();
    console.log(`Found ${cardCount} stat cards on dashboard`);

    // Verify key metrics are displayed
    const metricsTexts = [
      'Assessments', 'Reviews', 'Edit Rate', 'Active', 'Pending'
    ];

    for (const text of metricsTexts) {
      const metric = page.locator(`text=${text}`).first();
      if (await metric.isVisible()) {
        console.log(`Found metric: ${text}`);
      }
    }

    await observer.snapshot('metrics-inspected');

    // Look for sidebar navigation
    const sidebar = page.locator('[data-testid="sidebar"], aside, .sidebar').first();
    if (await sidebar.isVisible()) {
      console.log('Sidebar navigation is visible');

      // Check navigation items
      const navItems = await sidebar.locator('button, a, [role="menuitem"]').all();
      console.log(`Found ${navItems.length} navigation items`);
    }

    // Check for welcome message or quick actions
    const welcomeCard = page.locator('[data-testid="welcome-card"], .welcome, h2:has-text("Welcome")').first();
    if (await welcomeCard.isVisible()) {
      await humanRead(page);
    }

    await observer.snapshot('dashboard-exploration-complete');
  });

  test('Phase 4: Navigate to Reviews Panel', async ({ page }) => {
    await observer.start('Reviews Navigation');

    // Setup auth (navigates to app first, then sets localStorage)
    await setupAuth(page, '/app');

    // Wait for the page to be fully interactive
    await page.waitForTimeout(1000);

    // Find and click Reviews navigation - prioritize data-testid which works even on mobile with collapsed sidebar
    const reviewsNav = page.locator('[data-testid="nav-reviews"]').first();
    await expect(reviewsNav).toBeVisible({ timeout: 10000 });

    await humanThink(page);
    await reviewsNav.click({ force: true }); // Force click in case of overlays

    await observer.snapshot('reviews-clicked');

    // Wait for reviews panel to load
    await page.waitForTimeout(1000);

    // Check for reviews panel (accepts loading, empty, or populated state)
    const reviewsPanel = page.locator('[data-testid="reviews-panel"], [data-testid="reviews-header"]').first();
    await expect(reviewsPanel).toBeVisible({ timeout: 10000 });

    // Log current state for debugging
    const headerText = await page.locator('[data-testid="reviews-header"], h1:has-text("Review")').first().textContent();
    console.log(`Reviews panel loaded with header: ${headerText}`);

    await observer.snapshot('reviews-panel-loaded');

    // Count review items
    const reviewItems = page.locator('[data-testid="review-item"], .review-card, tr[data-id]');
    const itemCount = await reviewItems.count();
    console.log(`Found ${itemCount} review items`);

    // Check for filters
    const filterControls = page.locator('[data-testid="filter"], select, .filter-dropdown').first();
    if (await filterControls.isVisible()) {
      console.log('Filter controls available');
    }

    await humanRead(page);
    await observer.snapshot('reviews-inspection-complete');
  });

  test('Phase 5: Select and Review LLM Output', async ({ page }) => {
    await observer.start('Review Selection');

    // Setup auth
    await setupAuth(page, '/app');

    // Navigate to reviews
    const reviewsNav = page.locator('button:has-text("Reviews"), a:has-text("Reviews")').first();
    if (await reviewsNav.isVisible()) {
      await reviewsNav.click();
      await page.waitForTimeout(500);
    }

    await observer.snapshot('in-reviews-panel');

    // Select first available review
    const firstReview = page.locator('[data-testid="review-item"], .review-card, tr[data-id]').first();

    if (await firstReview.isVisible()) {
      await humanThink(page);
      await firstReview.click();

      await observer.snapshot('review-selected');

      // Wait for review detail to load
      await page.waitForTimeout(1000);

      // Check for review content display
      const reviewContent = page.locator('[data-testid="review-content"], .review-detail, .output-content').first();
      if (await reviewContent.isVisible()) {
        const content = await reviewContent.textContent();
        console.log(`Review content preview: ${content?.slice(0, 200)}...`);
      }

      await humanRead(page, 3); // Clinician reads the content

    } else {
      console.log('No review items available - testing with mock data scenario');
    }

    await observer.snapshot('review-inspection-complete');
  });

  test('Phase 6: Edit Content in TipTap Editor', async ({ page }) => {
    await observer.start('Content Editing');

    // Setup auth
    await setupAuth(page, '/app');

    await observer.snapshot('before-editor');

    // Look for editor component
    const editor = page.locator('[data-testid="tiptap-editor"], .tiptap, .ProseMirror, [contenteditable="true"]').first();

    if (await editor.isVisible({ timeout: 5000 })) {
      console.log('TipTap editor found');

      // Wait for any animations to complete
      await page.waitForTimeout(500);

      // Focus on editor - use force click to handle any overlays
      await editor.click({ force: true });
      await observer.snapshot('editor-focused');

      // Get current content
      const initialContent = await editor.textContent();
      console.log(`Initial content length: ${initialContent?.length || 0} characters`);

      // Simulate clinician making edits
      // 1. Select all and observe
      await page.keyboard.press('Meta+a');
      await humanThink(page);

      // 2. Type new content at the end
      await page.keyboard.press('End');
      await page.keyboard.press('Enter');
      await page.keyboard.press('Enter');

      const editText = '[Clinical Review Note] This summary has been reviewed and verified by the clinical team. ';
      await page.keyboard.type(editText, { delay: config.humanDelay.typing });

      await observer.snapshot('after-typing');

      // 3. Test toolbar interactions
      const toolbar = page.locator('[data-testid="editor-toolbar"], .toolbar, .tiptap-toolbar').first();
      if (await toolbar.isVisible()) {
        // Click bold button
        const boldButton = toolbar.locator('button[title*="Bold"], button:has([data-lucide="bold"])').first();
        if (await boldButton.isVisible()) {
          await boldButton.click();
          await page.keyboard.type('Important: ', { delay: config.humanDelay.typing });
          await boldButton.click(); // Toggle off
        }
      }

      await observer.snapshot('formatting-applied');

      // Verify content changed
      const finalContent = await editor.textContent();
      expect(finalContent?.length).toBeGreaterThan(initialContent?.length || 0);
      console.log(`Final content length: ${finalContent?.length || 0} characters`);

    } else {
      console.log('Editor not immediately visible - may need to open a review first');

      // Try to find any editable area
      const editableArea = page.locator('[contenteditable="true"]').first();
      if (await editableArea.isVisible({ timeout: 3000 })) {
        console.log('Found alternative editable area');
      }
    }

    await observer.snapshot('editing-complete');
  });

  test('Phase 7: Apply Classification Labels', async ({ page }) => {
    await observer.start('Label Application');

    // Setup auth
    await setupAuth(page, '/app');

    await observer.snapshot('before-labeling');

    // Look for label controls
    const labelSelectors = [
      '[data-testid="label-selector"]',
      '.label-picker',
      '[data-testid="classification-labels"]',
      'button:has-text("Add Label")',
      '.badge-selector',
    ];

    let labelControl = null;
    for (const selector of labelSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 2000 })) {
        labelControl = element;
        break;
      }
    }

    if (labelControl) {
      console.log('Label control found');
      await humanThink(page);
      await labelControl.click();

      await observer.snapshot('label-dropdown-opened');

      // Look for label options
      const labelOptions = page.locator('[data-testid="label-option"], .label-option, [role="option"]');
      const optionCount = await labelOptions.count();
      console.log(`Found ${optionCount} label options`);

      if (optionCount > 0) {
        // Select a label (e.g., "Hallucination" or first available)
        const hallucination = page.locator('text=Hallucination').first();
        if (await hallucination.isVisible()) {
          await hallucination.click();
          console.log('Selected "Hallucination" label');
        } else {
          await labelOptions.first().click();
          console.log('Selected first available label');
        }
      }

      await observer.snapshot('label-applied');
    } else {
      console.log('Label controls not visible in current view');

      // Check if labels are shown as badges
      const badges = page.locator('.badge, [data-testid="label-badge"]');
      const badgeCount = await badges.count();
      console.log(`Found ${badgeCount} existing label badges`);
    }

    await observer.snapshot('labeling-complete');
  });

  test('Phase 8: Submit Review', async ({ page }) => {
    await observer.start('Review Submission');

    // Setup auth
    await setupAuth(page, '/app');

    await observer.snapshot('before-submit');

    // Look for submit button
    const submitSelectors = [
      'button:has-text("Submit")',
      'button:has-text("Submit Review")',
      'button:has-text("Complete")',
      '[data-testid="submit-button"]',
      'button[type="submit"]',
    ];

    let submitButton = null;
    for (const selector of submitSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 2000 })) {
        submitButton = element;
        console.log(`Found submit button: ${selector}`);
        break;
      }
    }

    if (submitButton) {
      await humanThink(page);

      // Check if button is enabled
      const isDisabled = await submitButton.isDisabled();
      if (isDisabled) {
        console.log('Submit button is disabled - may need to make edits first');
      } else {
        // Click submit
        await submitButton.click();
        await observer.snapshot('submit-clicked');

        // Wait for response
        await page.waitForTimeout(2000);

        // Check for success message
        const successIndicators = [
          'text=submitted',
          'text=success',
          'text=complete',
          '.toast-success',
          '[data-testid="success-message"]',
        ];

        for (const indicator of successIndicators) {
          const element = page.locator(indicator).first();
          if (await element.isVisible({ timeout: 3000 })) {
            console.log('Submission success indicated');
            break;
          }
        }
      }
    } else {
      console.log('Submit button not found - may need to be in edit mode');
    }

    await observer.snapshot('submission-complete');
  });

  test('Phase 9: View Diff', async ({ page }) => {
    await observer.start('Diff Viewing');

    // Setup auth
    await setupAuth(page, '/app');

    await observer.snapshot('before-diff');

    // Navigate to a submitted review to see diff
    const reviewsNav = page.locator('button:has-text("Reviews"), a:has-text("Reviews")').first();
    if (await reviewsNav.isVisible()) {
      await reviewsNav.click();
      await page.waitForTimeout(500);
    }

    // Look for diff button or submitted review
    const diffSelectors = [
      'button:has-text("View Diff")',
      'button:has-text("Show Changes")',
      '[data-testid="diff-button"]',
      '.diff-viewer',
      '[data-status="submitted"]',
    ];

    for (const selector of diffSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 2000 })) {
        console.log(`Found diff element: ${selector}`);
        await element.click();
        break;
      }
    }

    await observer.snapshot('diff-opened');

    // Check for diff visualization
    const diffVisualization = page.locator('[data-testid="diff-view"], .diff-container, .diff-viewer').first();
    if (await diffVisualization.isVisible({ timeout: 5000 })) {
      console.log('Diff visualization loaded');

      // Look for additions/deletions indicators
      const additions = page.locator('.diff-add, .addition, [data-change="add"]');
      const deletions = page.locator('.diff-remove, .deletion, [data-change="remove"]');

      const addCount = await additions.count();
      const delCount = await deletions.count();

      console.log(`Diff shows ${addCount} additions and ${delCount} deletions`);
    }

    await humanRead(page, 2);
    await observer.snapshot('diff-inspection-complete');
  });

  test('Phase 10: Analytics Dashboard', async ({ page }) => {
    await observer.start('Analytics Dashboard');

    // Setup auth
    await setupAuth(page, '/app');

    await observer.snapshot('before-analytics');

    // Navigate to analytics
    const analyticsNav = page.locator('button:has-text("Analytics"), a:has-text("Analytics"), [data-testid="nav-analytics"]').first();
    if (await analyticsNav.isVisible({ timeout: 5000 })) {
      await analyticsNav.click();
      await page.waitForTimeout(1000);

      await observer.snapshot('analytics-clicked');
    }

    // Check for analytics content
    const analyticsPanel = page.locator('[data-testid="analytics-panel"], .analytics, .analytics-dashboard').first();
    if (await analyticsPanel.isVisible({ timeout: 5000 })) {
      console.log('Analytics panel loaded');

      // Look for charts/graphs
      const charts = page.locator('canvas, svg.chart, [data-testid="chart"]');
      const chartCount = await charts.count();
      console.log(`Found ${chartCount} chart elements`);

      // Check for time range selector
      const timeRange = page.locator('[data-testid="time-range"], select:has-text("days"), button:has-text("7d")').first();
      if (await timeRange.isVisible()) {
        console.log('Time range selector available');

        // Try different time ranges
        await timeRange.click();
        await page.waitForTimeout(500);
      }

      // Look for key metrics
      const metricLabels = ['Total Edits', 'Edit Rate', 'Common Labels', 'Model Performance'];
      for (const label of metricLabels) {
        const metric = page.locator(`text=${label}`).first();
        if (await metric.isVisible({ timeout: 1000 })) {
          console.log(`Found metric: ${label}`);
        }
      }
    }

    await humanRead(page, 3);
    await observer.snapshot('analytics-exploration-complete');
  });

  test('Phase 11: Export Data', async ({ page }) => {
    await observer.start('Data Export');

    // Setup auth
    await setupAuth(page, '/app');

    await observer.snapshot('before-export');

    // Look for export functionality
    const exportSelectors = [
      'button:has-text("Export")',
      '[data-testid="export-button"]',
      'a:has-text("Download")',
      '.export-menu',
    ];

    let exportButton = null;
    for (const selector of exportSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 2000 })) {
        exportButton = element;
        console.log(`Found export element: ${selector}`);
        break;
      }
    }

    if (exportButton) {
      await humanThink(page);
      await exportButton.click();

      await observer.snapshot('export-menu-opened');

      // Look for format options
      const formats = ['JSONL', 'CSV', 'JSON', 'ZIP'];
      for (const format of formats) {
        const option = page.locator(`text=${format}`).first();
        if (await option.isVisible({ timeout: 1000 })) {
          console.log(`Export format available: ${format}`);
        }
      }

      // Set up download listener
      const [download] = await Promise.race([
        Promise.all([
          page.waitForEvent('download', { timeout: 10000 }),
          page.locator('button:has-text("JSONL"), [data-format="jsonl"]').first().click(),
        ]),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Download timeout')), 10000)
        ),
      ]).catch(() => [null]);

      if (download) {
        console.log(`Download started: ${download.suggestedFilename()}`);
        await observer.snapshot('download-started');
      }
    } else {
      console.log('Export button not found in current view');

      // Check analytics panel for export
      const analyticsNav = page.locator('button:has-text("Analytics")').first();
      if (await analyticsNav.isVisible()) {
        await analyticsNav.click();
        await page.waitForTimeout(1000);

        const analyticsExport = page.locator('[data-testid="analytics-export"], button:has-text("Export")').first();
        if (await analyticsExport.isVisible()) {
          console.log('Export available in analytics panel');
        }
      }
    }

    await observer.snapshot('export-complete');
  });

  test('Full Journey Integration Test', async ({ page }) => {
    await observer.start('Full User Journey');

    console.log('\n=== WATSON FULL USER JOURNEY TEST ===\n');

    // Phase 1: Landing
    console.log('Step 1: Loading landing page...');
    await page.goto(config.appUrl);
    await page.waitForLoadState('networkidle');
    await observer.snapshot('step-1-landing');

    // Setup auth (now that we're on the app domain)
    await page.evaluate((user) => {
      localStorage.setItem('watson_auth_token', 'test-jwt-token');
      localStorage.setItem('watson_user', JSON.stringify(user));
      localStorage.setItem('isAuthenticated', 'true'); // Required by ProtectedRoute
    }, config.testUser);

    // Phase 2: Navigate to app
    console.log('Step 2: Navigating to application...');
    await page.goto(`${config.appUrl}/app`);
    await page.waitForLoadState('networkidle');
    await observer.snapshot('step-2-app');

    // Phase 3: Dashboard exploration
    console.log('Step 3: Exploring dashboard...');
    await humanRead(page, 2);
    await observer.snapshot('step-3-dashboard');

    // Phase 4: Reviews panel
    console.log('Step 4: Opening reviews panel...');
    const reviewsNav = page.locator('button:has-text("Reviews"), a:has-text("Reviews")').first();
    if (await reviewsNav.isVisible({ timeout: 5000 })) {
      await reviewsNav.click();
      await page.waitForTimeout(1000);
    }
    await observer.snapshot('step-4-reviews');

    // Phase 5: Editor interaction
    console.log('Step 5: Interacting with editor...');
    const editor = page.locator('[contenteditable="true"], .ProseMirror').first();
    if (await editor.isVisible({ timeout: 5000 })) {
      await editor.click();
      await page.keyboard.type('Test edit from E2E suite. ', { delay: 30 });
    }
    await observer.snapshot('step-5-editor');

    // Phase 6: Analytics
    console.log('Step 6: Checking analytics...');
    const analyticsNav = page.locator('button:has-text("Analytics")').first();
    if (await analyticsNav.isVisible({ timeout: 5000 })) {
      await analyticsNav.click();
      await page.waitForTimeout(1000);
    }
    await observer.snapshot('step-6-analytics');

    // Phase 7: Final state
    console.log('Step 7: Capturing final state...');
    await humanRead(page);

    // Generate final report
    const report = await observer.generateReport();
    console.log('\n=== JOURNEY COMPLETE ===');
    console.log(`Total duration: ${report.duration}ms`);
    console.log(`Network requests: ${report.networkRequests.length}`);
    console.log(`Console errors: ${report.errors.length}`);

    // Assertions
    expect(report.errors.length).toBeLessThan(5); // Allow some non-critical errors
    expect(report.networkRequests.length).toBeGreaterThan(0); // Should have made API calls

    await observer.snapshot('step-7-final');
  });
});

// Performance-focused test
test.describe('Performance Observability', () => {
  test('Measure key performance metrics', async ({ page }) => {
    const observer = new DevToolsObserver(page);
    await observer.start('Performance Measurement');

    // First navigate to establish domain context for localStorage
    await page.goto(config.appUrl);
    await page.waitForLoadState('domcontentloaded');

    // Setup auth
    await page.evaluate((user) => {
      localStorage.setItem('watson_auth_token', 'test-jwt-token');
      localStorage.setItem('watson_user', JSON.stringify(user));
      localStorage.setItem('isAuthenticated', 'true'); // Required by ProtectedRoute
    }, config.testUser);

    // Measure initial load of app page
    const startTime = Date.now();
    await page.goto(`${config.appUrl}/app`);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    console.log(`Initial load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds

    // Collect Web Vitals
    const vitals = await observer.collectWebVitals();
    console.log('Web Vitals:', vitals);

    // FCP should be under 2.5s (good threshold)
    if (vitals.fcp) {
      expect(vitals.fcp).toBeLessThan(2500);
    }

    // CLS should be under 0.1 (good threshold)
    if (vitals.cls !== undefined) {
      expect(vitals.cls).toBeLessThan(0.1);
    }

    await observer.stop();
  });
});

// Accessibility test
test.describe('Accessibility', () => {
  test('Check accessibility compliance', async ({ page }) => {
    // First navigate to establish domain context for localStorage
    await page.goto(config.appUrl);
    await page.waitForLoadState('domcontentloaded');

    // Setup auth
    await page.evaluate((user) => {
      localStorage.setItem('watson_auth_token', 'test-jwt-token');
      localStorage.setItem('watson_user', JSON.stringify(user));
      localStorage.setItem('isAuthenticated', 'true'); // Required by ProtectedRoute
    }, config.testUser);

    // Navigate to app
    await page.goto(`${config.appUrl}/app`);
    await page.waitForLoadState('networkidle');

    // Collect accessibility tree
    const a11ySnapshot = await collectAccessibilitySnapshot(page);
    console.log('Accessibility tree collected:', JSON.stringify(a11ySnapshot).slice(0, 1000));

    // Basic accessibility checks
    // 1. Check for skip link
    const skipLink = page.locator('a[href="#main"], [data-testid="skip-link"]');

    // 2. Check for proper heading structure
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1); // Should have at least one h1

    // 3. Check for alt text on images
    const imagesWithoutAlt = await page.locator('img:not([alt])').count();
    expect(imagesWithoutAlt).toBe(0); // All images should have alt text

    // 4. Check for button labels - count buttons and check if they have accessible names
    const allButtons = await page.locator('button').all();
    let buttonsWithoutText = 0;
    for (const button of allButtons) {
      const hasAriaLabel = await button.getAttribute('aria-label');
      const innerText = await button.innerText();
      if (!hasAriaLabel && !innerText.trim()) {
        buttonsWithoutText++;
      }
    }
    console.log(`Buttons without accessible text: ${buttonsWithoutText}`);

    // 5. Check color contrast (basic check for text visibility)
    const bodyText = page.locator('body');
    const computedStyle = await bodyText.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        color: style.color,
        backgroundColor: style.backgroundColor,
      };
    });
    console.log('Body styling:', computedStyle);
  });
});
