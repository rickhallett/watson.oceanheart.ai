import React, { InputHTMLAttributes, ReactNode, forwardRef } from 'react';

interface MonochromeInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

/**
 * MonochromeInput Component
 * Input field implementation for the monochrome design system
 * Supports icons, labels, errors, and hints
 */
export const MonochromeInput = forwardRef<HTMLInputElement, MonochromeInputProps>(
  (
    {
      label,
      error,
      hint,
      icon,
      rightIcon,
      fullWidth = true,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    // Generate ID if not provided
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className={`${fullWidth ? 'w-full' : ''}`}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-zinc-100 mb-1"
          >
            {label}
          </label>
        )}

        {/* Input container */}
        <div className="relative">
          {/* Left icon */}
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
              {icon}
            </span>
          )}

          {/* Input field */}
          <input
            ref={ref}
            id={inputId}
            className={`
              w-full
              ${icon ? 'pl-10' : 'px-3'}
              ${rightIcon ? 'pr-10' : 'px-3'}
              py-2.5
              bg-zinc-800 
              border ${error ? 'border-red-500' : 'border-zinc-700'}
              text-zinc-100 
              placeholder-zinc-500
              rounded-md
              focus:outline-none 
              ${error ? 'focus:border-red-400' : 'focus:border-zinc-600'}
              focus:ring-1 
              ${error ? 'focus:ring-red-400' : 'focus:ring-zinc-600'}
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              ${className}
            `}
            aria-invalid={!!error}
            aria-describedby={
              error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
            }
            {...props}
          />

          {/* Right icon */}
          {rightIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">
              {rightIcon}
            </span>
          )}
        </div>

        {/* Error message */}
        {error && (
          <p id={`${inputId}-error`} className="mt-1 text-xs text-red-500">
            {error}
          </p>
        )}

        {/* Hint message */}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="mt-1 text-xs text-zinc-500">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

MonochromeInput.displayName = 'MonochromeInput';

/**
 * InputGroup Component
 * Groups form inputs with proper spacing
 */
interface InputGroupProps {
  children: ReactNode;
  className?: string;
}

export function InputGroup({ children, className = '' }: InputGroupProps) {
  return <div className={`space-y-4 ${className}`}>{children}</div>;
}

/**
 * FormSection Component
 * Groups related form fields with a title
 */
interface FormSectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function FormSection({
  title,
  description,
  children,
  className = '',
}: FormSectionProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {(title || description) && (
        <div>
          {title && (
            <h3 className="text-base font-semibold text-zinc-100">{title}</h3>
          )}
          {description && (
            <p className="mt-0.5 text-sm text-zinc-400">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}