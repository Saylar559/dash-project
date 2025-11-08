import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Укажи здесь IP сервера, где запущен backend (FastAPI)
const BACKEND_HOST = '10.10.3.58'; // или замени на свой production-домен
const BACKEND_PORT = '8000';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',    // Доступен с других устройств!
    port: 5173,
    proxy: {
      '/api': {
        target: `http://${BACKEND_HOST}:${BACKEND_PORT}`,
        changeOrigin: true,
        secure: false,
        ws: false
      }
    }
  }
});
