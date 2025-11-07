import { useState, useCallback } from 'react';
import { getAuthToken } from '../services/authService';

const API_BASE = 'http://localhost:8000/api/dashboards';

export interface Dashboard {
  id: number;
  title: string;
  description?: string;
  config: any;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  owner_id: number;
}

export const useDashboards = () => {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Получить все дашборды
  const fetchDashboards = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAuthToken();
      const response = await fetch(API_BASE, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Ошибка загрузки дашбордов');
      
      const data = await response.json();
      setDashboards(data);
      return data;
    } catch (err: any) {
      const message = err.message || 'Неизвестная ошибка';
      setError(message);
      console.error(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Создать дашборд
  const saveDashboard = useCallback(async (data: {
    title: string;
    description: string;
    config: any;
  }) => {
    try {
      const token = getAuthToken();
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Ошибка сохранения');
      }

      const dashboard = await response.json();
      setDashboards(prev => [dashboard, ...prev]);
      return dashboard;
    } catch (err: any) {
      const message = err.message || 'Ошибка сохранения';
      setError(message);
      throw err;
    }
  }, []);

  // Обновить дашборд
  const updateDashboard = useCallback(async (id: number, data: any) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Ошибка обновления');

      const updated = await response.json();
      setDashboards(prev => prev.map(d => d.id === id ? updated : d));
      return updated;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Удалить дашборд
  const deleteDashboard = useCallback(async (id: number) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Ошибка удаления');

      setDashboards(prev => prev.filter(d => d.id !== id));
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Опубликовать дашборд
  const publishDashboard = useCallback(async (id: number) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE}/${id}/publish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Ошибка публикации');

      setDashboards(prev => prev.map(d => 
        d.id === id ? { ...d, is_published: true } : d
      ));
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const reload = () => fetchDashboards();

  return {
    dashboards,
    loading,
    error,
    fetchDashboards,
    saveDashboard,
    updateDashboard,
    deleteDashboard,
    publishDashboard,
    reload,
  };
};
