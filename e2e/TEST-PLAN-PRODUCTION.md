# Watson Production Readiness Test Plan

**Goal:** Increase confidence from 55-65% to 85%+ for paying customers.

**Current State:** E2E UI tests pass with mocked auth. Backend integration untested.

---

## Phase 1: Backend Integration Tests (Priority: Critical)

### 1.1 API Contract Tests

Verify all API endpoints return expected responses with real authentication.

```typescript
// e2e/tests/api-integration.spec.ts

test.describe('API Integration', () => {
  let authToken: string;

  test.beforeAll(async () => {
    // Get real JWT from test auth server
    authToken = await getTestAuthToken();
  });

  test('GET /api/documents/ returns document list', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/documents/`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
  });

  test('GET /api/outputs/ returns LLM outputs', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/outputs/`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    expect(response.ok()).toBeTruthy();
  });

  test('POST /api/edits/ creates new edit', async ({ request }) => {
    const response = await request.post(`${API_URL}/api/edits/`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        llm_output: TEST_OUTPUT_ID,
        edited_content: { summary: 'Test edit' },
        status: 'draft'
      }
    });
    expect(response.status()).toBe(201);
  });

  test('POST /api/edits/:id/submit/ computes diffs', async ({ request }) => {
    const response = await request.post(`${API_URL}/api/edits/${TEST_EDIT_ID}/submit/`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.token_diff).toBeDefined();
    expect(data.structural_diff).toBeDefined();
    expect(data.diff_stats).toBeDefined();
  });

  test('GET /api/analytics/ returns aggregated data', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/analytics/?range=30d`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.total_edits).toBeDefined();
    expect(data.edits_by_status).toBeDefined();
  });

  test('GET /api/exports/ downloads data', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/exports/?format=jsonl`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    expect(response.ok()).toBeTruthy();
    expect(response.headers()['content-type']).toContain('application/x-ndjson');
  });
});
```

### 1.2 Database State Tests

Verify data persists correctly through the workflow.

```typescript
test.describe('Data Persistence', () => {
  test('Edit lifecycle: draft → submit → approved', async ({ request }) => {
    // 1. Create draft edit
    const createRes = await request.post(`${API_URL}/api/edits/`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { llm_output: outputId, edited_content: content, status: 'draft' }
    });
    const edit = await createRes.json();
    expect(edit.status).toBe('draft');

    // 2. Update edit content
    const updateRes = await request.patch(`${API_URL}/api/edits/${edit.id}/`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { edited_content: updatedContent }
    });
    expect(updateRes.ok()).toBeTruthy();

    // 3. Submit edit (triggers diff computation)
    const submitRes = await request.post(`${API_URL}/api/edits/${edit.id}/submit/`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const submitted = await submitRes.json();
    expect(submitted.status).toBe('submitted');
    expect(submitted.diff_stats.change_rate).toBeGreaterThan(0);

    // 4. Verify edit appears in list
    const listRes = await request.get(`${API_URL}/api/edits/?status=submitted`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const edits = await listRes.json();
    expect(edits.some(e => e.id === edit.id)).toBeTruthy();
  });
});
```

---

## Phase 2: Real Authentication Tests (Priority: Critical)

### 2.1 Passport OAuth Flow

Test the complete OAuth flow with real Passport server.

```typescript
// e2e/tests/auth-real.spec.ts

test.describe('Real Passport Authentication', () => {
  test('Complete OAuth login flow', async ({ page, context }) => {
    // 1. Navigate to login
    await page.goto(`${APP_URL}/login`);

    // 2. Click Passport login button
    await page.click('[data-testid="passport-login"]');

    // 3. Should redirect to Passport
    await page.waitForURL(/passport\.oceanheart\.ai/);

    // 4. Enter test credentials on Passport
    await page.fill('input[name="email"]', TEST_USER_EMAIL);
    await page.fill('input[name="password"]', TEST_USER_PASSWORD);
    await page.click('button[type="submit"]');

    // 5. Should redirect back to app with token
    await page.waitForURL(/watson\.oceanheart\.ai\/app/);

    // 6. Verify JWT stored correctly
    const token = await page.evaluate(() => localStorage.getItem('watson_auth_token'));
    expect(token).toBeTruthy();
    expect(token.split('.').length).toBe(3); // Valid JWT format

    // 7. Verify protected route accessible
    const mainContent = page.locator('[data-testid="main-content"]');
    await expect(mainContent).toBeVisible();
  });

  test('Token refresh on expiry', async ({ page }) => {
    // Set expired token
    await page.evaluate(() => {
      const expiredToken = createExpiredJWT();
      localStorage.setItem('watson_auth_token', expiredToken);
    });

    await page.goto(`${APP_URL}/app`);

    // Should trigger refresh or redirect to login
    await page.waitForURL(/\/(login|app)/);

    // If redirected to login, token should be cleared
    // If stayed on app, token should be refreshed
  });

  test('Logout clears auth state', async ({ page }) => {
    // Setup authenticated state
    await setupRealAuth(page);
    await page.goto(`${APP_URL}/app`);

    // Click logout
    await page.click('[data-testid="logout-button"]');

    // Verify redirected to landing
    await page.waitForURL(`${APP_URL}/`);

    // Verify localStorage cleared
    const token = await page.evaluate(() => localStorage.getItem('watson_auth_token'));
    expect(token).toBeNull();

    // Verify protected route redirects
    await page.goto(`${APP_URL}/app`);
    await page.waitForURL(`${APP_URL}/`);
  });
});
```

### 2.2 JWT Verification Tests

Test that backend correctly validates JWTs.

```typescript
test.describe('JWT Verification', () => {
  test('Valid JWT allows access', async ({ request }) => {
    const token = await getRealPassportToken();
    const response = await request.get(`${API_URL}/api/edits/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(response.ok()).toBeTruthy();
  });

  test('Expired JWT returns 401', async ({ request }) => {
    const expiredToken = createExpiredJWT();
    const response = await request.get(`${API_URL}/api/edits/`, {
      headers: { Authorization: `Bearer ${expiredToken}` }
    });
    expect(response.status()).toBe(401);
  });

  test('Invalid signature returns 401', async ({ request }) => {
    const tamperedToken = tamperJWTSignature(validToken);
    const response = await request.get(`${API_URL}/api/edits/`, {
      headers: { Authorization: `Bearer ${tamperedToken}` }
    });
    expect(response.status()).toBe(401);
  });

  test('Missing token returns 401', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/edits/`);
    expect(response.status()).toBe(401);
  });

  test('Wrong issuer returns 401', async ({ request }) => {
    const wrongIssuerToken = createJWTWithIssuer('https://evil.com');
    const response = await request.get(`${API_URL}/api/edits/`, {
      headers: { Authorization: `Bearer ${wrongIssuerToken}` }
    });
    expect(response.status()).toBe(401);
  });
});
```

---

## Phase 3: Complete Workflow Tests (Priority: High)

### 3.1 Clinician Workflow E2E

Full simulation with real backend.

```typescript
// e2e/tests/clinician-workflow.spec.ts

test.describe('Complete Clinician Workflow', () => {
  test('Review → Edit → Submit → View Diff → Export', async ({ page }) => {
    // Setup with real auth
    await loginWithPassport(page);

    // 1. Dashboard shows pending reviews
    await page.goto(`${APP_URL}/app`);
    const pendingCount = await page.locator('[data-testid="stat-pending"]').textContent();
    console.log(`Pending reviews: ${pendingCount}`);

    // 2. Navigate to Reviews
    await page.click('[data-testid="nav-reviews"]');
    await page.waitForSelector('[data-testid="reviews-panel"]');

    // 3. Select a review
    const firstReview = page.locator('[data-testid="review-row"]').first();
    await firstReview.click();

    // 4. Verify original content loads
    const originalContent = await page.locator('[data-testid="original-content"]').textContent();
    expect(originalContent.length).toBeGreaterThan(0);

    // 5. Edit in TipTap
    const editor = page.locator('.ProseMirror');
    await editor.click();
    await editor.fill('Clinician-reviewed and corrected summary...');

    // 6. Apply labels
    await page.click('[data-testid="add-label"]');
    await page.click('[data-testid="label-hallucination"]');

    // 7. Submit review
    await page.click('[data-testid="submit-review"]');
    await page.waitForSelector('[data-testid="submit-success"]');

    // 8. View diff
    await page.click('[data-testid="view-diff"]');
    const additions = await page.locator('.diff-addition').count();
    const deletions = await page.locator('.diff-deletion').count();
    expect(additions + deletions).toBeGreaterThan(0);

    // 9. Check analytics updated
    await page.click('[data-testid="nav-analytics"]');
    const totalEdits = await page.locator('[data-testid="total-edits"]').textContent();
    expect(parseInt(totalEdits)).toBeGreaterThan(0);

    // 10. Export data
    await page.click('[data-testid="export-button"]');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('[data-testid="export-jsonl"]')
    ]);
    expect(download.suggestedFilename()).toContain('.jsonl');
  });
});
```

### 3.2 Test Data Seeding

Create realistic test data before tests.

```typescript
// e2e/fixtures/seed-production-test-data.ts

export async function seedProductionTestData(apiUrl: string, token: string) {
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // Create test documents (clinical assessments)
  const documents = [
    {
      title: 'Intake Assessment - Test Patient A',
      source: 'intake_system',
      document_type: 'clinical_assessment',
      raw_content: {
        presenting_concerns: ['Anxiety', 'Sleep issues'],
        risk_assessment: { suicide_risk: 'low', violence_risk: 'low' },
        mental_status_exam: {
          mood: 'anxious',
          affect: 'congruent',
          thought_process: 'linear'
        }
      }
    },
    // ... more documents
  ];

  const docIds = [];
  for (const doc of documents) {
    const res = await fetch(`${apiUrl}/api/documents/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(doc)
    });
    const data = await res.json();
    docIds.push(data.id);
  }

  // Create LLM outputs with intentional issues
  const outputs = [
    {
      document: docIds[0],
      model_name: 'clinical-summary-v2',
      model_version: '2.1.0',
      output_content: {
        // Intentional hallucination: wrong medication dosage
        summary: 'Patient on Sertraline 100mg (actual: 50mg)',
        risk_level: 'low'
      }
    }
  ];

  const outputIds = [];
  for (const output of outputs) {
    const res = await fetch(`${apiUrl}/api/outputs/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(output)
    });
    const data = await res.json();
    outputIds.push(data.id);
  }

  return { documentIds: docIds, outputIds };
}
```

---

## Phase 4: Error Handling Tests (Priority: High)

### 4.1 Network Failure Scenarios

```typescript
test.describe('Error Handling', () => {
  test('API timeout shows error message', async ({ page, context }) => {
    // Intercept API and delay response
    await context.route('**/api/edits/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 30000));
      route.abort();
    });

    await page.goto(`${APP_URL}/app`);
    await page.click('[data-testid="nav-reviews"]');

    // Should show timeout error
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('text=timeout')).toBeVisible();
  });

  test('API 500 shows error and retry option', async ({ page, context }) => {
    await context.route('**/api/edits/**', route => {
      route.fulfill({ status: 500, body: 'Internal Server Error' });
    });

    await page.goto(`${APP_URL}/app`);
    await page.click('[data-testid="nav-reviews"]');

    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
  });

  test('Network offline shows offline indicator', async ({ page, context }) => {
    await page.goto(`${APP_URL}/app`);

    // Go offline
    await context.setOffline(true);

    // Try to load data
    await page.click('[data-testid="nav-reviews"]');

    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
  });

  test('Auth expiry during session redirects to login', async ({ page }) => {
    await setupAuth(page);
    await page.goto(`${APP_URL}/app`);

    // Simulate token expiry
    await page.evaluate(() => {
      localStorage.removeItem('watson_auth_token');
      localStorage.removeItem('isAuthenticated');
    });

    // Trigger API call
    await page.click('[data-testid="nav-reviews"]');

    // Should redirect to login
    await page.waitForURL(/\/(login|$)/);
  });

  test('Concurrent edit conflict shows warning', async ({ page, context }) => {
    // Simulate another user editing same document
    await context.route('**/api/edits/*/submit/', route => {
      route.fulfill({
        status: 409,
        body: JSON.stringify({ error: 'Edit conflict', conflicting_edit_id: 'xxx' })
      });
    });

    await setupAuth(page);
    await page.goto(`${APP_URL}/app`);
    // ... navigate to edit and submit

    await expect(page.locator('[data-testid="conflict-warning"]')).toBeVisible();
  });
});
```

### 4.2 Input Validation Tests

```typescript
test.describe('Input Validation', () => {
  test('Empty edit content prevented', async ({ page }) => {
    await setupAuth(page);
    // Navigate to editor, clear content, try to submit
    // Should show validation error
  });

  test('XSS in editor content sanitized', async ({ page }) => {
    await setupAuth(page);
    const editor = page.locator('.ProseMirror');
    await editor.fill('<script>alert("xss")</script>');
    await page.click('[data-testid="submit-review"]');

    // Script should be sanitized, not executed
    // Check content doesn't contain script tag
  });

  test('Large content handled gracefully', async ({ page }) => {
    await setupAuth(page);
    const editor = page.locator('.ProseMirror');
    const largeContent = 'A'.repeat(100000);
    await editor.fill(largeContent);

    // Should either accept or show appropriate size limit error
  });
});
```

---

## Phase 5: Load Testing (Priority: Medium)

### 5.1 Concurrent Users

```typescript
// e2e/tests/load.spec.ts

test.describe('Load Testing', () => {
  test('10 concurrent users loading reviews', async () => {
    const users = Array.from({ length: 10 }, (_, i) => i);

    const results = await Promise.all(
      users.map(async (userId) => {
        const context = await browser.newContext();
        const page = await context.newPage();

        const start = Date.now();
        await setupAuth(page, `test-user-${userId}@test.com`);
        await page.goto(`${APP_URL}/app`);
        await page.click('[data-testid="nav-reviews"]');
        await page.waitForSelector('[data-testid="reviews-panel"]');
        const duration = Date.now() - start;

        await context.close();
        return { userId, duration, success: true };
      })
    );

    // All should succeed
    expect(results.every(r => r.success)).toBeTruthy();

    // Average load time should be acceptable
    const avgDuration = results.reduce((a, r) => a + r.duration, 0) / results.length;
    expect(avgDuration).toBeLessThan(10000); // 10 seconds
  });

  test('Rapid sequential edits', async ({ page }) => {
    await setupAuth(page);
    await page.goto(`${APP_URL}/app`);

    // Rapidly create and submit 10 edits
    for (let i = 0; i < 10; i++) {
      await page.click('[data-testid="new-edit"]');
      await page.locator('.ProseMirror').fill(`Edit ${i}`);
      await page.click('[data-testid="submit-review"]');
      await page.waitForSelector('[data-testid="submit-success"]');
    }

    // All should be recorded
    await page.click('[data-testid="nav-analytics"]');
    const count = await page.locator('[data-testid="total-edits"]').textContent();
    expect(parseInt(count)).toBeGreaterThanOrEqual(10);
  });
});
```

### 5.2 k6 Load Test Script

```javascript
// e2e/load/k6-script.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 10 },  // Ramp up to 10 users
    { duration: '3m', target: 10 },  // Stay at 10 users
    { duration: '1m', target: 50 },  // Ramp up to 50 users
    { duration: '3m', target: 50 },  // Stay at 50 users
    { duration: '1m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    http_req_failed: ['rate<0.01'],    // Less than 1% errors
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:8001';
const AUTH_TOKEN = __ENV.AUTH_TOKEN;

export default function () {
  const headers = {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json',
  };

  // Get edits list
  const editsRes = http.get(`${BASE_URL}/api/edits/`, { headers });
  check(editsRes, {
    'edits status 200': (r) => r.status === 200,
    'edits response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);

  // Get analytics
  const analyticsRes = http.get(`${BASE_URL}/api/analytics/?range=30d`, { headers });
  check(analyticsRes, {
    'analytics status 200': (r) => r.status === 200,
  });

  sleep(1);
}
```

---

## Phase 6: Security Testing (Priority: High)

### 6.1 OWASP Top 10 Checks

```typescript
test.describe('Security', () => {
  test('SQL injection prevented', async ({ request }) => {
    const maliciousInput = "'; DROP TABLE edits; --";
    const response = await request.get(
      `${API_URL}/api/edits/?search=${encodeURIComponent(maliciousInput)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    // Should return empty results, not error
    expect(response.ok()).toBeTruthy();
  });

  test('CSRF tokens required for mutations', async ({ request }) => {
    // POST without CSRF should fail (if CSRF enabled)
  });

  test('Rate limiting enforced', async ({ request }) => {
    // Make 100 rapid requests
    const requests = Array.from({ length: 100 }, () =>
      request.get(`${API_URL}/api/analytics/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
    );

    const responses = await Promise.all(requests);
    const rateLimited = responses.filter(r => r.status() === 429);

    // Should hit rate limit (60/min for analytics)
    expect(rateLimited.length).toBeGreaterThan(0);
  });

  test('Sensitive data not in response headers', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/edits/`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const headers = response.headers();
    expect(headers['x-powered-by']).toBeUndefined();
    expect(headers['server']).not.toContain('version');
  });

  test('CORS properly configured', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/edits/`, {
      headers: {
        'Origin': 'https://evil-site.com',
        Authorization: `Bearer ${token}`
      }
    });

    // Should not allow arbitrary origins
    expect(response.headers()['access-control-allow-origin'])
      .not.toBe('https://evil-site.com');
  });
});
```

---

## Test Execution Schedule

### Pre-deployment Checklist

```bash
# 1. Seed test data
bun run test:seed

# 2. Run API integration tests
bun run test:e2e:api

# 3. Run auth flow tests
bun run test:e2e:auth

# 4. Run complete workflow tests
bun run test:e2e:workflow

# 5. Run error handling tests
bun run test:e2e:errors

# 6. Run security tests
bun run test:e2e:security

# 7. Run load tests (separate environment)
k6 run e2e/load/k6-script.js

# 8. Generate coverage report
bun run test:e2e:report
```

### CI Pipeline Addition

```yaml
# .github/workflows/e2e-production.yml
name: Production Readiness Tests

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]

jobs:
  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        ports:
          - 5432:5432
      redis:
        image: redis:7
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4

      - name: Setup
        run: |
          bun install
          bun run playwright:install

      - name: Start backend
        run: |
          cd backend
          python manage.py migrate
          python manage.py runserver 8001 &

      - name: Start frontend
        run: bun run dev &

      - name: Seed test data
        run: bun run test:seed

      - name: Run integration tests
        run: bun run test:e2e:integration

      - name: Run security tests
        run: bun run test:e2e:security

      - name: Upload results
        uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: e2e/test-results/
```

---

## Success Criteria

| Phase | Tests | Target Pass Rate |
|-------|-------|------------------|
| API Integration | 15 | 100% |
| Real Auth | 8 | 100% |
| Complete Workflow | 5 | 100% |
| Error Handling | 12 | 95% |
| Load Testing | 3 | 100% |
| Security | 10 | 100% |

**Total: 53 additional tests**

After all phases pass, confidence should reach **85-90%** for production deployment.

---

## Ralph Loop for Test Implementation

To implement these tests iteratively:

```bash
/ralph-wiggum:ralph-loop "$(cat e2e/TEST-PLAN-PRODUCTION.md)

Implement the tests described in this plan. Start with Phase 1 (API Integration).

For each phase:
1. Create the test file in e2e/tests/
2. Run the tests
3. Fix any failures in frontend/backend code
4. Move to next phase

Output <promise>PRODUCTION TESTS COMPLETE</promise> when all phases are implemented and passing." --max-iterations 30 --completion-promise "PRODUCTION TESTS COMPLETE"
```
