import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/statistics': {
        target: 'http://localhost:3011',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/statistics/, '/api/statistics')
      },
      '/api/appointments': {
        target: 'http://localhost:3006',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/appointments/, '/api/appointments')
      },
      '/api/schedule': {
        target: 'http://localhost:3005',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/schedule/, '/api/schedule')
      },
      '/api/room': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/room/, '/api/room')
      },
      '/api/user': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/user/, '/api/user')
      },
      '/api/service': {
        target: 'http://localhost:3003',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/service/, '/api/service')
      },
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
