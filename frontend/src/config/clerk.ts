/**
 * Clerk authentication configuration
 * Temporary auth solution while passport.oceanheart.ai is down
 */

// Clerk publishable key - safe to expose in frontend
export const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';

// Check if Clerk is configured
export function isClerkConfigured(): boolean {
  return !!CLERK_PUBLISHABLE_KEY;
}

// Clerk appearance configuration to match Watson's dark theme
export const clerkAppearance = {
  baseTheme: undefined, // Will use Clerk's dark mode based on user preference
  variables: {
    colorPrimary: '#ffffff',
    colorBackground: '#09090b',
    colorInputBackground: '#18181b',
    colorInputText: '#fafafa',
    colorText: '#fafafa',
    colorTextSecondary: '#a1a1aa',
    colorDanger: '#ef4444',
    colorSuccess: '#22c55e',
    borderRadius: '0.5rem',
    fontFamily: 'inherit',
  },
  elements: {
    // Root container
    rootBox: 'bg-zinc-950',
    card: 'bg-zinc-900/80 backdrop-blur border border-zinc-800 shadow-xl',

    // Header
    headerTitle: 'text-zinc-50 font-bold',
    headerSubtitle: 'text-zinc-400',

    // Form elements
    formButtonPrimary:
      'bg-zinc-50 text-zinc-900 hover:bg-zinc-200 font-medium transition-colors',
    formButtonReset:
      'text-zinc-400 hover:text-zinc-50',
    formFieldLabel: 'text-zinc-300',
    formFieldInput:
      'bg-zinc-800 border-zinc-700 text-zinc-50 focus:border-zinc-500 focus:ring-zinc-500',
    formFieldInputShowPasswordButton: 'text-zinc-400 hover:text-zinc-50',

    // Social buttons
    socialButtonsBlockButton:
      'bg-zinc-800 border-zinc-700 text-zinc-50 hover:bg-zinc-700 transition-colors',
    socialButtonsBlockButtonText: 'text-zinc-50',

    // Divider
    dividerLine: 'bg-zinc-800',
    dividerText: 'text-zinc-500',

    // Footer
    footer: 'hidden', // Hide Clerk branding
    footerAction: 'text-zinc-400',
    footerActionLink: 'text-zinc-50 hover:text-zinc-200',

    // Identity preview
    identityPreviewText: 'text-zinc-50',
    identityPreviewEditButton: 'text-zinc-400 hover:text-zinc-50',

    // User button
    userButtonBox: 'focus:ring-zinc-500',
    userButtonTrigger: 'focus:ring-zinc-500',
    userButtonPopoverCard: 'bg-zinc-900 border border-zinc-800',
    userButtonPopoverActionButton: 'text-zinc-300 hover:text-zinc-50 hover:bg-zinc-800',
    userButtonPopoverActionButtonText: 'text-zinc-300',
    userButtonPopoverFooter: 'hidden',

    // Alerts
    alert: 'bg-zinc-800 border-zinc-700 text-zinc-50',
    alertText: 'text-zinc-50',
  },
};

// Sign in/up redirect URLs
export const clerkRoutes = {
  signIn: '/sign-in',
  signUp: '/sign-up',
  afterSignIn: '/app',
  afterSignUp: '/app',
};
