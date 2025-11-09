import React, { useState, useEffect } from "react";
import "../styles/ChartConfigPanel.css";

const CHART_TYPES = [
  { value: "line", label: "Линейный" },
  { value: "bar", label: "Гистограмма" },
  { value: "area", label: "Площадной" },
  { value: "pie", label: "Круговая" },
  { value: "doughnut", label: "Кольцевая" },
  { value: "radar", label: "Радар" },
  { value: "scatter", label: "Точечный" },
  { value: "bubble", label: "Пузырьковый" },
  { value: "polarArea", label: "Полярная" },
];

const PALETTE = [
  "#8BC540", "#4EC3E0", "#2F444E", "#F89445", "#FF6E84", "#76787A", "#E9F5DF"
];

const LEGEND_POSITIONS = [
  { value: "top", label: "Сверху" },
  { value: "bottom", label: "Снизу" },
  { value: "left", label: "Слева" },
  { value: "right", label: "Справа" },
  { value: "hidden", label: "Скрыть" },
];

interface ChartConfig {
  type: string;
  colors: string[];
  legendPosition: string;
  showTitle: boolean;
  titleText: string;
  dark: boolean;
  borderWidth: number;
  fill: boolean;
  smoothing: number;
  fontSize: number;
  xAxisLabel: string;
  yAxisLabel: string;
  showGrid: boolean;
  legendFontSize: number;
  tooltipFormat: string;
}

interface Props {
  onChange: (cfg: ChartConfig) => void;
  initial?: Partial<ChartConfig>;
}

const ChartConfigPanel: React.FC<Props> = ({ onChange, initial }) => {
  const [type, setType] = useState(initial?.type ?? "line");
  const [colors, setColors] = useState<string[]>(initial?.colors ?? [PALETTE[0], PALETTE[1]]);
  const [legendPosition, setLegendPosition] = useState(initial?.legendPosition ?? "top");
  const [showTitle, setShowTitle] = useState(initial?.showTitle ?? false);
  const [titleText, setTitleText] = useState(initial?.titleText ?? "");
  const [dark, setDark] = useState(initial?.dark ?? false);

  // Advanced
  const [borderWidth, setBorderWidth] = useState(initial?.borderWidth ?? 2);
  const [fill, setFill] = useState(initial?.fill ?? (type === "area"));
  const [smoothing, setSmoothing] = useState(initial?.smoothing ?? 0.3);
  const [fontSize, setFontSize] = useState(initial?.fontSize ?? 14);
  const [xAxisLabel, setXAxisLabel] = useState(initial?.xAxisLabel ?? "");
  const [yAxisLabel, setYAxisLabel] = useState(initial?.yAxisLabel ?? "");
  const [showGrid, setShowGrid] = useState(initial?.showGrid ?? true);
  const [legendFontSize, setLegendFontSize] = useState(initial?.legendFontSize ?? 13);
  const [tooltipFormat, setTooltipFormat] = useState(initial?.tooltipFormat || "{y}");

  useEffect(() => {
    onChange({
      type,
      colors,
      legendPosition,
      showTitle,
      titleText,
      dark,
      borderWidth,
      fill,
      smoothing,
      fontSize,
      xAxisLabel,
      yAxisLabel,
      showGrid,
      legendFontSize,
      tooltipFormat
    });
  }, [
    type, colors, legendPosition, showTitle, titleText, dark,
    borderWidth, fill, smoothing, fontSize, xAxisLabel, yAxisLabel, showGrid, legendFontSize, tooltipFormat, onChange
  ]);

  return (
    <div className={`chart-config-panel card-shadow${dark ? " chart-dark" : ""}`}>
      <div className="chart-config-grid">
        <div className="chart-config-field">
          <label className="chart-config-label">Тип графика:</label>
          <select value={type} onChange={e => setType(e.target.value)} className="chart-config-select">
            {CHART_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div className="chart-config-field">
          <label className="chart-config-label">Цвета серий:</label>
          <div className="chart-config-colors">
            {colors.map((col, idx) => (
              <input
                key={idx}
                type="color"
                value={col}
                onChange={e => {
                  const next = [...colors];
                  next[idx] = e.target.value;
                  setColors(next);
                }}
              />
            ))}
            <button
              className="chart-config-color-btn"
              type="button"
              title="Добавить серию"
              onClick={() => setColors([...colors, PALETTE[colors.length % PALETTE.length]])}
            >
              +
            </button>
            {colors.length > 1 &&
              <button
                className="chart-config-color-btn"
                type="button"
                title="Удалить серию"
                onClick={() => setColors(colors.slice(0, -1))}
              >
                −
              </button>
            }
          </div>
        </div>
        <div className="chart-config-row-tight">
          <label>
            <input type="checkbox" checked={dark} onChange={e => setDark(e.target.checked)} />
            Тёмная тема
          </label>
          <label className="chart-config-label" style={{marginLeft:16}}>Позиция легенды:</label>
          <select
            value={legendPosition}
            onChange={e => setLegendPosition(e.target.value)}
            className="chart-config-select"
          >
            {LEGEND_POSITIONS.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
        <div className="chart-config-row-tight">
          <label>
            <input type="checkbox" checked={showTitle} onChange={e => setShowTitle(e.target.checked)} />
            Показывать заголовок
          </label>
          {showTitle &&
            <input
              className="chart-config-input"
              type="text"
              value={titleText}
              onChange={e => setTitleText(e.target.value)}
              placeholder="Заголовок графика"
            />
          }
        </div>
        {/* Advanced */}
        <hr className="chart-config-divider" />
        <div className="chart-config-row-tight">
          <label>Толщина линии/бара:</label>
          <input
            type="number"
            min={1}
            max={10}
            value={borderWidth}
            onChange={e => setBorderWidth(Number(e.target.value))}
            className="chart-config-input"
            style={{ width: 50, marginRight: 10 }}
          />
          {type === "line" || type === "area" ? (
            <>
              <label style={{marginLeft:12}}>Сглаживание:</label>
              <input
                type="number"
                min={0}
                step={0.05}
                max={1}
                value={smoothing}
                onChange={e => setSmoothing(Number(e.target.value))}
                className="chart-config-input"
                style={{ width: 60, marginRight: 10 }}
              />
              <label>
                <input type="checkbox" checked={fill} onChange={e => setFill(e.target.checked)} />
                Заливка (Area)
              </label>
            </>
          ) : null}
        </div>
        <div className="chart-config-row-tight">
          <label>Размер шрифта:</label>
          <input
            type="number"
            min={8}
            max={22}
            value={fontSize}
            onChange={e => setFontSize(Number(e.target.value))}
            className="chart-config-input"
            style={{ width: 50, marginRight: 10 }}
          />
          <label style={{marginLeft:12}}>Шрифт легенды:</label>
          <input
            type="number"
            min={6}
            max={20}
            value={legendFontSize}
            onChange={e => setLegendFontSize(Number(e.target.value))}
            className="chart-config-input"
            style={{ width: 50, marginRight: 10 }}
          />
        </div>
        <div className="chart-config-row-tight">
          <label>
            <input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} />
            Сетка осей
          </label>
          <label style={{marginLeft:12}}>Ось X:</label>
          <input
            className="chart-config-input"
            type="text"
            value={xAxisLabel}
            onChange={e => setXAxisLabel(e.target.value)}
            placeholder="Подпись X"
            style={{ width: 110 }}
          />
          <label style={{marginLeft:12}}>Ось Y:</label>
          <input
            className="chart-config-input"
            type="text"
            value={yAxisLabel}
            onChange={e => setYAxisLabel(e.target.value)}
            placeholder="Подпись Y"
            style={{ width: 110 }}
          />
        </div>
        <div className="chart-config-row-tight">
          <label>Шаблон tooltip:</label>
          <input
            className="chart-config-input"
            type="text"
            value={tooltipFormat}
            onChange={e => setTooltipFormat(e.target.value)}
            placeholder="{y} / {label}"
            style={{ width: 180 }}
          />
        </div>
      </div>
    </div>
  );
};

export default ChartConfigPanel;
