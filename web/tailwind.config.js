/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // 颜色取自 CSS 变量，由 index.css 中的 [data-theme] 定义，实现主题切换
      colors: {
        ink: 'rgb(var(--c-ink) / <alpha-value>)',
        inkcard: 'rgb(var(--c-inkcard) / <alpha-value>)',
        inksoft: 'rgb(var(--c-inksoft) / <alpha-value>)',
        paper: 'rgb(var(--c-paper) / <alpha-value>)',
        paperlight: 'rgb(var(--c-paperlight) / <alpha-value>)',
        paperdim: 'rgb(var(--c-paperdim) / <alpha-value>)',
        paperedge: 'rgb(var(--c-paperedge) / <alpha-value>)',
        cinnabar: 'rgb(var(--c-cinnabar) / <alpha-value>)',
        cinnabarlight: 'rgb(var(--c-cinnabarlight) / <alpha-value>)',
        bronze: 'rgb(var(--c-bronze) / <alpha-value>)',
        bronzelight: 'rgb(var(--c-bronzelight) / <alpha-value>)',
        bamboo: 'rgb(var(--c-bamboo) / <alpha-value>)',
        bamboolight: 'rgb(var(--c-bamboolight) / <alpha-value>)',
      },
      fontFamily: {
        song: ['"Noto Serif SC"', '"Source Han Serif SC"', 'STSong', 'SimSun', 'serif'],
        garamond: ['"EB Garamond"', 'Georgia', 'serif'],
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        seal: '0 0 0 1px rgb(var(--c-cinnabar) / 0.55), 0 2px 10px rgb(var(--c-cinnabar) / 0.25)',
      },
    },
  },
  plugins: [],
}
