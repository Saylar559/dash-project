import React, { useEffect, useState, useMemo } from "react";
import { useDashboardFiles } from "./DeveloperPanel/hooks/useDashboardFiles";
import DashboardPreview from "./DeveloperPanel/components/DashboardPreview";

const PublicDashboardsPage: React.FC = () => {
  const { dashboards, loading, fetchDashboards, getDashboard } = useDashboardFiles();

  const [list, setList] = useState<any[]>([]);
  const [selected, setSelected] = useState<{ id: string, config: any, title: string, desc: string } | null>(null);

  useEffect(() => { fetchDashboards(); }, [fetchDashboards]);
  useEffect(() => {
    setList(Array.isArray(dashboards) ? dashboards : []);
  }, [dashboards]);

  const published = useMemo(() => (
    (list || []).filter(d => d && (d.is_published === true || d.is_published === "true"))
  ), [list]);

  const handleShow = async (d: any) => {
    const detail = await getDashboard(d.id);
    setSelected({
      id: d.id,
      config: detail.config,
      title: typeof d.title === "string" ? d.title : "[Без названия]",
      desc: typeof d.description === "string" ? d.description : ""
    });
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };

  const handleExit = () => setSelected(null);

  const handleLogout = () => { window.location.href = "/login"; };

  return (
    <div className="public-dashboards-page user-style">
      <header className={`public-header${selected ? " public-header-outside" : ""}`}>
        <div className="public-header-row">
          <div>
            <h1>Публичные дашборды</h1>
            <span className="public-subtitle">
              {published.length === 0
                ? "Нет опубликованных дашбордов"
                : `Доступно: ${published.length}`}
            </span>
          </div>
          <button className="public-login-btn" onClick={handleLogout} title="Выйти">
            🚪 Выйти
          </button>
        </div>
        {selected && (
          <button className="public-exit-btn" onClick={handleExit}>
            ⬅️ Вернуться к списку
          </button>
        )}
      </header>

      {!selected && (
        <div className="public-dashboards-list">
          {loading && <div className="public-dashboards-loading">Загрузка...</div>}
          {!loading && published.length === 0 && (
            <div className="public-dashboards-empty">Пока нет опубликованных дашбордов.</div>
          )}
          <div className="public-dashboards-grid">
            {published.map(d => (
              <button
                key={d.id}
                className="public-dashboards-card"
                title={typeof d.title === "string" ? d.title : ""}
                onClick={() => handleShow(d)}
              >
                <div className="public-dashboards-card-content">
                  <span className="public-dashboards-card-icon">📊</span>
                  <div className="public-dashboards-card-title">
                    {typeof d.title === "string" ? d.title : "[Без названия]"}
                  </div>
                  <div className="public-dashboards-card-desc">
                    {d.description || ""}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {selected && (
        <main className="public-dashboards-viewer">
          <section className="public-dashboard-header">
            <div className="public-dashboard-title-row">
              <div className="public-dashboard-title">
                <span className="public-dashboard-icon">📊</span>
                {selected.title}
              </div>
              <button className="public-exit-btn" onClick={handleExit}>Выйти</button>
            </div>
            {selected.desc && (
              <div className="public-dashboard-desc">{selected.desc}</div>
            )}
            <hr className="public-dashboard-hr" />
          </section>
          {/* Важно: config должен содержать все layout props для 1-в-1 совпадения */}
          <DashboardPreview config={selected.config} isPublished canEdit={false} />
        </main>
      )}
    </div>
  );
};

export default PublicDashboardsPage;
