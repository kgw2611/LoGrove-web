import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://43.200.183.163:8080',
        changeOrigin: true,
      },
      '/images/posts': {
        target: 'http://43.200.183.163:8080',
        changeOrigin: true,
      },
    },
  },
})
