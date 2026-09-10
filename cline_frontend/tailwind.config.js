/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cs: {
          bg: '#0a0f1a',
          panel: '#111827',
          panelAlt: '#1a2332',
          border: '#2a3548',
          muted: '#64748b',
          text: '#e2e8f0',
          textDim: '#94a3b8',
          primary: '#22d3ee',
          primaryDim: '#0891b2',
          critical: '#ef4444',
          high: '#f97316',
          medium: '#f59e0b',
          low: '#22c55e',
          normal: '#475569',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
