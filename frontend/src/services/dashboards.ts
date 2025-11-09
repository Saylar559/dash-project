import api from './api';

// Превью для SQL-виджетов
export async function previewQuery(sql: string, params?: Record<string, any>) {
  const { data } = await api.post('/api/dashboards/preview', { sql, params: params || {} });
  return data.rows as Array<Record<string, any>>;
}

// Создание дашборда (is_published обязательно boolean или undefined)
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

// Получение одного дашборда
export async function getDashboard(id: number | string) {
  const { data } = await api.get(`/api/dashboards/${id}`);
  return data;
}

// Получаем ВСЕ дашборды без фильтра (например, для developer-панели)
export async function listAllDashboards() {
  const { data } = await api.get('/api/dashboards');
  return Array.isArray(data) ? data : [];
}

// Корректно возвращаем только опубликованные
export async function listPublishedDashboards() {
  const { data } = await api.get('/api/dashboards');
  // Явно фильтруем published дашборды — поддерживает boolean и string "true"
  const published = (Array.isArray(data) ? data : []).filter(
    d => d && (d.is_published === true || d.is_published === "true")
  );
  return published;
}

// Для SavedDashboardsPage — только is_published=true, можно заменить backend фильтр
export async function listSavedDashboards() {
  // старый вариант: const { data } = await api.get('/api/dashboards', { params: { saved: true } });
  const { data } = await api.get('/api/dashboards');
  // Если в данных нет is_published — исправь backend!
  return (Array.isArray(data) ? data : []).filter(
    d => d && (d.is_published === true || d.is_published === "true")
  );
}

// Export excel функционал оставляем без изменений
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
