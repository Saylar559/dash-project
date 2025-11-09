import React from "react";
import { DashboardConfig, WidgetConfig } from "../types";
import ChartPreview from "./ChartPreview";
import "../styles/DashboardPreview.css";
import { marked } from "marked";

const widgetIcons: Record<string, string> = {
  table: "📑",
  chart: "📈",
  filter: "🔍",
  kpi: "💡",
  info: "📝",
};

function safeStr(val: any) {
  if (Array.isArray(val)) return val.map(String).join(", ");
  if (typeof val === "object" && val !== null) return JSON.stringify(val);
  return String(val ?? "");
}

const getInfoStyle = (w: WidgetConfig): React.CSSProperties => ({
  background: w.props?.style?.backgroundColor || "var(--domrf-bg-light,#f6f9ff)",
  border: `1px solid var(--domrf-border,#E6EDF6)`,
  borderRadius: w.props?.style?.borderRadius ?? 10,
  padding: w.props?.style?.padding ?? 12,
  color: w.props?.style?.color || "#232b3b",
  fontWeight: w.props?.style?.fontWeight ?? "normal",
  fontSize: w.props?.style?.fontSize ?? 16,
  fontFamily: w.props?.style?.fontFamily || "Roboto, Arial, sans-serif",
  width: w.props?.style?.width || "100%",
  minHeight: 32,
  overflowWrap: "break-word",
  lineHeight: 1.6,
  // КРИТИЧЕСКО: всегда пробрасываем выравнивание!
  textAlign: w.props?.style?.textAlign || "left",
});

const DashboardPreview: React.FC<{
  config: DashboardConfig;
}> = ({ config }) => (
  <div className="dashboard-preview">
    {config.widgets.map((w) => {
      const { layout } = w.props || {};
      return (
        <div
          key={w.id}
          className={`dashboard-preview__widget dashboard-preview__widget--${w.type}`}
          style={
            layout
              ? {
                  gridColumn: `${layout.x + 1} / span ${layout.w}`,
                  gridRow: `${layout.y + 1} / span ${layout.h}`,
                }
              : undefined
          }
        >
          <div className="dashboard-preview__header">
            <div className="dashboard-preview__icon">{widgetIcons[w.type] || "🧩"}</div>
            <h4 className="dashboard-preview__title">
              {w.name || w.type.toUpperCase()}
            </h4>
          </div>
          {w.type === "table" && w.props.result && w.props.result.columns && (
            <div className="dashboard-preview__table-content">
              <table className="dashboard-preview__table">
                <thead>
                  <tr>
                    {w.props.result.columns.map((col: string) => (
                      <th key={col}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {w.props.result.data.map((row: any, idx: number) => (
                    <tr key={idx}>
                      {w.props.result.columns.map((col: string) => (
                        <td key={col}>{row[col]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {w.type === "chart" && w.props.chartData && (
            <div className="dashboard-preview__chart-content">
              <ChartPreview
                type={w.props.chartType || "line"}
                data={w.props.chartData}
              />
            </div>
          )}
          {w.type === "filter" && (
            <div className="dashboard-preview__filter-content">
              Фильтр: <span>{safeStr(w.props.fields)}</span>
            </div>
          )}
          {w.type === "kpi" && (
            <div className="dashboard-preview__kpi-content">
              {safeStr(w.props.label)}
            </div>
          )}
          {w.type === "info" && (
            <div
              className="dashboard-preview__info-content"
              style={getInfoStyle(w)}
            >
              {w.props?.content && w.props?.content.trim()
                ? (
                  <div
                    style={{ textAlign: "inherit" }}
                    dangerouslySetInnerHTML={{ __html: marked.parse(w.props.content) }}
                  />
                )
                : <span style={{ color: "#b0bac7" }}>Нет текста</span>
              }
            </div>
          )}
        </div>
      );
    })}
    {config.widgets.length === 0 && (
      <div className="dashboard-preview__empty-state">
        Нет ни одного виджета.
      </div>
    )}
  </div>
);

export default DashboardPreview;
