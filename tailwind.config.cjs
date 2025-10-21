/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#6B7280',
        danger: '#EF4444',
        success: '#10B981',
        warning: '#F59E0B',
      }
    },
  },
  plugins: [],
}
