import React, { useMemo, useCallback, useState } from "react";
import GridLayout, { WidthProvider, Layout } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import "../styles/DashboardCanvas.css";
import TablePreview from "./TablePreview";
import ChartPreview from "./ChartPreview";
import { useAutoRefresh } from "../hooks/useAutoRefresh";

const ResponsiveGridLayout = WidthProvider(GridLayout);

type CanvasProps = {
  widgets: any[];
  layout: Layout[];
  onLayoutChange: (l: Layout[]) => void;
  selectedWidgetId: string | null;
  onSelectWidget: (id: string | null) => void;
  onEditWidget?: (id: string) => void;
  onDuplicateWidget?: (id: string) => void;
  onRemoveWidget?: (id: string) => void;
  isPublished?: boolean;
  canEdit?: boolean;
  autoRefreshInterval?: number;
};

const DashboardCanvas: React.FC<CanvasProps> = ({
  widgets,
  layout,
  onLayoutChange,
  selectedWidgetId,
  onSelectWidget,
  onEditWidget,
  onDuplicateWidget,
  onRemoveWidget,
  isPublished = false,
  canEdit = true,
  autoRefreshInterval = 0,
}) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);

  // Чистый и быстрый refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setRefreshKey((prev) => prev + 1);
    setLastRefreshTime(new Date());
    setIsRefreshing(false);
  }, []);

  useAutoRefresh({
    enabled: autoRefreshInterval > 0,
    intervalSeconds: autoRefreshInterval,
    onRefresh: handleRefresh,
  });

  // Гарантия корректной работы layout
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

  // Унификация построения данных для графика
  const buildChartData = useCallback((w: any) => {
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
        const yKey = isAgg
          ? `${w.props.aggregation}_${w.props.yField}`
          : w.props.yField;
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

  const showEmptyState = useCallback((w: any) => {
    switch (w.type) {
      case "table":
        return !w.props?.result?.data || w.props.result.data.length === 0;
      case "chart":
        return !buildChartData(w);
      case "kpi":
        return !w.props?.result?.data || w.props.result.data.length === 0;
      default:
        return false;
    }
  }, [buildChartData]);

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
        style={isPublished
          ? { background: "#fff", boxShadow: "none", border: "none" }
          : {}}
      >
        {widgets.map((w) => {
          const chartData = w.type === "chart" ? buildChartData(w) : null;
          const isEmpty = showEmptyState(w);

          return (
            <div
              key={w.id}
              className={`canvas-widget${isPublished ? " canvas-widget--clean" : ""}${isEmpty ? " canvas-widget--empty" : ""}`}
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
              {/* Drag and Action Bar ― только при редактировании */}
              {!isPublished && (
                <div className="canvas-drag-handle" tabIndex={0}>
                  <span aria-hidden="true">⠿</span>
                  <span>{w.name || w.type.toUpperCase()}</span>
                </div>
              )}
              {!isPublished && (
                <div className="canvas-action-bar">
                  {onEditWidget && (
                    <button
                      className="canvas-action-btn canvas-action-btn--edit"
                      onClick={(e) => { e.stopPropagation(); onEditWidget(w.id); }}
                      title="Редактировать"
                      aria-label="Редактировать"
                    >✎</button>
                  )}
                  {onDuplicateWidget && (
                    <button
                      className="canvas-action-btn canvas-action-btn--duplicate"
                      onClick={(e) => { e.stopPropagation(); onDuplicateWidget(w.id); }}
                      title="Дублировать"
                      aria-label="Дублировать"
                    >⧉</button>
                  )}
                  {onRemoveWidget && (
                    <button
                      className="canvas-action-btn canvas-action-btn--remove"
                      onClick={(e) => { e.stopPropagation(); if (window.confirm("Удалить виджет?")) onRemoveWidget(w.id); }}
                      title="Удалить"
                      aria-label="Удалить"
                    >🗑️</button>
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
