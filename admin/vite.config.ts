import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174
  },
  build: {
    rollupOptions: {
      output: {
        // 显式 contenthash 命名：内容不变文件名不变（可长缓存），内容变化即换名（浏览器必然拉新，解决旧页面残留）
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        // 框架代码单独成 chunk：业务更新不波及 react 等大依赖的缓存
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
})
