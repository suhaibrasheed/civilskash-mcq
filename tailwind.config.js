/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        theme: {
          bg:             'var(--color-bg)',
          'bg-2':         'var(--color-bg-2)',
          surface:        'var(--color-surface)',
          'surface-2':    'var(--color-surface-2)',
          'surface-hover':'var(--color-surface-hover)',
          text:           'var(--color-text)',
          muted:          'var(--color-text-muted)',
          border:         'var(--color-border)',
          'border-soft':  'var(--color-border-soft)',
          primary:        'rgb(var(--color-primary) / <alpha-value>)',
          accent:         'rgb(var(--color-accent) / <alpha-value>)',
        }
      },
      backgroundImage: {
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-accent':  'var(--gradient-accent)',
      },
      boxShadow: {
        'card':       'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
        'float':      'var(--shadow-float)',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      }
    },
  },
  plugins: [],
}
