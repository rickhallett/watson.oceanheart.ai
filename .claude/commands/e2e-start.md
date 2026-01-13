# E2E Testing Workflow Kickoff

Execute the complete E2E testing workflow: install dependencies, check services, run baseline tests, and recommend the appropriate Ralph loop.

## Step 1: Check Prerequisites

First, verify Playwright is installed:
```bash
cd /home/kai/code/repo/oAI/watson.oceanheart.ai && bunx playwright --version 2>/dev/null || echo "NEEDS_INSTALL"
```

If not installed, run:
```bash
bun run playwright:install
```

## Step 2: Check Services

Check if frontend is running (port 3001):
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 2>/dev/null || echo "FRONTEND_DOWN"
```

Check if backend is running (port 8001):
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:8001/health/ 2>/dev/null || echo "BACKEND_DOWN"
```

If services are down, inform the user they need to start them:
- Frontend: `bun run dev`
- Backend: `cd backend && python manage.py runserver 8001`

## Step 3: Run Baseline E2E Test

Run the full user journey test to establish baseline:
```bash
cd /home/kai/code/repo/oAI/watson.oceanheart.ai && bun run test:e2e:journey 2>&1
```

## Step 4: Analyze Results & Recommend Ralph Loop

Based on the test output, recommend one of these Ralph loops:

**If many tests fail (selectors not found, API errors):**
```
/ralph-wiggum:ralph-loop "$(cat e2e/RALPH-E2E.md)" --max-iterations 15 --completion-promise "E2E TESTS PASSING"
```

**If tests pass but performance thresholds fail:**
```
/ralph-wiggum:ralph-loop "$(cat e2e/ralph-prompts/performance.md)" --max-iterations 10 --completion-promise "PERFORMANCE OPTIMIZED"
```

**If accessibility violations found:**
```
/ralph-wiggum:ralph-loop "$(cat e2e/ralph-prompts/accessibility.md)" --max-iterations 10 --completion-promise "ACCESSIBILITY COMPLIANT"
```

**If all tests pass, want UX polish:**
```
/ralph-wiggum:ralph-loop "$(cat e2e/ralph-prompts/ux-simulation.md)" --max-iterations 15 --completion-promise "UX OPTIMIZED"
```

## Step 5: Offer to Launch

Ask the user if they want to start the recommended Ralph loop, or if they prefer to fix issues manually.
