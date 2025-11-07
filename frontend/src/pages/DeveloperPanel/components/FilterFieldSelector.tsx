// frontend/src/pages/DeveloperPanel/components/FilterFieldSelector.tsx
import React from "react";

type Props = {
  allFields: string[];
  selectedFields: string[];
  onChange: (arr: string[]) => void;
  disabled?: boolean;            // опционально блокировать выбор
  className?: string;
};

const FilterFieldSelector: React.FC<Props> = ({
  allFields,
  selectedFields,
  onChange,
  disabled = false,
  className = "",
}) => {
  // Пустой список колонок — показываем подсказку
  if (!Array.isArray(allFields) || allFields.length === 0) {
    return (
      <div className={`dev-card mb-3 ${className}`}>
        <div className="text-slate-400 text-xs">
          Нет доступных колонок. Сначала выполните SQL, чтобы получить список полей.
        </div>
      </div>
    );
  }

  const toggle = (f: string) => {
    if (disabled) return;
    const next = selectedFields.includes(f)
      ? selectedFields.filter(x => x !== f)
      : [...selectedFields, f];
    onChange(next);
  };

  const clearAll = () => {
    if (disabled) return;
    onChange([]);
  };

  return (
    <div className={`dev-card mb-3 ${disabled ? "opacity-60" : ""} ${className}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="font-semibold">Выберите фильтруемые колонки:</div>
        <button
          type="button"
          className="text-xs text-slate-500 hover:text-slate-700 underline disabled:opacity-40"
          onClick={clearAll}
          disabled={disabled || selectedFields.length === 0}
          title="Очистить выбор"
        >
          Очистить
        </button>
      </div>

      <div
        className="flex flex-wrap gap-2"
        // Если вдруг сверху есть overlay, этот стиль поможет
        style={{ pointerEvents: disabled ? "none" : "auto" }}
      >
        {allFields.map((f) => {
          const selected = selectedFields.includes(f);
          return (
            <button
              key={f}
              type="button"
              onClick={() => toggle(f)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggle(f);
                }
              }}
              aria-pressed={selected}
              aria-label={`Поле ${f} ${selected ? "выбрано" : "не выбрано"}`}
              title={selected ? `Убрать ${f} из фильтров` : `Добавить ${f} в фильтры`}
              className={`px-3 py-1 rounded border text-sm transition focus:outline-none focus:ring
                ${selected
                  ? "bg-blue-600 text-white border-blue-700 font-semibold focus:ring-blue-200"
                  : "bg-white text-slate-700 border-slate-300 hover:border-slate-400 focus:ring-slate-200"
                }`}
            >
              {f}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default FilterFieldSelector;