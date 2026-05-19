import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Sora', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: '#6366f1',
        'primary-light': '#818cf8',
        'primary-dark': '#4f46e5',
        accent: '#f59e0b',
        surface: '#ffffff',
        'surface-2': '#f8fafc',
        'surface-3': '#f1f5f9',
        border: '#e2e8f0',
        // Keep dark colors for internal dashboard
        dark: '#0f172a',
        darker: '#020617',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'mesh': `
          radial-gradient(ellipse at 20% 20%, rgba(99, 102, 241, 0.08) 0%, transparent 60%),
          radial-gradient(ellipse at 80% 80%, rgba(139, 92, 246, 0.06) 0%, transparent 60%)
        `,
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow': '0 0 40px rgba(99, 102, 241, 0.15), 0 4px 24px rgba(0, 0, 0, 0.05)',
        'card': '0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)',
        'elevated': '0 4px 6px -1px rgba(0,0,0,0.05), 0 20px 60px rgba(0,0,0,0.08)',
        'indigo': '0 8px 30px rgba(99, 102, 241, 0.25)',
      },
      keyframes: {
        glow: {
          '0%, 100%': { textShadow: '0 0 20px rgba(99, 102, 241, 0.4)' },
          '50%': { textShadow: '0 0 40px rgba(99, 102, 241, 0.7)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      animation: {
        glow: 'glow 2s ease-in-out infinite',
        float: 'float 4s ease-in-out infinite',
        shimmer: 'shimmer 2.5s infinite',
        'slide-up': 'slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fade-in 0.5s ease-out',
      },
    },
  },
  plugins: [],
}
export default config
