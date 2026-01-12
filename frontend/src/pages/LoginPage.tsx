import React, { useState } from 'react';
import { SkewedBackground } from '../components/SkewedBackground';
import { MonochromeInput } from '../components/MonochromeInput';
import { MonochromeButton } from '../components/MonochromeButton';
import { Toast } from '../components/Toast';
import { Skeleton } from '../components/Skeleton';
import { CommandPalette, useCommandPalette, defaultCommands } from '../components/CommandPalette';

// Icon components (can be replaced with actual icon library)
const MailIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

interface LoginPageProps {
  onLogin?: (email: string, password: string) => void;
}

/**
 * LoginPage Component
 * Authentication page with monochrome design system
 */
export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'warning' | 'info' }>({ 
    show: false, message: '', type: 'info' 
  });
  const commandPalette = useCommandPalette();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Basic validation
    const newErrors: typeof errors = {};
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setToast({
        show: true,
        message: 'Please fix the form errors and try again',
        type: 'error'
      });
      return;
    }

    // Submit
    setLoading(true);
    try {
      await onLogin?.(email, password);
      setToast({
        show: true,
        message: 'Login successful! Redirecting...',
        type: 'success'
      });
    } catch (error) {
      setToast({
        show: true,
        message: 'Login failed. Please check your credentials.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      {/* Background effect */}
      <SkewedBackground opacity={0.03} />

      {/* Login card */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-zinc-50 mb-2">
            Watson
          </h1>
          <p className="text-sm text-zinc-400">
            Clinical LLM Review Tool
          </p>
        </div>

        {/* Glass card container */}
        <div className="glass-card p-6 space-y-6">
          {loading && (
            <div className="space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          )}
          {!loading && (
            <div>
              <h2 className="text-xl font-semibold text-zinc-100 mb-1">
                Welcome back
              </h2>
              <p className="text-sm text-zinc-400">
                Sign in to access your clinical workspace
              </p>
            </div>
          )}

          {/* Form */}
          {!loading && (
            <form onSubmit={handleSubmit} className="space-y-4">
            <MonochromeInput
              type="email"
              label="Email"
              placeholder="name@clinic.com"
              icon={<MailIcon />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              disabled={loading}
            />

            <MonochromeInput
              type="password"
              label="Password"
              placeholder="Enter your password"
              icon={<LockIcon />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              disabled={loading}
            />

            {/* Remember me & Forgot password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 bg-zinc-800 border-zinc-700 rounded text-zinc-100 
                    focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
                  disabled={loading}
                />
                <span className="ml-2 text-sm text-zinc-400">Remember me</span>
              </label>

              <a
                href="#forgot"
                className="text-sm text-zinc-400 hover:text-zinc-300 transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  commandPalette.open();
                }}
              >
                Forgot password?
              </a>
            </div>

            {/* Submit button */}
            <MonochromeButton
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
            >
              Sign in
            </MonochromeButton>
            </form>
          )}

          {/* Divider */}
          {!loading && (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-zinc-900/50 text-zinc-500">Or continue with</span>
              </div>
            </div>
          )}

          {/* SSO options */}
          {!loading && (
            <div className="grid grid-cols-2 gap-3">
              <MonochromeButton
                variant="ghost"
                size="md"
                disabled={loading}
                onClick={() => {
                  setToast({
                    show: true,
                    message: 'Google SSO integration coming soon',
                    type: 'info'
                  });
                }}
              >
                Google
              </MonochromeButton>
              <MonochromeButton
                variant="ghost"
                size="md"
                disabled={loading}
                onClick={() => {
                  setToast({
                    show: true,
                    message: 'Microsoft SSO integration coming soon',
                    type: 'info'
                  });
                }}
              >
                Microsoft
              </MonochromeButton>
            </div>
          )}

          {/* Sign up link */}
          {!loading && (
            <p className="text-center text-sm text-zinc-400">
              Don't have an account?{' '}
              <a
                href="#signup"
                className="text-zinc-300 hover:text-zinc-100 transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  setToast({
                    show: true,
                    message: 'Registration opening soon',
                    type: 'info'
                  });
                }}
              >
                Sign up
              </a>
            </p>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-zinc-500 mt-8">
          © 2025 Oceanheart.ai · Privacy · Terms
        </p>
      </div>
      
      {/* Toast Notifications */}
      {toast.show && (
        <div className="fixed bottom-8 right-8 z-50">
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast({ ...toast, show: false })}
          />
        </div>
      )}
      
      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPalette.isOpen}
        onClose={commandPalette.close}
        commands={[
          ...defaultCommands,
          {
            id: 'forgot-password',
            title: 'Forgot Password',
            description: 'Reset your password',
            shortcut: '⌘R',
            action: () => {
              setToast({
                show: true,
                message: 'Password reset feature coming soon',
                type: 'info'
              });
            }
          }
        ]}
      />
    </div>
  );
}