// frontend/src/pages/DeveloperPanel/types.ts

/** Базовые типы */

export type ID = string | number;

/** Типы виджетов конструктора BI */
export type WidgetType =
  | 'table'
  | 'chart'
  | 'filter'
  | 'kpi'
  | 'info'
  | 'divider'
  | 'image'
  | 'gauge'
  | 'progress'
  | 'markdown'
  | 'custom';

/** Типы поддерживаемых графиков */
export type ChartType =
  | 'line'
  | 'bar'
  | 'pie'
  | 'area'
  | 'scatter'
  | 'radar'
  | 'doughnut'
  | 'polarArea'
  | 'bubble'
  | 'heatmap'
  | 'treemap'
  | 'funnel';

/** Результат SQL-запроса в едином формате */
export interface SqlResult {
  columns: string[];                     // список колонок
  data: Array<Record<string, any>>;      // строки результата
  row_count?: number;                    // количество строк
  execution_time_ms?: number;            // время выполнения
  source?: string;                       // опционально: таблица/представление/описание
}

/**
 * Универсальный формат данных для ChartPreview / react-chartjs-2:
 * labels + datasets (как требует Chart.js)
 */
export interface ChartDataset {
  label: string;
  data: number[] | any[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
  tension?: number;
  [key: string]: any;
}
export interface ChartDataStd {
  labels: string[] | number[] | Date[];
  datasets: ChartDataset[];
}

/** Фильтр/параметр для SQL */
export interface SqlParam {
  name: string;                // имя параметра (:name)
  value: string | number | boolean | Date | null;
  type?: 'string' | 'number' | 'boolean' | 'date';
}

/** Карта фильтров виджета (локальные фильтры) */
export type WidgetFilters = Record<
  string,
  {
    op?: '=' | '<>' | '>' | '<' | 'LIKE';
    val?: string | number | boolean | Date | null;
  }
>;

/** Оформление/стилизация виджета */
export interface WidgetStyle {
  color?: string;
  bg?: string;
  border?: string;
  borderRadius?: number;
  shadow?: boolean;
  className?: string; // Tailwind/SCSS hook
}

/** Динамические пропсы виджета */
export interface WidgetProps {
  // Источник данных
  sql?: string;
  params?: SqlParam[];                 // параметры для SQL
  result?: SqlResult | ChartDataStd;   // результат: сырой SQL или уже собранный chart data

  // Настройки Chart/Table
  chartType?: ChartType;
  xField?: string;
  yField?: string;
  seriesField?: string;                // для мульти-серий/legend
  aggregation?: '' | 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX';

  // Общие атрибуты
  label?: string;
  fields?: string[] | string;          // для filter / table
  content?: string;                    // info/markdown
  imageUrl?: string;
  gaugeValue?: number;
  gaugeMax?: number;
  progress?: number;
  markdown?: string;

  // Фильтры/видимые колонки
  filters?: WidgetFilters;             // локальные фильтры виджета
  filterFields?: string[];             // какие колонки доступны для фильтрации

  // Визуал
  style?: WidgetStyle;

  // Расширение
  [key: string]: any;
}

/** Главная сущность виджета на канвасе */
export interface DashboardWidget {
  id: string;
  type: WidgetType;
  position?: [number, number];              // устаревшее — используйте layout
  size?: { w: number; h: number };
  props: WidgetProps;
  locked?: boolean;
  hidden?: boolean;
  name?: string;
}

/** Позиции виджетов для drag-grid */
export interface DashboardLayout {
  widgetId: string;
  x: number;
  y: number;
  w: number;
  h: number;
  isDraggable?: boolean;
  isResizable?: boolean;
}

/** Конфигурация дашборда */
export interface DashboardConfig {
  widgets: DashboardWidget[];
  layout: DashboardLayout[];
  filters?: { [key: string]: any };     // глобальные фильтры
  theme?: 'corporate' | 'light' | 'dark' | 'auto';
  refreshInterval?: number;             // сек
  description?: string;
  ownerId?: number;
  backgroundUrl?: string;
}

/** API-модель дашборда */
export interface Dashboard {
  id: number;
  title: string;
  description?: string;
  config: DashboardConfig | string;
  tags?: string[];
  is_published: boolean;
  saved: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
  is_favorite?: boolean;
  view_count?: number;
  preview_image?: string;
}

/** Payload для сохранения */
export interface SaveDashboardPayload {
  title: string;
  description?: string;
  config: DashboardConfig;
  tags?: string[];
}

/** Для Sidebar состава инструментов */
export interface WidgetTypeInfo {
  type: WidgetType;
  label: string;
  icon: string;
  color?: string;
  disabled?: boolean;
}

/** Для предпросмотра отдельного виджета */
export interface PreviewWidgetProps {
  widget: DashboardWidget;
  selected?: boolean;
  onSelect?: (id: string) => void;
}

/** Фильтрация списка дашбордов */
export interface DashboardFilters {
  search?: string;
  tags?: string[];
  createdBy?: number;
  dateFrom?: Date;
  dateTo?: Date;
  publishedOnly?: boolean;
  favoritesOnly?: boolean;
}

/** Статистика по дашбордам */
export interface DashboardStats {
  total: number;
  published: number;
  drafts: number;
  favorites: number;
  mostViewed?: Dashboard;
  lastCreated?: Dashboard;
}

/** Права доступа */
export interface DashboardPermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canPublish: boolean;
  canShare: boolean;
  canExecute?: boolean;     // право на run SQL
  isOwner?: boolean;
}

/** Статусы workflow */
export type DashboardStatus =
  | 'draft'
  | 'published'
  | 'archived'
  | 'pending_review'
  | 'rejected';

/** Аудит/лог действий */
export interface DashboardAuditLog {
  id: number;
  dashboardId: number;
  userId: number;
  action: string;
  changes: any;
  createdAt: string;
}

/** Внутренние события редактора/канваса */
export interface WidgetUpdateEvent {
  widgetId: string;
  props: Partial<WidgetProps>;
}
export interface LayoutUpdateEvent {
  layout: DashboardLayout[];
}
