// src/pages/DeveloperPanel/hooks/useTables.ts

import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { TableInfo } from '../types';

export const useTables = () => {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // ✅ ИСПРАВЛЕНИЕ: Убрали слэш в конце
      const response = await api.get('/api/sql/tables');
      setTables(response.data.tables || []);
    } catch (err: any) {
      console.error('Error loading tables:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to load tables';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return { tables, loading, error, reload: loadTables };
};
