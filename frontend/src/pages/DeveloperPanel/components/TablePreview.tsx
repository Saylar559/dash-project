import React, { useMemo, useState, useCallback } from "react";
import TableToolbar from "./TableToolbar";
import "../styles/TablePreview.css";

type SqlResult = { columns: string[]; data: any[]; row_count?: number };

type Props = {
  result: SqlResult;
  maxRows?: number;
  dense?: boolean;
  onRowClick?: (row: any) => void;
  editableHeaders?: boolean;
  enableFilters?: boolean;
  isEditable?: boolean;
  isPublished?: boolean;
  initialAliasMap?: Record<string, string>;
  initialFilters?: Record<string, { op: string; val: string }>;
  initialColumnWidths?: Record<string, number>;
  onStateChange?: (s: { 
    aliasMap: Record<string, string>; 
    filters: Record<string, { op: string; val: string }>;
    columnWidths?: Record<string, number>;
  }) => void;
};

const MIN_WIDTH = 60;
const MAX_WIDTH = 700;

const applyClientFilter = (rows: any[], filters: Record<string, { op: string; val: string }>) => {
  const active = Object.entries(filters).filter(([, v]) => v?.val?.toString().length);
  if (active.length === 0) return rows;
  const like = (a: any, b: string) => String(a ?? "").toLowerCase().includes(b.toLowerCase());
  return rows.filter(r =>
    active.every(([col, f]) => {
      const v = r[col], val = f.val;
      switch (f.op) {
        case "=": return String(v ?? "") === val;
        case "<>": return String(v ?? "") !== val;
        case ">": return Number(v) > Number(val);
        case "<": return Number(v) < Number(val);
        case "LIKE": return like(v, val);
        default: return true;
      }
    })
  );
};

const TablePreview: React.FC<Props> = ({
  result,
  maxRows = 50,
  dense = false,
  onRowClick,
  editableHeaders = true,
  enableFilters = true,
  isEditable = true,
  isPublished = false,
  initialAliasMap = {},
  initialFilters = {},
  initialColumnWidths = {},
  onStateChange,
}) => {
  const baseCols = result?.columns || [];
  const baseRows = result?.data || [];

  // --- STATES ---
  const [aliasMap, setAliasMap] = useState<Record<string, string>>(initialAliasMap);
  const [filters, setFilters] = useState<Record<string, { op: string; val: string }>>(initialFilters);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(
    initialColumnWidths ||
      baseCols.reduce((acc, col) => ({ ...acc, [col]: 120 }), {})
  );
  const [resizingCol, setResizingCol] = useState<string | null>(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);

  const columns = useMemo(() => baseCols, [baseCols]);
  const filteredRows = useMemo(
    () => (isPublished ? baseRows : applyClientFilter(baseRows, filters)),
    [baseRows, filters, isPublished]
  );

  // --- CALLBACKS ---
  const onAliasChange = useCallback((col: string, alias: string) => {
    const next = { ...aliasMap, [col]: alias };
    setAliasMap(next);
    onStateChange?.({ aliasMap: next, filters, columnWidths });
  }, [aliasMap, filters, columnWidths, onStateChange]);

  const onFiltersChange = useCallback((next: Record<string, { op: string; val: string }>) => {
    setFilters(next);
    onStateChange?.({ aliasMap, filters: next, columnWidths });
  }, [aliasMap, filters, columnWidths, onStateChange]);

  // --- RESIZE ---
  const onColumnWidthChange = useCallback((col: string, width: number) => {
    const fixedWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, width));
    const next = { ...columnWidths, [col]: fixedWidth };
    setColumnWidths(next);
    onStateChange?.({ aliasMap, filters, columnWidths: next });
  }, [aliasMap, filters, columnWidths, onStateChange]);

  const handleMouseDown = useCallback((col: string, e: React.MouseEvent) => {
    e.preventDefault();
    setResizingCol(col);
    setStartX(e.clientX);
    setStartWidth(columnWidths[col] || 120);
    document.body.style.cursor = "col-resize";
  }, [columnWidths]);

  React.useEffect(() => {
    if (!resizingCol) return;
    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startX;
      onColumnWidthChange(resizingCol, startWidth + delta);
    };
    const handleMouseUp = () => {
      setResizingCol(null);
      document.body.style.cursor = "";
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = "";
    };
  }, [resizingCol, startX, startWidth, onColumnWidthChange]);

  // --- UI/UX ---

  return (
    <div className="apple-card apple-card--table">
      {/* Тулбар (ред.колонки и фильтры) -- только не просмотр */}
      {!isPublished && isEditable && (editableHeaders || enableFilters) && (
        <TableToolbar
          columns={columns}
          aliasMap={aliasMap}
          onAliasChange={onAliasChange}
          filters={enableFilters ? filters : {}}
          onFiltersChange={onFiltersChange}
        />
      )}
      {/* ТАБЛИЦА */}
      <div className="apple-table-wrap" style={{ maxHeight: 420 }}>
        <table className={`apple-table${dense ? ' apple-table--dense' : ''}`}>
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c}
                  className="apple-th"
                  style={{ width: `${columnWidths[c] || 120}px` }}
                >
                  <div className="apple-th__container">
                    <span className="apple-th__text" title={c}>
                      {aliasMap[c] || c}
                    </span>
                    {/* Ресайзер всегда активен */}
                    <div
                      className="apple-th__resizer"
                      tabIndex={0}
                      title="Изменить ширину"
                      onMouseDown={(e) => handleMouseDown(c, e)}
                      style={{ cursor: "col-resize" }}
                      aria-label="Изменить ширину столбца"
                    />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.slice(0, maxRows).map((row, idx) => (
              <tr
                key={idx}
                className="apple-tr"
                tabIndex={0}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((c) => {
                  const v = row?.[c];
                  const isNumeric = typeof v === "number";
                  const isDateLike = v && typeof v === "string" && /\d{4}-\d{2}-\d{2}/.test(v);
                  return (
                    <td
                      key={c}
                      className={`apple-td${isNumeric || isDateLike ? ' apple-td--mono' : ''}`}
                      title={v?.toString?.() || ''}
                      style={{ width: `${columnWidths[c] || 120}px` }}
                    >
                      {v ?? "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Футер */}
      <div className="apple-table__footer">
        <span>
          {filteredRows.length === 0
            ? "Нет данных" + (isEditable ? " (фильтр?)" : "")
            : `Показано ${Math.min(filteredRows.length, maxRows)} из ${result?.row_count ?? filteredRows.length}`}
        </span>
      </div>
    </div>
  );
};

export default TablePreview;
