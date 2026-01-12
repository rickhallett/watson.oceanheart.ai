// Watson Brand Color Palette
export const watsonTheme = {
  // Primary Watson Blue shades
  primary: {
    50: '#e6f3ff',
    100: '#cce7ff',
    200: '#99cfff',
    300: '#66b7ff',
    400: '#339fff',
    500: '#0087ff', // Main Watson Blue
    600: '#006fcc',
    700: '#005799',
    800: '#003f66',
    900: '#002733',
  },
  
  // Secondary Teal/Cyan for accents
  secondary: {
    50: '#e6fffe',
    100: '#ccfffd',
    200: '#99fffb',
    300: '#66fff9',
    400: '#33f7f0',
    500: '#00e5d9', // Secondary Teal
    600: '#00b8ae',
    700: '#008a82',
    800: '#005c57',
    900: '#002e2b',
  },
  
  // Success Green
  success: {
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
  },
  
  // Warning Amber
  warning: {
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
  },
  
  // Error Red
  error: {
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
  },
  
  // Neutral grays
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0a0a0a',
  },
  
  // Gradient combinations
  gradients: {
    // Primary gradients
    primaryToSecondary: 'from-blue-500 to-cyan-500',
    primaryDark: 'from-blue-600 to-blue-800',
    primaryLight: 'from-blue-400 to-blue-600',
    
    // Card backgrounds
    cardPrimary: 'from-blue-900/20 to-blue-800/20',
    cardSecondary: 'from-cyan-900/20 to-cyan-800/20',
    cardNeutral: 'from-neutral-900/50 to-neutral-800/50',
    
    // Text gradients
    textPrimary: 'from-blue-400 to-cyan-400',
    textHeading: 'from-white to-blue-100',
  },
  
  // Border colors
  borders: {
    primary: 'border-blue-500/20',
    secondary: 'border-cyan-500/20',
    neutral: 'border-neutral-700/50',
    hover: 'border-blue-400/40',
  }
};

// Component-specific color classes
export const componentTheme = {
  // Headers
  header: {
    gradient: 'bg-gradient-to-r from-blue-400 to-cyan-400',
    text: 'bg-clip-text text-transparent',
  },
  
  // Buttons
  button: {
    primary: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800',
    secondary: 'bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800',
    danger: 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800',
    success: 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800',
  },
  
  // Cards
  card: {
    primary: 'bg-gradient-to-br from-blue-900/20 to-blue-800/20 border border-blue-500/20',
    secondary: 'bg-gradient-to-br from-cyan-900/20 to-cyan-800/20 border border-cyan-500/20',
    neutral: 'bg-gradient-to-br from-neutral-900/50 to-neutral-800/50 border border-neutral-700/50',
  },
  
  // Toggle switches
  toggle: {
    active: 'bg-gradient-to-r from-blue-600 to-cyan-600',
    inactive: 'bg-neutral-600',
  },
  
  // Icons
  icon: {
    primary: 'text-blue-400',
    secondary: 'text-cyan-400',
    success: 'text-green-400',
    warning: 'text-amber-400',
    error: 'text-red-400',
  }
};