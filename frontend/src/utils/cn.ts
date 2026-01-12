/**
 * Class name utility for Watson application
 * Combines clsx and tailwind-merge for optimal Tailwind CSS class handling
 * Used extensively in Aceternity UI components
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names with proper Tailwind CSS merging
 * Handles conditional classes and merges conflicting Tailwind classes
 * 
 * @param inputs - Class values to combine
 * @returns Merged and optimized class string
 * 
 * @example
 * cn('px-4 py-2', 'bg-blue-500', { 'text-white': isActive })
 * cn('p-4', 'px-6') // Results in 'py-4 px-6' (px-4 is overridden)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export default cn;