import React, { useState, useEffect, useRef, useCallback } from "react";
import "../styles/InfoTextWidget.css";

export type InfoTextStyle = {
  fontSize: number;
  color: string;
  fontWeight: "normal" | "bold";
  textAlign: "left" | "center" | "right";
  fontFamily: string;
  width: number;
  backgroundColor: string;
  borderRadius: number;
  padding: number;
};

export const DEFAULT_STYLE: InfoTextStyle = {
  fontSize: 18,
  color: "#232b3b",
  fontWeight: "normal",
  textAlign: "left",
  fontFamily: "Inter, Arial, sans-serif",
  width: 520,
  backgroundColor: "#ffffff",
  borderRadius: 8,
  padding: 15,
};

function areStylesEqual(a?: Partial<InfoTextStyle>, b?: Partial<InfoTextStyle>) {
  return JSON.stringify(a || {}) === JSON.stringify(b || {});
}

function normalizeColor(hex: string) {
  if (/^#[0-9a-fA-F]{3}$/.test(hex)) {
    // #fff -> #ffffff
    return '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  }
  return hex;
}

type Props = {
  value?: string;
  style?: Partial<InfoTextStyle>;
  onChangeContent?: (content: string) => void;
  onChangeStyle?: (style: InfoTextStyle) => void;
};

const InfoTextWidget: React.FC<Props> = ({
  value = "Ваш текст здесь…",
  style = {},
  onChangeContent,
  onChangeStyle,
}) => {
  const mergedStyle: InfoTextStyle = { ...DEFAULT_STYLE, ...style };
  const [localValue, setLocalValue] = useState(value);
  const [localStyle, setLocalStyle] = useState<InfoTextStyle>(mergedStyle);
  const [isDirty, setIsDirty] = useState(false);

  const prevValue = useRef(value);
  const prevStyle = useRef(style);

  useEffect(() => {
    if (prevValue.current !== value) {
      setLocalValue(value);
      prevValue.current = value;
      setIsDirty(false);
    }
  }, [value]);

  useEffect(() => {
    if (!areStylesEqual(prevStyle.current, style)) {
      setLocalStyle({ ...DEFAULT_STYLE, ...style });
      prevStyle.current = style;
      setIsDirty(false);
    }
  }, [style]);

  const handleReset = useCallback(() => {
    setLocalStyle(DEFAULT_STYLE);
    setIsDirty(true);
  }, []);

  const handleValueChange = useCallback((v: string) => {
    setLocalValue(v);
    setIsDirty(true);
  }, []);

  const handleStyleChange = useCallback((patch: Partial<InfoTextStyle>) => {
    setLocalStyle(prev => {
      const next = { ...prev, ...patch };
      setIsDirty(true);
      return next;
    });
  }, []);

  const handleSave = useCallback(() => {
    if (onChangeContent && localValue !== value) {
      onChangeContent(localValue);
      prevValue.current = localValue;
    }
    // --- ФИКС: передаём полный стиль, а не только патч!
    if (onChangeStyle && !areStylesEqual(localStyle, mergedStyle)) {
      onChangeStyle({ ...localStyle });
      prevStyle.current = { ...localStyle };
    }
    setIsDirty(false);
  }, [localValue, localStyle, onChangeContent, onChangeStyle, value, mergedStyle]);

  const areaStyle: React.CSSProperties = {
    width: "100%",
    minHeight: 70,
    resize: "vertical",
    color: localStyle.color,
    fontWeight: localStyle.fontWeight,
    textAlign: localStyle.textAlign as any,
    fontSize: localStyle.fontSize,
    fontFamily: localStyle.fontFamily,
    backgroundColor: localStyle.backgroundColor,
    borderRadius: localStyle.borderRadius,
    padding: localStyle.padding,
  };

  return (
    <div className="info-text-root" style={{ maxWidth: localStyle.width }}>
      <div className="info-text-toolbar">
        <select value={localStyle.fontFamily} onChange={e => handleStyleChange({ fontFamily: e.target.value })}>
          <option value="Inter, Arial, sans-serif">Inter/Arial</option>
          <option value="Roboto, Arial, sans-serif">Roboto</option>
          <option value="serif">Serif</option>
          <option value="monospace">Mono</option>
        </select>
        <input type="number" min={8} max={60} value={localStyle.fontSize}
          onChange={e => handleStyleChange({ fontSize: Number(e.target.value) })}
          style={{ width: 48 }} title="Размер" />
        <select value={localStyle.fontWeight}
          onChange={e => handleStyleChange({ fontWeight: e.target.value as InfoTextStyle["fontWeight"] })}>
          <option value="normal">Обычный</option>
          <option value="bold">Жирный</option>
        </select>
        <input
          type="color"
          value={normalizeColor(localStyle.color)}
          onChange={e => handleStyleChange({ color: e.target.value })}
          title="Цвет текста"
        />
        <input type="number" min={200} max={800} value={localStyle.width}
          onChange={e => handleStyleChange({ width: Number(e.target.value) })}
          style={{ width: 60 }} title="Ширина px" />
        <input
          type="color"
          value={normalizeColor(localStyle.backgroundColor)}
          onChange={e => handleStyleChange({ backgroundColor: e.target.value })}
          title="Цвет фона"
        />
        <input type="number" min={0} max={32} value={localStyle.borderRadius}
          onChange={e => handleStyleChange({ borderRadius: Number(e.target.value) })}
          style={{ width: 38 }} title="Скругление" />
        <input type="number" min={0} max={32} value={localStyle.padding}
          onChange={e => handleStyleChange({ padding: Number(e.target.value) })}
          style={{ width: 38 }} title="Паддинг" />
        <div style={{ display: "inline-flex", gap: 2 }}>
          <button className={localStyle.textAlign === "left" ? "selected" : ""}
            onClick={() => handleStyleChange({ textAlign: "left" })} type="button">Лево</button>
          <button className={localStyle.textAlign === "center" ? "selected" : ""}
            onClick={() => handleStyleChange({ textAlign: "center" })} type="button">Центр</button>
          <button className={localStyle.textAlign === "right" ? "selected" : ""}
            onClick={() => handleStyleChange({ textAlign: "right" })} type="button">Право</button>
        </div>
        <button className="reset" onClick={handleReset} type="button">Сбросить</button>
        <button
          className="save"
          onClick={handleSave}
          type="button"
          disabled={!isDirty}
          style={{
            marginLeft: 8,
            background: isDirty ? "#94e29b" : "#d4e8d4",
            color: isDirty ? "#155c19" : "#799979",
            border: "1px solid #badebb"
          }}
        >
          Сохранить
        </button>
      </div>
      <textarea
        value={localValue}
        onChange={e => handleValueChange(e.target.value)}
        className="info-text-area"
        style={areaStyle}
      />
    </div>
  );
};

export default InfoTextWidget;
