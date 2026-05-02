import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://3.38.12.226',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://3.38.12.226',
        changeOrigin: true,
      },
      '/images/posts': {
        target: 'http://3.38.12.226',
        changeOrigin: true,
      },
    },
  },
})