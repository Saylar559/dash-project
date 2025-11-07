import React from "react";
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

// Brand palette (DOM.RF)
const DOMRF = {
  green: '#8BC540',
  gray: '#2F444E',
  blue: '#4EC3E0',
  neutral: '#76787A',
  white: '#FFFFFF',
};

// Global Chart.js defaults
ChartJS.defaults.font.family =
  "Verdana, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";
ChartJS.defaults.color = DOMRF.neutral;
ChartJS.defaults.responsive = true;
ChartJS.defaults.maintainAspectRatio = false;

ChartJS.register(
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

interface Props {
  type: string;
  data: any;
  options?: any;
}

const FallbackChart: React.FC = () => (
  <div className="chart-fallback">
    Тип графика не поддерживается (или нет данных)
  </div>
);

// DOM.RF-flavored defaults
const defaultOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        boxWidth: 10,
        color: DOMRF.neutral,
        usePointStyle: true,
        pointStyle: 'circle' as const,
      },
    },
    title: { display: false },
    tooltip: {
      mode: 'index' as const,
      intersect: false,
      backgroundColor: DOMRF.gray,
      titleColor: DOMRF.white,
      bodyColor: DOMRF.white,
      borderColor: DOMRF.green,
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
        color: DOMRF.neutral,
      },
      grid: { display: false },
    },
    y: {
      beginAtZero: true,
      ticks: { precision: 0, color: DOMRF.neutral },
      grid: { color: 'rgba(47, 68, 78, 0.12)' },
    },
  },
};

const withAreaStyling = (data: any) => ({
  ...data,
  datasets: (data.datasets || []).map((d: any, idx: number) => ({
    ...d,
    fill: true,
    tension: d.tension ?? 0.3,
    borderColor: d.borderColor ?? (idx === 0 ? DOMRF.green : DOMRF.blue),
    backgroundColor:
      d.backgroundColor ??
      (idx === 0
        ? 'rgba(139, 197, 64, 0.18)'
        : 'rgba(78, 195, 224, 0.18)'),
    pointBackgroundColor: d.pointBackgroundColor ?? DOMRF.white,
    pointBorderColor: d.pointBorderColor ?? (idx === 0 ? DOMRF.green : DOMRF.blue),
  })),
});

const normalizeDatasetsColors = (type: string, data: any) => {
  if (!data?.datasets) return data;
  const next = { ...data };
  next.datasets = data.datasets.map((d: any, idx: number) => {
    const baseStroke = idx === 0 ? DOMRF.green : idx === 1 ? DOMRF.blue : DOMRF.gray;
    const baseFill =
      idx === 0
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
        pointBackgroundColor: d.pointBackgroundColor ?? DOMRF.white,
        pointBorderColor: d.pointBorderColor ?? baseStroke,
      };
    }
    return d;
  });
  return next;
};

const ChartPreview: React.FC<Props> = ({ type, data, options }) => {
  const C = chartMap[type] || null;

  if (!data || !data.labels || !data.datasets || data.labels.length === 0 || data.datasets.length === 0) {
    return <FallbackChart />;
  }
  if (!C) return <FallbackChart />;

  const prepared =
    type === "area"
      ? withAreaStyling(normalizeDatasetsColors('line', data))
      : normalizeDatasetsColors(type, data);

  return (
    <div className="chart-container">
      <C data={prepared} options={{ ...defaultOptions, ...(options || {}) }} />
    </div>
  );
};

export default ChartPreview;