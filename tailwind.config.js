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
      keyframes: {
        'bounce-in': {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '50%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'achievement-pop': {
          '0%': { transform: 'scale(0.5) rotate(-10deg)', opacity: '0' },
          '50%': { transform: 'scale(1.1) rotate(5deg)' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
        'confetti-fall': {
          '0%': { transform: 'translateY(-100vh) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(100vh) rotate(720deg)', opacity: '0' },
        },
        'confetti-1': {
          '0%': { transform: 'translateY(0) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(300px) translateX(-50px) rotate(360deg)', opacity: '0' },
        },
        'confetti-2': {
          '0%': { transform: 'translateY(0) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(300px) translateX(30px) rotate(-360deg)', opacity: '0' },
        },
        'confetti-3': {
          '0%': { transform: 'translateY(0) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(300px) translateX(50px) rotate(360deg)', opacity: '0' },
        },
        'confetti-4': {
          '0%': { transform: 'translateY(0) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(300px) translateX(-30px) rotate(-360deg)', opacity: '0' },
        },
        'confetti-5': {
          '0%': { transform: 'translateY(0) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(300px) translateX(10px) rotate(360deg)', opacity: '0' },
        },
        'bounce-up-fade': {
          '0%': { transform: 'translateY(0) scale(1)', opacity: '1' },
          '100%': { transform: 'translateY(-100px) scale(1.5)', opacity: '0' },
        },
      },
      animation: {
        'bounce-in': 'bounce-in 0.6s ease-out forwards',
        'achievement-pop': 'achievement-pop 0.5s ease-out forwards',
        'confetti-fall': 'confetti-fall 3s ease-in forwards',
        'confetti-1': 'confetti-1 2s ease-out forwards',
        'confetti-2': 'confetti-2 2.2s ease-out forwards',
        'confetti-3': 'confetti-3 1.8s ease-out forwards',
        'confetti-4': 'confetti-4 2.1s ease-out forwards',
        'confetti-5': 'confetti-5 1.9s ease-out forwards',
        'bounce-up-fade': 'bounce-up-fade 1s ease-out forwards',
      },
    },
  },
  plugins: [],
}