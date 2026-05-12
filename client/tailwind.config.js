/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        duo: ['Nunito', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        'duo-green': {
          base: '#58cc02',
          medium: '#58a700',
          dark: '#478700',
          light: '#79d634',
          ice: '#ecffde',
        },
        'duo-blue': {
          base: '#1cb0f6',
          medium: '#1899d6',
          light: '#63c9f9',
          ice: '#ddf4ff',
        },
        'duo-red': {
          base: '#ff4b4b',
          light: '#ffb2b2',
        },
        'duo-gold': {
          base: '#ffc800',
          orange: '#ff9600',
          medium: '#cd7900',
        },
        'duo-purple': {
          base: '#ce82ff',
          medium: '#a568cc',
          light: '#daa0ff',
        },
        'duo-yellow': {
          base: '#ffd900',
          light: '#ffe700',
        },
        'duo-gray': {
          1: '#4b4b4b',
          2: '#777777',
          3: '#afafaf',
          4: '#b7b7b7',
          5: '#d9d9d9',
          6: '#e5e5e5',
        },
        'duo-text': {
          primary: '#4b4b4b',
          secondary: '#777777',
          tertiary: '#afafaf',
          quaternary: '#d9d9d9',
        },
      },
      borderRadius: {
        duo: '13px',
        'duo-card': '16px',
      },
    },
  },
  plugins: [],
};
