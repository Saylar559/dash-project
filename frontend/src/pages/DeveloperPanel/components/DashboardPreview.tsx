import React, { useState } from 'react';
import { DashboardConfig, WidgetConfig } from '../types';
import ChartPreview from './ChartPreview';
import { executeSQL } from "../../../services/queryService";
import '../styles/DashboardPreview.css';

const widgetIcons = {
  table: "📑",
  chart: "📈",
  filter: "🔍",
  kpi: "💡",
  info: "📝",
};

function safeStr(val: any) {
  if (Array.isArray(val)) return val.map(String).join(', ');
  if (typeof val === "object" && val !== null) return JSON.stringify(val);
  return String(val ?? '');
}

const DashboardPreview: React.FC<{
  config: DashboardConfig;
  selectedWidgetId?: string;
  onSelectWidget?: (id: string) => void;
}> = ({ config, selectedWidgetId, onSelectWidget }) => {
  const [previewSQL, setPreviewSQL] = useState<Record<string, string>>({});
  const [previewResult, setPreviewResult] = useState<Record<string, any>>({});
  const [previewLoading, setPreviewLoading] = useState<Record<string, boolean>>({});
  const [previewError, setPreviewError] = useState<Record<string, string | null>>({});
  const [chartParams, setChartParams] = useState<Record<string, { xField: string, yField: string, chartType: string }>>({});

  const handlePreview = async (w: WidgetConfig) => {
    setPreviewLoading(prev => ({ ...prev, [w.id]: true }));
    setPreviewError(prev => ({ ...prev, [w.id]: null }));
    try {
      const sql = previewSQL[w.id] || w.props.sql || '';
      const result = await executeSQL(sql, {});
      setPreviewResult(prev => ({ ...prev, [w.id]: result }));
      if (w.type === "chart" && result?.columns?.length >= 2) {
        setChartParams(params => ({
          ...params,
          [w.id]: {
            xField: params[w.id]?.xField || result.columns[0],
            yField: params[w.id]?.yField || result.columns[1],
            chartType: params[w.id]?.chartType || "line"
          }
        }));
      }
    } catch (e: any) {
      setPreviewError(prev => ({ ...prev, [w.id]: e.message }));
      setPreviewResult(prev => ({ ...prev, [w.id]: null }));
    } finally {
      setPreviewLoading(prev => ({ ...prev, [w.id]: false }));
    }
  };

  const handleChartParamChange = (wId: string, field: "xField" | "yField" | "chartType", value: string) => {
    setChartParams(params => ({ ...params, [wId]: { ...params[wId], [field]: value } }));
  };

  return (
    <div className="dashboard-preview">
      {config.widgets.map(w => (
        <div
          key={w.id}
          className={`dashboard-preview__widget dashboard-preview__widget--${w.type} ${
            selectedWidgetId === w.id ? 'dashboard-preview__widget--selected' : ''
          }`}
          onClick={() => onSelectWidget?.(w.id)}
        >
          <div className="dashboard-preview__header">
            <div className="dashboard-preview__icon">{widgetIcons[w.type] || "🧩"}</div>
            <h4 className="dashboard-preview__title">{w.name || w.type.toUpperCase()}</h4>
          </div>

          {w.type === 'table' && (
            <div className="dashboard-preview__table-content">
              <div className="dashboard-preview__sql-info">
                SQL: <strong>{safeStr(w.props.sql?.slice?.(0, 60) ?? w.props.sql)}</strong>
              </div>
              <textarea
                className="dashboard-preview__sql-input"
                rows={2}
                value={previewSQL[w.id] ?? w.props.sql ?? ''}
                onChange={e => setPreviewSQL(prev => ({ ...prev, [w.id]: e.target.value }))}
                placeholder="Введи SELECT-запрос для предпросмотра"
              />
              <button
                className="dashboard-preview__preview-btn dashboard-preview__preview-btn--table"
                onClick={e => { e.stopPropagation(); handlePreview(w); }}
                disabled={previewLoading[w.id]}
              >
                {previewLoading[w.id] ? 'Выполняю...' : 'Предпросмотр'}
              </button>
              {previewError[w.id] && (
                <div className="dashboard-preview__error">{previewError[w.id]}</div>
              )}
              {previewResult[w.id]?.data?.length > 0 && (
                <table className="dashboard-preview__table">
                  <thead>
                    <tr>
                      {previewResult[w.id].columns.map((col: string) => (
                        <th key={col}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewResult[w.id].data.slice(0, 5).map((row: any, idx: number) => (
                      <tr key={idx}>
                        {previewResult[w.id].columns.map((col: string) => (
                          <td key={col}>{row[col]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {!previewResult[w.id]?.data?.length && !previewError[w.id] && (
                <div className="dashboard-preview__empty">
                  Нет данных (выполни SELECT для предпросмотра)
                </div>
              )}
            </div>
          )}

          {w.type === 'chart' && (
            <div className="dashboard-preview__chart-content">
              <div className="dashboard-preview__sql-info">
                SQL: <strong>{safeStr(w.props.sql?.slice?.(0, 60) ?? w.props.sql)}</strong>
              </div>
              <textarea
                className="dashboard-preview__sql-input"
                rows={2}
                value={previewSQL[w.id] ?? w.props.sql ?? ''}
                onChange={e => setPreviewSQL(prev => ({ ...prev, [w.id]: e.target.value }))}
                placeholder="Введи SELECT-запрос для предпросмотра"
              />
              <button
                className="dashboard-preview__preview-btn dashboard-preview__preview-btn--chart"
                onClick={e => { e.stopPropagation(); handlePreview(w); }}
                disabled={previewLoading[w.id]}
              >
                {previewLoading[w.id] ? 'Выполняю...' : 'Предпросмотр'}
              </button>
              {previewError[w.id] && (
                <div className="dashboard-preview__error">{previewError[w.id]}</div>
              )}
              {(previewResult[w.id]?.columns?.length > 0) && (
                <div className="dashboard-preview__chart-controls">
                  <select
                    value={chartParams[w.id]?.chartType || 'line'}
                    onChange={e => handleChartParamChange(w.id, "chartType", e.target.value)}
                    className="dashboard-preview__chart-select"
                  >
                    <option value="line">Линия</option>
                    <option value="bar">Бар</option>
                    <option value="area">Площадь</option>
                  </select>
                  <select
                    value={chartParams[w.id]?.xField || previewResult[w.id].columns[0]}
                    onChange={e => handleChartParamChange(w.id, "xField", e.target.value)}
                    className="dashboard-preview__chart-select"
                  >
                    {previewResult[w.id].columns.map((col: string) => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                  <select
                    value={chartParams[w.id]?.yField || previewResult[w.id].columns[1]}
                    onChange={e => handleChartParamChange(w.id, "yField", e.target.value)}
                    className="dashboard-preview__chart-select"
                  >
                    {previewResult[w.id].columns.map((col: string) => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
              )}
              {previewResult[w.id]?.data?.length > 0 && chartParams[w.id]?.xField && chartParams[w.id]?.yField && (
                <ChartPreview
                  type={chartParams[w.id]?.chartType || 'line'}
                  data={{
                    labels: previewResult[w.id].data.map((row: any) => row[chartParams[w.id]?.xField]),
                    datasets: [{
                      label: chartParams[w.id]?.yField,
                      data: previewResult[w.id].data.map((row: any) => row[chartParams[w.id]?.yField]),
                      backgroundColor: '#60a5fa',
                      borderColor: '#2563eb',
                      fill: chartParams[w.id]?.chartType === 'area',
                    }],
                  }}
                />
              )}
              {!previewResult[w.id]?.data?.length && !previewError[w.id] && (
                <div className="dashboard-preview__empty">
                  Нет данных (выполни SELECT для предпросмотра)
                </div>
              )}
            </div>
          )}

          {w.type === 'filter' && (
            <div className="dashboard-preview__filter-content">
              Фильтры: <span>{safeStr(w.props.fields)}</span>
            </div>
          )}

          {w.type === 'kpi' && (
            <div className="dashboard-preview__kpi-content">
              {safeStr(w.props.label)}
            </div>
          )}

          {w.type === 'info' && (
            <div className="dashboard-preview__info-content">
              {safeStr(w.props.content)}
            </div>
          )}
        </div>
      ))}

      {config.widgets.length === 0 && (
        <div className="dashboard-preview__empty-state">
          Добавьте виджеты с левой панели<br />и начните собирать свой дашборд!
        </div>
      )}
    </div>
  );
};

export default DashboardPreview;