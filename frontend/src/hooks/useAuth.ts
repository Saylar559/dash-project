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
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const login = async (username: string, password: string) => {
    // ПРАВИЛЬНЫЙ формат для OAuth2
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);

    const response = await api.post('/api/auth/login', params, {
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded' 
      },
    });

    const { access_token } = response.data;
    localStorage.setItem('token', access_token);

    const userResponse = await api.get('/api/users/me');
    localStorage.setItem('user', JSON.stringify(userResponse.data));
  };

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isAuthenticated = !!localStorage.getItem('token');
  const loading = false;

  return { user, login, logout, isAuthenticated, loading };
};
