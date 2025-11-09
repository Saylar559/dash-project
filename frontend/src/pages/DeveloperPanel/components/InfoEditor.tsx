import React, { useState } from "react";
import { marked } from "marked";
import "../styles/InfoEditor.css";

interface InfoEditorProps {
  value: string;
  onChange: (val: string) => void;
  align?: "left" | "center" | "right";
  onChangeAlign?: (align: "left" | "center" | "right") => void;
}

const alignNames = {
  left: "Лево",
  center: "Центр",
  right: "Право"
} as const;

const InfoEditor: React.FC<InfoEditorProps> = ({
  value,
  onChange,
  align = "left",
  onChangeAlign
}) => (
  <div className="widget-info-editor">
    <label className="widget-info-label">Описание/текст (Markdown поддерживается):</label>
    <div className="widget-info-toolbar" style={{marginBottom: 9}}>
      {(["left", "center", "right"] as const).map((dir) => (
        <button
          key={dir}
          className={align === dir ? "selected" : ""}
          type="button"
          style={{ width: 33, marginRight: 5 }}
          onClick={() => onChangeAlign?.(dir)}
        >
          {alignNames[dir]}
        </button>
      ))}
    </div>
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      className="widget-info-textarea"
      rows={5}
      placeholder="Описание, пояснение, инструкции для пользователей…"
      style={{ textAlign: align }}
    />
    <div className="widget-info-hint">
      Используйте <b>Markdown</b> для выделения текста, ссылок, списков, заголовков.
    </div>
    <div className="widget-info-preview-section">
      <div className="widget-info-label" style={{ fontWeight: 700, marginBottom: 2 }}>Превью:</div>
      <div
        className={`widget-info-preview align-${align}`}
        dangerouslySetInnerHTML={{ __html: marked.parse(value || "") }}
        style={{ textAlign: align }}
      />
    </div>
  </div>
);

export default InfoEditor;
