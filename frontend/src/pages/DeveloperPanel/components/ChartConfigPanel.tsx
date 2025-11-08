import React, { useState } from "react";

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
];

interface ChartConfig {
  type: string;
  colors: string[];
  legendPosition: string;
  showTitle: boolean;
  titleText: string;
  dark: boolean;
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

  React.useEffect(() => {
    onChange({ type, colors, legendPosition, showTitle, titleText, dark });
  }, [type, colors, legendPosition, showTitle, titleText, dark]);

  return (
    <div className={`chart-config-panel card-shadow${dark ? " chart-dark" : ""}`}>
      <div className="chart-config-grid">
        <div className="chart-config-field">
          <label className="chart-config-label">Тип графика:</label>
          <select
            value={type}
            onChange={e => setType(e.target.value)}
            className="chart-config-select"
          >
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
      </div>
    </div>
  );
};

export default ChartConfigPanel;
