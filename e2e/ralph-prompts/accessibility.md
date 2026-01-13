# Watson E2E Accessibility Compliance Ralph Loop

You are iterating to ensure Watson meets WCAG 2.1 AA accessibility standards.

## Your Mission

Run E2E accessibility tests, identify a11y issues, fix them in the codebase, and repeat until compliant.

## Accessibility Requirements

| Requirement | Standard | Check |
|-------------|----------|-------|
| Keyboard Navigation | WCAG 2.1.1 | All interactive elements reachable |
| Focus Indicators | WCAG 2.4.7 | Visible focus on all focusable elements |
| Color Contrast | WCAG 1.4.3 | 4.5:1 for text, 3:1 for large text |
| Alt Text | WCAG 1.1.1 | All images have descriptive alt |
| Heading Structure | WCAG 1.3.1 | Logical h1-h6 hierarchy |
| Form Labels | WCAG 1.3.1 | All inputs have associated labels |
| ARIA | WCAG 4.1.2 | Proper roles, states, properties |

## Current Iteration Tasks

1. **Run Accessibility Tests**
   ```bash
   cd /home/kai/code/repo/oAI/watson.oceanheart.ai
   bun run test:e2e -- -g "Accessibility" 2>&1
   ```

2. **Analyze A11y Snapshot**
   The test outputs an accessibility tree. Look for:
   - Missing ARIA labels
   - Images without alt text
   - Buttons without accessible names
   - Form inputs without labels

3. **Fix Issues**

   **Missing Alt Text:**
   ```tsx
   // Before
   <img src={icon} />

   // After
   <img src={icon} alt="User profile" />
   // Or for decorative:
   <img src={icon} alt="" aria-hidden="true" />
   ```

   **Button Without Label:**
   ```tsx
   // Before
   <button><Icon /></button>

   // After
   <button aria-label="Close dialog"><Icon /></button>
   ```

   **Form Input Without Label:**
   ```tsx
   // Before
   <input type="email" />

   // After
   <label>
     Email
     <input type="email" />
   </label>
   // Or with htmlFor:
   <label htmlFor="email">Email</label>
   <input id="email" type="email" />
   ```

   **Missing Focus Styles:**
   ```css
   /* Add visible focus indicator */
   button:focus-visible {
     outline: 2px solid var(--focus-color);
     outline-offset: 2px;
   }
   ```

## Key Files to Check

- `frontend/src/components/ui/button.tsx` - Button accessibility
- `frontend/src/components/ui/input.tsx` - Form input labels
- `frontend/src/components/layout/` - Navigation landmarks
- `frontend/src/pages/` - Page structure and headings
- `frontend/src/index.css` - Focus styles

## Common Patterns

### Skip Link (add to AppLayout)
```tsx
<a href="#main" className="skip-link">
  Skip to main content
</a>
<main id="main">
  {/* content */}
</main>
```

### Landmark Regions
```tsx
<header role="banner">...</header>
<nav role="navigation" aria-label="Main">...</nav>
<main role="main">...</main>
<aside role="complementary">...</aside>
<footer role="contentinfo">...</footer>
```

### Live Regions for Dynamic Content
```tsx
<div role="status" aria-live="polite">
  {statusMessage}
</div>
```

## Success Criteria

All accessibility checks must pass:
- At least one h1 on each page
- All images have alt text
- All buttons have accessible names
- No ARIA errors in tree

When compliant, output:

```
<promise>ACCESSIBILITY COMPLIANT</promise>
```

Run the accessibility tests and fix issues until compliant!
