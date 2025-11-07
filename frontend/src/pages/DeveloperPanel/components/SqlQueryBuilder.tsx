import React, { useEffect, useState } from "react";
import { fetchTables } from "../services/dbMetaService";
import '../styles/SqlQueryBuilder.css';

interface TableMeta {
  table_name: string;
  columns: string[];
}

interface QueryBuilderProps {
  onQueryChange?: (sql: string) => void;
}

const SqlQueryBuilder: React.FC<QueryBuilderProps> = ({ onQueryChange }) => {
  const [tables, setTables] = useState<TableMeta[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [columns, setColumns] = useState<string[]>([]);
  const [checkedCols, setCheckedCols] = useState<string[]>([]);
  const [where, setWhere] = useState<{ col: string; op: string; val: string }[]>([]);
  const [query, setQuery] = useState("");

  // Загрузка таблиц
  useEffect(() => {
    fetchTables().then(resp => {
      const tbls = Array.isArray(resp) ? resp : resp.tables || [];
      setTables(tbls);
    });
  }, []);

  // Загрузка списка колонок при смене таблицы
  useEffect(() => {
    const tbl = tables.find(t => t.table_name === selectedTable);
    setColumns(tbl?.columns || []);
    setCheckedCols(tbl?.columns.slice(0, 3) || []);
    setWhere([]);
  }, [selectedTable, tables]);

  // Построение SQL запроса
  useEffect(() => {
    if (!selectedTable || checkedCols.length === 0) {
      setQuery("");
      return;
    }
    let sql = `SELECT ${checkedCols.map(c => `"${c}"`).join(", ")} FROM "${selectedTable}"`;
    if (where.length > 0) {
      sql += " WHERE " + where.map(f =>
        `"${f.col}" ${f.op} '${f.val.replace("'", "''")}'`).join(" AND ");
    }
    sql += " LIMIT 100";
    setQuery(sql);
    onQueryChange?.(sql);
  }, [selectedTable, checkedCols, where, onQueryChange]);

  return (
    <div className="query-builder">
      <h3 className="query-builder__title">SQL Query Builder</h3>

      {/* Выбор таблицы */}
      <div className="query-builder__section">
        <label className="query-builder__label">Таблица:</label>
        <select
          className="query-builder__select"
          value={selectedTable}
          onChange={e => setSelectedTable(e.target.value)}
        >
          <option value="">Выберите таблицу</option>
          {tables.map(t => (
            <option key={t.table_name} value={t.table_name}>
              {t.table_name}
            </option>
          ))}
        </select>
      </div>

      {/* Выбор колонок */}
      {columns.length > 0 && (
        <div className="query-builder__section">
          <label className="query-builder__label">Колонки:</label>
          <div className="query-builder__columns">
            {columns.map(col => (
              <label key={col} className="query-builder__checkbox-item">
                <input
                  type="checkbox"
                  checked={checkedCols.includes(col)}
                  onChange={e => setCheckedCols(
                    e.target.checked
                      ? [...checkedCols, col]
                      : checkedCols.filter(c => c !== col)
                  )}
                  className="query-builder__checkbox"
                />
                <span className="query-builder__checkbox-label">{col}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* WHERE-условия */}
      {checkedCols.length > 0 && (
        <div className="query-builder__section">
          <label className="query-builder__label">Фильтры:</label>
          <div className="query-builder__filters">
            {where.map((f, i) => (
              <div key={i} className="query-builder__filter-row">
                <select
                  value={f.col}
                  onChange={e =>
                    setWhere(list =>
                      list.map((x, j) => j === i ? { ...x, col: e.target.value } : x)
                    )
                  }
                  className="query-builder__filter-select"
                >
                  {checkedCols.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <select
                  value={f.op}
                  onChange={e =>
                    setWhere(list =>
                      list.map((x, j) => j === i ? { ...x, op: e.target.value } : x)
                    )
                  }
                  className="query-builder__filter-select"
                >
                  <option value="=">=</option>
                  <option value="<>">≠</option>
                  <option value=">">{'>'}</option>
                  <option value="<">{'<'}</option>
                  <option value="LIKE">LIKE</option>
                </select>
                <input
                  type="text"
                  value={f.val}
                  onChange={e =>
                    setWhere(list =>
                      list.map((x, j) => j === i ? { ...x, val: e.target.value } : x)
                    )
                  }
                  className="query-builder__filter-input"
                  placeholder="Значение"
                />
                <button
                  className="query-builder__filter-remove"
                  onClick={() =>
                    setWhere(list => list.filter((_, j) => j !== i))
                  }
                  title="Удалить фильтр"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              className="query-builder__add-filter-btn"
              type="button"
              onClick={() =>
                setWhere(list => [...list, { col: checkedCols[0], op: "=", val: "" }])
              }
            >
              + Добавить фильтр
            </button>
          </div>
        </div>
      )}

      {/* SQL preview */}
      {query && (
        <div className="query-builder__preview">
          <div className="query-builder__preview-title">SQL:</div>
          <pre className="query-builder__preview-code">{query}</pre>
        </div>
      )}
    </div>
  );
};

export default SqlQueryBuilder;
