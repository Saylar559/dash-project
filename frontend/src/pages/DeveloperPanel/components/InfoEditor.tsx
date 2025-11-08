import React from "react";
import { marked } from "marked";
import "../styles/InfoEditor.css";

interface InfoEditorProps {
  value: string;
  onChange: (val: string) => void;
}

const InfoEditor: React.FC<InfoEditorProps> = ({ value, onChange }) => (
  <div className="widget-info-editor">
    <label className="widget-info-label">Описание/текст (Markdown поддерживается):</label>
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      className="widget-info-textarea"
      rows={5}
      placeholder="Описание, пояснение, инструкции для пользователей…"
    />
    <div className="widget-info-hint">
      Используйте <b>Markdown</b> для выделения текста, ссылок, списков, заголовков.
    </div>
    <div className="widget-info-preview-section">
      <div className="widget-info-label" style={{fontWeight: 700, marginBottom: 2}}>Превью:</div>
      <div
        className="widget-info-preview"
        dangerouslySetInnerHTML={{ __html: marked.parse(value || "") }}
      />
    </div>
  </div>
);

export default InfoEditor;
