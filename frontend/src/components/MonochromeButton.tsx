import React, { ButtonHTMLAttributes, ReactNode } from 'react';

interface MonochromeButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
}

/**
 * MonochromeButton Component
 * Button implementation for the monochrome design system
 * Supports primary, ghost, and icon variants
 */
export function MonochromeButton({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}: MonochromeButtonProps) {
  // Size classes
  const sizeClasses = {
    sm: variant === 'icon' ? 'p-1.5' : 'py-1.5 px-3 text-xs',
    md: variant === 'icon' ? 'p-2' : 'py-2.5 px-4 text-sm',
    lg: variant === 'icon' ? 'p-3' : 'py-3 px-6 text-base',
  };

  // Variant classes
  const variantClasses = {
    primary: `
      bg-zinc-800 border border-zinc-700 text-zinc-100
      hover:bg-zinc-700 hover:border-zinc-600
      focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-zinc-950
    `,
    ghost: `
      bg-transparent border border-zinc-700 text-zinc-100
      hover:bg-zinc-800 hover:border-zinc-600
      focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-zinc-950
    `,
    icon: `
      text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800
      focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-zinc-950
    `,
  };

  // Loading spinner
  const LoadingSpinner = () => (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  const isDisabled = disabled || loading;

  return (
    <button
      className={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        rounded-md font-medium
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        inline-flex items-center justify-center gap-2
        ${className}
      `}
      disabled={isDisabled}
      {...props}
    >
      {loading && iconPosition === 'left' && <LoadingSpinner />}
      {!loading && icon && iconPosition === 'left' && icon}
      {variant !== 'icon' && children}
      {!loading && icon && iconPosition === 'right' && icon}
      {loading && iconPosition === 'right' && <LoadingSpinner />}
    </button>
  );
}

/**
 * ButtonGroup Component
 * Groups multiple buttons together with proper spacing
 */
interface ButtonGroupProps {
  children: ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export function ButtonGroup({
  children,
  align = 'left',
  className = '',
}: ButtonGroupProps) {
  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  };

  return (
    <div className={`flex items-center gap-2 ${alignClasses[align]} ${className}`}>
      {children}
    </div>
  );
}