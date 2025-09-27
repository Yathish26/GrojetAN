import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/admin': {
        target: process.env.VITE_SERVER || 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/image': {
        target: process.env.VITE_SERVER || 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/tools': {
        target: process.env.VITE_SERVER || 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
