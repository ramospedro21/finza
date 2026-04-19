import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      colors: {
        brand: {
          50:  '#f0fdf4',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
        },
        surface: {
          900: '#0a0f0d',
          800: '#111a14',
          700: '#1a2b1f',
          600: '#243d2a',
        },
      },
    },
  },
  plugins: [],
};

export default config;