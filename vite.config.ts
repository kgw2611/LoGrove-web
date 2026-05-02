import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://3.38.12.226:8080', // 새 주소로 변경
        changeOrigin: true,
      },
      '/images/posts': {
        target: 'http://3.38.12.226:8080', //  새 주소로 변경
        changeOrigin: true,
      },
    },
  },
})