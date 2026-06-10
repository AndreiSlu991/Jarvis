/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0c0a08',
        surface: '#18140f',
        'surface-2': '#201c16',
        ink: '#f2ede5',
        dim: 'rgba(242,237,229,0.55)',
        faint: 'rgba(242,237,229,0.32)',
        line: 'rgba(255,255,255,0.08)',
        card: 'rgba(24,20,15,0.52)',
        accent: '#ffa047',
        'accent-soft': '#ffd166',
      }
    }
  },
  plugins: []
};
