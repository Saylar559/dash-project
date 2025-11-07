// frontend/src/pages/ViewerPanel.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Layout, Eye, LogOut, RefreshCw, Clock, Star, 
  TrendingUp, Search, Filter, X, ChevronLeft
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { Dashboard, SQLResult, DataSource } from '../types';
import toast from 'react-hot-toast';

type FilterMode = 'all' | 'published' | 'favorites';

const ViewerPanel: React.FC = () => {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [selectedDashboard, setSelectedDashboard] = useState<Dashboard | null>(null);
  const [dashboardData, setDashboardData] = useState<SQLResult | null>(null);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('published');
  
  // Auto-refresh
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(0);

  const { logout, user } = useAuth();
  const canManage = user?.role === 'ADMIN' || user?.role === 'DEVELOPER';

  useEffect(() => {
    fetchDashboards();
  }, []);

  // Auto-refresh timer
  useEffect(() => {
    if (!autoRefreshEnabled || !selectedDashboard) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          refreshDashboardData();
          return refreshInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRefreshEnabled, selectedDashboard, refreshInterval]);

  const fetchDashboards = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/dashboards/my');
      setDashboards(response.data);
      setError(null);
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Не удалось загрузить дашборды';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const refreshDashboardData = useCallback(async () => {
    if (!selectedDashboard) return;

    try {
      setLoading(true);
      setError(null);

      if (selectedDashboard.data_sources && selectedDashboard.data_sources.length > 0) {
        const updatedSources = await Promise.all(
          selectedDashboard.data_sources.map(async (source) => {
            try {
              const response = await api.post('/api/sql/execute', { 
                query: source.query 
              });
              return { ...source, result: response.data, error: null };
            } catch (err: any) {
              return {
                ...source,
                error: err.response?.data?.detail || 'Query failed'
              };
            }
          })
        );
        setDataSources(updatedSources);
      } else if (selectedDashboard.sql_query) {
        const response = await api.post('/api/sql/execute', { 
          query: selectedDashboard.sql_query 
        });
        setDashboardData(response.data);
      }

      setLastRefresh(new Date());
      setCountdown(refreshInterval);
      toast.success('Данные обновлены');
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Ошибка загрузки данных';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [selectedDashboard, refreshInterval]);

  const handleViewDashboard = async (dashboard: Dashboard) => {
    setSelectedDashboard(dashboard);
    setDashboardData(null);
    setDataSources([]);
    setError(null);
    setAutoRefreshEnabled(false);
    setCountdown(refreshInterval);

    try {
      setLoading(true);
      
      // Track view
      await api.post(`/api/dashboards/${dashboard.id}/view`).catch(() => {});
      
      if (dashboard.data_sources && dashboard.data_sources.length > 0) {
        const initialSources = await Promise.all(
          dashboard.data_sources.map(async (source) => {
            try {
              const response = await api.post('/api/sql/execute', { 
                query: source.query 
              });
              return { ...source, result: response.data, error: null };
            } catch (err: any) {
              return {
                ...source,
                error: err.response?.data?.detail || 'Query failed'
              };
            }
          })
        );
        setDataSources(initialSources);
      } else if (dashboard.sql_query) {
        const response = await api.post('/api/sql/execute', { 
          query: dashboard.sql_query 
        });
        setDashboardData(response.data);
      }

      setLastRefresh(new Date());
      
      // Update local view count
      setDashboards(dashboards.map(d => 
        d.id === dashboard.id 
          ? { ...d, view_count: (d.view_count || 0) + 1 } 
          : d
      ));
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Требуются права для выполнения запроса';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleFavoriteToggle = async (dashboard: Dashboard, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const response = await api.post(`/api/dashboards/${dashboard.id}/favorite`);
      
      setDashboards(dashboards.map(d => 
        d.id === dashboard.id 
          ? { ...d, is_favorite: response.data.is_favorite } 
          : d
      ));

      toast.success(
        response.data.is_favorite ? '⭐ Добавлено в избранное' : '☆ Убрано из избранного',
        { icon: response.data.is_favorite ? '⭐' : '☆' }
      );
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка обновления избранного');
    }
  };

  const handlePublishToggle = async (dashboard: Dashboard, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      await api.put(`/api/dashboards/${dashboard.id}`, {
        is_published: !dashboard.is_published
      });
      
      setDashboards(dashboards.map(d => 
        d.id === dashboard.id ? { ...d, is_published: !dashboard.is_published } : d
      ));

      toast.success(
        dashboard.is_published ? '📥 Дашборд снят с публикации' : '🚀 Дашборд опубликован!',
        { icon: dashboard.is_published ? '📥' : '🚀' }
      );
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка публикации');
    }
  };

  const handleDelete = async (dashboard: Dashboard, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm(`Удалить дашборд "${dashboard.title}"?`)) return;
    
    try {
      await api.delete(`/api/dashboards/${dashboard.id}`);
      setDashboards(dashboards.filter(d => d.id !== dashboard.id));
      toast.success('🗑️ Дашборд удалён');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка удаления');
    }
  };

  const handleBackToList = () => {
    setSelectedDashboard(null);
    setDashboardData(null);
    setDataSources([]);
    setAutoRefreshEnabled(false);
    setError(null);
    setCountdown(0);
  };

  const toggleAutoRefresh = () => {
    setAutoRefreshEnabled(!autoRefreshEnabled);
    if (!autoRefreshEnabled) {
      setCountdown(refreshInterval);
      toast.success('Автообновление включено');
    } else {
      toast('Автообновление выключено', { icon: '⏸️' });
    }
  };

  // Filtering
  const filteredDashboards = dashboards.filter(dashboard => {
    if (filterMode === 'published' && !dashboard.is_published) return false;
    if (filterMode === 'favorites' && !dashboard.is_favorite) return false;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        dashboard.title.toLowerCase().includes(query) ||
        dashboard.description?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Data for iframe
  const allDataSources = dataSources.reduce((acc, source) => {
    if (source.result) {
      const key = source.name.toLowerCase().replace(/\s+/g, '_');
      acc[key] = source.result.data;
    }
    return acc;
  }, {} as Record<string, any>);

  if (loading && !selectedDashboard) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Загрузка дашбордов...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">📊 Дашборды</h1>
              <p className="text-sm text-gray-500 mt-1">
                <span className="font-medium">{user?.username}</span> • {user?.role}
              </p>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            >
              <LogOut size={20} />
              <span>Выйти</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {!selectedDashboard ? (
          /* Dashboard Grid */
          <div className="space-y-6">
            {/* Filters & Search */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Layout size={24} className="text-blue-600" />
                  Все Дашборды
                </h2>
                <button
                  onClick={fetchDashboards}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                  Обновить
                </button>
              </div>

              {/* Search & Filters */}
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-[300px] relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Поиск по названию или описанию..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>

                {canManage && (
                  <div className="flex gap-2 bg-gray-50 rounded-lg p-1 border">
                    <button
                      onClick={() => setFilterMode('all')}
                      className={`px-4 py-2 rounded-md text-sm font-semibold transition ${
                        filterMode === 'all' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-white'
                      }`}
                    >
                      Все ({dashboards.length})
                    </button>
                    <button
                      onClick={() => setFilterMode('published')}
                      className={`px-4 py-2 rounded-md text-sm font-semibold transition ${
                        filterMode === 'published' ? 'bg-green-600 text-white shadow' : 'text-gray-600 hover:bg-white'
                      }`}
                    >
                      Опубликованные ({dashboards.filter(d => d.is_published).length})
                    </button>
                    <button
                      onClick={() => setFilterMode('favorites')}
                      className={`px-4 py-2 rounded-md text-sm font-semibold transition ${
                        filterMode === 'favorites' ? 'bg-yellow-600 text-white shadow' : 'text-gray-600 hover:bg-white'
                      }`}
                    >
                      ⭐ Избранное ({dashboards.filter(d => d.is_favorite).length})
                    </button>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg text-red-700">
                ⚠️ {error}
              </div>
            )}

            {/* Dashboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDashboards.map((dashboard) => (
                <div
                  key={dashboard.id}
                  onClick={() => handleViewDashboard(dashboard)}
                  className="group bg-white border border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-2xl transition-all cursor-pointer overflow-hidden"
                >
                  {/* Header */}
                  <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition line-clamp-2 flex-1">
                        {dashboard.title}
                      </h3>
                      <div className="flex gap-1 ml-2">
                        {dashboard.is_published && (
                          <span className="px-2 py-1 text-xs font-bold rounded-full bg-green-100 text-green-700 border border-green-300">
                            ✅
                          </span>
                        )}
                        {dashboard.is_favorite && (
                          <span className="px-2 py-1 text-xs font-bold rounded-full bg-yellow-100 text-yellow-700 border border-yellow-300">
                            ⭐
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm line-clamp-3 min-h-[60px]">
                      {dashboard.description || 'Без описания'}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="px-6 py-3 bg-gray-50 border-b flex items-center justify-between text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      <TrendingUp size={14} />
                      {dashboard.view_count || 0} просмотров
                    </span>
                    <span>{new Date(dashboard.updated_at).toLocaleDateString('ru-RU')}</span>
                  </div>

                  {/* Actions */}
                  <div className="p-4 space-y-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDashboard(dashboard);
                      }}
                      className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition font-semibold flex items-center justify-center gap-2"
                    >
                      <Eye size={16} />
                      Открыть Dashboard
                    </button>

                    {canManage && (
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => handleFavoriteToggle(dashboard, e)}
                          className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition ${
                            dashboard.is_favorite
                              ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                          title="Избранное"
                        >
                          {dashboard.is_favorite ? '⭐' : '☆'}
                        </button>

                        <button
                          onClick={(e) => handlePublishToggle(dashboard, e)}
                          className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition ${
                            dashboard.is_published
                              ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                          title="Публикация"
                        >
                          {dashboard.is_published ? '📥' : '🚀'}
                        </button>

                        <button
                          onClick={(e) => handleDelete(dashboard, e)}
                          className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-semibold"
                          title="Удалить"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {filteredDashboards.length === 0 && (
                <div className="col-span-3 text-center py-16 bg-white rounded-2xl border">
                  <Layout size={64} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 text-lg font-medium mb-2">
                    {searchQuery ? 'Ничего не найдено' : 'Нет дашбордов'}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {searchQuery 
                      ? `По запросу "${searchQuery}" ничего не найдено`
                      : 'Создайте первый дашборд в панели разработчика'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Dashboard Viewer */
          <div className="space-y-4">
            {/* Controls */}
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleBackToList}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition flex items-center gap-2"
                  >
                    <ChevronLeft size={18} />
                    Назад
                  </button>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedDashboard.title}</h2>
                    <p className="text-sm text-gray-500">{selectedDashboard.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Auto Refresh */}
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border">
                    <Clock size={16} />
                    <span className="text-sm font-medium">Автообновление</span>
                    <button
                      onClick={toggleAutoRefresh}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                        autoRefreshEnabled ? 'bg-green-600' : 'bg-gray-300'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        autoRefreshEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                    {autoRefreshEnabled && countdown > 0 && (
                      <span className="text-xs font-mono text-gray-600">{countdown}s</span>
                    )}
                  </div>

                  <button
                    onClick={refreshDashboardData}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition flex items-center gap-2"
                  >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    {loading ? 'Обновление...' : 'Обновить'}
                  </button>
                </div>
              </div>

              {lastRefresh && (
                <div className="pt-3 border-t text-xs text-gray-500">
                  Последнее обновление: {lastRefresh.toLocaleTimeString('ru-RU')}
                </div>
              )}
            </div>

            {error && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-xl text-red-700">
                ⚠️ {error}
              </div>
            )}

            {/* Dashboard Content */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              {selectedDashboard.code ? (
                <iframe
                  title="Dashboard Preview"
                  srcDoc={`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    body { margin: 0; padding: 20px; font-family: system-ui, sans-serif; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    const dataSources = ${JSON.stringify(allDataSources, null, 2)};
    const data = dataSources.data || ${JSON.stringify(dashboardData?.data || [], null, 2)};
    
    ${selectedDashboard.code}
    
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<App dataSources={dataSources} data={data} />);
  </script>
</body>
</html>
                  `}
                  className="w-full border-none"
                  style={{ height: 'calc(100vh - 300px)', minHeight: '600px' }}
                  sandbox="allow-scripts"
                />
              ) : dashboardData ? (
                <div className="p-6">
                  <div className="overflow-x-auto border rounded-xl">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          {dashboardData.columns.map((col) => (
                            <th key={col} className="text-left py-3 px-4 font-semibold text-gray-700">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {dashboardData.data.map((row, idx) => (
                          <tr key={idx} className="border-b hover:bg-blue-50 transition">
                            {dashboardData.columns.map((col) => (
                              <td key={col} className="py-3 px-4 text-gray-900">
                                {row[col] !== null && row[col] !== undefined 
                                  ? String(row[col]) 
                                  : <span className="text-gray-400 italic">null</span>
                                }
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="p-16 text-center text-gray-500">
                  <RefreshCw size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>Загрузка данных...</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewerPanel;
