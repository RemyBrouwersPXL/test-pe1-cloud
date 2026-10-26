/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          yellow: '#F59E0B',
          'yellow-hover': '#D97706',
          dark: '#111827',
          gray: '#1F2937',
          card: '#18202F',
          border: '#374151',
          accent: '#10B981',
          red: '#EF4444',
        }
      }
    },
  },
  plugins: [],
}
