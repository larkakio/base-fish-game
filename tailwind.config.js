/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ocean: {
          deep: '#0a1628',
          mid: '#0d2847',
          light: '#1a4a7a',
        },
        coral: '#ff6b6b',
        seafoam: '#4ecdc4',
        sand: '#ffe66d',
        pearl: '#f7f7f7',
      },
      fontFamily: {
        game: ['Nunito', 'sans-serif'],
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'swim': 'swim 2s ease-in-out infinite',
        'bubble': 'bubble 4s ease-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        swim: {
          '0%, 100%': { transform: 'translateX(0) rotate(0deg)' },
          '25%': { transform: 'translateX(5px) rotate(3deg)' },
          '75%': { transform: 'translateX(-5px) rotate(-3deg)' },
        },
        bubble: {
          '0%': { transform: 'translateY(0) scale(1)', opacity: '0.8' },
          '100%': { transform: 'translateY(-100px) scale(0.5)', opacity: '0' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(78, 205, 196, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(78, 205, 196, 0.6)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'ocean-gradient': 'linear-gradient(180deg, #0d2847 0%, #0a1628 100%)',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(78, 205, 196, 0.5)',
        'glow-lg': '0 0 40px rgba(78, 205, 196, 0.6)',
        'gold': '0 0 20px rgba(255, 215, 0, 0.5)',
      },
    },
  },
  plugins: [],
}
