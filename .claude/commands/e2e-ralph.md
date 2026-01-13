# E2E Test Ralph Loop

Launch a Ralph Wiggum loop for E2E test iteration.

## Usage

This command sets up and starts an iterative E2E testing loop:

```
/ralph-wiggum:ralph-loop "$(cat e2e/RALPH-E2E.md)" --max-iterations 15 --completion-promise "E2E TESTS PASSING"
```

## What This Does

1. Runs E2E tests using Playwright
2. Analyzes test failures and observability reports
3. Fixes issues in frontend/backend code
4. Adds missing `data-testid` attributes
5. Adjusts test selectors and timing
6. Repeats until all tests pass

## Quick Start

From the project root, run:

```bash
# First, ensure dependencies are installed
bun install
bun run playwright:install

# Start backend (in separate terminal)
cd backend && python manage.py runserver 8001

# Start frontend (in separate terminal)
bun run dev

# Then in Claude Code, run:
# /e2e-ralph
```

## Completion

The loop automatically stops when:
- All E2E tests pass (Claude outputs `<promise>E2E TESTS PASSING</promise>`)
- Max iterations (15) reached

## Manual Control

Cancel anytime with:
```
/ralph-wiggum:cancel-ralph
```
