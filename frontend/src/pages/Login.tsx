import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lock, ArrowRight } from 'lucide-react';
import "./style_page/LoginPage.css";

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
          case 'USER': 
          case 'VIEWER': 
            navigate('/viewer', { replace: true }); 
            break;
          default: navigate('/', { replace: true });
        }
      }
    } catch (err: any) {
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
    { username: 'viewer', password: 'viewer123', role: 'Гость/Просмотр', color: 'from-purple-500 to-violet-500', icon: '👁️' },
  ];

  const quickLogin = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
  };

  return (
    <div className="login-bg">
      <div className="login-bg-blur">
        <div className="login-circle1" />
        <div className="login-circle2" />
      </div>
      <div className="login-main-card">
        <div className="login-card-header">
          <div className="login-lock-icon">
            <Lock className="text-white" size={36} />
          </div>
          <h1 className="login-form-title">Dashboard System</h1>
          <p className="login-form-desc">Войдите в вашу учетную запись</p>
        </div>
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
            autoFocus
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
            <div className="login-error animate-fadeIn">
              <span style={{ fontSize: 21, marginRight: 8 }}>⚠️</span>
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
            <span>{loading ? 'Вход...' : 'Войти'}</span>
            <ArrowRight size={20} />
          </button>
        </form>
        <div className="login-quick-divider">
          <div className="divider-line" />
          <span>Быстрый вход</span>
          <div className="divider-line" />
        </div>
        <div className="login-test-accounts">
          {testAccounts.map((account) => (
            <button
              key={account.username}
              onClick={() => quickLogin(account.username, account.password)}
              disabled={loading}
              className="login-test-account-btn"
              tabIndex={0}
              type="button"
              aria-label={`Быстрый вход как ${account.role}`}
              style={{
                background: "linear-gradient(135deg,#f1fcff,#f9f7ff 70%)",
                boxShadow: "0 2px 12px 0 rgba(34,49,72,.10)",
                border: "1px solid #dde6f7",
                outline: "none"
              }}
            >
              <div className="login-test-account-icon" style={{ fontSize: 28, margin: "0 auto" }}>{account.icon}</div>
              <div className="login-test-account-role">{account.role}</div>
              <div className="login-test-account-user">{account.username}</div>
            </button>
          ))}
        </div>
        <div className="login-footer">
          <div className="login-footer-main">
            Для быстрой авторизации выберите одну из ролей
          </div>
          <div className="login-footer-links">
            <span>© 2025 Dashboard System</span>
            <span>•</span>
            <a href="https://github.com/Saylar559/escrow-dashboard" target="_blank" rel="noopener noreferrer">GitHub</a>
          </div>
          <div className="login-footer-dev">
            Разработчик: Бочаров Юрий <span className="footer-user">@Y_vostok</span> / Монолит
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
