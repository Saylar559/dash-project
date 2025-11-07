import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Локальная и сетевая адресация для backend
const BACKEND_HOST = process.env.BACKEND_HOST || '10.10.3.58'; // или 'localhost'
const BACKEND_PORT = process.env.BACKEND_PORT || '8000';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: `http://${BACKEND_HOST}:${BACKEND_PORT}`,
        changeOrigin: true,
        secure: false,
        ws: false,
      }
    }
  }
});
