/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',   // indigo — primary
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        surface: {
          0:   '#ffffff',
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        success: { light: '#dcfce7', DEFAULT: '#22c55e', dark: '#15803d' },
        danger:  { light: '#fee2e2', DEFAULT: '#ef4444', dark: '#b91c1c' },
        warning: { light: '#fef9c3', DEFAULT: '#eab308', dark: '#a16207' },
        info:    { light: '#dbeafe', DEFAULT: '#3b82f6', dark: '#1d4ed8' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'card':    '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
        'card-md': '0 4px 12px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.03)',
        'card-lg': '0 10px 30px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.04)',
        'brand':   '0 4px 14px rgba(99,102,241,0.20)',
        'brand-lg':'0 8px 25px rgba(99,102,241,0.28)',
        'inner':   'inset 0 2px 4px rgba(0,0,0,0.03)',
      },
      borderRadius: {
        'xl':  '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      animation: {
        'fade-up':   'fadeUp 0.35s ease-out',
        'fade-in':   'fadeIn 0.2s ease-out',
        'slide-in':  'slideIn 0.25s ease-out',
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
      },
      keyframes: {
        fadeUp:   { from: { opacity:'0', transform:'translateY(8px)' }, to: { opacity:'1', transform:'translateY(0)' } },
        fadeIn:   { from: { opacity:'0' }, to: { opacity:'1' } },
        slideIn:  { from: { transform:'translateX(-100%)' }, to: { transform:'translateX(0)' } },
        pulseDot: { '0%,100%': { opacity:'1' }, '50%': { opacity:'0.4' } },
      },
    },
  },
  plugins: [],
}
