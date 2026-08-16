/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // 浅色主题色板
        primary: {
          DEFAULT: '#6C63FF',
          light: '#8B83FF',
          dark: '#574FCC',
        },
        accent: {
          DEFAULT: '#FF6B9D',
          light: '#FF8FB5',
          dark: '#CC5579',
        },
        cat: {
          body: '#FFCC80',
          dark: '#FFB74D',
          light: '#FFE0B2',
        },
      },
      fontSize: {
        '2xs': '0.625rem',
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
};
