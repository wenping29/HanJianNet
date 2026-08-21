/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0E0B08',
        inkcard: '#171310',
        inksoft: '#2B2620',
        paper: '#F2EAD8',
        paperdim: '#C9BFA6',
        paperedge: '#D9CBA8',
        cinnabar: '#9B2B2B',
        cinnabarlight: '#C04A3A',
        bronze: '#8C6B3A',
        bronzelight: '#B9975B',
        bamboo: '#3E544A',
        bamboolight: '#6E8F7E',
      },
      fontFamily: {
        song: ['"Noto Serif SC"', '"Source Han Serif SC"', 'STSong', 'SimSun', 'serif'],
        garamond: ['"EB Garamond"', 'Georgia', 'serif'],
      },
      boxShadow: {
        card: '0 2px 14px rgba(0,0,0,0.45)',
        seal: '0 0 0 1px rgba(155,43,43,0.55), 0 2px 10px rgba(155,43,43,0.25)',
      },
    },
  },
  plugins: [],
}
