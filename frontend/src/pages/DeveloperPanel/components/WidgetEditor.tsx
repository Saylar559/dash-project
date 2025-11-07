import React, { useState, useEffect, useMemo } from 'react';
import { DashboardWidget } from '../types';
import { executeSQL } from "../../../services/queryService";
import ChartPreview from './ChartPreview';
import FiltersPanel from './FiltersPanel';
import FilterFieldSelector from './FilterFieldSelector';
import { buildWhereSQL } from '../utils/sqlUtils';
import '../styles/WidgetEditor.css';

const iconMap: { [key: string]: string } = {
  table: "📑", chart: "📈", filter: "🔍", kpi: "💡", info: "📝"
};

const CHART_TYPE_OPTIONS = [
  { value: "line", label: "Линейный" },
  { value: "bar", label: "Столбчатый" },
  { value: "pie", label: "Круговой" },
  { value: "area", label: "Площадь" },
  { value: "scatter", label: "Точечный" },
  { value: "radar", label: "Радар" },
  { value: "doughnut", label: "Кольцевой" },
  { value: "polarArea", label: "Полярный" },
  { value: "bubble", label: "Пузырьки" },
];

const AGGREGATIONS = [
  { value: '', label: 'Без агрегации' },
  { value: 'SUM', label: 'Сумма' },
  { value: 'AVG', label: 'Среднее' },
  { value: 'COUNT', label: 'Количество' },
  { value: 'MIN', label: 'Мин.' },
  { value: 'MAX', label: 'Макс.' },
];

const safeValue = (v: any) => Array.isArray(v) ? v.join(", ") : (v ?? "");

const WidgetEditor: React.FC<{
  widget: DashboardWidget | undefined;
  onUpdate: (props: any) => void;
  onRemove: () => void;
  onClose?: () => void;
}> = ({ widget, onUpdate, onRemove, onClose }) => {
  const [propsState, setPropsState] = useState(widget?.props || {});
  const [executeLoading, setExecuteLoading] = useState(false);
  const [executeError, setExecuteError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);

  const [filterFields, setFilterFields] = useState<string[]>(propsState.filterFields || []);
  const [filterValues, setFilterValues] = useState<Record<string, any>>(propsState.filterValues || {});
  const columns = propsState.result?.columns || [];

  useEffect(() => {
    setPropsState(widget?.props || {});
    setPreviewData(null);
    setExecuteError(null);
    setFilterFields((widget?.props?.filterFields) || []);
    setFilterValues((widget?.props?.filterValues) || {});
  }, [widget?.id]);

  if (!widget) return null;

  const handleRunSQL = async () => {
    setExecuteLoading(true);
    setExecuteError(null);
    try {
      if (!propsState.sql || !propsState.sql.trim())
        throw new Error("SQL не указан");
      const result = await executeSQL(propsState.sql, propsState.params);
      setPropsState((prev: any) => ({ ...prev, result }));
    } catch (err: any) {
      setExecuteError(err?.response?.data?.detail || err?.message || String(err));
    } finally {
      setExecuteLoading(false);
    }
  };

  const canPreviewChart = useMemo(
    () => widget.type === 'chart' && propsState.sql && propsState.xField && propsState.yField,
    [widget.type, propsState.sql, propsState.xField, propsState.yField]
  );

  const buildChartSQL = () => {
    let sql = propsState.sql as string;
    if (!sql) return null;
    if (filterFields.length) {
      const where = buildWhereSQL(filterValues);
      sql = sql.replace(/where .*/i, '').trim();
      sql += where ? " " + where : "";
    }
    if (propsState.aggregation) {
      const shortSql = sql.trim().replace(/;$/, "");
      sql = `SELECT "${propsState.xField}", ${propsState.aggregation}("${propsState.yField}") AS "${propsState.aggregation}_${propsState.yField}" FROM (${shortSql}) t GROUP BY "${propsState.xField}" LIMIT 100`;
    }
    return sql;
  };

  const handlePreviewChart = async () => {
    if (!canPreviewChart) return;
    const previewSQL = buildChartSQL();
    if (!previewSQL) return;
    setExecuteLoading(true);
    setExecuteError(null);
    try {
      const result = await executeSQL(previewSQL);
      const data = {
        labels: result.data.map((row: any) => row[propsState.xField]),
        datasets: [{
          label: propsState.yField + (propsState.aggregation ? ` (${propsState.aggregation})` : ''),
          data: result.data.map((row: any) =>
            propsState.aggregation ? row[`${propsState.aggregation}_${propsState.yField}`] : row[propsState.yField]
          ),
          backgroundColor: '#60a5fa',
          borderColor: '#2563eb',
          fill: propsState.chartType === 'area',
          tension: 0.3,
        }]
      };
      setPreviewData(data);
    } catch (err: any) {
      setExecuteError(err?.response?.data?.detail || err?.message || String(err));
    } finally {
      setExecuteLoading(false);
    }
  };

  useEffect(() => {
    if (canPreviewChart) handlePreviewChart();
    else setPreviewData(null);
  }, [propsState.sql, propsState.xField, propsState.yField, propsState.chartType, propsState.aggregation, filterFields, filterValues]);

  const renderFields = () => {
    switch (widget.type) {
      case 'table':
        return (
          <div className="widget-editor__section">
            <label className="widget-editor__label">SQL-запрос</label>
            <textarea
              value={propsState.sql || ''}
              onChange={e => setPropsState({ ...propsState, sql: e.target.value })}
              className="widget-editor__textarea"
              rows={4}
              placeholder="SELECT * FROM your_table LIMIT 10"
            />
            <button
              className="widget-editor__btn widget-editor__btn--primary"
              disabled={executeLoading || !propsState.sql}
              onClick={handleRunSQL}
            >{executeLoading ? "..." : "▶️ Выполнить SQL"}</button>
            {executeError && <div className="widget-editor__error">{executeError}</div>}
            {propsState.result && (
              <div className="widget-editor__info">
                Данные получены: {propsState.result.row_count ?? propsState.result.data?.length} строк
              </div>
            )}
          </div>
        );
      case 'chart':
        return (
          <>
            <div className="widget-editor__row">
              <div className="widget-editor__col">
                <label className="widget-editor__label">Ось X</label>
                <input
                  value={propsState.xField || ''}
                  onChange={e => setPropsState({ ...propsState, xField: e.target.value })}
                  className="widget-editor__input"
                  placeholder="date/label..."
                />
              </div>
              <div className="widget-editor__col">
                <label className="widget-editor__label">Ось Y</label>
                <input
                  value={propsState.yField || ''}
                  onChange={e => setPropsState({ ...propsState, yField: e.target.value })}
                  className="widget-editor__input"
                  placeholder="amount/value..."
                />
              </div>
            </div>

            <div className="widget-editor__row">
              <div className="widget-editor__col">
                <label className="widget-editor__label">Тип графика</label>
                <select
                  value={propsState.chartType || ''}
                  onChange={e => setPropsState({ ...propsState, chartType: e.target.value })}
                  className="widget-editor__select"
                >
                  {CHART_TYPE_OPTIONS.map(opt => (
                    <option value={opt.value} key={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="widget-editor__col">
                <label className="widget-editor__label">Агрегация</label>
                <select
                  value={propsState.aggregation || ''}
                  onChange={e => setPropsState({ ...propsState, aggregation: e.target.value })}
                  className="widget-editor__select"
                >
                  {AGGREGATIONS.map(opt => (
                    <option value={opt.value} key={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <FilterFieldSelector
              allFields={columns}
              selectedFields={filterFields}
              onChange={arr => { setFilterFields(arr); setPropsState(ps => ({ ...ps, filterFields: arr })); }}
            />
            <FiltersPanel
              fields={filterFields}
              filterValues={filterValues}
              onUpdate={vals => { setFilterValues(vals); setPropsState(ps => ({ ...ps, filterValues: vals })); }}
            />

            <div className="widget-editor__section">
              <label className="widget-editor__label">SQL (данные для графика)</label>
              <textarea
                value={propsState.sql || ''}
                onChange={e => setPropsState({ ...propsState, sql: e.target.value })}
                className="widget-editor__textarea"
                rows={4}
                placeholder="SELECT date, amount FROM payments"
              />
              <div className="widget-editor__button-group">
                <button
                  className="widget-editor__btn widget-editor__btn--secondary"
                  onClick={handlePreviewChart}
                  disabled={!canPreviewChart || executeLoading}
                >🔍 Предпросмотр</button>
                {executeLoading && <div className="widget-editor__loading">Обновление графика…</div>}
              </div>
              {executeError && <div className="widget-editor__error">{executeError}</div>}
            </div>

            {previewData && previewData.labels?.length > 0 && previewData.datasets?.length > 0 ? (
              <div className="widget-editor__preview">
                <ChartPreview type={propsState.chartType || "line"} data={previewData} />
              </div>
            ) : (
              !executeLoading && <div className="widget-editor__empty">Нет данных или не выбраны оси</div>
            )}
          </>
        );
      case 'filter':
        return (
          <div className="widget-editor__section">
            <label className="widget-editor__label">Фильтруемые поля (через запятую)</label>
            <input
              value={safeValue(propsState.fields)}
              onChange={e => setPropsState({ ...propsState, fields: e.target.value })}
              placeholder="object_id, start, end"
              className="widget-editor__input"
            />
            <div className="widget-editor__hint">
              Пример: contract, status, object_id
            </div>
          </div>
        );
      case 'kpi':
        return (
          <>
            <div className="widget-editor__section">
              <label className="widget-editor__label">SQL для KPI</label>
              <textarea
                value={propsState.sql || ''}
                onChange={e => setPropsState({ ...propsState, sql: e.target.value })}
                className="widget-editor__textarea"
                rows={2}
                placeholder="SELECT SUM(amount) AS kpi_value FROM table"
              />
              <button
                className="widget-editor__btn widget-editor__btn--primary"
                disabled={executeLoading || !propsState.sql}
                onClick={handleRunSQL}
              >{executeLoading ? "..." : "▶️ Выполнить SQL"}</button>
              {executeError && <div className="widget-editor__error">{executeError}</div>}
              {propsState.result && (
                <div className="widget-editor__kpi-display">
                  KPI: {propsState.result.data[0] && Object.values(propsState.result.data[0])[0]}
                </div>
              )}
            </div>
            <div className="widget-editor__section">
              <label className="widget-editor__label">Метка</label>
              <input
                value={propsState.label || ''}
                onChange={e => setPropsState({ ...propsState, label: e.target.value })}
                className="widget-editor__input"
                placeholder="Итоговая сумма"
              />
            </div>
          </>
        );
      case 'info':
        return (
          <div className="widget-editor__section">
            <label className="widget-editor__label">Описание/текст</label>
            <textarea
              value={propsState.content || ''}
              onChange={e => setPropsState({ ...propsState, content: e.target.value })}
              className="widget-editor__textarea"
              rows={3}
              placeholder="Описание или инструкции..."
            />
          </div>
        );
      default:
        return <div className="widget-editor__empty">Настройка недоступна для этого типа виджета.</div>;
    }
  };

  const handleSave = () => {
    let updatedProps = { ...propsState, filterFields, filterValues };
    if (widget.type === 'chart' && previewData) {
      updatedProps = { ...updatedProps, result: previewData };
    }
    if (widget.type === 'filter' && typeof updatedProps.fields === 'string') {
      updatedProps.fields = updatedProps.fields.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    onUpdate(updatedProps);
    onClose?.();
  };

  return (
    <div className="widget-editor">
      <div className="widget-editor__header">
        <div className="widget-editor__title-group">
          <span className="widget-editor__icon">{iconMap[widget.type]}</span>
          <h3 className="widget-editor__title">{widget.type.toUpperCase()}</h3>
        </div>
        {onClose && (
          <button className="widget-editor__close-btn" onClick={onClose}>✕</button>
        )}
      </div>

      <div className="widget-editor__content">
        {renderFields()}
      </div>

      <div className="widget-editor__footer">
        <button className="widget-editor__btn widget-editor__btn--primary" onClick={handleSave}>💾 Сохранить</button>
        <button className="widget-editor__btn widget-editor__btn--danger" onClick={onRemove}>🗑️ Удалить</button>
      </div>
    </div>
  );
};

export default WidgetEditor;
