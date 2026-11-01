/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        kairo: {
          bg: '#08090E',
          card: '#0F121C',
          surface: '#151926',
          border: 'rgba(255, 255, 255, 0.08)',
          'border-focus': 'rgba(139, 92, 246, 0.45)',
          muted: '#8E95AA',
          text: '#F1F3F9',
          violet: {
            DEFAULT: '#8B5CF6',
            glow: '#A78BFA',
            dark: '#6D28D9',
          },
          blue: {
            DEFAULT: '#3B82F6',
            glow: '#60A5FA',
            electric: '#0EA5E9',
          },
          cyan: {
            DEFAULT: '#06B6D4',
            glow: '#22D3EE',
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'glow-violet': '0 0 35px -5px rgba(139, 92, 246, 0.25)',
        'glow-blue': '0 0 35px -5px rgba(59, 130, 246, 0.25)',
        'glass-card': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      animation: {
        'pulse-subtle': 'pulseSubtle 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        pulseSubtle: {
          '0%, 100%': { opacity: '0.85', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.02)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
}
