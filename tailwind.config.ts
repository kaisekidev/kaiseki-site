import typographyPlugin from '@tailwindcss/typography'
import { type Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{astro,js,jsx,ts,tsx,md,mdx}'],
  darkMode: 'selector',
  theme: {
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.5rem' }],
      base: ['1rem', { lineHeight: '2rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '2rem' }],
      '2xl': ['1.5rem', { lineHeight: '2.5rem' }],
      '3xl': ['2rem', { lineHeight: '2.5rem' }],
      '4xl': ['2.5rem', { lineHeight: '3rem' }],
      '5xl': ['3rem', { lineHeight: '3.5rem' }],
      '6xl': ['3.75rem', { lineHeight: '1' }],
      '7xl': ['4.5rem', { lineHeight: '1' }],
      '8xl': ['6rem', { lineHeight: '1' }],
      '9xl': ['8rem', { lineHeight: '1' }],
    },
    extend: {
      colors: {
        paper: 'hsl(var(--color-paper) / <alpha-value>)',
        red: {
          50: 'hsl(var(--color-red-50) / <alpha-value>)',
          100: 'hsl(var(--color-red-100) / <alpha-value>)',
          200: 'hsl(var(--color-red-200) / <alpha-value>)',
          300: 'hsl(var(--color-red-300) / <alpha-value>)',
          400: 'hsl(var(--color-red-400) / <alpha-value>)',
          500: 'hsl(var(--color-red-500) / <alpha-value>)',
          600: 'hsl(var(--color-red-600) / <alpha-value>)',
          700: 'hsl(var(--color-red-700) / <alpha-value>)',
          800: 'hsl(var(--color-red-800) / <alpha-value>)',
          900: 'hsl(var(--color-red-900) / <alpha-value>)',
          950: 'hsl(var(--color-red-950) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: 'var(--font-inter)',
        display: ['var(--font-display)', { fontFeatureSettings: '"ss01"' }],
      },
      maxWidth: {
        '8xl': '88rem',
      },
    },
  },
  plugins: [typographyPlugin],
} satisfies Config
