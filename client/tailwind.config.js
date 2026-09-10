/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        climate: {
          dark: '#0B1120',
          card: '#151F32',
          border: '#1E293B',
          accent: '#06B6D4',
          flood: '#3B82F6',
          heat: '#F97316',
          danger: '#EF4444',
          warning: '#F59E0B',
          success: '#10B981',
          muted: '#94A3B8'
        }
      }
    },
  },
  plugins: [],
}
