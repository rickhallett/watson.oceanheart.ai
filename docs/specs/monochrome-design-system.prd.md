# Monochrome Design System Implementation PRD

**Date**: September 17, 2025  
**Status**: Draft  
**Feature**: monochrome-design-system

## Executive Summary

Implementation of a sophisticated monochrome design system for Watson.oceanheart.ai, transitioning from traditional colorful UI to a zinc-based palette with glass morphism effects. The system emphasizes minimalism, professional aesthetics, and subtle interactions while maintaining excellent usability and accessibility. Enhanced with advanced patterns including multi-step forms, animated transitions, and sophisticated state management inspired by modern UI best practices.

## Problem Statement

### Current Issues
- Lack of cohesive visual identity across the application
- Inconsistent color usage leading to visual clutter
- Missing sophisticated design patterns that align with professional clinical tools
- No established design token system for maintainable theming
- Absence of modern visual effects (glass morphism, parallax)

### User Impact
- Clinical professionals expect refined, distraction-free interfaces
- Current colorful UI may appear less professional for healthcare context
- Inconsistent visual hierarchy affects information scanning efficiency
- Lack of subtle interactions reduces perceived quality

## Requirements

### User Requirements
- **Visual Clarity**: High contrast text for extended reading sessions
- **Professional Aesthetic**: Refined appearance suitable for clinical settings
- **Reduced Cognitive Load**: Minimal color distractions during review tasks
- **Consistent Interactions**: Predictable hover and focus states
- **Accessibility**: WCAG AA compliance for all text elements

### Technical Requirements
- **Tailwind Configuration**: Extended zinc color palette integration
- **Component Architecture**: Reusable glass morphism components
- **Performance**: Optimized backdrop-filter effects
- **Browser Support**: Modern browsers with CSS backdrop-filter
- **Dark Mode Only**: System designed exclusively for dark backgrounds

### Design Requirements
- **Color System**: Zinc palette (950-50) with minimal semantic colors
- **Typography Scale**: Consistent sizing from text-xs to text-2xl
- **Spacing System**: Compact spacing with 3-4 unit base
- **Effects**: Glass morphism with backdrop-blur
- **Animation**: Smooth transitions under 300ms

## Implementation Phases

### Phase 1: Foundation Setup
**Objective**: Establish core design tokens and utilities

- Configure Tailwind with zinc color palette
- Create base glass morphism utility classes
- Implement SkewedBackground component for parallax effects
- Set up zinc-950 base background across application
- Define typography scale constants
- Establish spacing system tokens

**Key Deliverables**:
```tsx
// tailwind.config.ts updates
colors: {
  background: 'zinc-950',
  surface: 'zinc-900/50',
  border: 'zinc-800',
  textPrimary: 'zinc-50',
  textSecondary: 'zinc-400'
}

// Base glass card class
.glass-card {
  @apply bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-md;
}
```

### Phase 2: Core Components
**Objective**: Convert essential UI components to monochrome system

- Button components (primary, ghost, icon variants)
- Form inputs with icon prefix support
- CompactCard component for dense information display
- Modal and dialog overlays with glass effect
- Navigation components with hover states
- Loading states and skeletons

**Component Examples**:
```tsx
// CompactCard implementation
interface CompactCardProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  className?: string;
}

export function CompactCard({ title, description, icon, className }: CompactCardProps) {
  return (
    <div className={cn(
      "glass-card p-3 hover:bg-zinc-800/50 transition-all duration-200",
      className
    )}>
      <div className="flex items-start gap-2">
        {icon && <span className="text-zinc-400">{icon}</span>}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-zinc-100">{title}</h3>
          {description && (
            <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
```

### Phase 3: Page Templates & Advanced Components
**Objective**: Redesign major page layouts with sophisticated interaction patterns

- Landing page with parallax hero section
- Authentication pages (login, register, password reset) 
- Dashboard with bento grid layout
- Editor view with glass panels
- Settings pages with animated sidebar navigation
- Analytics views with data visualization
- Multi-step survey forms with progress tracking
- Profile pages with user management

**Layout Patterns**:
```tsx
// Bento grid dashboard
<div className="grid grid-cols-1 md:grid-cols-4 gap-3 auto-rows-auto">
  <div className="col-span-full md:col-span-2 md:row-span-2">
    {/* Primary action card */}
  </div>
  <CompactCard />
  <CompactCard />
  <div className="col-span-full md:col-span-3">
    {/* Activity feed */}
  </div>
</div>
```

**Multi-Step Form Pattern**:
```tsx
// Survey component with progress indicator
interface SurveyStep {
  id: string;
  title: string;
  component: React.ComponentType<StepProps>;
  validation?: (data: any) => boolean;
}

export function MultiStepSurvey({ steps }: { steps: SurveyStep[] }) {
  const [currentStep, setCurrentStep] = useState(0);
  const progress = ((currentStep + 1) / steps.length) * 100;
  
  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-zinc-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          {steps.map((_, idx) => (
            <span 
              key={idx}
              className={cn(
                "text-xs",
                idx <= currentStep ? "text-zinc-400" : "text-zinc-600"
              )}
            >
              Step {idx + 1}
            </span>
          ))}
        </div>
      </div>
      
      {/* Step content with animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="glass-card p-6"
        >
          {React.createElement(steps[currentStep].component, {
            onNext: () => setCurrentStep(prev => prev + 1),
            onBack: () => setCurrentStep(prev => prev - 1)
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
```

**Settings Page with Animated Sidebar**:
```tsx
export function SettingsPage() {
  const [activeSection, setActiveSection] = useState('general');
  
  const sections = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'integrations', label: 'Integrations', icon: Link }
  ];
  
  return (
    <div className="flex gap-6">
      {/* Sidebar navigation */}
      <nav className="w-64">
        <div className="glass-card p-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-md",
                "text-sm transition-all duration-200",
                activeSection === section.id
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/50"
              )}
            >
              <section.icon className="w-4 h-4" />
              {section.label}
            </button>
          ))}
        </div>
      </nav>
      
      {/* Settings content with fade animation */}
      <div className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-card p-6"
          >
            {/* Dynamic settings content */}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
```

### Phase 4: Editor Integration
**Objective**: Apply design system to TipTap editor interface

- Editor toolbar with monochrome icons
- Selection highlighting with zinc accents
- Comment threads with glass cards
- Diff viewer with subtle contrast
- Classification labels with minimal color
- Export dialog with glass overlay

### Phase 5: Animation & Interaction Patterns
**Objective**: Implement sophisticated animations and micro-interactions

- Staggered fade-in animations for list items
- Smooth page transitions with Framer Motion
- Form validation feedback with subtle animations
- Loading states with skeleton screens
- Hover effects with scale and opacity transforms
- Keyboard navigation with focus-visible outlines
- Scroll-triggered animations for content reveal

**Animation Utilities**:
```tsx
// Staggered list animations
export const fadeInUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.5,
      ease: "easeOut"
    }
  })
};

// Page transition wrapper
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}

// Form field validation animation
export function FormField({ error, children }: FormFieldProps) {
  return (
    <div className="relative">
      {children}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="text-xs text-red-400 mt-1"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
```

### Phase 6: State Management & Data Flow
**Objective**: Implement robust state management for complex UI flows

- Zustand stores for global application state
- Form state management with react-hook-form
- Survey progress persistence with localStorage
- Optimistic UI updates for better perceived performance
- Real-time data synchronization patterns

**State Management Pattern**:
```tsx
// Survey state with Zustand
interface SurveyState {
  currentStep: number;
  responses: Record<string, any>;
  completedSteps: Set<number>;
  setResponse: (step: string, data: any) => void;
  nextStep: () => void;
  previousStep: () => void;
  canProceed: () => boolean;
}

export const useSurveyStore = create<SurveyState>()(
  persist(
    (set, get) => ({
      currentStep: 0,
      responses: {},
      completedSteps: new Set(),
      
      setResponse: (step, data) => set(state => ({
        responses: { ...state.responses, [step]: data },
        completedSteps: new Set([...state.completedSteps, state.currentStep])
      })),
      
      nextStep: () => set(state => ({
        currentStep: Math.min(state.currentStep + 1, MAX_STEPS - 1)
      })),
      
      previousStep: () => set(state => ({
        currentStep: Math.max(state.currentStep - 1, 0)
      })),
      
      canProceed: () => {
        const { currentStep, completedSteps } = get();
        return completedSteps.has(currentStep);
      }
    }),
    {
      name: 'survey-storage',
      partialize: (state) => ({ 
        responses: state.responses, 
        currentStep: state.currentStep 
      })
    }
  )
);
```

### Phase 7: Polish & Optimization
**Objective**: Refine performance and accessibility

- Performance monitoring with Web Vitals
- Lazy loading for heavy components
- Code splitting for route-based bundles
- Accessibility audit and improvements
- RTL support for internationalization
- Documentation generation from components

## Advanced Component Patterns

### Form Components
**Sophisticated form handling with validation and feedback**

```tsx
// Radio group with animations
export function RadioGroup({ options, value, onChange }: RadioGroupProps) {
  return (
    <div className="space-y-2">
      {options.map((option) => (
        <label
          key={option.value}
          className={cn(
            "flex items-center gap-3 p-3 rounded-md cursor-pointer",
            "border transition-all duration-200",
            value === option.value
              ? "border-zinc-600 bg-zinc-800/50"
              : "border-zinc-800 hover:border-zinc-700"
          )}
        >
          <input
            type="radio"
            value={option.value}
            checked={value === option.value}
            onChange={(e) => onChange(e.target.value)}
            className="sr-only"
          />
          <div className="relative w-4 h-4 rounded-full border border-zinc-600">
            <AnimatePresence>
              {value === option.value && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute inset-1 bg-zinc-400 rounded-full"
                />
              )}
            </AnimatePresence>
          </div>
          <div className="flex-1">
            <p className="text-sm text-zinc-100">{option.label}</p>
            {option.description && (
              <p className="text-xs text-zinc-500 mt-0.5">{option.description}</p>
            )}
          </div>
        </label>
      ))}
    </div>
  );
}

// Textarea with character count
export function TextareaWithCount({ 
  value, 
  onChange, 
  maxLength = 500,
  ...props 
}: TextareaProps) {
  const remaining = maxLength - value.length;
  
  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        className={cn(
          "w-full p-3 bg-zinc-900/50 border border-zinc-800 rounded-md",
          "text-zinc-100 placeholder-zinc-600",
          "focus:outline-none focus:ring-1 focus:ring-zinc-600",
          "resize-none"
        )}
        {...props}
      />
      <div className="absolute bottom-2 right-2">
        <span className={cn(
          "text-xs",
          remaining < 50 ? "text-amber-500" : "text-zinc-600"
        )}>
          {remaining} characters
        </span>
      </div>
    </div>
  );
}
```

### Navigation Components
**Advanced navigation with state indicators**

```tsx
// Breadcrumb with animations
export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex items-center gap-2 text-sm">
      {items.map((item, idx) => (
        <motion.div
          key={item.path}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="flex items-center gap-2"
        >
          {idx > 0 && <ChevronRight className="w-3 h-3 text-zinc-600" />}
          {item.href ? (
            <Link
              to={item.href}
              className="text-zinc-400 hover:text-zinc-300 transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-zinc-100">{item.label}</span>
          )}
        </motion.div>
      ))}
    </nav>
  );
}

// Tab navigation with indicator
export function TabNav({ tabs, activeTab, onChange }: TabNavProps) {
  const [indicatorStyle, setIndicatorStyle] = useState({});
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  
  useEffect(() => {
    const activeIndex = tabs.findIndex(t => t.id === activeTab);
    const activeEl = tabRefs.current[activeIndex];
    if (activeEl) {
      setIndicatorStyle({
        width: activeEl.offsetWidth,
        left: activeEl.offsetLeft
      });
    }
  }, [activeTab, tabs]);
  
  return (
    <div className="relative">
      <div className="flex gap-1 p-1 bg-zinc-900/50 rounded-lg">
        {tabs.map((tab, idx) => (
          <button
            key={tab.id}
            ref={el => tabRefs.current[idx] = el}
            onClick={() => onChange(tab.id)}
            className={cn(
              "px-4 py-2 text-sm rounded-md transition-colors",
              activeTab === tab.id
                ? "text-zinc-100"
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            {tab.label}
            {tab.count && (
              <span className="ml-2 text-xs text-zinc-600">
                ({tab.count})
              </span>
            )}
          </button>
        ))}
        <motion.div
          className="absolute bottom-1 h-[2px] bg-zinc-400 rounded-full"
          animate={indicatorStyle}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      </div>
    </div>
  );
}
```

### Feedback Components
**User feedback and notification patterns**

```tsx
// Toast notification with auto-dismiss
export function Toast({ message, type = "info", duration = 3000 }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(false), duration);
    return () => clearTimeout(timer);
  }, [duration]);
  
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info
  };
  
  const Icon = icons[type];
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className={cn(
            "glass-card p-3 flex items-center gap-3",
            "min-w-[300px] max-w-[500px]"
          )}
        >
          <Icon className={cn(
            "w-4 h-4",
            type === "success" && "text-green-400",
            type === "error" && "text-red-400",
            type === "warning" && "text-amber-400",
            type === "info" && "text-blue-400"
          )} />
          <p className="text-sm text-zinc-100 flex-1">{message}</p>
          <button
            onClick={() => setIsVisible(false)}
            className="text-zinc-500 hover:text-zinc-300"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

## Implementation Notes

### Critical Path Components
1. **SkewedBackground Component**
```tsx
export function SkewedBackground() {
  const [scrollY, setScrollY] = useState(0);
  
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -inset-[100%] opacity-5">
        <div 
          className="absolute inset-0 bg-gradient-to-br from-zinc-700 via-zinc-800 to-zinc-900"
          style={{
            transform: `translateY(${scrollY * 0.3}px) skewY(12deg) rotate(12deg)`
          }}
        />
      </div>
    </div>
  );
}
```

2. **Glass Morphism Utilities**
```css
/* Global styles */
.glass-surface {
  background: rgb(24 24 27 / 0.5); /* zinc-900/50 */
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.glass-border {
  border: 1px solid rgb(39 39 42); /* zinc-800 */
}
```

3. **Button Variants**
```tsx
const buttonVariants = {
  primary: "bg-zinc-800 border-zinc-700 text-zinc-100 hover:bg-zinc-700",
  ghost: "bg-transparent border-zinc-700 hover:bg-zinc-800",
  icon: "p-2 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800"
};
```

### Migration Strategy
1. Create feature branch for design system work
2. Implement foundation without breaking existing UI
3. Convert components in isolated PRs
4. Test each phase in staging before proceeding
5. Document breaking changes for team awareness

## Enhanced Interaction Patterns

### Loading States
**Skeleton screens and shimmer effects**

```tsx
// Skeleton component with shimmer
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn(
      "relative overflow-hidden bg-zinc-800 rounded-md",
      className
    )}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-zinc-700/50 to-transparent" />
    </div>
  );
}

// Content placeholder
export function ContentSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  );
}
```

### Drag and Drop
**File upload with drag interactions**

```tsx
export function DragDropZone({ onFileDrop }: DragDropProps) {
  const [isDragging, setIsDragging] = useState(false);
  
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        onFileDrop(files);
      }}
      className={cn(
        "border-2 border-dashed rounded-lg p-8",
        "transition-all duration-200",
        isDragging
          ? "border-zinc-500 bg-zinc-800/30 scale-[1.02]"
          : "border-zinc-700 hover:border-zinc-600"
      )}
    >
      <div className="flex flex-col items-center gap-3">
        <Upload className="w-8 h-8 text-zinc-500" />
        <p className="text-sm text-zinc-400">
          Drop files here or click to browse
        </p>
      </div>
    </div>
  );
}
```

### Search Experience
**Command palette and instant search**

```tsx
export function CommandPalette() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card p-4 w-full max-w-2xl"
    >
      <div className="flex items-center gap-3 mb-4">
        <Search className="w-4 h-4 text-zinc-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search commands, files, or actions..."
          className="flex-1 bg-transparent text-zinc-100 placeholder-zinc-600 focus:outline-none"
          autoFocus
        />
        <kbd className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
          ESC
        </kbd>
      </div>
      
      <div className="space-y-1 max-h-96 overflow-auto">
        <AnimatePresence>
          {results.map((result, idx) => (
            <motion.button
              key={result.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ delay: idx * 0.05 }}
              className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-zinc-800/50 text-left"
            >
              <result.icon className="w-4 h-4 text-zinc-500" />
              <div className="flex-1">
                <p className="text-sm text-zinc-100">{result.title}</p>
                <p className="text-xs text-zinc-500">{result.description}</p>
              </div>
              <kbd className="text-xs text-zinc-600">⌘K</kbd>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
```

## Security Considerations

### Input Validation
- Maintain existing form validation on styled inputs
- Ensure contrast ratios meet accessibility standards
- Preserve CSRF tokens in redesigned forms
- Sanitize user input in rich text editors
- Implement rate limiting for form submissions

### Authentication UI
- Keep security messaging visible with high contrast
- Maintain password strength indicators
- Preserve session timeout warnings
- Add visual feedback for secure connections
- Implement proper error handling without information leakage

## Success Metrics

### Quantitative
- Page load performance maintains <3s on average
- Backdrop-filter FPS stays above 30 on mid-range devices
- WCAG AA contrast ratios achieved (4.5:1 minimum)

### Qualitative
- Positive user feedback on professional appearance
- Reduced visual fatigue reported in extended sessions
- Consistent design language across all pages

## Future Enhancements

### Potential Additions
- **Theme Variants**: Alternative monochrome palettes (blue-gray, neutral)
- **Advanced Visualizations**: Data charts with monochrome aesthetics
- **AI-Powered Interactions**: Predictive UI based on user behavior
- **Accessibility Modes**: High contrast option for low vision users
- **Component Library**: Storybook documentation for design system
- **Design Tokens API**: Programmatic access to design values
- **Gesture Support**: Touch and swipe interactions for mobile
- **Voice Interface**: Voice commands for accessibility
- **Real-time Collaboration**: Multiplayer cursors and presence indicators

### Performance Optimizations
- Conditional loading of backdrop-filter for low-end devices
- CSS containment for improved rendering performance
- Intersection Observer for parallax effect efficiency
- Virtual scrolling for large lists
- Web Workers for heavy computations
- Service Worker for offline support

### Integration Patterns
- **Passport Authentication**: Seamless SSO with glass morphism login
- **WebSocket Support**: Real-time updates with subtle notifications
- **PWA Features**: Installable app with monochrome splash screen
- **Dark Mode Variations**: Multiple darkness levels for user preference

## Appendix

### Color Token Reference
```typescript
const colors = {
  zinc: {
    950: '#09090b', // Background
    900: '#18181b', // Surface
    800: '#27272a', // Border
    700: '#3f3f46', // Border hover
    600: '#52525b', // Border focus
    500: '#71717a', // Text muted
    400: '#a1a1aa', // Text secondary
    300: '#d4d4d8', // Icon hover
    200: '#e4e4e7', // Unused
    100: '#f4f4f5', // Text emphasis
    50:  '#fafafa', // Text primary
  }
};
```

### Spacing Scale
```typescript
const spacing = {
  micro: '0.125rem', // 2px
  xs: '0.25rem',     // 4px
  sm: '0.5rem',      // 8px
  md: '0.75rem',     // 12px
  lg: '1rem',        // 16px
  xl: '1.25rem',     // 20px
};
```

### Typography Scale
```typescript
const typography = {
  'heading-lg': 'text-2xl font-bold text-zinc-50',
  'heading-md': 'text-base font-semibold text-zinc-100',
  'heading-sm': 'text-sm font-medium text-zinc-100',
  'body': 'text-sm text-zinc-400',
  'caption': 'text-xs text-zinc-500',
};
```

## References

- [Design Migration Guide](./DESIGN_MIGRATION_GUIDE.md)
- Tailwind CSS Zinc Color Documentation
- CSS Backdrop Filter Specification
- WCAG 2.1 Contrast Guidelines