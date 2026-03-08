/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Baloo 2"', 'cursive'],   // titles, headings, card text
        body: ['Nunito', 'sans-serif'],        // all UI text
      },
      colors: {
        salad: {
          green: '#4a7c59',
          lime: '#8bc34a',
          yellow: '#f9c74f',
          orange: '#f4845f',
          red: '#e63946',
          cream: '#fef9ef',
          brown: '#6b4226',
          dark: '#2d4a22',
        },
        veggie: {
          carrot: '#f4845f',
          pepper: '#e63946',
          tomato: '#c1121f',
          lettuce: '#4a7c59',
          onion: '#9b59b6',
          cabbage: '#4a9aba',
        },
      },
      animation: {
        'card-flip': 'cardFlip 0.4s ease-in-out',
        'card-deal': 'cardDeal 0.3s ease-out',
        'bounce-in': 'bounceIn 0.5s cubic-bezier(0.68,-0.55,0.27,1.55)',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s infinite',
      },
      keyframes: {
        cardFlip: {
          '0%': { transform: 'rotateY(0deg)' },
          '50%': { transform: 'rotateY(90deg)' },
          '100%': { transform: 'rotateY(0deg)' },
        },
        cardDeal: {
          '0%': { transform: 'translateY(-20px) scale(0.9)', opacity: '0' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(139,195,74,0.6)' },
          '50%': { boxShadow: '0 0 20px rgba(139,195,74,1)' },
        },
      },
    },
  },
  plugins: [],
};
