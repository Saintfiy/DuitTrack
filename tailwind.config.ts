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
      colors: {
        primary: '#F4F4F5', // Putih halus (Zinc 100)
        secondary: '#A1A1AA', // Abu-abu terang (Zinc 400)
        accent: '#D4D4D8', // Abu-abu (Zinc 300)
        dark: '#18181B', // Abu-abu gelap (Zinc 900)
        darker: '#09090B', // Hitam/Abu-abu sangat gelap (Zinc 950)
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'glass': 'rgba(255, 255, 255, 0.125)',
      },
      backdropBlur: {
        xs: '2px',
      },
      keyframes: {
        glow: {
          '0%, 100%': { textShadow: '0 0 20px rgba(139, 92, 246, 0.5)' },
          '50%': { textShadow: '0 0 40px rgba(139, 92, 246, 0.8)' },
        },
      },
      animation: {
        glow: 'glow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
export default config
