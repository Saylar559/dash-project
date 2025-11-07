import React, { useMemo, useState } from "react";
import '../styles/TableToolbar.css';

type Props = {
  columns: string[];
  aliasMap: Record<string, string>;
  onAliasChange: (col: string, alias: string) => void;
  filters: Record<string, { op: string; val: string }>;
  onFiltersChange: (next: Record<string, { op: string; val: string }>) => void;
};

const OPS = [
  { value: "=", label: "равно" },
  { value: "<>", label: "≠" },
  { value: ">", label: ">" },
  { value: "<", label: "<" },
  { value: "LIKE", label: "LIKE" }
];

const TableToolbar: React.FC<Props> = ({
  columns,
  aliasMap,
  onAliasChange,
  filters,
  onFiltersChange
}) => {
  const cols = useMemo(() => columns || [], [columns]);
  const [isExpanded, setIsExpanded] = useState(true);

  const setFilter = (col: string, key: "op" | "val", value: string) => {
    onFiltersChange({
      ...filters,
      [col]: {
        op: filters[col]?.op ?? "=",
        val: filters[col]?.val ?? "",
        [key]: value
      }
    });
  };

  const resetFilter = (col: string) => {
    const n = { ...filters };
    delete n[col];
    onFiltersChange(n);
  };

  return (
    <div className={`table-toolbar${!isExpanded ? " table-toolbar--collapsed" : ""}`}>
      <div className="table-toolbar__header" role="toolbar" aria-label="Редактирование и фильтрация">
        <button
          className="table-toolbar__toggle-btn"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label={isExpanded ? "Скрыть панель" : "Показать панель"}
          title={isExpanded ? "Свернуть" : "Показать"}
        >
          {isExpanded ? "▲" : "▶"}
        </button>
        <h3 className="table-toolbar__title">Редактировать колонки и фильтры</h3>
      </div>

      {isExpanded && (
        <div className="table-toolbar__grid">
          {cols.map((c) => (
            <div key={c} className="table-toolbar__column" tabIndex={0} aria-label={`Настройка ${c}`}>
              <label className="table-toolbar__label" htmlFor={`alias-${c}`}>
                {c}
              </label>
              <input
                id={`alias-${c}`}
                className="table-toolbar__alias-input"
                placeholder="Псевдоним"
                value={aliasMap[c] ?? ""}
                onChange={(e) => onAliasChange(c, e.target.value)}
                autoComplete="off"
                spellCheck={false}
                aria-label={`Псевдоним для ${c}`}
              />

              <div className="table-toolbar__filter-row">
                <select
                  className="table-toolbar__filter-op"
                  value={filters[c]?.op ?? "="}
                  onChange={(e) => setFilter(c, "op", e.target.value)}
                  aria-label={`Фильтр по ${c} оператор`}
                >
                  {OPS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <input
                  className="table-toolbar__filter-val"
                  placeholder="Значение"
                  value={filters[c]?.val ?? ""}
                  onChange={(e) => setFilter(c, "val", e.target.value)}
                  autoComplete="off"
                  aria-label={`Фильтр по ${c} значение`}
                />
                <button
                  className="table-toolbar__reset-btn"
                  type="button"
                  tabIndex={0}
                  onClick={() => resetFilter(c)}
                  aria-label={`Сбросить фильтр для ${c}`}
                  title="Сбросить"
                >✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TableToolbar;
