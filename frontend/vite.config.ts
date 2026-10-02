import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      // Endpoint padrão de logout do Spring Security (fora do prefixo /api).
      '/logout': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
