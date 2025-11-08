import React, { useMemo, useCallback, useState } from "react";
import GridLayout, { WidthProvider, Layout } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import "../styles/DashboardCanvas.css";
import TablePreview from "./TablePreview";
import ChartPreview from "./ChartPreview";
import { marked } from "marked";
import { useAutoRefresh } from "../hooks/useAutoRefresh";

type InfoTextStyle = {
  fontSize: number;
  color: string;
  fontWeight: "normal" | "bold";
  textAlign: "left" | "center" | "right";
  fontFamily: string;
};

const DEFAULT_INFO_STYLE: InfoTextStyle = {
  fontSize: 18,
  color: "#232b3b",
  fontWeight: "normal",
  textAlign: "left",
  fontFamily: "Inter, Arial, sans-serif",
};

const ResponsiveGridLayout = WidthProvider(GridLayout);

const InfoWidget: React.FC<{ content: string; style?: InfoTextStyle }> = ({ content, style }) => (
  <div className="widget-info-preview" style={{
    background: "#f6f9ff",
    border: "1.2px solid #eaeef2",
    borderRadius: 10,
    padding: 12,
    minHeight: 30,
    ...(style || DEFAULT_INFO_STYLE)
  }}>
    {content && content.trim()
      ? <div dangerouslySetInnerHTML={{ __html: marked.parse(content) }} />
      : <span style={{ color: "#b0bac7" }}>Нет информации</span>
    }
  </div>
);

const InfoWidgetEditor: React.FC<{
  value: string;
  style: InfoTextStyle;
  onChange: (val: string, style: InfoTextStyle) => void;
  onCancel: () => void;
  onSave: () => void;
}> = ({ value, style, onChange, onCancel, onSave }) => (
  <div className="info-widget-editor-modal">
    <div style={{
      boxShadow: "0 7px 32px 0 #1d27501a", padding: 22, background: "#fff",
      borderRadius: 12, position: "fixed", left: "44%", top: "16%", zIndex: 1800, minWidth: 380
    }}>
      <h3 style={{ marginTop: 0 }}>Редактор инфо-текста</h3>
      <div style={{ display: "flex", gap: 14, marginBottom: 8, flexWrap: "wrap", alignItems: "center" }}>
        <select value={style.fontFamily}
          onChange={e => onChange(value, { ...style, fontFamily: e.target.value })}>
          <option value="Inter, Arial, sans-serif">Inter</option>
          <option value="Roboto, Arial, sans-serif">Roboto</option>
          <option value="serif">Serif</option>
          <option value="monospace">Mono</option>
        </select>
        <input type="number" min={8} max={60} step={1} value={style.fontSize}
          onChange={e => onChange(value, { ...style, fontSize: Number(e.target.value) })} style={{ width: 55 }} />
        <select value={style.fontWeight}
          onChange={e => onChange(value, { ...style, fontWeight: e.target.value as InfoTextStyle["fontWeight"] })}>
          <option value="normal">Обычный</option>
          <option value="bold">Жирный</option>
        </select>
        <input type="color" value={style.color}
          onChange={e => onChange(value, { ...style, color: e.target.value })} />
        <button onClick={() => onChange(value, { ...style, textAlign: "left" })}
                style={{ fontWeight: style.textAlign === "left" ? 700 : 400 }}>Лево</button>
        <button onClick={() => onChange(value, { ...style, textAlign: "center" })}
                style={{ fontWeight: style.textAlign === "center" ? 700 : 400 }}>Центр</button>
        <button onClick={() => onChange(value, { ...style, textAlign: "right" })}
                style={{ fontWeight: style.textAlign === "right" ? 700 : 400 }}>Право</button>
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value, style)}
        style={{
          width: "100%", minHeight: 70, resize: "vertical",
          ...style, fontWeight: style.fontWeight, textAlign: style.textAlign,
          fontFamily: style.fontFamily, color: style.color, fontSize: style.fontSize,
          border: "1px solid #e5e9f2", borderRadius: 8, padding: "12px 15px"
        }}
      />
      <div style={{ marginTop: 14, display: "flex", gap: 12 }}>
        <button onClick={onSave} style={{
          background: "#8bc540", color: "#fff", fontWeight: 600, border: 0,
          borderRadius: 6, padding: "7px 16px", cursor: "pointer"
        }}>Сохранить</button>
        <button onClick={onCancel} style={{
          background: "#eaeef2", color: "#232b3b", border: 0, borderRadius: 6,
          padding: "7px 16px", cursor: "pointer"
        }}>Отмена</button>
      </div>
    </div>
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "#1a253744", zIndex: 1700
    }} onClick={onCancel} />
  </div>
);

type CanvasProps = {
  widgets: any[];
  layout: Layout[];
  onLayoutChange: (l: Layout[]) => void;
  selectedWidgetId: string | null;
  onSelectWidget: (id: string | null) => void;
  onEditWidget?: (id: string, propsPatch?: Partial<any>) => void;
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

  // --- InfoWidget editor modалка
  const [infoEditorId, setInfoEditorId] = useState<string | null>(null);
  const [infoEditValue, setInfoEditValue] = useState<string>("");
  const [infoEditStyle, setInfoEditStyle] = useState<InfoTextStyle>(DEFAULT_INFO_STYLE);

  const handleEditInfoWidget = useCallback((w: any) => {
    setInfoEditorId(w.id);
    setInfoEditValue(w.props?.content || "");
    setInfoEditStyle(w.props?.style || DEFAULT_INFO_STYLE);
  }, []);

  const handleSaveInfoWidget = useCallback(() => {
    if (infoEditorId && onEditWidget) {
      onEditWidget(infoEditorId, { content: infoEditValue, style: infoEditStyle });
    }
    setInfoEditorId(null);
  }, [infoEditorId, infoEditValue, infoEditStyle, onEditWidget]);

  const safeLayout = useMemo<Layout[]>(
    () => (layout || []).map((l) => ({
      ...l, minW: l.minW ?? 4, minH: l.minH ?? 12, maxW: 24, maxH: 48,
      isResizable: !isPublished && (l.isResizable ?? true),
      isDraggable: !isPublished && (l.isDraggable ?? true),
    })), [layout, isPublished]);

  // ... (buildChartData & showEmptyState — как у тебя)

  return (
    <div className={`canvas-wrapper${isPublished ? " canvas-wrapper--clean" : ""}`}
      style={isPublished ? { background: "#fff", boxShadow: "none", border: "none", padding: 0, margin: 0 } : {}}>
      <ResponsiveGridLayout
        // ... (как у тебя)
      >
        {widgets.map((w) => {
          // ... (other content unchanged)
          return (
            <div key={w.id} className={`canvas-widget${isPublished ? " canvas-widget--clean" : ""}`}>
              {/* Drag & action bar */}
              {!isPublished && (
                <div className="canvas-action-bar">
                  {w.type === "info" && (
                    <button className="canvas-action-btn canvas-action-btn--edit"
                            onClick={(e) => { e.stopPropagation(); handleEditInfoWidget(w); }}
                            title="Редактировать" aria-label="Редактировать">✎</button>
                  )}
                  {onDuplicateWidget && (<button>⧉</button>)}
                  {onRemoveWidget && (<button>🗑️</button>)}
                </div>
              )}
              {/* Content */}
              <div className="canvas-widget__content">
                {w.type === "info" && (
                  <InfoWidget content={w.props?.content || ""} style={w.props?.style} />
                )}
                {/* Остальное — как у тебя */}
              </div>
            </div>
          );
        })}
      </ResponsiveGridLayout>

      {infoEditorId && (
        <InfoWidgetEditor
          value={infoEditValue}
          style={infoEditStyle}
          onChange={(v, s) => { setInfoEditValue(v); setInfoEditStyle(s); }}
          onCancel={() => setInfoEditorId(null)}
          onSave={handleSaveInfoWidget}
        />
      )}

      {/* Остальные блоки, как у тебя */}
    </div>
  );
};

export default DashboardCanvas;
