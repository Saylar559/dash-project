import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat);

// ===== Корпоративный Apple стиль =====
const corporateAppleStyles = `
:root {
  --bg: linear-gradient(120deg,#eef2f9 69%,#dbe6f7 100%);
  --sidebar-bg: radial-gradient(ellipse at top left,#fafdff 73%,#e2eaf3 100%);
  --accent-sapphire: #0071e3;
  --accent-silver: #b8c6db;
  --accent-navy: #33527a;
  --accent-hover: #e3f3fa;
  --input-bg: #f8fafd;
  --input-focus: #b6d6fa;
  --error: #d32f2f;
  --ok: #2067a3;
}
body, #root {
  background: var(--bg); color: #264060; margin: 0; font-family: "Inter","San Francisco","Roboto",Arial,sans-serif;
  font-size: 16px; -webkit-font-smoothing: antialiased;
}
.app {
  display: flex; min-height: 100vh; background: var(--bg);
}
.sidebar {
  width: 350px; min-width: 246px;
  background: var(--sidebar-bg);
  border-right: 1.5px solid #e5e8f3;
  border-radius: 18px 0 0 18px;
  box-shadow: 0 14px 64px -18px #adc6ee9a, 0 2px 12px 0 #7589a726;
  padding: 38px 32px 32px 32px;
  position: sticky; top: 0; height: 100vh; z-index: 4;
  display: flex; flex-direction: column; align-items: flex-start;
}
.sidebar h3 {
  font-weight: 800; font-size: 1.43em; color: #2c3e5b;
  letter-spacing: 0.02em; margin-bottom: 32px;
}
.sidebar .back-btn {
  display: flex; align-items: center; gap: 12px;
  background: linear-gradient(93deg,#e9f3fa 3%,#dde8f1 96%);
  border-radius: 14px; border: none; font-size: 17px; font-weight: 600;
  color: #1d416c; padding: 10px 24px 10px 16px; margin-bottom: 30px;
  box-shadow: 0 4px 26px #c0d5ed1a; cursor: pointer;
  transition: background .19s, box-shadow .17s;
}
.sidebar .back-btn:hover {
  background: linear-gradient(97deg,#ddeaf5 5%,#eff5fa 100%);
  box-shadow: 0 8px 18px #bdd0eb5b;
}
.group { margin-bottom: 36px; width: 100%; }
.label { font-weight: 700; margin-bottom: 13px; color: #33527a; font-size: 1.13em; }
.row { display: flex; gap: 18px; }
.input, .select {
  font-size: 17px; padding: 14px 12px; border: 1.4px solid #c6d2e0;
  border-radius: 13px; background: var(--input-bg); color: #2c435c;
  box-shadow: 0 2px 8px #dbeaf611; font-weight: 400;
  transition: border-color .16s, box-shadow .14s;
}
.input:focus, .select:focus {
  border-color: var(--input-focus); outline: none; box-shadow: 0 0 0 2px #b6d6fa;
}
.checkbox {
  width: 26px; height: 26px; accent-color: var(--accent-sapphire);
  margin-right: 13px; vertical-align: middle;
  box-shadow: 0 1px 5px #a7bcce2b; cursor: pointer;
}
.btn {
  background: linear-gradient(95deg,#0071e3 0%,#33527a 100%);
  color: #fff; border: none; border-radius: 14px; padding: 18px 0; cursor: pointer; font-size: 1.12em;
  font-weight: 600; width: 100%; box-shadow: 0 10px 32px #b6cde84a;
  transition: background .15s, box-shadow .13s; margin-top: 10px;
}
.btn:disabled { filter: grayscale(.32); cursor: not-allowed; opacity: .73; }
.btn:hover { background: linear-gradient(89deg,#219bf7 0%,#b8c6db 70%); }
.content {
  flex: 1; padding: 48px 38px 38px 38px; background: none;
}
.title {
  font-size: 2.7em; font-weight: 800; text-align: center;
  margin: 0 0 .7em; letter-spacing: 0.01em;
  color: #1b2f4b; text-shadow: 0 2px 17px #dbe4fa7a;
}
.subtitle {
  font-size: 1.22em; font-weight: 600; text-align: center; margin: 0 0 1.3em;
  color: #45658e; letter-spacing: .01em;
}
.dropzone {
  border: 2px dashed #0071e3; padding: 22px; text-align: center; background: #fff; border-radius: 16px;
  margin: 22px 0 24px; cursor: pointer; font-size: 1.08em; color: #23415c;
  transition: background .13s, border-color .14s;
  box-shadow: 0 2px 18px #b7c6e344;
}
.dropzone.dragover {
  background: #eafdff; border-color: #097ce9; color: #0071e3;
}
.hidden { display: none; }
.actions { display: flex; gap: 14px; justify-content: flex-end; margin: 18px 0 32px 0; }
.success { color: var(--ok); font-weight: 600; text-align: right; margin-top: 18px; font-size: 1.09em; }
.error { color: var(--error); font-weight: 700; text-align: center; margin-top: 18px; font-size: 1.03em; letter-spacing: 0.003em; }
table {
  width: 100%; border-collapse: collapse; background: #fff; border-radius: 14px; overflow: hidden;
  box-shadow: 0 4px 32px #e6eef933; font-size: 1.01em;
}
th, td { padding: 13px 18px; border-bottom: 1px solid #e3eaf4; font-size: 1em; text-align: left; }
th { background: #f6fafd; font-weight: 700; }
.topbar { display: flex; gap: 18px; justify-content: space-between; align-items: center; margin-bottom: 16px; }
@media (max-width: 700px) {
  .app { flex-direction: column; }
  .sidebar { width: 100%; border-radius: 0 0 20px 20px; min-width: 0; padding: 18px 10px 18px 10px; height: auto; box-shadow: 0 4px 22px #b7c6e336; }
  .content { padding: 16px 6vw 16px 6vw; }
  .title { font-size: 1.28em; }
  .subtitle { font-size: 0.98em; }
}
`;

function formatAmountRub(n) {
  if (typeof n !== 'number' || Number.isNaN(n)) return '';
  return new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) + ' руб.';
}
function toYYYYMM(d) { return dayjs(d).format('YYYY-MM'); }
function parseDate(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number' && Number.isFinite(value)) {
    const base = dayjs('1899-12-30');
    return base.add(value, 'day').toDate();
  }
  if (value instanceof Date && !isNaN(value.getTime())) return value;
  const DATE_FORMATS = [
    'DD.MM.YYYY', 'YYYY-MM-DD', 'MM/DD/YYYY', 'DD-MM-YYYY',
    'YYYY.MM.DD', 'DD MMM YYYY', 'DD MMMM YYYY', 'YYYYMMDD',
  ];
  const s = String(value).trim();
  for (const fmt of DATE_FORMATS) {
    const dt = dayjs(s, fmt, 'ru', true);
    if (dt.isValid()) return dt.toDate();
  }
  return null;
}
function sheetToObjects(sheet, skipHeaderRows = 6) {
  return XLSX.utils.sheet_to_json(sheet, { defval: null, blankrows: false, range: skipHeaderRows });
}
async function processExcelFiles(files, { year, month, filterByPeriod, excludeNegative }) {
  const permitMapping = {
    '91-RU93308000-2132-2022': 'Поступления на счет Эскроу "Горизонт 1"',
    '91-RU93308000-2775-2023': 'Поступления на счет Эскроу "Горизонт 2"',
    '91-RU93308000-3161-2023': 'Поступления на счет Эскроу "Горизонт 3"',
  };
  const results = [];
  const errors = [];
  for (const file of files) {
    const fileName = file.name || 'Файл';
    const fileBase = fileName.replace(/\.(xlsx|xls)$/i, '');
    const defaultTitle = `Поступления на счет Эскроу ${fileBase}`;
    let fileHasData = false;
    try {
      const ab = await file.arrayBuffer();
      const wb = XLSX.read(ab, { type: 'array' });
      const sheetNames = wb.SheetNames || [];
      for (const sName of sheetNames) {
        if (sName && String(sName).toLowerCase().includes('лист')) continue;
        const ws = wb.Sheets[sName];
        if (!ws) continue;
        let rows = sheetToObjects(ws, 6);
        if (!rows || rows.length === 0) continue;
        rows = rows.map((row) => {
          const norm = {};
          for (const k of Object.keys(row)) {
            const key = (k || '').toString().trim();
            norm[key] = row[k];
          }
          if ('Сумма операции' in norm && !('Сумма поступления / списания, руб' in norm)) {
            norm['Сумма поступления / списания, руб'] = norm['Сумма операции'];
          }
          if ('Дата операции' in norm && !('Дата поступления / списания' in norm)) {
            norm['Дата поступления / списания'] = norm['Дата операции'];
          }
          return norm;
        });
        if (!rows.some(r => Object.prototype.hasOwnProperty.call(r, 'Сумма поступления / списания, руб'))) {
          errors.push({
            'Название обьекта': `${defaultTitle} (лист ${sName})`,
            'Причина': 'Отсутствует столбец "Сумма поступления / списания, руб"',
          });
          continue;
        }
        let records = rows.map(r => {
          const raw = r['Сумма поступления / списания, руб'];
          const sum = typeof raw === 'number' ? raw : (raw == null ? NaN : Number(String(raw).replace(/\s/g, '').replace(',', '.')));
          return { ...r, __sum: Number.isFinite(sum) ? sum : NaN };
        }).filter(r => Number.isFinite(r.__sum));
        if (excludeNegative) records = records.filter(r => r.__sum >= 0);
        if (!records.some(r => Object.prototype.hasOwnProperty.call(r, 'Дата поступления / списания'))) {
          errors.push({
            'Название обьекта': `${defaultTitle} (лист ${sName})`,
            'Причина': 'Отсутствует столбец "Дата поступления / списания"',
          });
          continue;
        }
        records = records.map(r => {
          const dateVal = parseDate(r['Дата поступления / списания']);
          return { ...r, __date: dateVal };
        }).filter(r => r.__date instanceof Date && !isNaN(r.__date.getTime()));
        if (records.length === 0) {
          errors.push({
            'Название обьекта': `${defaultTitle} (лист ${sName})`,
            'Причина': 'Не удалось распознать даты в столбце "Дата поступления / списания"',
          });
          continue;
        }
        if (filterByPeriod && year && month) {
          const target = `${year}-${String(month).padStart(2, '0')}`;
          records = records.filter(r => toYYYYMM(r.__date) === target);
        }
        if (records.length === 0) continue;
        fileHasData = true;
        const hasPermit = records.some(r => Object.prototype.hasOwnProperty.call(r, 'Разрешение на строительство'));
        if (hasPermit) {
          const byName = new Map();
          for (const r of records) {
            const permit = r['Разрешение на строительство'];
            const title = permitMapping[permit] || defaultTitle;
            const prev = byName.get(title) || { sum: 0, count: 0 };
            byName.set(title, { sum: prev.sum + r.__sum, count: prev.count + 1 });
          }
          for (const [title, agg] of byName) {
            results.push({ 'Название обьекта': title, 'Сумма': formatAmountRub(agg.sum) });
          }
        } else {
          const total = records.reduce((acc, r) => acc + r.__sum, 0);
          results.push({ 'Название обьекта': defaultTitle, 'Сумма': formatAmountRub(total) });
        }
      }
      if (!fileHasData) {
        results.push({ 'Название обьекта': defaultTitle, 'Сумма': formatAmountRub(0) });
      }
    } catch (e) {
      errors.push({
        'Название обьекта': defaultTitle,
        'Причина': `Ошибка при обработке: ${e?.message || String(e)}`,
      });
    }
  }
  return { results, errors };
}
function exportAsXlsx(jsonRows, filename) {
  const ws = XLSX.utils.json_to_sheet(jsonRows || []);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Лист1');
  XLSX.writeFile(wb, filename);
}

export default function App() {
  const [files, setFiles] = useState([]);
  const [filterByPeriod, setFilterByPeriod] = useState(false);
  const [excludeNegative, setExcludeNegative] = useState(false); // <-- Галочка снята по умолчанию!
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [results, setResults] = useState([]);
  const [errors, setErrors] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = corporateAppleStyles;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  const periodText = useMemo(() => (
    filterByPeriod ? `за ${year}-${String(month).padStart(2, '0')}` : 'за весь период'
  ), [filterByPeriod, year, month]);
  const handleFiles = (list) => {
    const arr = Array.from(list || []).filter(f => /\.(xlsx|xls)$/i.test(f.name));
    if (arr.length) setFiles(arr);
  };
  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer?.files?.length) handleFiles(e.dataTransfer.files);
  };
  const onDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = () => setDragOver(false);

  const run = async () => {
    setProcessing(true);
    setResults([]); setErrors([]);
    try {
      const { results: r, errors: er } = await processExcelFiles(files, {
        year, month, filterByPeriod, excludeNegative
      });
      setResults(r); setErrors(er);
    } finally { setProcessing(false); }
  };

  useEffect(() => { if (files.length) run(); }, [files, filterByPeriod, excludeNegative, year, month]);

  const timestamp = () => {
    const d = new Date();
    const t = d.toISOString().replace(/\D/g, '').slice(0, 14);
    return t + '_' + String(d.getMilliseconds()).padStart(3, '0');
  };
  const resultsFilename = () => {
    const tag = filterByPeriod ? `${year}_${String(month).padStart(2, '0')}` : 'all_period';
    return `excel_results_${tag}_${timestamp()}.xlsx`;
  };
  const errorsFilename = () => {
    const tag = filterByPeriod ? `${year}_${String(month).padStart(2, '0')}` : 'all_period';
    return `errors_${tag}_${timestamp()}.xlsx`;
  };
  const resetAll = () => {
    setFiles([]);
    setFilterByPeriod(false);
    setYear(null);
    setMonth(null);
    setExcludeNegative(false);
    setResults([]); setErrors([]);
  };
  const monthName = (m, y) => {
    try { return new Date(y || new Date().getFullYear(), m - 1, 1).toLocaleString('ru-RU', { month: 'long' }); }
    catch { return String(m); }
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <button className="back-btn" type="button" onClick={() => window.history.back()}>
          <svg height="24" width="24" viewBox="0 0 22 22" style={{ marginRight: 4 }}>
            <path d="M13.6 5.4a1 1 0 1 1 1.4 1.4L10.4 11l4.6 4.2a1 1 0 0 1-1.4 1.4l-5.4-5a1 1 0 0 1 0-1.4l5.4-5z" fill="#223760"/>
          </svg>
          Назад
        </button>
        <h3>Настройки</h3>
        <div className="group">
          <label className="label">
            <input
              type="checkbox"
              className="checkbox"
              checked={filterByPeriod}
              onChange={e => setFilterByPeriod(e.target.checked)}
            /> Фильтровать по году и месяцу
          </label>
          <div className="row">
            <input
              disabled={!filterByPeriod}
              type="number"
              min={2000}
              max={2100}
              value={year ?? new Date().getFullYear()}
              onChange={e => setYear(Number(e.target.value))}
              className="input"
              placeholder="Год"
            />
            <select
              disabled={!filterByPeriod}
              value={month ?? (new Date().getMonth() + 1)}
              onChange={e => setMonth(Number(e.target.value))}
              className="select"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>{monthName(m, year ?? new Date().getFullYear())}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="group">
          <label className="label">
            <input
              type="checkbox"
              className="checkbox"
              checked={excludeNegative}
              onChange={e => setExcludeNegative(e.target.checked)}
            /> Исключать отрицательные суммы
          </label>
        </div>
        <div className="group">
          <button className="btn" onClick={resetAll}>
            Сбросить и загрузить новые файлы
          </button>
        </div>
      </aside>
      <main className="content">
        <h1 className="title">Остатки на счетах ЭСКРОУ</h1>
        <p className="subtitle">Загрузите Excel‑файлы для анализа</p>
        <div
          className={`dropzone ${dragOver ? 'dragover' : ''}`}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          Нажмите и выберите Excel‑файлы
          <input
            ref={fileInputRef}
            className="hidden"
            type="file"
            accept=".xlsx,.xls"
            multiple
            onChange={e => handleFiles(e.target.files)}
          />
        </div>
        <div className="group">
          <input
            className="hidden"
            aria-hidden
            tabIndex={-1}
            type="file"
            accept=".xlsx,.xls"
            multiple
            onChange={() => {}}
          />
        </div>
        <div className="topbar">
          <p className="subtitle" style={{ margin: 0 }}>Результаты анализа ({periodText}, все суммы):</p>
          <div className="actions">
            <button
              className="btn"
              onClick={() => exportAsXlsx(results, resultsFilename())}
              disabled={!results || results.length === 0}
            >СКАЧАТЬ РЕЗУЛЬТАТЫ</button>
            <button
              className="btn"
              onClick={() => exportAsXlsx(errors, errorsFilename())}
              disabled={!errors || errors.length === 0}
            >СКАЧАТЬ ОШИБКИ</button>
          </div>
        </div>
        {processing && <p className="subtitle">Обработка файлов…</p>}
        {results && results.length > 0 ? (
          <div className="group">
            <table>
              <thead>
                <tr>
                  <th>Название обьекта</th>
                  <th>Сумма</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, idx) => (
                  <tr key={idx}>
                    <td>{r['Название обьекта']}</td>
                    <td>{r['Сумма']}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="error">Нет данных для отображения. Загрузите файлы или проверьте настройки.</div>
        )}
        {errors && errors.length > 0 ? (
          <div className="group">
            <div className="error">Ошибки обработки:</div>
            <table>
              <thead>
                <tr>
                  <th>Название обьекта</th>
                  <th>Причина</th>
                </tr>
              </thead>
              <tbody>
                {errors.map((e, idx) => (
                  <tr key={idx}>
                    <td>{e['Название обьекта']}</td>
                    <td>{e['Причина']}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="success">Обработка завершена успешно или данные отсутствуют.</div>
        )}
      </main>
    </div>
  );
}
