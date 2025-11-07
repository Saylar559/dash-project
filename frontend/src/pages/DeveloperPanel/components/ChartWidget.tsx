import React, { useState, useEffect, useMemo, useCallback } from "react";
import { executeSQL } from "../../services/queryService";
import ChartPreview from "./ChartPreview";
import FiltersPanel from "./FiltersPanel";
import FilterFieldSelector from "./FilterFieldSelector";
import { buildWhereSQL } from "../utils/sqlUtils";
import { RefreshCw, Save, ChevronDown, ChevronUp } from 'lucide-react';
import '../styles/ChartWidget.css';


const CHART_TYPES = [
  { value: 'line', label: '📈 Линия', description: 'Показывает тренды' },
  { value: 'bar', label: '📊 Столбцы', description: 'Сравнение значений' },
  { value: 'area', label: '📉 Площадь', description: 'Заполненная линия' },
  { value: 'pie', label: '🥧 Круговая', description: 'Доли от целого' },
  { value: 'doughnut', label: '🍩 Кольцевая', description: 'Круг с дыркой' },
  { value: 'radar', label: '🎯 Радар', description: 'Многомерные данные' },
  { value: 'polarArea', label: '🌐 Полярная', description: 'Круговая площадь' },
  { value: 'scatter', label: '🔵 Точечная', description: 'Корреляции' },
];


const AGGREGATIONS = [
  { value: '', label: 'Без агрегации', icon: '⚪' },
  { value: 'SUM', label: 'Сумма', icon: '➕' },
  { value: 'AVG', label: 'Среднее', icon: '〰️' },
  { value: 'COUNT', label: 'Количество', icon: '🔢' },
  { value: 'MIN', label: 'Минимум', icon: '⬇️' },
  { value: 'MAX', label: 'Максимум', icon: '⬆️' },
];


interface ChartWidgetProps {
  widget: any;
  onUpdate: (props: any) => void;
}


const ChartWidget: React.FC<ChartWidgetProps> = ({ widget, onUpdate }) => {
  // State
  const [sql, setSQL] = useState(widget?.props?.sql ?? "");
  const [result, setResult] = useState<any>(widget?.props?.result ?? null);
  const [xField, setXField] = useState(widget?.props?.xField ?? "");
  const [yField, setYField] = useState(widget?.props?.yField ?? "");
  const [chartType, setChartType] = useState(widget?.props?.chartType ?? "line");
  const [aggregation, setAggregation] = useState(widget?.props?.aggregation ?? "");
  const [filterFields, setFilterFields] = useState<string[]>(widget?.props?.filterFields ?? []);
  const [filterValues, setFilterValues] = useState<Record<string, any>>(widget?.props?.filterValues ?? {});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);


  const columns = useMemo(() => result?.columns || [], [result]);


  // Build SQL with filters
  const currentSQL = useMemo(() => {
    if (!sql?.trim()) return "";
    const whereClause = filterFields.length ? buildWhereSQL(filterValues) : "";
    const cleared = sql.replace(/where .*/i, "").trim().replace(/;$/, "");
    return whereClause ? `${cleared} ${whereClause}` : cleared;
  }, [sql, filterFields, filterValues]);


  // Execute SQL
  const executeQuery = useCallback(async (query: string) => {
    if (!query) return;
    setLoading(true);
    setError(null);
    try {
      const res = await executeSQL(query);
      setResult(res);
      
      // Auto-select fields if empty
      if (res?.columns?.length) {
        if (!xField) setXField(res.columns[0] || "");
        if (!yField && res.columns.length > 1) setYField(res.columns[1] || "");
      }
      
      // Sync filter fields
      if (!Array.isArray(filterFields) || filterFields.length === 0) {
        setFilterFields(res?.columns || []);
      } else {
        setFilterFields(ff => ff.filter(f => (res?.columns || []).includes(f)));
      }
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.message || "Ошибка выполнения SQL");
    } finally {
      setLoading(false);
    }
  }, [xField, yField, filterFields]);


  // Initial load
  useEffect(() => {
    if (currentSQL) {
      executeQuery(currentSQL);
    }
  }, [currentSQL]);


  // Aggregation query
  useEffect(() => {
    if (!aggregation || !xField || !yField || !currentSQL.toLowerCase().includes("select")) return;
    const baseQuery = currentSQL.trim().replace(/;$/, "");
    const aggSQL = `SELECT "${xField}", ${aggregation}("${yField}") AS "${aggregation}_${yField}" FROM (${baseQuery}) t GROUP BY "${xField}" LIMIT 100`;
    executeQuery(aggSQL);
  }, [aggregation, xField, yField]);


  // Save handler
  const handleSave = useCallback(() => {
    onUpdate({
      sql,
      chartType,
      xField,
      yField,
      aggregation,
      filterFields,
      filterValues,
      result,
    });
    setLastSaved(new Date());
  }, [sql, chartType, xField, yField, aggregation, filterFields, filterValues, result, onUpdate]);


  // Refresh handler
  const handleRefresh = useCallback(() => {
    executeQuery(currentSQL);
  }, [currentSQL, executeQuery]);


  // Chart data
  const chartData = useMemo(() => {
    if (!result?.data || !xField || !yField) return null;
    const isAgg = Boolean(aggregation);
    const yKey = isAgg ? `${aggregation}_${yField}` : yField;
    
    return {
      labels: result.data.map((row: any) => row[xField]?.toString() || "N/A"),
      datasets: [{
        label: yField + (aggregation ? ` (${aggregation})` : ''),
        data: result.data.map((row: any) => Number(row[yKey]) || 0),
        backgroundColor: chartType === 'pie' || chartType === 'doughnut' 
          ? ['#8BC540', '#2B76F0', '#FF9D5C', '#6E5CE0', '#00B4D8', '#FFB84D', '#E74C3C', '#00D9A3']
          : 'rgba(139, 197, 64, 0.8)',
        borderColor: chartType === 'pie' || chartType === 'doughnut'
          ? ['#6B9B2C', '#1f5ed1', '#FF8C42', '#5A4DB8', '#0096B8', '#FF9F33', '#c0392b', '#00B88A']
          : '#8BC540',
        borderWidth: 2,
        fill: chartType === 'area',
        tension: 0.4,
      }],
    };
  }, [result, xField, yField, aggregation, chartType]);


  // Stats
  const stats = useMemo(() => {
    if (!result?.data?.length) return null;
    return {
      rows: result.data.length,
      columns: result.columns.length,
      hasData: result.data.length > 0,
    };
  }, [result]);


  return (
    <div className="chart-widget chart-widget--green">
      {/* Header */}
      <div className="chart-widget__header">
        <div className="chart-widget__title">
          📊 Настройка графика
          {lastSaved && (
            <span className="chart-widget__saved-badge">
              ✅ Сохранено {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </div>
        {stats && (
          <div className="chart-widget__stats">
            {stats.rows} строк • {stats.columns} колонок
          </div>
        )}
      </div>


      {/* SQL Input */}
      <div className="chart-widget__section">
        <label className="chart-widget__label">SQL-запрос</label>
        <textarea
          className="chart-widget__sql-input"
          value={sql}
          onChange={e => setSQL(e.target.value)}
          rows={3}
          placeholder="SELECT date, amount FROM payments WHERE date >= '2025-01-01'"
        />
      </div>


      {/* Chart Type Selector */}
      <div className="chart-widget__section">
        <label className="chart-widget__label">Тип графика</label>
        <div className="chart-widget__chart-types">
          {CHART_TYPES.map(type => (
            <button
              key={type.value}
              className={`chart-widget__chart-type-btn ${chartType === type.value ? 'active' : ''}`}
              onClick={() => setChartType(type.value)}
              title={type.description}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>


      {/* Axes & Aggregation */}
      <div className="chart-widget__controls">
        <div className="chart-widget__control-group">
          <label className="chart-widget__label">X-ось (категории)</label>
          <select
            className="chart-widget__select"
            value={xField}
            onChange={e => setXField(e.target.value)}
          >
            <option value="">Выберите поле</option>
            {columns.map(col => <option key={col} value={col}>{col}</option>)}
          </select>
        </div>


        <div className="chart-widget__control-group">
          <label className="chart-widget__label">Y-ось (значения)</label>
          <select
            className="chart-widget__select"
            value={yField}
            onChange={e => setYField(e.target.value)}
          >
            <option value="">Выберите поле</option>
            {columns.map(col => <option key={col} value={col}>{col}</option>)}
          </select>
        </div>


        <div className="chart-widget__control-group">
          <label className="chart-widget__label">Агрегация</label>
          <select
            className="chart-widget__select"
            value={aggregation}
            onChange={e => setAggregation(e.target.value)}
          >
            {AGGREGATIONS.map(agg => (
              <option key={agg.value} value={agg.value}>
                {agg.icon} {agg.label}
              </option>
            ))}
          </select>
        </div>
      </div>


      {/* Filters Section */}
      <div className="chart-widget__section">
        <button
          className="chart-widget__filters-toggle"
          onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
        >
          <span>🔍 Фильтры ({filterFields.length})</span>
          {isFiltersExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>


        {isFiltersExpanded && (
          <div className="chart-widget__filters-content">
            <FilterFieldSelector
              allFields={columns}
              selectedFields={filterFields}
              onChange={setFilterFields}
            />
            <FiltersPanel
              fields={filterFields}
              filterValues={filterValues}
              onUpdate={setFilterValues}
            />
          </div>
        )}
      </div>


      {/* Action Buttons */}
      <div className="chart-widget__actions">
        <button
          className="chart-widget__btn chart-widget__btn--secondary"
          onClick={handleRefresh}
          disabled={loading || !sql}
        >
          <RefreshCw size={16} />
          Обновить
        </button>
        <button
          className="chart-widget__save-btn"
          onClick={handleSave}
          disabled={!chartData}
        >
          <Save size={16} />
          Сохранить настройки
        </button>
      </div>


      {/* Loading State */}
      {loading && (
        <div className="chart-widget__loading">
          <div className="chart-widget__spinner"></div>
          Загрузка данных…
        </div>
      )}


      {/* Error State */}
      {error && (
        <div className="chart-widget__error">
          <strong>❌ Ошибка:</strong> {error}
        </div>
      )}


      {/* Chart Preview */}
      {chartData && !loading ? (
        <div className="chart-widget__chart-container">
          <ChartPreview type={chartType} data={chartData} />
        </div>
      ) : (
        !loading && (
          <div className="chart-widget__empty">
            <div className="chart-widget__empty-icon">📊</div>
            <div className="chart-widget__empty-text">
              {!sql ? "Введите SQL-запрос" : 
               !xField || !yField ? "Выберите оси X и Y" :
               "Нет данных для отображения"}
            </div>
          </div>
        )
      )}
    </div>
  );
};


export default ChartWidget;