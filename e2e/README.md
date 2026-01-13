# Watson E2E User Experience Simulation Tests

Comprehensive end-to-end testing suite using Playwright with Chrome DevTools Protocol integration for enhanced observability.

## Overview

This test suite simulates a complete clinician user journey through Watson:

1. **Landing Page** - Initial experience and CTA
2. **Authentication** - Login via Passport OAuth
3. **Dashboard** - Overview of metrics and quick actions
4. **Reviews Panel** - Browse and select LLM outputs
5. **Content Editing** - TipTap rich text editor interaction
6. **Classification** - Apply issue labels
7. **Submission** - Submit completed review
8. **Diff Viewing** - Review changes made
9. **Analytics** - View aggregated insights
10. **Export** - Download research datasets

## Quick Start

### Prerequisites

```bash
# Install Playwright and browsers
bunx playwright install

# Or with npm
npx playwright install
```

### Run All Tests

```bash
# From project root
cd e2e
bunx playwright test

# Or with npm
npx playwright test
```

### Run with DevTools Open (Interactive Mode)

```bash
DEVTOOLS=true bunx playwright test --headed
```

### Run Specific Test

```bash
# Run full journey only
bunx playwright test user-journey.spec.ts -g "Full Journey"

# Run performance tests
bunx playwright test user-journey.spec.ts -g "Performance"

# Run accessibility tests
bunx playwright test user-journey.spec.ts -g "Accessibility"
```

## Test Structure

```
e2e/
├── playwright.config.ts     # Playwright configuration
├── fixtures/
│   └── seed-data.ts         # Test data (clinical documents, labels)
├── helpers/
│   └── devtools-observer.ts # Chrome DevTools Protocol integration
├── tests/
│   ├── auth.setup.ts        # Authentication setup
│   └── user-journey.spec.ts # Main test suite
└── README.md
```

## Observability Features

### Chrome DevTools Protocol (CDP) Integration

The `DevToolsObserver` class provides:

- **Performance Metrics** - Layout counts, script duration, heap usage
- **Network Monitoring** - Request/response timing, sizes, errors
- **Console Capture** - All console logs, warnings, errors
- **Web Vitals** - FCP, LCP, CLS measurements
- **Accessibility Tree** - Full a11y snapshot

### Using the Observer

```typescript
import { DevToolsObserver } from '../helpers/devtools-observer';

test('my test', async ({ page }) => {
  const observer = new DevToolsObserver(page);
  await observer.start('My Test Name');

  // ... test actions ...

  // Take snapshots at key points
  await observer.snapshot('after-login');

  // Get final report
  const report = await observer.stop();
  console.log('Errors:', report.errors);
  console.log('Slow requests:', report.networkRequests.filter(r => r.responseTime > 500));
});
```

### Report Output

Each test generates an observability report:

```
========================================
  OBSERVABILITY REPORT: Full User Journey
========================================
  Duration: 12453ms
  Network Requests: 47
  Console Messages: 12
  Errors: 0
  Warnings: 2
----------------------------------------
  Web Vitals:
    FCP: 892.50ms
    LCP: 1243.00ms
    CLS: 0.0021
----------------------------------------
  Final Performance:
    JS Heap Used: 45MB
    Layout Count: 234
    Script Duration: 2.34s
----------------------------------------
  Slow Requests (>500ms):
    GET /api/edits?status=all... (623ms)
========================================
```

## Test Data

### Seeding Test Data

The `fixtures/seed-data.ts` provides realistic clinical scenarios:

- **3 Clinical Documents** - Intake, progress note, crisis assessment
- **3 LLM Outputs** - With intentional issues for testing
- **6 Classification Labels** - Hallucination, missing risk, etc.

```typescript
import { seedTestData, cleanupTestData } from '../fixtures/seed-data';

// Seed before tests
const ids = await seedTestData(apiUrl, authToken);

// Cleanup after tests
await cleanupTestData(apiUrl, authToken, ids);
```

## Configuration

### Environment Variables

```bash
# Frontend URL (default: http://localhost:3001)
APP_URL=http://localhost:3001

# Backend API URL (default: http://localhost:8001)
API_URL=http://localhost:8001

# Open DevTools in headed mode
DEVTOOLS=true

# CI mode (enables retries, parallel restrictions)
CI=true
```

### Playwright Config

Key settings in `playwright.config.ts`:

- **Sequential execution** for user journey tests
- **Tracing** on first retry
- **Screenshots** on failure
- **Video** retained on failure
- **Auto-start** frontend and backend servers

## Running in CI

```yaml
# Example GitHub Actions workflow
jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install

      - name: Install Playwright
        run: bunx playwright install --with-deps

      - name: Start services
        run: |
          docker-compose up -d db redis
          cd backend && python manage.py migrate
          bun run dev &
          cd backend && python manage.py runserver 8001 &
          sleep 10

      - name: Run E2E tests
        run: cd e2e && bunx playwright test
        env:
          CI: true

      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: test-results/
```

## Test Phases Explained

### Phase 1: Landing Page Experience
- Verifies hero section visibility
- Checks CTA button presence
- Tests navigation elements
- Captures accessibility snapshot

### Phase 2: Authentication Flow
- Tests login page rendering
- Simulates OAuth flow (mocked in test)
- Verifies token storage
- Confirms dashboard redirect

### Phase 3-4: Dashboard & Reviews
- Checks stat card rendering
- Verifies navigation works
- Tests reviews list loading
- Confirms filter controls

### Phase 5-7: Editing Workflow
- TipTap editor interaction
- Toolbar button testing
- Label application
- Content modification

### Phase 8-9: Submission & Diff
- Submit button interaction
- Success message verification
- Diff visualization loading
- Change highlighting

### Phase 10-11: Analytics & Export
- Time range selector testing
- Chart/metric verification
- Export format options
- Download initiation

## Debugging

### View Test Report

```bash
bunx playwright show-report ../test-results/e2e-report
```

### Run with UI Mode

```bash
bunx playwright test --ui
```

### Debug Single Test

```bash
bunx playwright test --debug -g "Phase 1"
```

### View Traces

After a failure, view the trace:

```bash
bunx playwright show-trace test-results/trace.zip
```

## Performance Thresholds

The tests enforce these performance standards:

| Metric | Target | Description |
|--------|--------|-------------|
| Initial Load | < 5s | Time to networkidle |
| FCP | < 2.5s | First Contentful Paint |
| LCP | < 4s | Largest Contentful Paint |
| CLS | < 0.1 | Cumulative Layout Shift |

## Ralph Wiggum Integration

The E2E test suite integrates with the Ralph Wiggum Claude Code plugin for iterative test-driven development.

### What is Ralph Wiggum?

Ralph Wiggum is an iterative development technique where Claude repeatedly receives the same prompt, sees its previous work in files, and incrementally improves until success. Perfect for:

- Fixing E2E test failures iteratively
- Optimizing performance until thresholds pass
- Achieving accessibility compliance
- Improving UX through simulated user testing

### Quick Start with Ralph

```bash
# In Claude Code, start an E2E fixing loop:
/ralph-wiggum:ralph-loop "$(cat e2e/RALPH-E2E.md)" --max-iterations 15 --completion-promise "E2E TESTS PASSING"

# Or use specialized prompts:

# Performance optimization loop
/ralph-wiggum:ralph-loop "$(cat e2e/ralph-prompts/performance.md)" --max-iterations 10 --completion-promise "PERFORMANCE OPTIMIZED"

# Accessibility compliance loop
/ralph-wiggum:ralph-loop "$(cat e2e/ralph-prompts/accessibility.md)" --max-iterations 10 --completion-promise "ACCESSIBILITY COMPLIANT"

# UX simulation loop
/ralph-wiggum:ralph-loop "$(cat e2e/ralph-prompts/ux-simulation.md)" --max-iterations 15 --completion-promise "UX OPTIMIZED"
```

### Ralph Prompts Available

| Prompt | Purpose | Completion Promise |
|--------|---------|-------------------|
| `RALPH-E2E.md` | Fix all E2E test failures | `E2E TESTS PASSING` |
| `ralph-prompts/performance.md` | Optimize Web Vitals | `PERFORMANCE OPTIMIZED` |
| `ralph-prompts/accessibility.md` | WCAG 2.1 AA compliance | `ACCESSIBILITY COMPLIANT` |
| `ralph-prompts/ux-simulation.md` | UX improvements | `UX OPTIMIZED` |

### How Ralph Iteration Works

```
┌─────────────────────────────────────────────────┐
│  1. Claude receives prompt (e.g., RALPH-E2E.md) │
└─────────────────────┬───────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────┐
│  2. Runs E2E tests: bun run test:e2e            │
└─────────────────────┬───────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────┐
│  3. Analyzes failures + observability report    │
└─────────────────────┬───────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────┐
│  4. Fixes code (components, selectors, timing)  │
└─────────────────────┬───────────────────────────┘
                      │
          ┌───────────▼───────────┐
          │  All tests pass?      │
          └───────────┬───────────┘
                      │
        ┌─────────────┴─────────────┐
        │ NO                        │ YES
        ▼                           ▼
┌───────────────────┐    ┌─────────────────────────┐
│ Loop continues    │    │ Output promise tag      │
│ (same prompt fed) │    │ <promise>E2E TESTS      │
└───────────────────┘    │ PASSING</promise>       │
                         └─────────────────────────┘
```

### Canceling a Ralph Loop

```bash
# Cancel anytime
/ralph-wiggum:cancel-ralph
```

### Best Practices for Ralph E2E Loops

1. **Start services first** - Ensure frontend and backend are running before starting the loop
2. **Use appropriate max-iterations** - 10-15 for focused tasks, 20+ for complex fixes
3. **Check git history** - Ralph sees previous attempts in git, helping avoid repeated failures
4. **Use specific prompts** - The specialized prompts (performance, a11y, ux) are more focused than the general one

### Example Session

```bash
# Terminal 1: Start backend
cd backend && python manage.py runserver 8001

# Terminal 2: Start frontend
bun run dev

# Terminal 3: Claude Code
# Start the Ralph loop
/ralph-wiggum:ralph-loop "$(cat e2e/RALPH-E2E.md)" --max-iterations 15 --completion-promise "E2E TESTS PASSING"

# Watch Claude:
# - Run tests
# - Find "button:has-text('Reviews')" not found
# - Add data-testid="nav-reviews" to AppLayout.tsx
# - Run tests again
# - Find next issue
# - Fix it
# - Repeat until all pass
# - Output: <promise>E2E TESTS PASSING</promise>
```

## Extending Tests

### Adding New Test Phases

```typescript
test('Phase N: New Feature', async ({ page }) => {
  await observer.start('New Feature Test');

  // Setup auth
  await page.evaluate((user) => {
    localStorage.setItem('watson_auth_token', 'test-jwt-token');
    localStorage.setItem('watson_user', JSON.stringify(user));
  }, config.testUser);

  // Navigate
  await page.goto(`${config.appUrl}/app`);

  // Test actions...

  // Capture observability
  await observer.snapshot('feature-tested');
  await observer.stop();
});
```

### Custom Observability Hooks

```typescript
// Add custom metric collection
async function measureCustomMetric(page: Page): Promise<number> {
  return page.evaluate(() => {
    // Custom measurement logic
    return performance.now();
  });
}
```
