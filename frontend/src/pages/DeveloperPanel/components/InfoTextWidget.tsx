import React, { useState } from "react";

// Тип стилей, которые можно менять
type InfoTextStyle = {
  fontSize: number;
  color: string;
  fontWeight: "normal" | "bold";
  textAlign: "left" | "center" | "right";
  fontFamily: string;
};

const DEFAULT_STYLE: InfoTextStyle = {
  fontSize: 18,
  color: "#232b3b",
  fontWeight: "normal",
  textAlign: "left",
  fontFamily: "Inter, Arial, sans-serif",
};

export const InfoTextWidget = () => {
  const [value, setValue] = useState<string>("Ваш текст здесь…");
  const [style, setStyle] = useState<InfoTextStyle>(DEFAULT_STYLE);

  return (
    <div style={{ maxWidth: 520, margin: "1rem auto" }}>
      {/* Панель инструментов */}
      <div style={{
        display: "flex", gap: 16, marginBottom: 8,
        flexWrap: "wrap", alignItems: "center"
      }}>
        <select
          value={style.fontFamily}
          onChange={e => setStyle(s => ({ ...s, fontFamily: e.target.value }))}
        >
          <option value="Inter, Arial, sans-serif">Inter/Arial</option>
          <option value="Roboto, Arial, sans-serif">Roboto</option>
          <option value="serif">Serif</option>
          <option value="monospace">Mono</option>
        </select>
        <input
          type="number"
          min={8}
          max={60}
          step={1}
          value={style.fontSize}
          onChange={e => setStyle(s => ({ ...s, fontSize: Number(e.target.value) }))}
          style={{ width: 52 }}
          title="Размер"
        />
        <select
          value={style.fontWeight}
          onChange={e => setStyle(s => ({ ...s, fontWeight: e.target.value as InfoTextStyle["fontWeight"] }))}
          style={{ width: 70 }}
        >
          <option value="normal">Обычный</option>
          <option value="bold">Жирный</option>
        </select>
        <input
          type="color"
          value={style.color}
          onChange={e => setStyle(s => ({ ...s, color: e.target.value }))}
          title="Цвет текста"
        />
        <button
          style={{
            fontWeight: style.textAlign === "left" ? 700 : 400,
            fontSize: 16, padding: "2px 8px"
          }}
          onClick={() => setStyle(s => ({ ...s, textAlign: "left" }))}
        >Лево</button>
        <button
          style={{
            fontWeight: style.textAlign === "center" ? 700 : 400,
            fontSize: 16, padding: "2px 8px"
          }}
          onClick={() => setStyle(s => ({ ...s, textAlign: "center" }))}
        >Центр</button>
        <button
          style={{
            fontWeight: style.textAlign === "right" ? 700 : 400,
            fontSize: 16, padding: "2px 8px"
          }}
          onClick={() => setStyle(s => ({ ...s, textAlign: "right" }))}
        >Право</button>
      </div>
      {/* Сам текст инфо-блока */}
      <textarea
        value={value}
        onChange={e => setValue(e.target.value)}
        style={{
          width: "100%",
          minHeight: 70,
          resize: "vertical",
          ...style,
          fontWeight: style.fontWeight,
          textAlign: style.textAlign,
          fontFamily: style.fontFamily,
          color: style.color,
          fontSize: style.fontSize,
          border: "1px solid #e5e9f2",
          borderRadius: 8,
          padding: "12px 15px",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
};
