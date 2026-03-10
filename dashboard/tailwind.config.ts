import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        conduit: {
          navy: {
            50: '#e8eaf0',
            100: '#c5c9d9',
            200: '#9ea5bf',
            300: '#7780a5',
            400: '#596593',
            500: '#3b4a81',
            600: '#344379',
            700: '#2b396e',
            800: '#233064',
            900: '#151f4f',
            950: '#0a1029',
          },
          blue: {
            50: '#e3f2ff',
            100: '#bbdeff',
            200: '#8ec9ff',
            300: '#5db3ff',
            400: '#36a2ff',
            500: '#0091ff',
            600: '#0083f5',
            700: '#0071e0',
            800: '#0060cd',
            900: '#0041ac',
          },
          emerald: {
            400: '#34d399',
            500: '#10b981',
            600: '#059669',
          },
          amber: {
            400: '#fbbf24',
            500: '#f59e0b',
            600: '#d97706',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
