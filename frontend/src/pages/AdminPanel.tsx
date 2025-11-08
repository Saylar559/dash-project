import React, { useEffect, useMemo, useState } from 'react';
import { Users, LogOut, Shield, Trash2, Plus, Edit, X, Save, Search, ChevronUp, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { User } from '../types';
import "./style_page/AdminPanel.css"; // Подключай отдельный CSS файл!

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
  useEffect(() => { fetchUsers(); }, []);
  async function fetchUsers() {
    try {
      setLoading(true);
      setErrorText(null);
      const res = await api.get('/api/users/');
      setUsers(res.data || []);
      setPage(1);
    } catch (e: any) {
      setErrorText(e?.response?.data?.detail || 'Ошибка загрузки пользователей');
    } finally { setLoading(false); }
  }

  // Роль -> цвет/надпись (цвет и класс задаёшь в css через классы типа .role-ADMIN и т.д.)
  const roleBadge = (role: string) => {
    return `role-badge-${role.toLowerCase()}`;
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
  useEffect(() => { setPage(1); }, [debouncedQuery, sortKey, sortOrder, pageSize]);
  const visible = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredSorted.slice(start, start + pageSize);
  }, [filteredSorted, page, pageSize]);

  // CRUD
  const resetForm = () => {
    setFormData({ username: '', email: '', password: '', role: 'USER', is_active: true });
    setEditingUser(null);
  };
  const openCreate = () => { resetForm(); setShowModal(true); };
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
      await fetchUsers();
    } catch {
      alert('❌ Ошибка удаления');
    }
  }
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
        className={`admin-table-sort-header${active ? ' active' : ''}`}
        title="Сортировать"
      >
        <span>{title}</span>
        {active ? (sortOrder === 'asc' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>) : null}
      </button>
    );
  };

  return (
    <div className="admin-panel-app">
      {/* Header */}
      <header className="admin-panel-header">
        <div className="max-w-7xl">
          <div>
            <h1 className="admin-panel-title">
              <span className="admin-panel-title-icon">
                <Shield size={22} />
              </span>
              Панель Администратора
            </h1>
            <p className="admin-panel-user">{user?.username} • {user?.email}</p>
          </div>
          <div className="admin-panel-actions">
            <button onClick={openCreate} className="admin-panel-btn-main">
              <Plus size={18} /> Создать пользователя
            </button>
            <button onClick={logout} className="admin-panel-btn-logout">
              <LogOut size={18} /> Выйти
            </button>
          </div>
        </div>
      </header>
      {/* Content */}
      <main className="admin-panel-content">
        <div className="admin-table-card">
          {/* Toolbar */}
          <div className="admin-table-toolbar">
            <div className="admin-table-toolbar-row">
              <h2 className="admin-table-title">
                <Users size={22} /> Управление пользователями
                <span className="admin-table-count">
                  {filteredSorted.length} {filteredSorted.length === 1 ? 'пользователь' : 'пользователей'}
                </span>
              </h2>
            </div>
            <div className="admin-table-search">
              <span className="admin-table-search-icon"><Search size={18}/></span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по имени, email или роли..."
              />
            </div>
            {errorText && <div className="admin-table-error">{errorText}</div>}
          </div>
          {/* Table */}
          {loading ? (
            <div className="admin-table-loading">
              <div className="admin-table-loading-icon"><Users size={32}/></div>
              <p>Загрузка пользователей...</p>
            </div>
          ) : filteredSorted.length === 0 ? (
            <div className="admin-table-empty">
              <div className="admin-table-empty-icon"><Search size={32}/></div>
              <h3>Ничего не найдено</h3>
              <p>Попробуйте изменить параметры поиска</p>
            </div>
          ) : (
            <>
              <div className="admin-table-content">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>{sortHeader('id', 'ID')}</th>
                      <th>{sortHeader('username', 'Пользователь')}</th>
                      <th>{sortHeader('role', 'Роль')}</th>
                      <th>{sortHeader('is_active', 'Статус')}</th>
                      <th>{sortHeader('created_at', 'Дата создания')}</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((u) => (
                      <tr key={u.id}>
                        <td>{u.id}</td>
                        <td>
                          <div>
                            <span>{u.username}</span>
                            <span>{u.email}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`admin-role-badge ${roleBadge(u.role)}`}>
                            {roleTitle(u.role)}
                          </span>
                        </td>
                        <td>
                          <span className={`admin-status-badge${u.is_active ? '' : ' inactive'}`}>
                            {u.is_active ? 'Активен' : 'Неактивен'}
                          </span>
                        </td>
                        <td>{fmtDate(u.created_at)}</td>
                        <td>
                          <div className="admin-table-actions">
                            <button onClick={() => openEdit(u)} className="admin-table-action-btn edit" title="Редактировать">
                              <Edit size={18} />
                            </button>
                            <button onClick={() => onDelete(u.id)} className="admin-table-action-btn delete" title="Удалить">
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
              <div className="admin-table-pagination">
                <div>
                  <span>Строк на странице:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
                <div>
                  Стр. {page} из {pageCount}
                </div>
                <div>
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    Назад
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                    disabled={page >= pageCount}
                  >
                    Вперёд
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
        {/* Modal */}
        {showModal && (
          <div className="admin-panel-modal-overlay">
            <div className="admin-modal-card">
              <div className="admin-modal-title-bar">
                <h3 className="admin-modal-title">
                  {editingUser ? 'Редактирование' : 'Новый пользователь'}
                </h3>
                <button
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="admin-modal-close-btn"
                >
                  <X size={22}/>
                </button>
              </div>
              <form onSubmit={editingUser ? onUpdate : onCreate} className="admin-modal-form">
                <div>
                  <label>Логин</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                    disabled={!!editingUser}
                    placeholder="username"
                  />
                </div>
                <div>
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    placeholder="user@example.com"
                  />
                </div>
                <div>
                  <label>
                    Пароль
                    {editingUser && <span> (оставьте пустым, чтобы не менять)</span>}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!editingUser}
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label>Роль</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="ADMIN">🛡️ Администратор</option>
                    <option value="DEVELOPER">💻 Разработчик</option>
                    <option value="ACCOUNTANT">💰 Бухгалтер</option>
                    <option value="DASHBOARD_USER">📊 Пользователь дашбордов</option>
                    <option value="USER">👤 Пользователь</option>
                  </select>
                </div>
                <div>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    id="is-active"
                  />
                  <label htmlFor="is-active">
                    Активный пользователь
                  </label>
                </div>
                <div className="admin-modal-form-actions">
                  <button type="submit" className="admin-modal-save-btn">
                    <Save size={18}/>
                    {editingUser ? 'Сохранить изменения' : 'Создать пользователя'}
                  </button>
                  <button type="button" className="admin-modal-cancel-btn" onClick={() => { setShowModal(false); resetForm(); }}>
                    Отмена
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPanel;
