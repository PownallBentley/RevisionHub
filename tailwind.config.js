/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-purple': '#8B5CF6',
        'brand-purple-light': '#A78BFA',
        'brand-purple-dark': '#7C3AED',
        'calm-purple': '#8B5CF6',
        'calm-purple-dark': '#7C3AED',
        'soft-green': '#10B981',
        'neutral-bg': '#F9FAFB',
      },
    },
  },
  plugins: [],
}
