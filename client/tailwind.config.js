/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      colors: {
        primary: {
          50:  '#f0f9f1',
          100: '#dcf1e0',
          200: '#bbe3c5',
          300: '#8dcc9e',
          400: '#5aad71',
          500: '#2f8d46', // Main green
          600: '#26753a', // Hover green
          700: '#215d31',
          800: '#1d4a2a',
          900: '#193d25',
        },
        sidebar: {
          bg:      '#ffffff',
          hover:   '#f6f7f3',
          active:  '#f0fdf4',
          border:  '#e5e7eb',
          text:    '#374151',
          textActive: '#2f8d46',
        },
        surface: {
          bg: '#f6f7f3',
        }
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,.08), 0 1px 2px -1px rgba(0,0,0,.06)',
        'card-hover': '0 10px 25px -5px rgba(0,0,0,.1), 0 8px 10px -6px rgba(0,0,0,.1)',
      },
      animation: {
        'fade-in':     'fadeIn 0.3s ease-out',
        'slide-in':    'slideIn 0.3s ease-out',
        'slide-up':    'slideUp 0.4s ease-out',
        'pulse-slow':  'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' },                    to: { opacity: '1' } },
        slideIn: { from: { transform: 'translateX(-16px)', opacity: '0' }, to: { transform: 'translateX(0)', opacity: '1' } },
        slideUp: { from: { transform: 'translateY(16px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
      },
    },
  },
  plugins: [],
};
