// src/services/dashboards.ts
import api from './api';

export async function previewQuery(sql: string, params?: Record<string, any>) {
  const { data } = await api.post('/api/dashboards/preview', { sql, params: params || {} });
  return data.rows as Array<Record<string, any>>;
}

export async function createDashboard(payload: {
  title: string;
  description?: string;
  sql_query?: string;
  params?: Record<string, any>;
  code?: string;
  saved?: boolean;
  is_published?: boolean;
}) {
  const { data } = await api.post('/api/dashboards', payload);
  return data;
}

export async function getDashboard(id: number) {
  const { data } = await api.get(`/api/dashboards/${id}`);
  return data;
}

export async function listSavedDashboards() {
  const { data } = await api.get('/api/dashboards', { params: { saved: true } });
  return data;
}

export async function exportSqlToExcel(sql: string, params?: Record<string, any>) {
  const res = await api.post('/api/sql/export', { sql, params: params || {} }, { responseType: 'blob' });
  const url = window.URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'export.xlsx';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
