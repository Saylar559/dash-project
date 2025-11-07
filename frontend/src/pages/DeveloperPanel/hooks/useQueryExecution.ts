// frontend/src/pages/DeveloperPanel/hooks/useQueryExecution.ts

import { useState } from 'react';
import api from '../../../services/api';
import { QueryResult } from '../types';

export const useQueryExecution = () => {
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeQuery = async (sqlQuery: string): Promise<QueryResult | null> => {
    if (!sqlQuery.trim()) {
      setError('SQL query cannot be empty');
      return null;
    }

    setExecuting(true);
    setError(null);

    try {
      const response = await api.post('/api/sql/execute', {
        query: sqlQuery
      });

      const result: QueryResult = {
        columns: response.data.columns || [],
        data: response.data.data || [],
        row_count: response.data.row_count || 0
      };

      setQueryResult(result);
      return result;

    } catch (err: any) {
      console.error('Error executing query:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to execute query';
      setError(errorMessage);
      setQueryResult(null);
      return null;

    } finally {
      setExecuting(false);
    }
  };

  const clearResults = () => {
    setQueryResult(null);
    setError(null);
  };

  return {
    queryResult,
    executing,
    error,
    executeQuery,
    clearResults  // ← Добавлена эта функция
  };
};
