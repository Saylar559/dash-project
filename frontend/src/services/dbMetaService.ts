import axios from "axios";

// Получить список таблиц из backend
export async function fetchTables() {
  const res = await axios.get("/api/meta/tables");
  return res.data as { table_name: string; column_count: number; columns: string[] }[];
}
