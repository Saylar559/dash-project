import axios from 'axios';

// Используем только относительный путь — вся маршрутизация осуществляется через vite.config.js proxy!
// Это работает и для dev, и для production, и с любого ПК сети.
// В vite.config.js '/api' -> target: 'http://IP_ТВОЕГО_БЭКЕНДА:8000'

const api = axios.create({
  baseURL: '', // Пустой baseURL значит, что все запросы относительные ('/api/...'), будет работать прокси!
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor для добавления токена (оставляем как есть)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor для 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
