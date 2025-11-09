import React, { useRef, useState } from "react";
import '../styles/ChartPreview.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  BubbleController,
  ScatterController,
} from 'chart.js';
import {
  Line, Bar, Pie, Radar, Doughnut, PolarArea, Bubble, Scatter
} from "react-chartjs-2";

// DOM.RF Palette + light/dark additions
const PALETTES = {
  light: {
    green: '#8BC540', blue: '#4EC3E0', gray: '#2F444E',
    neutral: '#76787A', white: '#FFFFFF', black: '#232426',
    bg: '#F9FAFB',
  },
  dark: {
    green: '#74B52A', blue: '#359EB9', gray: '#232426',
    neutral: '#ABB5BE', white: '#292C2E', black: '#1A1B1F',
    bg: '#17181C',
  },
};

ChartJS.defaults.font.family =
  "Verdana, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";
ChartJS.defaults.color = PALETTES.light.neutral;
ChartJS.defaults.responsive = true;
ChartJS.defaults.maintainAspectRatio = false;

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement,
  Title, Tooltip, Legend, RadialLinearScale, BubbleController, ScatterController,
);

const chartMap: Record<string, any> = {
  line: Line,
  bar: Bar,
  pie: Pie,
  area: Line,
  radar: Radar,
  doughnut: Doughnut,
  polarArea: PolarArea,
  bubble: Bubble,
  scatter: Scatter,
};

interface ChartTheme {
  palette?: keyof typeof PALETTES;
  colors?: string[];
  dark?: boolean;
  legendPosition?: 'top' | 'bottom' | 'left' | 'right';
  showTitle?: boolean;
  titleText?: string;
  markerType?: 'circle' | 'rect' | 'diamond' | 'star';
}
interface Props {
  type: string;
  data: any;
  options?: any;
  theme?: ChartTheme;
  onExport?: (imgSrc: string) => void;
  presetId?: string;
}

const FallbackChart: React.FC = () => (
  <div className="chart-fallback">
    Тип графика не поддерживается (или нет данных)
  </div>
);

const getDefaultOptions = (theme?: ChartTheme) => {
  const pal = PALETTES[theme?.palette ?? 'light'];
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: theme?.legendPosition ?? 'top',
        labels: {
          boxWidth: 10,
          color: pal.neutral,
          usePointStyle: true,
          pointStyle: theme?.markerType ?? 'circle',
        },
      },
      title: {
        display: !!theme?.showTitle,
        text: theme?.titleText ?? '',
        font: { weight: 'bold', size: 18 },
        color: pal.gray
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: pal.gray,
        titleColor: pal.white,
        bodyColor: pal.white,
        borderColor: pal.green,
        borderWidth: 1,
        displayColors: true,
      },
    },
    elements: {
      point: { radius: 3, hoverRadius: 6 },
      line: { borderWidth: 2 },
      bar: { borderRadius: 8, borderSkipped: false as const },
      arc: { borderWidth: 0 },
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 45, minRotation: 0, autoSkip: true, autoSkipPadding: 8, color: pal.neutral,
        },
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        ticks: { precision: 0, color: pal.neutral },
        grid: { color: 'rgba(47, 68, 78, 0.12)' },
      },
    },
  };
};

const withAreaStyling = (data: any, pal: any) => ({
  ...data,
  datasets: (data.datasets || []).map((d: any, idx: number) => ({
    ...d,
    fill: true,
    tension: d.tension ?? 0.3,
    borderColor: d.borderColor ?? (idx === 0 ? pal.green : pal.blue),
    backgroundColor: d.backgroundColor ??
      (idx === 0 ? 'rgba(139, 197, 64, 0.18)' : 'rgba(78, 195, 224, 0.18)'),
    pointBackgroundColor: d.pointBackgroundColor ?? pal.white,
    pointBorderColor: d.pointBorderColor ?? (idx === 0 ? pal.green : pal.blue),
  })),
});

const normalizeDatasetsColors = (type: string, data: any, theme?: ChartTheme) => {
  if (!data?.datasets) return data;
  const pal = PALETTES[theme?.palette ?? 'light'];
  const customColors = theme?.colors;
  const next = { ...data };
  next.datasets = data.datasets.map((d: any, idx: number) => {
    const baseStroke = customColors?.[idx] ?? (
      idx === 0 ? pal.green : idx === 1 ? pal.blue : pal.gray
    );
    const baseFill =
      theme?.dark
        ? pal.gray
        : idx === 0
        ? 'rgba(139, 197, 64, 0.85)'
        : idx === 1
        ? 'rgba(78, 195, 224, 0.85)'
        : 'rgba(47, 68, 78, 0.85)';
    if (type === 'bar') {
      return {
        ...d,
        backgroundColor: d.backgroundColor ?? baseFill,
        borderColor: d.borderColor ?? baseStroke,
      };
    }
    if (type === 'line' || type === 'scatter') {
      return {
        ...d,
        borderColor: d.borderColor ?? baseStroke,
        pointBackgroundColor: d.pointBackgroundColor ?? pal.white,
        pointBorderColor: d.pointBorderColor ?? baseStroke,
      };
    }
    return d;
  });
  return next;
};


// Компонент расширенного редактора настроек графика
const ChartSettingsPanel: React.FC<{
  chartType: string;
  setChartType: (v: string) => void;
  options: any;
  setOptions: (o: any) => void;
  theme: ChartTheme;
  setTheme: (t: ChartTheme) => void;
  data: any;
  setData: (d: any) => void;
}> = ({ chartType, setChartType, options, setOptions, theme, setTheme, data, setData }) => {
  // palette switch
  const handlePalette = (v: keyof typeof PALETTES) =>
    setTheme({ ...theme, palette: v });

  return (
    <div className="chart-settings-panel">
      <div className="chart-settings-row">
        <label>Тип графика:</label>
        <select value={chartType} onChange={e => setChartType(e.target.value)}>
          <option value="line">Линия</option>
          <option value="bar">Столбцы</option>
          <option value="area">Площадь</option>
          <option value="pie">Круговой</option>
          <option value="doughnut">Пончик</option>
          <option value="radar">Радар</option>
          <option value="scatter">Точки</option>
          <option value="bubble">Пузыри</option>
          <option value="polarArea">Polar Area</option>
        </select>
      </div>
      <div className="chart-settings-row">
        <label>Палитра:</label>
        <button onClick={() => handlePalette('light')}
          className={`palette-btn${theme.palette === 'light' ? ' selected' : ''}`}>Светлая</button>
        <button onClick={() => handlePalette('dark')}
          className={`palette-btn${theme.palette === 'dark' ? ' selected' : ''}`}>Тёмная</button>
      </div>
      <div className="chart-settings-row">
        <label>Заголовок:</label>
        <input
          type="text"
          value={theme.titleText || ""}
          onChange={e => setTheme({ ...theme, showTitle: !!e.target.value, titleText: e.target.value })}
          placeholder="Введите заголовок..."
        />
      </div>
      <div className="chart-settings-row">
        <label>Показать легенду:</label>
        <select value={theme.legendPosition ?? 'top'}
          onChange={e => setTheme({ ...theme, legendPosition: e.target.value as any })}>
          <option value="top">Сверху</option>
          <option value="bottom">Снизу</option>
          <option value="left">Слева</option>
          <option value="right">Справа</option>
          <option value="hidden">Скрыть</option>
        </select>
      </div>
      <div className="chart-settings-row">
        <label>Толщина линии (line/area):</label>
        <input
          type="number" min={1} max={10}
          value={options.elements?.line?.borderWidth ?? 2}
          onChange={e => setOptions({
            ...options,
            elements: {
              ...options.elements,
              line: {
                ...options.elements?.line,
                borderWidth: Number(e.target.value)
              }
            }
          })}
        />
      </div>
      <div className="chart-settings-row">
        <label>Цвета серий:</label>
        {(data?.datasets || []).map((ds: any, idx: number) => (
          <input key={idx}
            type="color"
            value={(theme.colors && theme.colors[idx]) || PALETTES[theme.palette ?? 'light']?.green}
            onChange={e =>
              setTheme({
                ...theme,
                colors: [
                  ...(theme.colors || []).slice(0, idx),
                  e.target.value,
                  ...(theme.colors || []).slice(idx + 1)
                ]
              })
            }
          />
        ))}
      </div>
    </div>
  );
};


// MAIN ChartPreview Component
const ChartPreview: React.FC<Props> = ({
  type,
  data,
  options,
  theme: extTheme,
  onExport,
}) => {
  const pal = PALETTES[extTheme?.palette ?? 'light'];
  const chartRef = useRef<any>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Editable state
  const [chartType, setChartType] = useState(type);
  const [theme, setTheme] = useState<ChartTheme>(extTheme || { palette: 'light' });
  const [userOptions, setUserOptions] = useState<any>(options || {});
  const [innerData, setInnerData] = useState<any>(data);

  const C = chartMap[chartType] || null;

  if (!innerData || !innerData.labels || !innerData.datasets || innerData.labels.length === 0 || innerData.datasets.length === 0) {
    return <FallbackChart />;
  }
  if (!C) return <FallbackChart />;

  const prepared =
    chartType === "area"
      ? withAreaStyling(normalizeDatasetsColors('line', innerData, theme), pal)
      : normalizeDatasetsColors(chartType, innerData, theme);
  const mergedOptions = {
    ...getDefaultOptions(theme),
    ...(userOptions || {}),
    plugins: {
      ...getDefaultOptions(theme).plugins,
      ...(userOptions?.plugins || {}),
      legend: {
        ...(getDefaultOptions(theme).plugins.legend),
        ...(userOptions?.plugins?.legend || {}),
        display: theme.legendPosition !== "hidden",
      },
      title: {
        ...getDefaultOptions(theme).plugins.title,
        ...(userOptions?.plugins?.title || {}),
        display: !!(theme.showTitle && theme.titleText),
        text: theme.titleText || "",
      }
    },
  };

  // Экспорт изображения графика
  const handleExport = () => {
    if (chartRef.current && onExport) {
      const chartInstance = chartRef.current;
      const img = chartInstance?.toBase64Image?.();
      if (img) onExport(img);
    }
  };

  return (
    <div className={`chart-container${theme?.dark ? ' chart-dark' : ''}`}>
      <div className="chart-toolbar">
        <button onClick={() => setShowSettings(s => !s)}>
          {showSettings ? "Скрыть настройки" : "Настройки графика"}
        </button>
        {onExport && <button onClick={handleExport}>Экспорт PNG</button>}
      </div>
      {showSettings && (
        <ChartSettingsPanel
          chartType={chartType}
          setChartType={setChartType}
          options={userOptions}
          setOptions={setUserOptions}
          theme={theme}
          setTheme={setTheme}
          data={innerData}
          setData={setInnerData}
        />
      )}
      <C
        ref={chartRef}
        data={prepared}
        options={mergedOptions}
      />
    </div>
  );
};

export default ChartPreview;
