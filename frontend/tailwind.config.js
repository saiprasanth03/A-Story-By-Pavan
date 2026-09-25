/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#050505',
        surface: '#0f0f12',
        primary: '#ffffff', // Monochromatic High Luxury Crisp White
        primaryDark: '#e5e5e5',
        textPrimary: '#ffffff',
        textSecondary: '#a3a3a3',
        darkGray: '#141417'
      },
      fontFamily: {
        mirage: ['"MADE Mirage"', 'Spectral', 'Georgia', 'serif'],
        spectral: ['Spectral', 'Georgia', 'serif'],
        lato: ['Lato', 'sans-serif'],
        sans: ['Lato', 'sans-serif'],
        oswald: ['"MADE Mirage"', 'Spectral', 'Georgia', 'serif'],
        serif: ['Spectral', 'Georgia', 'serif'],
        playfair: ['"MADE Mirage"', 'Spectral', 'Georgia', 'serif'],
        cinzel: ['"MADE Mirage"', 'Spectral', 'Georgia', 'serif'],
        display: ['"MADE Mirage"', 'Spectral', 'Georgia', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 1s ease-out',
        'slide-up': 'slideUp 0.8s ease-out',
        'shake': 'shake 0.8s cubic-bezier(.36,.07,.19,.97) infinite',
      },
      keyframes: {
        shake: {
          '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
          '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
          '30%, 50%, 70%': { transform: 'translate3d(-4px, 0, 0)' },
          '40%, 60%': { transform: 'translate3d(4px, 0, 0)' },
          
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
