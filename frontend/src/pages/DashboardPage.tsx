// src/frontend/pages/DashboardPage.tsx
import React, { useState } from "react";
import DashboardCanvas from "@/components/DashboardCanvas";

export default function DashboardPage() {
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(0);
  const [widgets, setWidgets] = useState([...]);
  const [layout, setLayout] = useState([...]);

  return (
    <div className="dashboard-page">
      {/* Кнопки управления */}
      <div className="dashboard-controls">
        <div className="refresh-buttons">
          <button
            className={autoRefreshInterval === 0 ? "active" : ""}
            onClick={() => setAutoRefreshInterval(0)}
          >
            ❌ Нет обновления
          </button>
          <button
            className={autoRefreshInterval === 5 ? "active" : ""}
            onClick={() => setAutoRefreshInterval(5)}
          >
            ⚡ 5 сек
          </button>
          <button
            className={autoRefreshInterval === 10 ? "active" : ""}
            onClick={() => setAutoRefreshInterval(10)}
          >
            ⚡ 10 сек
          </button>
          <button
            className={autoRefreshInterval === 30 ? "active" : ""}
            onClick={() => setAutoRefreshInterval(30)}
          >
            ⏱️ 30 сек
          </button>
          <button
            className={autoRefreshInterval === 60 ? "active" : ""}
            onClick={() => setAutoRefreshInterval(60)}
          >
            ⏰ 1 мин
          </button>
        </div>
      </div>

      {/* Дашборд с автообновлением */}
      <DashboardCanvas
        widgets={widgets}
        layout={layout}
        onLayoutChange={setLayout}
        selectedWidgetId={null}
        onSelectWidget={() => {}}
        autoRefreshInterval={autoRefreshInterval}
      />
    </div>
  );
}
