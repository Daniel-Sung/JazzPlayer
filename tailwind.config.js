/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'jazz-dark': '#0a0a0f',
        'jazz-purple': '#6b21a8',
        'jazz-blue': '#1e40af',
        'jazz-cyan': '#0891b2',
      }
    },
  },
  plugins: [],
}
