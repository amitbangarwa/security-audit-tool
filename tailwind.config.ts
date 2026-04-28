import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx,html}'],
  darkMode: 'media',
  theme: {
    extend: {
      width: {
        popup: '420px',
      },
      maxHeight: {
        popup: '580px',
      },
      colors: {
        brand: {
          50: '#EBF2FF',
          500: '#3B82F6',
          600: '#1A56DB',
          700: '#1341B8',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
