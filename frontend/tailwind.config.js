/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        notion: {
          bg: '#ffffff',
          'bg-dark': '#191919',
          sidebar: '#f7f6f3',
          'sidebar-dark': '#202020',
          card: '#ffffff',
          'card-dark': '#252525',
          border: '#e3e2de',
          'border-dark': '#373737',
          'text-primary': '#373737',
          'text-primary-dark': 'rgba(255,255,255,0.9)',
          'text-secondary': '#787774',
          'text-secondary-dark': 'rgba(255,255,255,0.45)',
          'text-tertiary': '#b4b4b0',
          'text-tertiary-dark': 'rgba(255,255,255,0.3)',
          hover: '#ebebea',
          'hover-dark': '#2f2f2f',
        },
      },
    },
  },
  plugins: [],
}
