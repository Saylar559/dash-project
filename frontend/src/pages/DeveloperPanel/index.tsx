import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Header } from './components/Header';
import Sidebar from './components/Sidebar';
import { Notifications } from './components/Notifications';
import { useDashboardFiles } from './hooks/useDashboardFiles';
import { DashboardWidget, DashboardConfig } from './types';
import WidgetEditor from './components/WidgetEditor';
import ModalConfirm from "./components/ModalConfirm";
import { v4 as uuidv4 } from 'uuid';
import DashboardCanvas from "./components/DashboardCanvas";
import { RefreshCw, Eye, EyeOff, Clock, Save, ZoomIn, ZoomOut } from 'lucide-react';
import { useAutoRefresh } from './hooks/useAutoRefresh';
import './styles/DeveloperPanel.css';

const initialConfig: DashboardConfig = {
  widgets: [],
  layout: [],
  filters: {},
  theme: 'corporate',
};

const DeveloperPanel: React.FC = () => {
  const { user, logout } = useAuth();
  const {
    dashboards,
    loading: dashboardsLoading,
    error: dashboardError,
    fetchDashboards,
    saveDashboard,
    deleteDashboard,
    getDashboard,
  } = useDashboardFiles();

  // State
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig>(initialConfig);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [selectedDashboard, setSelectedDashboard] = useState<any>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingSave, setPendingSave] = useState<{ title: string, description: string } | null>(null);
  const [isPublished, setIsPublished] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(0);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);

  const widgetEditorRef = useRef<HTMLDivElement>(null);

  // Load dashboards on mount
  useEffect(() => {
    fetchDashboards();
  }, [fetchDashboards]);

  // Scroll to widget editor when selected
  useEffect(() => {
    if (selectedWidgetId && widgetEditorRef.current) {
      widgetEditorRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  }, [selectedWidgetId]);

  // Auto-refresh handler
  const handleAutoRefresh = useCallback(async () => {
    if (!isPublished) return;
    
    try {
      // Trigger re-render by updating config
      setDashboardConfig(prev => ({
        ...prev,
        _refreshKey: Math.random(),
      }));
      setLastRefreshTime(new Date());
    } catch (error) {
      console.error('❌ Ошибка обновления:', error);
      throw error;
    }
  }, [isPublished]);

  // Use auto-refresh hook
  const { isRefreshing, refreshNow } = useAutoRefresh({
    enabled: autoRefreshInterval > 0 && isPublished,
    intervalSeconds: autoRefreshInterval,
    onRefresh: handleAutoRefresh,
    onError: (error) => {
      setErrorMessage(`❌ Ошибка автообновления: ${error.message}`);
      setTimeout(() => setErrorMessage(null), 3000);
    },
    immediate: false,
  });

  // Add widget
  const handleAddWidget = useCallback((type: DashboardWidget['type'], props?: any) => {
    const newWidget: DashboardWidget = {
      id: uuidv4(),
      type,
      props: props || {},
    };
    
    setDashboardConfig((prev) => ({
      ...prev,
      widgets: [...prev.widgets, newWidget],
      layout: [
        ...prev.layout,
        {
          widgetId: newWidget.id,
          x: (prev.widgets.length * 6) % 24,
          y: Math.floor((prev.widgets.length * 6) / 24) * 8,
          w: 6,
          h: 8,
        }
      ]
    }));
    
    setSelectedWidgetId(newWidget.id);
    setSuccessMessage(`✅ Виджет "${type}" добавлен`);
    setTimeout(() => setSuccessMessage(null), 2000);
  }, []);

  // Update widget
  const handleUpdateWidget = useCallback((id: string, props: any) => {
    setDashboardConfig((prev) => ({
      ...prev,
      widgets: prev.widgets.map((w) =>
        w.id === id ? { ...w, props } : w
      ),
    }));
    setSuccessMessage('✅ Виджет обновлён');
    setTimeout(() => setSuccessMessage(null), 2000);
  }, []);

  // Remove widget
  const handleRemoveWidget = useCallback((id: string) => {
    setDashboardConfig((prev) => ({
      ...prev,
      widgets: prev.widgets.filter((w) => w.id !== id),
      layout: prev.layout.filter((l) => l.widgetId !== id),
    }));
    setSelectedWidgetId(null);
    setSuccessMessage('✅ Виджет удалён');
    setTimeout(() => setSuccessMessage(null), 2000);
  }, []);

  // Duplicate widget
  const handleDuplicateWidget = useCallback((id: string) => {
    const widget = dashboardConfig.widgets.find(w => w.id === id);
    if (!widget) return;
    
    const newWidget: DashboardWidget = {
      ...widget,
      id: uuidv4(),
      props: { ...widget.props },
    };
    
    const layout = dashboardConfig.layout.find(l => l.widgetId === id);
    const newLayout = layout 
      ? { 
          ...layout, 
          widgetId: newWidget.id, 
          x: (layout.x + layout.w) % 24, 
          y: layout.y 
        }
      : { widgetId: newWidget.id, x: 0, y: 0, w: 6, h: 8 };

    setDashboardConfig((prev) => ({
      ...prev,
      widgets: [...prev.widgets, newWidget],
      layout: [...prev.layout, newLayout],
    }));
    
    setSuccessMessage('✅ Виджет дублирован');
    setTimeout(() => setSuccessMessage(null), 2000);
  }, [dashboardConfig]);

  // Save dashboard (prepare)
  const handleSaveDashboard = useCallback(() => {
    if (!dashboardConfig.widgets.length) {
      setErrorMessage('❌ Дашборд пуст — добавьте хотя бы один виджет');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }
    
    const title = prompt('📝 Название дашборда:');
    if (!title?.trim()) {
      setErrorMessage('❌ Название не указано');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }
    
    const description = prompt('📄 Описание (необязательно):') || 'Создан в конструкторе';
    setPendingSave({ title: title.trim(), description: description.trim() });
    setModalOpen(true);
  }, [dashboardConfig.widgets.length]);

  // Confirm save
  const confirmSaveDashboard = async () => {
    if (!pendingSave) return;
    setIsSaving(true);
    
    try {
      await saveDashboard(pendingSave.title, dashboardConfig);
      setSuccessMessage(`✅ Дашборд "${pendingSave.title}" сохранён!`);
      setTimeout(() => setSuccessMessage(null), 3000);
      await fetchDashboards();
    } catch (err: any) {
      setErrorMessage(`❌ ${err?.message || 'Ошибка сохранения'}`);
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setIsSaving(false);
      setModalOpen(false);
      setPendingSave(null);
    }
  };

  // Select dashboard
  const handleSelectDashboard = useCallback(async (dashboard: any) => {
    setSelectedDashboard(dashboard);
    
    try {
      const full = await getDashboard(dashboard.id);
      const config = full.config || initialConfig;
      
      setDashboardConfig(config);
      setIsPublished(false);
      setSelectedWidgetId(null);
      setAutoRefreshInterval(0);
      
      setSuccessMessage(`📂 Дашборд "${dashboard.title}" открыт`);
      setTimeout(() => setSuccessMessage(null), 2000);
    } catch (err: any) {
      setErrorMessage(`⚠️ ${err?.message || 'Ошибка загрузки'}`);
      setTimeout(() => setErrorMessage(null), 3000);
    }
  }, [getDashboard]);

  // Delete dashboard
  const handleDeleteDashboard = useCallback(async (id: string, title: string) => {
    if (!confirm(`🗑️ Удалить дашборд "${title}"?`)) return;
    
    try {
      await deleteDashboard(id);
      setSuccessMessage(`✅ Дашборд "${title}" удалён`);
      setTimeout(() => setSuccessMessage(null), 2000);
      
      if (selectedDashboard?.id === id) {
        setSelectedDashboard(null);
        setDashboardConfig(initialConfig);
      }
      
      await fetchDashboards();
    } catch (err: any) {
      setErrorMessage(`❌ ${err?.message || 'Ошибка удаления'}`);
      setTimeout(() => setErrorMessage(null), 3000);
    }
  }, [deleteDashboard, fetchDashboards, selectedDashboard]);

  // Clear all
  const handleClearAll = useCallback(() => {
    if (confirm('🗑️ Очистить всё? Все виджеты будут удалены.')) {
      setDashboardConfig(initialConfig);
      setSelectedWidgetId(null);
      setSelectedDashboard(null);
      setIsPublished(false);
      setAutoRefreshInterval(0);
      setSuccessMessage('✅ Рабочая область очищена');
      setTimeout(() => setSuccessMessage(null), 2000);
    }
  }, []);

  // Layout change
  const handleLayoutChange = useCallback((layoutArr: any[]) => {
    setDashboardConfig((prev) => ({
      ...prev,
      layout: layoutArr.map((item: any) => ({
        widgetId: item.i,
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
      }))
    }));
  }, []);

  // Toggle publish mode
  const togglePublishLocal = useCallback(() => {
    setIsPublished((p) => !p);
    setSelectedWidgetId(null);
    if (!isPublished) {
      setAutoRefreshInterval(0);
    }
  }, [isPublished]);

  // Toggle zoom
  const toggleZoom = useCallback(() => {
    setZoomed(!zoomed);
  }, [zoomed]);

  // Manual refresh
  const handleRefreshNow = useCallback(() => {
    refreshNow();
  }, [refreshNow]);

  return (
    <div className={`developer-panel ${zoomed ? 'developer-panel--zoomed' : ''}`}>
      {/* Header */}
      <Header
        username={user?.username || 'Developer'}
        email={user?.email || 'developer@example.com'}
        onNavigateDashboards={() => (window.location.href = '/viewer')}
        onLogout={logout}
      />

      {/* Notifications */}
      <Notifications
        error={errorMessage || dashboardError}
        success={successMessage}
        onClearError={() => setErrorMessage(null)}
        onClearSuccess={() => setSuccessMessage(null)}
      />

      {/* Confirm Modal */}
      <ModalConfirm
        open={modalOpen}
        title="Подтвердить сохранение"
        message={`Сохранить дашборд "${pendingSave?.title}"?`}
        onConfirm={confirmSaveDashboard}
        onCancel={() => { 
          setModalOpen(false); 
          setPendingSave(null); 
        }}
      />

      {/* Main Layout */}
      <div className="developer-panel__layout">
        {/* Sidebar */}
        <Sidebar
          dashboards={dashboards}
          selectedDashboard={selectedDashboard}
          loading={dashboardsLoading}
          widgets={dashboardConfig.widgets}
          onAddWidget={handleAddWidget}
          onSelectDashboard={handleSelectDashboard}
          onDeleteDashboard={handleDeleteDashboard}
          onClear={handleClearAll}
        />

        {/* Main Content */}
        <div className="developer-panel__content">
          {/* Toolbar */}
          <div className="developer-panel__toolbar">
            <div className="developer-panel__toolbar-left">
              <h2 className="developer-panel__title">
                {selectedDashboard 
                  ? `📊 ${selectedDashboard.title}` 
                  : '🎯 Рабочая область'
                }
              </h2>
              <span className="developer-panel__widget-count">
                {dashboardConfig.widgets.length} виджетов
              </span>
            </div>

            <div className="developer-panel__actions">
              {/* Refresh dashboards list */}
              <button
                className="developer-panel__btn developer-panel__btn--icon"
                onClick={() => fetchDashboards()}
                title="Обновить список дашбордов"
                disabled={dashboardsLoading}
              >
                <RefreshCw size={18} />
              </button>

              {/* Zoom toggle */}
              <button
                className="developer-panel__btn developer-panel__btn--icon"
                onClick={toggleZoom}
                title={zoomed ? 'Уменьшить' : 'Увеличить'}
              >
                {zoomed ? <ZoomOut size={18} /> : <ZoomIn size={18} />}
              </button>

              {/* Auto-refresh controls (only in view mode) */}
              {isPublished && (
                <div className="developer-panel__refresh-controls">
                  <button
                    className={`developer-panel__btn developer-panel__btn--icon ${
                      isRefreshing ? 'spinning' : ''
                    }`}
                    onClick={handleRefreshNow}
                    disabled={isRefreshing}
                    title="Обновить данные сейчас"
                  >
                    <RefreshCw size={16} />
                  </button>
                  <select
                    className="developer-panel__select"
                    value={autoRefreshInterval}
                    onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
                    title="Интервал автообновления"
                  >
                    <option value={0}>❌ Нет</option>
                    <option value={5}>⚡ 5 сек</option>
                    <option value={10}>⚡ 10 сек</option>
                    <option value={30}>⏱️ 30 сек</option>
                    <option value={60}>⏰ 1 мин</option>
                  </select>
                  {autoRefreshInterval > 0 && lastRefreshTime && (
                    <span className="developer-panel__last-refresh">
                      <Clock size={12} />
                      {lastRefreshTime.toLocaleTimeString('ru-RU')}
                    </span>
                  )}
                </div>
              )}

              {/* View/Edit toggle */}
              <button
                className={`developer-panel__btn ${
                  isPublished 
                    ? 'developer-panel__btn--secondary' 
                    : 'developer-panel__btn--primary'
                }`}
                onClick={togglePublishLocal}
                title={isPublished ? 'Переключить в режим редактирования' : 'Переключить в режим просмотра'}
              >
                {isPublished ? (
                  <>
                    <Eye size={16} />
                    Просмотр
                  </>
                ) : (
                  <>
                    <EyeOff size={16} />
                    Редактирование
                  </>
                )}
              </button>

              {/* Save button */}
              <button
                className="developer-panel__btn developer-panel__btn--success"
                onClick={handleSaveDashboard}
                disabled={isSaving || dashboardConfig.widgets.length === 0}
                title="Сохранить дашборд"
              >
                <Save size={16} />
                {isSaving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>

          {/* Dashboard Canvas */}
          <DashboardCanvas
            widgets={dashboardConfig.widgets}
            layout={
              dashboardConfig.layout.length
                ? dashboardConfig.layout.map(l => ({ ...l, i: l.widgetId }))
                : dashboardConfig.widgets.map((w, idx) => ({
                    i: w.id,
                    x: (idx * 6) % 24,
                    y: Math.floor((idx * 6) / 24) * 8,
                    w: 6,
                    h: 8
                  }))
            }
            onLayoutChange={handleLayoutChange}
            selectedWidgetId={isPublished ? null : selectedWidgetId}
            onSelectWidget={isPublished ? () => {} : setSelectedWidgetId}
            onEditWidget={!isPublished ? (id) => setSelectedWidgetId(id) : undefined}
            onDuplicateWidget={!isPublished ? handleDuplicateWidget : undefined}
            onRemoveWidget={!isPublished ? handleRemoveWidget : undefined}
            isPublished={isPublished}
            canEdit={!isPublished}
            autoRefreshInterval={autoRefreshInterval}
          />

          {/* Widget Editor */}
          {!isPublished && selectedWidgetId && (
            <div ref={widgetEditorRef}>
              <WidgetEditor
                widget={dashboardConfig.widgets.find(w => w.id === selectedWidgetId)}
                onUpdate={(props) => handleUpdateWidget(selectedWidgetId, props)}
                onRemove={() => handleRemoveWidget(selectedWidgetId)}
                onClose={() => setSelectedWidgetId(null)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeveloperPanel;
