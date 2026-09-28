import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: '#FFF65B', base: '#FAFAF8', ink: '#111111', muted: '#6B6B6B',
        border: '#E5E5E0', alert: '#E2725B', warn: '#D9A441', success: '#6B9080',
        white: '#FFFFFF',
      },
      fontFamily: { sans: ['DM Sans', 'sans-serif'], display: ['DM Sans', 'sans-serif'], mono: ['DM Sans', 'sans-serif'] },
      boxShadow: { card: '0 1px 2px rgba(17,17,17,.04)' },
    },
  },
  plugins: [],
} satisfies Config
