import React, { useRef } from "react";
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
  // Добавлять новые типы (gauge, funnel, combo...) по мере расширения
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

// Фолбэк
const FallbackChart: React.FC = () => (
  <div className="chart-fallback">
    Тип графика не поддерживается (или нет данных)
  </div>
);

// Базовые опции — могут быть расширены кастомными
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
      point: { radius: 2, hoverRadius: 4 },
      line: { borderWidth: 2 },
      bar: { borderRadius: 6, borderSkipped: false as const },
      arc: { borderWidth: 0 },
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 0,
          autoSkip: true,
          autoSkipPadding: 8,
          color: pal.neutral,
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
    backgroundColor:
      d.backgroundColor ??
      (idx === 0
        ? 'rgba(139, 197, 64, 0.18)'
        : 'rgba(78, 195, 224, 0.18)'),
    pointBackgroundColor: d.pointBackgroundColor ?? pal.white,
    pointBorderColor: d.pointBorderColor ?? (idx === 0 ? pal.green : pal.blue),
  })),
});

// Цвета для каждой серии — полностью кастомизируемые
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

const ChartPreview: React.FC<Props> = ({
  type, data, options, theme,
  onExport,
}) => {
  const pal = PALETTES[theme?.palette ?? 'light'];
  const chartRef = useRef<any>(null);
  const C = chartMap[type] || null;

  if (!data || !data.labels || !data.datasets || data.labels.length === 0 || data.datasets.length === 0) {
    return <FallbackChart />;
  }
  if (!C) return <FallbackChart />;

  const prepared =
    type === "area"
      ? withAreaStyling(normalizeDatasetsColors('line', data, theme), pal)
      : normalizeDatasetsColors(type, data, theme);

  const mergedOptions = {
    ...getDefaultOptions(theme),
    ...(options || {}),
  };

  // Экспорт изображения графика
  const handleExport = () => {
    if (chartRef.current && onExport) {
      // Chart.js instance for v3+: getElementAtEvent etc.
      const chartInstance = chartRef.current;
      const img = chartInstance?.toBase64Image?.();
      if (img) onExport(img);
    }
  };

  return (
    <div className={`chart-container${theme?.dark ? ' chart-dark' : ''}`}>
      <div className="chart-toolbar">
        {onExport && <button onClick={handleExport}>Экспорт PNG</button>}
      </div>
      <C
        ref={chartRef}
        data={prepared}
        options={mergedOptions}
      />
    </div>
  );
};

export default ChartPreview;
