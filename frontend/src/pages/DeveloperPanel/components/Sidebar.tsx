import React, { useEffect, useState, useRef } from 'react';
import { DashboardWidget } from '../types';
import { fetchTables } from '../../../services/dbMetaService';
import { executeSQL } from "../../../services/queryService";
import { ChevronDown, ChevronUp, Plus, Eye } from 'lucide-react';
import '../styles/Sidebar.css';

const widgetTypes = [
  { type: 'table', label: 'Таблица', icon: '📑' },
  { type: 'chart', label: 'График', icon: '📈' },
  { type: 'filter', label: 'Фильтр', icon: '🔍' },
  { type: 'kpi', label: 'KPI', icon: '💡' },
  { type: 'info', label: 'Текст/Инфо', icon: '📝' },
];

// ergonomic, instant access to data, section toggle and fast add to dashboard!
const Sidebar: React.FC<{
  dashboards: any[];
  selectedDashboard: any;
  loading: boolean;
  widgets: DashboardWidget[];
  onAddWidget: (type: DashboardWidget['type'], props?: any) => void;
  onSelectDashboard: (dashboard: any) => void;
  onClear: () => void;
}> = ({
  dashboards,
  selectedDashboard,
  loading,
  widgets,
  onAddWidget,
  onSelectDashboard,
  onClear,
}) => {
  const [tables, setTables] = useState<any[]>([]);
  const [tablesLoading, setTablesLoading] = useState(true);
  const [tablesError, setTablesError] = useState<string | null>(null);

  const [previewTable, setPreviewTable] = useState<string | null>(null);
  const [previewResult, setPreviewResult] = useState<any>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewHeight, setPreviewHeight] = useState(400);
  const previewRef = useRef<HTMLDivElement>(null);
  const resizerRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);

  const [expandedSections, setExpandedSections] = useState({
    widgets: true, tables: true, dashboards: true, preview: true,
  });

  useEffect(() => {
    fetchTables()
      .then(data => {
        if (Array.isArray(data)) setTables(data);
        else if (data && typeof data === 'object' && Array.isArray(data.tables)) setTables(data.tables);
        else setTables([]);
      })
      .catch(e => setTablesError(e?.message || "Ошибка загрузки таблиц"))
      .finally(() => setTablesLoading(false));
  }, []);

  // Smart resize preview
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const newHeight = window.innerHeight - e.clientY;
      if (newHeight > 200 && newHeight < 800) setPreviewHeight(newHeight);
    };
    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };
    if (isResizing.current) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleResizerMouseDown = () => {
    isResizing.current = true;
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
  };

  // Table quick preview + add widget
  const handleTableClick = async (tableName: string) => {
    if (previewTable === tableName) {
      setPreviewTable(null);
      return;
    }
    setPreviewTable(tableName);
    setPreviewError(null);
    setPreviewResult(null);
    setPreviewLoading(true);
    setExpandedSections(prev => ({ ...prev, preview: true }));
    try {
      const query = `SELECT * FROM ${tableName} LIMIT 50`;
      const result = await executeSQL(query);
      setPreviewResult(result);
    } catch (e: any) {
      setPreviewError(e?.message ?? String(e));
    }
    setPreviewLoading(false);
  };

  const handleAddWidgetByTable = (tableName: string) => {
    const query = `SELECT * FROM ${tableName} LIMIT 100`;
    onAddWidget('table', {
      sql: query,
      result: previewResult,
      tableName,
    });
  };

  // Section toggles
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <aside className="sidebar" aria-label="Боковая панель">
      <section className="sidebar__section">
        <button
          className="sidebar__section-header"
          onClick={() => toggleSection('widgets')}
          aria-expanded={expandedSections.widgets}
        >
          <span>Виджеты</span>
          {expandedSections.widgets ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {expandedSections.widgets && (
          <div className="sidebar__widget-list">
            {widgetTypes.map(w => (
              <button
                key={w.type}
                className="sidebar__widget-btn"
                onClick={() => onAddWidget(w.type as DashboardWidget['type'])}
                title={`Добавить "${w.label}"`}
                disabled={loading}
                aria-label={w.label}
              >
                <span className="sidebar__widget-icon">{w.icon}</span>
                <span className="sidebar__widget-label">{w.label}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="sidebar__section">
        <button
          className="sidebar__section-header"
          onClick={() => toggleSection('tables')}
          aria-expanded={expandedSections.tables}
        >
          <span>Таблицы БД ({tables.length})</span>
          {expandedSections.tables ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {expandedSections.tables && (
          <div className="sidebar__tables-container">
            {tablesLoading ? (
              <div className="sidebar__status sidebar__status--loading">⏳ Загрузка...</div>
            ) : tablesError ? (
              <div className="sidebar__status sidebar__status--error">❌ {tablesError}</div>
            ) : tables.length === 0 ? (
              <div className="sidebar__status sidebar__status--empty">📭 Нет таблиц</div>
            ) : (
              <ul className="sidebar__tables-list">
                {tables.map(tbl => (
                  <li
                    key={tbl.table_name}
                    className={`sidebar__table-item ${previewTable === tbl.table_name ? 'sidebar__table-item--active' : ''}`}
                    onClick={() => handleTableClick(tbl.table_name)}
                    title={tbl.table_name}
                    aria-selected={previewTable === tbl.table_name}
                    tabIndex={0}
                  >
                    <div className="sidebar__table-header">
                      <div className="sidebar__table-name">
                        <Eye size={14} /> {tbl.table_name}
                      </div>
                      {previewTable === tbl.table_name && (
                        <span className="sidebar__table-indicator">👁️</span>
                      )}
                    </div>
                    {tbl.columns && (
                      <div className="sidebar__table-columns">
                        {tbl.columns.length} колонок
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      <section className="sidebar__section">
        <button
          className="sidebar__section-header"
          onClick={() => toggleSection('dashboards')}
          aria-expanded={expandedSections.dashboards}
        >
          <span>Дашборды ({dashboards.length})</span>
          {expandedSections.dashboards ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {expandedSections.dashboards && (
          <div className="sidebar__dashboards-list">
            {loading ? (
              <span className="sidebar__status sidebar__status--loading">⏳ Загрузка...</span>
            ) : dashboards.length === 0 ? (
              <span className="sidebar__status sidebar__status--empty">📭 Нет дашбордов</span>
            ) : (
              dashboards.map(d => (
                <button
                  key={d.id}
                  className={`sidebar__dashboard-btn ${
                    selectedDashboard?.id === d.id ? 'sidebar__dashboard-btn--selected' : ''
                  }`}
                  onClick={() => onSelectDashboard(d)}
                  title={`Открыть "${d.title}"`}
                  aria-label={`Открыть ${d.title}`}
                >
                  <span className="sidebar__dashboard-icon">📊</span>
                  <span className="sidebar__dashboard-title">{d.title}</span>
                </button>
              ))
            )}
          </div>
        )}
      </section>

      <section className="sidebar__section">
        <button
          className="sidebar__section-header"
          onClick={() => toggleSection('preview')}
          aria-expanded={expandedSections.preview}
        >
          <span>Рабочая область</span>
          {expandedSections.preview ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {expandedSections.preview && (
          <>
            <button
              className="sidebar__clear-btn"
              onClick={onClear}
              disabled={widgets.length === 0}
              aria-label="Очистить все виджеты"
            >
              🗑️ Очистить всё
            </button>
            <div className="sidebar__widget-count">📦 Виджетов: {widgets.length}</div>
          </>
        )}
      </section>

      {/* Preview Panel (Resizable) */}
      {previewTable && (
        <div
          className="sidebar__preview-panel"
          ref={previewRef}
          style={{ height: `${previewHeight}px` }}
        >
          <div
            className="sidebar__preview-resizer"
            ref={resizerRef}
            onMouseDown={handleResizerMouseDown}
            title="Перетащить для изменения размера"
            aria-label="Изменить высоту предпросмотра"
          />
          <div className="sidebar__preview-header">
            <h3 className="sidebar__preview-title">📊 {previewTable}</h3>
            <button
              className="sidebar__preview-close"
              onClick={() => setPreviewTable(null)}
              title="Закрыть предпросмотр"
              aria-label="Закрыть предпросмотр"
            >✕</button>
          </div>
          <div className="sidebar__preview-content">
            {previewLoading ? (
              <div className="sidebar__preview-loading">⏳ Загрузка данных...</div>
            ) : previewError ? (
              <div className="sidebar__preview-error">❌ {previewError}</div>
            ) : previewResult && previewResult.data?.length ? (
              <>
                <div className="sidebar__preview-table-wrapper">
                  <table className="sidebar__preview-table">
                    <thead>
                      <tr>
                        {previewResult.columns?.map((col: string) => (
                          <th key={col}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewResult.data.map((row: any, idx: number) => (
                        <tr key={idx}>
                          {previewResult.columns?.map((col: string) => (
                            <td key={col} title={row[col]?.toString()}>
                              {row[col] === null ? '∅' : row[col]?.toString().substring(0, 50)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="sidebar__preview-footer">
                  <span className="sidebar__preview-info">
                    📈 {previewResult.data.length} строк × {previewResult.columns?.length} колонок
                  </span>
                  <button
                    className="sidebar__preview-add-btn"
                    onClick={() => handleAddWidgetByTable(previewTable)}
                    aria-label="Добавить таблицу как виджет"
                  >
                    <Plus size={14} /> Добавить виджет
                  </button>
                </div>
              </>
            ) : (
              <div className="sidebar__preview-empty">📭 Нет данных</div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
