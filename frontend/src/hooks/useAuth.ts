import { useCallback } from 'react';
import api from '../services/api';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

export const useAuth = (): AuthContextType => {
  // Быстрый logout (удаляем токен, пользователя, редиректим на /login)
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }, []);

  // Логин — сохраняем токен и профайл пользователя в локальное хранилище
  const login = useCallback(async (username: string, password: string) => {
    const params = new URLSearchParams();
    params.append('username', username.trim());
    params.append('password', password);

    const response = await api.post('/api/auth/login', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const { access_token } = response.data;
    localStorage.setItem('token', access_token);

    // Делаем запрос к /api/users/me (или /me — зависит от бэкенда)
    const userResponse = await api.get('/api/users/me', {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });
    localStorage.setItem('user', JSON.stringify(userResponse.data));
  }, []);

  // Декодируем пользователя из localStorage
  const userStr = localStorage.getItem('user');
  const user: User | null = userStr ? JSON.parse(userStr) : null;
  const isAuthenticated = Boolean(localStorage.getItem('token'));
  const loading = false; // Если потребуется асинхронная аутентификация — можно сделать true

  return { user, login, logout, isAuthenticated, loading };
};
