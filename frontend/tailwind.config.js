/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#080808',
        surface: '#111111',
        'surface-2': '#1a1a1a',
        line: 'rgba(255,255,255,0.06)',
        'line-bright': 'rgba(255,255,255,0.14)',
        glass: 'rgba(255,255,255,0.03)',
        'glass-border': 'rgba(255,255,255,0.08)',
        accent: '#7c3aed',
        'accent-green': '#10b981',
        'accent-amber': '#f59e0b',
        'accent-blue': '#3b82f6',
        primary: '#f1f1f1',
        muted: 'rgba(255,255,255,0.4)'
      },
      transitionDuration: { DEFAULT: '150ms' },
      fontWeight: { thin: '200' }
    }
  },
  plugins: []
};
