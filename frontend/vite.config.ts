import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/error-annotation/',
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/error-annotation/api': {
        target: 'http://localhost:8002',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/error-annotation/, ''),
      },
      '/error-annotation/uploads': {
        target: 'http://localhost:8002',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/error-annotation/, ''),
      },
    },
  },
})
