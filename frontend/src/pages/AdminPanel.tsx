import React, { useEffect, useMemo, useState } from 'react';
import { Users, LogOut, Shield, Trash2, Plus, Edit, X, Save, Search, ChevronUp, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { User } from '../types';

type SortKey = 'id' | 'username' | 'email' | 'role' | 'is_active' | 'created_at';
type SortOrder = 'asc' | 'desc';

const AdminPanel: React.FC = () => {
  const { logout, user } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Поиск с debounce
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery.trim().toLowerCase()), 250);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Сортировка и пагинация
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  // Модалка и форма
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'USER',
    is_active: true,
  });

  // Загрузка
  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      setLoading(true);
      setErrorText(null);
      const res = await api.get('/api/users/');
      setUsers(res.data || []);
      setPage(1);
    } catch (e: any) {
      console.error(e);
      setErrorText(e?.response?.data?.detail || 'Ошибка загрузки пользователей');
    } finally {
      setLoading(false);
    }
  }

  // Роль -> цвет/надпись
  const roleBadge = (role: string) => {
    const colors: Record<string, string> = {
      ADMIN: 'bg-red-100 text-red-700',
      DEVELOPER: 'bg-blue-100 text-blue-700',
      ACCOUNTANT: 'bg-green-100 text-green-700',
      DASHBOARD_USER: 'bg-yellow-100 text-yellow-700',
      USER: 'bg-slate-100 text-slate-700',
    };
    return colors[role] || colors.USER;
  };
  const roleTitle = (role: string) => {
    const titles: Record<string, string> = {
      ADMIN: 'Администратор',
      DEVELOPER: 'Разработчик',
      ACCOUNTANT: 'Бухгалтер',
      DASHBOARD_USER: 'Пользователь Дашбордов',
      USER: 'Пользователь',
    };
    return titles[role] || role;
  };

  // Фильтрация + сортировка
  const filteredSorted = useMemo(() => {
    const base = debouncedQuery
      ? users.filter(u =>
          (u.username || '').toLowerCase().includes(debouncedQuery) ||
          (u.email || '').toLowerCase().includes(debouncedQuery) ||
          (u.role || '').toLowerCase().includes(debouncedQuery)
        )
      : users;

    const sorted = [...base].sort((a, b) => {
      const va: any = (a as any)[sortKey];
      const vb: any = (b as any)[sortKey];

      // Специальные случаи
      if (sortKey === 'created_at') {
        const da = va ? new Date(va).getTime() : 0;
        const db = vb ? new Date(vb).getTime() : 0;
        return sortOrder === 'asc' ? da - db : db - da;
      }
      if (sortKey === 'is_active') {
        const na = va ? 1 : 0;
        const nb = vb ? 1 : 0;
        return sortOrder === 'asc' ? na - nb : nb - na;
      }

      // Строки/числа
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortOrder === 'asc' ? va - vb : vb - va;
      }
      const sa = String(va ?? '').toLowerCase();
      const sb = String(vb ?? '').toLowerCase();
      if (sa < sb) return sortOrder === 'asc' ? -1 : 1;
      if (sa > sb) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [users, debouncedQuery, sortKey, sortOrder]);

  // Пагинация
  const pageCount = Math.max(1, Math.ceil(filteredSorted.length / pageSize));
  useEffect(() => {
    // Если изменились фильтры/сортировка — вернуться на первую страницу
    setPage(1);
  }, [debouncedQuery, sortKey, sortOrder, pageSize]);

  const visible = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredSorted.slice(start, start + pageSize);
  }, [filteredSorted, page, pageSize]);

  // CRUD
  const resetForm = () => {
    setFormData({ username: '', email: '', password: '', role: 'USER', is_active: true });
    setEditingUser(null);
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (u: User) => {
    setEditingUser(u);
    setFormData({
      username: u.username,
      email: u.email,
      password: '',
      role: u.role,
      is_active: u.is_active,
    });
    setShowModal(true);
  };

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post('/api/users/', formData);
      alert('✅ Пользователь создан');
      await fetchUsers();
      setShowModal(false);
      resetForm();
    } catch (err: any) {
      alert('❌ ' + (err?.response?.data?.detail || 'Ошибка создания пользователя'));
    }
  }

  async function onUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const payload: any = { ...formData };
      if (!payload.password) delete payload.password;
      await api.put(`/api/users/${editingUser.id}`, payload);
      alert('✅ Пользователь обновлён');
      await fetchUsers();
      setShowModal(false);
      resetForm();
    } catch (err: any) {
      alert('❌ ' + (err?.response?.data?.detail || 'Ошибка обновления'));
    }
  }

  async function onDelete(id: number) {
    if (!confirm('Удалить этого пользователя?')) return;
    try {
      await api.delete(`/api/users/${id}`);
      alert('✅ Пользователь удалён');
      await fetchUsers();
    } catch {
      alert('❌ Ошибка удаления');
    }
  }

  // Вспомогательное
  const fmtDate = (v: any) => {
    if (!v) return '';
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const sortHeader = (key: SortKey, title: string) => {
    const active = sortKey === key;
    const nextOrder: SortOrder = active && sortOrder === 'asc' ? 'desc' : 'asc';
    return (
      <button
        type="button"
        onClick={() => { setSortKey(key); setSortOrder(nextOrder); }}
        className={`inline-flex items-center gap-1 ${active ? 'text-slate-900' : 'text-slate-600'} hover:text-slate-900`}
        title="Сортировать"
      >
        <span className="text-xs font-semibold uppercase tracking-wider">{title}</span>
        {active ? (sortOrder === 'asc' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>) : null}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-slate-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 tracking-tight flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30">
                  <Shield className="text-white" size={22} />
                </div>
                Панель Администратора
              </h1>
              <p className="text-sm text-slate-500 mt-1 ml-12">{user?.username} • {user?.email}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={openCreate} className="px-5 py-2.5 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-all duration-200 shadow-lg shadow-blue-500/30 flex items-center gap-2">
                <Plus size={18} /> Создать пользователя
              </button>
              <button onClick={logout} className="px-5 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 font-medium border border-slate-200 flex items-center gap-2">
                <LogOut size={18} /> Выйти
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-10">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 overflow-hidden">
          {/* Toolbar */}
          <div className="px-8 py-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                <Users size={22} className="text-blue-600" />
                Управление пользователями
              </h2>
              <span className="px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                {filteredSorted.length} {filteredSorted.length === 1 ? 'пользователь' : 'пользователей'}
              </span>
            </div>
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по имени, email или роли..."
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-700 placeholder-slate-400"
              />
            </div>
            {errorText && <div className="mt-3 text-sm text-red-600">{errorText}</div>}
          </div>

          {/* Table */}
          {loading ? (
            <div className="p-20 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4 animate-pulse">
                <Users size={32} className="text-blue-600" />
              </div>
              <p className="text-slate-500">Загрузка пользователей...</p>
            </div>
          ) : filteredSorted.length === 0 ? (
            <div className="p-20 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
                <Search size={32} className="text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Ничего не найдено</h3>
              <p className="text-slate-500">Попробуйте изменить параметры поиска</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-8 py-4 text-left">{sortHeader('id', 'ID')}</th>
                      <th className="px-8 py-4 text-left">{sortHeader('username', 'Пользователь')}</th>
                      <th className="px-8 py-4 text-left">{sortHeader('role', 'Роль')}</th>
                      <th className="px-8 py-4 text-left">{sortHeader('is_active', 'Статус')}</th>
                      <th className="px-8 py-4 text-left">{sortHeader('created_at', 'Дата создания')}</th>
                      <th className="px-8 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visible.map((u) => (
                      <tr key={u.id} className="hover:bg-blue-50/50 transition-all duration-150 group">
                        <td className="px-8 py-5 text-sm text-slate-600 font-medium">{u.id}</td>
                        <td className="px-8 py-5">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{u.username}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{u.email}</p>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${roleBadge(u.role)}`}>
                            {roleTitle(u.role)}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-green-600' : 'bg-slate-400'}`} />
                            {u.is_active ? 'Активен' : 'Неактивен'}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-sm text-slate-600">{fmtDate(u.created_at)}</td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button onClick={() => openEdit(u)} className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md" title="Редактировать">
                              <Edit size={18} />
                            </button>
                            <button onClick={() => onDelete(u.id)} className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md" title="Удалить">
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-6 py-4 border-t bg-slate-50">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600">Строк на странице:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="px-2 py-1 border rounded-md text-sm"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
                <div className="text-sm text-slate-600">
                  Стр. {page} из {pageCount}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-3 py-1.5 border rounded-md disabled:opacity-50"
                  >
                    Назад
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                    disabled={page >= pageCount}
                    className="px-3 py-1.5 border rounded-md disabled:opacity-50"
                  >
                    Вперёд
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-8 py-6 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-semibold text-slate-900">
                  {editingUser ? 'Редактирование' : 'Новый пользователь'}
                </h3>
                <button
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="p-2 hover:bg-white/50 rounded-xl transition-all duration-200"
                >
                  <X size={22} className="text-slate-600" />
                </button>
              </div>
            </div>

            <form onSubmit={editingUser ? onUpdate : onCreate} className="p-8 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Логин</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:bg-slate-100 disabled:text-slate-500"
                  required
                  disabled={!!editingUser}
                  placeholder="username"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  required
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Пароль {editingUser && <span className="text-slate-500 font-normal">(оставьте пустым, чтобы не менять)</span>}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  required={!editingUser}
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Роль</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="ADMIN">🛡️ Администратор</option>
                  <option value="DEVELOPER">💻 Разработчик</option>
                  <option value="ACCOUNTANT">💰 Бухгалтер</option>
                  <option value="DASHBOARD_USER">📊 Пользователь дашбордов</option>
                  <option value="USER">👤 Пользователь</option>
                </select>
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 text-blue-500 rounded-lg cursor-pointer"
                  id="is-active"
                />
                <label htmlFor="is-active" className="text-sm font-medium text-slate-700 cursor-pointer">
                  Активный пользователь
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-all duration-200 shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2">
                  <Save size={18} />
                  {editingUser ? 'Сохранить изменения' : 'Создать пользователя'}
                </button>
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-all duration-200">
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
