/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  "#F7F4FF",
          100: "#EAE3FF",
          200: "#D6C7FF",
          300: "#C3B5FF",
          400: "#9A84FF",
          500: "#744FFF",
          600: "#5B2CFF",
          700: "#4520C5",
          800: "#32168E",
          900: "#2A185E",
        },
        neutral: {
          0:   "#FFFFFF",
          50:  "#F9FAFC",
          100: "#F6F7FB",
          200: "#E1E4EE",
          300: "#CFD3E0",
          400: "#A8AEBD",
          500: "#6C7280",
          600: "#4B5161",
          700: "#1F2330",
          800: "#121420",
          900: "#050611",
        },
        accent: {
          green: "#1EC592",
          amber: "#FFB547",
          red:   "#F05151",
        },
        brand: {
          purple: "#5B2CFF",
          "purple-dark": "#4520C5",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        pill: "999px",
      },
      boxShadow: {
        card: "0 18px 45px rgba(15, 23, 42, 0.06)",
        soft: "0 10px 30px rgba(15, 23, 42, 0.04)",
      },
      backgroundImage: {
        "hero-soft":
          "linear-gradient(135deg, #F7F4FF 0%, #F0F7FF 50%, #FFFFFF 100%)",
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
      },
      maxWidth: {
        "content": "1120px",
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
