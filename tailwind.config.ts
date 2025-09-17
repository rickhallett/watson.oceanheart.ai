import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './frontend/src/**/*.{js,ts,jsx,tsx,mdx}',
    './frontend/**/*.{js,ts,jsx,tsx,mdx}',
    './index.html',
  ],
  theme: {
    extend: {
      colors: {
        // Design system colors
        background: 'rgb(9, 9, 11)', // zinc-950
        surface: 'rgb(24, 24, 27)', // zinc-900
        border: 'rgb(39, 39, 42)', // zinc-800
        'text-primary': 'rgb(250, 250, 250)', // zinc-50
        'text-secondary': 'rgb(161, 161, 170)', // zinc-400
      },
      backgroundColor: {
        'glass': 'rgb(24 24 27 / 0.5)', // zinc-900/50
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'parallax': 'parallax 0.5s ease-out',
        'fade-in': 'fadeIn 0.3s ease-in',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        parallax: {
          '0%': { transform: 'translateY(0px)' },
          '100%': { transform: 'translateY(var(--parallax-offset))' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config