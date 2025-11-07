import React, { useState, useEffect } from "react";
import { executeSQL } from "../services/queryService";
import '../styles/WidgetParameters.css';

function parseParams(sql: string): string[] {
  if (!sql) return [];
  const matches = Array.from(sql.matchAll(/:(\w+)/g));
  return matches.map(m => m[1]);
}

const WidgetParameters: React.FC<{
  sql: string;
  defaultParams?: Record<string, any>;
  onResult?: (result: any) => void;
}> = ({ sql, defaultParams = {}, onResult }) => {
  const paramNames = parseParams(sql);
  const [params, setParams] = useState<Record<string, any>>(defaultParams);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sql || paramNames.length === 0) return;
    setError(null);
    setLoading(true);
    executeSQL(sql, params)
      .then(res => { setResult(res); onResult?.(res); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [sql, JSON.stringify(params)]);

  const handleExecute = () => {
    setLoading(true);
    setError(null);
    executeSQL(sql, params)
      .then(res => { setResult(res); onResult?.(res); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  return (
    <div className="widget-parameters">
      {paramNames.length > 0 ? (
        <form className="widget-parameters__form">
          {paramNames.map(name => (
            <div key={name} className="widget-parameters__field">
              <label className="widget-parameters__label">{name}</label>
              <input
                className="widget-parameters__input"
                type="text"
                value={params[name] ?? ""}
                onChange={e =>
                  setParams(obj => ({ ...obj, [name]: e.target.value }))
                }
                placeholder={`Введите ${name}`}
              />
            </div>
          ))}
        </form>
      ) : (
        <div className="widget-parameters__empty">
          Нет параметров — обычный SELECT без переменных
        </div>
      )}

      <button
        className="widget-parameters__btn widget-parameters__btn--primary"
        type="button"
        disabled={loading}
        onClick={handleExecute}
      >
        {loading ? "Выполнение..." : "▶️ Обновить предпросмотр"}
      </button>

      {error && <div className="widget-parameters__error">{error}</div>}

      {result && result.data && (
        <div className="widget-parameters__table-container">
          <table className="widget-parameters__table">
            <thead>
              <tr>
                {result.columns.map((col: string) => (
                  <th key={col} className="widget-parameters__th">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.data.slice(0, 10).map((row: any, idx: number) => (
                <tr key={idx} className="widget-parameters__tr">
                  {result.columns.map((col: string) => (
                    <td key={col} className="widget-parameters__td">{row[col]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="widget-parameters__footer">
            Показано: {Math.min(result.data.length, 10)} из {result.data.length} строк
          </div>
        </div>
      )}
    </div>
  );
};

export default WidgetParameters;
