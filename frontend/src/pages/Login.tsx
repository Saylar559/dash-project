import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lock, ArrowRight } from 'lucide-react';
import "./style_page/LoginPage.css"; // укажи правильный путь!

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        switch (user.role) {
          case 'ADMIN': navigate('/admin', { replace: true }); break;
          case 'DEVELOPER': navigate('/developer', { replace: true }); break;
          case 'ACCOUNTANT': navigate('/accountant', { replace: true }); break;
          case 'DASHBOARD_USER':
          case 'USER': navigate('/viewer', { replace: true }); break;
          default: navigate('/', { replace: true });
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      let errorMessage = 'Неверный логин или пароль';
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (typeof detail === 'string') errorMessage = detail;
        else if (Array.isArray(detail)) errorMessage = detail.map((e: any) => e.msg).join(', ');
        else if (typeof detail === 'object') errorMessage = JSON.stringify(detail);
      } else if (err.message) errorMessage = err.message;
      setError(errorMessage);
    } finally { setLoading(false); }
  };

  const testAccounts = [
    { username: 'admin', password: 'admin123', role: 'Администратор', color: 'from-red-500 to-pink-500', icon: '🛡️' },
    { username: 'developer', password: 'dev123', role: 'Разработчик', color: 'from-blue-500 to-cyan-500', icon: '💻' },
    { username: 'buhgalter', password: 'buh123', role: 'Бухгалтер', color: 'from-green-500 to-emerald-500', icon: '💰' },
    { username: 'viewer', password: 'viewer123', role: 'Просмотр', color: 'from-purple-500 to-violet-500', icon: '👁️' },
  ];

  const quickLogin = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
  };

  return (
    <div className="login-bg">
      {/* BACKGROUND BLUR CIRCLES */}
      <div className="login-bg-blur">
        <div className="login-circle1" />
        <div className="login-circle2" />
      </div>
      <div className="login-main-card">
        {/* HEADER */}
        <div className="login-card-header">
          <div className="login-lock-icon">
            <Lock className="text-white" size={36} />
          </div>
          <h1 className="login-form-title">Dashboard System</h1>
          <p className="login-form-desc">Войдите в вашу учетную запись</p>
        </div>
        {/* FORM */}
        <form onSubmit={handleSubmit} className="login-form-section">
          <label className="login-label">Имя пользователя</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="login-input"
            placeholder="developer"
            required
            disabled={loading}
          />
          <label className="login-label">Пароль</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
            placeholder="••••••••"
            required
            disabled={loading}
          />
          {error && (
            <div className="login-error">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="font-semibold text-sm">Ошибка входа</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="login-btn-main"
          >
            <span className="text-lg">{loading ? 'Вход в систему...' : 'Войти'}</span>
            <ArrowRight size={20} />
          </button>
        </form>
        {/* DIVIDER */}
        <div className="login-quick-divider">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
          <span>Быстрый вход</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
        </div>
        {/* TEST ACCOUNTS */}
        <div className="login-test-accounts">
          {testAccounts.map((account) => (
            <button
              key={account.username}
              onClick={() => quickLogin(account.username, account.password)}
              disabled={loading}
              className="login-test-account-btn"
              style={{ background: undefined }}
            >
              <div style={{ fontSize: 28, marginBottom: 7 }}>{account.icon}</div>
              <div style={{ fontWeight: 600 }}>{account.role}</div>
              <div style={{ fontSize: 13 }}>{account.username}</div>
            </button>
          ))}
        </div>
        {/* FOOTER */}
        <div className="login-footer">
          <div className="login-footer-main">
            Нажмите на карточку роли для быстрого входа
          </div>
          <div className="login-footer-links">
            <span>© 2025 Dashboard System</span>
            <span>•</span>
            <a href="https://github.com/Saylar559/escrow-dashboard" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
          </div>
        </div>
      </div>


    </div>
  );
};

export default Login;
