import React, { useMemo, useCallback, useState } from "react";
import GridLayout, { WidthProvider, Layout } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import "../styles/DashboardCanvas.css";
import TablePreview from "./TablePreview";
import ChartPreview from "./ChartPreview";
import InfoTextWidget from "./InfoTextWidget";
import { marked } from "marked";
import { useAutoRefresh } from "../hooks/useAutoRefresh";

const ResponsiveGridLayout = WidthProvider(GridLayout);

type WidgetConfig = {
  id: string;
  type: string;
  props: any;
  [key: string]: any;
};

type CanvasProps = {
  widgets: WidgetConfig[];
  layout: Layout[];
  onLayoutChange: (l: Layout[]) => void;
  selectedWidgetId: string | null;
  onSelectWidget: (id: string | null) => void;
  onEditWidget?: (id: string) => void;
  onDuplicateWidget?: (id: string) => void;
  onRemoveWidget?: (id: string) => void;
  onUpdateWidget: (id: string, patch: any) => void;
  isPublished?: boolean;
  canEdit?: boolean;
  autoRefreshInterval?: number;
};

const InfoWidget: React.FC<{ content: string; style?: React.CSSProperties }> = ({ content, style }) => (
  <div className="widget-info-preview" style={{
    background: style?.backgroundColor ?? "#f6f9ff",
    border: "1.2px solid #eaeef2",
    borderRadius: style?.borderRadius ?? 10,
    padding: style?.padding ?? 14,
    color: style?.color ?? "#23272b",
    fontSize: style?.fontSize ?? 15,
    width: style?.width ?? "100%",
    textAlign: style?.textAlign ?? "left",
    fontWeight: style?.fontWeight,
    fontFamily: style?.fontFamily,
    minHeight: 32
  }}>
    {content && content.trim()
      ? <div dangerouslySetInnerHTML={{ __html: marked.parse(content) }} />
      : <span style={{ color: "#b0bac7" }}>Нет информации</span>
    }
  </div>
);

const DashboardCanvas: React.FC<CanvasProps> = ({
  widgets,
  layout,
  onLayoutChange,
  selectedWidgetId,
  onSelectWidget,
  onEditWidget,
  onDuplicateWidget,
  onRemoveWidget,
  onUpdateWidget,
  isPublished = false,
  canEdit = true,
  autoRefreshInterval = 0,
}) => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = useCallback(() => setRefreshKey(prev => prev + 1), []);
  useAutoRefresh({
    enabled: autoRefreshInterval > 0,
    intervalSeconds: autoRefreshInterval,
    onRefresh: handleRefresh,
  });

  const safeLayout = useMemo<Layout[]>(
    () =>
      (layout || []).map((l) => ({
        ...l,
        minW: l.minW ?? 4,
        minH: l.minH ?? 12,
        maxW: 24,
        maxH: 48,
        isResizable: !isPublished && (l.isResizable ?? true),
        isDraggable: !isPublished && (l.isDraggable ?? true),
      })),
    [layout, isPublished]
  );

  const buildChartData = useCallback((w: WidgetConfig) => {
    try {
      if (
        Array.isArray(w.props?.result?.labels) &&
        Array.isArray(w.props?.result?.datasets)
      ) {
        return w.props.result;
      }
      if (
        Array.isArray(w.props?.result?.data) &&
        w.props?.xField &&
        w.props?.yField
      ) {
        const rows = w.props.result.data;
        const isAgg = Boolean(w.props.aggregation);
        const yKey = isAgg ? `${w.props.aggregation}_${w.props.yField}` : w.props.yField;
        const palette = [
          "#8BC540", "#2B76F0", "#FF9D5C", "#6E5CE0",
          "#00B4D8", "#FFB84D", "#E74C3C", "#00D9A3"
        ];
        return {
          labels: rows.map((r: any) => r[w.props.xField]?.toString() || "N/A"),
          datasets: [{
            label: w.props.label || w.props.yField,
            data: rows.map((r: any) => Number(r[yKey]) || 0),
            backgroundColor:
              w.props.chartType === "pie" || w.props.chartType === "doughnut"
                ? palette
                : "rgba(139,197,64,.8)",
            borderColor:
              w.props.chartType === "pie" || w.props.chartType === "doughnut"
                ? palette : "#8BC540",
            borderWidth: 2,
            fill: w.props.chartType === "area",
            tension: 0.4,
          }]
        };
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const showEmptyState = useCallback((w: WidgetConfig) => {
    switch (w.type) {
      case "table":
        return !w.props?.result?.data || w.props.result.data.length === 0;
      case "chart":
        return !buildChartData(w);
      case "info":
        return !w.props?.content || !w.props.content.trim();
      case "kpi":
        return !w.props?.result?.data || w.props.result.data.length === 0;
      default:
        return false;
    }
  }, [buildChartData]);

  const extractInfoStyle = (w: WidgetConfig) => {
    if (w.type !== "info" || !w.props?.style) return undefined;
    return { ...w.props.style };
  };

  const handleInfoWidgetUpdate = useCallback((id: string, patch: any) => {
    onUpdateWidget(id, patch);
  }, [onUpdateWidget]);

  return (
    <div
      className={`canvas-wrapper${isPublished ? " canvas-wrapper--clean" : ""}`}
      style={isPublished
        ? { background: "#fff", boxShadow: "none", border: "none", padding: 0, margin: 0 }
        : {}}
    >
      <ResponsiveGridLayout
        key={refreshKey}
        className={`canvas-layout${isPublished ? " canvas-layout--published" : ""}`}
        cols={24}
        rowHeight={10}
        margin={isPublished ? [0, 0] : [16, 16]}
        containerPadding={isPublished ? [0, 0] : [8, 8]}
        layout={safeLayout}
        draggableHandle={isPublished ? undefined : ".canvas-drag-handle"}
        isResizable={!isPublished && canEdit}
        isDraggable={!isPublished && canEdit}
        onLayoutChange={onLayoutChange}
        style={isPublished ? { background: "#fff", boxShadow: "none", border: "none" } : {}}
      >
        {widgets.map((w) => {
          const chartData = w.type === "chart" ? buildChartData(w) : null;
          const isEmpty = showEmptyState(w);
          const infoStyle = extractInfoStyle(w);

          return (
            <div
              key={w.id}
              className={`canvas-widget${isPublished ? " canvas-widget--clean" : ""}${isEmpty ? " canvas-widget--empty" : ""}${selectedWidgetId === w.id ? " canvas-widget--selected" : ""}`}
              style={isPublished
                ? { background: "#fff", border: "none", boxShadow: "none", padding: 0, minHeight: 0 }
                : {}
              }
              onClick={
                !isPublished && canEdit
                  ? (e) => {
                      e.stopPropagation();
                      onSelectWidget?.(w.id);
                    }
                  : undefined
              }
            >
              {!isPublished && (
                <div className="canvas-drag-handle" tabIndex={0}>
                  <span aria-hidden="true">⠿</span>
                  <span>{w.name || w.type.toUpperCase()}</span>
                </div>
              )}
              {!isPublished && (
                <div className="canvas-action-bar">
                  {onEditWidget && (
                    <button className="canvas-action-btn canvas-action-btn--edit"
                      onClick={(e) => { e.stopPropagation(); onEditWidget(w.id); }}
                      title="Редактировать" aria-label="Редактировать">✎
                    </button>
                  )}
                  {onDuplicateWidget && (
                    <button className="canvas-action-btn canvas-action-btn--duplicate"
                      onClick={(e) => { e.stopPropagation(); onDuplicateWidget(w.id); }}
                      title="Дублировать" aria-label="Дублировать">⧉
                    </button>
                  )}
                  {onRemoveWidget && (
                    <button className="canvas-action-btn canvas-action-btn--remove"
                      onClick={(e) => { e.stopPropagation(); if (window.confirm("Удалить виджет?")) onRemoveWidget(w.id); }}
                      title="Удалить" aria-label="Удалить">🗑️
                    </button>
                  )}
                </div>
              )}
              <div className="canvas-widget__content" style={isPublished ? { background: "#fff", padding: 0 } : {}}>
                {w.type === "table" && w.props?.result?.columns?.length > 0 && (
                  <TablePreview
                    key={`table-${w.id}-${refreshKey}`}
                    result={w.props.result}
                    maxRows={10}
                    isPublished={isPublished}
                  />
                )}
                {w.type === "chart" && chartData && (
                  <ChartPreview
                    key={`chart-${w.id}-${refreshKey}`}
                    type={w.props.chartType || "line"}
                    data={chartData}
                  />
                )}
                {w.type === "info" && selectedWidgetId === w.id && canEdit ? (
                  <InfoTextWidget
                    value={w.props?.content || ""}
                    style={w.props?.style}
                    onChangeContent={content => handleInfoWidgetUpdate(w.id, { content })}
                    onChangeStyle={style => handleInfoWidgetUpdate(w.id, { style })}
                  />
                ) : w.type === "info" && (
                  <InfoWidget
                    content={w.props?.content || ""}
                    style={infoStyle}
                  />
                )}
                {isEmpty && (
                  <div className="canvas-widget__empty">
                    <div>📭</div>
                    <p>Нет данных</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </ResponsiveGridLayout>
      {widgets.length === 0 && (
        <div className="canvas-empty" style={isPublished ? { background: "#fff" } : {}}>
          <div>📋</div>
          <p>Дашборд пуст — добавьте виджеты</p>
        </div>
      )}
    </div>
  );
};

export default DashboardCanvas;
