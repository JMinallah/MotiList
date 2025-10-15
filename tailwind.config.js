/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Light mode - "Pastel Delight" theme
        pastel: {
          background: '#FFF8F5',
          card: '#FFFFFF',
          primary: '#FF9A8B',
          accent: '#FFD6A5',
          success: '#A8E6CF',
          warning: '#FFB6B9',
          textPrimary: '#2E2E2E',
          textSecondary: '#6B6B6B',
          progress: '#FFA69E',
          shadow: 'rgba(0,0,0,0.06)',
        },
        // Dark mode - "Midnight Bloom" theme
        midnight: {
          background: '#1A1B1F',
          card: '#25262A',
          primary: '#FF8C70',
          accent: '#FFC67C',
          success: '#5EE6A0',
          warning: '#FF7B81',
          textPrimary: '#F8F8F8',
          textSecondary: '#A7A9AC',
          progress: '#FF9A8B',
          shadow: 'rgba(255,255,255,0.05)',
        }
      }
    },
  },
  plugins: [],
  darkMode: 'class', // Enable dark mode with class-based approach
}

