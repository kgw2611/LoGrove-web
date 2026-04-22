import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://52.79.122.225:8080',
        changeOrigin: true,
      },
      '/images/posts': {
        target: 'http://52.79.122.225:8080',
        changeOrigin: true,
      },
    },
  },
})
