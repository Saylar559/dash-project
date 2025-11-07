import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lock, ArrowRight } from 'lucide-react';

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
          case 'ADMIN':
            navigate('/admin', { replace: true });
            break;
          case 'DEVELOPER':
            navigate('/developer', { replace: true });
            break;
          case 'ACCOUNTANT':
            navigate('/accountant', { replace: true });
            break;
          case 'DASHBOARD_USER':
          case 'USER':
            navigate('/viewer', { replace: true });
            break;
          default:
            navigate('/', { replace: true });
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      
      let errorMessage = 'Неверный логин или пароль';
      
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        
        if (typeof detail === 'string') {
          errorMessage = detail;
        } else if (Array.isArray(detail)) {
          errorMessage = detail.map((e: any) => e.msg).join(', ');
        } else if (typeof detail === 'object') {
          errorMessage = JSON.stringify(detail);
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center p-4">
      {/* BACKGROUND BLUR CIRCLES (Apple style) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-300/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-300/30 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* MAIN CARD */}
        <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          {/* HEADER */}
          <div className="text-center pt-12 pb-8 px-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl mb-6 shadow-2xl shadow-blue-500/50 transform hover:scale-105 transition-transform duration-300">
              <Lock className="text-white" size={36} />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">
              Dashboard System
            </h1>
            <p className="text-slate-500 text-lg">
              Войдите в вашу учетную запись
            </p>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">
                Имя пользователя
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200/50 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-900 placeholder-slate-400 disabled:bg-slate-100 disabled:text-slate-500"
                placeholder="developer"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">
                Пароль
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200/50 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-900 placeholder-slate-400 disabled:bg-slate-100 disabled:text-slate-500"
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 px-5 py-4 rounded-2xl flex items-start gap-3 animate-shake">
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
              className="group w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-4 rounded-2xl font-semibold transition-all duration-300 shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="text-lg">{loading ? 'Вход в систему...' : 'Войти'}</span>
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          {/* DIVIDER */}
          <div className="px-8 pb-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Быстрый вход
              </span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
            </div>
          </div>

          {/* TEST ACCOUNTS */}
          <div className="px-8 pb-8">
            <div className="grid grid-cols-2 gap-3">
              {testAccounts.map((account) => (
                <button
                  key={account.username}
                  onClick={() => quickLogin(account.username, account.password)}
                  disabled={loading}
                  className={`group relative overflow-hidden bg-gradient-to-br ${account.color} p-4 rounded-2xl text-white font-medium transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl`}
                >
                  <div className="relative z-10">
                    <div className="text-3xl mb-2">{account.icon}</div>
                    <p className="text-sm font-bold mb-1">{account.role}</p>
                    <p className="text-xs opacity-90">{account.username}</p>
                  </div>
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300" />
                </button>
              ))}
            </div>
          </div>

          {/* FOOTER */}
          <div className="bg-slate-50/50 backdrop-blur-xl px-8 py-6 border-t border-slate-200/50">
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-3">
                Нажмите на карточку роли для быстрого входа
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                <span>© 2025 Dashboard System</span>
                <span>•</span>
                <a href="https://github.com/Saylar559/escrow-dashboard" className="hover:text-blue-500 transition-colors" target="_blank" rel="noopener noreferrer">
                  GitHub
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM TEXT */}
        <div className="text-center mt-8">
          <p className="text-sm text-slate-600">
            Разработано с{' '}
            <span className="text-red-500 animate-pulse">❤️</span>
            {' '}в стиле Apple
          </p>
        </div>
      </div>

      {/* ADD SHAKE ANIMATION */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default Login;
