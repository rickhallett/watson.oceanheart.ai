# Watson E2E Test Ralph Loop Prompt

You are iterating on Watson's E2E test suite. Your goal is to ensure all tests pass with excellent UX.

## Your Mission

Run the E2E tests, analyze failures, fix issues in the codebase, and repeat until all tests pass.

## Current Iteration Tasks

1. **Run E2E Tests**
   ```bash
   cd /home/kai/code/repo/oAI/watson.oceanheart.ai
   bun run test:e2e 2>&1 | head -200
   ```

2. **Analyze Results**
   - Check for test failures in the output
   - Look for console errors in observability reports
   - Note any performance threshold violations
   - Identify accessibility issues

3. **Fix Issues**
   Based on failures, fix issues in:
   - `frontend/src/` - React components, pages, API client
   - `backend/` - Django views, serializers, models
   - `e2e/tests/` - Test selectors, assertions, timing

4. **Common Fixes**
   - Missing `data-testid` attributes → Add to components
   - Selector not found → Update test selectors to match DOM
   - Timing issues → Add appropriate waits
   - API errors → Fix backend endpoints or mock data
   - Auth failures → Check token handling

## Success Criteria

All E2E tests must pass. When they do, output:

```
<promise>E2E TESTS PASSING</promise>
```

## Test Output Interpretation

```
✓ Phase 1: Landing Page Experience     # Good - test passed
✗ Phase 4: Navigate to Reviews Panel   # FAILURE - needs fix
  - Locator 'button:has-text("Reviews")' not found
```

For failures like above:
1. Check if the element exists in the actual component
2. Add `data-testid` if missing
3. Update the test selector if element structure changed

## File Quick Reference

| Issue Type | Files to Check |
|------------|----------------|
| Missing elements | `frontend/src/pages/AppLayout.tsx`, `frontend/src/components/panels/` |
| API failures | `frontend/src/utils/api.ts`, `backend/reviews/views.py` |
| Auth issues | `e2e/tests/auth.setup.ts`, `frontend/src/contexts/AuthContext.tsx` |
| Editor problems | `frontend/src/components/tiptap-templates/simple/simple-editor.tsx` |
| Test selectors | `e2e/tests/user-journey.spec.ts` |

## Iteration History

Check git log to see what you've already tried:
```bash
git log --oneline -10
```

Review your previous changes:
```bash
git diff HEAD~1
```

## Important Notes

- Don't change test assertions unless the expected behavior changed
- Prefer adding `data-testid` attributes over complex CSS selectors
- If a test is flaky, add explicit waits rather than disabling it
- Keep the observability features working - they help debug issues

## Ready?

Run the tests and fix any failures. Output `<promise>E2E TESTS PASSING</promise>` only when ALL tests pass.
