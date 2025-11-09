/* ========================================
   ChartWidget – ДОМ.РФ UI Kit (senior)
   Согласован с ChartConfigPanel & ChartPreview
   ======================================== */

.chart-widget {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: #1a1a1a;
  box-shadow: 0 4px 12px rgba(0,0,0,.08);
  transition: all .2s ease;
  max-width: 100%;
  box-sizing: border-box;
}

/* ----- Тёмная тема ----- */
.chart-widget.chart-dark {
  background: #1e1e1e;
  color: #e0e0e0;
  box-shadow: 0 4px 16px rgba(0,0,0,.3);
}
.chart-widget.chart-dark .chart-widget__label,
.chart-widget.chart-dark .chart-widget__title,
.chart-widget.chart-dark .chart-widget__stats,
.chart-widget.chart-dark .chart-widget__saved-badge,
.chart-widget.chart-dark .chart-widget__empty-text,
.chart-widget.chart-dark .chart-widget__error,
.chart-widget.chart-dark .chart-widget__loading {
  color: #e0e0e0;
}
.chart-widget.chart-dark input,
.chart-widget.chart-dark textarea,
.chart-widget.chart-dark select,
.chart-widget.chart-dark .chart-widget__sql-input,
.chart-widget.chart-dark .chart-widget__select {
  background: #2d2d2d;
  border-color: #444;
  color: #e0e0e0;
}
.chart-widget.chart-dark .chart-widget__sql-input::placeholder,
.chart-widget.chart-dark input::placeholder,
.chart-widget.chart-dark select option {
  color: #888;
}

/* ----- Header ----- */
.chart-widget__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}
.chart-widget__title {
  font-weight: 600;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.chart-widget__saved-badge {
  background: #e6f4ea;
  color: #137333;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 6px;
}
.chart-widget.chart-dark .chart-widget__saved-badge {
  background: #2a4b3a;
  color: #8fd9a8;
}
.chart-widget__stats {
  font-size: 13px;
  color: #76787a;
}

/* ----- Section ----- */
.chart-widget__section {
  margin-bottom: 16px;
}
.chart-widget__label {
  display: block;
  font-weight: 500;
  color: #2d2d2d;
  margin-bottom: 6px;
  font-size: 13.5px;
}
.chart-widget.chart-dark .chart-widget__label { color: #ccc; }

/* ----- SQL textarea ----- */
.chart-widget__sql-input {
  width: 100%;
  min-height: 80px;
  padding: 10px 12px;
  border: 1.5px solid #d0d5dd;
  border-radius: 8px;
  background: #fff;
  font-family: 'Courier New', monospace;
  font-size: 13.5px;
  resize: vertical;
  transition: all .2s ease;
}
.chart-widget__sql-input:focus {
  outline: none;
  border-color: #0052cc;
  box-shadow: 0 0 0 3px rgba(0,82,204,.15);
}
.chart-widget__sql-input::placeholder {
  color: #888;
  font-style: italic;
}

/* ----- Chart type buttons ----- */
.chart-widget__chart-types {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.chart-widget__chart-type-btn {
  padding: 8px 14px;
  border: 1.5px solid #d0d5dd;
  border-radius: 8px;
  background: #f9f9f9;
  color: #2d2d2d;
  font-size: 13.5px;
  font-weight: 500;
  cursor: pointer;
  transition: all .2s ease;
  white-space: nowrap;
}
.chart-widget__chart-type-btn:hover {
  background: #f0f4ff;
  border-color: #0052cc;
}
.chart-widget__chart-type-btn.active {
  background: #0052cc;
  color: #fff;
  border-color: #0052cc;
  font-weight: 600;
}
.chart-widget.chart-dark .chart-widget__chart-type-btn {
  background: #2d2d2d;
  border-color: #444;
  color: #e0e0e0;
}
.chart-widget.chart-dark .chart-widget__chart-type-btn:hover {
  background: #3a3a3a;
  border-color: #4a8eff;
}
.chart-widget.chart-dark .chart-widget__chart-type-btn.active {
  background: #4a8eff;
  border-color: #4a8eff;
}

/* ----- Controls (X/Y/Agg) ----- */
.chart-widget__controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
  margin-bottom: 16px;
}
.chart-widget__control-group {
  display: flex;
  flex-direction: column;
}
.chart-widget__select {
  padding: 8px 12px;
  border: 1.5px solid #d0d5dd;
  border-radius: 8px;
  background: #fff;
  font-size: 14px;
  color: #1a1a1a;
  cursor: pointer;
  transition: all .2s ease;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666' width='16px' height='16px'%3e%3cpath d='M7 10l5 5 5-5z'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-right: 32px;
}
.chart-widget__select:focus {
  outline: none;
  border-color: #0052cc;
  box-shadow: 0 0 0 3px rgba(0,82,204,.15);
}
.chart-widget.chart-dark .chart-widget__select {
  background-color: #2d2d2d;
  border-color: #444;
  color: #e0e0e0;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ccc' width='16px' height='16px'%3e%3cpath d='M7 10l5 5 5-5z'/%3e%3c/svg%3e");
}
.chart-widget.chart-dark .chart-widget__select:focus {
  border-color: #4a8eff;
  box-shadow: 0 0 0 3px rgba(74,142,255,.25);
}

/* ----- Filters toggle ----- */
.chart-widget__filters-toggle {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid #d0d5dd;
  border-radius: 8px;
  background: #f9f9f9;
  color: #2d2d2d;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all .2s ease;
}
.chart-widget__filters-toggle:hover {
  background: #f0f4ff;
  border-color: #0052cc;
}
.chart-widget.chart-dark .chart-widget__filters-toggle {
  background: #2d2d2d;
  border-color: #444;
  color: #e0e0e0;
}
.chart-widget.chart-dark .chart-widget__filters-toggle:hover {
  background: #3a3a3a;
  border-color: #4a8eff;
}
.chart-widget__filters-content {
  margin-top: 12px;
  padding: 12px;
  background: #f8f9fa;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
}
.chart-widget.chart-dark .chart-widget__filters-content {
  background: #2a2a2a;
  border-color: #444;
}

/* ----- Action buttons ----- */
.chart-widget__actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 16px;
}
.chart-widget__btn {
  padding: 8px 16px;
  border: 1.5px solid #d0d5dd;
  border-radius: 8px;
  background: #f9f9f9;
  color: #2d2d2d;
  font-size: 13.5px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all .2s ease;
}
.chart-widget__btn:hover {
  background: #0052cc;
  color: #fff;
  border-color: #0052cc;
}
.chart-widget__btn:disabled {
  opacity: .5;
  cursor: not-allowed;
}
.chart-widget__save-btn {
  background: #0052cc;
  color: #fff;
  border-color: #0052cc;
}
.chart-widget__save-btn:hover {
  background: #003d99;
}
.chart-widget.chart-dark .chart-widget__btn {
  background: #2d2d2d;
  border-color: #444;
  color: #e0e0e0;
}
.chart-widget.chart-dark .chart-widget__btn:hover {
  background: #4a8eff;
  border-color: #4a8eff;
}
.chart-widget.chart-dark .chart-widget__save-btn {
  background: #4a8eff;
  border-color: #4a8eff;
}
.chart-widget.chart-dark .chart-widget__save-btn:hover {
  background: #3578e5;
}

/* ----- Loading ----- */
.chart-widget__loading {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #76787a;
  font-size: 14px;
}
.chart-widget__spinner {
  width: 18px;
  height: 18px;
  border: 2px solid #d0d5dd;
  border-top-color: #0052cc;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.chart-widget.chart-dark .chart-widget__spinner {
  border-color: #444;
  border-top-color: #4a8eff;
}

/* ----- Error ----- */
.chart-widget__error {
  background: #ffebee;
  color: #c62828;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13.5px;
}
.chart-widget.chart-dark .chart-widget__error {
  background: #4b2a2a;
  color: #ff8a80;
}

/* ----- Empty state ----- */
.chart-widget__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 240px;
  color: #76787a;
  text-align: center;
}
.chart-widget__empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}
.chart-widget__empty-text {
  font-size: 15px;
}

/* ----- Chart container ----- */
.chart-widget__chart-container {
  margin-top: 16px;
  min-height: 320px;
}

/* ----- Адаптивность ----- */
@media (max-width: 768px) {
  .chart-widget {
    padding: 16px;
  }
  .chart-widget__header { flex-direction: column; align-items: flex-start; }
  .chart-widget__controls { grid-template-columns: 1fr; }
  .chart-widget__chart-types { justify-content: center; }
  .chart-widget__actions { justify-content: stretch; }
  .chart-widget__actions button { flex: 1; }
}

/* ----- Фокусы (a11y) ----- */
.chart-widget *:focus-visible {
  outline: 2px solid #0052cc;
  outline-offset: 2px;
}
.chart-widget.chart-dark *:focus-visible {
  outline-color: #4a8eff;
}