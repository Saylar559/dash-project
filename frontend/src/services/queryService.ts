import axios from "axios";

// Для dev/proxy используем относительный URL "/api/query/"
// Для production можно раскомментировать и явно задать baseURL:
// axios.defaults.baseURL = "http://10.10.3.58:8000"

export async function executeSQL(
  query: string,
  params?: Record<string, any>,
  config?: { timeout?: number }
) {
  try {
    const response = await axios.post(
      "/api/query/",
      { query, params },
      { timeout: config?.timeout ?? 10000 }
    );
    return response.data;
  } catch (error: any) {
    if (error.response) {
      // Покажи detail из backend, если есть
      throw new Error(error.response.data?.detail || error.response.statusText);
    }
    if (error.request) {
      throw new Error("Сеть или сервер недоступен");
    }
    throw new Error(error.message);
  }
}
