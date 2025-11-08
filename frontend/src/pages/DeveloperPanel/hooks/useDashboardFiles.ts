import { useState, useCallback, useEffect } from 'react';

// КОРРЕКТНО: относительный путь, работает с любым vite proxy/production!
const API_BASE = '/api/dashboards-files';

export interface StoredDashboard {
  id: string;
  title: string;
  description?: string;
  config: any;
  created_at: string;
  updated_at: string;
  filename: string;
}

export const useDashboardFiles = () => {
  const [dashboards, setDashboards] = useState<StoredDashboard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Загрузить список дашбордов
  const fetchDashboards = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/list`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setDashboards(Array.isArray(data) ? data : []);
      return data;
    } catch (err: any) {
      const message = err.message || 'Ошибка загрузки дашбордов';
      setError(message);
      console.error('❌ fetchDashboards:', message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboards();
  }, [fetchDashboards]);

  // Получить один дашборд
  const getDashboard = useCallback(async (id: string) => {
    try {
      const response = await fetch(`${API_BASE}/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    } catch (err: any) {
      const message = err.message || 'Ошибка загрузки дашборда';
      setError(message);
      console.error('❌ getDashboard:', message);
      throw err;
    }
  }, []);

  // Сохранить новый дашборд
  const saveDashboard = useCallback(async (title: string, config: any) => {
    try {
      const response = await fetch(`${API_BASE}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description: '',
          config,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }
      const result = await response.json();
      console.log('✅ Дашборд сохранён:', result);
      await fetchDashboards();
      return result;
    } catch (err: any) {
      const message = err.message || 'Ошибка сохранения';
      setError(message);
      console.error('❌ saveDashboard:', message);
      throw err;
    }
  }, [fetchDashboards]);

  // Обновить дашборд
  const updateDashboard = useCallback(async (id: string, title: string, config: any) => {
    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          config,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }
      const result = await response.json();
      console.log('✅ Дашборд обновлён:', result);
      await fetchDashboards();
      return result;
    } catch (err: any) {
      const message = err.message || 'Ошибка обновления';
      setError(message);
      console.error('❌ updateDashboard:', message);
      throw err;
    }
  }, [fetchDashboards]);

  // Удалить дашборд
  const deleteDashboard = useCallback(async (id: string) => {
    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }
      console.log('✅ Дашборд удалён:', id);
      await fetchDashboards();
    } catch (err: any) {
      const message = err.message || 'Ошибка удаления';
      setError(message);
      console.error('❌ deleteDashboard:', message);
      throw err;
    }
  }, [fetchDashboards]);

  return {
    dashboards,
    loading,
    error,
    fetchDashboards,
    getDashboard,
    saveDashboard,
    updateDashboard,
    deleteDashboard,
  };
};
