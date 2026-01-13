# Watson E2E Performance Optimization Ralph Loop

You are iterating to optimize Watson's frontend performance based on E2E test metrics.

## Your Mission

Run E2E performance tests, identify bottlenecks, optimize code, and repeat until all performance thresholds pass.

## Performance Thresholds

| Metric | Target | Current Status |
|--------|--------|----------------|
| Initial Load | < 5s | Check test output |
| FCP (First Contentful Paint) | < 2.5s | Check Web Vitals |
| LCP (Largest Contentful Paint) | < 4s | Check Web Vitals |
| CLS (Cumulative Layout Shift) | < 0.1 | Check Web Vitals |
| JS Heap | < 100MB | Check DevTools report |

## Current Iteration Tasks

1. **Run Performance Tests**
   ```bash
   cd /home/kai/code/repo/oAI/watson.oceanheart.ai
   bun run test:e2e -- -g "Performance" 2>&1
   ```

2. **Analyze Observability Report**
   Look for:
   - Slow network requests (>500ms)
   - High JS heap usage
   - Excessive layout/recalc counts
   - Poor Web Vitals scores

3. **Optimize Based on Findings**

   **Slow Initial Load:**
   - Code split large components with `React.lazy()`
   - Defer non-critical scripts
   - Optimize bundle size in `vite.config.ts`

   **Poor FCP/LCP:**
   - Reduce render-blocking resources
   - Optimize critical rendering path
   - Use `loading="lazy"` on images

   **High CLS:**
   - Add explicit dimensions to images/containers
   - Avoid inserting content above existing content
   - Use CSS `aspect-ratio` for media

   **Memory Issues:**
   - Check for memory leaks in effects
   - Clean up subscriptions/listeners
   - Memoize expensive computations

## Key Files for Optimization

- `frontend/src/App.tsx` - Code splitting entry
- `frontend/src/pages/AppLayout.tsx` - Main layout (often largest)
- `frontend/src/components/ui/` - Component library (check bundle impact)
- `vite.config.ts` - Build optimization settings

## Success Criteria

All performance thresholds must pass. When they do, output:

```
<promise>PERFORMANCE OPTIMIZED</promise>
```

## Example Optimizations

### Code Splitting
```tsx
// Before
import { AnalyticsPanel } from './components/panels/AnalyticsPanel';

// After
const AnalyticsPanel = React.lazy(() => import('./components/panels/AnalyticsPanel'));
```

### Image Optimization
```tsx
// Before
<img src={heroImage} />

// After
<img
  src={heroImage}
  loading="lazy"
  width={800}
  height={400}
  decoding="async"
/>
```

### Memoization
```tsx
// Before
const expensiveData = computeExpensive(data);

// After
const expensiveData = useMemo(() => computeExpensive(data), [data]);
```

Run the performance tests and optimize until all thresholds pass!
